// email-generate: streamt eine vollständige E-Mail-Template-Generierung via Anthropic SSE.
// Auth: operations role. Body: { type, intent, cta_label?, cta_url?, audience? }
// Output: SSE — Anthropic-Events 1:1 durch + finaler `event: result` mit dem geparsten Template.

import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createServiceClient } from '../_shared/supabase-client.ts';
import { VARIABLES } from '../_shared/template-variables.ts';

const MODEL = 'claude-sonnet-4-6';

const VARIABLES_LIST = VARIABLES
  .map((v) => `- {{${v.key}}} — ${v.label} (z.B. "${v.example}")`)
  .join('\n');

function buildSystemPrompt(routes: Array<{ key: string; label: string; description: string | null; entity_type: string | null }>): string {
  const routesList = routes.length
    ? routes.map((r) => `- {{link.${r.key}}} — ${r.label}${r.entity_type ? ` (entity-aware: ${r.entity_type})` : ''}${r.description ? ` — ${r.description}` : ''}`).join('\n')
    : '(keine — Routen werden vom Operator gepflegt)';
  return SYSTEM_PROMPT_BASE.replace('{{ROUTES_LIST}}', routesList);
}

const SYSTEM_PROMPT_BASE = `Du bist E-Mail-Texter für LiqiNow — Working Capital Marktplatz für deutschen Mittelstand.
Erstelle ein E-Mail-Template basierend auf der semantischen Beschreibung des Nutzers.

## ROLLE & RECHTLICHER RAHMEN
LiqiNow ist Tippgeber / Affiliate-Partner — KEINE §34c-Vermittlung, KEINE Beratung.

## VERBOTEN
- Konkrete Zinssätze, Konditionen, Bewilligungsquoten
- Garantien jeder Art ("garantiert", "100% sicher")
- Vermittlungs-Wording: "wir vergleichen", "wir prüfen Bonität", "wir vermitteln"
- Beratungs-Wording: "wir empfehlen Ihnen", "unsere Experten beraten Sie"
- Werbung gegen namentlich genannte Wettbewerber

## ERLAUBT / EMPFOHLEN
- Tippgeber-Wording: "wir leiten Sie an passende Anbieter weiter"
- Partner-Banken namentlich nennen (Qred, YouLend, iwoca, …)
- Vorsichtige Formulierungen: "kann", "in der Regel"

## STIL
- Sachlich-respektvoll, kein Du, keine Floskeln
- Klare Struktur: Anrede → Kontext/Mehrwert → Kernaussage → CTA → Abschluss
- Newsletter eher dynamisch und pointiert; Transaktionsmails kurz, sachlich, präzise

## VERFÜGBARE VARIABLEN
Verwende diese Platzhalter im Template wo sinnvoll. Format: {{key}}.
${VARIABLES_LIST}

## VERFÜGBARE LINK-VARIABLEN (für Button-URLs)
{{ROUTES_LIST}}

## REGEL FÜR LINKS / BUTTON-URLs (HART)
- Verwende AUSSCHLIESSLICH {{link.<key>}} oder eine vollständig ausgeschriebene https://-URL.
- NIEMALS Placeholder-Strings wie '<URL>', '<UNKNOWN>', 'URL_HIER', 'TBD' o.ä.
- NIEMALS leere url-Strings im button-Block.
- Wenn der Empfänger ein Operations-User (interne Mail) ist und es um eine Anfrage geht: nutze {{link.admin_inquiry}}
- Wenn der Empfänger ein Kunde ist: nutze {{link.plattform}} oder {{link.wissen}}
- Wenn unsicher: {{link.home}} ist immer gültig.

WICHTIG:
- Nutze IMMER {{recipient.salutation}} oder {{recipient.salutation_informal}} statt eigene Anrede zu schreiben.
- Nutze KEINE Variablen die nicht in den obigen Listen stehen.
- Geschäftsbrief-Footer (Impressum, Adresse, GF, HRB, Marke der DE GmbH) wird AUTOMATISCH angehängt — schreibe ihn NICHT ins Template.

## BLOCK-SCHEMA
Output ist ein Array von Blocks. Verfügbare Block-Typen:
- {type:'heading', level: 1|2, text}
- {type:'paragraph', text}    ← unterstützt {{variable}}
- {type:'button', label, url}
- {type:'divider'}
- {type:'spacer', size:'sm'|'md'|'lg'}
- {type:'image', url, alt, caption?}    ← url muss eine Pexels/Unsplash-URL sein
- {type:'list', ordered:bool, items[]}
- {type:'quote', text, attribution?}

Typische Reihenfolge:
1. heading (level 1) — Subject-Echo oder Hook
2. paragraph — Anrede mit {{recipient.salutation}}
3. paragraph(s) — Kontext + Mehrwert
4. button — CTA (verwende übergebenes cta_label/cta_url)
5. paragraph — kurze Closing-Note

Verwende das Tool submit_email_template.`;

async function authorize(req: Request) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  if (!token) return { ok: false as const, status: 401, msg: 'Missing token' };
  const sb = createServiceClient();
  const { data: userData, error } = await sb.auth.getUser(token);
  if (error || !userData.user) return { ok: false as const, status: 401, msg: 'Invalid token' };
  const { data: row } = await sb.from('users').select('role, tenant_id').eq('id', userData.user.id).maybeSingle();
  if (row?.role !== 'operations') return { ok: false as const, status: 403, msg: 'operations role required' };
  return { ok: true as const, tenantId: row.tenant_id as string };
}

function slugify(s: string): string {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;
  const headers = corsHeaders(req.headers.get('origin'));

  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405, headers });
  }

  const auth = await authorize(req);
  if (!auth.ok) return Response.json({ error: auth.msg }, { status: auth.status, headers });

  const sb = createServiceClient();
  const { data: routes } = await sb.from('template_routes')
    .select('key, label, description, entity_type')
    .eq('tenant_id', auth.tenantId);
  const SYSTEM_PROMPT = buildSystemPrompt((routes ?? []) as never);

  let body: any = {};
  try { body = await req.json(); } catch {}
  const type = String(body?.type || '').trim();
  const intent = String(body?.intent || '').trim();
  const ctaLabel = String(body?.cta_label || '').trim();
  const ctaUrl = String(body?.cta_url || '').trim();
  const audience = String(body?.audience || '').trim();

  if (!intent || !type || (type !== 'newsletter' && type !== 'transactional')) {
    return Response.json({ error: 'type (newsletter|transactional) and intent required' }, { status: 400, headers });
  }

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    return Response.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500, headers });
  }

  const userPrompt = [
    `E-Mail-Typ: ${type}`,
    audience ? `Zielgruppe: ${audience}` : '',
    `Intent: ${intent}`,
    ctaLabel || ctaUrl ? `CTA: ${ctaLabel || '(Label fehlt)'} → ${ctaUrl || '(URL fehlt)'}` : 'Kein expliziter CTA angegeben — schlage einen sinnvollen vor (Label + URL).',
    '',
    'Erstelle jetzt das vollständige E-Mail-Template via Tool submit_email_template.',
  ].filter(Boolean).join('\n');

  let upstream: Response;
  try {
    upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 8000,
        stream: true,
        system: SYSTEM_PROMPT,
        tools: [{
          name: 'submit_email_template',
          description: 'Übermittle das fertig generierte E-Mail-Template.',
          input_schema: {
            type: 'object',
            properties: {
              slug:           { type: 'string', description: 'kebab-case interner Slug' },
              name:           { type: 'string', description: 'Interner sprechender Name (z.B. "Onboarding Welcome v1")' },
              subject:        { type: 'string', description: 'E-Mail-Betreff, max 75 Zeichen, Variablen erlaubt' },
              preheader:      { type: 'string', description: 'Inbox-Vorschautext (40-90 Zeichen)' },
              blocks: {
                type: 'array',
                description: 'Array von Block-Objekten (siehe Schema im System-Prompt)',
                items: {
                  type: 'object',
                  properties: {
                    type:        { type: 'string', enum: ['heading', 'paragraph', 'button', 'divider', 'spacer', 'image', 'list', 'quote'] },
                    level:       { type: 'integer', enum: [1, 2] },
                    text:        { type: 'string' },
                    label:       { type: 'string' },
                    url:         { type: 'string' },
                    size:        { type: 'string', enum: ['sm', 'md', 'lg'] },
                    alt:         { type: 'string' },
                    caption:     { type: 'string' },
                    ordered:     { type: 'boolean' },
                    items:       { type: 'array', items: { type: 'string' } },
                    attribution: { type: 'string' },
                  },
                  required: ['type'],
                },
              },
              variables_used: { type: 'array', items: { type: 'string' }, description: 'Liste der genutzten Variable-Keys' },
              suggested_attachments: {
                type: 'array',
                description: 'Optional: vorgeschlagene Anhänge (Filename + Beschreibung). Werden nicht erzeugt, nur vorgeschlagen.',
                items: {
                  type: 'object',
                  properties: {
                    filename:    { type: 'string' },
                    description: { type: 'string' },
                  },
                },
              },
            },
            required: ['slug', 'name', 'subject', 'preheader', 'blocks', 'variables_used'],
          },
        }],
        tool_choice: { type: 'tool', name: 'submit_email_template' },
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });
  } catch (err) {
    return Response.json({ error: 'Anthropic API unreachable', details: String(err) }, { status: 502, headers });
  }

  if (!upstream.ok || !upstream.body) {
    const errText = await upstream.text().catch(() => '');
    return Response.json({ error: `Anthropic API error (${upstream.status})`, details: errText.slice(0, 1000) }, { status: 502, headers });
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const reader = upstream.body.getReader();

  const stream = new ReadableStream({
    async start(controller) {
      let buffer = '';
      let collected = '';
      const ping = setInterval(() => { try { controller.enqueue(encoder.encode(': ping\n\n')); } catch {} }, 15000);

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          controller.enqueue(value);
          buffer += decoder.decode(value, { stream: true });
          let nl;
          while ((nl = buffer.indexOf('\n\n')) !== -1) {
            const event = buffer.slice(0, nl);
            buffer = buffer.slice(nl + 2);
            for (const line of event.split('\n')) {
              if (!line.startsWith('data: ')) continue;
              try {
                const j = JSON.parse(line.slice(6));
                if (j?.type === 'content_block_delta' && j?.delta?.type === 'input_json_delta' && typeof j?.delta?.partial_json === 'string') {
                  collected += j.delta.partial_json;
                }
              } catch {/* skip */}
            }
          }
        }

        try {
          const parsed = JSON.parse(collected);
          if (parsed?.slug) parsed.slug = slugify(parsed.slug);
          const payload = JSON.stringify({ type: 'result', template: parsed });
          controller.enqueue(encoder.encode(`event: result\ndata: ${payload}\n\n`));
        } catch (err) {
          const payload = JSON.stringify({ type: 'error', error: 'Could not parse tool input', raw: collected.slice(0, 1500) });
          controller.enqueue(encoder.encode(`event: error\ndata: ${payload}\n\n`));
        }
      } catch (err) {
        try {
          controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ type: 'error', error: String(err) })}\n\n`));
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
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
});
