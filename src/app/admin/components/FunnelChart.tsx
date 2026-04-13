"use client";

import { useEffect, useState } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase";

interface FunnelRow {
  stage: string;
  stage_order: number;
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

export default function FunnelChart() {
  const [data, setData] = useState<FunnelRow[]>([]);
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

  // Load funnel data
  useEffect(() => {
    setLoading(true);
    setError(null);
    const supabase = createClient();

    supabase
      .rpc("admin_get_funnel_waterfall", {
        p_days: days,
        p_provider: provider,
      })
      .then(({ data: rows, error: err }) => {
        if (err) {
          console.error("[FunnelChart]", err.message);
          setError(err.message);
        }
        setData(rows ?? []);
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
              const pct = maxCount > 0 ? (row.session_count / maxCount) * 100 : 0;
              const prev = i > 0 ? data[i - 1].session_count : null;
              const dropoff =
                prev != null && prev > 0
                  ? Math.round(((prev - row.session_count) / prev) * 100)
                  : null;

              return (
                <div key={row.stage_order} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <span style={{ width: "10rem", flexShrink: 0, fontSize: "0.8125rem", color: "var(--color-dark)", textAlign: "right" }}>
                    {row.stage}
                  </span>
                  <div style={{ flex: 1, position: "relative", height: "2rem" }}>
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
                  </div>
                  <span style={{ width: "3.5rem", flexShrink: 0, fontSize: "0.875rem", fontWeight: 700, color: "var(--color-dark)", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                    {row.session_count}
                  </span>
                  <span style={{ width: "3.5rem", flexShrink: 0, fontSize: "0.75rem", color: dropoff != null ? "rgba(220,38,38,0.7)" : "transparent", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                    {dropoff != null ? `−${dropoff}%` : ""}
                  </span>
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
