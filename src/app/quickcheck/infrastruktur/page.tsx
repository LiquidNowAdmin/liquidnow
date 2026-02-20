"use client";

import { useState, useEffect } from "react";
import { useTracking } from "@/lib/tracking";
import { ArrowLeft, Shield, Monitor } from "lucide-react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { useRouter } from "next/navigation";
import Footer from "@/components/Footer";
import QuickCheckProgress from "@/components/QuickCheckProgress";
import { saveQuickCheckData } from "@/lib/quickcheck";

export default function QuickCheckInfrastrukturPage() {
  const router = useRouter();
  const [creditInsurance, setCreditInsurance] = useState<boolean | null>(null);
  const [erp, setErp] = useState<boolean | null>(null);
  const { trackEvent } = useTracking();

  useEffect(() => {
    trackEvent("quickcheck_step", { step: "infrastruktur" });
  }, [trackEvent]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (creditInsurance === null || erp === null) return;
    saveQuickCheckData({
      has_credit_insurance: creditInsurance,
      has_erp: erp,
    });
    trackEvent("quickcheck_data", {
      step: "infrastruktur",
      has_credit_insurance: creditInsurance,
      has_erp: erp,
    });
    router.push("/quickcheck/ergebnis");
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <header className="shadow-sm bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/quickcheck/probleme" className="flex items-center gap-2 text-subtle hover:text-dark transition-colors">
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
              <QuickCheckProgress currentStep={5} />
            </div>

            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-dark mb-3">
                Letzte Frage: Ihre Infrastruktur
              </h1>
              <p className="text-lg text-subtle">
                Diese Informationen helfen uns, passende Lösungen einzugrenzen
              </p>
            </div>

            <form onSubmit={handleSubmit} className="card p-6 sm:p-8">
              <div className="space-y-8">
                {/* Kreditversicherung */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="funnel-icon-badge">
                      <Shield className="h-5 w-5 text-turquoise" />
                    </div>
                    <div>
                      <p className="font-medium text-dark">Haben Sie eine Kreditversicherung?</p>
                      <p className="text-sm text-subtle">z.B. Euler Hermes, Coface, Atradius</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setCreditInsurance(true)}
                      className={`funnel-radio-option justify-center ${
                        creditInsurance === true ? "funnel-radio-option-selected" : ""
                      }`}
                    >
                      <span className="font-medium text-dark">Ja</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCreditInsurance(false)}
                      className={`funnel-radio-option justify-center ${
                        creditInsurance === false ? "funnel-radio-option-selected" : ""
                      }`}
                    >
                      <span className="font-medium text-dark">Nein</span>
                    </button>
                  </div>
                </div>

                {/* ERP */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="funnel-icon-badge">
                      <Monitor className="h-5 w-5 text-turquoise" />
                    </div>
                    <div>
                      <p className="font-medium text-dark">Nutzen Sie ein ERP-System?</p>
                      <p className="text-sm text-subtle">z.B. SAP, DATEV, Lexware, Xentral</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setErp(true)}
                      className={`funnel-radio-option justify-center ${
                        erp === true ? "funnel-radio-option-selected" : ""
                      }`}
                    >
                      <span className="font-medium text-dark">Ja</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setErp(false)}
                      className={`funnel-radio-option justify-center ${
                        erp === false ? "funnel-radio-option-selected" : ""
                      }`}
                    >
                      <span className="font-medium text-dark">Nein</span>
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={creditInsurance === null || erp === null}
                    className="btn-cta-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Ergebnis anzeigen &rarr;
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
