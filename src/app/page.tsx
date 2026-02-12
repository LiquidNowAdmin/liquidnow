import {
  Zap,
  Waves,
  Banknote,
  Smartphone,
  ShieldCheck,
  Check,
  Star,
  Quote,
  ShoppingCart,
  Clock,
  Rocket,
  MousePointerClick,
  Target,
  Users,
  Award,
  Scale,
} from "lucide-react";
import Image from "next/image";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import FaqItem from "@/components/FaqItem";
import FunnelWidget from "@/components/FunnelWidget";
import {
  howItWorksSteps,
  valueProps,
  targetAudienceItems,
  testimonials,
  faqItems,
  partnerLogos,
} from "@/lib/data";

const iconMap = {
  Zap,
  Waves,
  Banknote,
  Smartphone,
  ShieldCheck,
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
            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
              {/* Left: Text */}
              <div className="text-center lg:text-left">
                <AnimateOnScroll>
                  <span className="badge badge-gold mb-8">
                    <Zap className="h-4 w-4" />
                    48h Auszahlung
                  </span>
                </AnimateOnScroll>

                <AnimateOnScroll delay={0.1}>
                  <h1 className="heading-hero">
                    Liquidität in 48 Stunden
                    <br />
                    <span className="text-turquoise">
                      für E-Commerce & Handel
                    </span>
                  </h1>
                </AnimateOnScroll>

                <AnimateOnScroll delay={0.15}>
                  <p className="text-sub mt-6 max-w-2xl">
                    Ihre unabhängige Vergleichsplattform für Betriebsmittelfinanzierung.
                    Seit über 10 Jahren helfen wir mittelständischen Unternehmen,
                    die beste Finanzierung für ihr Wachstum zu finden.
                  </p>
                </AnimateOnScroll>

                <AnimateOnScroll delay={0.2}>
                  <p className="text-sub mt-4 max-w-2xl">
                    €10.000 bis €500.000 · Antrag in 60 Sekunden · Keine SCHUFA-Auswirkung
                  </p>
                </AnimateOnScroll>

                <AnimateOnScroll delay={0.3}>
                  <div className="trust-markers mt-8 lg:justify-start">
                    <span className="trust-item">
                      <Check className="h-4 w-4 text-turquoise" />
                      100% kostenlos
                    </span>
                    <span className="trust-item">
                      <Check className="h-4 w-4 text-turquoise" />
                      Unverbindlich
                    </span>
                    <span className="trust-item">
                      <Check className="h-4 w-4 text-turquoise" />
                      4+ Banken vergleichen
                    </span>
                  </div>
                </AnimateOnScroll>
              </div>

              {/* Right: Funnel Widget */}
              <AnimateOnScroll delay={0.3}>
                <div className="flex justify-center lg:justify-end">
                  <FunnelWidget />
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

        {/* === WHY LIQUIDNOW === */}
        <section className="section bg-white border-t border-gray-100">
          <div className="container">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left: Heading + USP Grid */}
              <div>
                <AnimateOnScroll>
                  <div className="mb-12">
                    <h2 className="text-3xl font-bold text-dark mb-3 md:text-4xl">Warum LiquidNow?</h2>
                    <p className="text-lg text-subtle">Unabhängig, transparent, auf Ihrer Seite</p>
                  </div>
                </AnimateOnScroll>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <AnimateOnScroll>
                  <div className="text-center md:text-left">
                    <div className="icon-box icon-box-lg icon-box-turquoise mx-auto md:mx-0 mb-4">
                      <Scale className="h-8 w-8" />
                    </div>
                    <h3 className="text-lg font-bold text-dark mb-2">100% Unabhängig</h3>
                    <p className="text-subtle text-sm leading-relaxed">
                      Neutrale Vergleichsplattform ohne Interessenskonflikt.
                      Wir empfehlen das beste Angebot für Sie, nicht das mit der höchsten Provision.
                    </p>
                  </div>
                </AnimateOnScroll>

                <AnimateOnScroll delay={0.1}>
                  <div className="text-center md:text-left">
                    <div className="icon-box icon-box-lg icon-box-turquoise mx-auto md:mx-0 mb-4">
                      <Target className="h-8 w-8" />
                    </div>
                    <h3 className="text-lg font-bold text-dark mb-2">Sie entscheiden</h3>
                    <p className="text-subtle text-sm leading-relaxed">
                      100% digital & selbstbestimmt. Keine Verkaufsanrufe, kein Druck.
                      Sie vergleichen in Ruhe und wählen das beste Angebot.
                    </p>
                  </div>
                </AnimateOnScroll>

                <AnimateOnScroll delay={0.2}>
                  <div className="text-center md:text-left">
                    <div className="icon-box icon-box-lg icon-box-turquoise mx-auto md:mx-0 mb-4">
                      <Award className="h-8 w-8" />
                    </div>
                    <h3 className="text-lg font-bold text-dark mb-2">Transparent & Fair</h3>
                    <p className="text-subtle text-sm leading-relaxed">
                      Keine Beratungskosten für Sie. Wir finanzieren uns über Bankprovisionen –
                      Sie zahlen nichts extra. Anders als Vermittler erheben wir keine zusätzlichen Gebühren.
                    </p>
                  </div>
                </AnimateOnScroll>

                <AnimateOnScroll delay={0.3}>
                  <div className="text-center md:text-left">
                    <div className="icon-box icon-box-lg icon-box-turquoise mx-auto md:mx-0 mb-4">
                      <Users className="h-8 w-8" />
                    </div>
                    <h3 className="text-lg font-bold text-dark mb-2">Auf Ihrer Seite</h3>
                    <p className="text-subtle text-sm leading-relaxed">
                      Wir arbeiten für Sie, nicht für Banken.
                      Unser Ziel: Das beste Finanzierungsangebot für Ihr Unternehmen.
                    </p>
                  </div>
                </AnimateOnScroll>
              </div>
              </div>

              {/* Right: Image */}
              <AnimateOnScroll delay={0.2}>
                <div className="relative rounded-2xl overflow-hidden shadow-lg aspect-[3/4] max-h-[650px]">
                  <Image
                    src="/kmu-einzelhandel-betriebsmittelkredit.png"
                    alt="Geschäftsführerin im Einzelhandel nutzt digitalen Kreditvergleich für schnelle Betriebsmittelfinanzierung"
                    width={600}
                    height={750}
                    className="w-full h-full object-cover object-top"
                    priority={false}
                    title="KMU Betriebsmittelkredit für Einzelhandel und E-Commerce"
                  />
                </div>
              </AnimateOnScroll>
            </div>
          </div>
        </section>

        {/* === HOW IT WORKS === */}
        <section id="so-funktionierts" className="section bg-white">
          <div className="container">
            <AnimateOnScroll>
              <div className="section-header">
                <h2>So funktioniert&apos;s</h2>
                <p>In 3 einfachen Schritten zu Ihrer Finanzierung</p>
              </div>
            </AnimateOnScroll>

            <div className="relative grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-8">
              <div className="gradient-line absolute top-16 left-[16.67%] right-[16.67%] hidden h-0.5 md:block" />

              {howItWorksSteps.map((step, index) => {
                const Icon = iconMap[step.icon];
                return (
                  <AnimateOnScroll key={step.step} delay={index * 0.15}>
                    <div className="step-card">
                      <div className="step-number">{step.step}</div>

                      <div
                        className={`icon-box icon-box-lg mb-6 ${
                          step.iconColor === "gold"
                            ? "icon-box-gold"
                            : "icon-box-turquoise"
                        }`}
                      >
                        <Icon
                          className={`h-10 w-10 ${
                            step.iconColor === "gold"
                              ? "text-gold"
                              : "text-turquoise"
                          }`}
                        />
                      </div>

                      <h3 className="heading-section">{step.headline}</h3>
                      <p className="text-body mt-3 max-w-xs">{step.body}</p>
                    </div>
                  </AnimateOnScroll>
                );
              })}
            </div>
          </div>
        </section>

        {/* === VALUE PROPS === */}
        <section id="vorteile" className="section bg-sand-beige/30">
          <div className="container">
            <AnimateOnScroll>
              <div className="section-header">
                <h2>Ihre Vorteile</h2>
                <p>Warum E-Commerce-Unternehmer LiquidNow wählen</p>
              </div>
            </AnimateOnScroll>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {valueProps.map((prop, index) => {
                const Icon = iconMap[prop.icon];
                return (
                  <AnimateOnScroll key={prop.headline} delay={index * 0.15}>
                    <div className="card card-hover">
                      <div
                        className={`icon-box icon-box-sm mb-6 ${
                          prop.iconColor === "gold"
                            ? "icon-box-gold"
                            : "icon-box-turquoise"
                        }`}
                      >
                        <Icon
                          className={`h-7 w-7 ${
                            prop.iconColor === "gold"
                              ? "text-gold"
                              : "text-turquoise"
                          }`}
                        />
                      </div>
                      <h3 className="heading-section">{prop.headline}</h3>
                      <p className="text-body mt-3">{prop.body}</p>
                    </div>
                  </AnimateOnScroll>
                );
              })}
            </div>
          </div>
        </section>

        {/* === TARGET AUDIENCE === */}
        <section id="fuer-wen" className="section bg-white">
          <div className="container">
            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
              <AnimateOnScroll>
                <div>
                  <h2 className="heading-hero !text-3xl md:!text-4xl">
                    Für wen ist LiquidNow?
                  </h2>
                  <p className="text-sub mt-4">
                    Speziell entwickelt für E-Commerce & Handel
                  </p>
                  <ul className="mt-8 space-y-4">
                    {targetAudienceItems.map((item) => (
                      <li key={item} className="check-item">
                        <div className="check-icon">
                          <Check className="h-4 w-4 text-turquoise" />
                        </div>
                        <span className="text-dark">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <a href="#starten" className="btn btn-primary btn-lg mt-8">
                    Jetzt kostenlos starten
                  </a>
                </div>
              </AnimateOnScroll>

              <AnimateOnScroll delay={0.2}>
                <div className="gradient-bg-soft relative overflow-hidden rounded-2xl p-12 md:p-16">
                  <div className="flex flex-col items-center justify-center text-center">
                    <Waves className="h-16 w-16 text-turquoise/40 mb-4" />
                    <p className="text-lg font-semibold text-dark/60">
                      E-Commerce & Handel
                    </p>
                    <p className="mt-2 text-sm text-subtle">
                      €10.000 – €500.000 Liquidität
                    </p>
                    <div className="mt-6 grid grid-cols-2 gap-4 text-center">
                      <div className="rounded-lg bg-white/80 px-4 py-3 shadow-card">
                        <p className="text-2xl font-bold text-turquoise">60s</p>
                        <p className="text-xs text-subtle">Antrag</p>
                      </div>
                      <div className="rounded-lg bg-white/80 px-4 py-3 shadow-card">
                        <p className="text-2xl font-bold text-gold">48h</p>
                        <p className="text-xs text-subtle">Auszahlung</p>
                      </div>
                    </div>
                  </div>
                </div>
              </AnimateOnScroll>
            </div>
          </div>
        </section>

        {/* === PARTNER LOGOS === */}
        <section id="partner" className="py-16 md:py-20 bg-light-bg">
          <div className="container">
            <AnimateOnScroll>
              <p className="section-label">Vertrauensvolle Partner</p>
            </AnimateOnScroll>

            <AnimateOnScroll delay={0.1}>
              <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
                {partnerLogos.map((logo) => (
                  <div key={logo.name} className="partner-logo">
                    {logo.name}
                  </div>
                ))}
              </div>
            </AnimateOnScroll>
          </div>
        </section>

        {/* === TESTIMONIALS === */}
        <section id="kundenstimmen" className="section bg-white">
          <div className="container">
            <AnimateOnScroll>
              <div className="section-header">
                <h2>Das sagen unsere Kunden</h2>
                <p>Echte Erfahrungen von E-Commerce-Unternehmern</p>
              </div>
            </AnimateOnScroll>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {testimonials.map((testimonial, index) => (
                <AnimateOnScroll key={testimonial.author} delay={index * 0.15}>
                  <div className="testimonial-card">
                    <Quote className="absolute top-6 right-6 h-8 w-8 text-turquoise/20" />

                    <div className="star-rating">
                      {Array.from({ length: testimonial.stars }).map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-gold text-gold" />
                      ))}
                    </div>

                    <p className="text-dark leading-relaxed italic">
                      &ldquo;{testimonial.quote}&rdquo;
                    </p>

                    <div className="mt-6 border-t border-border pt-4">
                      <p className="font-semibold text-dark">{testimonial.author}</p>
                      <p className="text-sm text-subtle">{testimonial.company}</p>
                    </div>
                  </div>
                </AnimateOnScroll>
              ))}
            </div>
          </div>
        </section>

        {/* === FAQ === */}
        <section id="faq" className="section bg-light-bg">
          <div className="container-sm">
            <AnimateOnScroll>
              <div className="section-header">
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
        </section>

        {/* === FINAL CTA === */}
        <section
          id="starten"
          className="gradient-cta relative py-20 md:py-28 overflow-hidden"
        >
          <div className="absolute bottom-0 left-0 w-full opacity-10">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full">
              <path
                fill="#ffffff"
                d="M0,224L48,213.3C96,203,192,181,288,186.7C384,192,480,224,576,218.7C672,213,768,171,864,165.3C960,160,1056,192,1152,197.3C1248,203,1344,181,1392,170.7L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
              />
            </svg>
          </div>

          <div className="relative z-10 mx-auto max-w-3xl px-4 text-center md:px-8">
            <AnimateOnScroll>
              <h2 className="font-heading text-3xl font-bold text-white md:text-5xl">
                Bereit für schnelle Liquidität?
              </h2>
              <p className="mt-6 text-lg text-white/90 md:text-xl">
                Starten Sie jetzt Ihren kostenlosen Antrag – in nur 60 Sekunden.
              </p>
              <a href="#" className="btn btn-inverted btn-lg mt-8">
                Jetzt kostenlos starten &rarr;
              </a>
              <p className="mt-6 text-sm text-white/70">
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
