// Zentrale Resend-Sender-Utility.
//
// REGEL (CLAUDE.md): Dies ist die EINZIGE Stelle der Codebase die Resend
// direkt aufruft. Jede Edge Function die E-Mails versendet (Onboarding,
// Application-Status, Test-Sends, Newsletter, Workflow-Triggers …) MUSS
// diese Utility nutzen.
//
// Garantierte Verhalten (nicht überschreibbar von außen):
//   - From:      "LiqiNow <info@liqinow.de>"
//   - BCC:       ["platformmails@liqinow.de"]   ← lückenloses Mail-Archiv
//   - Reply-To:  default "info@liqinow.de" (überschreibbar via opts.reply_to)
//   - Logging:   jeder Send wird in sent_emails persistiert (für /admin/anfragen
//                Detail-View + Compliance-Audit)

import { createServiceClient } from "./supabase-client.ts";

const RESEND_API = 'https://api.resend.com/emails';
const FROM = 'LiqiNow <info@liqinow.de>';
const ARCHIVE_BCC = 'platformmails@liqinow.de';
const DEFAULT_REPLY_TO = 'info@liqinow.de';

export type EmailAttachment = {
  filename: string;
  /** base64-encoded content for binary, or plain text */
  content: string;
  content_type?: string;
};

export type EntityRef = {
  /** 'inquiries' | 'applications' | 'users' | 'companies' | etc. */
  type: string;
  id: string;
};

export type SendEmailInput = {
  tenant_id: string;
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  reply_to?: string;
  attachments?: EmailAttachment[];
  tags?: Array<{ name: string; value: string }>;

  // Logging-Metadaten (für sent_emails)
  trigger_kind: 'workflow' | 'manual' | 'test' | 'transactional';
  trigger_rule_id?: string | null;
  template_slug?: string | null;
  template_id?: string | null;
  entity?: EntityRef | null;
  sent_by?: string | null;        // User-UUID (operator) oder NULL
  recipient_name?: string | null;
};

export type SendEmailResult = {
  ok: boolean;
  id?: string;
  /** sent_emails.id für spätere Status-Updates */
  log_id?: string;
  error?: string;
};

export async function sendEmail(opts: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) return { ok: false, error: 'RESEND_API_KEY not configured' };

  const sb = createServiceClient();
  const recipientPrimary = Array.isArray(opts.to) ? opts.to[0] : opts.to;

  // 1) Vorab-Log mit status='sending'
  const { data: logRow } = await sb.from('sent_emails').insert({
    tenant_id: opts.tenant_id,
    recipient_email: recipientPrimary,
    recipient_name: opts.recipient_name ?? null,
    subject: opts.subject,
    body_html: opts.html,
    body_text: opts.text ?? null,
    status: 'sending',
    trigger_kind: opts.trigger_kind,
    trigger_rule_id: opts.trigger_rule_id ?? null,
    template_slug: opts.template_slug ?? null,
    template_id: opts.template_id ?? null,
    entity_type: opts.entity?.type ?? null,
    entity_id: opts.entity?.id ?? null,
    sent_by: opts.sent_by ?? null,
  }).select('id').maybeSingle();

  const logId = (logRow as any)?.id as string | undefined;

  // 2) Resend
  const body: Record<string, unknown> = {
    from: FROM,
    to: Array.isArray(opts.to) ? opts.to : [opts.to],
    bcc: [ARCHIVE_BCC],
    reply_to: opts.reply_to ?? DEFAULT_REPLY_TO,
    subject: opts.subject,
    html: opts.html,
  };
  if (opts.text)        body.text = opts.text;
  if (opts.attachments) body.attachments = opts.attachments;
  if (opts.tags)        body.tags = opts.tags;

  try {
    const res = await fetch(RESEND_API, {
      method: 'POST',
      headers: {
        'authorization': `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      // Update Log auf failed
      if (logId) {
        await sb.from('sent_emails').update({
          status: 'failed',
          error_message: data?.message || `Resend ${res.status}`,
        }).eq('id', logId);
      }
      return { ok: false, error: data?.message || `Resend ${res.status}`, log_id: logId };
    }

    // Erfolgreich — Log aktualisieren mit resend_id + status='sent'
    if (logId) {
      await sb.from('sent_emails').update({
        status: 'sent',
        resend_id: data?.id ?? null,
      }).eq('id', logId);
    }
    return { ok: true, id: data?.id, log_id: logId };
  } catch (err) {
    if (logId) {
      await sb.from('sent_emails').update({
        status: 'failed',
        error_message: String(err),
      }).eq('id', logId);
    }
    return { ok: false, error: String(err), log_id: logId };
  }
}
