"use client";

import { useState, useEffect } from "react";
import { useTracking } from "@/lib/tracking";
import { ArrowLeft, Users, Warehouse, Truck, Clock } from "lucide-react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { useRouter } from "next/navigation";
import Footer from "@/components/Footer";
import QuickCheckProgress from "@/components/QuickCheckProgress";
import { saveQuickCheckData, loadQuickCheckData } from "@/lib/quickcheck";

const industryHints: Record<string, { dso: string; dio: string; dioLabel: string; dpo: string; dpoLabel: string }> = {
  handel: {
    dso: "z.B. Online-Bestellungen, Rechnungskauf, Großkunden",
    dio: "z.B. Waren im Regal, Zentrallager, Retouren",
    dioLabel: "Wie lange liegt Ware im Lager?",
    dpo: "z.B. Großhändler, Hersteller, Spediteure",
    dpoLabel: "Wann zahlen Sie Ihre Lieferanten?",
  },
  dienstleistung: {
    dso: "z.B. Monatsrechnungen, Projektrechnungen, Retainer",
    dio: "z.B. Ad Spend, Freelancer, Lizenzen, Personal – alles was Sie vorfinanzieren, bevor Sie abrechnen",
    dioLabel: "Wie viele Tage finanzieren Sie Kosten vor?",
    dpo: "",
    dpoLabel: "",
  },
  produktion: {
    dso: "z.B. Auftragsfertigungen, Serienkunden, OEM-Abnehmer",
    dio: "z.B. Rohstoffe, Halbfertigprodukte, Fertigwaren",
    dioLabel: "Wie lange liegen Materialien und Fertigwaren im Lager?",
    dpo: "z.B. Rohstofflieferanten, Zulieferer, Maschinenteile",
    dpoLabel: "Wann zahlen Sie Ihre Zulieferer?",
  },
  gastronomie: {
    dso: "z.B. Firmenkunden, Catering-Rechnungen, Events",
    dio: "z.B. Lebensmittel, Getränke, Verbrauchsmaterial",
    dioLabel: "Wie lange liegen Lebensmittel und Getränke im Lager?",
    dpo: "z.B. Großmarkt, Getränkelieferanten, METRO",
    dpoLabel: "Wann zahlen Sie Ihre Lieferanten?",
  },
  grosshandel: {
    dso: "z.B. Wiederverkäufer, Fachhandel, Industriekunden",
    dio: "z.B. Handelsware, Kommissionsware, Saisonbestände",
    dioLabel: "Wie lange liegt Handelsware im Lager?",
    dpo: "z.B. Hersteller, Importeure, Produzenten",
    dpoLabel: "Wann zahlen Sie Ihre Hersteller und Importeure?",
  },
  projektgeschaeft: {
    dso: "z.B. Meilenstein-Rechnungen, Schlussrechnungen, Abnahmen",
    dio: "z.B. Projektmaterial, verbaute Teile, Vorproduktion",
    dioLabel: "Wie lange ist Material für Projekte gebunden?",
    dpo: "z.B. Subunternehmer, Materiallieferanten, Ingenieure",
    dpoLabel: "Wann zahlen Sie Subunternehmer und Lieferanten?",
  },
  andere: {
    dso: "z.B. Rechnungen an Kunden, Abschlagszahlungen",
    dio: "z.B. Vorräte, Material, Bestände",
    dioLabel: "Wie lange liegt Ware oder Material im Lager?",
    dpo: "z.B. Lieferanten, Dienstleister, Vermieter",
    dpoLabel: "Wann zahlen Sie Ihre Lieferanten und Dienstleister?",
  },
};

const defaultHints = industryHints.andere;

export default function QuickCheckCashflowPage() {
  const router = useRouter();
  const [dso, setDso] = useState(45);
  const [dio, setDio] = useState(30);
  const [dpo, setDpo] = useState(30);
  const [industry, setIndustry] = useState("andere");
  const { trackEvent } = useTracking();

  useEffect(() => {
    trackEvent("quickcheck_step", { step: "cashflow" });
    const stored = loadQuickCheckData();
    if (stored.industry) {
      setIndustry(stored.industry);
      if (stored.industry === "dienstleistung") {
        setDso(14);
        setDio(15);
        setDpo(0);
      }
    }
  }, [trackEvent]);

  const isService = industry === "dienstleistung";
  const hints = industryHints[industry] || defaultHints;
  const ccc = dso + dio - dpo;

  const sliderStyle = (value: number, max: number) => {
    const pct = (value / max) * 100;
    return {
      background: `linear-gradient(to right, #00CED1 0%, #00CED1 ${pct}%, #E5E7EB ${pct}%, #E5E7EB 100%)`,
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveQuickCheckData({ dso_days: dso, dio_days: dio, dpo_days: dpo });
    trackEvent("quickcheck_data", { step: "cashflow", dso_days: dso, dio_days: dio, dpo_days: dpo });
    router.push("/quickcheck/probleme");
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <header className="shadow-sm bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/quickcheck/umsatz" className="flex items-center gap-2 text-subtle hover:text-dark transition-colors">
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
              <QuickCheckProgress currentStep={3} />
            </div>

            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-dark mb-3">
                Wie sehen Ihre Zahlungsströme aus?
              </h1>
              <p className="text-lg text-subtle">
                Schätzen Sie grob – eine exakte Zahl ist nicht nötig
              </p>
            </div>

            <form onSubmit={handleSubmit} className="card p-6 sm:p-8">
              <div className="space-y-8">
                {/* DSO – always shown */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="funnel-icon-badge">
                      <Users className="h-5 w-5 text-turquoise" />
                    </div>
                    <div>
                      <p className="font-medium text-dark">
                        {isService ? "Wie schnell zahlen Kunden nach Rechnung?" : "Wie lange brauchen Kunden zum Zahlen?"}
                      </p>
                      <p className="text-sm text-subtle">{hints.dso}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 funnel-slider-wrap">
                      <input
                        type="range" min={0} max={120} step={5} value={dso}
                        onChange={(e) => setDso(Number(e.target.value))}
                        className="funnel-slider" style={sliderStyle(dso, 120)}
                      />
                      <div className="funnel-slider-labels">
                        <span>0 Tage</span>
                        <span>120 Tage</span>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-dark w-20 text-right">{dso}d</span>
                  </div>
                </div>

                {/* DIO – different framing for service companies */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="funnel-icon-badge">
                      {isService
                        ? <Clock className="h-5 w-5 text-turquoise" />
                        : <Warehouse className="h-5 w-5 text-turquoise" />
                      }
                    </div>
                    <div>
                      <p className="font-medium text-dark">{hints.dioLabel}</p>
                      <p className="text-sm text-subtle">{hints.dio}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 funnel-slider-wrap">
                      <input
                        type="range" min={0} max={120} step={5} value={dio}
                        onChange={(e) => setDio(Number(e.target.value))}
                        className="funnel-slider" style={sliderStyle(dio, 120)}
                      />
                      <div className="funnel-slider-labels">
                        <span>0 Tage</span>
                        <span>120 Tage</span>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-dark w-20 text-right">{dio}d</span>
                  </div>
                </div>

                {/* DPO – hidden for service companies */}
                {!isService && (
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="funnel-icon-badge">
                        <Truck className="h-5 w-5 text-turquoise" />
                      </div>
                      <div>
                        <p className="font-medium text-dark">{hints.dpoLabel}</p>
                        <p className="text-sm text-subtle">{hints.dpo}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 funnel-slider-wrap">
                        <input
                          type="range" min={0} max={120} step={5} value={dpo}
                          onChange={(e) => setDpo(Number(e.target.value))}
                          className="funnel-slider" style={sliderStyle(dpo, 120)}
                        />
                        <div className="funnel-slider-labels">
                          <span>0 Tage</span>
                          <span>120 Tage</span>
                        </div>
                      </div>
                      <span className="text-2xl font-bold text-dark w-20 text-right">{dpo}d</span>
                    </div>
                  </div>
                )}

                {/* Live CCC Preview */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-light-bg">
                  <span className="text-sm font-medium text-subtle">
                    {isService
                      ? `Kapitalbindung: ${dso} + ${dio} Tage`
                      : `Vorläufiger CCC: DSO (${dso}) + DIO (${dio}) − DPO (${dpo})`
                    }
                  </span>
                  <span className={`text-xl font-bold ${ccc > 0 ? "text-orange" : "text-turquoise"}`}>
                    = {ccc} Tage
                  </span>
                </div>

                <div className="pt-2">
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
