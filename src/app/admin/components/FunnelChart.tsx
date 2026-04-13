"use client";

import { useEffect, useState } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase";

interface FunnelRow {
  stage: string;
  stage_order: number;
  session_count: number;
}

interface RouteRow {
  route: string;
  session_count: number;
}

type DatePreset =
  | { label: string; days: number | null }
  | { label: string; type: "custom_days" }
  | { label: string; type: "custom_months" };

const DATE_PRESETS: DatePreset[] = [
  { label: "Alle", days: null },
  { label: "Heute", days: 1 },
  { label: "Gestern", days: 2 },
  { label: "Diese Woche", days: 7 },
  { label: "Letzte 7 Tage", days: 7 },
  { label: "Letzte 30 Tage", days: 30 },
  { label: "Letzte 90 Tage", days: 90 },
  { label: "Letzte X Tage", type: "custom_days" },
  { label: "Letzte X Monate", type: "custom_months" },
];

const ROUTE_COLORS = ["#507AA6", "#6D9EC8", "#8AB8D8", "#A8C9DD", "#C4DAE8"];

const ROUTE_LABELS: Record<string, string> = {
  "/": "Landing Page",
  "/plattform": "Marktplatz",
  "/revenue-based-finance": "RBF",
  "/faq": "FAQ",
};

function normalizeRoute(route: string): string {
  // Strip trailing slash for consistency
  return route.length > 1 && route.endsWith("/") ? route.slice(0, -1) : route;
}

function routeLabel(route: string): string {
  const normalized = normalizeRoute(route);
  if (ROUTE_LABELS[normalized]) return ROUTE_LABELS[normalized];
  if (normalized.startsWith("/antrag/")) return `Antrag ${normalized.split("/")[2] ?? ""}`;
  return normalized;
}

/** Merge routes that differ only by trailing slash */
function mergeRoutes(rows: RouteRow[]): RouteRow[] {
  const map = new Map<string, number>();
  for (const r of rows) {
    const key = normalizeRoute(r.route);
    map.set(key, (map.get(key) ?? 0) + r.session_count);
  }
  return Array.from(map.entries())
    .map(([route, session_count]) => ({ route, session_count }))
    .sort((a, b) => b.session_count - a.session_count);
}

export default function FunnelChart() {
  const [data, setData] = useState<FunnelRow[]>([]);
  const [routes, setRoutes] = useState<RouteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState<number | null>(30);
  const [dateLabel, setDateLabel] = useState("Letzte 30 Tage");
  const [dateOpen, setDateOpen] = useState(false);
  const [customInput, setCustomInput] = useState<{ type: "custom_days" | "custom_months"; value: string } | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const [providers, setProviders] = useState<string[]>([]);

  // Load providers for filter
  useEffect(() => {
    const supabase = createClient();
    supabase.rpc("admin_get_funnel_providers").then(({ data: rows }) => {
      setProviders((rows ?? []).map((r: { provider_name: string }) => r.provider_name));
    });
  }, []);

  // Load funnel data + routes
  useEffect(() => {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const params = { p_days: days, p_provider: provider };

    Promise.all([
      supabase.rpc("admin_get_funnel_waterfall", params),
      supabase.rpc("admin_get_funnel_routes", params),
    ]).then(([waterfallRes, routesRes]) => {
      if (waterfallRes.error) {
        console.error("[FunnelChart]", waterfallRes.error.message);
        setError(waterfallRes.error.message);
      }
      setData(waterfallRes.data ?? []);
      setRoutes(mergeRoutes(routesRes.data ?? []));
      setLoading(false);
    });
  }, [days, provider]);

  function selectPreset(preset: DatePreset) {
    if ("type" in preset) {
      setCustomInput({ type: preset.type, value: "" });
      return;
    }
    setDays(preset.days);
    setDateLabel(preset.label);
    setDateOpen(false);
    setCustomInput(null);
  }

  function applyCustom() {
    if (!customInput) return;
    const n = parseInt(customInput.value, 10);
    if (!n || n <= 0) return;
    if (customInput.type === "custom_days") {
      setDays(n);
      setDateLabel(`Letzte ${n} Tage`);
    } else {
      setDays(n * 30);
      setDateLabel(`Letzte ${n} Monate`);
    }
    setDateOpen(false);
    setCustomInput(null);
  }

  const maxCount = data.length > 0 ? Math.max(...data.map((d) => d.session_count)) : 0;
  const routeTotal = routes.reduce((s, r) => s + r.session_count, 0);

  return (
    <div style={{ marginTop: "2rem" }}>
      {/* Header with filters */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--color-dark)", fontFamily: "var(--font-heading)" }}>
          Marketing Funnel
        </h2>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          {/* Provider filter */}
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

          {/* Date filter dropdown */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => { setDateOpen((v) => !v); setCustomInput(null); }}
              style={{
                display: "flex", alignItems: "center", gap: "0.375rem", minWidth: "10rem", justifyContent: "space-between",
                padding: "0.4375rem 0.75rem", fontSize: "0.8125rem", fontWeight: 600,
                border: "1.5px solid var(--color-dark)", borderRadius: "0.375rem",
                background: "var(--color-dark)", color: "#ffffff", cursor: "pointer",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                <Calendar style={{ width: "0.875rem", height: "0.875rem" }} />
                {dateLabel}
              </span>
              <ChevronDown style={{ width: "0.75rem", height: "0.75rem", transition: "transform 0.15s", transform: dateOpen ? "rotate(180deg)" : "none" }} />
            </button>

            {dateOpen && (
              <div style={{
                position: "absolute", right: 0, top: "calc(100% + 0.25rem)", zIndex: 50, minWidth: "14rem",
                background: "#2B2D3E", borderRadius: "0.625rem", boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
                padding: "0.375rem 0", display: "flex", flexDirection: "column",
              }}>
                {DATE_PRESETS.map((preset) => {
                  const isActive = !("type" in preset) && preset.days === days && preset.label === dateLabel;
                  return (
                    <button
                      key={preset.label}
                      onClick={() => selectPreset(preset)}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%",
                        padding: "0.625rem 1rem", fontSize: "0.875rem", color: "#ffffff",
                        background: "none", border: "none", cursor: "pointer", textAlign: "left",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                    >
                      {preset.label}
                      {isActive && <Check />}
                    </button>
                  );
                })}
                {customInput && (
                  <div style={{ padding: "0.5rem 0.75rem", display: "flex", gap: "0.375rem" }}>
                    <input
                      type="number"
                      min={1}
                      autoFocus
                      value={customInput.value}
                      onChange={(e) => setCustomInput({ ...customInput, value: e.target.value })}
                      onKeyDown={(e) => e.key === "Enter" && applyCustom()}
                      placeholder={customInput.type === "custom_days" ? "Tage" : "Monate"}
                      style={{ flex: 1, fontSize: "0.8125rem", padding: "0.375rem 0.5rem", borderRadius: "0.375rem", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.1)", color: "#fff", outline: "none" }}
                    />
                    <button onClick={applyCustom} style={{ fontSize: "0.75rem", padding: "0.375rem 0.625rem", borderRadius: "0.375rem", background: "var(--color-turquoise)", color: "#fff", border: "none", cursor: "pointer", fontWeight: 600 }}>
                      OK
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chart */}
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
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {data.map((row, i) => {
              const isPageView = row.stage_order === 0;
              const pct = maxCount > 0 ? (row.session_count / maxCount) * 100 : 0;
              const prev = i > 0 ? data[i - 1].session_count : null;
              const dropoff =
                prev != null && prev > 0
                  ? Math.round(((prev - row.session_count) / prev) * 100)
                  : null;

              return (
                <div key={row.stage_order}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{ width: "10rem", flexShrink: 0, fontSize: "0.8125rem", color: "var(--color-dark)", textAlign: "right" }}>
                      {row.stage}
                    </span>
                    <div style={{ flex: 1, position: "relative", height: "2rem" }}>
                      {/* Stacked bar for page views */}
                      {isPageView && routes.length > 0 && routeTotal > 0 ? (
                        <div style={{ display: "flex", width: `${pct}%`, minWidth: pct > 0 ? "2rem" : 0, height: "100%", borderRadius: "0.375rem", overflow: "hidden", transition: "width 0.4s ease" }}>
                          {routes.map((r, ri) => {
                            const segPct = (r.session_count / routeTotal) * 100;
                            return (
                              <div
                                key={r.route}
                                title={`${routeLabel(r.route)}: ${r.session_count}`}
                                style={{
                                  width: `${segPct}%`,
                                  height: "100%",
                                  background: ROUTE_COLORS[ri % ROUTE_COLORS.length],
                                  transition: "width 0.4s ease",
                                }}
                              />
                            );
                          })}
                        </div>
                      ) : (
                        <div
                          style={{
                            width: `${pct}%`,
                            minWidth: pct > 0 ? "2rem" : 0,
                            height: "100%",
                            borderRadius: "0.375rem",
                            background: `color-mix(in srgb, var(--color-turquoise) ${100 - i * 8}%, transparent)`,
                            transition: "width 0.4s ease",
                          }}
                        />
                      )}
                    </div>
                    <span style={{ width: "3.5rem", flexShrink: 0, fontSize: "0.875rem", fontWeight: 700, color: "var(--color-dark)", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                      {row.session_count}
                    </span>
                    <span style={{ width: "3.5rem", flexShrink: 0, fontSize: "0.75rem", color: dropoff != null ? "rgba(220,38,38,0.7)" : "transparent", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                      {dropoff != null ? `−${dropoff}%` : ""}
                    </span>
                  </div>
                  {/* Route legend below stacked bar */}
                  {isPageView && routes.length > 0 && (
                    <div style={{ display: "flex", gap: "1rem", marginLeft: "10.75rem", marginTop: "0.375rem", flexWrap: "wrap" }}>
                      {routes.map((r, ri) => (
                        <span key={r.route} style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.6875rem", color: "var(--color-subtle)" }}>
                          <span style={{ width: "0.5rem", height: "0.5rem", borderRadius: "50%", background: ROUTE_COLORS[ri % ROUTE_COLORS.length], flexShrink: 0 }} />
                          {routeLabel(r.route)} ({r.session_count})
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Check() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
      <path d="M3 8.5L6.5 12L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
