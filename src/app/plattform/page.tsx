"use client";

import { useState, useEffect, useCallback } from "react";
import { Award, Check, Clock, Percent, ArrowRight, Search, Zap, CalendarRange, Banknote, Timer, Star, Shield } from "lucide-react";
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
  const [termRange, setTermRange] = useState<[number, number]>([1, 60]);
  const [rateRange, setRateRange] = useState<[number, number]>([0, 25]);
  const [sortBy, setSortBy] = useState<SortKey>("speed");

  const fetchOffers = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("get_platform_offers", {
      p_min_term_months: termRange[0],
      p_max_term_months: termRange[1],
      p_min_interest_rate: rateRange[0],
      p_max_interest_rate: rateRange[1],
    });
    if (!error && data) setOffers(data as Offer[]);
    setLoading(false);
  }, [termRange, rateRange]);

  useEffect(() => { fetchOffers(); }, [fetchOffers]);

  const sortedOffers = [...offers].sort((a, b) => {
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

  const rateMin = offers.length ? Math.min(...offers.map(o => o.interest_rate_from)) : 0;
  const rateMax = offers.length ? Math.max(...offers.map(o => o.interest_rate_to)) : 0;

  return (
    <div className="flex flex-col min-h-screen relative" style={{ background: "linear-gradient(180deg, rgba(255,215,0,0.06) 0%, rgba(0,206,209,0.08) 40%, #ffffff 70%)" }}>
      {/* Header */}
      <header className="relative z-10 border-b border-gray-200 bg-white">
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
              <div className="text-center pb-4 mb-4 border-b border-gray-200">
                <img
                  src="/ki-assistant.png"
                  alt="KI-Assistentin"
                  className="w-14 h-14 rounded-full object-cover mx-auto mb-2 border-2 border-turquoise"
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
                <div className="flex items-center justify-between">
                  <span className="filter-value">{termRange[0]} Mo</span>
                  <span className="text-xs text-subtle">–</span>
                  <span className="filter-value">{termRange[1]} Mo</span>
                </div>
                <input type="range" min={1} max={60} step={1} value={termRange[0]}
                  onChange={e => { const v = +e.target.value; if (v < termRange[1]) setTermRange([v, termRange[1]]); }}
                  className="funnel-slider" style={{ background: sliderBg(termRange[0], 1, 60) }} />
                <input type="range" min={1} max={60} step={1} value={termRange[1]}
                  onChange={e => { const v = +e.target.value; if (v > termRange[0]) setTermRange([termRange[0], v]); }}
                  className="funnel-slider" style={{ background: sliderBg(termRange[1], 1, 60) }} />
                <div className="funnel-slider-labels"><span>1</span><span>60 Mo</span></div>
              </div>

              <div className="filter-group">
                <div className="flex items-center gap-1.5">
                  <Percent className="h-3.5 w-3.5 text-turquoise" />
                  <span className="filter-label">Zinssatz</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="filter-value">{rateRange[0].toFixed(1)}%</span>
                  <span className="text-xs text-subtle">–</span>
                  <span className="filter-value">{rateRange[1].toFixed(1)}%</span>
                </div>
                <input type="range" min={0} max={25} step={0.5} value={rateRange[0]}
                  onChange={e => { const v = +e.target.value; if (v < rateRange[1]) setRateRange([v, rateRange[1]]); }}
                  className="funnel-slider" style={{ background: sliderBg(rateRange[0], 0, 25) }} />
                <input type="range" min={0} max={25} step={0.5} value={rateRange[1]}
                  onChange={e => { const v = +e.target.value; if (v > rateRange[0]) setRateRange([rateRange[0], v]); }}
                  className="funnel-slider" style={{ background: sliderBg(rateRange[1], 0, 25) }} />
                <div className="funnel-slider-labels"><span>0%</span><span>25%</span></div>
              </div>

              {(termRange[0] !== 1 || termRange[1] !== 60 || rateRange[0] !== 0 || rateRange[1] !== 25) && (
                <button
                  onClick={() => { setTermRange([1, 60]); setRateRange([0, 25]); }}
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
                  <><strong>{offers.length} Angebote</strong> ({rateMin.toFixed(2)}% – {rateMax.toFixed(2)}% p.a.)</>
                )}
              </p>

              <div className="platform-sort-tabs">
                {(["rate", "speed", "volume", "term"] as SortKey[]).map(key => (
                  <button key={key} className={`platform-sort-tab ${sortBy === key ? "platform-sort-tab-active" : ""}`} onClick={() => setSortBy(key)}>
                    {{ rate: "Niedrigster Zins", speed: "Schnellste Auszahlung", volume: "Hoechstes Volumen", term: "Laengste Laufzeit" }[key]}
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-2">
                {loading ? (
                  <><SkeletonCard /><SkeletonCard /><SkeletonCard /></>
                ) : sortedOffers.length === 0 ? (
                  <div className="bg-white rounded-lg p-8 text-center border border-gray-200">
                    <Search className="h-8 w-8 text-turquoise mx-auto mb-3" />
                    <p className="font-bold text-dark mb-1">Keine passenden Angebote</p>
                    <p className="text-sm text-subtle mb-4">Filter anpassen, um mehr Angebote zu sehen.</p>
                    <button onClick={() => { setTermRange([1, 60]); setRateRange([0, 25]); }} className="btn btn-md btn-primary">
                      Zuruecksetzen
                    </button>
                  </div>
                ) : (
                  sortedOffers.map((offer, idx) => {
                    const m = (offer.metadata ?? {}) as Record<string, unknown>;
                    const isBest = idx === 0;
                    const monthly = calculateMonthlyRate(offer.min_volume, offer.interest_rate_from, offer.max_term_months);
                    const days = m.processing_time_days as number | undefined;
                    const highlight = m.highlight as string | undefined;
                    const tags = (m.tags ?? []) as string[];
                    const trustpilot = m.trustpilot as number | undefined;
                    const fees = (m.fee_model ?? m.fees) as string | undefined;
                    const note = m.note as string | undefined;
                    const sortLabel = { rate: "Beste Konditionen", speed: "Schnellste Auszahlung", volume: "Hoechstes Volumen", term: "Laengste Laufzeit" }[sortBy];

                    return (
                      <div key={offer.product_id} className={`offer-card ${isBest ? "offer-card-best" : ""}`}>
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

                          {/* Details */}
                          <div className="offer-card-details">
                            <div className="offer-features-grid">
                              <div className="offer-feature">
                                <Check className="offer-feature-icon" />
                                <span><strong>{offer.interest_rate_from.toFixed(2)}%–{offer.interest_rate_to.toFixed(2)}%</strong> p.a.</span>
                              </div>
                              <div className="offer-feature">
                                <CalendarRange className="offer-feature-icon" />
                                <span><strong>{offer.min_term_months}–{offer.max_term_months}</strong> Monate</span>
                              </div>
                              <div className="offer-feature">
                                <Banknote className="offer-feature-icon" />
                                <span><strong>{formatVolume(offer.min_volume)}–{formatVolume(offer.max_volume)}</strong> EUR</span>
                              </div>
                              {days && (
                                <div className="offer-feature">
                                  <Timer className="offer-feature-icon" />
                                  <span>{days === 1 ? <strong>24h Auszahlung</strong> : <><strong>{days} Tage</strong> Bearbeitung</>}</span>
                                </div>
                              )}
                              {fees && (
                                <div className="offer-feature">
                                  <Zap className="offer-feature-icon" />
                                  <span>{fees}</span>
                                </div>
                              )}
                            </div>
                            {tags.length > 0 && (
                              <div className="offer-tags">
                                {tags.map(t => (
                                  <span key={t} className={`offer-tag ${t.includes("24h") || t.includes("Foerderung") || t.includes("Banklizenz") ? "offer-tag-highlight" : ""}`}>
                                    {t}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Pricing */}
                          <div className="offer-card-pricing">
                            <div className="offer-rate-label">ab</div>
                            <div className="offer-rate offer-rate-highlight">{offer.interest_rate_from.toFixed(2)}%</div>
                            <div className="offer-rate-label">p.a. effektiv</div>
                            <div className="offer-monthly">ab {formatCurrency(monthly)}/Mo</div>
                            <div className="offer-monthly-label">monatl. Rate</div>
                            <button className="offer-cta">
                              Jetzt anfragen <ArrowRight className="h-3 w-3" />
                            </button>
                            {note && <div className="offer-cta-sub">{note}</div>}
                          </div>
                        </div>
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
