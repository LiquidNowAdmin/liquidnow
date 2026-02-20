"use client";

import { useState, useEffect } from "react";
import { useTracking } from "@/lib/tracking";
import { ArrowLeft, RefreshCw, Calendar, Check } from "lucide-react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { useRouter } from "next/navigation";
import Footer from "@/components/Footer";

const creditTypes = [
  {
    id: "kreditlinie",
    label: "Kreditlinie",
    description: "Revolvierende Nutzung, z.B. für Wareneinkauf oder Liquiditätspuffer",
    icon: RefreshCw,
  },
  {
    id: "darlehen",
    label: "Darlehen",
    description: "Feste Rückzahlungsraten über eine vereinbarte Laufzeit",
    icon: Calendar,
  },
];

export default function KreditartPage() {
  const router = useRouter();
  const [creditType, setCreditType] = useState("");
  const { trackEvent } = useTracking();
  useEffect(() => { trackEvent("funnel_step", { step: "kreditart" }); }, [trackEvent]);

  const handleSelect = (value: string) => {
    setCreditType(value);
    trackEvent("funnel_data", { step: "kreditart", credit_type: value });
    setTimeout(() => {
      router.push("/antrag/rechtsform");
    }, 400);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-[#F5DEB3]/10 to-white">
      {/* Header */}
      <header className="shadow-sm bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-subtle hover:text-dark transition-colors">
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

        {/* Content */}
        <div className="relative z-10 container mx-auto px-4">
          <div className="mx-auto max-w-2xl">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-dark mb-3">
                Welche Art von Finanzierung benötigen Sie?
              </h1>
              <p className="text-lg text-subtle">
                Wählen Sie die passende Kreditart für Ihr Vorhaben
              </p>
            </div>

            <form onSubmit={handleSubmit} className="card p-6 sm:p-8">
              <div className="grid grid-cols-1 gap-3">
                {creditTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <label key={type.id} className="block cursor-pointer">
                      <input
                        type="radio"
                        name="creditType"
                        value={type.id}
                        checked={creditType === type.id}
                        onChange={(e) => handleSelect(e.target.value)}
                        className="sr-only"
                      />
                      <div
                        className={`funnel-radio-option ${
                          creditType === type.id ? "funnel-radio-option-selected" : ""
                        }`}
                      >
                        <div className="funnel-icon-badge">
                          <Icon className="h-5 w-5 text-turquoise" />
                        </div>
                        <div className="flex-1">
                          <span className="text-base font-medium text-dark block">
                            {type.label}
                          </span>
                          <span className="text-sm text-subtle">
                            {type.description}
                          </span>
                        </div>
                        {creditType === type.id && (
                          <Check className="h-5 w-5 text-turquoise shrink-0" />
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>

              <div className="mt-8">
                <button
                  type="submit"
                  disabled={!creditType}
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
