"use client";

import { useEffect, useState, useMemo, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { User, FileText, Send, Gift, CheckCircle, XCircle, ArrowLeft, Building2, Banknote, Clock, Search, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase";
import DateFilter from "../components/DateFilter";

/* ── Types ── */

interface KanbanCard {
  kanban_status: string;
  inquiry_id: string | null;
  user_id: string;
  user_email: string;
  user_name: string;
  company_name: string | null;
  volume: number | null;
  term_months: number | null;
  purpose: string | null;
  provider_names: string[];
  application_count: number;
  created_at: string;
}

interface Application {
  application_id: string;
  provider_name: string;
  product_name: string;
  volume: number;
  term_months: number;
  status: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/* ── Constants ── */

const COLUMNS = [
  { key: "account_created", label: "Account erstellt", icon: User, color: "#A8C9DD" },
  { key: "inquiry_created", label: "Anfrage erstellt", icon: FileText, color: "#507AA6" },
  { key: "submitted", label: "Abgesendet", icon: Send, color: "#6D9EC8" },
  { key: "offer", label: "Angebot", icon: Gift, color: "#9BAA28" },
  { key: "closed", label: "Abgeschlossen", icon: CheckCircle, color: "#16a34a" },
  { key: "rejected", label: "Abgelehnt", icon: XCircle, color: "#DC2626" },
] as const;

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  new: { label: "Neu", color: "#243650", bg: "rgba(80,122,166,0.1)" },
  inquired: { label: "In Prüfung", color: "#6B7A0F", bg: "rgba(155,170,40,0.12)" },
  offer_received: { label: "Angebote", color: "#d97706", bg: "rgba(217,119,6,0.1)" },
  offer_accepted: { label: "Angenommen", color: "#6B7A0F", bg: "rgba(155,170,40,0.12)" },
  signed: { label: "Angebot", color: "#16a34a", bg: "rgba(22,163,74,0.1)" },
  closed: { label: "Abgeschlossen", color: "#16a34a", bg: "rgba(22,163,74,0.1)" },
  rejected: { label: "Abgelehnt", color: "#DC2626", bg: "rgba(220,38,38,0.08)" },
};

/* ── Helpers ── */

function formatCurrency(value: number) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", minimumFractionDigits: 0 }).format(value);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `vor ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `vor ${hours}h`;
  const days = Math.floor(hours / 24);
  return `vor ${days}d`;
}

function daysAgo(dateStr: string): number {
  return (Date.now() - new Date(dateStr).getTime()) / 86400000;
}

/* ── Main Page ── */

export default function AnfragenPage() {
  return <Suspense><AnfragenContent /></Suspense>;
}

// Inline-edit field — Enter saves, Escape cancels, Tab moves to next
function InlineField({ label, value, onSave, type = "text", placeholder }: {
  label: string;
  value: string | number | null | undefined;
  onSave: (newValue: string) => Promise<void>;
  type?: string;
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const display = value === null || value === undefined || value === "" ? "–" : String(value);

  function startEdit() {
    setDraft(value === null || value === undefined ? "" : String(value));
    setEditing(true);
  }

  async function commit() {
    if (saving) return;
    setSaving(true);
    try {
      await onSave(draft);
      setEditing(false);
    } catch (err) {
      console.error("[InlineField]", err);
    } finally {
      setSaving(false);
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      commit().then(() => {
        // Focus next inline field
        const fields = Array.from(document.querySelectorAll<HTMLElement>("[data-inline-field]"));
        const idx = fields.findIndex(f => f.contains(e.currentTarget));
        const next = fields[idx + 1];
        if (next) (next.querySelector("button, input") as HTMLElement | null)?.focus();
      });
    } else if (e.key === "Escape") {
      e.preventDefault();
      setEditing(false);
    }
  }

  return (
    <div data-inline-field
         style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                  gap: "0.5rem", padding: "0.125rem 0", minWidth: 0 }}>
      <span style={{ fontSize: "0.6875rem", color: "var(--color-subtle)", flexShrink: 0, whiteSpace: "nowrap" }}>{label}</span>
      {editing ? (
        <input
          type={type}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={handleKey}
          onBlur={commit}
          autoFocus
          placeholder={placeholder}
          style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--color-dark)",
                   textAlign: "right", border: "1px solid var(--color-turquoise)",
                   borderRadius: "0.25rem", padding: "0.125rem 0.25rem", background: "#fff",
                   outline: "none", width: "11rem", flexShrink: 0 }}
        />
      ) : (
        <button type="button" onClick={startEdit}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-light-bg)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
          style={{ fontSize: "0.75rem", fontWeight: 500,
                   color: display === "–" ? "var(--color-border)" : "var(--color-dark)",
                   textAlign: "right", background: "none", border: "1px solid transparent",
                   borderRadius: "0.25rem", cursor: "text", padding: "0.125rem 0.25rem",
                   overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                   maxWidth: "12rem", transition: "background 0.1s ease" }}>
          {display}
        </button>
      )}
    </div>
  );
}

// Empty-State für Unternehmen-Section: Website eingeben, KI extrahiert
// Firmendaten via company-search Edge Function, dann anlegen + verknüpfen.
function CompanyEmptyState({ userId, onCreated }: {
  userId: string;
  onCreated: (company: Record<string, unknown>) => void;
}) {
  const [website, setWebsite] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{
    name?: string; ustId?: string; hrb?: string; website?: string;
    address?: { street?: string; zip?: string; city?: string; country?: string };
  } | null>(null);

  const supabase = createClient();

  const search = async () => {
    if (!website.trim()) return;
    setBusy(true); setError(null); setPreview(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/company-search`, {
        method: "POST",
        headers: { "content-type": "application/json", apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, ...(token ? { authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ website: website.trim() }),
      });
      const json = await res.json();
      if (!json?.success) throw new Error(json?.error || "Keine Firmendaten gefunden");
      setPreview(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler bei der Suche");
    } finally { setBusy(false); }
  };

  const accept = async () => {
    if (!preview?.name) return;
    setBusy(true); setError(null);
    try {
      const { data: userRow } = await supabase.from("users").select("tenant_id").eq("id", userId).maybeSingle();
      const tenantId = (userRow as Record<string, unknown> | null)?.tenant_id as string | undefined;
      if (!tenantId) throw new Error("Tenant nicht gefunden");
      const { data: company, error: cErr } = await supabase.from("companies").insert({
        tenant_id: tenantId,
        name: preview.name,
        ust_id: preview.ustId ?? null,
        hrb: preview.hrb ?? null,
        website: preview.website ?? website,
        address: preview.address ?? {},
      }).select("*").maybeSingle();
      if (cErr || !company) throw new Error(cErr?.message || "Konnte Firma nicht anlegen");
      const { error: mErr } = await supabase.from("company_members").insert({
        tenant_id: tenantId,
        user_id: userId,
        company_id: (company as Record<string, unknown>).id as string,
        role: "owner",
      });
      if (mErr) console.warn("[CompanyEmptyState] company_members insert:", mErr.message);
      onCreated(company as Record<string, unknown>);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Anlegen");
    } finally { setBusy(false); }
  };

  const headlineFont = { fontSize: "0.6875rem", fontWeight: 700, color: "var(--color-subtle)", textTransform: "uppercase" as const, letterSpacing: "0.06em", margin: 0 };

  return (
    <section className="admin-chart-card" style={{ display: "flex", flexDirection: "column", minWidth: 0, padding: "0.875rem 1rem", gap: "0.625rem" }}>
      <header style={{ display: "flex", alignItems: "center", gap: "0.5rem", paddingBottom: "0.375rem" }}>
        <Building2 style={{ width: "0.875rem", height: "0.875rem", color: "var(--color-subtle)" }} />
        <h3 style={headlineFont}>Unternehmen</h3>
        <span style={{ marginLeft: "auto", fontSize: "0.75rem", color: "var(--color-subtle)" }}>noch nicht verknüpft</span>
      </header>

      <p style={{ fontSize: "0.75rem", color: "var(--color-subtle)", margin: 0, lineHeight: 1.5 }}>
        Trag die Firmen-Website ein — wir extrahieren Name, HRB, USt-IdNr. und Adresse automatisch.
      </p>

      <div style={{ display: "flex", gap: "0.375rem" }}>
        <input
          type="url"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") search(); }}
          disabled={busy}
          placeholder="https://example.de"
          style={{ flex: 1, padding: "0.375rem 0.625rem", borderRadius: "0.375rem", border: "1px solid var(--color-border)", fontSize: "0.8125rem", outline: "none" }}
        />
        <button onClick={search} disabled={busy || !website.trim()}
                style={{ padding: "0.375rem 0.875rem", borderRadius: "0.375rem", border: "1px solid var(--color-turquoise)", background: "var(--color-turquoise)", color: "#fff", fontSize: "0.8125rem", fontWeight: 600, cursor: busy ? "wait" : "pointer", opacity: busy ? 0.6 : 1 }}>
          {busy ? "…" : "Suchen"}
        </button>
      </div>

      {error && <div style={{ fontSize: "0.75rem", color: "rgba(220,38,38,0.85)" }}>{error}</div>}

      {preview && (
        <div style={{ borderRadius: "0.5rem", background: "var(--color-light-bg)", padding: "0.625rem 0.75rem", display: "flex", flexDirection: "column", gap: "0.25rem", fontSize: "0.75rem" }}>
          <div><strong style={{ color: "var(--color-dark)" }}>{preview.name ?? "—"}</strong></div>
          {preview.hrb && <div style={{ color: "var(--color-subtle)" }}>HRB: {preview.hrb}</div>}
          {preview.ustId && <div style={{ color: "var(--color-subtle)" }}>USt-IdNr.: {preview.ustId}</div>}
          {preview.address && (preview.address.street || preview.address.city) && (
            <div style={{ color: "var(--color-subtle)" }}>
              {[preview.address.street, [preview.address.zip, preview.address.city].filter(Boolean).join(" ")].filter(Boolean).join(", ")}
            </div>
          )}
          <div style={{ display: "flex", gap: "0.375rem", marginTop: "0.375rem" }}>
            <button onClick={accept} disabled={busy}
                    style={{ padding: "0.3125rem 0.75rem", borderRadius: "0.375rem", border: "1px solid var(--color-turquoise)", background: "var(--color-turquoise)", color: "#fff", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}>
              Übernehmen + verknüpfen
            </button>
            <button onClick={() => setPreview(null)}
                    style={{ padding: "0.3125rem 0.75rem", borderRadius: "0.375rem", border: "1px solid var(--color-border)", background: "transparent", fontSize: "0.75rem", color: "var(--color-subtle)", cursor: "pointer" }}>
              Verwerfen
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

// Modal: Manueller E-Mail-Versand aus Anfragen-Detail. Picks aus
// /admin/emails-Templates, lädt Lead-Context server-seitig, schickt via
// email-send mit trigger_kind='manual'.
function SendEmailModal({
  entity,
  recipientEmail,
  onClose,
  onSent,
}: {
  entity: { type: string; id: string } | null;
  recipientEmail: string;
  onClose: () => void;
  onSent: () => void;
}) {
  const [mode, setMode] = useState<"template" | "freetext">("template");
  const [templates, setTemplates] = useState<Array<{ id: string; slug: string; name: string; subject: string; published: boolean; type: string }>>([]);
  const [library, setLibrary] = useState<Array<{ id: string; filename: string; storage_path: string; mime_type: string; size_bytes: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlug, setSelectedSlug] = useState<string>("");
  const [overrideEmail, setOverrideEmail] = useState(recipientEmail);
  const [freetextSubject, setFreetextSubject] = useState("");
  const [freetextBody, setFreetextBody] = useState("");
  const [selectedAttachments, setSelectedAttachments] = useState<Array<{ storage_path: string; filename: string; mime_type: string }>>([]);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) { setError("Nicht authentifiziert"); setLoading(false); return; }
      const headers = { "content-type": "application/json", apikey: anonKey, authorization: `Bearer ${token}` };

      const [tplRes, libRes] = await Promise.all([
        fetch(`${supabaseUrl}/functions/v1/email-templates-admin`, {
          method: "POST", headers,
          body: JSON.stringify({ resource: "template", action: "list" }),
        }),
        fetch(`${supabaseUrl}/functions/v1/email-templates-admin`, {
          method: "POST", headers,
          body: JSON.stringify({ resource: "attachment", action: "list" }),
        }),
      ]);
      const tplJson = await tplRes.json().catch(() => ({}));
      const libJson = await libRes.json().catch(() => ({}));
      const list = (tplJson.templates ?? []) as Array<{ id: string; slug: string; name: string; subject: string; published: boolean; type: string }>;
      setTemplates(list);
      setLibrary((libJson.attachments ?? []) as never);
      const firstReady = list.find((t) => t.published);
      if (firstReady) setSelectedSlug(firstReady.slug);
      setLoading(false);
    })();
  }, [supabaseUrl, anonKey]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setError(null);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Nicht authentifiziert");
      const buf = await file.arrayBuffer();
      const bytes = new Uint8Array(buf);
      let bin = "";
      for (const b of bytes) bin += String.fromCharCode(b);
      const content_b64 = btoa(bin);
      const res = await fetch(`${supabaseUrl}/functions/v1/email-templates-admin`, {
        method: "POST",
        headers: { "content-type": "application/json", apikey: anonKey, authorization: `Bearer ${token}` },
        body: JSON.stringify({
          resource: "attachment", action: "upload",
          data: { filename: file.name, mime_type: file.type || "application/octet-stream", content_b64 },
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.attachment) throw new Error(json?.error || "Upload fehlgeschlagen");
      const a = json.attachment as { id: string; filename: string; storage_path: string; mime_type: string; size_bytes: number };
      setLibrary((prev) => [a, ...prev]);
      setSelectedAttachments((prev) => [...prev, { storage_path: a.storage_path, filename: a.filename, mime_type: a.mime_type }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload fehlgeschlagen");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const send = async () => {
    setError(null);
    if (!overrideEmail.trim()) { setError("Empfänger ist Pflicht"); return; }
    if (mode === "template" && !selectedSlug) { setError("Bitte ein Template wählen"); return; }
    if (mode === "freetext" && (!freetextSubject.trim() || !freetextBody.trim())) {
      setError("Betreff + Text sind Pflicht"); return;
    }
    setBusy(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Nicht authentifiziert");

      const body: Record<string, unknown> = {
        recipient_email: overrideEmail.trim(),
        entity: entity ?? undefined,
        trigger_kind: "manual",
        attachments: selectedAttachments.length ? selectedAttachments : undefined,
      };
      if (mode === "template") body.template_slug = selectedSlug;
      else body.freetext = { subject: freetextSubject.trim(), body_text: freetextBody, type: "transactional" };

      const res = await fetch(`${supabaseUrl}/functions/v1/email-send`, {
        method: "POST",
        headers: { "content-type": "application/json", apikey: anonKey, authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Send failed (${res.status})`);
      onSent();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Versand fehlgeschlagen");
    } finally { setBusy(false); }
  };

  const draftSubject = templates.find((t) => t.slug === selectedSlug)?.subject ?? "";

  const tabBtn = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: "0.5rem 0.75rem", fontSize: "0.8125rem", fontWeight: 600,
    border: "none", background: "transparent", cursor: "pointer",
    color: active ? "var(--color-dark)" : "var(--color-subtle)",
    borderBottom: active ? "2px solid var(--color-turquoise)" : "2px solid transparent",
  });

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", zIndex: 50 }} onClick={onClose}>
      <div className="admin-chart-card" style={{ maxWidth: "36rem", width: "100%", padding: "1.25rem", maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-dark)", margin: 0 }}>E-Mail an Lead senden</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-subtle)" }}>✕</button>
        </div>

        {loading ? (
          <div style={{ padding: "1rem", color: "var(--color-subtle)", fontSize: "0.875rem" }}>Lade…</div>
        ) : (
          <>
            <div style={{ display: "flex", borderBottom: "1px solid var(--color-border)", marginBottom: "1rem" }}>
              <button style={tabBtn(mode === "template")} onClick={() => setMode("template")}>📄 Aus Template</button>
              <button style={tabBtn(mode === "freetext")} onClick={() => setMode("freetext")}>✍️ Freitext</button>
            </div>

            {mode === "template" ? (
              <div style={{ marginBottom: "0.875rem" }}>
                <label style={{ fontSize: "0.6875rem", color: "var(--color-subtle)", textTransform: "uppercase", fontWeight: 600 }}>Template</label>
                {templates.length === 0 ? (
                  <p style={{ fontSize: "0.8125rem", color: "var(--color-subtle)", marginTop: "0.5rem" }}>
                    Noch keine Templates angelegt. Geh zu <a href="/admin/emails" style={{ color: "var(--color-turquoise)", textDecoration: "underline" }}>/admin/emails</a>.
                  </p>
                ) : (
                  <select value={selectedSlug} onChange={(e) => setSelectedSlug(e.target.value)}
                          style={{ width: "100%", marginTop: "0.25rem", padding: "0.5rem 0.75rem", fontSize: "0.8125rem", border: "1px solid var(--color-border)", borderRadius: "0.375rem" }}>
                    <option value="">— wählen —</option>
                    {templates.map((t) => (
                      <option key={t.slug} value={t.slug}>
                        {t.name} {!t.published && "· Entwurf"} · {t.type === "newsletter" ? "Newsletter" : "Transaktional"}
                      </option>
                    ))}
                  </select>
                )}
                {draftSubject && (
                  <p style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "var(--color-subtle)" }}>
                    Betreff: <em style={{ color: "var(--color-dark)" }}>{draftSubject}</em>
                  </p>
                )}
              </div>
            ) : (
              <>
                <div style={{ marginBottom: "0.875rem" }}>
                  <label style={{ fontSize: "0.6875rem", color: "var(--color-subtle)", textTransform: "uppercase", fontWeight: 600 }}>Betreff</label>
                  <input type="text" value={freetextSubject} onChange={(e) => setFreetextSubject(e.target.value)}
                         placeholder="z. B. Rückfrage zu Ihrer Anfrage"
                         style={{ width: "100%", marginTop: "0.25rem", padding: "0.5rem 0.75rem", fontSize: "0.8125rem", border: "1px solid var(--color-border)", borderRadius: "0.375rem" }} />
                </div>
                <div style={{ marginBottom: "0.875rem" }}>
                  <label style={{ fontSize: "0.6875rem", color: "var(--color-subtle)", textTransform: "uppercase", fontWeight: 600 }}>Text</label>
                  <textarea value={freetextBody} onChange={(e) => setFreetextBody(e.target.value)} rows={8}
                            placeholder={"Sehr geehrte/r {{recipient.salutation}},\n\n…\n\nMit freundlichen Grüßen\nIhr LiQiNow-Team"}
                            style={{ width: "100%", marginTop: "0.25rem", padding: "0.5rem 0.75rem", fontSize: "0.8125rem", border: "1px solid var(--color-border)", borderRadius: "0.375rem", fontFamily: "var(--font-inter, inherit)", resize: "vertical" }} />
                  <p style={{ marginTop: "0.25rem", fontSize: "0.6875rem", color: "var(--color-subtle)" }}>
                    Header + Footer (Logo, Impressum) werden automatisch ergänzt. Variablen wie <code style={{ background: "rgba(0,0,0,0.04)", padding: "0 0.25rem", borderRadius: "0.125rem" }}>{`{{recipient.first_name}}`}</code> oder <code style={{ background: "rgba(0,0,0,0.04)", padding: "0 0.25rem", borderRadius: "0.125rem" }}>{`{{application.provider_name}}`}</code> funktionieren.
                  </p>
                </div>
              </>
            )}

            <div style={{ marginBottom: "0.875rem" }}>
              <label style={{ fontSize: "0.6875rem", color: "var(--color-subtle)", textTransform: "uppercase", fontWeight: 600 }}>Anhänge ({selectedAttachments.length})</label>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", marginTop: "0.25rem" }}>
                {selectedAttachments.map((a, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.375rem 0.5rem", background: "var(--color-light-bg)", borderRadius: "0.25rem", fontSize: "0.75rem" }}>
                    <span>📎 {a.filename}</span>
                    <button onClick={() => setSelectedAttachments((prev) => prev.filter((_, k) => k !== i))}
                            style={{ background: "none", border: "none", color: "var(--color-subtle)", cursor: "pointer" }}>✕</button>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: "0.375rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
                {library.length > 0 && (
                  <select value=""
                          onChange={(e) => {
                            const a = library.find((x) => x.id === e.target.value);
                            if (a && !selectedAttachments.some((s) => s.storage_path === a.storage_path)) {
                              setSelectedAttachments((prev) => [...prev, { storage_path: a.storage_path, filename: a.filename, mime_type: a.mime_type }]);
                            }
                          }}
                          style={{ flex: 1, minWidth: "10rem", padding: "0.375rem 0.5rem", fontSize: "0.75rem", border: "1px solid var(--color-border)", borderRadius: "0.25rem" }}>
                    <option value="">+ Aus Bibliothek hinzufügen</option>
                    {library.map((a) => <option key={a.id} value={a.id}>{a.filename}</option>)}
                  </select>
                )}
                <label style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", padding: "0.375rem 0.625rem", border: "1px dashed var(--color-border)", borderRadius: "0.25rem", fontSize: "0.75rem", color: "var(--color-subtle)", cursor: uploading ? "wait" : "pointer" }}>
                  {uploading ? "Lade hoch…" : "+ Datei hochladen"}
                  <input type="file" disabled={uploading} onChange={handleFileUpload} style={{ display: "none" }} />
                </label>
              </div>
            </div>

            <div style={{ marginBottom: "0.875rem" }}>
              <label style={{ fontSize: "0.6875rem", color: "var(--color-subtle)", textTransform: "uppercase", fontWeight: 600 }}>Empfänger</label>
              <input type="email" value={overrideEmail} onChange={(e) => setOverrideEmail(e.target.value)}
                     style={{ width: "100%", marginTop: "0.25rem", padding: "0.5rem 0.75rem", fontSize: "0.8125rem", border: "1px solid var(--color-border)", borderRadius: "0.375rem" }} />
              <p style={{ marginTop: "0.25rem", fontSize: "0.6875rem", color: "var(--color-subtle)" }}>
                Variablen werden mit Lead-Daten aufgelöst. BCC immer auf <code style={{ background: "rgba(0,0,0,0.04)", padding: "0 0.25rem", borderRadius: "0.125rem" }}>platformmails@liqinow.de</code>.
              </p>
            </div>

            {error && (
              <div style={{ padding: "0.5rem 0.75rem", background: "rgba(220,38,38,0.08)", color: "rgba(220,38,38,0.9)", borderRadius: "0.375rem", fontSize: "0.8125rem", marginBottom: "0.875rem" }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
              <button onClick={onClose} disabled={busy}
                      style={{ padding: "0.5rem 0.875rem", border: "1px solid var(--color-border)", background: "transparent", borderRadius: "0.375rem", fontSize: "0.8125rem", color: "var(--color-subtle)", cursor: "pointer" }}>
                Abbrechen
              </button>
              <button onClick={send} disabled={busy || !overrideEmail.trim()}
                      style={{ padding: "0.5rem 0.875rem", border: "1px solid var(--color-turquoise)", background: "var(--color-turquoise)", color: "#fff", borderRadius: "0.375rem", fontSize: "0.8125rem", fontWeight: 600, cursor: busy ? "wait" : "pointer", opacity: busy ? 0.6 : 1 }}>
                {busy ? "Sende…" : "Jetzt senden"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function AnfragenContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const detailId = searchParams.get("id");

  const [cards, setCards] = useState<KanbanCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [documents, setDocuments] = useState<Array<{ id: string; name: string; doc_type: string | null; file_path: string; file_size: number | null; mime_type: string | null; created_at: string; valid_until: string | null }>>([]);
  const [userDetail, setUserDetail] = useState<Record<string, unknown> | null>(null);
  const [companyDetail, setCompanyDetail] = useState<Record<string, unknown> | null>(null);
  const [sentEmails, setSentEmails] = useState<Array<{ id: string; recipient_email: string; subject: string; status: string; trigger_kind: string; template_slug: string | null; sent_at: string }>>([]);
  const [showSendModal, setShowSendModal] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [days, setDays] = useState<number | null>(null);

  // Derive selected card from URL param (matches inquiry_id or user_id)
  const selected = detailId ? cards.find((c) => c.inquiry_id === detailId || c.user_id === detailId) ?? null : null;

  useEffect(() => {
    const supabase = createClient();
    supabase.rpc("admin_get_kanban_inquiries").then(({ data, error }) => {
      if (error) console.error("[Kanban]", error.message);
      setCards(data ?? []);
      setLoading(false);
    });
  }, []);

  // Load applications when detail opens (only if it's an inquiry)
  useEffect(() => {
    if (!detailId) { setApplications([]); return; }
    if (!selected?.inquiry_id) { setApplications([]); setDetailLoading(false); return; }
    setDetailLoading(true);
    const supabase = createClient();
    supabase.rpc("admin_get_inquiry_detail", { p_inquiry_id: selected.inquiry_id }).then(({ data }) => {
      setApplications(data ?? []);
      setDetailLoading(false);
    });
  }, [detailId, selected?.inquiry_id]);

  // Load documents + user + company details
  useEffect(() => {
    if (!detailId || !selected) { setDocuments([]); setUserDetail(null); setCompanyDetail(null); setSentEmails([]); return; }
    const supabase = createClient();
    // Load sent emails for the lead — kombiniert inquiry/users/applications
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) { setSentEmails([]); return; }
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/workflow-rules-admin`, {
        method: "POST",
        headers: { "content-type": "application/json", apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, authorization: `Bearer ${token}` },
        body: JSON.stringify({
          resource: "sent_email",
          action: "list_by_lead",
          data: { inquiry_id: selected.inquiry_id, user_id: selected.user_id },
        }),
      });
      if (res.ok) {
        const json = await res.json();
        setSentEmails(json.sent_emails ?? []);
      } else {
        setSentEmails([]);
      }
    })();
    (async () => {
      // Load user
      const { data: user } = await supabase
        .from("users")
        .select("id, email, first_name, last_name, phone, metadata, created_at")
        .eq("id", selected.user_id)
        .maybeSingle();
      if (user) setUserDetail(user);

      // Load company via company_members
      const { data: member } = await supabase
        .from("company_members")
        .select("company_id")
        .eq("user_id", selected.user_id)
        .limit(1)
        .maybeSingle();
      if (member?.company_id) {
        const { data: company } = await supabase
          .from("companies")
          .select("id, name, legal_form, ust_id, hrb, crefo, website, address, industry, annual_revenue, created_at")
          .eq("id", member.company_id)
          .maybeSingle();
        if (company) setCompanyDetail(company);

        // Load documents for this company
        const { data: docs } = await supabase
          .from("documents")
          .select("id, name, doc_type, file_path, file_size, mime_type, created_at, valid_until")
          .eq("company_id", member.company_id)
          .order("created_at", { ascending: false });
        if (docs) setDocuments(docs);
      }
    })();
  }, [detailId, selected]);

  const filtered = useMemo(() => {
    let result = cards;
    if (days != null) {
      result = result.filter((c) => daysAgo(c.created_at) <= days);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((c) =>
        (c.company_name ?? "").toLowerCase().includes(q) ||
        c.user_email.toLowerCase().includes(q) ||
        (c.user_name ?? "").toLowerCase().includes(q) ||
        c.provider_names.some((p) => p.toLowerCase().includes(q))
      );
    }
    return result;
  }, [cards, days, search]);

  const openDetail = useCallback((card: KanbanCard) => {
    const key = card.inquiry_id ?? card.user_id;
    router.push(`/admin/anfragen?id=${key}`);
  }, [router]);

  const closeDetail = useCallback(() => {
    router.push("/admin/anfragen");
  }, [router]);

  // ── Detail view ──
  if (selected) {
    return (
      <>
        <div className="admin-page-header" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button onClick={closeDetail} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-subtle)", display: "flex", padding: 0 }}>
            <ArrowLeft style={{ width: "1.25rem", height: "1.25rem" }} />
          </button>
          <h1 className="admin-page-title" style={{ margin: 0 }}>
            {selected.company_name ?? selected.user_name ?? selected.user_email}
          </h1>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(12rem, 1fr))", gap: "0.75rem", marginBottom: "2rem" }}>
          <InfoCard icon={Building2} label="Unternehmen" value={selected.company_name ?? "–"} />
          <InfoCard icon={User} label="Kontakt" value={selected.user_name || selected.user_email} />
          <InfoCard icon={Banknote} label="Volumen" value={selected.volume ? formatCurrency(selected.volume) : "–"} />
          <InfoCard icon={Clock} label="Laufzeit" value={selected.term_months ? `${selected.term_months} Monate` : "–"} />
          <InfoCard icon={FileText} label="Zweck" value={selected.purpose ?? "–"} />
        </div>

        {/* User & Company details — kompakt, 2-Spalten nebeneinander */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem", marginBottom: "1.5rem" }}>
          {userDetail && (() => {
            const supabase = createClient();
            const meta = (userDetail.metadata as Record<string, unknown>) || {};
            const saveUser = async (field: string, val: string) => {
              await supabase.from("users").update({ [field]: val || null }).eq("id", userDetail.id as string);
              setUserDetail(prev => prev ? { ...prev, [field]: val || null } : prev);
            };
            const saveUserMeta = async (metaField: string, val: string) => {
              const newMeta = { ...meta, [metaField]: val || null };
              await supabase.from("users").update({ metadata: newMeta }).eq("id", userDetail.id as string);
              setUserDetail(prev => prev ? { ...prev, metadata: newMeta } : prev);
            };
            const fullName = [userDetail.first_name, userDetail.last_name].filter(Boolean).join(" ") || "—";

            return (
              <section className="admin-chart-card" style={{ display: "flex", flexDirection: "column", minWidth: 0, padding: "0.875rem 1rem" }}>
                <header style={{ display: "flex", alignItems: "center", gap: "0.5rem", paddingBottom: "0.375rem", marginBottom: "0.25rem", minWidth: 0 }}>
                  <User style={{ width: "0.875rem", height: "0.875rem", color: "var(--color-subtle)", flexShrink: 0 }} />
                  <h3 style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--color-subtle)", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0, flexShrink: 0 }}>Nutzer</h3>
                  <span style={{ marginLeft: "auto", fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-dark)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>{fullName}</span>
                </header>
                <InlineField label="Vorname" value={userDetail.first_name as string} onSave={v => saveUser("first_name", v)} />
                <InlineField label="Nachname" value={userDetail.last_name as string} onSave={v => saveUser("last_name", v)} />
                <InlineField label="E-Mail" value={userDetail.email as string} onSave={v => saveUser("email", v)} type="email" />
                <InlineField label="Telefon" value={userDetail.phone as string} onSave={v => saveUser("phone", v)} type="tel" />
                <InlineField label="Geburtsdatum" value={meta.date_of_birth as string} onSave={v => saveUserMeta("date_of_birth", v)} type="date" />
                <InlineField label="Straße" value={meta.street as string} onSave={v => saveUserMeta("street", v)} />
                <InlineField label="PLZ / Stadt" value={[meta.zip, meta.city].filter(Boolean).join(" ") as string}
                  onSave={async v => {
                    const [zip, ...rest] = v.split(" ");
                    await saveUserMeta("zip", zip || "");
                    await saveUserMeta("city", rest.join(" ") || "");
                  }} />
              </section>
            );
          })()}

          {!companyDetail && selected && (
            <CompanyEmptyState userId={selected.user_id} onCreated={(c) => setCompanyDetail(c)} />
          )}
          {companyDetail && (() => {
            const supabase = createClient();
            const addr = (companyDetail.address as Record<string, string>) || {};
            const saveCompany = async (field: string, val: string) => {
              const update: Record<string, unknown> = { [field]: val || null };
              if (field === "annual_revenue") update[field] = val ? parseInt(val) : null;
              await supabase.from("companies").update(update).eq("id", companyDetail.id as string);
              setCompanyDetail(prev => prev ? { ...prev, [field]: update[field] } : prev);
            };
            const saveAddress = async (addrField: string, val: string) => {
              const newAddr = { ...addr, [addrField]: val || "" };
              await supabase.from("companies").update({ address: newAddr }).eq("id", companyDetail.id as string);
              setCompanyDetail(prev => prev ? { ...prev, address: newAddr } : prev);
            };
            const headline = [companyDetail.name, companyDetail.legal_form].filter(Boolean).join(" ") || "—";

            return (
              <section className="admin-chart-card" style={{ display: "flex", flexDirection: "column", minWidth: 0, padding: "0.875rem 1rem" }}>
                <header style={{ display: "flex", alignItems: "center", gap: "0.5rem", paddingBottom: "0.375rem", marginBottom: "0.25rem", minWidth: 0 }}>
                  <Building2 style={{ width: "0.875rem", height: "0.875rem", color: "var(--color-subtle)", flexShrink: 0 }} />
                  <h3 style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--color-subtle)", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0, flexShrink: 0 }}>Unternehmen</h3>
                  <span style={{ marginLeft: "auto", fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-dark)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>{headline as string}</span>
                </header>
                <InlineField label="Name" value={companyDetail.name as string} onSave={v => saveCompany("name", v)} />
                <InlineField label="Rechtsform" value={companyDetail.legal_form as string} onSave={v => saveCompany("legal_form", v)} />
                <InlineField label="HRB" value={companyDetail.hrb as string} onSave={v => saveCompany("hrb", v)} />
                <InlineField label="USt-IdNr." value={companyDetail.ust_id as string} onSave={v => saveCompany("ust_id", v)} />
                <InlineField label="Crefo" value={companyDetail.crefo as string} onSave={v => saveCompany("crefo", v)} />
                <InlineField label="Branche" value={companyDetail.industry as string} onSave={v => saveCompany("industry", v)} />
                <InlineField label="Jahresumsatz" value={companyDetail.annual_revenue as number} onSave={v => saveCompany("annual_revenue", v)} type="number" />
                <InlineField label="Website" value={companyDetail.website as string} onSave={v => saveCompany("website", v)} />
                <InlineField label="Straße" value={addr.street} onSave={v => saveAddress("street", v)} />
                <InlineField label="PLZ / Stadt" value={[addr.zip, addr.city].filter(Boolean).join(" ")}
                  onSave={async v => {
                    const [zip, ...rest] = v.split(" ");
                    await saveAddress("zip", zip || "");
                    await saveAddress("city", rest.join(" ") || "");
                  }} />
              </section>
            );
          })()}
        </div>

        <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-dark)", fontFamily: "var(--font-heading)", marginBottom: "1rem" }}>
          Anträge bei Anbietern ({applications.length})
        </h2>

        {detailLoading ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "var(--color-subtle)", fontSize: "0.875rem" }}>Laden...</div>
        ) : applications.length === 0 ? (
          <div className="admin-chart-card" style={{ textAlign: "center", padding: "2rem", color: "var(--color-subtle)", fontSize: "0.875rem" }}>
            Noch keine Anträge an Anbieter übermittelt.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {applications.map((app) => {
              const st = STATUS_CONFIG[app.status] ?? { label: app.status, color: "#243650", bg: "rgba(80,122,166,0.1)" };
              const extRef = app.metadata?.external_ref as string | undefined;
              const extUrl = app.metadata?.external_url as string | undefined;
              return (
                <div key={app.application_id} className="admin-chart-card" style={{ padding: "1.25rem" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                    <div>
                      <span style={{ fontWeight: 700, color: "var(--color-dark)", fontSize: "0.9375rem" }}>{app.provider_name}</span>
                      <span style={{ color: "var(--color-subtle)", fontSize: "0.8125rem", marginLeft: "0.5rem" }}>{app.product_name}</span>
                    </div>
                    <span style={{ padding: "0.125rem 0.625rem", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: 600, color: st.color, background: st.bg }}>
                      {st.label}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "2rem", fontSize: "0.8125rem", color: "var(--color-subtle)", flexWrap: "wrap" }}>
                    <span>{formatCurrency(app.volume)}</span>
                    <span>{app.term_months} Mon.</span>
                    <span>Erstellt: {formatDate(app.created_at)}</span>
                    {app.updated_at !== app.created_at && <span>Update: {formatDate(app.updated_at)}</span>}
                  </div>
                  {(extRef || extUrl) && (
                    <div style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "var(--color-subtle)" }}>
                      {extRef && <span>Ref: {extRef}</span>}
                      {extUrl && (
                        <a href={extUrl} target="_blank" rel="noopener noreferrer" style={{ marginLeft: extRef ? "1rem" : 0, color: "var(--color-turquoise)", textDecoration: "underline" }}>
                          Beim Anbieter öffnen
                        </a>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Documents section */}
        {documents.length > 0 && (
          <>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-dark)", fontFamily: "var(--font-heading)", marginBottom: "1rem", marginTop: "2rem" }}>
              Dokumente ({documents.length})
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {documents.map((doc) => {
                const isExpired = doc.valid_until && new Date(doc.valid_until) < new Date();
                const docTypeLabels: Record<string, string> = {
                  bank_statement: "Kontoauszug",
                  bwa_susa: "BWA + SuSa",
                  annual_report: "Jahresabschluss",
                  tax_assessment: "Einkommenssteuerbescheid",
                  asset_statement: "Vermögensaufstellung",
                  profit_determination: "Gewinnermittlung",
                };
                return (
                  <div key={doc.id} className="admin-chart-card" style={{ padding: "0.75rem 1rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <FileText style={{ width: "1rem", height: "1rem", color: "var(--color-subtle)", flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-dark)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {doc.name}
                      </p>
                      <p style={{ fontSize: "0.6875rem", color: "var(--color-subtle)" }}>
                        {docTypeLabels[doc.doc_type || ""] || doc.doc_type || "Sonstiges"}
                        {doc.file_size ? ` · ${(doc.file_size / 1024 / 1024).toFixed(1)} MB` : ""}
                        {" · "}{formatDate(doc.created_at)}
                      </p>
                    </div>
                    {doc.valid_until && (
                      <span style={{
                        fontSize: "0.625rem", fontWeight: 600, padding: "0.125rem 0.5rem", borderRadius: "999px",
                        color: isExpired ? "rgba(220,38,38,0.8)" : "var(--color-turquoise)",
                        background: isExpired ? "rgba(220,38,38,0.08)" : "rgba(80,122,166,0.08)",
                        whiteSpace: "nowrap",
                      }}>
                        {isExpired ? "Abgelaufen" : `Gültig bis ${formatDate(doc.valid_until)}`}
                      </span>
                    )}
                    <button type="button" onClick={async () => {
                        const supabase = createClient();
                        const { data } = await supabase.storage.from("documents").createSignedUrl(doc.file_path, 300);
                        if (data?.signedUrl) window.open(data.signedUrl, "_blank");
                      }}
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.6875rem", color: "var(--color-turquoise)", textDecoration: "underline", whiteSpace: "nowrap", flexShrink: 0, padding: 0 }}>
                      Öffnen
                    </button>
                    <button type="button" onClick={async () => {
                        if (!confirm(`"${doc.name}" wirklich löschen?`)) return;
                        const supabase = createClient();
                        await supabase.storage.from("documents").remove([doc.file_path]);
                        await supabase.from("documents").delete().eq("id", doc.id);
                        setDocuments(prev => prev.filter(d => d.id !== doc.id));
                      }}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-subtle)", padding: 0, flexShrink: 0, display: "flex" }}>
                      <Trash2 style={{ width: "0.75rem", height: "0.75rem" }} />
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Sent emails section — immer sichtbar, mit Empty-State und Send-Button */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "2rem", marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-dark)", fontFamily: "var(--font-heading)", margin: 0 }}>
            Versendete E-Mails {sentEmails.length > 0 && `(${sentEmails.length})`}
          </h2>
          <button onClick={() => setShowSendModal(true)}
                  style={{ padding: "0.5rem 0.875rem", borderRadius: "0.5rem", border: "1px solid var(--color-turquoise)", background: "var(--color-turquoise)", color: "#fff", fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.375rem" }}>
            <Send style={{ width: "0.875rem", height: "0.875rem" }} /> E-Mail senden
          </button>
        </div>

        {sentEmails.length === 0 ? (
          <div className="admin-chart-card" style={{ padding: "2rem", textAlign: "center" }}>
            <Send style={{ width: "1.5rem", height: "1.5rem", color: "var(--color-border)", margin: "0 auto 0.5rem" }} />
            <p style={{ fontSize: "0.875rem", color: "var(--color-subtle)", margin: 0 }}>
              Noch keine E-Mails an diesen Lead versendet.
            </p>
            <p style={{ fontSize: "0.75rem", color: "var(--color-border)", marginTop: "0.25rem" }}>
              Klick „E-Mail senden" oben um eine Mail aus deinen Templates zu schicken.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {sentEmails.map((email) => {
              const statusColor =
                email.status === "sent"   ? "rgba(34, 197, 94, 0.8)"  :
                email.status === "failed" ? "rgba(220, 38, 38, 0.8)"  :
                                            "rgba(107, 114, 128, 0.8)";
              const kindLabel: Record<string, string> = {
                workflow:      "Auto",
                manual:        "Manuell",
                test:          "Test",
                transactional: "System",
              };
              return (
                <div key={email.id} className="admin-chart-card" style={{ padding: "0.75rem 1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <Send style={{ width: "1rem", height: "1rem", color: "var(--color-subtle)", flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-dark)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {email.subject || <em>(kein Betreff)</em>}
                      </p>
                      <p style={{ fontSize: "0.6875rem", color: "var(--color-subtle)" }}>
                        → {email.recipient_email}
                        {email.template_slug ? ` · ${email.template_slug}` : ""}
                        {" · "}{formatDate(email.sent_at)}
                      </p>
                    </div>
                    <span style={{ fontSize: "0.625rem", fontWeight: 600, padding: "0.125rem 0.5rem", borderRadius: "999px", color: "var(--color-subtle)", background: "rgba(107,114,128,0.08)", whiteSpace: "nowrap" }}>
                      {kindLabel[email.trigger_kind] ?? email.trigger_kind}
                    </span>
                    <span style={{ fontSize: "0.625rem", fontWeight: 600, padding: "0.125rem 0.5rem", borderRadius: "999px", color: statusColor, background: "rgba(0,0,0,0.04)", whiteSpace: "nowrap" }}>
                      {email.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {showSendModal && selected && (
          <SendEmailModal
            entity={selected.inquiry_id ? { type: "inquiries", id: selected.inquiry_id } : { type: "users", id: selected.user_id }}
            recipientEmail={(userDetail?.email as string) || selected.user_email || ""}
            onClose={() => setShowSendModal(false)}
            onSent={async () => {
              setShowSendModal(false);
              // Refresh sent_emails Liste
              const supabase = createClient();
              const { data: { session } } = await supabase.auth.getSession();
              const token = session?.access_token;
              if (!token) return;
              const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/workflow-rules-admin`, {
                method: "POST",
                headers: { "content-type": "application/json", apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, authorization: `Bearer ${token}` },
                body: JSON.stringify({
                  resource: "sent_email", action: "list_by_lead",
                  data: { inquiry_id: selected.inquiry_id, user_id: selected.user_id },
                }),
              });
              if (res.ok) {
                const json = await res.json();
                setSentEmails(json.sent_emails ?? []);
              }
            }}
          />
        )}
      </>
    );
  }

  // ── Kanban view ──
  return (
    <>
      <div className="admin-page-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
        <h1 className="admin-page-title" style={{ margin: 0 }}>Anfragen</h1>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <Search style={{ position: "absolute", left: "0.625rem", top: "50%", transform: "translateY(-50%)", width: "0.875rem", height: "0.875rem", color: "var(--color-border)" }} />
            <input
              type="text"
              placeholder="Suche…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="admin-input"
              style={{ paddingLeft: "2rem", fontSize: "0.8125rem", minWidth: "12rem" }}
            />
          </div>
          <DateFilter days={days} onChange={setDays} />
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "16rem", color: "var(--color-subtle)", fontSize: "0.875rem" }}>
          Laden...
        </div>
      ) : (
        <div className="kanban-board">
          {COLUMNS.map((col) => {
            const colCards = filtered.filter((c) => c.kanban_status === col.key);
            const Icon = col.icon;
            return (
              <div key={col.key} className="kanban-column">
                <div className="kanban-column-header">
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Icon style={{ width: "0.875rem", height: "0.875rem", color: col.color }} />
                    <span className="kanban-column-title">{col.label}</span>
                  </div>
                  <span className="kanban-column-count">{colCards.length}</span>
                </div>
                <div className="kanban-column-body">
                  {colCards.length === 0 ? (
                    <div className="kanban-empty">Keine</div>
                  ) : (
                    colCards.map((card) => (
                      <div key={card.inquiry_id ?? card.user_id} onClick={() => openDetail(card)}>
                        <KanbanCardItem card={card} />
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

/* ── Sub-components ── */

function KanbanCardItem({ card }: { card: KanbanCard }) {
  const displayName = card.company_name || card.user_name || card.user_email;
  const contactLine = card.company_name
    ? (card.user_name || card.user_email)
    : (card.user_name ? card.user_email : null);

  return (
    <div className="kanban-card">
      <div className="kanban-card-header">
        <span className="kanban-card-name">{displayName}</span>
        <span className="kanban-card-time">{timeAgo(card.created_at)}</span>
      </div>
      {contactLine && (
        <div className="kanban-card-detail">{contactLine}</div>
      )}
      {card.volume != null && card.volume > 0 && (
        <div className="kanban-card-detail" style={{ marginTop: "0.25rem" }}>
          {formatCurrency(card.volume)}
          {card.term_months ? ` · ${card.term_months} Mon.` : ""}
          {card.purpose ? ` · ${card.purpose}` : ""}
        </div>
      )}
      {card.application_count > 0 && (
        <div className="kanban-card-providers">
          {card.provider_names.map((p) => (
            <span key={p} className="kanban-card-provider">{p}</span>
          ))}
          {card.application_count > card.provider_names.length && (
            <span className="kanban-card-provider">{card.application_count} Anträge</span>
          )}
        </div>
      )}
    </div>
  );
}

function InfoCard({ icon: Icon, label, value }: { icon: typeof Building2; label: string; value: string }) {
  return (
    <div className="admin-kpi-card" style={{ padding: "1rem 1.25rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem" }}>
        <Icon style={{ width: "0.875rem", height: "0.875rem", color: "var(--color-turquoise)" }} />
        <span style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--color-subtle)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</span>
      </div>
      <span style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--color-dark)" }}>{value}</span>
    </div>
  );
}
