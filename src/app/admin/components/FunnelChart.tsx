"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import DateFilter from "./DateFilter";

interface FunnelRow {
  stage: string;
  stage_order: number;
  session_count: number;
  route: string;
}

const ROUTE_CONFIG: Record<string, { label: string; color: string }> = {
  "/": { label: "Landing Page", color: "#507AA6" },
  "/plattform": { label: "Marktplatz", color: "#2DCEC1" },
};

function routeLabel(route: string): string {
  return ROUTE_CONFIG[route]?.label ?? route;
}

function routeColor(route: string): string {
  return ROUTE_CONFIG[route]?.color ?? "#A8C9DD";
}

export default function FunnelChart() {
  const [data, setData] = useState<FunnelRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState<number | null>(30);
  const [provider, setProvider] = useState<string | null>(null);
  const [providers, setProviders] = useState<string[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase.rpc("admin_get_funnel_providers").then(({ data: rows }) => {
      setProviders((rows ?? []).map((r: { provider_name: string }) => r.provider_name));
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const supabase = createClient();

    supabase
      .rpc("admin_get_funnel_waterfall", { p_days: days, p_provider: provider })
      .then(({ data: rows, error: err }) => {
        if (err) {
          console.error("[FunnelChart]", err.message);
          setError(err.message);
        }
        setData(rows ?? []);
        setLoading(false);
      });
  }, [days, provider]);

  const stages = Array.from(new Set(data.map((d) => d.stage_order))).sort((a, b) => a - b);
  const KNOWN_ROUTES = ["/", "/plattform"];
  const sortedRoutes = KNOWN_ROUTES.filter((r) => data.some((d) => d.route === r));
  const maxCount = data.length > 0 ? Math.max(...data.map((d) => d.session_count)) : 0;

  const stageTotals = new Map<number, number>();
  for (const row of data) {
    stageTotals.set(row.stage_order, (stageTotals.get(row.stage_order) ?? 0) + row.session_count);
  }

  return (
    <div style={{ marginTop: "2rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--color-dark)", fontFamily: "var(--font-heading)" }}>
          Marketing Funnel
        </h2>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <select
            value={provider ?? ""}
            onChange={(e) => setProvider(e.target.value || null)}
            className="admin-input"
            style={{ fontSize: "0.8125rem", padding: "0.4375rem 0.75rem", minWidth: "10rem" }}
          >
            <option value="">Alle Anbieter</option>
            {providers.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <DateFilter days={days} onChange={setDays} />
        </div>
      </div>

      {!loading && !error && data.length > 0 && (
        <div style={{ display: "flex", gap: "1.25rem", marginBottom: "0.75rem", paddingLeft: "10.75rem" }}>
          {sortedRoutes.map((r) => (
            <span key={r} style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.75rem", color: "var(--color-subtle)" }}>
              <span style={{ width: "0.625rem", height: "0.625rem", borderRadius: "0.125rem", background: routeColor(r), flexShrink: 0 }} />
              {routeLabel(r)}
            </span>
          ))}
        </div>
      )}

      <div className="admin-chart-card">
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "16rem", color: "var(--color-subtle)", fontSize: "0.875rem" }}>
            Lade Funnel-Daten…
          </div>
        ) : error ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "16rem", color: "rgba(220,38,38,0.7)", fontSize: "0.875rem" }}>
            Fehler: {error}
          </div>
        ) : data.length === 0 ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "16rem", color: "var(--color-subtle)", fontSize: "0.875rem" }}>
            Keine Daten für den gewählten Zeitraum
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            {stages.map((stageOrder, stageIdx) => {
              const stageRows = data.filter((d) => d.stage_order === stageOrder);
              if (stageRows.length === 0) return null;
              const stageName = stageRows[0].stage;
              const stageTotal = stageTotals.get(stageOrder) ?? 0;
              const prevStageOrder = stageIdx > 0 ? stages[stageIdx - 1] : null;
              const prevTotal = prevStageOrder != null ? (stageTotals.get(prevStageOrder) ?? 0) : null;
              const dropoff = prevTotal != null && prevTotal > 0
                ? Math.round(((prevTotal - stageTotal) / prevTotal) * 100)
                : null;

              return (
                <div key={stageOrder} style={{ display: "flex", flexDirection: "column", gap: "0.125rem", marginBottom: "0.375rem" }}>
                  {sortedRoutes.map((route) => {
                    const row = stageRows.find((r) => r.route === route);
                    const count = row?.session_count ?? 0;
                    const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
                    const isFirst = route === sortedRoutes[0];

                    return (
                      <div key={route} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <span style={{
                          width: "10rem", flexShrink: 0, fontSize: "0.8125rem",
                          color: isFirst ? "var(--color-dark)" : "transparent",
                          textAlign: "right", fontWeight: isFirst ? 600 : 400,
                        }}>
                          {isFirst ? stageName : ""}
                        </span>
                        <div style={{ flex: 1, position: "relative", height: "1.375rem" }}>
                          <div
                            style={{
                              width: count > 0 ? `${pct}%` : "0",
                              minWidth: count > 0 ? "1.5rem" : 0,
                              height: "100%",
                              borderRadius: "0.25rem",
                              background: routeColor(route),
                              opacity: count > 0 ? 1 : 0.15,
                              transition: "width 0.4s ease",
                            }}
                          />
                        </div>
                        <span style={{
                          width: "3rem", flexShrink: 0, fontSize: "0.8125rem", fontWeight: 600,
                          color: count > 0 ? "var(--color-dark)" : "var(--color-border)",
                          textAlign: "right", fontVariantNumeric: "tabular-nums",
                        }}>
                          {count}
                        </span>
                        <span style={{
                          width: "3.5rem", flexShrink: 0, fontSize: "0.75rem",
                          color: isFirst && dropoff != null ? "rgba(220,38,38,0.7)" : "transparent",
                          textAlign: "right", fontVariantNumeric: "tabular-nums",
                        }}>
                          {isFirst && dropoff != null ? `−${dropoff}%` : ""}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
