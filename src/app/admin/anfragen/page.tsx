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

function AnfragenContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const detailId = searchParams.get("id");

  const [cards, setCards] = useState<KanbanCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [documents, setDocuments] = useState<Array<{ id: string; name: string; doc_type: string | null; file_path: string; file_size: number | null; mime_type: string | null; created_at: string; valid_until: string | null }>>([]);
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

  // Load documents for the company
  useEffect(() => {
    if (!detailId || !selected) { setDocuments([]); return; }
    const supabase = createClient();
    // Get company_id from one of the applications, then load documents
    supabase.rpc("admin_get_inquiry_detail", { p_inquiry_id: selected.inquiry_id }).then(async ({ data: apps }) => {
      if (!apps?.length) return;
      // Load documents for this company via applications
      const appIds = apps.map((a: Application) => a.application_id);
      const { data: docs } = await supabase
        .from("documents")
        .select("id, name, doc_type, file_path, file_size, mime_type, created_at, valid_until")
        .order("created_at", { ascending: false });
      if (docs) setDocuments(docs);
    });
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
