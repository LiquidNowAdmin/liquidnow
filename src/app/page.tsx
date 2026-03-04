import {
  ArrowRight,
  Zap,
  Check,
  ShoppingCart,
  Rocket,
  MousePointerClick,
} from "lucide-react";
import Image from "next/image";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import FaqItem from "@/components/FaqItem";
import FunnelWidget from "@/components/FunnelWidget";
import UseCaseSlider from "@/components/UseCaseSlider";
import { faqItems } from "@/lib/data";
import customerImg from "../../img/category/customer.png";

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
                  fill="currentColor"
                  fillOpacity="0.07"
                  className="text-turquoise"
                  d="M0,200C240,150,480,150,720,200C960,250,1200,250,1440,200C1680,150,1920,150,2160,200C2400,250,2640,250,2880,200L2880,320L0,320Z"
                />
              </svg>
            </div>
          </div>

          <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-8 w-full">
            <div className="relative grid grid-cols-1 items-center gap-6 lg:grid-cols-[1.5fr_1fr]">

              {/* Hero-Frau – absolut in der linken Spalte */}
              <div
                className="absolute left-[calc(25%+10px)] top-[45%] -translate-x-1/2 -translate-y-1/2 z-0 pointer-events-none hidden lg:block"
                style={{ maskImage: "linear-gradient(to bottom, black 50%, transparent 90%)", WebkitMaskImage: "linear-gradient(to bottom, black 50%, transparent 90%)" }}
              >
                <Image
                  src="/frau.png"
                  alt=""
                  width={600}
                  height={780}
                  className="h-144 w-auto object-contain"
                  priority
                  aria-hidden="true"
                />
              </div>

              {/* Left: Text */}
              <div className="text-center lg:text-left self-end relative z-10">
                <AnimateOnScroll delay={0.1}>
                  <h1 className="heading-hero">
                    Intelligent vergleichen.
                    <br />
                    <span className="text-turquoise">
                      Schneller finanzieren.
                    </span>
                  </h1>
                </AnimateOnScroll>

                <AnimateOnScroll delay={0.15}>
                  <p className="text-sub mt-6 max-w-2xl">
                    Betriebsmittelkredite von führenden Banken und Fintechs –
                    kostenlos verglichen, für Unternehmer mit Köpfchen.
                  </p>
                </AnimateOnScroll>

                <AnimateOnScroll delay={0.3}>
                  <div className="trust-markers mt-8 lg:justify-start">
                    <span className="trust-item">
                      <Check className="h-4 w-4 text-turquoise" />
                      Keine zusätzlichen Gebühren
                    </span>
                    <span className="trust-item">
                      <Check className="h-4 w-4 text-turquoise" />
                      In 3 Minuten zum Angebot
                    </span>
                    <span className="trust-item">
                      <Check className="h-4 w-4 text-turquoise" />
                      DSGVO-konform
                    </span>
                  </div>
                </AnimateOnScroll>
              </div>

              {/* Right: Funnel Widget */}
              <AnimateOnScroll delay={0.3}>
                <div className="flex justify-center lg:justify-end w-full">
                  <div className="w-full max-w-104">
                    <FunnelWidget />
                  </div>
                </div>
              </AnimateOnScroll>
            </div>

            {/* USP Strip */}
            <div className="usp-strip-inner">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <AnimateOnScroll>
                  <div className="usp-item">
                    <div className="usp-icon"><ShoppingCart className="h-6 w-6 text-turquoise" /></div>
                    <div>
                      <p className="usp-title">Ein Antrag, alle Anbieter</p>
                      <p className="usp-text">Papierlos – beste Angebote direkt vergleichen</p>
                    </div>
                  </div>
                </AnimateOnScroll>
                <AnimateOnScroll delay={0.1}>
                  <div className="usp-item">
                    <div className="usp-icon"><Zap className="h-6 w-6 text-turquoise" /></div>
                    <div>
                      <p className="usp-title">Sofort Konditionen</p>
                      <p className="usp-text">Zinssätze direkt einsehen</p>
                    </div>
                  </div>
                </AnimateOnScroll>
                <AnimateOnScroll delay={0.2}>
                  <div className="usp-item">
                    <div className="usp-icon"><Rocket className="h-6 w-6 text-turquoise" /></div>
                    <div>
                      <p className="usp-title">24h Angebot · 48h Auszahlung</p>
                      <p className="usp-text">Schnellste Abwicklung am Markt</p>
                    </div>
                  </div>
                </AnimateOnScroll>
                <AnimateOnScroll delay={0.3}>
                  <div className="usp-item">
                    <div className="usp-icon"><MousePointerClick className="h-6 w-6 text-turquoise" /></div>
                    <div>
                      <p className="usp-title">100% Self-Service</p>
                      <p className="usp-text">Digital & ohne Beratungskosten</p>
                    </div>
                  </div>
                </AnimateOnScroll>
              </div>
            </div>
          </div>
        </section>

        {/* === USE CASE SLIDER (scroll-driven) === */}
        <UseCaseSlider />

        {/* === FÜR WEN === */}
        <section className="section bg-white">
          <div className="container">
            <AnimateOnScroll>
              <p className="usecase-sticky-label text-center mb-3">Voraussetzungen</p>
              <h2 className="usecase-sticky-heading text-center mb-10">Für wen ist<br />LiquidNow?</h2>
            </AnimateOnScroll>
            <div className="eligibility-grid">
              <AnimateOnScroll>
                <div className="overflow-hidden rounded-2xl">
                  <Image
                    src={customerImg}
                    alt=""
                    width={800}
                    height={500}
                    className="w-full object-cover block"
                    aria-hidden="true"
                  />
                </div>
              </AnimateOnScroll>

              <AnimateOnScroll delay={0.1}>
                <p className="text-sub mb-6 max-w-sm">
                  Wir konzentrieren uns auf etablierte deutsche Unternehmen mit laufendem Geschäftsbetrieb – keine Startups, keine Konzerne.
                </p>
                <ul className="eligibility-list">
                  {[
                    ["Deutsches Unternehmen", "GmbH, UG, GbR, Einzelunternehmen u. a."],
                    ["Mindestens 6 Monate Umsatzhistorie", "Keine Gründungsfinanzierung"],
                    ["Mittelverwendung im Geschäftsbetrieb", "Betriebsmittel, Wareneinkauf, laufende Kosten"],
                    ["Einfache Unternehmensstruktur", "Keine Holdingkonstrukte oder Sondervehikel"],
                    ["Auch bei negativer Schufa / Crefo", "Einzelne Anbieter in unserem Netzwerk prüfen trotzdem"],
                    ["Solide Finanzkennzahlen", "Nachweisbarer Umsatz und positive Entwicklung"],
                  ].map(([title, sub]) => (
                    <li key={title} className="eligibility-item">
                      <div className="eligibility-icon">
                        <Check className="h-4 w-4 text-turquoise" />
                      </div>
                      <div>
                        <p className="eligibility-title">{title}</p>
                        <p className="eligibility-sub">{sub}</p>
                      </div>
                    </li>
                  ))}
                </ul>
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
                Bereit für schnellere Finanzierung?
              </h2>
              <p className="mt-6 text-lg text-dark/80 md:text-xl">
                Jetzt kostenlos Angebote vergleichen – in nur 3 Minuten zum passenden Kredit.
              </p>
              <a href="/plattform" className="btn btn-inverted btn-lg mt-8 inline-flex items-center gap-2">
                Jetzt vergleichen <ArrowRight className="h-5 w-5" />
              </a>
              <p className="mt-6 text-sm text-dark/50">
                Kostenlos · Keine Registrierung · Sofortergebnis
              </p>
            </AnimateOnScroll>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
