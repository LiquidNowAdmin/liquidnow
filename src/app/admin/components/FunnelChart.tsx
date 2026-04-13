"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

interface FunnelRow {
  stage: string;
  stage_order: number;
  session_count: number;
}

export default function FunnelChart({ days }: { days: number }) {
  const [data, setData] = useState<FunnelRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const supabase = createClient();
    supabase
      .rpc("admin_get_funnel_waterfall", { p_days: days })
      .then(({ data: rows, error }) => {
        if (error) console.error("[FunnelChart]", error.message);
        setData(rows ?? []);
        setLoading(false);
      });
  }, [days]);

  if (loading) {
    return (
      <div className="admin-chart-card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "16rem", color: "var(--color-subtle)", fontSize: "0.875rem" }}>
          Lade Funnel-Daten…
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="admin-chart-card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "16rem", color: "var(--color-subtle)", fontSize: "0.875rem" }}>
          Keine Daten für den gewählten Zeitraum
        </div>
      </div>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.session_count));

  return (
    <div className="admin-chart-card">
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
              <span
                style={{
                  width: "9rem",
                  flexShrink: 0,
                  fontSize: "0.8125rem",
                  color: "var(--color-dark)",
                  textAlign: "right",
                }}
              >
                {row.stage}
              </span>
              <div style={{ flex: 1, position: "relative", height: "2rem" }}>
                <div
                  style={{
                    width: `${pct}%`,
                    minWidth: pct > 0 ? "2rem" : 0,
                    height: "100%",
                    borderRadius: "0.375rem",
                    background: `color-mix(in srgb, var(--color-turquoise) ${100 - i * 10}%, transparent)`,
                    transition: "width 0.4s ease",
                  }}
                />
              </div>
              <span
                style={{
                  width: "3.5rem",
                  flexShrink: 0,
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  color: "var(--color-dark)",
                  textAlign: "right",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {row.session_count}
              </span>
              <span
                style={{
                  width: "3.5rem",
                  flexShrink: 0,
                  fontSize: "0.75rem",
                  color: dropoff != null ? "rgba(220,38,38,0.7)" : "transparent",
                  textAlign: "right",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {dropoff != null ? `−${dropoff}%` : ""}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
