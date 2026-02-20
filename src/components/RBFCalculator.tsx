"use client";

import { useState, useMemo } from "react";

const scenarios = [
  { label: "Szenario A", loan: 50000, revenue: 80000 },
  { label: "Szenario B", loan: 50000, revenue: 40000 },
  { label: "Szenario C", loan: 50000, revenue: 20000 },
];

const FEE_RATE = 0.08;
const HOLDBACK_RATE = 0.10;

function fmt(n: number) {
  return new Intl.NumberFormat("de-DE", { maximumFractionDigits: 0 }).format(n);
}

function pct(value: number, min: number, max: number) {
  return ((value - min) / (max - min)) * 100;
}

export default function RBFCalculator() {
  const [loanAmount, setLoanAmount] = useState(50000);
  const [monthlyRevenue, setMonthlyRevenue] = useState(50000);

  const calc = useMemo(() => {
    const totalRepayment = loanAmount * (1 + FEE_RATE);
    const feeAmount = loanAmount * FEE_RATE;
    const monthlyPayment = monthlyRevenue * HOLDBACK_RATE;
    const months =
      monthlyPayment > 0 ? Math.ceil(totalRepayment / monthlyPayment) : 0;
    const yearsDecimal = months / 12;
    const impliedAPR =
      yearsDecimal > 0 ? ((2 * FEE_RATE) / yearsDecimal) * 100 : 0;

    return {
      totalRepayment: Math.round(totalRepayment),
      feeAmount: Math.round(feeAmount),
      monthlyPayment: Math.round(monthlyPayment),
      months,
      impliedAPR: Math.round(impliedAPR * 10) / 10,
      paybackMultiple: Math.round((1 + FEE_RATE) * 100) / 100,
    };
  }, [loanAmount, monthlyRevenue]);

  return (
    <div>
      {/* Scenario Tabs */}
      <div className="flex gap-0 border-b border-border mb-8">
        {scenarios.map((s) => (
          <button
            key={s.label}
            onClick={() => {
              setLoanAmount(s.loan);
              setMonthlyRevenue(s.revenue);
            }}
            className={`rbf-scenario-btn ${
              loanAmount === s.loan && monthlyRevenue === s.revenue
                ? "rbf-scenario-btn-active"
                : ""
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Controls */}
        <div>
          {/* Loan Amount */}
          <div className="mb-8">
            <div className="flex items-baseline justify-between mb-3">
              <span className="text-sm text-subtle">Finanzierungsbetrag</span>
              <span className="font-heading text-2xl font-300 text-dark">
                {fmt(loanAmount)}&nbsp;&euro;
              </span>
            </div>
            <input
              type="range"
              min={10000}
              max={250000}
              step={5000}
              value={loanAmount}
              onChange={(e) => setLoanAmount(Number(e.target.value))}
              className="funnel-slider w-full"
              style={{
                background: `linear-gradient(to right, #2C3E50 ${pct(loanAmount, 10000, 250000)}%, #E5E7EB ${pct(loanAmount, 10000, 250000)}%)`,
              }}
            />
            <div className="flex justify-between mt-1 text-xs text-subtle">
              <span>10.000 &euro;</span>
              <span>250.000 &euro;</span>
            </div>
          </div>

          {/* Monthly Revenue */}
          <div className="mb-8">
            <div className="flex items-baseline justify-between mb-3">
              <span className="text-sm text-subtle">Monatsumsatz</span>
              <span className="font-heading text-2xl font-300 text-dark">
                {fmt(monthlyRevenue)}&nbsp;&euro;
              </span>
            </div>
            <input
              type="range"
              min={10000}
              max={200000}
              step={5000}
              value={monthlyRevenue}
              onChange={(e) => setMonthlyRevenue(Number(e.target.value))}
              className="funnel-slider w-full"
              style={{
                background: `linear-gradient(to right, #2C3E50 ${pct(monthlyRevenue, 10000, 200000)}%, #E5E7EB ${pct(monthlyRevenue, 10000, 200000)}%)`,
              }}
            />
            <div className="flex justify-between mt-1 text-xs text-subtle">
              <span>10.000 &euro;</span>
              <span>200.000 &euro;</span>
            </div>
          </div>

          {/* Fixed Parameters */}
          <p className="text-xs text-subtle">
            Annahmen: 8&nbsp;% fixe Geb&uuml;hr, 10&nbsp;% Umsatzanteil (Holdback)
          </p>
        </div>

        {/* Results */}
        <div>
          <div className="space-y-4 mb-6">
            <div className="flex justify-between items-baseline py-2 border-b border-border">
              <span className="text-sm text-subtle">Auszahlung</span>
              <span className="font-heading text-lg text-dark">{fmt(loanAmount)}&nbsp;&euro;</span>
            </div>
            <div className="flex justify-between items-baseline py-2 border-b border-border">
              <span className="text-sm text-subtle">Fixe Geb&uuml;hr (8&nbsp;%)</span>
              <span className="font-heading text-lg text-dark">{fmt(calc.feeAmount)}&nbsp;&euro;</span>
            </div>
            <div className="flex justify-between items-baseline py-2 border-b border-border">
              <span className="text-sm text-subtle">Gesamtr&uuml;ckzahlung</span>
              <span className="font-heading text-xl font-600 text-dark">{fmt(calc.totalRepayment)}&nbsp;&euro;</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 py-4">
            <div>
              <p className="text-xs text-subtle uppercase tracking-wide">Monatl. Rate</p>
              <p className="font-heading text-xl text-dark mt-0.5">
                {fmt(calc.monthlyPayment)}&nbsp;&euro;
              </p>
            </div>
            <div>
              <p className="text-xs text-subtle uppercase tracking-wide">Laufzeit</p>
              <p className="font-heading text-xl text-dark mt-0.5">
                {calc.months}&nbsp;Mon.
              </p>
            </div>
            <div>
              <p className="text-xs text-subtle uppercase tracking-wide">Eff. APR</p>
              <p className="font-heading text-xl text-dark mt-0.5">
                ~{calc.impliedAPR}&nbsp;%
              </p>
            </div>
          </div>

          {/* Bar */}
          <div className="mt-4">
            <div className="flex h-3 rounded-sm overflow-hidden">
              <div
                className="bg-dark transition-all duration-500"
                style={{ width: `${(loanAmount / calc.totalRepayment) * 100}%` }}
              />
              <div
                className="bg-subtle/30 transition-all duration-500"
                style={{ width: `${(calc.feeAmount / calc.totalRepayment) * 100}%` }}
              />
            </div>
            <div className="flex justify-between mt-1.5 text-xs text-subtle">
              <span>Kapital ({Math.round((loanAmount / calc.totalRepayment) * 100)}%)</span>
              <span>Geb&uuml;hr ({Math.round((calc.feeAmount / calc.totalRepayment) * 100)}%)</span>
            </div>
          </div>

          <p className="text-xs text-subtle mt-6">
            Payback-Multiple: {calc.paybackMultiple}&times; &middot;
            Die implizite APR ber&uuml;cksichtigt den Amortisationseffekt
            (Faktor&nbsp;2&times;). Schnellere R&uuml;ckzahlung = h&ouml;herer APR.
          </p>
        </div>
      </div>
    </div>
  );
}
