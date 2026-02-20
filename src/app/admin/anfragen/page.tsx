"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

interface Inquiry {
  id: string;
  company_name: string | null;
  volume: number;
  term_months: number | null;
  purpose: string | null;
  status: string;
  created_at: string;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
  }).format(value);
}

const statusLabels: Record<string, { label: string; className: string }> = {
  new: { label: "Neu", className: "admin-status-active" },
  in_progress: { label: "In Bearbeitung", className: "admin-status-active" },
  completed: { label: "Abgeschlossen", className: "admin-status-active" },
  rejected: { label: "Abgelehnt", className: "admin-status-inactive" },
};

export default function AnfragenPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInquiries() {
      const supabase = createClient();
      const { data } = await supabase
        .from("inquiries")
        .select("id, company_name, volume, term_months, purpose, status, created_at")
        .order("created_at", { ascending: false });

      setInquiries(data ?? []);
      setLoading(false);
    }

    fetchInquiries();
  }, []);

  return (
    <>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Anfragen</h1>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Unternehmen</th>
              <th>Volumen</th>
              <th>Laufzeit</th>
              <th>Zweck</th>
              <th>Status</th>
              <th>Erstellt</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center text-subtle py-8">
                  Laden...
                </td>
              </tr>
            ) : inquiries.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="admin-empty">
                    <p className="admin-empty-title">Keine Anfragen</p>
                    <p>Es sind noch keine Finanzierungsanfragen eingegangen.</p>
                  </div>
                </td>
              </tr>
            ) : (
              inquiries.map((inquiry) => {
                const statusInfo = statusLabels[inquiry.status] ?? {
                  label: inquiry.status,
                  className: "",
                };
                return (
                  <tr key={inquiry.id}>
                    <td className="font-semibold">
                      {inquiry.company_name ?? "–"}
                    </td>
                    <td>{formatCurrency(inquiry.volume)}</td>
                    <td>
                      {inquiry.term_months
                        ? `${inquiry.term_months} Mon.`
                        : "–"}
                    </td>
                    <td className="text-subtle">{inquiry.purpose ?? "–"}</td>
                    <td>
                      <span className={`admin-status ${statusInfo.className}`}>
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="text-subtle text-sm">
                      {formatDate(inquiry.created_at)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
