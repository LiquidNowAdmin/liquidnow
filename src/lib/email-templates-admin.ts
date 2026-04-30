// Client-side wrapper for email-templates-admin / email-generate / email-send Edge Functions.

import { createClient } from "@/lib/supabase";
import type { Block } from "@/lib/email-renderer";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function authHeader(): Promise<HeadersInit> {
  const { data } = await createClient().auth.getSession();
  const token = data.session?.access_token;
  return {
    "content-type": "application/json",
    apikey: ANON,
    ...(token ? { authorization: `Bearer ${token}` } : {}),
  };
}

async function callFn(name: string, body: unknown): Promise<any> {
  const headers = await authHeader();
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let detail = "";
    try { detail = (await res.json()).error || (await res.text()); } catch {}
    throw new Error(detail || `${name} failed (${res.status})`);
  }
  return res.json();
}

// ----- Templates -----
export type EmailTemplateAttachment = {
  kind: "library" | "adhoc";
  filename: string;
  storage_path: string;
  mime_type?: string;
  size_bytes?: number;
  description?: string;
};

export type EmailTemplate = {
  id?: string;
  slug: string;
  name: string;
  type: "newsletter" | "transactional";
  category?: string | null;
  subject: string;
  preheader: string;
  blocks: Block[];
  cta_label?: string | null;
  cta_url?: string | null;
  variables_used: string[];
  attachments: EmailTemplateAttachment[];
  intent?: string | null;
  published?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type EmailTemplateListItem = {
  id: string;
  slug: string;
  name: string;
  type: "newsletter" | "transactional";
  category: string | null;
  subject: string;
  published: boolean;
  updated_at: string;
  created_at: string;
};

export async function listEmailTemplates(): Promise<EmailTemplateListItem[]> {
  const r = await callFn("email-templates-admin", { resource: "template", action: "list" });
  return r.templates || [];
}

export async function getEmailTemplate(slug: string): Promise<EmailTemplate | null> {
  const r = await callFn("email-templates-admin", { resource: "template", action: "get", data: { slug } });
  return r.template ?? null;
}

export async function upsertEmailTemplate(t: EmailTemplate): Promise<EmailTemplate> {
  const r = await callFn("email-templates-admin", { resource: "template", action: "upsert", data: t });
  return r.template;
}

export async function publishEmailTemplate(slug: string): Promise<EmailTemplate> {
  const r = await callFn("email-templates-admin", { resource: "template", action: "publish", data: { slug } });
  return r.template;
}

export async function unpublishEmailTemplate(slug: string): Promise<EmailTemplate> {
  const r = await callFn("email-templates-admin", { resource: "template", action: "unpublish", data: { slug } });
  return r.template;
}

export async function deleteEmailTemplate(slug: string): Promise<void> {
  await callFn("email-templates-admin", { resource: "template", action: "delete", data: { slug } });
}

// ----- Attachments Library -----
export type LibraryAttachment = {
  id: string;
  filename: string;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
  description: string | null;
  created_at: string;
};

export async function listLibraryAttachments(): Promise<LibraryAttachment[]> {
  const r = await callFn("email-templates-admin", { resource: "attachment", action: "list" });
  return r.attachments || [];
}

export async function uploadLibraryAttachment(file: File, description?: string): Promise<LibraryAttachment> {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  const content_b64 = btoa(bin);
  const r = await callFn("email-templates-admin", {
    resource: "attachment",
    action: "upload",
    data: {
      filename: file.name,
      mime_type: file.type || "application/octet-stream",
      content_b64,
      description,
    },
  });
  return r.attachment;
}

export async function deleteLibraryAttachment(id: string): Promise<void> {
  await callFn("email-templates-admin", { resource: "attachment", action: "delete", data: { id } });
}

// ----- Routes -----
export type TemplateRoute = {
  id: string;
  key: string;
  label: string;
  url_template: string;
  description: string | null;
  entity_type: string | null;
  is_protected: boolean;
  created_at: string;
  updated_at: string;
};

export async function listRoutes(): Promise<TemplateRoute[]> {
  const r = await callFn("email-templates-admin", { resource: "route", action: "list" });
  return r.routes || [];
}

export async function upsertRoute(data: Partial<TemplateRoute> & { key: string; label: string; url_template: string }): Promise<TemplateRoute> {
  const r = await callFn("email-templates-admin", { resource: "route", action: "upsert", data });
  return r.route;
}

export async function deleteRoute(id: string): Promise<void> {
  await callFn("email-templates-admin", { resource: "route", action: "delete", data: { id } });
}

// ----- Test Send -----
export async function sendTestEmail(opts: { template_slug: string; recipient_email?: string }): Promise<{ resend_id: string; sent_to: string }> {
  const r = await callFn("email-send", opts);
  return { resend_id: r.resend_id, sent_to: r.sent_to };
}

// ----- Manual / Freetext Send aus Anfrage-Detail -----
export type SendEmailOpts = {
  // Entweder Template ODER Freitext
  template_slug?: string;
  freetext?: { subject: string; body_text: string; type?: "newsletter" | "transactional" };
  recipient_email?: string;
  entity?: { type: string; id: string };
  trigger_kind?: "manual" | "test" | "transactional";
  attachments?: Array<{ storage_path: string; filename?: string; mime_type?: string }>;
};

export async function sendEmail(opts: SendEmailOpts): Promise<{ resend_id: string; sent_to: string }> {
  const r = await callFn("email-send", opts);
  return { resend_id: r.resend_id, sent_to: r.sent_to };
}

// ----- Generator (streaming) -----
export type EmailGeneratorResult = {
  slug: string;
  name: string;
  subject: string;
  preheader: string;
  blocks: Block[];
  variables_used: string[];
  suggested_attachments?: Array<{ filename: string; description: string }>;
  /** Refine-Modus: KI-Erklärung was geändert wurde */
  assistant_message?: string;
};

export async function streamEmailRefinement(opts: {
  existing_template: Partial<EmailTemplate>;
  user_message: string;
  chat_history: Array<{ role: "user" | "assistant"; content: string }>;
  onText?: (chunk: string) => void;
  onResult: (template: EmailGeneratorResult) => void;
  onError: (msg: string) => void;
  signal?: AbortSignal;
}) {
  const headers = await authHeader();
  const res = await fetch(`${SUPABASE_URL}/functions/v1/email-generate`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      mode: "refine",
      existing_template: opts.existing_template,
      user_message: opts.user_message,
      chat_history: opts.chat_history,
    }),
    signal: opts.signal,
  });
  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    opts.onError(text || `Refine failed (${res.status})`);
    return;
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let nl;
    while ((nl = buffer.indexOf("\n\n")) !== -1) {
      const ev = buffer.slice(0, nl);
      buffer = buffer.slice(nl + 2);
      let eventName = "message";
      const dataLines: string[] = [];
      for (const line of ev.split("\n")) {
        if (line.startsWith("event: ")) eventName = line.slice(7).trim();
        else if (line.startsWith("data: ")) dataLines.push(line.slice(6));
      }
      const data = dataLines.join("\n");
      if (!data) continue;
      try {
        const j = JSON.parse(data);
        if (eventName === "result" && j?.template) opts.onResult(j.template);
        else if (eventName === "error") opts.onError(j?.error || "Unbekannter Fehler");
        else if (j?.type === "content_block_delta" && j?.delta?.type === "input_json_delta") {
          if (opts.onText && typeof j.delta.partial_json === "string") opts.onText(j.delta.partial_json);
        }
      } catch { /* ignore */ }
    }
  }
}

export async function streamEmailGeneration(opts: {
  type: "newsletter" | "transactional";
  intent: string;
  cta_label?: string;
  cta_url?: string;
  audience?: string;
  onText?: (chunk: string) => void;
  onResult: (template: EmailGeneratorResult) => void;
  onError: (msg: string) => void;
  signal?: AbortSignal;
}) {
  const headers = await authHeader();
  const res = await fetch(`${SUPABASE_URL}/functions/v1/email-generate`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      type: opts.type,
      intent: opts.intent,
      cta_label: opts.cta_label,
      cta_url: opts.cta_url,
      audience: opts.audience,
    }),
    signal: opts.signal,
  });

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    opts.onError(text || `Generator failed (${res.status})`);
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let nl;
    while ((nl = buffer.indexOf("\n\n")) !== -1) {
      const ev = buffer.slice(0, nl);
      buffer = buffer.slice(nl + 2);
      let eventName = "message";
      const dataLines: string[] = [];
      for (const line of ev.split("\n")) {
        if (line.startsWith("event: ")) eventName = line.slice(7).trim();
        else if (line.startsWith("data: ")) dataLines.push(line.slice(6));
      }
      const data = dataLines.join("\n");
      if (!data) continue;
      try {
        const j = JSON.parse(data);
        if (eventName === "result" && j?.template) opts.onResult(j.template);
        else if (eventName === "error") opts.onError(j?.error || "Unbekannter Fehler");
        else if (j?.type === "content_block_delta" && j?.delta?.type === "input_json_delta") {
          if (opts.onText && typeof j.delta.partial_json === "string") opts.onText(j.delta.partial_json);
        }
      } catch { /* ignore non-JSON pings */ }
    }
  }
}
