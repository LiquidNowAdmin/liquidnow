"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, X } from "lucide-react";
import { createClient } from "@/lib/supabase";

interface Provider {
  id: string;
  name: string;
}

function ArrayField({
  label,
  items,
  onChange,
  placeholder,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState("");

  function add() {
    if (!input.trim()) return;
    onChange([...items, input.trim()]);
    setInput("");
  }

  return (
    <div className="admin-field">
      <label className="admin-label">{label}</label>
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          className="admin-input"
          placeholder={placeholder ?? "Eingabe + Enter"}
        />
        <button type="button" onClick={add} className="btn btn-secondary btn-md" style={{ padding: "0 0.875rem", flexShrink: 0 }}>
          <Plus className="h-4 w-4" />
        </button>
      </div>
      {items.length > 0 && (
        <div className="flex flex-col gap-1">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-2 rounded-lg px-3 py-1.5" style={{ background: "var(--color-light-bg)" }}>
              <span className="text-sm flex-1">{item}</span>
              <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))}>
                <X className="h-3.5 w-3.5" style={{ color: "var(--color-subtle)" }} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div style={{ borderTop: "1px solid var(--color-border)", margin: "1.75rem 0 1.25rem", paddingTop: "1.5rem" }}>
      <p className="admin-label" style={{ margin: 0, fontSize: "0.6875rem", letterSpacing: "0.06em", textTransform: "uppercase" }}>{title}</p>
    </div>
  );
}

export default function ProduktNeuPage() {
  const router = useRouter();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Basis
  const [providerId, setProviderId] = useState("");
  const [name, setName] = useState("");
  const [isTermLoan, setIsTermLoan] = useState(true);
  const [isCreditLine, setIsCreditLine] = useState(false);
  const [minVolume, setMinVolume] = useState("10000");
  const [maxVolume, setMaxVolume] = useState("500000");
  const [minTermMonths, setMinTermMonths] = useState("3");
  const [maxTermMonths, setMaxTermMonths] = useState("60");
  const [interestRateFrom, setInterestRateFrom] = useState("");
  const [interestRateTo, setInterestRateTo] = useState("");

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
  const [flexibilityScore, setFlexibilityScore] = useState("");

  // Meta: Vorteile / Nachteile
  const [pros, setPros] = useState<string[]>([]);
  const [cons, setCons] = useState<string[]>([]);

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
    async function fetchProviders() {
      const supabase = createClient();
      const { data } = await supabase.from("providers").select("id, name").order("name");
      setProviders(data ?? []);
      if (data && data.length > 0) setProviderId(data[0].id);
    }
    fetchProviders();
  }, []);

  function buildMetadata() {
    const meta: Record<string, unknown> = {};

    if (description) meta.description = description;
    if (ctaPrimary) meta.cta_primary = ctaPrimary;
    if (feeModel) meta.fee_model = feeModel;
    if (feePctFrom) meta.fee_pct_from = parseFloat(feePctFrom);
    if (repayment) meta.repayment = repayment;
    if (processingTimeDays) meta.processing_time_days = parseInt(processingTimeDays);
    if (approvalRatePct) meta.approval_rate_pct = parseInt(approvalRatePct);
    if (flexibilityScore) meta.flexibility_score = parseInt(flexibilityScore);
    if (pros.length) meta.pros = pros;
    if (cons.length) meta.cons = cons;
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
    const { error: insertError } = await supabase.from("products").insert({
      provider_id: providerId,
      name,
      type: isCreditLine && isTermLoan ? "both" : isCreditLine ? "credit_line" : "term_loan",
      min_volume: parseInt(minVolume),
      max_volume: parseInt(maxVolume),
      min_term_months: parseInt(minTermMonths),
      max_term_months: parseInt(maxTermMonths),
      interest_rate_from: parseFloat(interestRateFrom) || null,
      interest_rate_to: parseFloat(interestRateTo) || null,
      is_active: true,
      metadata: buildMetadata(),
    });

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    router.push("/admin/produkte");
  }

  return (
    <>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Neues Produkt</h1>
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
          <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} className="admin-input" required placeholder="z.B. Business-Kredit Express" />
        </div>

        <div className="admin-field">
          <label className="admin-label">Typ</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="checkbox" checked={isTermLoan} onChange={(e) => setIsTermLoan(e.target.checked)} className="admin-checkbox" />
              Laufzeitkredit
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="checkbox" checked={isCreditLine} onChange={(e) => setIsCreditLine(e.target.checked)} className="admin-checkbox" />
              Kreditlinie
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
            <input id="rate_from" type="number" step="0.01" value={interestRateFrom} onChange={(e) => setInterestRateFrom(e.target.value)} className="admin-input" placeholder="z.B. 3.9" />
          </div>
          <div className="admin-field">
            <label htmlFor="rate_to" className="admin-label">Zins bis (%)</label>
            <input id="rate_to" type="number" step="0.01" value={interestRateTo} onChange={(e) => setInterestRateTo(e.target.value)} className="admin-input" placeholder="z.B. 12.0" />
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
            <label htmlFor="approval_rate" className="admin-label">Zusagequote (%)</label>
            <input id="approval_rate" type="number" value={approvalRatePct} onChange={(e) => setApprovalRatePct(e.target.value)} className="admin-input" placeholder="z.B. 75" />
          </div>
          <div className="admin-field">
            <label htmlFor="flexibility" className="admin-label">Flexibilität (1–4)</label>
            <input id="flexibility" type="number" min={1} max={4} value={flexibilityScore} onChange={(e) => setFlexibilityScore(e.target.value)} className="admin-input" placeholder="1 = fest, 4 = sehr flexibel" />
          </div>
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

        {/* ── Vorteile & Nachteile ── */}
        <SectionHeader title="Vorteile & Nachteile" />

        <ArrayField label="Vorteile" items={pros} onChange={setPros} placeholder="z.B. Schnelle Auszahlung" />
        <ArrayField label="Nachteile" items={cons} onChange={setCons} placeholder="z.B. Nur für Bestandskunden" />

        {/* ── Voraussetzungen ── */}
        <SectionHeader title="Voraussetzungen" />

        <div className="admin-field">
          <label htmlFor="min_revenue" className="admin-label">Mindestumsatz (EUR/Monat)</label>
          <input id="min_revenue" type="number" value={minMonthlyRevenue} onChange={(e) => setMinMonthlyRevenue(e.target.value)} className="admin-input" placeholder="z.B. 10000" />
        </div>

        <div className="admin-form-actions">
          <Link href="/admin/produkte" className="btn btn-secondary btn-md">Abbrechen</Link>
          <button type="submit" disabled={saving} className="btn btn-primary btn-md">
            {saving ? "Speichern..." : "Produkt erstellen"}
          </button>
        </div>
      </form>
    </>
  );
}
