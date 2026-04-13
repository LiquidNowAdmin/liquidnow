"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Building2, User as UserIcon, Banknote, Clock, FileText } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

interface InquiryInfo {
  id: string;
  company_name: string | null;
  volume: number;
  term_months: number | null;
  purpose: string | null;
  status: string;
  created_at: string;
  user_email: string;
  user_name: string;
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

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  new: { label: "Neu", color: "#243650", bg: "rgba(80,122,166,0.1)" },
  inquired: { label: "In Prüfung", color: "#6B7A0F", bg: "rgba(155,170,40,0.12)" },
  signed: { label: "Angebot", color: "#16a34a", bg: "rgba(22,163,74,0.1)" },
  closed: { label: "Abgeschlossen", color: "#16a34a", bg: "rgba(22,163,74,0.1)" },
  rejected: { label: "Abgelehnt", color: "#DC2626", bg: "rgba(220,38,38,0.08)" },
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", minimumFractionDigits: 0 }).format(value);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function InquiryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [inquiry, setInquiry] = useState<InquiryInfo | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const supabase = createClient();

    Promise.all([
      supabase
        .from("inquiries")
        .select("id, company_name, volume, term_months, purpose, status, created_at, user_id")
        .eq("id", id)
        .maybeSingle(),
      supabase.rpc("admin_get_inquiry_detail", { p_inquiry_id: id }),
    ]).then(async ([inquiryRes, appsRes]) => {
      if (inquiryRes.data) {
        // Fetch user info
        const { data: userData } = await supabase
          .from("users")
          .select("email, first_name, last_name")
          .eq("id", inquiryRes.data.user_id)
          .maybeSingle();

        setInquiry({
          ...inquiryRes.data,
          user_email: userData?.email ?? "",
          user_name: `${userData?.first_name ?? ""} ${userData?.last_name ?? ""}`.trim(),
        });
      }
      setApplications(appsRes.data ?? []);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "16rem", color: "var(--color-subtle)", fontSize: "0.875rem" }}>
        Laden...
      </div>
    );
  }

  if (!inquiry) {
    return (
      <div style={{ textAlign: "center", padding: "3rem", color: "var(--color-subtle)" }}>
        Anfrage nicht gefunden.
      </div>
    );
  }

  return (
    <>
      <div className="admin-page-header" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <Link href="/admin/anfragen" style={{ color: "var(--color-subtle)", display: "flex" }}>
          <ArrowLeft style={{ width: "1.25rem", height: "1.25rem" }} />
        </Link>
        <h1 className="admin-page-title" style={{ margin: 0 }}>
          {inquiry.company_name ?? "Anfrage"}
        </h1>
      </div>

      {/* Info cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(14rem, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        <InfoCard icon={Building2} label="Unternehmen" value={inquiry.company_name ?? "–"} />
        <InfoCard icon={UserIcon} label="Kontakt" value={inquiry.user_name || inquiry.user_email} />
        <InfoCard icon={Banknote} label="Volumen" value={formatCurrency(inquiry.volume)} />
        <InfoCard icon={Clock} label="Laufzeit" value={inquiry.term_months ? `${inquiry.term_months} Monate` : "–"} />
        <InfoCard icon={FileText} label="Zweck" value={inquiry.purpose ?? "–"} />
      </div>

      {/* Applications */}
      <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-dark)", fontFamily: "var(--font-heading)", marginBottom: "1rem" }}>
        Anträge bei Anbietern ({applications.length})
      </h2>

      {applications.length === 0 ? (
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
                <div style={{ display: "flex", gap: "2rem", fontSize: "0.8125rem", color: "var(--color-subtle)" }}>
                  <span>{formatCurrency(app.volume)}</span>
                  <span>{app.term_months} Mon.</span>
                  <span>Erstellt: {formatDate(app.created_at)}</span>
                  {app.updated_at !== app.created_at && <span>Update: {formatDate(app.updated_at)}</span>}
                </div>
                {(extRef || extUrl) && (
                  <div style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "var(--color-subtle)" }}>
                    {extRef && <span>Ref: {extRef}</span>}
                    {extUrl && (
                      <a href={extUrl} target="_blank" rel="noopener noreferrer" style={{ marginLeft: "1rem", color: "var(--color-turquoise)", textDecoration: "underline" }}>
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
