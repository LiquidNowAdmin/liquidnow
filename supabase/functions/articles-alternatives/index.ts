// articles-alternatives: returns 3-5 alternative variants for ONE meta field.
// Auth: operations role. Body: { field, article }.
// field ∈ { title | metaTitle | metaDescription | excerpt | slug | imageAlt
//         | focusKeyword | keywords | image }
// Response: { alternatives: string[] | string[][] }   (string[][] only for `keywords`)

import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { createServiceClient } from "../_shared/supabase-client.ts";
import { SYSTEM_PROMPT_ALTERNATIVES } from "../_shared/article-skill.ts";

const MODEL = "claude-sonnet-4-6";

type Field =
  | "title" | "metaTitle" | "metaDescription" | "excerpt"
  | "slug" | "imageAlt" | "focusKeyword" | "keywords" | "image";

const FIELD_INSTRUCTIONS: Record<Field, string> = {
  title:           "5 alternative Artikel-Titel (max 70 Zeichen). Verschiedene Hooks: Frage, Zahl, Nutzen, Provokation, Definition.",
  metaTitle:       "5 alternative Meta-Titles (max 60 Zeichen, Focus-Keyword vorne). Pure SEO, nicht editorial.",
  metaDescription: "5 alternative Meta-Descriptions (max 155 Zeichen). Call-to-Read, kein 'Jetzt klicken'.",
  excerpt:         "3 alternative Excerpts (1-2 Sätze, max 200 Zeichen). Verschiedene Aufhänger.",
  slug:            "3 alternative Slugs (kebab-case, max 80 Zeichen, nur a-z 0-9 -).",
  imageAlt:        "3 alternative Alt-Texte mit Focus-Keyword. Beschreibend, kein Keyword-Stuffing.",
  focusKeyword:    "5 alternative Focus-Keywords (verschiedene Suchintentionen: informational, transactional, comparison).",
  keywords:        "3 alternative Keyword-Sets (jeweils Array mit 5-10 Keywords). Verschiedene Cluster-Strategien.",
  image:           "3 alternative Bild-URL-Vorschläge (Pexels oder Unsplash, jeweils zum Thema passend).",
};

const FIELDS: Field[] = ["title","metaTitle","metaDescription","excerpt","slug","imageAlt","focusKeyword","keywords","image"];

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
  const field = body?.field as Field | undefined;
  const article = body?.article || {};
  if (!field || !FIELDS.includes(field)) {
    return Response.json({ error: `Invalid field. Must be one of ${FIELDS.join(", ")}` }, { status: 400, headers });
  }

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return Response.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500, headers });

  const isKeywordsArray = field === "keywords";
  const userPrompt = [
    `Feld: ${field}`,
    `Aufgabe: ${FIELD_INSTRUCTIONS[field]}`,
    "",
    "Kontext (existierender Artikel):",
    `- Title: ${article.title || "(noch leer)"}`,
    `- Focus Keyword: ${article.focus_keyword || "(noch leer)"}`,
    `- Excerpt: ${article.excerpt || "(noch leer)"}`,
    article.content ? `- Body (Auszug): ${String(article.content).slice(0, 800)}…` : "",
    "",
    "Gib die Alternativen via Tool submit_alternatives zurück.",
  ].filter(Boolean).join("\n");

  const itemsSchema = isKeywordsArray
    ? { type: "array", items: { type: "array", items: { type: "string" } }, description: "Array von Keyword-Sets" }
    : { type: "array", items: { type: "string" } };

  let resp: Response;
  try {
    resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2000,
        system: SYSTEM_PROMPT_ALTERNATIVES,
        tools: [{
          name: "submit_alternatives",
          description: "Liefere 3-5 Alternativen für das angeforderte Feld.",
          input_schema: {
            type: "object",
            properties: { alternatives: itemsSchema },
            required: ["alternatives"],
          },
        }],
        tool_choice: { type: "tool", name: "submit_alternatives" },
        messages: [{ role: "user", content: userPrompt }],
      }),
    });
  } catch (err) {
    return Response.json({ error: "Anthropic API unreachable", details: String(err) }, { status: 502, headers });
  }

  if (!resp.ok) {
    const errText = await resp.text().catch(() => "");
    return Response.json({ error: `Anthropic API error (${resp.status})`, details: errText.slice(0, 500) }, { status: 502, headers });
  }

  const data = await resp.json();
  const block = (data?.content || []).find((b: any) => b?.type === "tool_use");
  const alternatives = block?.input?.alternatives;
  if (!Array.isArray(alternatives)) {
    return Response.json({ error: "No alternatives in response" }, { status: 502, headers });
  }

  return Response.json({ alternatives }, { headers });
});
