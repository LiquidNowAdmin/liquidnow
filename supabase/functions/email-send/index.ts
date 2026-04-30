// email-send: Test-Send eines Templates via Resend (über zentrale email-sender Utility).
// Auth: operations role. Body: { template_slug, recipient_email, recipient_context? }
//
// Holt das Template, löst Variablen auf, rendert Blocks → HTML, hängt Attachments an,
// schickt via _shared/email-sender.ts (BCC immer auf platformmails@liqinow.de).

import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createServiceClient } from '../_shared/supabase-client.ts';
import { renderEmail, resolveVariables, type Block, type ResolveContext } from '../_shared/template-variables.ts';
import { sendEmail, type EmailAttachment } from '../_shared/email-sender.ts';

async function authorize(req: Request) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  if (!token) return { ok: false as const, status: 401, msg: 'Missing token' };
  const sb = createServiceClient();
  const { data: userData, error } = await sb.auth.getUser(token);
  if (error || !userData.user) return { ok: false as const, status: 401, msg: 'Invalid token' };
  const { data: row } = await sb.from('users').select('role, tenant_id, email, first_name, last_name')
    .eq('id', userData.user.id).maybeSingle();
  if (row?.role !== 'operations') return { ok: false as const, status: 403, msg: 'operations role required' };
  return {
    ok: true as const,
    tenantId: row.tenant_id as string,
    operatorEmail: row.email as string,
    operatorFirstName: row.first_name as string | null,
    operatorLastName: row.last_name as string | null,
  };
}

function bytesToBase64(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
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

  let body: any = {};
  try { body = await req.json(); } catch {}
  const slug = String(body?.template_slug || '').trim();
  const recipientEmail = String(body?.recipient_email || '').trim() || auth.operatorEmail;
  const recipientCtx: ResolveContext = body?.recipient_context ?? {
    recipient: {
      email: recipientEmail,
      first_name: auth.operatorFirstName,
      last_name: auth.operatorLastName,
    },
  };

  if (!slug) return Response.json({ error: 'template_slug required' }, { status: 400, headers });

  const sb = createServiceClient();

  // 1. Load template
  const { data: tpl, error: tplErr } = await sb.from('email_templates')
    .select('*').eq('tenant_id', auth.tenantId).eq('slug', slug).maybeSingle();
  if (tplErr || !tpl) {
    return Response.json({ error: 'Template not found' }, { status: 404, headers });
  }

  // 2. Resolve variables and render
  const values = resolveVariables(recipientCtx);
  const blocks = (tpl.blocks ?? []) as Block[];
  const subject = tpl.subject
    ? tpl.subject.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (_: string, k: string) => values[k] ?? '')
    : '(kein Betreff)';
  const { html, text } = renderEmail({
    blocks,
    type: tpl.type,
    preheader: tpl.preheader,
    values,
  });

  // 3. Resolve attachments
  const attachments: EmailAttachment[] = [];
  for (const att of (tpl.attachments ?? []) as any[]) {
    if (!att?.storage_path) continue;
    try {
      const { data: file } = await sb.storage.from('email-attachments').download(att.storage_path);
      if (file) {
        const buf = new Uint8Array(await file.arrayBuffer());
        attachments.push({
          filename: att.filename || att.storage_path.split('/').pop() || 'attachment',
          content: bytesToBase64(buf),
          content_type: att.mime_type,
        });
      }
    } catch (err) {
      console.warn('attachment download failed:', att.storage_path, err);
    }
  }

  // 4. Send via central wrapper (BCC + sent_emails-Log automatisch)
  const result = await sendEmail({
    tenant_id: auth.tenantId,
    to: recipientEmail,
    subject,
    html,
    text,
    attachments: attachments.length ? attachments : undefined,
    tags: [
      { name: 'template_slug', value: slug },
      { name: 'template_type', value: tpl.type },
      { name: 'send_kind', value: 'test' },
    ],
    trigger_kind: 'test',
    template_slug: slug,
    template_id: tpl.id,
  });

  if (!result.ok) {
    return Response.json({ error: 'Send failed', details: result.error }, { status: 502, headers });
  }
  return Response.json({ ok: true, resend_id: result.id, sent_to: recipientEmail }, { headers });
});
