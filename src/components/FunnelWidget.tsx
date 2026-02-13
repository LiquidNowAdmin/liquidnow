"use client";

import { useState } from "react";
import { Building2, TrendingUp } from "lucide-react";
import Logo from "@/components/Logo";
import Link from "next/link";

const bankResults = [
  { name: "FinBank", rate: "3,2%", best: true },
  { name: "KreditDirekt", rate: "3,8%", best: false },
  { name: "HandelsBank", rate: "4,1%", best: false },
];

const termOptions = [
  { value: 0, label: "Kreditlinie (variabel)", shortLabel: "Variabel", months: null },
  { value: 1, label: "3 Monate", shortLabel: "3M", months: 3 },
  { value: 2, label: "6 Monate", shortLabel: "6M", months: 6 },
  { value: 3, label: "12 Monate", shortLabel: "12M", months: 12 },
  { value: 4, label: "24 Monate", shortLabel: "24M", months: 24 },
  { value: 5, label: "36 Monate", shortLabel: "36M", months: 36 },
  { value: 6, label: "48 Monate", shortLabel: "48M", months: 48 },
  { value: 7, label: "60 Monate (5 Jahre)", shortLabel: "5J", months: 60 },
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function FunnelWidget() {
  const [amount, setAmount] = useState(50000);
  const [termValue, setTermValue] = useState(3); // Default: 12 Monate

  const min = 10000;
  const max = 500000;
  const percentage = ((amount - min) / (max - min)) * 100;

  const termMin = 0;
  const termMax = termOptions.length - 1;
  const termPercentage = (termValue / termMax) * 100;
  const selectedTerm = termOptions[termValue];

  return (
    <div className="funnel-widget">
      {/* Header */}
      <div className="funnel-header">
        <Logo size="sm" />
        <span className="funnel-badge funnel-badge-gold">48h</span>
      </div>

      {/* Amount Slider */}
      <div className="funnel-field">
        <label className="funnel-label">Gewünschter Kreditbetrag</label>
        <div className="funnel-amount">{formatCurrency(amount)}</div>
        <div className="funnel-slider-wrap">
          <input
            type="range"
            min={min}
            max={max}
            step={5000}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="funnel-slider"
            style={{
              background: `linear-gradient(to right, #00CED1 0%, #00CED1 ${percentage}%, #E5E7EB ${percentage}%, #E5E7EB 100%)`,
            }}
          />
          <div className="funnel-slider-labels">
            <span>{formatCurrency(min)}</span>
            <span>{formatCurrency(max)}</span>
          </div>
        </div>
      </div>

      {/* Term Slider */}
      <div className="funnel-field">
        <label className="funnel-label">Laufzeit</label>
        <div className="funnel-amount">{selectedTerm.label}</div>
        <div className="funnel-slider-wrap">
          <input
            type="range"
            min={termMin}
            max={termMax}
            step={1}
            value={termValue}
            onChange={(e) => setTermValue(Number(e.target.value))}
            className="funnel-slider"
            style={{
              background: `linear-gradient(to right, #00CED1 0%, #00CED1 ${termPercentage}%, #E5E7EB ${termPercentage}%, #E5E7EB 100%)`,
            }}
          />
          <div className="funnel-slider-labels">
            <span>{termOptions[0].shortLabel}</span>
            <span>{termOptions[7].shortLabel}</span>
          </div>
        </div>
      </div>

      {/* Bank Preview */}
      <div className="funnel-banks">
        <p className="funnel-banks-label">Aktuelle Konditionen</p>
        <div className="funnel-banks-list">
          {bankResults.map((bank) => (
            <div key={bank.name} className="funnel-bank-row">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-subtle" />
                <span className="text-sm font-medium text-dark">
                  {bank.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm font-bold ${
                    bank.best ? "text-turquoise" : "text-dark"
                  }`}
                >
                  ab {bank.rate}
                </span>
                {bank.best && (
                  <span className="funnel-best-badge">
                    <TrendingUp className="h-3 w-3" />
                    BEST
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <Link
        href="/antrag/rechtsform"
        className="btn btn-primary btn-lg w-full text-center mt-2 inline-block"
      >
        Anfragen &rarr;
      </Link>

      <p className="funnel-disclaimer">
        Kostenlos & unverbindlich · Keine SCHUFA-Auswirkung
      </p>
    </div>
  );
}
