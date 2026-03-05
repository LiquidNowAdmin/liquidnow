"use client";

import React from "react";

export function formatDE(value: number): string {
  return new Intl.NumberFormat("de-DE", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
}

export function parseDE(s: string): number {
  return Number(s.replace(/\./g, "").replace(",", ".")) || 0;
}

export function GermanNumberInput({
  value, min = 0, max = 100_000_000, step, onChange, onEnter, className, style, placeholder,
}: {
  value: number | null;
  min?: number;
  max?: number;
  step?: number;
  onChange: (n: number | null) => void;
  onEnter?: () => void;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
}) {
  const [display, setDisplay] = React.useState(value != null ? formatDE(value) : "");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const focused = React.useRef(false);

  React.useEffect(() => {
    if (!focused.current) setDisplay(value != null ? formatDE(value) : "");
  }, [value]);

  function liveFormat(raw: string, cursorPos: number) {
    const digits = raw.replace(/[^0-9]/g, "");
    if (!digits) { setDisplay(""); return; }
    const n = Number(digits);
    const formatted = formatDE(n);
    const digitsBeforeCursor = raw.slice(0, cursorPos).replace(/[^0-9]/g, "").length;
    let newCursor = formatted.length;
    let seen = 0;
    for (let i = 0; i < formatted.length; i++) {
      if (formatted[i] !== ".") seen++;
      if (seen === digitsBeforeCursor) { newCursor = i + 1; break; }
    }
    setDisplay(formatted);
    requestAnimationFrame(() => inputRef.current?.setSelectionRange(newCursor, newCursor));
  }

  function commit(raw: string) {
    const n = parseDE(raw);
    if (!n) { onChange(null); setDisplay(""); return; }
    const clamped = Math.min(max, Math.max(min, n));
    onChange(clamped);
    setDisplay(formatDE(clamped));
  }

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      value={display}
      placeholder={placeholder}
      className={className}
      style={style}
      onFocus={e => { focused.current = true; e.target.select(); }}
      onChange={e => liveFormat(e.target.value, e.target.selectionStart ?? e.target.value.length)}
      onBlur={e => { focused.current = false; commit(e.target.value); }}
      onKeyDown={e => {
        if (e.key === "Enter") { e.preventDefault(); focused.current = false; commit(display); onEnter?.(); }
        const cur = value ?? 0;
        if (e.key === "ArrowUp") { e.preventDefault(); const n = Math.min(max, cur + (step ?? 1000)); onChange(n); setDisplay(formatDE(n)); }
        if (e.key === "ArrowDown") { e.preventDefault(); const n = Math.max(min, cur - (step ?? 1000)); onChange(n); setDisplay(formatDE(n)); }
      }}
    />
  );
}
