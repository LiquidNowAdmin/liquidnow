// workflow-suggest: KI-Assistent baut aus einer freien Beschreibung
// einen Workflow-Rule-Vorschlag (entity_type, trigger_type, time_config,
// conditions, actions). Der User kann den Vorschlag im RuleBuilder reviewn
// und editieren.
//
// Auth: operations role.
// Body: { description, available_templates: [{slug, name, type}] }
// Response: { rule: {…drafted rule…} }

import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createServiceClient } from '../_shared/supabase-client.ts';

const MODEL = 'claude-sonnet-4-6';

const ENTITY_TYPES = ['inquiries', 'applications', 'users'] as const;

const ENTITY_FIELDS: Record<string, Array<{ name: string; description: string; sample?: string }>> = {
  inquiries: [
    { name: 'status', description: 'Anfrage-Status', sample: 'new, contacted, qualified, lost' },
    { name: 'volume', description: 'Wunsch-Kreditbetrag in EUR' },
    { name: 'term_months', description: 'Wunsch-Laufzeit in Monaten' },
    { name: 'purpose', description: 'Verwendungszweck (free text)' },
    { name: 'company_name', description: 'Firmenname' },
    { name: 'created_at', description: 'Erstellungsdatum' },
    { name: 'status_last_changed_at', description: 'Letzte Status-Änderung' },
  ],
  applications: [
    { name: 'status', description: 'Application-Status', sample: 'new, inquired, signed, closed, rejected' },
    { name: 'provider_name', description: 'Anbieter (Qred, YouLend, …)' },
    { name: 'product_name', description: 'Produkt-Bezeichnung' },
    { name: 'volume', description: 'Beantragter Betrag' },
    { name: 'term_months', description: 'Laufzeit Monate' },
    { name: 'created_at', description: 'Erstellungsdatum' },
    { name: 'status_last_changed_at', description: 'Letzte Status-Änderung' },
  ],
  users: [
    { name: 'email', description: 'Email-Adresse' },
    { name: 'role', description: 'Rolle', sample: 'lead, operations' },
    { name: 'first_name', description: 'Vorname' },
    { name: 'last_name', description: 'Nachname' },
    { name: 'created_at', description: 'Erstellungsdatum' },
  ],
};

const OPERATORS = [
  'equals', 'not_equals', 'contains', 'not_contains', 'is_null', 'is_not_null',
  'greater_than', 'less_than', 'greater_than_or_equal', 'less_than_or_equal',
];

function buildSystemPrompt(templates: Array<{ slug: string; name: string; type: string }>): string {
  const fieldDescriptions = Object.entries(ENTITY_FIELDS).map(([entity, fields]) =>
    `### ${entity}\n` + fields.map((f) => `- ${f.name}: ${f.description}${f.sample ? ` (z.B. ${f.sample})` : ''}`).join('\n')
  ).join('\n\n');

  const templateList = templates.length
    ? templates.map((t) => `- ${t.slug} (${t.type}): ${t.name}`).join('\n')
    : '(keine — ggf. Hinweis im name-Feld dass User erst ein Template anlegen muss)';

  return `Du bist Workflow-Automation-Architekt für LiqiNow (Working Capital Marktplatz für KMU).
Aus einer freien deutschen Beschreibung baust du eine Workflow-Rule.

## VERFÜGBARE ENTITY-TYPES (Trigger-Quellen)
${ENTITY_TYPES.join(', ')}

## VERFÜGBARE FIELDS PRO ENTITY
${fieldDescriptions}

## TRIGGER-TYPES
- record_created — feuert sofort wenn ein neuer Datensatz angelegt wird
- time_based — feuert zeitgesteuert. time_config:
    {type:'days_in_status', status_field:'status', status_value:'<wert>', days:<n>}
    {type:'days_after_field', field:'<datums-feld>', days:<n>}

## CONDITIONS (Filter zusätzlich zum Trigger)
- match_type: 'all' (UND) oder 'any' (ODER)
- conditions: [{field, operator, value}, ...]
- Operators: ${OPERATORS.join(', ')}

## ACTIONS (V1 nur send_email)
{
  action_type: 'send_email',
  config: {
    template_slug: '<existierender slug>',
    recipient_type: 'entity_email' | 'operations_team' | 'custom',
    custom_email: '<adresse>'           // nur bei recipient_type='custom'
    // operations_team = an alle User mit role='operations' im Tenant
    // → für interne Notifications ("neuer Lead", "Status-Eskalation")
  }
}

## VERFÜGBARE EMAIL-TEMPLATES (slugs)
${templateList}

## REGELN
- Wähle das Trigger-Type semantisch sinnvoll: "X angelegt" → record_created;
  "nach X Tagen", "wenn seit X Tagen im Status Y" → time_based.
- Wenn der User keine konkrete Empfänger-Adresse nennt, default recipient_type='entity_email'.
- Wenn KEIN passendes Template existiert, ÜBERNEHME einen sprechenden imaginären Slug (z.B. 'onboarding-welcome'),
  und setze \`needs_template_creation: true\` auf der Action — der User wird im UI darauf hingewiesen.
- name: kurz und sprechend (max 60 Zeichen).
- description: 1 Satz, was die Rule tut.
- Sei vorsichtig mit Conditions — nicht überspezifizieren. Im Zweifel weniger Conditions.

Verwende das Tool submit_rule_draft.`;
}

async function authorize(req: Request) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  if (!token) return { ok: false as const, status: 401, msg: 'Missing token' };
  const sb = createServiceClient();
  const { data: u } = await sb.auth.getUser(token);
  if (!u?.user) return { ok: false as const, status: 401, msg: 'Invalid token' };
  const { data: row } = await sb.from('users').select('role, tenant_id').eq('id', u.user.id).maybeSingle();
  if (row?.role !== 'operations') return { ok: false as const, status: 403, msg: 'operations role required' };
  return { ok: true as const, tenantId: row.tenant_id as string };
}

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;
  const headers = corsHeaders(req.headers.get('origin'));
  if (req.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405, headers });

  const auth = await authorize(req);
  if (!auth.ok) return Response.json({ error: auth.msg }, { status: auth.status, headers });

  let body: any = {};
  try { body = await req.json(); } catch {}
  const description = String(body?.description || '').trim();
  if (!description) return Response.json({ error: 'description required' }, { status: 400, headers });

  const sb = createServiceClient();
  const { data: tplRows } = await sb.from('email_templates')
    .select('slug, name, type')
    .eq('tenant_id', auth.tenantId)
    .order('updated_at', { ascending: false });
  const templates = (tplRows || []) as Array<{ slug: string; name: string; type: string }>;

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) return Response.json({ error: 'ANTHROPIC_API_KEY missing' }, { status: 500, headers });

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2000,
      system: buildSystemPrompt(templates),
      tools: [{
        name: 'submit_rule_draft',
        description: 'Liefere den Workflow-Rule-Entwurf basierend auf der User-Beschreibung.',
        input_schema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Rule-Name (max 60 Zeichen)' },
            description: { type: 'string', description: '1-Satz-Erklärung' },
            entity_type: { type: 'string', enum: [...ENTITY_TYPES] },
            trigger_type: { type: 'string', enum: ['record_created', 'time_based'] },
            time_config: {
              type: 'object',
              description: 'Nur wenn trigger_type=time_based',
              properties: {
                type: { type: 'string', enum: ['days_in_status', 'days_after_field'] },
                status_field: { type: 'string' },
                status_value: { type: 'string' },
                field: { type: 'string' },
                days: { type: 'integer' },
              },
            },
            conditions: {
              type: 'object',
              properties: {
                match_type: { type: 'string', enum: ['all', 'any'] },
                conditions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      field: { type: 'string' },
                      operator: { type: 'string', enum: OPERATORS },
                      value: { type: 'string' },
                    },
                    required: ['field', 'operator'],
                  },
                },
              },
              required: ['match_type', 'conditions'],
            },
            actions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  action_type: { type: 'string', enum: ['send_email'] },
                  config: {
                    type: 'object',
                    properties: {
                      template_slug: { type: 'string' },
                      recipient_type: { type: 'string', enum: ['entity_email', 'operations_team', 'custom'] },
                      custom_email: { type: 'string' },
                      needs_template_creation: { type: 'boolean' },
                    },
                    required: ['template_slug', 'recipient_type'],
                  },
                },
                required: ['action_type', 'config'],
              },
            },
            reasoning: { type: 'string', description: 'Kurze Erklärung deiner Entscheidung' },
          },
          required: ['name', 'description', 'entity_type', 'trigger_type', 'conditions', 'actions'],
        },
      }],
      tool_choice: { type: 'tool', name: 'submit_rule_draft' },
      messages: [{ role: 'user', content: description }],
    }),
  });

  if (!resp.ok) {
    const t = await resp.text().catch(() => '');
    return Response.json({ error: `Anthropic ${resp.status}`, details: t.slice(0, 500) }, { status: 502, headers });
  }
  const data = await resp.json();
  const block = (data?.content || []).find((b: any) => b?.type === 'tool_use');
  const draft = block?.input;
  if (!draft) return Response.json({ error: 'No draft in response' }, { status: 502, headers });

  return Response.json({ rule: draft }, { headers });
});
