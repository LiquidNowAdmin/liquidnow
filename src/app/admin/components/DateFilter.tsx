"use client";

import { useState } from "react";
import { Calendar, ChevronDown } from "lucide-react";

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

interface DateFilterProps {
  days: number | null;
  onChange: (days: number | null) => void;
}

export default function DateFilter({ days, onChange }: DateFilterProps) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState(() => {
    if (days === null) return "Alle";
    const match = DATE_PRESETS.find((p) => "days" in p && p.days === days);
    return match ? match.label : `Letzte ${days} Tage`;
  });
  const [customInput, setCustomInput] = useState<{ type: "custom_days" | "custom_months"; value: string } | null>(null);

  function selectPreset(preset: DatePreset) {
    if ("type" in preset) {
      setCustomInput({ type: preset.type, value: "" });
      return;
    }
    onChange(preset.days);
    setLabel(preset.label);
    setOpen(false);
    setCustomInput(null);
  }

  function applyCustom() {
    if (!customInput) return;
    const n = parseInt(customInput.value, 10);
    if (!n || n <= 0) return;
    if (customInput.type === "custom_days") {
      onChange(n);
      setLabel(`Letzte ${n} Tage`);
    } else {
      onChange(n * 30);
      setLabel(`Letzte ${n} Monate`);
    }
    setOpen(false);
    setCustomInput(null);
  }

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => { setOpen((v) => !v); setCustomInput(null); }}
        style={{
          display: "flex", alignItems: "center", gap: "0.375rem", minWidth: "10rem", justifyContent: "space-between",
          padding: "0.4375rem 0.75rem", fontSize: "0.8125rem", fontWeight: 600,
          border: "1.5px solid var(--color-dark)", borderRadius: "0.375rem",
          background: "var(--color-dark)", color: "#ffffff", cursor: "pointer",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
          <Calendar style={{ width: "0.875rem", height: "0.875rem" }} />
          {label}
        </span>
        <ChevronDown style={{ width: "0.75rem", height: "0.75rem", transition: "transform 0.15s", transform: open ? "rotate(180deg)" : "none" }} />
      </button>

      {open && (
        <div style={{
          position: "absolute", right: 0, top: "calc(100% + 0.25rem)", zIndex: 50, minWidth: "14rem",
          background: "#2B2D3E", borderRadius: "0.625rem", boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
          padding: "0.375rem 0", display: "flex", flexDirection: "column",
        }}>
          {DATE_PRESETS.map((preset) => {
            const isActive = !("type" in preset) && preset.days === days && preset.label === label;
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
                {isActive && <CheckIcon />}
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
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
      <path d="M3 8.5L6.5 12L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
