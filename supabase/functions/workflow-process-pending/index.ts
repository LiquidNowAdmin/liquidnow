// workflow-process-pending: holt sent_emails-Rows mit status='queued',
// rendert die Templates mit aufgelösten Variablen und schickt via _shared/email-sender.ts
// (das hängt BCC + Log-Update automatisch dran).
//
// Wird vom Cron-Job alle 2 Minuten gerufen (siehe workflow_time_based_and_triggers.sql).
// Authentifizierung: Service-Role-Token vom Cron — wir prüfen nur dass der Aufrufer
// Service-Role-Permissions hat (sb.auth.getUser sieht das).

import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createServiceClient } from '../_shared/supabase-client.ts';
import {
  renderEmail, resolveVariables, type Block, type ResolveContext,
} from '../_shared/template-variables.ts';
import { sendEmail } from '../_shared/email-sender.ts';

const BATCH_SIZE = 25;

async function authorize(req: Request): Promise<boolean> {
  // Cron sendet das service_role-JWT. Wir akzeptieren wenn der Token gleich
  // dem Service-Role-Key der Function ist. Sonst nur 'authenticated' user
  // mit role=operations (für manuelles Triggern aus Admin).
  const auth = req.headers.get('authorization') || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  if (!token) return false;

  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (token === serviceKey) return true;

  const sb = createServiceClient();
  const { data: u } = await sb.auth.getUser(token);
  if (!u?.user) return false;
  const { data: row } = await sb.from('users').select('role').eq('id', u.user.id).maybeSingle();
  return row?.role === 'operations';
}

async function loadEntityContext(entityType: string | null, entityId: string | null): Promise<ResolveContext> {
  if (!entityType || !entityId) return {};
  const sb = createServiceClient();

  // Resolve recipient + company aus den Hauptentitäten
  if (entityType === 'inquiries' || entityType === 'applications') {
    const { data } = await sb.from(entityType)
      .select('user_id, company_id')
      .eq('id', entityId)
      .maybeSingle();
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
    };
  }

  if (entityType === 'users') {
    const { data } = await sb.from('users')
      .select('email, first_name, last_name')
      .eq('id', entityId)
      .maybeSingle();
    if (!data) return {};
    return {
      recipient: {
        email: (data as any).email,
        first_name: (data as any).first_name,
        last_name: (data as any).last_name,
      },
    };
  }
  return {};
}

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;
  const headers = corsHeaders(req.headers.get('origin'));

  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405, headers });
  }

  if (!(await authorize(req))) {
    return Response.json({ error: 'Unauthorized' }, { status: 401, headers });
  }

  const sb = createServiceClient();

  // Hole bis zu BATCH_SIZE gequeuete Mails. Wir markieren sie sofort als 'sending'
  // damit parallele Cron-Runs sie nicht doppelt versenden.
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

  for (const row of queued) {
    try {
      // Template laden
      const { data: tpl } = await sb.from('email_templates')
        .select('*')
        .eq('id', row.template_id)
        .maybeSingle();
      if (!tpl) {
        await sb.from('sent_emails').update({ status: 'failed', error_message: 'template missing' }).eq('id', row.id);
        failed++; continue;
      }

      // Entity-Context laden
      const ctx = await loadEntityContext(row.entity_type, row.entity_id);
      const values = resolveVariables(ctx);

      const subject = (tpl.subject ?? '').replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (_: string, k: string) => values[k] ?? '');
      const { html, text } = renderEmail({
        blocks: (tpl.blocks ?? []) as Block[],
        type: tpl.type,
        preheader: tpl.preheader,
        values,
      });

      // Recipient: bevorzugt aus Context (frischer), fallback auf gespeicherte recipient_email
      const recipient = ctx.recipient?.email || row.recipient_email;

      // Wir wollen DASS sendEmail() die LOG-Row schreibt — daher löschen wir die alte
      // 'sending'-Zeile UND machen einen frischen Send. Sauberer als Update.
      await sb.from('sent_emails').delete().eq('id', row.id);

      const result = await sendEmail({
        tenant_id: row.tenant_id,
        to: recipient,
        subject,
        html,
        text,
        trigger_kind: 'workflow',
        trigger_rule_id: row.trigger_rule_id,
        template_slug: row.template_slug,
        template_id: row.template_id,
        entity: row.entity_type && row.entity_id ? { type: row.entity_type, id: row.entity_id } : null,
        recipient_name: ctx.recipient ? [ctx.recipient.first_name, ctx.recipient.last_name].filter(Boolean).join(' ') || null : null,
      });

      if (result.ok) sent++; else failed++;
    } catch (err) {
      await sb.from('sent_emails').update({
        status: 'failed',
        error_message: String(err),
      }).eq('id', row.id);
      failed++;
    }
  }

  return Response.json({ ok: true, processed: queued.length, sent, failed }, { headers });
});
