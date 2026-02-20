"use client";

import { useState, useEffect } from "react";
import { useTracking } from "@/lib/tracking";
import { ArrowLeft, Briefcase, Check } from "lucide-react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { useRouter } from "next/navigation";
import Footer from "@/components/Footer";
import QuickCheckProgress from "@/components/QuickCheckProgress";
import { saveQuickCheckData } from "@/lib/quickcheck";

const industries = [
  { value: "handel", label: "E-Commerce & Handel" },
  { value: "dienstleistung", label: "Dienstleistung" },
  { value: "produktion", label: "Produktion & Handwerk" },
  { value: "gastronomie", label: "Gastronomie & Hotellerie" },
  { value: "grosshandel", label: "Großhandel & Distribution" },
  { value: "projektgeschaeft", label: "Projektgeschäft & Anlagenbau" },
  { value: "andere", label: "Andere Branche" },
];

export default function QuickCheckBranchePage() {
  const router = useRouter();
  const [selected, setSelected] = useState("");
  const { trackEvent } = useTracking();

  useEffect(() => {
    trackEvent("quickcheck_step", { step: "branche" });
  }, [trackEvent]);

  const handleSelect = (value: string) => {
    setSelected(value);
    saveQuickCheckData({ industry: value });
    trackEvent("quickcheck_data", { step: "branche", industry: value });

    setTimeout(() => {
      router.push("/quickcheck/umsatz");
    }, 400);
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <header className="shadow-sm bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/quickcheck" className="flex items-center gap-2 text-subtle hover:text-dark transition-colors">
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
              <QuickCheckProgress currentStep={1} />
            </div>

            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-dark mb-3">
                In welcher Branche sind Sie tätig?
              </h1>
              <p className="text-lg text-subtle">
                Die Branche bestimmt typische Zahlungsströme und Benchmarks
              </p>
            </div>

            <div className="card p-6 sm:p-8">
              <div className="space-y-3">
                {industries.map((industry) => (
                  <label key={industry.value} className="block cursor-pointer">
                    <input
                      type="radio"
                      name="industry"
                      value={industry.value}
                      checked={selected === industry.value}
                      onChange={(e) => handleSelect(e.target.value)}
                      className="sr-only"
                    />
                    <div
                      className={`funnel-radio-option ${
                        selected === industry.value ? "funnel-radio-option-selected" : ""
                      }`}
                    >
                      <div className="funnel-icon-badge">
                        <Briefcase className="h-5 w-5 text-turquoise" />
                      </div>
                      <span className="text-base sm:text-lg font-medium flex-1 text-dark">
                        {industry.label}
                      </span>
                      {selected === industry.value && (
                        <Check className="h-5 w-5 text-turquoise shrink-0" />
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
