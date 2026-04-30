// workflow-process-pending: holt sent_emails-Rows mit status='queued',
// rendert Templates und dispatcht via Resend. Aktualisiert die EXISTIERENDE
// Row (sent/failed) statt sie zu löschen — so bleibt der Audit-Trail intakt.

import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createServiceClient } from '../_shared/supabase-client.ts';
import {
  renderEmail, resolveVariables, type Block, type ResolveContext,
} from '../_shared/template-variables.ts';

const BATCH_SIZE = 25;
const RESEND_API = 'https://api.resend.com/emails';
const FROM = 'LiqiNow <info@liqinow.de>';
const ARCHIVE_BCC = 'platformmails@liqinow.de';
const DEFAULT_REPLY_TO = 'info@liqinow.de';

function decodeJwtRole(token: string): string | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return (JSON.parse(json) as { role?: string }).role ?? null;
  } catch { return null; }
}

async function authorize(req: Request): Promise<boolean> {
  const auth = req.headers.get('authorization') || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  if (!token) return false;
  if (decodeJwtRole(token) === 'service_role') return true;
  const sb = createServiceClient();
  const { data: u } = await sb.auth.getUser(token);
  if (!u?.user) return false;
  const { data: row } = await sb.from('users').select('role').eq('id', u.user.id).maybeSingle();
  return row?.role === 'operations';
}

async function loadEntityContext(entityType: string | null, entityId: string | null): Promise<ResolveContext> {
  if (!entityType || !entityId) return {};
  const sb = createServiceClient();

  if (entityType === 'inquiries' || entityType === 'applications') {
    const { data } = await sb.from(entityType)
      .select(entityType === 'applications' ? 'user_id, company_id, inquiry_id' : 'user_id, company_id')
      .eq('id', entityId).maybeSingle();
    if (!data) return {};
    const [userRow, companyRow] = await Promise.all([
      sb.from('users').select('email, first_name, last_name').eq('id', (data as any).user_id).maybeSingle(),
      sb.from('companies').select('name').eq('id', (data as any).company_id).maybeSingle(),
    ]);
    return {
      recipient: {
        email: (userRow.data as any)?.email ?? null,
        first_name: (userRow.data as any)?.first_name ?? null,
        last_name: (userRow.data as any)?.last_name ?? null,
      },
      company: { name: (companyRow.data as any)?.name ?? null },
      entity: { type: entityType, id: entityId, inquiry_id: (data as any).inquiry_id ?? null },
    };
  }

  if (entityType === 'users') {
    const { data } = await sb.from('users')
      .select('email, first_name, last_name').eq('id', entityId).maybeSingle();
    if (!data) return {};
    return {
      recipient: {
        email: (data as any).email,
        first_name: (data as any).first_name,
        last_name: (data as any).last_name,
      },
      entity: { type: 'users', id: entityId },
    };
  }
  return { entity: { type: entityType, id: entityId } };
}

async function loadRoutes(tenantId: string): Promise<Array<{ key: string; url_template: string; entity_type?: string | null }>> {
  const sb = createServiceClient();
  const { data } = await sb.from('template_routes')
    .select('key, url_template, entity_type')
    .eq('tenant_id', tenantId);
  return (data ?? []) as Array<{ key: string; url_template: string; entity_type?: string | null }>;
}

async function dispatchViaResend(opts: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) return { ok: false, error: 'RESEND_API_KEY not configured' };
  try {
    const res = await fetch(RESEND_API, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM,
        to: [opts.to],
        bcc: [ARCHIVE_BCC],
        reply_to: DEFAULT_REPLY_TO,
        subject: opts.subject,
        html: opts.html,
        text: opts.text,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: (data?.message || data?.name || `Resend ${res.status}`) + ` :: ${JSON.stringify(data).slice(0, 300)}` };
    }
    return { ok: true, id: data?.id || '' };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;
  const headers = corsHeaders(req.headers.get('origin'));

  if (req.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405, headers });
  if (!(await authorize(req))) return Response.json({ error: 'Unauthorized' }, { status: 401, headers });

  const sb = createServiceClient();

  const { data: queued, error } = await sb.from('sent_emails')
    .select('id, tenant_id, recipient_email, template_id, template_slug, entity_type, entity_id, trigger_rule_id')
    .eq('status', 'queued')
    .order('sent_at', { ascending: true })
    .limit(BATCH_SIZE);

  if (error) return Response.json({ error: error.message }, { status: 500, headers });
  if (!queued || queued.length === 0) {
    return Response.json({ ok: true, processed: 0 }, { headers });
  }

  // Optimistic claim
  const ids = queued.map((q) => q.id);
  await sb.from('sent_emails').update({ status: 'sending' }).in('id', ids);

  let sent = 0;
  let failed = 0;
  const errors: Array<{ id: string; error: string }> = [];

  for (const row of queued) {
    try {
      const { data: tpl } = await sb.from('email_templates')
        .select('*').eq('id', row.template_id).maybeSingle();
      if (!tpl) {
        await sb.from('sent_emails').update({ status: 'failed', error_message: 'template missing' }).eq('id', row.id);
        failed++; errors.push({ id: row.id, error: 'template missing' });
        continue;
      }

      const ctx = await loadEntityContext(row.entity_type, row.entity_id);
      ctx.routes = await loadRoutes(row.tenant_id);
      const values = resolveVariables(ctx);
      const recipient = ctx.recipient?.email || row.recipient_email;

      const subject = (tpl.subject ?? '').replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (_: string, k: string) => values[k] ?? '');
      const { html, text } = renderEmail({
        blocks: (tpl.blocks ?? []) as Block[],
        type: tpl.type,
        preheader: tpl.preheader,
        values,
      });

      const recipientName = ctx.recipient ? [ctx.recipient.first_name, ctx.recipient.last_name].filter(Boolean).join(' ') || null : null;

      const result = await dispatchViaResend({ to: recipient, subject, html, text });

      if (result.ok) {
        await sb.from('sent_emails').update({
          status: 'sent',
          subject,
          body_html: html,
          body_text: text,
          recipient_email: recipient,
          recipient_name: recipientName,
          resend_id: result.id,
        }).eq('id', row.id);
        sent++;
      } else {
        await sb.from('sent_emails').update({
          status: 'failed',
          subject,
          body_html: html,
          body_text: text,
          recipient_email: recipient,
          recipient_name: recipientName,
          error_message: result.error.slice(0, 1000),
        }).eq('id', row.id);
        failed++; errors.push({ id: row.id, error: result.error });
      }
    } catch (err) {
      const msg = String(err).slice(0, 1000);
      await sb.from('sent_emails').update({ status: 'failed', error_message: msg }).eq('id', row.id);
      failed++; errors.push({ id: row.id, error: msg });
    }
  }

  return Response.json({ ok: true, processed: queued.length, sent, failed, errors }, { headers });
});
