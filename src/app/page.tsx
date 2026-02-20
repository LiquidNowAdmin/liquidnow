import {
  Zap,
  Waves,
  Banknote,
  FileUp,
  Check,
  ShoppingCart,
  Clock,
  Rocket,
  MousePointerClick,
} from "lucide-react";
import Image from "next/image";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import FaqItem from "@/components/FaqItem";
import CountUp from "@/components/CountUp";
import WaveText from "@/components/WaveText";
import ScrollWaves from "@/components/ScrollWaves";
import FunnelWidget from "@/components/FunnelWidget";
import {
  howItWorksSteps,
  faqItems,
  partnerLogos,
} from "@/lib/data";

const iconMap = {
  Zap,
  Waves,
  Banknote,
  FileUp,
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

          <div className="absolute bottom-0 left-0 w-full overflow-hidden">
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

          <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-8 w-full">
            <div className="relative grid grid-cols-1 items-center gap-6 lg:grid-cols-[1.5fr_1fr]">
              {/* Hero Image - centered in left column area */}
              <div
                className="absolute left-[calc(25%+10px)] top-[45%] -translate-x-1/2 -translate-y-1/2 z-0 pointer-events-none hidden lg:block"
                style={{ maskImage: 'linear-gradient(to bottom, black 50%, transparent 90%)', WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 90%)' }}
              >
                <Image
                  src="/hero-unternehmerin.png"
                  alt=""
                  width={600}
                  height={780}
                  className="h-144 w-auto object-contain"
                  priority
                  aria-hidden="true"
                />
              </div>
              {/* Left: Text */}
              <div className="text-center lg:text-left self-end">
                <div className="relative z-10">
                  <AnimateOnScroll>
                    <span className="badge badge-gold mb-8">
                      <Zap className="h-4 w-4" />
                      48h Auszahlung
                    </span>
                  </AnimateOnScroll>

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
                    <div className="usp-icon">
                      <ShoppingCart className="h-6 w-6 text-turquoise" />
                    </div>
                    <div>
                      <p className="usp-title">Ein Antrag, alle Anbieter</p>
                      <p className="usp-text">Papierlos – beste Angebote direkt vergleichen</p>
                    </div>
                  </div>
                </AnimateOnScroll>

                <AnimateOnScroll delay={0.1}>
                  <div className="usp-item">
                    <div className="usp-icon">
                      <MousePointerClick className="h-6 w-6 text-turquoise" />
                    </div>
                    <div>
                      <p className="usp-title">Sofort Konditionen</p>
                      <p className="usp-text">Zinssätze direkt einsehen</p>
                    </div>
                  </div>
                </AnimateOnScroll>

                <AnimateOnScroll delay={0.2}>
                  <div className="usp-item">
                    <div className="usp-icon">
                      <Rocket className="h-6 w-6 text-turquoise" />
                    </div>
                    <div>
                      <p className="usp-title">24h Angebot · 48h Auszahlung</p>
                      <p className="usp-text">Schnellste Abwicklung am Markt</p>
                    </div>
                  </div>
                </AnimateOnScroll>

                <AnimateOnScroll delay={0.3}>
                  <div className="usp-item">
                    <div className="usp-icon">
                      <Clock className="h-6 w-6 text-turquoise" />
                    </div>
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

        {/* === ABOUT / STATS === */}
        <section className="section bg-white border-t border-gray-100">
          <div className="container">
            <div className="relative">
              {/* Einstein Background – left side, spanning full height */}
              <div
                className="absolute right-0 top-0 bottom-0 hidden lg:flex items-end pointer-events-none"
                style={{ maskImage: 'linear-gradient(to bottom, black 40%, transparent 95%)', WebkitMaskImage: 'linear-gradient(to bottom, black 40%, transparent 95%)' }}
              >
                <Image
                  src="/einstein.png"
                  alt=""
                  width={400}
                  height={500}
                  className="h-full w-auto object-contain"
                  aria-hidden="true"
                />
              </div>

              {/* Content */}
              <div className="relative z-10">
                <AnimateOnScroll>
                  <div className="max-w-2xl">
                    <span className="badge badge-gold mb-6">L = IQ²</span>
                    <h2 className="text-3xl font-bold text-dark md:text-5xl leading-tight">
                      Finanzierung in Lichtgeschwindigkeit.
                    </h2>
                    <blockquote className="mt-6 border-l-4 border-turquoise pl-5 text-xl md:text-2xl italic text-subtle">
                      &bdquo;Alles ist relativ – außer Ihr Zins.&ldquo;
                      <footer className="mt-2 text-base not-italic text-dark/60">– Albert Einstein (fast)</footer>
                    </blockquote>
                    <p className="text-lg text-subtle mt-6 leading-relaxed">
                      Unternehmer brauchen Liquidität, wenn es drauf ankommt – nicht
                      nach drei Bankgesprächen und sechs Wochen Wartezeit. Klassische
                      Kreditvermittlung passt nicht mehr zur Realität von KMU.
                      L<span className="text-turquoise font-semibold">IQ</span>uiNow
                      bringt alle Anbieter auf eine Plattform: vergleichen, auswählen,
                      abschließen – der IQ in Ihrer Liquidität.
                    </p>
                  </div>
                </AnimateOnScroll>

                <AnimateOnScroll delay={0.2}>
                  <div className="mt-10">
                    <a href="/antrag/kreditart" className="btn btn-primary btn-lg">
                      Jetzt kostenlos vergleichen &rarr;
                    </a>
                  </div>
                </AnimateOnScroll>
              </div>
            </div>
          </div>
        </section>

        {/* === HOW IT WORKS === */}
        <section id="so-funktionierts" className="section relative overflow-hidden bg-gold">

          {/* Abstract brush stroke – breaks out of container to reach right screen edge */}
          <AnimateOnScroll>
            <svg className="brush-stroke hidden lg:block absolute top-[36%] left-0 w-full h-24 z-1" viewBox="0 0 1600 80" fill="none" preserveAspectRatio="none">
              <defs>
                <filter id="brush-edge" x="-5%" y="-40%" width="110%" height="180%">
                  <feTurbulence type="fractalNoise" baseFrequency="0.02 0.04" numOctaves="4" result="noise" seed="3" />
                  <feDisplacementMap in="SourceGraphic" in2="noise" scale="14" xChannelSelector="R" yChannelSelector="G" />
                </filter>
              </defs>
              <path
                d="M0,20 C0,8 10,4 30,10 C150,14 300,18 500,22 C650,26 800,16 950,14 C1100,10 1200,18 1300,24 C1380,28 1440,32 1500,36 C1540,38 1570,39 1600,40 L1600,40 C1570,41 1540,42 1500,44 C1440,48 1380,52 1300,56 C1200,60 1100,68 950,66 C800,64 650,54 500,58 C300,62 150,66 30,68 C10,72 0,66 0,54 Z"
                fill="#00CED1"
                filter="url(#brush-edge)"
              />
            </svg>
          </AnimateOnScroll>

          <div className="container relative z-10">
            <AnimateOnScroll>
              <div className="section-header">
                <h2><WaveText text="Läuft bei Ihnen." /></h2>
                <p>So einfach kommen Sie an Liquidität.</p>
              </div>
            </AnimateOnScroll>

            <div className="relative mt-16">
              <div className="relative z-10 grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
                {howItWorksSteps.map((step, index) => (
                    <AnimateOnScroll key={step.step} delay={index * 0.2}>
                      <div className="text-center">
                        <span className="text-5xl font-bold text-white mb-3 block">{step.step}</span>
                        <h3 className="heading-section text-white">{step.headline}</h3>
                        <p className="text-subtle mt-2 max-w-xs mx-auto">{step.body}</p>
                      </div>
                    </AnimateOnScroll>
                ))}
              </div>
            </div>

            <AnimateOnScroll delay={0.8}>
              <div className="text-center mt-12">
                <a href="/antrag/kreditart" className="btn btn-inverted btn-lg">
                  Jetzt Angebot erhalten &rarr;
                </a>
              </div>
            </AnimateOnScroll>
          </div>
        </section>

        {/* === FAQ === */}
        <section id="faq" className="section bg-light-bg">
          <div className="container">
            <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[1fr_auto]">
              <div>
                <AnimateOnScroll>
                  <div className="section-header lg:text-left">
                    <h2>Häufig gestellte Fragen</h2>
                    <p>Alles was Sie wissen müssen</p>
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

              <AnimateOnScroll delay={0.2}>
                <div className="relative rounded-2xl overflow-hidden shadow-lg hidden lg:block max-w-xs">
                  <Image
                    src="/kmu-einzelhandel-betriebsmittelkredit.png"
                    alt="Unternehmerin am Laptop"
                    width={320}
                    height={420}
                    className="w-full h-auto object-cover"
                  />
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
                Bereit für schnelle Liquidität?
              </h2>
              <p className="mt-6 text-lg text-dark/80 md:text-xl">
                Starten Sie jetzt Ihren kostenlosen Antrag – in nur 60 Sekunden.
              </p>
              <a href="/antrag/kreditart" className="btn btn-inverted btn-lg mt-8">
                Jetzt kostenlos starten &rarr;
              </a>
              <p className="mt-6 text-sm text-dark/50">
                100% kostenlos · Unverbindlich · Keine SCHUFA-Auswirkung
              </p>
            </AnimateOnScroll>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
