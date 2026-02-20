"use client";

import { useState, useEffect, useCallback } from "react";
import { Award, Check, Clock, ArrowRight, Search, Zap, CalendarRange, Banknote, Timer, Star, Shield, ThumbsUp, ChevronDown, X, FileCheck } from "lucide-react";
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
    <div className="offer-skeleton animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 bg-gray-200 rounded" />
        <div>
          <div className="h-3.5 w-20 bg-gray-200 rounded mb-1.5" />
          <div className="h-2.5 w-16 bg-gray-100 rounded" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
        <div className="h-3 w-full bg-gray-100 rounded" />
        <div className="h-3 w-full bg-gray-100 rounded" />
        <div className="h-3 w-4/5 bg-gray-100 rounded" />
        <div className="h-3 w-3/4 bg-gray-100 rounded" />
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <div className="h-2.5 w-12 bg-gray-100 rounded" />
        <div className="h-6 w-20 bg-gray-200 rounded" />
        <div className="h-8 w-full bg-gray-200 rounded mt-1" />
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

  const matchesAll = (offer: Offer) => matchesTerm(offer) && matchesVolume(offer);

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
    `linear-gradient(to right, #00CED1 0%, #00CED1 ${((val - min) / (max - min)) * 100}%, #E5E7EB ${((val - min) / (max - min)) * 100}%, #E5E7EB 100%)`;

  return (
    <div className="flex flex-col min-h-screen relative bg-white">
      {/* Header */}
      <header className="relative z-10 bg-white">
        <div className="mx-auto px-[5%] xl:px-[10%] py-2.5">
          <div className="flex items-center justify-between">
            <Logo size="md" />
            <div className="flex items-center gap-2 text-xs text-subtle">
              <Shield className="h-3.5 w-3.5 text-turquoise" />
              <span className="hidden sm:inline">Unabhaengiger Vergleich</span>
            </div>
          </div>
        </div>
      </header>

      {/* Wave Background – bottom of viewport */}
      <div className="fixed top-0 left-0 w-full h-screen overflow-hidden pointer-events-none z-0">
        <div className="absolute bottom-0 left-0 w-full opacity-70">
          <div className="hero-wave">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2880 320" preserveAspectRatio="none" className="w-full h-full">
              <path
                fill="#00CED1"
                fillOpacity="0.15"
                d="M0,200C240,150,480,150,720,200C960,250,1200,250,1440,200C1680,150,1920,150,2160,200C2400,250,2640,250,2880,200L2880,320L0,320Z"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Main */}
      <main className="relative z-10 flex-1 py-4">
        <div className="mx-auto px-[5%] xl:px-[10%]">
          <div className="platform-layout">

            {/* Filter Sidebar */}
            <aside className="filter-sidebar">
              {/* KI Assistant */}
              <div className="text-center pb-4 mb-4">
                <img
                  src="/ki-assistant.png"
                  alt="KI-Assistentin"
                  className="w-14 h-14 rounded-full object-cover mx-auto mb-2 shadow-md"
                />
                <p className="text-sm font-semibold text-dark mb-0.5">Deine KI-Assistentin</p>
                <p className="text-xs text-subtle">
                  Ich helfe dir persoenlich bei der Antragstellung — schnell und unkompliziert.
                </p>
              </div>

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

              {(termMonths !== 12 || termType !== "monate" || volume !== 50000) && (
                <button
                  onClick={() => { setTermType("monate"); setTermMonths(12); setVolume(50000); }}
                  className="w-full text-center text-xs text-turquoise font-semibold mt-1 hover:underline cursor-pointer"
                >
                  Zuruecksetzen
                </button>
              )}

            </aside>

            {/* Results */}
            <div className="platform-results">
              <p className="platform-results-header">
                {loading ? "Lade Angebote..." : (
                  <><strong>{offers.length} Angebote</strong> verfuegbar</>
                )}
              </p>

              <div className="platform-sort-tabs">
                {(["rate", "speed", "volume", "term"] as SortKey[]).map(key => (
                  <button key={key} className={`platform-sort-tab ${sortBy === key ? "platform-sort-tab-active" : ""}`} onClick={() => setSortBy(key)}>
                    {{ rate: "Niedrigster Zins", speed: "24h Auszahlung", volume: "Hoechstes Volumen", term: "Laengste Laufzeit" }[key]}
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-2">
                {loading ? (
                  <><SkeletonCard /><SkeletonCard /><SkeletonCard /></>
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
                  sortedOffers.map((offer, idx) => {
                    const m = (offer.metadata ?? {}) as Record<string, unknown>;
                    const isMatch = matchesAll(offer);
                    const isBest = idx === 0 && isMatch;
                    const calcTerm = termType === "monate" && matchesTerm(offer) ? termMonths : offer.max_term_months;
                    const calcVolume = matchesVolume(offer) ? volume : offer.min_volume;
                    const monthly = calculateMonthlyRate(calcVolume, offer.interest_rate_from, calcTerm);
                    const days = m.processing_time_days as number | undefined;
                    const highlight = m.highlight as string | undefined;
                    const tags = (m.tags ?? []) as string[];
                    const trustpilot = m.trustpilot as number | undefined;
                    const fees = (m.fee_model ?? m.fees) as string | undefined;
                    const note = m.note as string | undefined;
                    const description = m.description as string | undefined;
                    const approvalRate = m.approval_rate_pct as number | undefined;
                    const ctaPrimary = m.cta_primary as string | undefined;
                    const repayment = m.repayment as string | undefined;
                    const feeExample = m.fee_example as string | undefined;
                    const pros = (m.pros ?? []) as string[];
                    const cons = (m.cons ?? []) as string[];
                    const useCases = (m.use_cases ?? []) as string[];
                    const requirements = m.requirements as Record<string, unknown> | undefined;
                    const suitability = m.suitability as Record<string, unknown> | undefined;
                    const trust = m.trust as Record<string, unknown> | undefined;
                    const isExpanded = expandedId === offer.product_id;
                    const hasTabs = !!(requirements || suitability || trust || feeExample || repayment || useCases.length);
                    const sortLabel = { rate: "Beste Konditionen", speed: "24h Auszahlung", volume: "Hoechstes Volumen", term: "Laengste Laufzeit" }[sortBy];

                    return (
                      <div key={offer.product_id} className={`offer-card ${isBest ? "offer-card-best" : ""} ${!isMatch ? "opacity-50" : ""}`}>
                        {/* Top bar */}
                        <div className="offer-card-topbar">
                          {isBest && (
                            <span className="offer-card-badge">
                              <Award className="h-3 w-3" /> {sortLabel}
                            </span>
                          )}
                          {highlight && <span className="offer-highlight-label">{highlight}</span>}
                        </div>

                        {/* Body */}
                        <div className="offer-card-body">
                          {/* Provider */}
                          <div className="offer-card-provider">
                            <div className="offer-provider-logo">
                              {offer.provider_logo_url
                                ? <img src={offer.provider_logo_url} alt={offer.provider_name} />
                                : <span>{getProviderInitials(offer.provider_name)}</span>}
                            </div>
                            <div className="offer-provider-info">
                              <div className="offer-provider-name">{offer.provider_name}</div>
                              <div className="offer-product-name">{offer.product_name}</div>
                              <div className="flex flex-col items-center gap-1 mt-1">
                                {trustpilot && <TrustpilotStars rating={trustpilot} />}
                                <span className={`offer-provider-type-badge ${offer.provider_type === "fintech" ? "offer-provider-type-badge-fintech" : ""}`}>
                                  {offer.provider_type === "bank" ? "Bank" : "Fintech"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Description row */}
                          {description && <div className="offer-description">{description}</div>}

                          {/* Details */}
                          <div className="offer-card-details">
                            <div className="offer-details-cols">
                              <div className="offer-features-grid">
                                <div className="offer-feature">
                                  <Check className="offer-feature-icon" />
                                  <span><strong>{offer.interest_rate_from.toFixed(2)}%–{offer.interest_rate_to.toFixed(2)}%</strong> p.a.</span>
                                </div>
                                <div className="offer-feature">
                                  <Banknote className="offer-feature-icon" />
                                  <span><strong>{formatVolume(offer.min_volume)}–{formatVolume(offer.max_volume)}</strong> EUR</span>
                                </div>
                                {fees && (
                                  <div className="offer-feature">
                                    <Zap className="offer-feature-icon" />
                                    <span>{fees}</span>
                                  </div>
                                )}
                              </div>
                              {(pros.length > 0 || cons.length > 0 || requirements?.min_monthly_revenue_eur != null) && (
                                <div className="offer-proscons-compact">
                                  {requirements?.min_monthly_revenue_eur != null && (
                                    <div className="offer-proscon-item offer-proscon-pro">
                                      <Check className="h-3 w-3" />
                                      <span>ab {(requirements.min_monthly_revenue_eur as number).toLocaleString("de-DE")}€ Monatsumsatz</span>
                                    </div>
                                  )}
                                  {pros.slice(0, 3).map(p => (
                                    <div key={p} className="offer-proscon-item offer-proscon-pro">
                                      <Check className="h-3 w-3" />
                                      <span>{p}</span>
                                    </div>
                                  ))}
                                  {cons.slice(0, 1).map(c => (
                                    <div key={c} className="offer-proscon-item offer-proscon-con">
                                      <X className="h-3 w-3" />
                                      <span>{c}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Pricing */}
                          <div className="offer-card-pricing">
                            {termType === "monate" && isMatch && (
                              <div className="text-xs font-semibold text-turquoise mb-1">{termMonths} Monate</div>
                            )}
                            {!isMatch && (
                              <div className="text-xs font-semibold text-dark/40 mb-1">{offer.min_term_months}–{offer.max_term_months} Mo</div>
                            )}
                            <div className="offer-rate-label">ab</div>
                            <div className="offer-rate offer-rate-highlight">{offer.interest_rate_from.toFixed(2)}%</div>
                            <div className="offer-rate-label">p.a. effektiv</div>
                            <div className="offer-monthly">ab {formatCurrency(monthly)}/Mo</div>
                            <div className="offer-monthly-label">monatl. Rate</div>
                            <button className="offer-cta">
                              {ctaPrimary ?? "Jetzt anfragen"} <ArrowRight className="h-3 w-3" />
                            </button>
                            {note && <div className="offer-cta-sub">{note}</div>}
                          </div>
                        </div>

                        {/* More info toggle */}
                        {hasTabs && (
                          <button
                            className="offer-more-toggle"
                            onClick={() => setExpandedId(isExpanded ? null : offer.product_id)}
                          >
                            <span>{isExpanded ? "Weniger anzeigen" : "Mehr Informationen"}</span>
                            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                          </button>
                        )}

                        {/* Expanded content */}
                        {isExpanded && hasTabs && (
                          <div className="offer-accordion">
                            <div className="offer-tab-content">
                              <div className="detail-two-col">
                                <div>
                                  <div className="detail-item-label" style={{ marginBottom: "0.375rem" }}>Konditionen</div>
                                  <div className="detail-table">
                                    <div className="detail-table-row">
                                      <span className="detail-table-label">Betrag</span>
                                      <span className="detail-table-value">{formatVolume(offer.min_volume)} – {formatVolume(offer.max_volume)} EUR</span>
                                    </div>
                                    <div className="detail-table-row">
                                      <span className="detail-table-label">Laufzeit</span>
                                      <span className="detail-table-value">{offer.min_term_months} – {offer.max_term_months} Monate</span>
                                    </div>
                                    <div className="detail-table-row">
                                      <span className="detail-table-label">{fees ? "Gebuehr" : "Zinssatz"}</span>
                                      <span className="detail-table-value">{fees ?? `${offer.interest_rate_from.toFixed(2)}% – ${offer.interest_rate_to.toFixed(2)}% p.a.`}</span>
                                    </div>
                                    {days && (
                                      <div className="detail-table-row">
                                        <span className="detail-table-label">Bearbeitung</span>
                                        <span className="detail-table-value">{days === 1 ? "24h Auszahlung" : `${days} Tage`}</span>
                                      </div>
                                    )}
                                    {feeExample && (
                                      <div className="detail-table-row">
                                        <span className="detail-table-label">Beispiel</span>
                                        <span className="detail-table-value">{feeExample}</span>
                                      </div>
                                    )}
                                    {repayment && (
                                      <div className="detail-table-row">
                                        <span className="detail-table-label">Rueckzahlung</span>
                                        <span className="detail-table-value">{repayment}</span>
                                      </div>
                                    )}
                                  </div>
                                  {useCases.length > 0 && (
                                    <div style={{ marginTop: "0.75rem" }}>
                                      <div className="detail-item-label" style={{ marginBottom: "0.375rem" }}>Verwendungszwecke</div>
                                      <div className="detail-usecases">
                                        {useCases.map(uc => (
                                          <span key={uc} className="detail-usecase">{uc}</span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                {requirements && (
                                  <div>
                                    <div className="detail-item-label" style={{ marginBottom: "0.375rem" }}>Kriterien</div>
                                    <div className="detail-table">
                                      {requirements.min_monthly_revenue_eur != null && (
                                        <div className="detail-table-row">
                                          <span className="detail-table-label">Mindestumsatz</span>
                                          <span className="detail-table-value">{(requirements.min_monthly_revenue_eur as number).toLocaleString("de-DE")} EUR/Monat</span>
                                        </div>
                                      )}
                                      {requirements.bank_statements_months != null && (
                                        <div className="detail-table-row">
                                          <span className="detail-table-label">Kontoauszuege</span>
                                          <span className="detail-table-value">mind. {requirements.bank_statements_months as number} Monate</span>
                                        </div>
                                      )}
                                      {requirements.openbanking != null && (
                                        <div className="detail-table-row">
                                          <span className="detail-table-label">Openbanking</span>
                                          <span className="detail-table-value">erforderlich</span>
                                        </div>
                                      )}
                                      {requirements.ubo_required != null && (
                                        <div className="detail-table-row">
                                          <span className="detail-table-label">UBO/Shareholder</span>
                                          <span className="detail-table-value">{requirements.ubo_required as string}</span>
                                        </div>
                                      )}
                                      {requirements.for_100k != null && (
                                        <div className="detail-table-row">
                                          <span className="detail-table-label">Ab 100k</span>
                                          <span className="detail-table-value">{requirements.for_100k as string}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
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
    </div>
  );
}
