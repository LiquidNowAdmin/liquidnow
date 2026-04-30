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
  const { data: row } = await sb.from('users').select('id, role, tenant_id, email, first_name, last_name')
    .eq('id', userData.user.id).maybeSingle();
  if (row?.role !== 'operations') return { ok: false as const, status: 403, msg: 'operations role required' };
  return {
    ok: true as const,
    userId: row.id as string,
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
  const triggerKind = (body?.trigger_kind || 'test') as 'test' | 'manual' | 'transactional';
  const entity = body?.entity as { type: string; id: string } | undefined;
  const freetext = body?.freetext as { subject: string; body_text: string; type?: 'newsletter' | 'transactional' } | undefined;

  if (!slug && !freetext) {
    return Response.json({ error: 'template_slug oder freetext erforderlich' }, { status: 400, headers });
  }
  if (freetext && (!freetext.subject || !freetext.body_text)) {
    return Response.json({ error: 'freetext braucht subject + body_text' }, { status: 400, headers });
  }

  const sb = createServiceClient();

  // Recipient-Context bestimmen:
  //   - Wenn entity gegeben: Lead-Daten aus DB laden
  //   - Sonst: Test-Send an Operator (default)
  let recipientEmail: string;
  let recipientCtx: ResolveContext;
  let entityInquiryId: string | null = null;

  if (entity?.type && entity?.id) {
    if (entity.type === 'inquiries' || entity.type === 'applications') {
      const cols = entity.type === 'applications' ? 'user_id, company_id, inquiry_id' : 'user_id, company_id';
      const { data: row } = await sb.from(entity.type).select(cols).eq('id', entity.id).maybeSingle();
      if (!row) return Response.json({ error: 'Entity nicht gefunden' }, { status: 404, headers });
      entityInquiryId = (row as { inquiry_id?: string | null }).inquiry_id ?? null;
      const [{ data: u }, { data: c }] = await Promise.all([
        sb.from('users').select('email, first_name, last_name').eq('id', (row as { user_id: string }).user_id).maybeSingle(),
        sb.from('companies').select('name').eq('id', (row as { company_id: string }).company_id).maybeSingle(),
      ]);
      recipientEmail = String(body?.recipient_email || '').trim() || (u as { email?: string } | null)?.email || '';
      recipientCtx = {
        recipient: {
          email: recipientEmail,
          first_name: (u as { first_name?: string | null } | null)?.first_name ?? null,
          last_name: (u as { last_name?: string | null } | null)?.last_name ?? null,
        },
        company: { name: (c as { name?: string | null } | null)?.name ?? null },
        entity: { type: entity.type, id: entity.id, inquiry_id: entityInquiryId },
      };
    } else if (entity.type === 'users') {
      const { data: u } = await sb.from('users')
        .select('email, first_name, last_name').eq('id', entity.id).maybeSingle();
      recipientEmail = String(body?.recipient_email || '').trim() || (u as { email?: string } | null)?.email || '';
      recipientCtx = {
        recipient: {
          email: recipientEmail,
          first_name: (u as { first_name?: string | null } | null)?.first_name ?? null,
          last_name: (u as { last_name?: string | null } | null)?.last_name ?? null,
        },
        entity: { type: 'users', id: entity.id },
      };
    } else {
      recipientEmail = String(body?.recipient_email || '').trim() || auth.operatorEmail;
      recipientCtx = body?.recipient_context ?? { recipient: { email: recipientEmail } };
    }
  } else {
    recipientEmail = String(body?.recipient_email || '').trim() || auth.operatorEmail;
    recipientCtx = body?.recipient_context ?? {
      recipient: {
        email: recipientEmail,
        first_name: auth.operatorFirstName,
        last_name: auth.operatorLastName,
      },
    };
  }

  if (!recipientEmail) {
    return Response.json({ error: 'Kein Empfänger ermittelbar' }, { status: 400, headers });
  }

  // 1. Load template (nur wenn nicht Freitext)
  let tpl: { id: string; type: 'newsletter'|'transactional'; subject: string; preheader: string; blocks: Block[]; attachments: any[] } | null = null;
  if (slug) {
    const { data, error: tplErr } = await sb.from('email_templates')
      .select('*').eq('tenant_id', auth.tenantId).eq('slug', slug).maybeSingle();
    if (tplErr || !data) return Response.json({ error: 'Template not found' }, { status: 404, headers });
    tpl = data as never;
  }

  // 2. Routen laden und in Context geben — damit {{link.*}} resolved
  const { data: routes } = await sb.from('template_routes')
    .select('key, url_template, entity_type')
    .eq('tenant_id', auth.tenantId);
  recipientCtx.routes = (routes ?? []) as never;

  // 3. Resolve variables and render — Template oder Freitext
  const values = resolveVariables(recipientCtx);
  let subject: string;
  let html: string;
  let text: string;
  let renderType: 'newsletter' | 'transactional';

  if (tpl) {
    const blocks = (tpl.blocks ?? []) as Block[];
    subject = tpl.subject
      ? tpl.subject.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (_: string, k: string) => values[k] ?? '')
      : '(kein Betreff)';
    renderType = tpl.type;
    const rendered = renderEmail({ blocks, type: renderType, preheader: tpl.preheader, values });
    html = rendered.html;
    text = rendered.text;
  } else if (freetext) {
    // Freitext → in Paragraph-Blocks splitten (eine Zeile pro Block, Leerzeilen ignoriert)
    const paragraphs = freetext.body_text
      .split(/\n{2,}/)              // doppelte Newlines = neuer Paragraph
      .map((p) => p.trim())
      .filter(Boolean);
    const blocks: Block[] = paragraphs.map((p) => ({ type: 'paragraph', text: p }));
    subject = freetext.subject.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (_: string, k: string) => values[k] ?? '');
    renderType = freetext.type ?? 'transactional';
    const rendered = renderEmail({ blocks, type: renderType, values });
    html = rendered.html;
    text = rendered.text;
  } else {
    return Response.json({ error: 'Weder Template noch Freitext' }, { status: 400, headers });
  }

  // 4. Resolve attachments — Template-Anhänge + zusätzliche Body-Anhänge
  // (für Freitext oder On-Top auf Template). Body-Format:
  //   attachments: [{ storage_path, filename?, mime_type? }, ...]
  const attachmentSources: Array<{ storage_path: string; filename?: string; mime_type?: string }> = [];
  for (const att of ((tpl?.attachments ?? []) as any[])) {
    if (att?.storage_path) attachmentSources.push(att);
  }
  if (Array.isArray(body?.attachments)) {
    for (const att of body.attachments) {
      if (att?.storage_path) attachmentSources.push(att);
    }
  }

  const attachments: EmailAttachment[] = [];
  for (const att of attachmentSources) {
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
      { name: 'template_slug', value: slug || 'freetext' },
      { name: 'template_type', value: renderType },
      { name: 'send_kind', value: triggerKind },
    ],
    trigger_kind: triggerKind,
    template_slug: slug || null,
    template_id: tpl?.id ?? null,
    entity: entity?.type && entity?.id ? { type: entity.type, id: entity.id } : null,
    sent_by: auth.userId,
  });

  if (!result.ok) {
    return Response.json({ error: 'Send failed', details: result.error }, { status: 502, headers });
  }
  return Response.json({ ok: true, resend_id: result.id, sent_to: recipientEmail }, { headers });
});
