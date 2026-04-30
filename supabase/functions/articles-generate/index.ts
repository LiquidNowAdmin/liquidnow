// articles-generate: streams a full article generation via Anthropic SSE.
// Auth: Supabase JWT (operations role). Body: { topic, focus_keyword?, existing_categories? }.
// Output: SSE stream — Anthropic events pass through 1:1, plus a final
// `event: result` with the parsed { article, category_suggestion } payload.

import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { createServiceClient } from "../_shared/supabase-client.ts";
import { SYSTEM_PROMPT_GENERATE } from "../_shared/article-skill.ts";

const MODEL = "claude-sonnet-4-6";

function slugify(input: string): string {
  return (input || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function authorize(req: Request): Promise<{ ok: true; userId: string } | { ok: false; status: number; msg: string }> {
  const auth = req.headers.get("authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (!token) return { ok: false, status: 401, msg: "Missing token" };
  const sb = createServiceClient();
  const { data: userData, error } = await sb.auth.getUser(token);
  if (error || !userData.user) return { ok: false, status: 401, msg: "Invalid token" };
  const { data: row } = await sb.from("users").select("role").eq("id", userData.user.id).maybeSingle();
  if (row?.role !== "operations") return { ok: false, status: 403, msg: "operations role required" };
  return { ok: true, userId: userData.user.id };
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
  try { body = await req.json(); } catch { /* empty */ }
  const topic = String(body?.topic || "").trim();
  const focusKeyword = String(body?.focus_keyword || "").trim();
  const existingCategories: Array<{ slug: string; name: string }> =
    Array.isArray(body?.existing_categories) ? body.existing_categories : [];

  if (!topic) {
    return Response.json({ error: "topic required" }, { status: 400, headers });
  }

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    return Response.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500, headers });
  }

  const today = new Date().toISOString().slice(0, 10);
  const userPrompt = [
    `Thema: ${topic}`,
    focusKeyword ? `Focus Keyword: ${focusKeyword}` : "",
    `Heutiges Datum: ${today}`,
    "",
    "Vorhandene Kategorien (slug — name):",
    existingCategories.length
      ? existingCategories.map((c) => `- ${c.slug} — ${c.name}`).join("\n")
      : "(keine — schlage eine neue Kategorie vor)",
    "",
    "Schreibe jetzt den vollständigen Artikel und übergib ihn via Tool submit_article.",
  ].filter(Boolean).join("\n");

  let upstream: Response;
  try {
    upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 16000,
        stream: true,
        system: SYSTEM_PROMPT_GENERATE,
        tools: [
          {
            name: "submit_article",
            description: "Übermittle den fertig generierten Artikel als strukturierte Daten.",
            input_schema: {
              type: "object",
              properties: {
                title: { type: "string", description: "max 70 Zeichen" },
                slug: { type: "string", description: "kebab-case, lowercase" },
                excerpt: { type: "string", description: "1-2 Sätze, max 200 Zeichen" },
                content: { type: "string", description: "HTML body ohne <h1>, ohne CTA-Boxen" },
                metaTitle: { type: "string", description: "max 60 Zeichen" },
                metaDescription: { type: "string", description: "max 155 Zeichen" },
                image: { type: "string", description: "Hero/OG-Bild — Pexels/Unsplash URL, oder leer" },
                imageAlt: { type: "string", description: "Alt-Text fürs Hero-Bild mit Focus Keyword" },
                body_images: {
                  type: "array",
                  description: "Genau 3 Bilder zum Einsetzen an [[IMG_1]], [[IMG_2]], [[IMG_3]] im Body. Pexels/Unsplash URLs.",
                  items: {
                    type: "object",
                    properties: {
                      url: { type: "string" },
                      alt: { type: "string", description: "Alt-Text mit thematischem Bezug" },
                      caption: { type: "string", description: "Kurze Bildunterschrift, optional" },
                    },
                    required: ["url", "alt"],
                  },
                },
                focus_keyword: { type: "string" },
                keywords: { type: "array", items: { type: "string" }, description: "5-10 Keywords" },
                category_suggestion: {
                  type: "object",
                  description: "Entweder existierender slug oder neue Kategorie",
                  properties: {
                    slug: { type: "string" },
                    name: { type: "string", description: "Nur bei NEU vorgeschlagener Kategorie" },
                    description: { type: "string", description: "Nur bei NEU vorgeschlagener Kategorie" },
                    is_new: { type: "boolean" },
                  },
                  required: ["slug", "is_new"],
                },
              },
              required: ["title", "slug", "excerpt", "content", "metaTitle", "metaDescription", "focus_keyword", "keywords", "category_suggestion", "body_images"],
            },
          },
        ],
        tool_choice: { type: "tool", name: "submit_article" },
        messages: [{ role: "user", content: userPrompt }],
      }),
    });
  } catch (err) {
    return Response.json({ error: "Anthropic API unreachable", details: String(err) }, { status: 502, headers });
  }

  if (!upstream.ok || !upstream.body) {
    const errText = await upstream.text().catch(() => "");
    return Response.json({ error: `Anthropic API error (${upstream.status})`, details: errText.slice(0, 1000) }, { status: 502, headers });
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const reader = upstream.body.getReader();

  const stream = new ReadableStream({
    async start(controller) {
      let buffer = "";
      let collected = "";
      const ping = setInterval(() => { try { controller.enqueue(encoder.encode(": ping\n\n")); } catch {} }, 15000);

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          controller.enqueue(value);
          buffer += decoder.decode(value, { stream: true });
          let nl;
          while ((nl = buffer.indexOf("\n\n")) !== -1) {
            const event = buffer.slice(0, nl);
            buffer = buffer.slice(nl + 2);
            for (const line of event.split("\n")) {
              if (!line.startsWith("data: ")) continue;
              try {
                const j = JSON.parse(line.slice(6));
                if (j?.type === "content_block_delta" && j?.delta?.type === "input_json_delta" && typeof j?.delta?.partial_json === "string") {
                  collected += j.delta.partial_json;
                }
              } catch {/* skip malformed */}
            }
          }
        }

        try {
          const parsed = JSON.parse(collected);
          if (parsed?.slug) parsed.slug = slugify(parsed.slug);
          const payload = JSON.stringify({ type: "result", article: parsed });
          controller.enqueue(encoder.encode(`event: result\ndata: ${payload}\n\n`));
        } catch (err) {
          const payload = JSON.stringify({ type: "error", error: "Could not parse tool input", raw: collected.slice(0, 1500) });
          controller.enqueue(encoder.encode(`event: error\ndata: ${payload}\n\n`));
        }
      } catch (err) {
        try {
          controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ type: "error", error: String(err) })}\n\n`));
        } catch {}
      } finally {
        clearInterval(ping);
        try { controller.close(); } catch {}
      }
    },
  });

  return new Response(stream, {
    headers: {
      ...headers,
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
});
