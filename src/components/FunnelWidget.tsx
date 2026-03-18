"use client";

import { useState } from "react";
import Logo from "@/components/Logo";
import Link from "next/link";

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
  const min = 10000;
  const max = 500000;
  const percentage = ((amount - min) / (max - min)) * 100;

  return (
    <div className="funnel-widget">
      {/* Header */}
      <div className="funnel-header">
        <Logo size="sm" />
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
              background: `linear-gradient(to right, #273469 0%, #273469 ${percentage}%, #E5E7EB ${percentage}%, #E5E7EB 100%)`,
            }}
          />
          <div className="funnel-slider-labels">
            <span>{formatCurrency(min)}</span>
            <span>{formatCurrency(max)}</span>
          </div>
        </div>
      </div>

      {/* Partner Logos */}
      <div className="funnel-partners">
        <p className="funnel-logos-label">Jetzt Anbieter vergleichen</p>
        <div className="funnel-logos">
          <img src="/logos/Iwoca_Logo_Wiki.svg" alt="Iwoca" className="funnel-logo" />
          <img src="/logos/qred bank-logo-dark.svg" alt="Qred" className="funnel-logo" />
          <img src="/logos/youlend.svg" alt="YouLend" className="funnel-logo" />
        </div>
      </div>

      {/* CTA */}
      <Link
        href={`/plattform?amount=${amount}`}
        className="btn btn-primary btn-lg w-full text-center mt-2 inline-block"
      >
        Jetzt vergleichen &rarr;
      </Link>

      <p className="funnel-disclaimer">
        Kostenlos & unverbindlich · Keine SCHUFA-Auswirkung
      </p>
    </div>
  );
}
