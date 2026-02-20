"use client";

import { useEffect, useState } from "react";
import { useTracking } from "@/lib/tracking";
import { ArrowRight, RotateCcw, Clock, Users, Warehouse, Truck, TrendingUp, ChevronRight } from "lucide-react";
import Link from "next/link";
import Logo from "@/components/Logo";
import Footer from "@/components/Footer";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import {
  loadQuickCheckData,
  calculateResult,
  type QuickCheckData,
  type QuickCheckResult,
} from "@/lib/quickcheck";
import { industryLabels, industryBenchmarks } from "@/lib/benchmarks";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", minimumFractionDigits: 0 }).format(value);
}

function cccToDaily(ccc: number, revenue: number) {
  if (!revenue || revenue <= 0) return 0;
  return Math.round(revenue / 365 * ccc);
}

export default function QuickCheckErgebnisPage() {
  const { trackEvent } = useTracking();
  const [result, setResult] = useState<QuickCheckResult | null>(null);
  const [data, setData] = useState<Partial<QuickCheckData>>({});

  useEffect(() => {
    const stored = loadQuickCheckData();
    setData(stored);

    if (stored.industry && stored.dso_days !== undefined && stored.dio_days !== undefined && stored.dpo_days !== undefined && stored.top_pains) {
      const fullData: QuickCheckData = {
        industry: stored.industry,
        annual_revenue: stored.annual_revenue || 0,
        dso_days: stored.dso_days,
        dpo_days: stored.dpo_days || 0,
        dio_days: stored.dio_days,
        top_pains: stored.top_pains,
        has_credit_insurance: stored.has_credit_insurance || false,
        has_erp: stored.has_erp || false,
      };
      const calcResult = calculateResult(fullData);
      setResult(calcResult);

      trackEvent("quickcheck_result", {
        ccc_days: calcResult.ccc_days,
        bottleneck_type: calcResult.bottleneck_type,
        bottleneck_score: calcResult.bottleneck_score,
        industry: stored.industry,
      });
    }
  }, [trackEvent]);

  if (!result) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <header className="shadow-sm bg-white/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-center">
              <Logo size="md" />
            </div>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center px-4">
            <h1 className="text-2xl font-bold text-dark mb-4">Keine Daten gefunden</h1>
            <p className="text-subtle mb-6">Bitte starten Sie den QuickCheck zuerst.</p>
            <Link href="/quickcheck" className="btn btn-primary btn-lg">
              QuickCheck starten
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const industryLabel = industryLabels[data.industry || ""] || data.industry || "";
  const benchmark = industryBenchmarks[data.industry || "andere"] || industryBenchmarks.andere;
  const dso = data.dso_days || 0;
  const dio = data.dio_days || 0;
  const dpo = data.dpo_days || 0;
  const ccc = result.ccc_days;
  const benchCcc = benchmark.ccc;
  const revenue = data.annual_revenue || 0;
  const cashBound = cccToDaily(ccc, revenue);
  const benchCashBound = cccToDaily(benchCcc, revenue);

  // Build plain-language insights
  const insights: { icon: React.ElementType; color: string; title: string; text: string }[] = [];

  if (dso > benchmark.dso + 5) {
    insights.push({
      icon: Users,
      color: "text-orange",
      title: `Ihre Kunden zahlen ${dso - benchmark.dso} Tage langsamer als üblich`,
      text: `Sie warten im Schnitt ${dso} Tage auf Ihr Geld. In Ihrer Branche (${industryLabel}) sind ${benchmark.dso} Tage normal. Das bedeutet: Jede Rechnung bindet ${dso - benchmark.dso} Tage länger Cash als nötig.`,
    });
  } else if (dso <= benchmark.dso) {
    insights.push({
      icon: Users,
      color: "text-turquoise",
      title: "Ihre Kunden zahlen pünktlich",
      text: `Sie warten ${dso} Tage auf Zahlungen – das liegt im Branchenschnitt von ${benchmark.dso} Tagen oder sogar darunter. Gut so.`,
    });
  }

  const isService = data.industry === "dienstleistung";

  if (isService && dio > 0) {
    // Service companies: DIO = Vorfinanzierung (ad spend, freelancers, licenses)
    if (dio > 20) {
      insights.push({
        icon: Clock,
        color: "text-orange",
        title: `Sie finanzieren Kosten ${dio} Tage vor`,
        text: `Zwischen Ihren Ausgaben (Ad Spend, Personal, Tools) und der Abrechnung vergehen ${dio} Tage. Das ist Kapital, das bei Ihren Lieferanten liegt, bevor Sie es weiterberechnen können.`,
      });
    } else {
      insights.push({
        icon: Clock,
        color: "text-turquoise",
        title: `${dio} Tage Vorfinanzierung – im Rahmen`,
        text: `Sie finanzieren Kosten im Schnitt ${dio} Tage vor, bevor Sie abrechnen. Das ist für Dienstleister normal.`,
      });
    }
  } else if (!isService) {
    if (dio > benchmark.dio + 5 && benchmark.dio > 0) {
      insights.push({
        icon: Warehouse,
        color: "text-orange",
        title: `Ihre Ware liegt ${dio - benchmark.dio} Tage zu lange im Lager`,
        text: `Ihre Bestände brauchen ${dio} Tage bis zum Verkauf. Branchenüblich sind ${benchmark.dio} Tage. Das ist Kapital, das auf Paletten statt auf dem Konto liegt.`,
      });
    } else if (dio <= benchmark.dio && dio > 0) {
      insights.push({
        icon: Warehouse,
        color: "text-turquoise",
        title: "Ihr Lagerumschlag ist gut",
        text: `${dio} Tage Lagerdauer liegen im Rahmen für ${industryLabel} (Schnitt: ${benchmark.dio} Tage).`,
      });
    }
  }

  // DPO insight – skip entirely for service companies
  if (!isService) {
    if (dpo < benchmark.dpo - 5) {
      insights.push({
        icon: Truck,
        color: "text-orange",
        title: `Sie zahlen ${benchmark.dpo - dpo} Tage schneller als nötig`,
        text: `Sie begleichen Rechnungen nach ${dpo} Tagen, obwohl ${benchmark.dpo} Tage in Ihrer Branche normal wären. Schneller zahlen heißt: weniger Cash-Puffer für Sie.`,
      });
    } else if (dpo >= benchmark.dpo) {
      insights.push({
        icon: Truck,
        color: "text-turquoise",
        title: "Ihre Zahlungsziele sind solide",
        text: `Mit ${dpo} Tagen Zahlungsziel nutzen Sie Ihren Spielraum gut (Branche: ${benchmark.dpo} Tage).`,
      });
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <header className="shadow-sm bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/quickcheck" className="flex items-center gap-2 text-subtle hover:text-dark transition-colors">
              <RotateCcw className="h-5 w-5" />
              <span className="text-sm font-medium">Neuer Check</span>
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
          <div className="mx-auto max-w-3xl">

            {/* === HEADLINE === */}
            <AnimateOnScroll>
              <div className="text-center mb-10">
                <span className="badge badge-turquoise mb-4">Ihr Ergebnis</span>
                <h1 className="text-3xl font-bold text-dark mb-3 md:text-4xl">
                  {ccc > benchCcc + 10
                    ? "Ihr Cash steckt zu lange im Kreislauf"
                    : ccc > benchCcc
                      ? "Ihr Cash-Kreislauf hat Optimierungspotenzial"
                      : "Ihr Cash-Kreislauf läuft gut"}
                </h1>
                <p className="text-lg text-subtle">
                  {industryLabel} · Umsatz: {revenue ? formatCurrency(revenue) : "k.A."}
                </p>
              </div>
            </AnimateOnScroll>

            {/* === DIE KERNZAHL === */}
            <AnimateOnScroll delay={0.1}>
              <div className="quickcheck-result mb-8">
                <div className="text-center">
                  {cashBound > 0 ? (
                    <>
                      <p className="text-sm text-subtle mb-2">
                        So viel Ihres Geldes ist permanent im Umlauf gebunden:
                      </p>
                      <div className={`text-5xl font-bold mb-1 ${ccc > benchCcc ? "text-orange" : "text-turquoise"}`}>
                        {formatCurrency(cashBound)}
                      </div>
                      {cashBound > benchCashBound && (
                        <p className="text-sm text-subtle mb-3">
                          Bei Branchenschnitt wären es nur <strong>{formatCurrency(benchCashBound)}</strong> – eine Differenz von <strong className="text-orange">{formatCurrency(cashBound - benchCashBound)}</strong>
                        </p>
                      )}
                      {cashBound <= benchCashBound && cashBound > 0 && (
                        <p className="text-sm text-subtle mb-3">
                          Im Branchenschnitt wären es <strong>{formatCurrency(benchCashBound)}</strong> – Sie liegen <strong className="text-turquoise">{formatCurrency(benchCashBound - cashBound)}</strong> darunter
                        </p>
                      )}
                      <p className="text-sm mt-2 p-3 rounded-lg bg-light-bg">
                        <Clock className="h-4 w-4 inline-block mr-1 text-subtle" />
                        Ihr Cash-Kreislauf dauert <strong>{ccc} Tage</strong> (Branche: {benchCcc} Tage)
                        {ccc > benchCcc && <> – <strong className="text-orange">{ccc - benchCcc} Tage über dem Schnitt</strong></>}
                        {ccc < benchCcc && <> – <strong className="text-turquoise">{benchCcc - ccc} Tage unter dem Schnitt</strong></>}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-subtle mb-2">
                        Von der Ausgabe bis zum Geldeingang vergehen bei Ihnen:
                      </p>
                      <div className={`text-5xl font-bold mb-1 ${ccc > benchCcc ? "text-orange" : "text-turquoise"}`}>
                        {ccc} Tage
                      </div>
                      <p className="text-sm text-subtle">
                        In Ihrer Branche sind <strong>{benchCcc} Tage</strong> üblich
                        {ccc > benchCcc && <> – Sie liegen <strong className="text-orange">{ccc - benchCcc} Tage darüber</strong></>}
                        {ccc < benchCcc && <> – Sie liegen <strong className="text-turquoise">{benchCcc - ccc} Tage darunter</strong></>}
                        {ccc === benchCcc && <> – Sie liegen genau im Schnitt</>}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </AnimateOnScroll>

            {/* === WAS BEDEUTET DAS? === */}
            <AnimateOnScroll delay={0.15}>
              <div className="quickcheck-result mb-8">
                <h2 className="text-lg font-bold text-dark mb-2">Was bedeutet das?</h2>
                <p className="text-sm text-subtle mb-6">
                  {isService
                    ? `Zwischen Ihren Ausgaben (Ad Spend, Personal, Tools) und dem Zahlungseingang vergehen ${ccc} Tage. Diese Zeit müssen Sie aus eigener Tasche finanzieren.`
                    : `Ihr Geld durchläuft einen Kreislauf: Sie kaufen ein (Ausgabe), lagern oder arbeiten, stellen eine Rechnung – und warten, bis der Kunde zahlt (Einnahme). Die ${ccc} Tage dazwischen müssen Sie aus eigener Tasche finanzieren.`
                  }
                </p>

                {/* Visual: Simple Flow */}
                <div className="flex items-center justify-between gap-2 text-center text-xs mb-6 overflow-x-auto">
                  {isService ? (
                    <>
                      <div className="flex flex-col items-center gap-1 min-w-[70px]">
                        <div className="w-10 h-10 rounded-full bg-dark/10 flex items-center justify-center">
                          <Clock className="h-4 w-4 text-dark" />
                        </div>
                        <span className="font-medium text-dark">Kosten</span>
                        <span className="text-subtle">Tag 0</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-subtle shrink-0" />
                      {dio > 0 && (
                        <>
                          <div className="flex flex-col items-center gap-1 min-w-[70px]">
                            <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                              <Clock className="h-4 w-4 text-dark" />
                            </div>
                            <span className="font-medium text-dark">Vorfinanzierung</span>
                            <span className="text-subtle">{dio} Tage</span>
                          </div>
                          <ChevronRight className="h-4 w-4 text-subtle shrink-0" />
                        </>
                      )}
                      <div className="flex flex-col items-center gap-1 min-w-[70px]">
                        <div className="w-10 h-10 rounded-full bg-turquoise/10 flex items-center justify-center">
                          <Users className="h-4 w-4 text-turquoise" />
                        </div>
                        <span className="font-medium text-dark">Kunde zahlt</span>
                        <span className="text-subtle">+{dso} Tage</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-subtle shrink-0" />
                      <div className="flex flex-col items-center gap-1 min-w-[70px]">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${ccc > benchCcc ? "bg-orange/10" : "bg-turquoise/10"}`}>
                          <TrendingUp className={`h-4 w-4 ${ccc > benchCcc ? "text-orange" : "text-turquoise"}`} />
                        </div>
                        <span className="font-medium text-dark">Cash da</span>
                        <span className={`font-bold ${ccc > benchCcc ? "text-orange" : "text-turquoise"}`}>{ccc} Tage</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex flex-col items-center gap-1 min-w-[70px]">
                        <div className="w-10 h-10 rounded-full bg-dark/10 flex items-center justify-center">
                          <Truck className="h-4 w-4 text-dark" />
                        </div>
                        <span className="font-medium text-dark">Einkauf</span>
                        <span className="text-subtle">Tag 0</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-subtle shrink-0" />
                      {dio > 0 && (
                        <>
                          <div className="flex flex-col items-center gap-1 min-w-[70px]">
                            <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                              <Warehouse className="h-4 w-4 text-dark" />
                            </div>
                            <span className="font-medium text-dark">Lager</span>
                            <span className="text-subtle">{dio} Tage</span>
                          </div>
                          <ChevronRight className="h-4 w-4 text-subtle shrink-0" />
                        </>
                      )}
                      <div className="flex flex-col items-center gap-1 min-w-[70px]">
                        <div className="w-10 h-10 rounded-full bg-turquoise/10 flex items-center justify-center">
                          <Users className="h-4 w-4 text-turquoise" />
                        </div>
                        <span className="font-medium text-dark">Kunde zahlt</span>
                        <span className="text-subtle">+{dso} Tage</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-subtle shrink-0" />
                      <div className="flex flex-col items-center gap-1 min-w-[70px]">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${ccc > benchCcc ? "bg-orange/10" : "bg-turquoise/10"}`}>
                          <TrendingUp className={`h-4 w-4 ${ccc > benchCcc ? "text-orange" : "text-turquoise"}`} />
                        </div>
                        <span className="font-medium text-dark">Cash da</span>
                        <span className={`font-bold ${ccc > benchCcc ? "text-orange" : "text-turquoise"}`}>{ccc} Tage</span>
                      </div>
                    </>
                  )}
                </div>

                <p className="text-xs text-subtle">
                  {isService
                    ? <>Vorfinanzierung ({dio} Tage) + Zahlungsziel Kunden ({dso} Tage) = <strong>{ccc} Tage</strong> Kapitalbindung</>
                    : <>Abzüglich Ihrer Zahlungsziele an Lieferanten ({dpo} Tage) ergibt sich: {dso} + {dio} − {dpo} = <strong>{ccc} Tage</strong>, in denen Sie Ihr Cash selbst vorfinanzieren müssen.</>
                  }
                </p>
              </div>
            </AnimateOnScroll>

            {/* === WO GENAU KLEMMT ES? === */}
            {insights.length > 0 && (
              <AnimateOnScroll delay={0.25}>
                <div className="quickcheck-result mb-8">
                  <h2 className="text-lg font-bold text-dark mb-4">Wo genau klemmt es?</h2>
                  <div className="space-y-4">
                    {insights.map((insight, i) => {
                      const Icon = insight.icon;
                      return (
                        <div key={i} className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${insight.color === "text-orange" ? "bg-orange/10" : "bg-turquoise/10"}`}>
                            <Icon className={`h-4 w-4 ${insight.color}`} />
                          </div>
                          <div>
                            <p className={`font-semibold text-sm ${insight.color}`}>{insight.title}</p>
                            <p className="text-sm text-subtle mt-0.5">{insight.text}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </AnimateOnScroll>
            )}

            {/* === BRANCHENVERGLEICH (einfach) === */}
            <AnimateOnScroll delay={0.3}>
              <div className="quickcheck-result mb-8">
                <h2 className="text-lg font-bold text-dark mb-4">Ihr Profil vs. {industryLabel}</h2>
                <div className="space-y-3">
                  {([
                    { label: "Kunden zahlen nach", yours: dso, bench: benchmark.dso, unit: "Tagen", invert: false },
                    ...(dio > 0 || benchmark.dio > 0 ? [{ label: isService ? "Vorfinanzierung" : "Ware liegt im Lager", yours: dio, bench: benchmark.dio, unit: "Tage", invert: false }] : []),
                    ...(!isService ? [{ label: "Sie zahlen Lieferanten nach", yours: dpo, bench: benchmark.dpo, unit: "Tagen", invert: true }] : []),
                    { label: isService ? "Kapitalbindung gesamt" : "Cash-Kreislauf gesamt", yours: ccc, bench: benchCcc, unit: "Tage", invert: false },
                  ] as { label: string; yours: number; bench: number; unit: string; invert: boolean }[]).map((m) => {
                    const isWorse = m.invert ? m.yours < m.bench : m.yours > m.bench;
                    const diff = Math.abs(m.yours - m.bench);
                    const pctYours = Math.min(100, Math.max(5, (m.yours / Math.max(m.yours, m.bench, 1)) * 100));
                    const pctBench = Math.min(100, Math.max(5, (m.bench / Math.max(m.yours, m.bench, 1)) * 100));
                    return (
                      <div key={m.label}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-dark">{m.label}</span>
                          <span className="text-xs text-subtle">
                            {diff === 0 ? "Im Schnitt" : isWorse ? `${diff} Tage schlechter` : `${diff} Tage besser`}
                          </span>
                        </div>
                        <div className="flex gap-1 items-center">
                          <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden relative">
                            <div
                              className={`h-full rounded-full ${isWorse ? "bg-orange" : "bg-turquoise"}`}
                              style={{ width: `${pctYours}%` }}
                            />
                          </div>
                          <span className={`text-sm font-bold w-12 text-right ${isWorse ? "text-orange" : "text-turquoise"}`}>
                            {m.yours}
                          </span>
                        </div>
                        <div className="flex gap-1 items-center mt-0.5">
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden relative">
                            <div
                              className="h-full rounded-full bg-dark/30"
                              style={{ width: `${pctBench}%` }}
                            />
                          </div>
                          <span className="text-xs text-subtle w-12 text-right">{m.bench}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center gap-4 mt-4 text-xs text-subtle">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-turquoise inline-block" /> Ihr Wert</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-dark/30 inline-block" /> Branchenschnitt</span>
                </div>
              </div>
            </AnimateOnScroll>

            {/* === WAS KÖNNEN SIE TUN? === */}
            <AnimateOnScroll delay={0.4}>
              <div className="quickcheck-result mb-8">
                <h2 className="text-lg font-bold text-dark mb-2">Was können Sie tun?</h2>
                <p className="text-sm text-subtle mb-4">
                  Je nach Ursache gibt es unterschiedliche Hebel – operative Maßnahmen, Absicherung oder Finanzierung.
                </p>
                <div className="space-y-3">
                  {dso > benchmark.dso + 5 && (
                    <div className="p-4 rounded-lg bg-light-bg">
                      <p className="font-semibold text-sm text-dark mb-1">Kunden zahlen zu spät?</p>
                      <p className="text-sm text-subtle">
                        <strong>Factoring</strong> wandelt offene Rechnungen sofort in Geld um. <strong>Betriebsmittelkredite</strong> überbrücken die Wartezeit. Operativ helfen strafferes <strong>Mahnwesen</strong> und kürzere Zahlungsziele.
                      </p>
                    </div>
                  )}
                  {dio > benchmark.dio + 5 && (
                    <div className="p-4 rounded-lg bg-light-bg">
                      <p className="font-semibold text-sm text-dark mb-1">Zu viel Kapital im Lager?</p>
                      <p className="text-sm text-subtle">
                        <strong>Einkaufsfinanzierung</strong> schont Ihre Liquidität beim Wareneinkauf. <strong>Bestandsoptimierung</strong> (ABC-Analyse, Absatzplanung) senkt die Lagerdauer. <strong>Konsignationsmodelle</strong> verlagern das Risiko.
                      </p>
                    </div>
                  )}
                  {dpo < benchmark.dpo - 5 && (
                    <div className="p-4 rounded-lg bg-light-bg">
                      <p className="font-semibold text-sm text-dark mb-1">Zu schnell an Lieferanten gezahlt?</p>
                      <p className="text-sm text-subtle">
                        <strong>Reverse Factoring</strong> verlängert Ihre Zahlungsziele, ohne Lieferanten zu belasten. Prüfen Sie, ob <strong>Skonto</strong> sich wirklich lohnt oder ob längere Ziele mehr bringen.
                      </p>
                    </div>
                  )}
                  {ccc <= benchCcc && (
                    <div className="p-4 rounded-lg bg-turquoise/5">
                      <p className="font-semibold text-sm text-turquoise mb-1">Ihr Cash-Kreislauf ist solide</p>
                      <p className="text-sm text-subtle">
                        Sie liegen im oder unter dem Branchenschnitt. Trotzdem lohnt sich ein Blick auf Absicherung: Wie reagiert Ihr Cashflow, wenn ein Großkunde ausfällt oder ein Lieferant auf Vorkasse umstellt?
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </AnimateOnScroll>

            {/* === CTAs === */}
            <AnimateOnScroll delay={0.5}>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/antrag/kreditart" className="btn btn-primary btn-lg inline-flex items-center justify-center gap-2">
                  Finanzierung vergleichen <ArrowRight className="h-5 w-5" />
                </Link>
                <a href="mailto:info@liqinow.de" className="btn btn-inverted btn-lg text-center">
                  Beratung anfragen
                </a>
              </div>
            </AnimateOnScroll>

            {/* Disclaimer */}
            <AnimateOnScroll delay={0.6}>
              <p className="text-xs text-subtle text-center mt-8 max-w-lg mx-auto">
                Diese Analyse ist eine erste Einschätzung auf Basis Ihrer Angaben und
                ersetzt keine professionelle Finanzberatung. Die Branchenwerte sind
                Durchschnittswerte und können von Ihrem konkreten Geschäftsmodell abweichen.
              </p>
            </AnimateOnScroll>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
