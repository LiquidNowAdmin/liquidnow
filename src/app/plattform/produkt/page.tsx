"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  X,
  CalendarRange,
  Banknote,
  Timer,
  Zap,
  FileCheck,
  ThumbsUp,
  Shield,
} from "lucide-react";
import Logo from "@/components/Logo";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase";

interface ProductDetail {
  id: string;
  name: string;
  type: string;
  min_volume: number;
  max_volume: number;
  min_term_months: number;
  max_term_months: number;
  interest_rate_from: number;
  interest_rate_to: number;
  metadata: Record<string, unknown> | null;
  provider: {
    id: string;
    name: string;
    type: string;
    logo_url: string | null;
    website: string | null;
  };
}

function formatVolume(v: number): string {
  if (v >= 1000) return `${(v / 1000).toFixed(0)}k`;
  return `${v}`;
}

function ProduktContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    async function fetch() {
      const supabase = createClient();
      const { data } = await supabase
        .from("products")
        .select("*, provider:providers(id, name, type, logo_url, website)")
        .eq("id", id)
        .single();
      if (data) setProduct(data as unknown as ProductDetail);
      setLoading(false);
    }
    fetch();
  }, [id]);

  if (!id) {
    return (
      <div className="detail-page">
        <p className="text-subtle">Kein Produkt angegeben.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="detail-page">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-gray-200 rounded mb-4" />
          <div className="h-4 w-64 bg-gray-100 rounded mb-8" />
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="h-20 bg-gray-100 rounded" />
            <div className="h-20 bg-gray-100 rounded" />
            <div className="h-20 bg-gray-100 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="detail-page">
        <Link href="/plattform" className="detail-back">
          <ArrowLeft className="h-4 w-4" /> Zurueck
        </Link>
        <p className="text-subtle">Produkt nicht gefunden.</p>
      </div>
    );
  }

  const m = (product.metadata ?? {}) as Record<string, unknown>;
  const description = m.description as string | undefined;
  const tags = (m.tags ?? []) as string[];
  const approvalRate = m.approval_rate_pct as number | undefined;
  const decisionSpeed = m.decision_speed as string | undefined;
  const payoutSpeed = m.payout_speed as string | undefined;
  const feeModel = m.fee_model as string | undefined;
  const feeExample = m.fee_example as string | undefined;
  const repayment = m.repayment as string | undefined;
  const fees = m.fees as string | undefined;
  const days = m.processing_time_days as number | undefined;
  const pros = (m.pros ?? []) as string[];
  const cons = (m.cons ?? []) as string[];
  const useCases = (m.use_cases ?? []) as string[];
  const ctaPrimary = m.cta_primary as string | undefined;
  const ctaSecondary = m.cta_secondary as string | undefined;

  const requirements = m.requirements as Record<string, unknown> | undefined;
  const suitability = m.suitability as Record<string, unknown> | undefined;
  const trust = m.trust as Record<string, unknown> | undefined;

  const initials = product.provider.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();

  return (
    <div className="detail-page">
      <Link href="/plattform" className="detail-back">
        <ArrowLeft className="h-4 w-4" /> Zurueck zur Uebersicht
      </Link>

      {/* Hero */}
      <div className="detail-hero">
        <div className="detail-hero-logo">
          {product.provider.logo_url ? (
            <img src={product.provider.logo_url} alt={product.provider.name} />
          ) : (
            <span>{initials}</span>
          )}
        </div>
        <div className="detail-hero-info">
          <div className="detail-hero-provider">{product.provider.name}</div>
          <div className="detail-hero-product">{product.name}</div>
          {description && (
            <div className="detail-hero-desc">{description}</div>
          )}
        </div>
      </div>

      {/* Badges */}
      {tags.length > 0 && (
        <div className="detail-badges">
          {tags.map((t) => (
            <span
              key={t}
              className={`detail-badge ${t.includes("Zusagen") ? "detail-badge-green" : ""}`}
            >
              {t}
            </span>
          ))}
        </div>
      )}

      {/* KPIs */}
      {(approvalRate || decisionSpeed || payoutSpeed) && (
        <div className="detail-kpis">
          {approvalRate && (
            <div className="detail-kpi">
              <div className="detail-kpi-value">{approvalRate}%</div>
              <div className="detail-kpi-label">Zusagequote</div>
            </div>
          )}
          {decisionSpeed && (
            <div className="detail-kpi">
              <div className="detail-kpi-value">{decisionSpeed}</div>
              <div className="detail-kpi-label">Entscheidung</div>
            </div>
          )}
          {payoutSpeed && (
            <div className="detail-kpi">
              <div className="detail-kpi-value">{payoutSpeed}</div>
              <div className="detail-kpi-label">Auszahlung</div>
            </div>
          )}
        </div>
      )}

      {/* Konditionen */}
      <div className="detail-section">
        <div className="detail-section-title">Konditionen</div>
        <div className="detail-grid">
          <div className="detail-item">
            <span className="detail-item-label">
              <Banknote
                className="inline h-3.5 w-3.5 mr-1"
                style={{ color: "var(--color-turquoise)" }}
              />
              Betrag
            </span>
            <span className="detail-item-value">
              {formatVolume(product.min_volume)} –{" "}
              {formatVolume(product.max_volume)} EUR
            </span>
          </div>
          {product.min_term_months > 0 && (
            <div className="detail-item">
              <span className="detail-item-label">
                <CalendarRange
                  className="inline h-3.5 w-3.5 mr-1"
                  style={{ color: "var(--color-turquoise)" }}
                />
                Laufzeit
              </span>
              <span className="detail-item-value">
                {product.min_term_months} – {product.max_term_months} Monate
              </span>
            </div>
          )}
          <div className="detail-item">
            <span className="detail-item-label">
              <Zap
                className="inline h-3.5 w-3.5 mr-1"
                style={{ color: "var(--color-turquoise)" }}
              />
              {feeModel ? "Gebuehr" : "Zinssatz"}
            </span>
            <span className="detail-item-value">
              {feeModel ??
                `${product.interest_rate_from.toFixed(2)}% – ${product.interest_rate_to.toFixed(2)}% p.a.`}
            </span>
          </div>
          {days && (
            <div className="detail-item">
              <span className="detail-item-label">
                <Timer
                  className="inline h-3.5 w-3.5 mr-1"
                  style={{ color: "var(--color-turquoise)" }}
                />
                Bearbeitung
              </span>
              <span className="detail-item-value">
                {days === 1 ? "24h Auszahlung" : `${days} Tage`}
              </span>
            </div>
          )}
          {feeExample && (
            <div className="detail-item">
              <span className="detail-item-label">Beispiel</span>
              <span className="detail-item-value">{feeExample}</span>
            </div>
          )}
          {repayment && (
            <div className="detail-item">
              <span className="detail-item-label">Rueckzahlung</span>
              <span className="detail-item-value">{repayment}</span>
            </div>
          )}
          {fees && !feeModel && (
            <div className="detail-item">
              <span className="detail-item-label">Gebuehren</span>
              <span className="detail-item-value">{fees}</span>
            </div>
          )}
        </div>
      </div>

      {/* Requirements */}
      {requirements && (
        <div className="detail-section">
          <div className="detail-section-title">Requirements</div>
          <div className="detail-req-list">
            {requirements.min_monthly_revenue_eur != null && (
              <div className="detail-req-item">
                <FileCheck className="h-4 w-4 detail-req-icon" />
                <span>
                  Mindestumsatz:{" "}
                  <strong>
                    {(
                      requirements.min_monthly_revenue_eur as number
                    ).toLocaleString("de-DE")}{" "}
                    EUR/Monat
                  </strong>
                </span>
              </div>
            )}
            {requirements.bank_statements_months != null && (
              <div className="detail-req-item">
                <FileCheck className="h-4 w-4 detail-req-icon" />
                <span>
                  Kontoauszuege: mind.{" "}
                  <strong>
                    {requirements.bank_statements_months as number} Monate
                  </strong>{" "}
                  (vollstaendig)
                </span>
              </div>
            )}
            {requirements.openbanking != null && (
              <div className="detail-req-item">
                <FileCheck className="h-4 w-4 detail-req-icon" />
                <span>
                  Openbanking: <strong>erforderlich</strong>
                </span>
              </div>
            )}
            {requirements.ubo_required != null && (
              <div className="detail-req-item">
                <FileCheck className="h-4 w-4 detail-req-icon" />
                <span>
                  UBO/Shareholder: <strong>{requirements.ubo_required as string}</strong>
                </span>
              </div>
            )}
            {requirements.for_100k != null && (
              <div className="detail-req-item">
                <FileCheck className="h-4 w-4 detail-req-icon" />
                <span>
                  Ab 100k: <strong>{requirements.for_100k as string}</strong>
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Eignung */}
      {suitability && (
        <div className="detail-section">
          <div className="detail-section-title">Eignung</div>
          <div className="detail-grid">
            {suitability.crefo_max != null && (
              <div className="detail-item">
                <span className="detail-item-label">Crefo Score</span>
                <span className="detail-item-value">
                  bis {suitability.crefo_max as number}
                </span>
              </div>
            )}
            {suitability.typical_profile != null && (
              <div className="detail-item">
                <span className="detail-item-label">Typisches Profil</span>
                <span className="detail-item-value">
                  {suitability.typical_profile as string}
                </span>
              </div>
            )}
          </div>
          {(suitability.good_for as string[] | undefined)?.length && (
            <div className="detail-usecases" style={{ marginTop: "0.75rem" }}>
              {(suitability.good_for as string[]).map((g) => (
                <span key={g} className="detail-badge detail-badge-green">
                  {g}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Use Cases */}
      {useCases.length > 0 && (
        <div className="detail-section">
          <div className="detail-section-title">Typische Einsatzbereiche</div>
          <div className="detail-usecases">
            {useCases.map((uc) => (
              <span key={uc} className="detail-usecase">
                {uc}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Pros / Cons */}
      {(pros.length > 0 || cons.length > 0) && (
        <div className="detail-section">
          <div className="detail-section-title">Vorteile & Nachteile</div>
          <div className="detail-proscons">
            {pros.length > 0 && (
              <div className="detail-pros">
                <div className="detail-pros-title">Vorteile</div>
                {pros.map((p) => (
                  <div key={p} className="detail-pro-item">
                    <Check className="h-4 w-4 detail-pro-icon" />
                    <span>{p}</span>
                  </div>
                ))}
              </div>
            )}
            {cons.length > 0 && (
              <div className="detail-cons">
                <div className="detail-cons-title">Nachteile</div>
                {cons.map((c) => (
                  <div key={c} className="detail-con-item">
                    <X className="h-4 w-4 detail-con-icon" />
                    <span>{c}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Trust */}
      {trust && (
        <div className="detail-section">
          <div className="detail-section-title">Vertrauen & Zahlen</div>
          <div className="detail-trust-grid">
            {trust.funded_smes != null && (
              <div className="detail-trust-item">
                <div className="detail-trust-value">
                  {trust.funded_smes as string}
                </div>
                <div className="detail-trust-label">Finanzierte KMU</div>
              </div>
            )}
            {trust.monthly_volume != null && (
              <div className="detail-trust-item">
                <div className="detail-trust-value">
                  {trust.monthly_volume as string}
                </div>
                <div className="detail-trust-label">Monatl. Volumen</div>
              </div>
            )}
            {trust.repeat_customers_pct != null && (
              <div className="detail-trust-item">
                <div className="detail-trust-value">
                  {trust.repeat_customers_pct as number}%
                </div>
                <div className="detail-trust-label">Wiederkehrend</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CTAs */}
      <div className="detail-ctas">
        <button className="detail-cta-primary">
          {ctaPrimary ?? "Jetzt anfragen"} <ArrowRight className="h-4 w-4" />
        </button>
        <Link href="/plattform" className="detail-cta-secondary">
          {ctaSecondary ?? "Zurueck zum Vergleich"}
        </Link>
      </div>
    </div>
  );
}

export default function ProduktDetailPage() {
  return (
    <div
      className="flex flex-col min-h-screen"
      style={{
        background:
          "linear-gradient(180deg, rgba(0,206,209,0.06) 0%, #ffffff 40%)",
      }}
    >
      <header className="bg-white">
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

      <main className="flex-1">
        <Suspense
          fallback={
            <div className="detail-page">
              <div className="animate-pulse">
                <div className="h-8 w-48 bg-gray-200 rounded mb-4" />
                <div className="h-4 w-64 bg-gray-100 rounded" />
              </div>
            </div>
          }
        >
          <ProduktContent />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
