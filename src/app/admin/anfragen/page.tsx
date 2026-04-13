"use client";

import { useEffect, useState } from "react";
import { User, FileText, Send, Gift, CheckCircle, XCircle, ArrowLeft, Building2, Banknote, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase";

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

/* ── Main Page ── */

export default function AnfragenPage() {
  const [cards, setCards] = useState<KanbanCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<KanbanCard | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.rpc("admin_get_kanban_inquiries").then(({ data, error }) => {
      if (error) console.error("[Kanban]", error.message);
      setCards(data ?? []);
      setLoading(false);
    });
  }, []);

  function openDetail(card: KanbanCard) {
    if (!card.inquiry_id) return;
    setSelected(card);
    setDetailLoading(true);
    const supabase = createClient();
    supabase.rpc("admin_get_inquiry_detail", { p_inquiry_id: card.inquiry_id }).then(({ data }) => {
      setApplications(data ?? []);
      setDetailLoading(false);
    });
  }

  function closeDetail() {
    setSelected(null);
    setApplications([]);
  }

  // Detail view
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
      </>
    );
  }

  // Kanban view
  return (
    <>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Anfragen</h1>
      </div>

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "16rem", color: "var(--color-subtle)", fontSize: "0.875rem" }}>
          Laden...
        </div>
      ) : (
        <div className="kanban-board">
          {COLUMNS.map((col) => {
            const colCards = cards.filter((c) => c.kanban_status === col.key);
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
  return (
    <div className="kanban-card">
      <div className="kanban-card-header">
        <span className="kanban-card-name">
          {card.company_name ?? card.user_name ?? card.user_email}
        </span>
        <span className="kanban-card-time">{timeAgo(card.created_at)}</span>
      </div>
      {card.volume && (
        <div className="kanban-card-detail">
          {formatCurrency(card.volume)}
          {card.term_months ? ` · ${card.term_months} Mon.` : ""}
          {card.purpose ? ` · ${card.purpose}` : ""}
        </div>
      )}
      {card.provider_names.length > 0 && (
        <div className="kanban-card-providers">
          {card.provider_names.map((p) => (
            <span key={p} className="kanban-card-provider">{p}</span>
          ))}
        </div>
      )}
      {!card.volume && card.user_email && (
        <div className="kanban-card-detail">{card.user_email}</div>
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
