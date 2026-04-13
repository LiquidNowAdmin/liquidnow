"use client";

import { useEffect, useState } from "react";
import { User, FileText, Send, Gift, CheckCircle, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase";
import Link from "next/link";

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

const COLUMNS = [
  { key: "account_created", label: "Account erstellt", icon: User, color: "#A8C9DD" },
  { key: "inquiry_created", label: "Anfrage erstellt", icon: FileText, color: "#507AA6" },
  { key: "submitted", label: "Abgesendet", icon: Send, color: "#6D9EC8" },
  { key: "offer", label: "Angebot", icon: Gift, color: "#9BAA28" },
  { key: "closed", label: "Abgeschlossen", icon: CheckCircle, color: "#16a34a" },
  { key: "rejected", label: "Abgelehnt", icon: XCircle, color: "#DC2626" },
] as const;

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

export default function AnfragenPage() {
  const [cards, setCards] = useState<KanbanCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.rpc("admin_get_kanban_inquiries").then(({ data, error }) => {
      if (error) console.error("[Kanban]", error.message);
      setCards(data ?? []);
      setLoading(false);
    });
  }, []);

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
                      <KanbanCardItem key={card.inquiry_id ?? card.user_id} card={card} />
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

function KanbanCardItem({ card }: { card: KanbanCard }) {
  const content = (
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

  if (card.inquiry_id) {
    return <Link href={`/admin/anfragen/${card.inquiry_id}`} style={{ textDecoration: "none", color: "inherit" }}>{content}</Link>;
  }
  return content;
}
