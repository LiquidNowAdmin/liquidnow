// articles-admin: full CRUD for articles + categories + topics.
// Auth: Supabase JWT, role = 'operations'.
// Body: { resource, action, data? }
//   resource: 'article' | 'category' | 'topic'
//   action: 'list' | 'get' | 'upsert' | 'publish' | 'unpublish' | 'delete'

import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { createServiceClient } from "../_shared/supabase-client.ts";

function articleToClient(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title ?? "",
    excerpt: row.excerpt ?? "",
    content: row.content ?? "",
    image: row.image ?? "",
    imageAlt: row.image_alt ?? "",
    metaTitle: row.meta_title ?? "",
    metaDescription: row.meta_description ?? "",
    focus_keyword: row.focus_keyword ?? "",
    keywords: row.keywords ?? [],
    body_images: row.body_images ?? [],
    category_id: row.category_id ?? null,
    topic_id: row.topic_id ?? null,
    published_at: row.published_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function articleFromClient(d: any) {
  const row: Record<string, any> = {};
  if (d.slug !== undefined) row.slug = d.slug;
  if (d.title !== undefined) row.title = d.title;
  if (d.excerpt !== undefined) row.excerpt = d.excerpt;
  if (d.content !== undefined) row.content = d.content;
  if (d.image !== undefined) row.image = d.image;
  if (d.imageAlt !== undefined) row.image_alt = d.imageAlt;
  if (d.metaTitle !== undefined) row.meta_title = d.metaTitle;
  if (d.metaDescription !== undefined) row.meta_description = d.metaDescription;
  if (d.focus_keyword !== undefined) row.focus_keyword = d.focus_keyword;
  if (d.keywords !== undefined) row.keywords = Array.isArray(d.keywords) ? d.keywords : [];
  if (d.body_images !== undefined) row.body_images = Array.isArray(d.body_images) ? d.body_images : [];
  if (d.category_id !== undefined) row.category_id = d.category_id;
  if (d.topic_id !== undefined) row.topic_id = d.topic_id;
  return row;
}

// ============================================
// External notifications on publish/unpublish
// ============================================
const SITE_URL = Deno.env.get("SITE_URL") || "https://liqinow.de";

async function notifyGithubDeploy(eventType: "article_publish" | "article_unpublish", slug: string): Promise<void> {
  const pat = Deno.env.get("GH_PAT_DEPLOY");
  const owner = Deno.env.get("GH_OWNER");
  const repo = Deno.env.get("GH_REPO");
  if (!pat || !owner || !repo) {
    console.log("notifyGithubDeploy: missing GH_PAT_DEPLOY/GH_OWNER/GH_REPO — skip");
    return;
  }
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/dispatches`, {
      method: "POST",
      headers: {
        "authorization": `Bearer ${pat}`,
        "accept": "application/vnd.github+json",
        "content-type": "application/json",
        "user-agent": "liqinow-articles-admin",
      },
      body: JSON.stringify({
        event_type: eventType,
        client_payload: { slug, ts: new Date().toISOString() },
      }),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      console.error(`notifyGithubDeploy failed: ${res.status} ${t.slice(0, 200)}`);
    }
  } catch (err) {
    console.error("notifyGithubDeploy error:", err);
  }
}

async function pingIndexNow(slugs: string[]): Promise<void> {
  const key = Deno.env.get("INDEXNOW_KEY");
  const host = Deno.env.get("INDEXNOW_HOST");
  if (!key || !host || slugs.length === 0) return;
  const urlList = slugs.map((s) => `${SITE_URL}/ratgeber/${s}/`);
  try {
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "content-type": "application/json", "user-agent": "liqinow-articles-admin" },
      body: JSON.stringify({
        host,
        key,
        keyLocation: `${SITE_URL}/${key}.txt`,
        urlList,
      }),
    });
    if (!res.ok && res.status !== 202) {
      const t = await res.text().catch(() => "");
      console.error(`pingIndexNow failed: ${res.status} ${t.slice(0, 200)}`);
    }
  } catch (err) {
    console.error("pingIndexNow error:", err);
  }
}

async function authorize(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (!token) return { ok: false as const, status: 401, msg: "Missing token" };
  const sb = createServiceClient();
  const { data: userData, error } = await sb.auth.getUser(token);
  if (error || !userData.user) return { ok: false as const, status: 401, msg: "Invalid token" };
  const { data: row } = await sb.from("users")
    .select("role, tenant_id").eq("id", userData.user.id).maybeSingle();
  if (row?.role !== "operations") return { ok: false as const, status: 403, msg: "operations role required" };
  return { ok: true as const, tenantId: row.tenant_id as string };
}

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;
  const headers = corsHeaders(req.headers.get("origin"));

  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405, headers });
  }

  const auth = await authorize(req);
  if (!auth.ok) return Response.json({ error: auth.msg }, { status: auth.status, headers });
  const TENANT_ID = auth.tenantId;

  let body: any = {};
  try { body = await req.json(); } catch {}
  const resource = body?.resource as "article" | "category";
  const action   = body?.action;
  const data     = body?.data || {};
  const sb = createServiceClient();

  try {
    // -------------------- CATEGORIES --------------------
    if (resource === "category") {
      if (action === "list") {
        const { data: rows, error } = await sb.from("article_categories")
          .select("id, slug, name, description, created_at, updated_at")
          .eq("tenant_id", TENANT_ID)
          .order("name", { ascending: true });
        if (error) throw error;
        return Response.json({ categories: rows || [] }, { headers });
      }
      if (action === "upsert") {
        if (!data.slug || !data.name) {
          return Response.json({ error: "slug and name required" }, { status: 400, headers });
        }
        const row = {
          tenant_id: TENANT_ID,
          slug: data.slug,
          name: data.name,
          description: data.description ?? null,
        };
        const { data: out, error } = await sb.from("article_categories")
          .upsert(row, { onConflict: "tenant_id,slug" })
          .select("*").maybeSingle();
        if (error) throw error;
        return Response.json({ category: out }, { headers });
      }
      if (action === "delete") {
        if (!data.id) return Response.json({ error: "id required" }, { status: 400, headers });
        const { error } = await sb.from("article_categories")
          .delete().eq("id", data.id).eq("tenant_id", TENANT_ID);
        if (error) throw error;
        return Response.json({ ok: true }, { headers });
      }
      return Response.json({ error: `Unknown category action: ${action}` }, { status: 400, headers });
    }

    // -------------------- TOPICS --------------------
    if (resource === "topic") {
      if (action === "list") {
        // Return topics + article_count via correlated count
        const { data: topics, error } = await sb.from("article_topics")
          .select("id, slug, label, notes, search_volume, priority, intent, target_count, created_at, updated_at")
          .eq("tenant_id", TENANT_ID);
        if (error) throw error;

        // Count articles per topic in one query
        const { data: counts } = await sb.from("articles")
          .select("topic_id")
          .eq("tenant_id", TENANT_ID)
          .not("topic_id", "is", null);
        const countMap = new Map<string, number>();
        for (const r of (counts || [])) {
          const id = (r as any).topic_id as string;
          countMap.set(id, (countMap.get(id) || 0) + 1);
        }

        const enriched = (topics || []).map((t: any) => ({
          ...t,
          article_count: countMap.get(t.id) || 0,
        }));

        // Sort: priority desc (high>medium>low), intent desc (transact>commerc>info), volume desc
        const PRIO = { high: 3, medium: 2, low: 1 } as Record<string, number>;
        const INTENT = { transactional: 3, commercial: 2, informational: 1 } as Record<string, number>;
        enriched.sort((a, b) => {
          const p = (PRIO[b.priority] || 0) - (PRIO[a.priority] || 0);
          if (p !== 0) return p;
          const i = (INTENT[b.intent] || 0) - (INTENT[a.intent] || 0);
          if (i !== 0) return i;
          return (b.search_volume || 0) - (a.search_volume || 0);
        });

        return Response.json({ topics: enriched }, { headers });
      }
      if (action === "upsert") {
        if (!data.slug || !data.label) {
          return Response.json({ error: "slug and label required" }, { status: 400, headers });
        }
        const row: Record<string, unknown> = {
          tenant_id: TENANT_ID,
          slug: data.slug,
          label: data.label,
          notes: data.notes ?? null,
          search_volume: data.search_volume ?? null,
          priority: data.priority ?? "medium",
          intent: data.intent ?? "informational",
          target_count: data.target_count ?? 5,
        };
        if (data.id) row.id = data.id;
        const { data: out, error } = await sb.from("article_topics")
          .upsert(row, { onConflict: "tenant_id,slug" })
          .select("*").maybeSingle();
        if (error) throw error;
        return Response.json({ topic: out }, { headers });
      }
      if (action === "bulk_insert") {
        // Bulk-Insert für KI-Vorschläge
        if (!Array.isArray(data.topics) || data.topics.length === 0) {
          return Response.json({ error: "topics array required" }, { status: 400, headers });
        }
        const rows = data.topics.map((t: any) => ({
          tenant_id: TENANT_ID,
          slug: t.slug,
          label: t.label,
          notes: t.notes ?? null,
          search_volume: t.search_volume ?? null,
          priority: t.priority ?? "medium",
          intent: t.intent ?? "informational",
          target_count: t.target_count ?? 5,
        }));
        const { data: out, error } = await sb.from("article_topics")
          .upsert(rows, { onConflict: "tenant_id,slug", ignoreDuplicates: true })
          .select("*");
        if (error) throw error;
        return Response.json({ topics: out || [] }, { headers });
      }
      if (action === "delete") {
        if (!data.id) return Response.json({ error: "id required" }, { status: 400, headers });
        const { error } = await sb.from("article_topics")
          .delete().eq("id", data.id).eq("tenant_id", TENANT_ID);
        if (error) throw error;
        return Response.json({ ok: true }, { headers });
      }
      return Response.json({ error: `Unknown topic action: ${action}` }, { status: 400, headers });
    }

    // -------------------- ARTICLES --------------------
    if (resource === "article") {
      if (action === "stats") {
        const { data, error } = await sb.rpc("admin_article_stats");
        if (error) throw error;
        return Response.json({ stats: data || [] }, { headers });
      }
      if (action === "list") {
        const { data: rows, error } = await sb.from("articles")
          .select("id, slug, title, category_id, topic_id, published_at, updated_at, created_at")
          .eq("tenant_id", TENANT_ID)
          .order("updated_at", { ascending: false });
        if (error) throw error;
        return Response.json({ articles: rows || [] }, { headers });
      }
      if (action === "get") {
        if (!data.slug) return Response.json({ error: "slug required" }, { status: 400, headers });
        const { data: row, error } = await sb.from("articles")
          .select("*").eq("tenant_id", TENANT_ID).eq("slug", data.slug).maybeSingle();
        if (error) throw error;
        return Response.json({ article: articleToClient(row) }, { headers });
      }
      if (action === "upsert") {
        if (!data.slug || !data.title || !data.category_id) {
          return Response.json({ error: "slug, title, category_id required" }, { status: 400, headers });
        }
        const row = { ...articleFromClient(data), tenant_id: TENANT_ID };
        const { data: out, error } = await sb.from("articles")
          .upsert(row, { onConflict: "tenant_id,slug" })
          .select("*").maybeSingle();
        if (error) throw error;
        return Response.json({ article: articleToClient(out) }, { headers });
      }
      if (action === "publish") {
        if (!data.slug) return Response.json({ error: "slug required" }, { status: 400, headers });
        const { data: existing } = await sb.from("articles")
          .select("id, published_at").eq("tenant_id", TENANT_ID).eq("slug", data.slug).maybeSingle();
        if (!existing) return Response.json({ error: "Not found" }, { status: 404, headers });
        if (existing.published_at) {
          const { data: row } = await sb.from("articles").select("*").eq("id", existing.id).maybeSingle();
          return Response.json({ article: articleToClient(row) }, { headers });
        }
        const { data: out, error } = await sb.from("articles")
          .update({ published_at: new Date().toISOString() })
          .eq("id", existing.id).select("*").maybeSingle();
        if (error) throw error;
        // Fire deploy + IndexNow in background (non-blocking, errors don't fail the publish)
        Promise.allSettled([
          notifyGithubDeploy("article_publish", data.slug),
          pingIndexNow([data.slug]),
        ]).catch(() => {});
        return Response.json({ article: articleToClient(out) }, { headers });
      }
      if (action === "unpublish") {
        if (!data.slug) return Response.json({ error: "slug required" }, { status: 400, headers });
        const { data: out, error } = await sb.from("articles")
          .update({ published_at: null })
          .eq("tenant_id", TENANT_ID).eq("slug", data.slug)
          .select("*").maybeSingle();
        if (error) throw error;
        // Trigger rebuild so the article gets removed from public sitemap + 404'd
        Promise.allSettled([notifyGithubDeploy("article_unpublish", data.slug)]).catch(() => {});
        return Response.json({ article: articleToClient(out) }, { headers });
      }
      if (action === "delete") {
        if (!data.slug) return Response.json({ error: "slug required" }, { status: 400, headers });
        const { error } = await sb.from("articles").delete()
          .eq("tenant_id", TENANT_ID).eq("slug", data.slug);
        if (error) throw error;
        Promise.allSettled([notifyGithubDeploy("article_unpublish", data.slug)]).catch(() => {});
        return Response.json({ ok: true }, { headers });
      }
      return Response.json({ error: `Unknown article action: ${action}` }, { status: 400, headers });
    }

    return Response.json({ error: `Unknown resource: ${resource}` }, { status: 400, headers });
  } catch (err: any) {
    console.error("articles-admin error:", err);
    return Response.json({ error: "DB error", details: err?.message || String(err) }, { status: 500, headers });
  }
});
