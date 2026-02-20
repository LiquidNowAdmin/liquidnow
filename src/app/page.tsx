import {
  Search,
  Activity,
  BookOpen,
  Target,
  ArrowRight,
  BadgeCheck,
  Clock,
  UserX,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import FaqItem from "@/components/FaqItem";
import WaveText from "@/components/WaveText";
import DiagnosisWidget from "@/components/DiagnosisWidget";
import {
  howItWorksSteps,
  faqItems,
  caseScenarios,
} from "@/lib/data";

const iconMap = {
  Search,
  Activity,
  BookOpen,
  Target,
} as const;

export default function Home() {
  return (
    <>
      <Navigation />

      <main>
        {/* === HERO === */}
        <section
          id="hero"
          className="relative min-h-screen flex items-center overflow-hidden pt-24 pb-16"
        >
          <div className="absolute inset-0 gradient-bg-subtle" />

          <div className="absolute bottom-0 left-0 w-full overflow-hidden z-20 pointer-events-none">
            <div className="hero-wave">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2880 320" preserveAspectRatio="none" className="w-full h-full">
                <path
                  fill="#00CED1"
                  fillOpacity="0.07"
                  d="M0,200C240,150,480,150,720,200C960,250,1200,250,1440,200C1680,150,1920,150,2160,200C2400,250,2640,250,2880,200L2880,320L0,320Z"
                />
              </svg>
            </div>
          </div>

          {/* Background Image */}
          <img
            src="/hero-frau.png"
            alt=""
            className="absolute right-[20%] top-1/2 -translate-y-1/2 h-3/4 w-1/4 object-cover object-top pointer-events-none hidden lg:block"
            style={{ maskImage: "linear-gradient(to bottom, black 50%, transparent 100%)" }}
          />

          <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-8 w-full">
            <div className="lg:w-2/3">
              <AnimateOnScroll>
                <span className="badge badge-turquoise mb-8">
                  <Activity className="h-4 w-4" />
                  Cash-Diagnose in 5 Minuten
                </span>
              </AnimateOnScroll>

              <AnimateOnScroll delay={0.1}>
                <h1 className="heading-hero">
                  Wo steckt Ihr Cash?
                  <br />
                  <span className="text-turquoise">
                    Ein Problem - 3 Ursachen ...
                  </span>
                </h1>
              </AnimateOnScroll>

              <AnimateOnScroll delay={0.15}>
                <p className="text-sub mt-6 max-w-2xl">
                  ...1000 Lösungen. Die meisten Liquiditätsprobleme sind Symptome. LiqiNow findet die
                  Ursache – und führt Sie zur passenden Lösung. Erst Diagnose,
                  dann Maßnahmen, dann Finanzierung.
                </p>
              </AnimateOnScroll>

              <AnimateOnScroll delay={0.25}>
                <div className="flex flex-col sm:flex-row gap-4 mt-8">
                  <a href="/quickcheck" className="btn btn-primary btn-lg">
                    QuickCheck starten &rarr;
                  </a>
                  <a href="/wiki" className="btn btn-inverted btn-lg">
                    Wiki entdecken
                  </a>
                </div>
              </AnimateOnScroll>

              <AnimateOnScroll delay={0.3}>
                <div className="flex flex-wrap gap-5 mt-6">
                  <span className="flex items-center gap-1.5 text-sm text-subtle">
                    <BadgeCheck className="h-4 w-4 text-turquoise" /> Kostenlos
                  </span>
                  <span className="flex items-center gap-1.5 text-sm text-subtle">
                    <Clock className="h-4 w-4 text-turquoise" /> 5 Minuten
                  </span>
                  <span className="flex items-center gap-1.5 text-sm text-subtle">
                    <UserX className="h-4 w-4 text-turquoise" /> Keine Registrierung
                  </span>
                </div>
              </AnimateOnScroll>
            </div>
          </div>
        </section>

        {/* === DIAGNOSIS: 3 URSACHEN === */}
        <section className="section bg-white">
          <div className="mx-auto max-w-7xl px-4 md:px-8">
            <AnimateOnScroll>
              <div className="mb-12">
                <h2 className="heading-hero">Warum Ihr Cash fehlt: 3 Ursachen</h2>
                <p className="text-sub mt-4 max-w-2xl">
                  Liquiditätsprobleme haben fast immer eine dieser drei Wurzeln.
                  Ob Kunden zu spät zahlen, Ware im Lager Kapital bindet oder
                  Lieferanten auf Vorkasse bestehen – der Engpass lässt sich messen
                  und gezielt lösen.
                </p>
              </div>
            </AnimateOnScroll>
            <AnimateOnScroll delay={0.1}>
              <DiagnosisWidget />
            </AnimateOnScroll>
          </div>
        </section>

        {/* === HOW IT WORKS === */}
        <section id="so-funktionierts" className="section relative overflow-hidden gradient-bg-subtle">
          <AnimateOnScroll>
            <svg className="brush-stroke hidden lg:block absolute top-[20%] left-0 w-full h-85 z-5" viewBox="0 0 1600 80" fill="none" preserveAspectRatio="none">
              <defs>
                <filter id="brush-edge" x="-5%" y="-40%" width="110%" height="180%">
                  <feTurbulence type="fractalNoise" baseFrequency="0.015 0.04" numOctaves="4" result="noise" seed="4" />
                  <feDisplacementMap in="SourceGraphic" in2="noise" scale="18" xChannelSelector="R" yChannelSelector="G" />
                </filter>
              </defs>
              <path
                d="M0,20 C0,8 10,4 30,10 C150,14 300,18 500,22 C650,26 800,16 950,14 C1100,10 1200,18 1300,24 C1380,28 1440,32 1500,36 C1540,38 1570,39 1600,40 L1600,40 C1570,41 1540,42 1500,44 C1440,48 1380,52 1300,56 C1200,60 1100,68 950,66 C800,64 650,54 500,58 C300,62 150,66 30,68 C10,72 0,66 0,54 Z"
                fill="#00CED1" fillOpacity="0.65"
                filter="url(#brush-edge)"
              />
            </svg>
          </AnimateOnScroll>

          <div className="container relative z-10">
            <AnimateOnScroll>
              <div className="section-header">
                <h2><WaveText text="Von Symptom zur Lösung." /></h2>
                <p>In 4 Schritten vom Liquiditätsproblem zur passenden Maßnahme.</p>
              </div>
            </AnimateOnScroll>

            <div className="relative mt-16">
              <div className="relative z-10 grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
                {howItWorksSteps.map((step, index) => {
                  const Icon = iconMap[step.icon as keyof typeof iconMap];
                  return (
                    <AnimateOnScroll key={step.step} delay={index * 0.2}>
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-4">
                          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20">
                            {Icon && <Icon className="h-7 w-7 text-white" />}
                          </div>
                        </div>
                        <span className="text-5xl font-bold text-white mb-3 block">{step.step}</span>
                        <h3 className="heading-section text-white">{step.headline}</h3>
                        <p className="text-subtle mt-2 max-w-xs mx-auto">{step.body}</p>
                      </div>
                    </AnimateOnScroll>
                  );
                })}
              </div>
            </div>

            <AnimateOnScroll delay={0.8}>
              <div className="text-center mt-12">
                <a href="/quickcheck" className="btn btn-inverted btn-lg">
                  QuickCheck starten &rarr;
                </a>
              </div>
            </AnimateOnScroll>
          </div>
        </section>

        {/* === CASE SCENARIOS === */}
        <section className="section bg-white">
          <div className="container">
            <AnimateOnScroll>
              <div className="section-header">
                <h2>Typische Szenarien</h2>
                <p>Erkennen Sie sich wieder? Jedes dieser Muster hat eine klare Ursache – und eine Lösung.</p>
              </div>
            </AnimateOnScroll>

            <div className="grid grid-cols-1 gap-6 mt-12 sm:grid-cols-2 lg:grid-cols-3">
              {caseScenarios.map((scenario, index) => (
                <AnimateOnScroll key={scenario.id} delay={index * 0.1}>
                  <div className="case-card">
                    <span className="case-card-tag">{scenario.tag}</span>
                    <h3 className="case-card-title">{scenario.title}</h3>
                    <p className="case-card-desc">{scenario.description}</p>
                    <span className="text-xs font-medium text-turquoise-dark">
                      {scenario.bottleneck}
                    </span>
                  </div>
                </AnimateOnScroll>
              ))}
            </div>

            <AnimateOnScroll delay={0.6}>
              <div className="text-center mt-10">
                <a href="/quickcheck" className="btn btn-primary btn-lg">
                  Ihr Szenario analysieren &rarr;
                </a>
              </div>
            </AnimateOnScroll>
          </div>
        </section>

        {/* === ABOUT / USP === */}
        <section className="section bg-light-bg">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <AnimateOnScroll>
                <span className="badge badge-gold mb-6">Unser Ansatz</span>
                <h2 className="text-3xl font-bold text-dark md:text-5xl leading-tight">
                  Playbooks statt Produktkatalog.
                </h2>
                <p className="text-lg text-subtle mt-6 leading-relaxed max-w-2xl mx-auto">
                  LiqiNow ist kein Vergleichsportal. Wir führen Sie nicht zu einem
                  einzelnen Produkt, sondern zu einem Playbook – einem strukturierten
                  Maßnahmenpaket, das <strong>operative Hebel</strong>,{" "}
                  <strong>Risikobausteine</strong> und{" "}
                  <strong>Finanzierungsoptionen</strong> bündelt.
                </p>
              </AnimateOnScroll>

              <AnimateOnScroll delay={0.2}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12">
                  <div className="text-center">
                    <div className="flex items-center justify-center mx-auto mb-4 w-12 h-12 rounded-full bg-turquoise/10">
                      <Search className="h-6 w-6 text-turquoise" />
                    </div>
                    <h3 className="font-heading font-semibold text-dark">Erst Diagnose</h3>
                    <p className="text-sm text-subtle mt-2">Wo steckt Ihr Cash? CCC-Analyse statt Bauchgefühl.</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mx-auto mb-4 w-12 h-12 rounded-full bg-gold/20">
                      <BookOpen className="h-6 w-6 text-gold-dark" />
                    </div>
                    <h3 className="font-heading font-semibold text-dark">Dann Maßnahmen</h3>
                    <p className="text-sm text-subtle mt-2">Operativ, Risiko, Finanzierung – priorisiert nach Wirkung.</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mx-auto mb-4 w-12 h-12 rounded-full bg-turquoise/10">
                      <Target className="h-6 w-6 text-turquoise" />
                    </div>
                    <h3 className="font-heading font-semibold text-dark">Dann Lösung</h3>
                    <p className="text-sm text-subtle mt-2">Neutral, nachvollziehbar, CFO-tauglich.</p>
                  </div>
                </div>
              </AnimateOnScroll>
            </div>
          </div>
        </section>

        {/* === FAQ === */}
        <section id="faq" className="section bg-white">
          <div className="container">
            <div className="max-w-3xl mx-auto">
              <AnimateOnScroll>
                <div className="section-header">
                  <h2>Häufig gestellte Fragen</h2>
                  <p>Alles, was Sie über LiqiNow wissen müssen</p>
                </div>
              </AnimateOnScroll>

              <AnimateOnScroll delay={0.1}>
                <div className="card-container">
                  {faqItems.map((item) => (
                    <FaqItem
                      key={item.question}
                      question={item.question}
                      answer={item.answer}
                    />
                  ))}
                </div>
              </AnimateOnScroll>
            </div>
          </div>
        </section>

        {/* === FINAL CTA === */}
        <section
          id="starten"
          className="relative py-20 md:py-28 overflow-hidden bg-gold"
        >
          <div className="relative z-10 mx-auto max-w-3xl px-4 text-center md:px-8">
            <AnimateOnScroll>
              <h2 className="font-heading text-3xl font-bold text-dark md:text-5xl">
                Wo steckt Ihr Cash?
              </h2>
              <p className="mt-6 text-lg text-dark/80 md:text-xl">
                Starten Sie jetzt Ihren kostenlosen QuickCheck – in nur 5 Minuten
                wissen Sie, welcher Hebel Ihre Liquidität am schnellsten verbessert.
              </p>
              <a href="/quickcheck" className="btn btn-inverted btn-lg mt-8 inline-flex items-center gap-2">
                QuickCheck starten <ArrowRight className="h-5 w-5" />
              </a>
              <p className="mt-6 text-sm text-dark/50">
                Kostenlos · Keine Registrierung · Ergebnis sofort
              </p>
            </AnimateOnScroll>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
