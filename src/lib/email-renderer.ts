// Frontend-Mirror von supabase/functions/_shared/template-variables.ts
// Wird benötigt damit die Admin-Preview ohne Edge-Function-Roundtrip rendern kann.
// WICHTIG: Bei Änderungen am Edge-Modul HIER mit-aktualisieren.

export type VariableDef = {
  key: string;
  label: string;
  description: string;
  example: string;
  source: "recipient" | "company" | "tenant" | "system";
};

export const VARIABLES: VariableDef[] = [
  { key: "recipient.first_name", label: "Vorname", description: "Vorname des Empfängers", example: "Anna", source: "recipient" },
  { key: "recipient.last_name", label: "Nachname", description: "Nachname des Empfängers", example: "Müller", source: "recipient" },
  { key: "recipient.full_name", label: "Voller Name", description: "Vor- und Nachname", example: "Anna Müller", source: "recipient" },
  { key: "recipient.email", label: "E-Mail-Adresse", description: "E-Mail-Adresse des Empfängers", example: "anna@mueller-handel.de", source: "recipient" },
  { key: "recipient.salutation", label: "Anrede (formell)", description: "Vollständige formelle Anrede", example: "Sehr geehrte Frau Müller", source: "recipient" },
  { key: "recipient.salutation_informal", label: "Anrede (informell)", description: "Informelle Anrede", example: "Hallo Anna", source: "recipient" },
  { key: "company.name", label: "Firmenname", description: "Firma des Empfängers", example: "Müller Handelsgesellschaft mbH", source: "company" },
  { key: "tenant.name", label: "Plattform-Name", description: "LiqiNow Platform-Name", example: "LiqiNow", source: "tenant" },
  { key: "tenant.url", label: "Plattform-URL", description: "Hauptdomain", example: "https://liqinow.de", source: "tenant" },
  { key: "unsubscribe.url", label: "Abmelde-Link", description: "Newsletter-Abmelde-URL", example: "https://liqinow.de/unsubscribe?token=xyz", source: "system" },
  { key: "date.today", label: "Heutiges Datum", description: "Heutiges Datum (deutsch)", example: "30. April 2026", source: "system" },
];

export type Block =
  | { type: "heading"; level: 1 | 2; text: string }
  | { type: "paragraph"; text: string }
  | { type: "button"; label: string; url: string }
  | { type: "divider" }
  | { type: "spacer"; size: "sm" | "md" | "lg" }
  | { type: "image"; url: string; alt: string; caption?: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "quote"; text: string; attribution?: string };

export function exampleVariableValues(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const v of VARIABLES) out[v.key] = v.example;
  return out;
}

const VAR_RE = /\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g;

export function substituteVariables(input: string, values: Record<string, string>): string {
  return input.replace(VAR_RE, (_, key) => values[key] ?? "");
}

export function extractUsedVariables(blocks: Block[]): string[] {
  const text: string[] = [];
  for (const b of blocks) {
    if ("text" in b && typeof b.text === "string") text.push(b.text);
    if (b.type === "button") text.push(b.label, b.url);
    if (b.type === "image") text.push(b.alt, b.caption ?? "");
    if (b.type === "list") text.push(...b.items);
  }
  const found = new Set<string>();
  for (const t of text) {
    let m: RegExpExecArray | null;
    VAR_RE.lastIndex = 0;
    while ((m = VAR_RE.exec(t)) !== null) found.add(m[1]);
  }
  return [...found];
}

const COLOR = {
  bg: "#F3F6F9",
  card: "#ffffff",
  text: "#3D3F52",
  subtle: "#5b6478",
  primary: "#507AA6",
  primaryDark: "#243650",
  border: "#E6EAF1",
};

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function renderBlock(b: Block, values: Record<string, string>): string {
  const sub = (s: string) => substituteVariables(s, values);
  switch (b.type) {
    case "heading": {
      const tag = b.level === 1 ? "h1" : "h2";
      const fontSize = b.level === 1 ? 28 : 22;
      return `<${tag} style="font-family:'Poppins','Inter',Helvetica,Arial,sans-serif;font-size:${fontSize}px;line-height:1.25;font-weight:700;color:${COLOR.text};margin:24px 0 12px 0;letter-spacing:-0.02em;">${escapeHtml(sub(b.text))}</${tag}>`;
    }
    case "paragraph":
      return `<p style="font-family:'Inter',Helvetica,Arial,sans-serif;font-size:16px;line-height:1.65;color:${COLOR.text};margin:0 0 16px 0;">${escapeHtml(sub(b.text)).replace(/\n/g, "<br>")}</p>`;
    case "button": {
      const url = sub(b.url);
      const label = sub(b.label);
      return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0;"><tr><td style="border-radius:12px;background:${COLOR.primary};"><a href="${escapeHtml(url)}" style="display:inline-block;padding:14px 28px;font-family:'Inter',Helvetica,Arial,sans-serif;font-size:16px;font-weight:600;color:#ffffff !important;text-decoration:none;border-radius:12px;background:${COLOR.primary};">${escapeHtml(label)}</a></td></tr></table>`;
    }
    case "divider":
      return `<hr style="border:0;border-top:1px solid ${COLOR.border};margin:32px 0;">`;
    case "spacer": {
      const h = b.size === "sm" ? 12 : b.size === "lg" ? 40 : 24;
      return `<div style="height:${h}px;line-height:${h}px;font-size:1px;">&nbsp;</div>`;
    }
    case "image": {
      const caption = b.caption ? sub(b.caption) : "";
      const alt = sub(b.alt);
      return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:16px 0;"><tr><td align="center"><img src="${escapeHtml(b.url)}" alt="${escapeHtml(alt)}" style="max-width:100%;height:auto;border-radius:12px;display:block;" /></td></tr>${caption ? `<tr><td align="center" style="padding-top:8px;font-family:'Inter',Helvetica,Arial,sans-serif;font-size:13px;color:${COLOR.subtle};font-style:italic;">${escapeHtml(caption)}</td></tr>` : ""}</table>`;
    }
    case "list": {
      const tag = b.ordered ? "ol" : "ul";
      const items = b.items.map((i) => `<li style="margin:0 0 6px 0;">${escapeHtml(sub(i))}</li>`).join("");
      return `<${tag} style="font-family:'Inter',Helvetica,Arial,sans-serif;font-size:16px;line-height:1.65;color:${COLOR.text};margin:0 0 16px 24px;padding:0;">${items}</${tag}>`;
    }
    case "quote": {
      const attribution = b.attribution ? `<div style="margin-top:8px;font-size:13px;color:${COLOR.subtle};">— ${escapeHtml(sub(b.attribution))}</div>` : "";
      return `<blockquote style="margin:24px 0;padding:16px 20px;border-left:3px solid ${COLOR.primary};background:${COLOR.bg};font-family:'Inter',Helvetica,Arial,sans-serif;font-style:italic;color:${COLOR.text};">${escapeHtml(sub(b.text))}${attribution}</blockquote>`;
    }
  }
}

const COMPANY = {
  legalName: "Deutsche Einkaufsfinanzierer GmbH",
  brandName: "LiQiNow",
  address: "Grabenstraße 28 · 70734 Fellbach",
  phone: "040 999 999 400",
  email: "info@liqinow.de",
  url: "https://liqinow.de",
  ceo: "Thomas Auerbach",
  court: "Amtsgericht Hamburg",
  hrb: "HRB 141686",
  ust: "DE306361948",
};

function renderFooter(opts: { type: "newsletter" | "transactional"; values: Record<string, string> }): string {
  const newsletterPart = opts.type === "newsletter"
    ? `<p style="margin:16px 0 0 0;font-family:'Inter',Helvetica,Arial,sans-serif;font-size:12px;color:${COLOR.subtle};line-height:1.5;">Sie erhalten diese E-Mail, weil Sie sich bei ${COMPANY.brandName} registriert haben.<br><a href="${escapeHtml(opts.values["unsubscribe.url"] || COMPANY.url + "/unsubscribe")}" style="color:${COLOR.primary};text-decoration:underline;">Hier abmelden</a></p>`
    : "";

  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top:40px;border-top:1px solid ${COLOR.border};padding-top:24px;"><tr><td style="font-family:'Inter',Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:${COLOR.subtle};"><p style="margin:0 0 8px 0;font-weight:600;color:${COLOR.text};">${COMPANY.brandName} ist eine Marke der ${COMPANY.legalName}.</p><p style="margin:0 0 8px 0;">${COMPANY.legalName}<br>${COMPANY.address}<br>Tel. ${COMPANY.phone} · <a href="mailto:${COMPANY.email}" style="color:${COLOR.subtle};">${COMPANY.email}</a> · <a href="${COMPANY.url}" style="color:${COLOR.subtle};">liqinow.de</a></p><p style="margin:0 0 8px 0;">Geschäftsführer: ${COMPANY.ceo}<br>${COMPANY.court} · ${COMPANY.hrb}<br>USt-IdNr. ${COMPANY.ust}</p>${newsletterPart}</td></tr></table>`;
}

export function renderEmail(input: {
  blocks: Block[];
  type: "newsletter" | "transactional";
  preheader?: string;
  values: Record<string, string>;
}): { html: string; text: string } {
  const body = input.blocks.map((b) => renderBlock(b, input.values)).join("\n");
  const footer = renderFooter({ type: input.type, values: input.values });
  const preheader = input.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${COLOR.bg};">${escapeHtml(substituteVariables(input.preheader, input.values))}</div>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="x-apple-disable-message-reformatting"><title>LiqiNow</title></head>
<body style="margin:0;padding:0;background:${COLOR.bg};font-family:'Inter',Helvetica,Arial,sans-serif;">
${preheader}
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:${COLOR.bg};">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width:600px;width:100%;background:${COLOR.card};border-radius:16px;box-shadow:0 4px 20px rgba(36,54,80,0.06);">
<tr><td style="padding:32px 32px 8px 32px;"><a href="${COMPANY.url}" style="text-decoration:none;color:${COLOR.primary};font-family:'Poppins','Inter',Helvetica,Arial,sans-serif;font-size:22px;font-weight:700;letter-spacing:-0.01em;">LiQiNow</a></td></tr>
<tr><td style="padding:8px 32px 32px 32px;">${body}${footer}</td></tr>
</table></td></tr></table></body></html>`;

  const text = input.blocks.map((b) => {
    const sub = (s: string) => substituteVariables(s, input.values);
    switch (b.type) {
      case "heading": return sub(b.text).toUpperCase();
      case "paragraph": return sub(b.text);
      case "button": return `${sub(b.label)}: ${sub(b.url)}`;
      case "divider": return "---";
      case "spacer": return "";
      case "image": return b.caption ? sub(b.caption) : "";
      case "list": return b.items.map((i, idx) => `${b.ordered ? `${idx + 1}.` : "-"} ${sub(i)}`).join("\n");
      case "quote": return `"${sub(b.text)}"${b.attribution ? ` — ${sub(b.attribution)}` : ""}`;
    }
  }).filter(Boolean).join("\n\n") + `\n\n--\n${COMPANY.brandName} ist eine Marke der ${COMPANY.legalName}.`;

  return { html, text };
}
