"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

interface Provider {
  id: string;
  name: string;
}


function SectionHeader({ title }: { title: string }) {
  return (
    <div style={{ borderTop: "1px solid var(--color-border)", margin: "1.75rem 0 1.25rem", paddingTop: "1.5rem" }}>
      <p className="admin-label" style={{ margin: 0, fontSize: "0.6875rem", letterSpacing: "0.06em", textTransform: "uppercase" }}>{title}</p>
    </div>
  );
}

function ProduktEditForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");

  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Basis
  const [providerId, setProviderId] = useState("");
  const [name, setName] = useState("");
  const [isTermLoan, setIsTermLoan] = useState(true);
  const [minVolume, setMinVolume] = useState("");
  const [maxVolume, setMaxVolume] = useState("");
  const [minTermMonths, setMinTermMonths] = useState("");
  const [maxTermMonths, setMaxTermMonths] = useState("");
  const [interestRateFrom, setInterestRateFrom] = useState("");
  const [interestRateTo, setInterestRateTo] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Meta: Allgemein
  const [description, setDescription] = useState("");
  const [ctaPrimary, setCtaPrimary] = useState("");

  // Meta: Konditionen
  const [feeModel, setFeeModel] = useState("");
  const [feePctFrom, setFeePctFrom] = useState("");
  const [repayment, setRepayment] = useState("");
  const [processingTimeDays, setProcessingTimeDays] = useState("");

  // Meta: Kennzahlen
  const [approvalRatePct, setApprovalRatePct] = useState("");
  const [trustpilotScore, setTrustpilotScore] = useState("");

  // Meta: Bewertung (explizite Scores)
  const [speedScoreVal, setSpeedScoreVal] = useState("");
  const [approvalScoreVal, setApprovalScoreVal] = useState("");
  const [priceScoreVal, setPriceScoreVal] = useState("");
  const [flexibilityScore, setFlexibilityScore] = useState("");

  // Meta: Merkmale
  const [topUp, setTopUp] = useState(false);
  const [payout48h, setPayout48h] = useState(false);
  const [flexibleRepayment, setFlexibleRepayment] = useState(false);
  const [gracePeriod, setGracePeriod] = useState(false);
  const [negativeSchufa, setNegativeSchufa] = useState(false);

  // Meta: Verwendungszwecke
  const [useCases, setUseCases] = useState<string[]>([]);

  // Meta: Zielgruppe
  const [eligibleLegalForms, setEligibleLegalForms] = useState<string[]>([]);
  const [eligibleIndustries, setEligibleIndustries] = useState<string[]>([]);

  // Meta: Voraussetzungen
  const [minMonthlyRevenue, setMinMonthlyRevenue] = useState("");

  useEffect(() => {
    if (!id) return;

    async function fetchData() {
      const supabase = createClient();
      const [{ data: product }, { data: providerList }] = await Promise.all([
        supabase.from("products").select("*").eq("id", id).single(),
        supabase.from("providers").select("id, name").order("name"),
      ]);

      setProviders(providerList ?? []);

      if (product) {
        setProviderId(product.provider_id);
        setName(product.name);
        const t = product.type ?? "term_loan";
        setIsTermLoan(t === "term_loan" || t === "both" || t === "credit_line");
        setMinVolume(String(product.min_volume ?? ""));
        setMaxVolume(String(product.max_volume ?? ""));
        setMinTermMonths(String(product.min_term_months ?? ""));
        setMaxTermMonths(String(product.max_term_months ?? ""));
        setInterestRateFrom(String(product.interest_rate_from ?? ""));
        setInterestRateTo(String(product.interest_rate_to ?? ""));
        setIsActive(product.is_active);

        const m = (product.metadata ?? {}) as Record<string, unknown>;
        setDescription((m.description as string) ?? "");
        setCtaPrimary((m.cta_primary as string) ?? "");
        setFeeModel((m.fee_model as string) ?? "");
        setFeePctFrom(m.fee_pct_from != null ? String(m.fee_pct_from) : "");
        setRepayment((m.repayment as string) ?? "");
        setProcessingTimeDays(m.processing_time_days != null ? String(m.processing_time_days) : "");
        setApprovalRatePct(m.approval_rate_pct != null ? String(m.approval_rate_pct) : "");
        setTrustpilotScore(m.trustpilot != null ? String(m.trustpilot) : "");
        setSpeedScoreVal(m.speed_score != null ? String(m.speed_score) : "");
        setApprovalScoreVal(m.approval_score != null ? String(m.approval_score) : "");
        setPriceScoreVal(m.price_score != null ? String(m.price_score) : "");
        setFlexibilityScore(m.flexibility_score != null ? String(m.flexibility_score) : "");
        setTopUp(!!m.top_up);
        setPayout48h(!!m.payout_48h);
        setFlexibleRepayment(!!m.flexible_repayment);
        setGracePeriod(!!m.grace_period);
        setNegativeSchufa(!!m.negative_schufa);
        setUseCases((m.use_cases as string[]) ?? []);
        setEligibleLegalForms((m.eligible_legal_forms as string[]) ?? []);
        setEligibleIndustries((m.eligible_industries as string[]) ?? []);

        const req = (m.requirements ?? {}) as Record<string, unknown>;
        setMinMonthlyRevenue(req.min_monthly_revenue_eur != null ? String(req.min_monthly_revenue_eur) : "");
      }

      setLoading(false);
    }

    fetchData();
  }, [id]);

  function buildMetadata() {
    const meta: Record<string, unknown> = {};

    if (description) meta.description = description;
    if (ctaPrimary) meta.cta_primary = ctaPrimary;
    if (feeModel) meta.fee_model = feeModel;
    if (feePctFrom) meta.fee_pct_from = parseFloat(feePctFrom);
    if (repayment) meta.repayment = repayment;
    if (processingTimeDays) meta.processing_time_days = parseInt(processingTimeDays);
    if (approvalRatePct) meta.approval_rate_pct = parseInt(approvalRatePct);
    if (trustpilotScore) meta.trustpilot = parseFloat(trustpilotScore);
    if (speedScoreVal)    meta.speed_score       = parseFloat(speedScoreVal);
    if (approvalScoreVal) meta.approval_score    = parseFloat(approvalScoreVal);
    if (priceScoreVal)    meta.price_score       = parseFloat(priceScoreVal);
    if (flexibilityScore) meta.flexibility_score = parseFloat(flexibilityScore);
    if (topUp) meta.top_up = true;
    if (payout48h) meta.payout_48h = true;
    if (flexibleRepayment) meta.flexible_repayment = true;
    if (gracePeriod) meta.grace_period = true;
    if (negativeSchufa) meta.negative_schufa = true;
    if (useCases.length) meta.use_cases = useCases;
    if (eligibleLegalForms.length) meta.eligible_legal_forms = eligibleLegalForms;
    if (eligibleIndustries.length) meta.eligible_industries = eligibleIndustries;

    const req: Record<string, unknown> = {};
    if (minMonthlyRevenue) req.min_monthly_revenue_eur = parseInt(minMonthlyRevenue);
    if (Object.keys(req).length) meta.requirements = req;

    return meta;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("products")
      .update({
        provider_id: providerId,
        name,
        type: "term_loan",
        min_volume: parseInt(minVolume) || null,
        max_volume: parseInt(maxVolume) || null,
        min_term_months: parseInt(minTermMonths) || null,
        max_term_months: parseInt(maxTermMonths) || null,
        interest_rate_from: parseFloat(interestRateFrom) || null,
        interest_rate_to: parseFloat(interestRateTo) || null,
        is_active: isActive,
        metadata: buildMetadata(),
      })
      .eq("id", id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    router.push("/admin/produkte");
  }

  if (!id) return <p className="text-subtle">Keine Produkt-ID angegeben.</p>;
  if (loading) return <div className="admin-page-header"><h1 className="admin-page-title">Laden...</h1></div>;

  return (
    <>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Produkt bearbeiten</h1>
      </div>

      {error && <div className="admin-login-error mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="admin-form">

        {/* ── Basis ── */}
        <div className="admin-field">
          <label htmlFor="provider" className="admin-label">Anbieter *</label>
          <select id="provider" value={providerId} onChange={(e) => setProviderId(e.target.value)} className="admin-select" required>
            {providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        <div className="admin-field">
          <label htmlFor="name" className="admin-label">Produktname *</label>
          <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} className="admin-input" required />
        </div>

        <div className="admin-field">
          <label className="admin-label">Typ</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="checkbox" checked={isTermLoan} onChange={(e) => setIsTermLoan(e.target.checked)} className="admin-checkbox" />
              Laufzeitkredit
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="admin-field">
            <label htmlFor="min_volume" className="admin-label">Min. Volumen (EUR)</label>
            <input id="min_volume" type="number" value={minVolume} onChange={(e) => setMinVolume(e.target.value)} className="admin-input" />
          </div>
          <div className="admin-field">
            <label htmlFor="max_volume" className="admin-label">Max. Volumen (EUR)</label>
            <input id="max_volume" type="number" value={maxVolume} onChange={(e) => setMaxVolume(e.target.value)} className="admin-input" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4" style={{ opacity: isTermLoan ? 1 : 0.4 }}>
          <div className="admin-field">
            <label htmlFor="min_term" className="admin-label">Min. Laufzeit (Monate)</label>
            <input id="min_term" type="number" value={minTermMonths} onChange={(e) => setMinTermMonths(e.target.value)} className="admin-input" disabled={!isTermLoan} />
          </div>
          <div className="admin-field">
            <label htmlFor="max_term" className="admin-label">Max. Laufzeit (Monate)</label>
            <input id="max_term" type="number" value={maxTermMonths} onChange={(e) => setMaxTermMonths(e.target.value)} className="admin-input" disabled={!isTermLoan} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="admin-field">
            <label htmlFor="rate_from" className="admin-label">Zins von (%)</label>
            <input id="rate_from" type="number" step="0.01" value={interestRateFrom} onChange={(e) => setInterestRateFrom(e.target.value)} className="admin-input" />
          </div>
          <div className="admin-field">
            <label htmlFor="rate_to" className="admin-label">Zins bis (%)</label>
            <input id="rate_to" type="number" step="0.01" value={interestRateTo} onChange={(e) => setInterestRateTo(e.target.value)} className="admin-input" />
          </div>
        </div>

        <div className="admin-field">
          <label className="admin-label">Status</label>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setIsActive(!isActive)} className={`admin-toggle ${isActive ? "admin-toggle-active" : ""}`}>
              <span className="admin-toggle-knob" />
            </button>
            <span className={`admin-status ${isActive ? "admin-status-active" : "admin-status-inactive"}`}>
              {isActive ? "Aktiv" : "Inaktiv"}
            </span>
          </div>
        </div>

        {/* ── Allgemein ── */}
        <SectionHeader title="Allgemein" />

        <div className="admin-field">
          <label htmlFor="description" className="admin-label">Beschreibung</label>
          <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="admin-input" rows={3} style={{ resize: "vertical" }} />
        </div>

        <div className="admin-field">
          <label htmlFor="cta_primary" className="admin-label">CTA-Text</label>
          <input id="cta_primary" type="text" value={ctaPrimary} onChange={(e) => setCtaPrimary(e.target.value)} className="admin-input" placeholder="z.B. Jetzt anfragen" />
        </div>

        {/* ── Konditionen ── */}
        <SectionHeader title="Konditionen" />

        <div className="admin-field">
          <label htmlFor="fee_model" className="admin-label">Gebührenmodell</label>
          <input id="fee_model" type="text" value={feeModel} onChange={(e) => setFeeModel(e.target.value)} className="admin-input" placeholder="z.B. 1–3% des Umsatzes (leer lassen = zinsenbasiert)" />
        </div>

        <div className="admin-field">
          <label htmlFor="fee_pct_from" className="admin-label">Gebühr ab (%)</label>
          <input id="fee_pct_from" type="number" step="0.1" value={feePctFrom} onChange={(e) => setFeePctFrom(e.target.value)} className="admin-input" placeholder="z.B. 2.5" />
        </div>

        <div className="admin-field">
          <label htmlFor="repayment" className="admin-label">Rückzahlung</label>
          <input id="repayment" type="text" value={repayment} onChange={(e) => setRepayment(e.target.value)} className="admin-input" placeholder="z.B. Monatliche Rate" />
        </div>

        <div className="admin-field">
          <label htmlFor="processing_time" className="admin-label">Bearbeitungszeit (Tage)</label>
          <input id="processing_time" type="number" value={processingTimeDays} onChange={(e) => setProcessingTimeDays(e.target.value)} className="admin-input" placeholder="z.B. 1" />
        </div>

        {/* ── Kennzahlen ── */}
        <SectionHeader title="Kennzahlen" />

        <div className="grid grid-cols-2 gap-4">
          <div className="admin-field">
            <label htmlFor="approval_rate" className="admin-label">Annahmequote (%)</label>
            <input id="approval_rate" type="number" value={approvalRatePct} onChange={(e) => setApprovalRatePct(e.target.value)} className="admin-input" placeholder="z.B. 75" />
          </div>
          <div className="admin-field">
            <label htmlFor="trustpilot" className="admin-label">Trustpilot-Score</label>
            <input id="trustpilot" type="number" step="0.1" min="0" max="5" value={trustpilotScore} onChange={(e) => setTrustpilotScore(e.target.value)} className="admin-input" placeholder="z.B. 4.8" />
          </div>
        </div>

        {/* ── Bewertung ── */}
        <SectionHeader title="Bewertung" />

        <p style={{ fontSize: "0.8125rem", color: "var(--color-subtle)", marginBottom: "0.75rem" }}>
          Leer lassen = automatisch aus Konditionen berechnet.
        </p>

        <div className="grid grid-cols-2 gap-4">
          {([
            { id: "speed_score",    label: "Geschwindigkeit", val: speedScoreVal,    set: setSpeedScoreVal,    hints: ["Langsam","Mittel","Schnell","Sehr schnell"] },
            { id: "approval_score", label: "Annahmequote",   val: approvalScoreVal, set: setApprovalScoreVal, hints: ["Niedrig","Mittel","Hoch","Sehr hoch"] },
            { id: "price_score",    label: "Preis",           val: priceScoreVal,    set: setPriceScoreVal,    hints: ["Teuer","Mittel","Günstig","Sehr günstig"] },
            { id: "flex_score",     label: "Flexibilität",    val: flexibilityScore, set: setFlexibilityScore, hints: ["Fest","Standard","Flexibel","Sehr flexibel"] },
          ] as { id: string; label: string; val: string; set: (v: string) => void; hints: string[] }[]).map(({ id, label, val, set, hints }) => (
            <div className="admin-field" key={id}>
              <label htmlFor={id} className="admin-label">
                {label}
                {val && <span style={{ color: "var(--color-turquoise)", marginLeft: "0.5rem" }}>→ {hints[Math.round(parseFloat(val)) - 1] ?? ""}</span>}
              </label>
              <input id={id} type="number" min={1} max={4} step={0.5} value={val} onChange={(e) => set(e.target.value)} className="admin-input" placeholder="1.0 – 4.0" />
            </div>
          ))}
        </div>

        {/* ── Merkmale ── */}
        <SectionHeader title="Merkmale" />

        <div className="admin-field">
          <label className="admin-label">Features</label>
          <div className="flex flex-col gap-2">
            {([
              { label: "Aufstockung möglich", value: topUp, set: setTopUp },
              { label: "48h Auszahlung", value: payout48h, set: setPayout48h },
              { label: "Flexible Rückzahlung", value: flexibleRepayment, set: setFlexibleRepayment },
              { label: "Tilgungsfreie Zeit", value: gracePeriod, set: setGracePeriod },
              { label: "Negative Schufa/Crefo möglich", value: negativeSchufa, set: setNegativeSchufa },
            ] as { label: string; value: boolean; set: (v: boolean) => void }[]).map(({ label, value, set }) => (
              <label key={label} className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="checkbox" checked={value} onChange={(e) => set(e.target.checked)} className="admin-checkbox" />
                {label}
              </label>
            ))}
          </div>
        </div>

        {/* ── Verwendungszwecke ── */}
        <SectionHeader title="Verwendungszwecke" />

        <div className="admin-field">
          <label className="admin-label">Geeignet für</label>
          <div className="flex flex-col gap-2">
            {([
              { id: "wareneinkauf", label: "Wareneinkauf" },
              { id: "liquiditaet", label: "Liquiditätsengpass überbrücken" },
              { id: "wachstum", label: "Wachstum & Expansion" },
              { id: "marketing", label: "Investition in Marketing" },
              { id: "steuer", label: "Steuerrückzahlung" },
              { id: "andere", label: "Andere" },
            ]).map(({ id, label }) => (
              <label key={id} className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={useCases.includes(id)}
                  onChange={(e) => setUseCases(e.target.checked ? [...useCases, id] : useCases.filter((u) => u !== id))}
                  className="admin-checkbox"
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        {/* ── Zielgruppe ── */}
        <SectionHeader title="Zielgruppe" />

        <div className="admin-field">
          <label className="admin-label">Rechtsformen (leer = alle)</label>
          <div className="flex flex-col gap-2">
            {([
              { id: "gmbh", label: "GmbH" },
              { id: "ug", label: "UG (haftungsbeschränkt)" },
              { id: "einzelunternehmen", label: "Einzelunternehmen" },
              { id: "gbr", label: "GbR" },
              { id: "ag", label: "AG" },
              { id: "kg", label: "KG" },
            ]).map(({ id, label }) => (
              <label key={id} className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="checkbox" checked={eligibleLegalForms.includes(id)} onChange={(e) => setEligibleLegalForms(e.target.checked ? [...eligibleLegalForms, id] : eligibleLegalForms.filter((v) => v !== id))} className="admin-checkbox" />
                {label}
              </label>
            ))}
          </div>
        </div>

        <div className="admin-field">
          <label className="admin-label">Branchen (leer = alle)</label>
          <div className="flex flex-col gap-2">
            {([
              { id: "handel", label: "E-Commerce & Handel" },
              { id: "dienstleistung", label: "Dienstleistung" },
              { id: "produktion", label: "Produktion & Handwerk" },
              { id: "gastronomie", label: "Gastronomie & Hotellerie" },
              { id: "andere", label: "Andere" },
            ]).map(({ id, label }) => (
              <label key={id} className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="checkbox" checked={eligibleIndustries.includes(id)} onChange={(e) => setEligibleIndustries(e.target.checked ? [...eligibleIndustries, id] : eligibleIndustries.filter((v) => v !== id))} className="admin-checkbox" />
                {label}
              </label>
            ))}
          </div>
        </div>

        {/* ── Voraussetzungen ── */}
        <SectionHeader title="Voraussetzungen" />

        <div className="admin-field">
          <label htmlFor="min_revenue" className="admin-label">Mindestumsatz (EUR/Monat)</label>
          <input id="min_revenue" type="number" value={minMonthlyRevenue} onChange={(e) => setMinMonthlyRevenue(e.target.value)} className="admin-input" placeholder="z.B. 10000" />
        </div>

        <div className="admin-form-actions">
          <Link href="/admin/produkte" className="btn btn-secondary btn-md">Abbrechen</Link>
          <button type="submit" disabled={saving} className="btn btn-primary btn-md">
            {saving ? "Speichern..." : "Speichern"}
          </button>
        </div>
      </form>
    </>
  );
}

export default function ProduktEditPage() {
  return (
    <Suspense fallback={<div className="admin-page-header"><h1 className="admin-page-title">Laden...</h1></div>}>
      <ProduktEditForm />
    </Suspense>
  );
}
