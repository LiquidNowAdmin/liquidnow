"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Sparkles, ClipboardList, Send, Gift, FileSignature, CheckCircle, XCircle, Banknote, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { KanbanBoard, type KanbanColumn } from "@/components/admin/KanbanBoard";

type Status =
  | "new" | "product_selected" | "inquired"
  | "offer_received" | "offer_accepted" | "signed"
  | "closed" | "rejected";

interface BankApplication {
  application_id: string;
  status: Status;
  inquiry_id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  company_name: string | null;
  provider_name: string;
  product_name: string;
  volume: number | null;
  term_months: number | null;
  external_ref: string | null;
  external_url: string | null;
  created_at: string;
  updated_at: string;
}

const COLUMNS: KanbanColumn<Status>[] = [
  { key: "new",              label: "Neu",                 icon: Sparkles,      color: "#A8C9DD" },
  { key: "product_selected", label: "Produkt gewählt",     icon: ClipboardList, color: "#507AA6" },
  { key: "inquired",         label: "Eingereicht",         icon: Send,          color: "#6D9EC8" },
  { key: "offer_received",   label: "Angebot erhalten",    icon: Gift,          color: "#d97706" },
  { key: "offer_accepted",   label: "Angebot angenommen",  icon: CheckCircle,   color: "#9BAA28" },
  { key: "signed",           label: "Vertrag unterschr.",  icon: FileSignature, color: "#16a34a" },
  { key: "closed",           label: "Ausgezahlt",          icon: Banknote,      color: "#16a34a" },
  { key: "rejected",         label: "Abgelehnt",           icon: XCircle,       color: "#DC2626" },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", minimumFractionDigits: 0 }).format(value);
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

export default function BankAntragsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<BankApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);

  async function load() {
    const sb = createClient();
    const { data, error } = await sb.rpc("admin_get_kanban_applications");
    if (error) {
      setToast({ kind: "err", msg: error.message });
      setRows([]);
    } else {
      setRows((data as BankApplication[]) ?? []);
    }
    setLoading(false);
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(id);
  }, [toast]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      r.user_email?.toLowerCase().includes(q) ||
      r.user_name?.toLowerCase().includes(q) ||
      (r.company_name ?? "").toLowerCase().includes(q) ||
      r.provider_name?.toLowerCase().includes(q) ||
      r.product_name?.toLowerCase().includes(q) ||
      (r.external_ref ?? "").toLowerCase().includes(q)
    );
  }, [rows, query]);

  const cards = useMemo(
    () => filtered.map((r) => ({ id: r.application_id, column: r.status, data: r })),
    [filtered]
  );

  async function moveApplication(id: string, toColumn: Status): Promise<boolean> {
    const sb = createClient();
    const { error } = await sb.rpc("change_application_status", {
      p_application_id: id,
      p_new_status: toColumn,
      p_note: "Manuell via Bank-Anträge-Pipeline",
    });
    if (error) {
      setToast({ kind: "err", msg: `Status-Wechsel abgelehnt: ${error.message}` });
      return false;
    }
    setToast({ kind: "ok", msg: "Status geändert." });
    // Server-State syncen: lokal updaten (vermeidet Refetch-Flicker)
    setRows((prev) =>
      prev.map((r) => (r.application_id === id ? { ...r, status: toColumn, updated_at: new Date().toISOString() } : r))
    );
    return true;
  }

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Bank-Anträge</h1>
          <p style={{ marginTop: "0.25rem", fontSize: "0.8125rem", color: "var(--color-subtle)" }}>
            Pro Karte ein Antrag bei einem Anbieter. Drag &amp; Drop ändert den Status.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{ position: "relative" }}>
            <Search style={{ position: "absolute", left: "0.625rem", top: "50%", transform: "translateY(-50%)", width: "0.875rem", height: "0.875rem", color: "var(--color-subtle)" }} />
            <input
              type="search"
              placeholder="Suche Firma / Anbieter / Referenz"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="admin-input"
              style={{ paddingLeft: "2rem", fontSize: "0.8125rem", minWidth: "16rem" }}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "16rem", color: "var(--color-subtle)", fontSize: "0.875rem" }}>
          Laden...
        </div>
      ) : (
        <KanbanBoard<BankApplication, Status>
          columns={COLUMNS}
          cards={cards}
          renderCard={(a) => <BankCard a={a} />}
          onCardClick={(id) => {
            const row = rows.find((r) => r.application_id === id);
            if (row?.inquiry_id) router.push(`/admin/anfragen?id=${row.inquiry_id}`);
          }}
          onCardMove={moveApplication}
        />
      )}

      {toast && (
        <div
          role="status"
          style={{
            position: "fixed", bottom: "1.5rem", right: "1.5rem", zIndex: 50,
            padding: "0.75rem 1rem", borderRadius: "0.5rem",
            background: toast.kind === "ok" ? "rgba(22,163,74,0.95)" : "rgba(220,38,38,0.95)",
            color: "white", fontSize: "0.8125rem", fontWeight: 500,
            boxShadow: "0 8px 24px rgba(36,54,80,0.18)",
            maxWidth: "24rem",
          }}
        >
          {toast.msg}
        </div>
      )}
    </>
  );
}

function BankCard({ a }: { a: BankApplication }) {
  const headline = a.company_name || a.user_name || a.user_email;
  return (
    <div className="kanban-card">
      <div className="kanban-card-header">
        <span className="kanban-card-name">{headline}</span>
        <span className="kanban-card-time">{timeAgo(a.updated_at)}</span>
      </div>
      <div className="kanban-card-detail">
        <span style={{ fontWeight: 600 }}>{a.provider_name}</span>
        {a.product_name ? ` · ${a.product_name}` : null}
      </div>
      {a.volume != null && a.volume > 0 && (
        <div className="kanban-card-detail" style={{ marginTop: "0.25rem" }}>
          {formatCurrency(a.volume)}
          {a.term_months ? ` · ${a.term_months} Mon.` : ""}
        </div>
      )}
      {a.external_ref && (
        <div className="kanban-card-detail" style={{ marginTop: "0.25rem", display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.6875rem" }}>
          <span style={{ color: "var(--color-subtle)" }}>Ref:</span>
          <span style={{ fontFamily: "ui-monospace,monospace" }}>{a.external_ref}</span>
          {a.external_url && (
            <a href={a.external_url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} aria-label="Beim Anbieter öffnen">
              <ExternalLink style={{ width: "0.75rem", height: "0.75rem" }} />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
