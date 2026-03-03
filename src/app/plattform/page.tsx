"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Clock, ArrowRight, Search, Banknote, ChevronDown, Check, Zap, ThumbsUp, Tag, Shuffle, X, MessageCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Logo from "@/components/Logo";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase";

interface Offer {
  product_id: string;
  provider_id: string;
  provider_name: string;
  provider_logo_url: string | null;
  provider_type: string;
  product_name: string;
  product_type: string;
  min_volume: number;
  max_volume: number;
  min_term_months: number;
  max_term_months: number;
  interest_rate_from: number;
  interest_rate_to: number;
  metadata: Record<string, unknown> | null;
}

type SortKey = "rate" | "term" | "volume" | "speed";

function calculateMonthlyRate(principal: number, annualRate: number, months: number): number {
  const monthlyRate = annualRate / 100 / 12;
  if (monthlyRate === 0) return principal / months;
  return (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
}

function formatVolume(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
  return `${value}`;
}

function getProviderInitials(name: string): string {
  return name.split(" ").map(w => w[0]).join("").slice(0, 3).toUpperCase();
}

interface MetricScore { score: number; label: string; }

function speedScore(days: number | undefined): MetricScore {
  if (!days || days <= 1) return { score: 4, label: "Sehr schnell" };
  if (days <= 2)          return { score: 3, label: "Schnell" };
  if (days <= 5)          return { score: 2, label: "Mittel" };
  return                         { score: 1, label: "Langsam" };
}

function approvalScore(pct: number | undefined): MetricScore {
  if (!pct)       return { score: 2, label: "k. A." };
  if (pct >= 70)  return { score: 4, label: "Sehr hoch" };
  if (pct >= 50)  return { score: 3, label: "Hoch" };
  if (pct >= 30)  return { score: 2, label: "Mittel" };
  return                 { score: 1, label: "Niedrig" };
}

function priceScore(rate: number, hasFeeModel: boolean): MetricScore {
  if (hasFeeModel)  return { score: 2, label: "Gebührenbasiert" };
  if (rate <= 3)    return { score: 4, label: "Sehr günstig" };
  if (rate <= 6)    return { score: 3, label: "Günstig" };
  if (rate <= 12)   return { score: 2, label: "Mittel" };
  return                   { score: 1, label: "Teuer" };
}

function flexibilityScore(productType: string, m: Record<string, unknown>): MetricScore {
  const explicit = m.flexibility_score as number | undefined;
  if (explicit) {
    const labels = ["", "Fest", "Standard", "Flexibel", "Sehr flexibel"];
    const s = Math.min(4, Math.max(1, explicit));
    return { score: s, label: labels[s] };
  }
  const t = (productType ?? "").toLowerCase();
  if (t.includes("linie") || t.includes("revolv"))      return { score: 4, label: "Sehr flexibel" };
  if (t.includes("flexi") || t.includes("merchant") || t.includes("cash advance")) return { score: 3, label: "Flexibel" };
  if (t.includes("kredit") || t.includes("darlehen"))   return { score: 2, label: "Standard" };
  return { score: 2, label: "Standard" };
}

function SignalBar({ icon: Icon, metric }: { icon: LucideIcon; metric: MetricScore }) {
  return (
    <div className="flex items-center gap-2">
      <Icon style={{ width: "0.875rem", height: "0.875rem", flexShrink: 0, color: "var(--color-subtle)" }} />
      <div className="flex gap-0.5 items-center shrink-0">
        {[1, 2, 3, 4].map(i => (
          <span
            key={i}
            style={{
              display: "block",
              width: "1.125rem",
              height: "0.375rem",
              borderRadius: "999px",
              background: i <= metric.score ? "var(--color-turquoise)" : "var(--color-border)",
            }}
          />
        ))}
      </div>
      <span className="text-xs font-semibold" style={{ color: "var(--color-dark)" }}>{metric.label}</span>
    </div>
  );
}

function TrustpilotStars({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating);
  return (
    <span className="offer-trustpilot">
      <span className="offer-trustpilot-stars">
        {Array.from({ length: fullStars }).map((_, i) => (
          <span key={i} className="offer-trustpilot-star">
            <Star className="h-2 w-2 fill-current" />
          </span>
        ))}
      </span>
      <span className="offer-trustpilot-score">{rating}</span>
    </span>
  );
}

function SkeletonCard() {
  return (
    <div className="offer-card animate-pulse">
      <div className="offer-card-body">
        <div className="offer-card-grid">
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 bg-gray-200 rounded-xl shrink-0" />
            <div className="flex flex-col gap-2">
              <div className="h-3 w-24 bg-gray-200 rounded" />
              <div className="h-2.5 w-16 bg-gray-100 rounded" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="h-3 w-full bg-gray-100 rounded" />
            <div className="h-3 w-4/5 bg-gray-100 rounded" />
            <div className="h-3 w-3/4 bg-gray-100 rounded" />
          </div>
          <div className="flex flex-col gap-2">
            <div className="h-3 w-full bg-gray-100 rounded" />
            <div className="h-3 w-2/3 bg-gray-100 rounded" />
          </div>
          <div className="flex flex-col gap-2 items-end">
            <div className="h-4 w-16 bg-gray-200 rounded" />
            <div className="h-3 w-20 bg-gray-100 rounded" />
            <div className="h-3 w-14 bg-gray-100 rounded" />
            <div className="h-9 w-28 bg-gray-200 rounded-lg mt-1" />
          </div>
        </div>
        <div style={{ height: "1.25rem" }} />
      </div>
    </div>
  );
}

export default function PlattformPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [termType, setTermType] = useState<"linie" | "monate">("monate");
  const [termMonths, setTermMonths] = useState(12);
  const [volume, setVolume] = useState(50000);
  const [sortBy, setSortBy] = useState<SortKey>("speed");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterTopUp, setFilterTopUp] = useState(false);
  const [filter48h, setFilter48h] = useState(false);
  const [filterFlexRepayment, setFilterFlexRepayment] = useState(false);
  const [filterGracePeriod, setFilterGracePeriod] = useState(false);
  const [filterNegativeSchufa, setFilterNegativeSchufa] = useState(false);
  const [filterUseCases, setFilterUseCases] = useState<string[]>([]);
  const [filterRechtsform, setFilterRechtsform] = useState("");
  const [filterBranche, setFilterBranche] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [skeletonStartCount, setSkeletonStartCount] = useState(25);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setSkeletonStartCount(22 + Math.floor(Math.random() * 6));
    if (!sessionStorage.getItem("onboarding_done")) {
      setShowOnboarding(true);
    }
  }, []);

  const fetchOffers = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("get_platform_offers");
    if (!error && data) setOffers(data as Offer[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchOffers(); }, [fetchOffers]);

  const matchesTerm = (offer: Offer) => {
    if (termType === "linie") return true;
    return offer.min_term_months <= termMonths && offer.max_term_months >= termMonths;
  };

  const matchesVolume = (offer: Offer) => {
    return offer.min_volume <= volume && offer.max_volume >= volume;
  };

  const matchesFeatures = (offer: Offer) => {
    const m = (offer.metadata ?? {}) as Record<string, unknown>;
    if (filterTopUp && !m.top_up) return false;
    if (filter48h && !m.payout_48h) return false;
    if (filterFlexRepayment && !m.flexible_repayment) return false;
    if (filterGracePeriod && !m.grace_period) return false;
    if (filterNegativeSchufa && !m.negative_schufa) return false;
    if (filterUseCases.length > 0) {
      const productUseCases = (m.use_cases as string[] | undefined) ?? [];
      if (!filterUseCases.some((uc) => productUseCases.includes(uc))) return false;
    }
    if (filterRechtsform) {
      const allowed = (m.eligible_legal_forms as string[] | undefined) ?? [];
      if (allowed.length > 0 && !allowed.includes(filterRechtsform)) return false;
    }
    if (filterBranche) {
      const allowed = (m.eligible_industries as string[] | undefined) ?? [];
      if (allowed.length > 0 && !allowed.includes(filterBranche)) return false;
    }
    return true;
  };

  const matchesAll = (offer: Offer) => matchesTerm(offer) && matchesVolume(offer) && matchesFeatures(offer);

  const sortedOffers = [...offers].sort((a, b) => {
    const aMatch = matchesAll(a) ? 0 : 1;
    const bMatch = matchesAll(b) ? 0 : 1;
    if (aMatch !== bMatch) return aMatch - bMatch;

    if (sortBy === "rate") return a.interest_rate_from - b.interest_rate_from;
    if (sortBy === "term") return b.max_term_months - a.max_term_months;
    if (sortBy === "speed") {
      const aS = (a.metadata as Record<string, unknown>)?.processing_time_days as number ?? 999;
      const bS = (b.metadata as Record<string, unknown>)?.processing_time_days as number ?? 999;
      return aS - bS;
    }
    return b.max_volume - a.max_volume;
  });

  const sliderBg = (val: number, min: number, max: number) =>
    `linear-gradient(to right, #507AA6 0%, #507AA6 ${((val - min) / (max - min)) * 100}%, #D0DCE8 ${((val - min) / (max - min)) * 100}%, #D0DCE8 100%)`;

  const ONBOARDING_STEPS = 5;
  const matchingCount = offers.filter(matchesAll).length;
  const skeletonCount = loading
    ? skeletonStartCount
    : Math.max(matchingCount, Math.round(skeletonStartCount * Math.pow(0.65, onboardingStep)));

  function completeOnboarding() {
    sessionStorage.setItem("onboarding_done", "1");
    setShowOnboarding(false);
  }

  function nextStep() {
    if (onboardingStep < ONBOARDING_STEPS - 1) {
      setOnboardingStep(onboardingStep + 1);
    } else {
      completeOnboarding();
    }
  }

  const rechtsformen = [
    { id: "gmbh", label: "GmbH" },
    { id: "ug", label: "UG" },
    { id: "einzelunternehmen", label: "Einzelunternehmen" },
    { id: "gbr", label: "GbR" },
    { id: "ag", label: "AG" },
    { id: "kg", label: "KG" },
  ];

  const branchen = [
    { id: "handel", label: "E-Commerce & Handel" },
    { id: "dienstleistung", label: "Dienstleistung" },
    { id: "produktion", label: "Produktion & Handwerk" },
    { id: "gastronomie", label: "Gastronomie & Hotellerie" },
    { id: "andere", label: "Andere" },
  ];

  const verwendungszwecke = [
    { id: "wareneinkauf", label: "Wareneinkauf" },
    { id: "liquiditaet", label: "Liquiditätsengpass" },
    { id: "wachstum", label: "Wachstum & Expansion" },
    { id: "marketing", label: "Marketing" },
    { id: "andere", label: "Andere" },
  ];

  const onboardingTitles = [
    { title: "Wie viel möchten Sie finanzieren?", sub: "Wählen Sie Ihren gewünschten Kreditbetrag." },
    { title: "Wie lange soll die Laufzeit sein?", sub: "Oder benötigen Sie eine revolvierende Kreditlinie?" },
    { title: "Was trifft auf Sie zu?", sub: "Wählen Sie Ihre Rechtsform." },
    { title: "In welcher Branche sind Sie tätig?", sub: "Wir zeigen nur passende Angebote." },
    { title: "Wofür benötigen Sie die Finanzierung?", sub: "Mehrfachauswahl möglich." },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="relative z-10 bg-white border-b border-border">
        <div className="mx-auto px-[5%] xl:px-[10%] py-3">
          <div className="flex items-center justify-between">
            <Logo size="md" />
          </div>
        </div>
      </header>


      {/* Main */}
      <main className="flex-1 py-6 bg-white">
        <div className="mx-auto px-[5%] xl:px-[10%]">
          <div className="platform-layout">

            {/* Filter Sidebar */}
            <aside className="filter-sidebar">
              <div className="filter-sidebar-title">Filter</div>

              <div className="filter-group">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-turquoise" />
                  <span className="filter-label">Laufzeit</span>
                </div>
                <div className="flex gap-1 mb-1">
                  <button
                    onClick={() => setTermType("monate")}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${termType === "monate" ? "bg-turquoise text-white" : "bg-gray-100 text-subtle hover:bg-gray-200"}`}
                  >
                    Monate
                  </button>
                  <button
                    onClick={() => setTermType("linie")}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${termType === "linie" ? "bg-turquoise text-white" : "bg-gray-100 text-subtle hover:bg-gray-200"}`}
                  >
                    Linie
                  </button>
                </div>
                {termType === "monate" && (
                  <>
                    <div className="text-center">
                      <span className="filter-value">{termMonths} Monate</span>
                    </div>
                    <input type="range" min={1} max={60} step={1} value={termMonths}
                      onChange={e => setTermMonths(+e.target.value)}
                      className="funnel-slider" style={{ background: sliderBg(termMonths, 1, 60) }} />
                    <div className="funnel-slider-labels"><span>1</span><span>60 Mo</span></div>
                  </>
                )}
              </div>

              <div className="filter-group">
                <div className="flex items-center gap-1.5">
                  <Banknote className="h-3.5 w-3.5 text-turquoise" />
                  <span className="filter-label">Volumen</span>
                </div>
                <div className="text-center">
                  <span className="filter-value">{formatCurrency(volume)}</span>
                </div>
                <input type="range" min={5000} max={500000} step={5000} value={volume}
                  onChange={e => setVolume(+e.target.value)}
                  className="funnel-slider" style={{ background: sliderBg(volume, 5000, 500000) }} />
                <div className="funnel-slider-labels"><span>5k</span><span>500k</span></div>
              </div>

              <div className="filter-group">
                <span className="filter-label">Verwendungszweck</span>
                {([
                  { id: "wareneinkauf", label: "Wareneinkauf" },
                  { id: "liquiditaet", label: "Liquiditätsengpass" },
                  { id: "wachstum", label: "Wachstum & Expansion" },
                  { id: "marketing", label: "Marketing" },
                  { id: "andere", label: "Andere" },
                ]).map(({ id, label }) => {
                  const active = filterUseCases.includes(id);
                  return (
                    <button
                      key={id}
                      onClick={() => setFilterUseCases(active ? filterUseCases.filter((u) => u !== id) : [...filterUseCases, id])}
                      className={`w-full text-left text-xs font-medium px-3 py-2 rounded-lg mb-1 transition-all cursor-pointer flex items-center justify-between ${active ? "bg-turquoise text-white" : "bg-gray-100 text-subtle hover:bg-gray-200"}`}
                    >
                      {label}
                      {active && <Check className="h-3 w-3" />}
                    </button>
                  );
                })}
              </div>

              <div className="filter-group">
                <span className="filter-label">Merkmale</span>
                {([
                  { label: "Aufstockung möglich", value: filterTopUp, set: setFilterTopUp },
                  { label: "48h Auszahlung", value: filter48h, set: setFilter48h },
                  { label: "Flexible Rückzahlung", value: filterFlexRepayment, set: setFilterFlexRepayment },
                  { label: "Tilgungsfreie Zeit", value: filterGracePeriod, set: setFilterGracePeriod },
                  { label: "Negative Schufa/Crefo", value: filterNegativeSchufa, set: setFilterNegativeSchufa },
                ] as { label: string; value: boolean; set: (v: boolean) => void }[]).map(({ label, value, set }) => (
                  <button
                    key={label}
                    onClick={() => set(!value)}
                    className={`w-full text-left text-xs font-medium px-3 py-2 rounded-lg mb-1 transition-all cursor-pointer flex items-center justify-between ${value ? "bg-turquoise text-white" : "bg-gray-100 text-subtle hover:bg-gray-200"}`}
                  >
                    {label}
                    {value && <Check className="h-3 w-3" />}
                  </button>
                ))}
              </div>

              {(termMonths !== 12 || termType !== "monate" || volume !== 50000 || filterTopUp || filter48h || filterFlexRepayment || filterGracePeriod || filterNegativeSchufa || filterUseCases.length > 0) && (
                <button
                  onClick={() => { setTermType("monate"); setTermMonths(12); setVolume(50000); setFilterTopUp(false); setFilter48h(false); setFilterFlexRepayment(false); setFilterGracePeriod(false); setFilterNegativeSchufa(false); setFilterUseCases([]); }}
                  className="w-full text-center text-xs text-turquoise font-semibold mt-1 hover:underline cursor-pointer"
                >
                  Zuruecksetzen
                </button>
              )}

            </aside>

            {/* Results */}
            <div className="platform-results">
              <p className="platform-results-header">
                {loading || showOnboarding ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-block h-3 w-28 bg-gray-200 rounded animate-pulse" />
                  </span>
                ) : (
                  <><strong>{offers.length} Angebote</strong> verfügbar</>
                )}
              </p>


              <div className="flex flex-col gap-2">
                {loading || showOnboarding ? (
                  Array.from({ length: skeletonCount }).map((_, i) => <SkeletonCard key={i} />)
                ) : sortedOffers.length === 0 ? (
                  <div className="bg-white rounded-lg p-8 text-center">
                    <Search className="h-8 w-8 text-turquoise mx-auto mb-3" />
                    <p className="font-bold text-dark mb-1">Keine passenden Angebote</p>
                    <p className="text-sm text-subtle mb-4">Filter anpassen, um mehr Angebote zu sehen.</p>
                    <button onClick={() => { setTermType("monate"); setTermMonths(12); setVolume(50000); }} className="btn btn-md btn-primary">
                      Zuruecksetzen
                    </button>
                  </div>
                ) : (
                  sortedOffers.map((offer) => {
                    const m = (offer.metadata ?? {}) as Record<string, unknown>;
                    const ctaPrimary = m.cta_primary as string | undefined;
                    const days = m.processing_time_days as number | undefined;
                    const approvalPct = m.approval_rate_pct as number | undefined;
                    const hasFeeModel = !!m.fee_model && (m.fee_pct_from as number | undefined) != null;
                    const isCreditLine = (offer.product_type ?? "").toLowerCase().includes("linie") || (offer.product_type ?? "").toLowerCase().includes("credit_line");
                    const feePctFrom = m.fee_pct_from as number | undefined;
                    const effectiveVolume = Math.min(Math.max(volume, offer.min_volume), offer.max_volume);
                    const effectiveTerm = Math.min(Math.max(termMonths, offer.min_term_months), offer.max_term_months);
                    const volumeClamped = volume < offer.min_volume ? "min" : volume > offer.max_volume ? "max" : null;
                    const termClamped = !isCreditLine && (termMonths < offer.min_term_months ? "min" : termMonths > offer.max_term_months ? "max" : null);
                    const feeEur = feePctFrom != null ? Math.round(effectiveVolume * feePctFrom / 100) : null;
                    const monthlyPayment = isCreditLine ? null
                      : hasFeeModel
                        ? (feeEur != null ? Math.round((effectiveVolume + feeEur) / effectiveTerm) : null)
                        : Math.round(calculateMonthlyRate(effectiveVolume, offer.interest_rate_from ?? 0, effectiveTerm));
                    const pros = ((m.pros ?? []) as string[]).slice(0, 5);
                    const rateStr = (offer.interest_rate_from ?? 0).toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 2 });
                    const laufzeit = isCreditLine ? "Flexibel" : `${effectiveTerm} Monate`;
                    const isExpanded = expandedId === offer.product_id;
                    const feeModel = m.fee_model as string | undefined;
                    const repayment = m.repayment as string | undefined;
                    const description = m.description as string | undefined;
                    const cons = ((m.cons ?? []) as string[]);
                    const req = (m.requirements ?? {}) as Record<string, unknown>;

                    return (
                      <div key={offer.product_id} className="offer-card" style={volumeClamped || termClamped ? { opacity: 0.45 } : undefined}>
                        <div className="offer-card-body">
                          <div className="offer-card-grid">
                            {/* Col 1: Logo + Name */}
                            <div className="offer-card-provider">
                              <div className="offer-provider-logo">
                                {offer.provider_logo_url
                                  ? <img src={offer.provider_logo_url} alt={offer.provider_name} />
                                  : <span>{getProviderInitials(offer.provider_name)}</span>}
                              </div>
                              <div className="offer-provider-info">
                                <div className="offer-provider-name">{offer.provider_name}</div>
                                <div className="offer-product-name">{offer.product_name}</div>
                              </div>
                            </div>

                            {/* Col 2: Signal bars */}
                            <div className="offer-signals">
                              <SignalBar icon={Zap} metric={speedScore(days)} />
                              <SignalBar icon={ThumbsUp} metric={approvalScore(approvalPct)} />
                              <SignalBar icon={Tag} metric={priceScore(offer.interest_rate_from, hasFeeModel)} />
                              <SignalBar icon={Shuffle} metric={flexibilityScore(offer.product_type, m)} />
                            </div>

                            {/* Col 3: Pros */}
                            {pros.length > 0 && (
                              <div className="offer-pros">
                                {pros.map((p) => (
                                  <div key={p} className="offer-pro-item">
                                    <Check className="offer-pro-icon" />
                                    <span>{p}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Col 4: Konditionen + CTA */}
                            <div className="offer-card-pricing">
                              <div className="offer-terms-compact">
                                <span className="offer-terms-laufzeit">{effectiveVolume.toLocaleString("de-DE")} €</span>
                                <span className="offer-terms-rate">{`${rateStr}%`}</span>
                                {monthlyPayment != null && (
                                  <span className="offer-terms-calc">{`${monthlyPayment.toLocaleString("de-DE")} € mtl.`}</span>
                                )}
                                <div className="offer-terms-laufzeit">{laufzeit}</div>
                              </div>
                              <button className="offer-cta">
                                {ctaPrimary ?? "Jetzt anfragen"} <ArrowRight className="h-3 w-3" />
                              </button>
                            </div>
                          </div>

                          {/* Accordion toggle – inside card-body, no border */}
                          <button
                            className="offer-accordion-toggle"
                            onClick={() => setExpandedId(isExpanded ? null : offer.product_id)}
                          >
                            <ChevronDown className={`offer-accordion-chevron${isExpanded ? " offer-accordion-chevron-open" : ""}`} />
                            <span>{isExpanded ? "Weniger" : "Details"}</span>
                          </button>
                        </div>

                        {/* Accordion panel */}
                        {isExpanded && (
                          <div className="offer-accordion-panel">
                            {description && (
                              <p className="offer-accordion-desc">{description}</p>
                            )}
                            <div className="offer-accordion-grid">
                              <div className="offer-accordion-col">
                                <p className="offer-accordion-col-title">Konditionen</p>
                                <div className="offer-accordion-rows">
                                  <div className="offer-accordion-row"><span>Volumen</span><span>{formatCurrency(offer.min_volume)} – {formatCurrency(offer.max_volume)}</span></div>
                                  {!isCreditLine && <div className="offer-accordion-row"><span>Laufzeit</span><span>{offer.min_term_months}–{offer.max_term_months} Monate</span></div>}
                                  <div className="offer-accordion-row"><span>{hasFeeModel ? "Gebühr" : "Zinssatz"}</span><span>{hasFeeModel ? (feeModel ?? "Gebührenbasiert") : `${rateStr}% p.a.`}</span></div>
                                  {repayment && <div className="offer-accordion-row"><span>Rückzahlung</span><span>{repayment}</span></div>}
                                  {req.min_monthly_revenue_eur != null && <div className="offer-accordion-row"><span>Mindestumsatz</span><span>{(req.min_monthly_revenue_eur as number).toLocaleString("de-DE")} €/Mo.</span></div>}
                                </div>
                              </div>
                              {cons.length > 0 && (
                                <div className="offer-accordion-col">
                                  <p className="offer-accordion-col-title">Nachteile</p>
                                  <div className="flex flex-col gap-1.5">
                                    {cons.map((c) => (
                                      <div key={c} className="offer-accordion-con">
                                        <X className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--color-subtle)" }} />
                                        <span>{c}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}

                {/* Kontakt-Info */}
                {!loading && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1.5rem", padding: "1rem 1.25rem", borderRadius: "0.75rem", background: "var(--color-light-bg)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <MessageCircle className="h-4 w-4 shrink-0" style={{ color: "var(--color-subtle)" }} />
                      <p className="text-sm" style={{ color: "var(--color-subtle)" }}>
                        <span style={{ fontWeight: 600, color: "var(--color-dark)" }}>Kein passendes Angebot dabei?</span>{" "}
                        Wir beraten Sie gerne persönlich.
                      </p>
                    </div>
                    <a href="mailto:hallo@liquidnow.de" className="btn btn-secondary btn-sm" style={{ whiteSpace: "nowrap", flexShrink: 0 }}>Kontakt aufnehmen</a>
                  </div>
                )}
              </div>

              {!loading && sortedOffers.length > 0 && (
                <p className="text-xs text-subtle text-center mt-3">
                  Konditionen sind indikativ und koennen je nach Bonitaet abweichen.
                </p>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Onboarding Overlay — portal to body to escape stacking contexts */}
      {mounted && showOnboarding && createPortal(
        <div style={{ position: "fixed", inset: 0, background: "rgba(36,54,80,0.65)", backdropFilter: "blur(6px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "#fff", borderRadius: "1.5rem", padding: "2rem", width: "100%", maxWidth: "480px", boxShadow: "0 24px 80px rgba(0,0,0,0.25)" }}>

            {/* Progress dots */}
            <div style={{ display: "flex", gap: "0.375rem", marginBottom: "2rem" }}>
              {Array.from({ length: ONBOARDING_STEPS }).map((_, i) => (
                <div key={i} style={{ height: "3px", flex: 1, borderRadius: "2px", background: i <= onboardingStep ? "#507AA6" : "#D0DCE8", opacity: i < onboardingStep ? 0.4 : 1, transition: "background 0.3s" }} />
              ))}
            </div>

            {/* Title */}
            <p style={{ fontFamily: "var(--font-heading)", fontSize: "1.25rem", fontWeight: 700, color: "#243650", marginBottom: "0.375rem" }}>{onboardingTitles[onboardingStep].title}</p>
            <p style={{ fontSize: "0.8125rem", color: "#536B87", marginBottom: "1.5rem" }}>{onboardingTitles[onboardingStep].sub}</p>

            {/* Step 0: Volumen */}
            {onboardingStep === 0 && (
              <div style={{ marginBottom: "1.5rem" }}>
                <div style={{ textAlign: "center", marginBottom: "0.5rem" }}>
                  <span style={{ fontFamily: "var(--font-heading)", fontSize: "1.25rem", fontWeight: 700, color: "#243650" }}>{formatCurrency(volume)}</span>
                </div>
                <input type="range" min={5000} max={500000} step={5000} value={volume}
                  onChange={e => setVolume(+e.target.value)}
                  className="funnel-slider" style={{ background: sliderBg(volume, 5000, 500000) }} />
                <div className="funnel-slider-labels"><span>5k</span><span>500k</span></div>
              </div>
            )}

            {/* Step 1: Laufzeit */}
            {onboardingStep === 1 && (
              <div style={{ marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
                  {(["monate", "linie"] as const).map((t) => (
                    <button key={t} onClick={() => setTermType(t)} style={{ flex: 1, padding: "0.5rem", fontSize: "0.875rem", fontWeight: 600, borderRadius: "0.5rem", border: "none", cursor: "pointer", background: termType === t ? "#507AA6" : "#F3F6F9", color: termType === t ? "#fff" : "#536B87", transition: "all 0.15s" }}>
                      {t === "monate" ? "Laufzeitkredit" : "Kreditlinie"}
                    </button>
                  ))}
                </div>
                {termType === "monate" && (
                  <>
                    <div style={{ textAlign: "center", marginBottom: "0.5rem" }}>
                      <span style={{ fontFamily: "var(--font-heading)", fontSize: "1.25rem", fontWeight: 700, color: "#243650" }}>{termMonths} Monate</span>
                    </div>
                    <input type="range" min={1} max={60} step={1} value={termMonths}
                      onChange={e => setTermMonths(+e.target.value)}
                      className="funnel-slider" style={{ background: sliderBg(termMonths, 1, 60) }} />
                    <div className="funnel-slider-labels"><span>1</span><span>60 Mo</span></div>
                  </>
                )}
              </div>
            )}

            {/* Step 2: Rechtsform */}
            {onboardingStep === 2 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.5rem", marginBottom: "1.5rem" }}>
                {rechtsformen.map(({ id, label }) => {
                  const sel = filterRechtsform === id;
                  return (
                    <button key={id} onClick={() => setFilterRechtsform(sel ? "" : id)} style={{ padding: "0.625rem 0.5rem", borderRadius: "0.75rem", border: `1.5px solid ${sel ? "#507AA6" : "#D0DCE8"}`, fontSize: "0.8125rem", fontWeight: 600, color: sel ? "#243650" : "#536B87", background: sel ? "#E8EEF5" : "#fff", cursor: "pointer", transition: "all 0.15s" }}>
                      {label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Step 3: Branche */}
            {onboardingStep === 3 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.5rem" }}>
                {branchen.map(({ id, label }) => {
                  const sel = filterBranche === id;
                  return (
                    <button key={id} onClick={() => setFilterBranche(sel ? "" : id)} style={{ padding: "0.75rem 1rem", borderRadius: "0.75rem", border: `1.5px solid ${sel ? "#507AA6" : "#D0DCE8"}`, fontSize: "0.8125rem", fontWeight: 600, color: sel ? "#243650" : "#536B87", background: sel ? "#E8EEF5" : "#fff", cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}>
                      {label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Step 4: Verwendungszweck */}
            {onboardingStep === 4 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.5rem", marginBottom: "1.5rem" }}>
                {verwendungszwecke.map(({ id, label }) => {
                  const active = filterUseCases.includes(id);
                  return (
                    <button key={id} onClick={() => setFilterUseCases(active ? filterUseCases.filter(u => u !== id) : [...filterUseCases, id])} style={{ padding: "0.625rem 0.5rem", borderRadius: "0.75rem", border: `1.5px solid ${active ? "#507AA6" : "#D0DCE8"}`, fontSize: "0.8125rem", fontWeight: 600, color: active ? "#243650" : "#536B87", background: active ? "#E8EEF5" : "#fff", cursor: "pointer", transition: "all 0.15s" }}>
                      {label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Count */}
            {!loading && (
              <p style={{ fontSize: "0.75rem", textAlign: "center", color: "#536B87", marginBottom: "1rem" }}>
                {matchingCount === 0 ? "Keine passenden Angebote" : <><strong style={{ color: "#243650" }}>{matchingCount}</strong> passende Angebote</>}
              </p>
            )}

            {/* Actions */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
              <button onClick={nextStep} className="btn btn-primary btn-md" style={{ width: "100%" }}>
                {onboardingStep < ONBOARDING_STEPS - 1 ? "Weiter →" : "Angebote anzeigen →"}
              </button>
              <button onClick={completeOnboarding} style={{ fontSize: "0.75rem", color: "#536B87", cursor: "pointer", textDecoration: "underline", background: "none", border: "none", padding: "0.25rem" }}>
                Überspringen
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
