"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  Package,
  FileText,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import FunnelChart from "./components/FunnelChart";

interface DashboardStats {
  total_providers: number;
  active_providers: number;
  total_products: number;
  active_products: number;
  total_inquiries: number;
  total_companies: number;
}

const DAY_OPTIONS = [7, 30, 90] as const;

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [funnelDays, setFunnelDays] = useState<number>(30);

  useEffect(() => {
    async function fetchStats() {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("admin_get_dashboard_stats");

      if (!error && data && data.length > 0) {
        setStats(data[0]);
      }
      setLoading(false);
    }

    fetchStats();
  }, []);

  return (
    <>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Dashboard</h1>
      </div>

      <div className="admin-kpi-grid">
        <div className="admin-kpi-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="icon-box icon-box-sm icon-box-turquoise">
              <Building2 className="h-5 w-5 text-turquoise" />
            </div>
            <span className="admin-kpi-label">Anbieter</span>
          </div>
          <div className="admin-kpi-value">
            {loading ? "–" : stats?.total_providers ?? 0}
          </div>
          <div className="admin-kpi-sub">
            {loading
              ? ""
              : `${stats?.active_providers ?? 0} aktiv · ${(stats?.total_providers ?? 0) - (stats?.active_providers ?? 0)} inaktiv`}
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="icon-box icon-box-sm icon-box-turquoise">
              <Package className="h-5 w-5 text-turquoise" />
            </div>
            <span className="admin-kpi-label">Produkte</span>
          </div>
          <div className="admin-kpi-value">
            {loading ? "–" : stats?.total_products ?? 0}
          </div>
          <div className="admin-kpi-sub">
            {loading
              ? ""
              : `${stats?.active_products ?? 0} aktiv · ${(stats?.total_products ?? 0) - (stats?.active_products ?? 0)} inaktiv`}
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="icon-box icon-box-sm icon-box-gold">
              <FileText className="h-5 w-5 text-gold-dark" />
            </div>
            <span className="admin-kpi-label">Anfragen</span>
          </div>
          <div className="admin-kpi-value">
            {loading ? "–" : stats?.total_inquiries ?? 0}
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="icon-box icon-box-sm icon-box-gold">
              <Users className="h-5 w-5 text-gold-dark" />
            </div>
            <span className="admin-kpi-label">Unternehmen</span>
          </div>
          <div className="admin-kpi-value">
            {loading ? "–" : stats?.total_companies ?? 0}
          </div>
        </div>
      </div>

      {/* Funnel Waterfall */}
      <div style={{ marginTop: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--color-dark)", fontFamily: "var(--font-heading)" }}>
            Marketing Funnel
          </h2>
          <div style={{ display: "flex", gap: "0.25rem" }}>
            {DAY_OPTIONS.map((d) => (
              <button
                key={d}
                onClick={() => setFunnelDays(d)}
                className={`admin-date-filter${funnelDays === d ? " admin-date-filter-active" : ""}`}
              >
                {d} Tage
              </button>
            ))}
          </div>
        </div>
        <FunnelChart days={funnelDays} />
      </div>
    </>
  );
}
