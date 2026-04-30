// articles-topics-suggest: schlägt 10-15 SEO-Topics für LiqiNow vor.
// Auth: operations role.
// Body: { existing_topics?: Array<{slug,label}>, existing_articles?: Array<{title,category}> }
// Response: { topics: Array<{slug,label,notes,priority,intent,target_count,search_volume_estimate?}> }

import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { createServiceClient } from "../_shared/supabase-client.ts";
import { LIQINOW_ARTICLE_SKILL } from "../_shared/article-skill.ts";

const MODEL = "claude-sonnet-4-6";

const SYSTEM_PROMPT = `Du bist SEO-Stratege für LiqiNow — Working Capital Marktplatz für deutschen Mittelstand.
Schlage SEO-Topics vor, zu denen LiqiNow Ratgeber-Artikel produzieren sollte.

${LIQINOW_ARTICLE_SKILL}

## Aufgabe
Liefere 10-15 Topic-Vorschläge, die:
- thematisch zum Geschäftsmodell passen (Betriebsmittelkredit, Einkaufsfinanzierung, Factoring,
  Revenue-Based Finance, Working Capital, Branchen-Spezifika für KMU)
- realistisch rankbar sind für eine kleine Domain (keine "Kredit"-Volltreffer-Topics, lieber
  Long-Tail wie "Betriebsmittelkredit für Handwerker ohne Schufa")
- ein Topic-Cluster bilden können (Pillar + Subartikel)
- vorhandene Topics NICHT duplizieren

## Pro Topic
- slug: kebab-case (z.B. "betriebsmittelkredit-handwerker")
- label: kurzer Anzeigetext (z.B. "Betriebsmittelkredit für Handwerker")
- notes: 1-2 Sätze, was der Pillar abdecken sollte
- priority: high|medium|low — high für Topics mit klarer Funnel-Relevanz, low für reine Aufklärung
- intent: informational|commercial|transactional — Suchintention
- target_count: 3-8, wie viele Artikel der Cluster fassen sollte
- search_volume_estimate: grobe Schätzung monatl. Suchvolumen in DE (kann auch null sein wenn unklar)

Verwende das Tool submit_topic_suggestions.`;

async function authorize(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (!token) return { ok: false as const, status: 401, msg: "Missing token" };
  const sb = createServiceClient();
  const { data: userData, error } = await sb.auth.getUser(token);
  if (error || !userData.user) return { ok: false as const, status: 401, msg: "Invalid token" };
  const { data: row } = await sb.from("users").select("role").eq("id", userData.user.id).maybeSingle();
  if (row?.role !== "operations") return { ok: false as const, status: 403, msg: "operations role required" };
  return { ok: true as const };
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

  let body: any = {};
  try { body = await req.json(); } catch {}
  const existingTopics: Array<{ slug: string; label: string }> = Array.isArray(body?.existing_topics) ? body.existing_topics : [];
  const existingArticles: Array<{ title: string; category?: string }> = Array.isArray(body?.existing_articles) ? body.existing_articles : [];

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return Response.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500, headers });

  const userPrompt = [
    "Vorhandene Topics (NICHT duplizieren):",
    existingTopics.length ? existingTopics.map((t) => `- ${t.slug}: ${t.label}`).join("\n") : "(keine)",
    "",
    "Vorhandene Artikel (zur Inspiration für Cluster-Lücken):",
    existingArticles.length ? existingArticles.slice(0, 30).map((a) => `- ${a.title}${a.category ? ` [${a.category}]` : ""}`).join("\n") : "(keine)",
    "",
    "Schlage jetzt 10-15 neue Topics vor.",
  ].join("\n");

  let resp: Response;
  try {
    resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4000,
        system: SYSTEM_PROMPT,
        tools: [{
          name: "submit_topic_suggestions",
          description: "Liefere die generierten Topic-Vorschläge.",
          input_schema: {
            type: "object",
            properties: {
              topics: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    slug: { type: "string" },
                    label: { type: "string" },
                    notes: { type: "string" },
                    priority: { type: "string", enum: ["high", "medium", "low"] },
                    intent: { type: "string", enum: ["informational", "commercial", "transactional"] },
                    target_count: { type: "integer" },
                    search_volume_estimate: { type: "integer" },
                  },
                  required: ["slug", "label", "priority", "intent", "target_count"],
                },
              },
            },
            required: ["topics"],
          },
        }],
        tool_choice: { type: "tool", name: "submit_topic_suggestions" },
        messages: [{ role: "user", content: userPrompt }],
      }),
    });
  } catch (err) {
    return Response.json({ error: "Anthropic API unreachable", details: String(err) }, { status: 502, headers });
  }

  if (!resp.ok) {
    const t = await resp.text().catch(() => "");
    return Response.json({ error: `Anthropic error (${resp.status})`, details: t.slice(0, 500) }, { status: 502, headers });
  }

  const data = await resp.json();
  const block = (data?.content || []).find((b: any) => b?.type === "tool_use");
  const topics = block?.input?.topics;
  if (!Array.isArray(topics)) {
    return Response.json({ error: "No topics in response" }, { status: 502, headers });
  }
  // Map search_volume_estimate → search_volume for client convenience
  const normalized = topics.map((t: any) => ({
    slug: t.slug,
    label: t.label,
    notes: t.notes ?? null,
    priority: t.priority ?? "medium",
    intent: t.intent ?? "informational",
    target_count: t.target_count ?? 5,
    search_volume: t.search_volume_estimate ?? null,
  }));
  return Response.json({ topics: normalized }, { headers });
});
