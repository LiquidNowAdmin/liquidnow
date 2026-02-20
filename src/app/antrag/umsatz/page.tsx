"use client";

import { useState, useEffect } from "react";
import { useTracking } from "@/lib/tracking";
import { ArrowLeft, TrendingUp, Check } from "lucide-react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { useRouter } from "next/navigation";
import Footer from "@/components/Footer";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function UmsatzPage() {
  const router = useRouter();
  const [revenue, setRevenue] = useState(250000);
  const { trackEvent } = useTracking();
  useEffect(() => { trackEvent("funnel_step", { step: "umsatz" }); }, [trackEvent]);

  const min = 50000;
  const max = 5000000;
  const percentage = ((revenue - min) / (max - min)) * 100;

  const handleRevenueSliderChange = (value: number) => {
    setRevenue(value);
  };

  const handleRevenueInputChange = (value: string) => {
    const numValue = parseInt(value.replace(/\D/g, ""));
    if (!isNaN(numValue) && numValue >= min && numValue <= max) {
      setRevenue(numValue);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    trackEvent("funnel_data", { step: "umsatz", revenue });
    router.push("/antrag/branche");
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-[#F5DEB3]/10 to-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/antrag/zweck" className="flex items-center gap-2 text-subtle hover:text-dark transition-colors">
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm font-medium">Zurück</span>
            </Link>
            <Logo size="md" />
            <div className="w-20" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative py-12 flex-1">
        {/* Wave Background */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden pointer-events-none z-0 opacity-70">
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

        {/* Content on top */}
        <div className="relative z-10 container mx-auto px-4">
          <div className="mx-auto max-w-2xl">
            {/* Progress Indicator */}
            <div className="mb-8 flex items-center justify-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-turquoise text-sm font-bold text-white">
                <Check className="h-5 w-5" />
              </div>
              <div className="h-1 w-12 bg-turquoise rounded" />
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-turquoise text-sm font-bold text-white">
                <Check className="h-5 w-5" />
              </div>
              <div className="h-1 w-12 bg-turquoise rounded" />
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-turquoise text-sm font-bold text-white">
                3
              </div>
              <div className="h-1 w-12 bg-gray-200 rounded" />
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-sm font-bold text-subtle">
                4
              </div>
              <div className="h-1 w-12 bg-gray-200 rounded" />
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-sm font-bold text-subtle">
                5
              </div>
            </div>

            {/* Title */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-dark mb-3">
                Wie hoch ist Ihr Jahresumsatz?
              </h1>
              <p className="text-lg text-subtle">
                Eine grobe Schätzung reicht völlig aus
              </p>
            </div>

            {/* Form Card */}
            <form onSubmit={handleSubmit} className="card p-6 sm:p-8">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="funnel-icon-badge">
                    <TrendingUp className="h-5 w-5 text-turquoise" />
                  </div>
                  <h2 className="text-xl font-bold text-dark">Geschätzter Jahresumsatz</h2>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={formatNumber(revenue)}
                    onChange={(e) => handleRevenueInputChange(e.target.value)}
                    className="w-full px-4 py-4 pr-12 text-xl text-right font-bold border-2 border-gray-200 rounded-lg outline-none transition-colors focus:border-turquoise"
                    placeholder="250.000"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl text-subtle font-bold pointer-events-none">
                    €
                  </span>
                </div>

                <div className="funnel-slider-wrap">
                  <input
                    type="range"
                    min={min}
                    max={max}
                    step={10000}
                    value={revenue}
                    onChange={(e) => handleRevenueSliderChange(Number(e.target.value))}
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

                <div className="pt-6">
                  <button type="submit" className="btn-cta-primary">
                    Weiter &rarr;
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
