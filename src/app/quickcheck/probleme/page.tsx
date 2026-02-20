"use client";

import { useState, useEffect } from "react";
import { useTracking } from "@/lib/tracking";
import { ArrowLeft, Check, Users, Warehouse, Truck, TrendingUp, Calendar, AlertTriangle } from "lucide-react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { useRouter } from "next/navigation";
import Footer from "@/components/Footer";
import QuickCheckProgress from "@/components/QuickCheckProgress";
import { saveQuickCheckData, painOptions } from "@/lib/quickcheck";

const iconMap: Record<string, React.ElementType> = {
  Users, Warehouse, Truck, TrendingUp, Calendar, AlertTriangle,
};

export default function QuickCheckProblemePage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const { trackEvent } = useTracking();

  useEffect(() => {
    trackEvent("quickcheck_step", { step: "probleme" });
  }, [trackEvent]);

  const togglePain = (value: string) => {
    setSelected((prev) => {
      if (prev.includes(value)) {
        return prev.filter((v) => v !== value);
      }
      if (prev.length >= 3) return prev;
      return [...prev, value];
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selected.length === 0) return;
    saveQuickCheckData({ top_pains: selected });
    trackEvent("quickcheck_data", { step: "probleme", top_pains: selected });
    router.push("/quickcheck/infrastruktur");
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <header className="shadow-sm bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/quickcheck/cashflow" className="flex items-center gap-2 text-subtle hover:text-dark transition-colors">
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm font-medium">Zurück</span>
            </Link>
            <Logo size="md" />
            <div className="w-20" />
          </div>
        </div>
      </header>

      <main className="relative py-12 flex-1">
        <div className="absolute bottom-0 left-0 w-full overflow-hidden pointer-events-none z-0 opacity-70">
          <div className="hero-wave">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2880 320" preserveAspectRatio="none" className="w-full h-full">
              <path fill="#00CED1" fillOpacity="0.15" d="M0,200C240,150,480,150,720,200C960,250,1200,250,1440,200C1680,150,1920,150,2160,200C2400,250,2640,250,2880,200L2880,320L0,320Z" />
            </svg>
          </div>
        </div>

        <div className="relative z-10 container mx-auto px-4">
          <div className="mx-auto max-w-2xl">
            <div className="mb-8">
              <QuickCheckProgress currentStep={4} />
            </div>

            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-dark mb-3">
                Was sind Ihre größten Schmerzpunkte?
              </h1>
              <p className="text-lg text-subtle">
                Wählen Sie bis zu 3 Themen, die Sie aktuell am meisten beschäftigen
              </p>
            </div>

            <form onSubmit={handleSubmit} className="card p-6 sm:p-8">
              <div className="space-y-3">
                {painOptions.map((option) => {
                  const isSelected = selected.includes(option.value);
                  const Icon = iconMap[option.icon];
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => togglePain(option.value)}
                      className={`quickcheck-multi-option w-full text-left ${
                        isSelected ? "quickcheck-multi-option-selected" : ""
                      }`}
                    >
                      <div
                        className={`quickcheck-multi-checkbox ${
                          isSelected ? "quickcheck-multi-checkbox-checked" : ""
                        }`}
                      >
                        {isSelected && <Check className="h-4 w-4 text-white" />}
                      </div>
                      <div className="funnel-icon-badge shrink-0">
                        {Icon && <Icon className="h-5 w-5 text-turquoise" />}
                      </div>
                      <span className="text-base font-medium text-dark">{option.label}</span>
                    </button>
                  );
                })}
              </div>

              <p className="text-sm text-subtle mt-4 text-center">
                {selected.length}/3 ausgewählt
              </p>

              <div className="mt-6">
                <button
                  type="submit"
                  disabled={selected.length === 0}
                  className="btn-cta-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Weiter &rarr;
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
