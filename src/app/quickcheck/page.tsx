"use client";

import { useEffect } from "react";
import { Activity, Clock, BarChart3, ArrowRight } from "lucide-react";
import Link from "next/link";
import Logo from "@/components/Logo";
import Footer from "@/components/Footer";
import { useTracking } from "@/lib/tracking";
import { clearQuickCheckData } from "@/lib/quickcheck";

export default function QuickCheckIntroPage() {
  const { trackEvent } = useTracking();

  useEffect(() => {
    clearQuickCheckData();
    trackEvent("quickcheck_step", { step: "intro" });
  }, [trackEvent]);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <header className="shadow-sm bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center">
            <Logo size="md" />
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
          <div className="mx-auto max-w-2xl text-center">
            <span className="badge badge-turquoise mb-6">
              <Activity className="h-4 w-4" />
              QuickCheck
            </span>

            <h1 className="text-3xl font-bold text-dark mb-4 md:text-5xl">
              Wo steckt Ihr Cash?
            </h1>
            <p className="text-lg text-subtle mb-8 max-w-lg mx-auto">
              In 5 Minuten finden Sie heraus, ob Ihr Liquiditätsproblem bei Kunden,
              im Lager oder bei Lieferanten liegt – und welche Hebel am schnellsten wirken.
            </p>

            <div className="card p-6 sm:p-8 text-left mb-8">
              <h2 className="text-lg font-bold text-dark mb-6">Das erwartet Sie:</h2>
              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="funnel-icon-badge shrink-0">
                    <Clock className="h-5 w-5 text-turquoise" />
                  </div>
                  <div>
                    <p className="font-medium text-dark">5 kurze Fragen</p>
                    <p className="text-sm text-subtle">Branche, Umsatz, grobe Zahlungsströme, Schmerzpunkte</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="funnel-icon-badge shrink-0">
                    <BarChart3 className="h-5 w-5 text-turquoise" />
                  </div>
                  <div>
                    <p className="font-medium text-dark">Ihr Cash-Profil</p>
                    <p className="text-sm text-subtle">CCC-Analyse mit Branchenvergleich und Engpass-Score</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="funnel-icon-badge shrink-0">
                    <Activity className="h-5 w-5 text-turquoise" />
                  </div>
                  <div>
                    <p className="font-medium text-dark">Konkrete Empfehlungen</p>
                    <p className="text-sm text-subtle">Passende Playbooks und Maßnahmen für Ihre Situation</p>
                  </div>
                </div>
              </div>
            </div>

            <Link href="/quickcheck/branche" className="btn-cta-primary inline-flex items-center justify-center gap-2">
              Jetzt starten <ArrowRight className="h-5 w-5" />
            </Link>

            <p className="text-sm text-subtle mt-4">
              Kostenlos · Keine Registrierung · Ergebnis sofort
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
