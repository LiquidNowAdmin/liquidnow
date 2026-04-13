"use client";

import { useRef, useEffect, useState } from "react";
import Image from "next/image";
import {
  Sun,
  Briefcase,
  ShoppingCart,
  Rocket,
  RefreshCw,
  Receipt,
  Megaphone,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

interface UseCase {
  icon: LucideIcon;
  title: string;
  body: string;
  image?: string;
  cta?: boolean;
}

const useCases: UseCase[] = [
  {
    icon: Sun,
    title: "Saisonale Spitzen souverän meistern",
    body: "Sichern Sie sich kurzfristige Liquidität genau dann, wenn Ihr KMU sie benötigt. Mit unseren flexiblen Working Capital Lösungen überbrücken Sie saisonale Schwankungen, ohne Ihre Unternehmensrücklagen anzutasten.",
    image: "/category/season.png",
  },
  {
    icon: ShoppingCart,
    title: "Einkaufsfinanzierung für optimale Margen",
    body: "Verpassen Sie keine Skonto-Vorteile mehr. Nutzen Sie unsere smarte Einkaufsfinanzierung, um Lieferanten frühzeitig zu bezahlen, Rabatte zu sichern und die Profitabilität Ihres Mittelstandsunternehmens zu steigern.",
    image: "/category/goods.png",
  },
  {
    icon: Rocket,
    title: "Unternehmenswachstum gezielt finanzieren",
    body: "Mehr Aufträge erfordern mehr Kapitalbindung. Finanzieren Sie Ihr Wachstum intelligent über Betriebsmittelkredite und schonen Sie Ihre Substanz. Der Marktplatz für Ihre Wachstumsfinanzierung.",
    image: "/category/growth.png",
  },
  {
    icon: Receipt,
    title: "Steuernachzahlungen flexibel stemmen",
    body: "Überraschende Steuerforderungen? Halten Sie Ihre Liquidität intakt und finanzieren Sie Nachzahlungen smart.",
    image: "/category/tax.png",
  },
  {
    icon: Megaphone,
    title: "Marketing & Digitalisierung vorantreiben",
    body: "Skalieren Sie Ihre Kampagnen und treiben Sie die Digitalisierung Ihres KMU voran – ganz ohne Budget-Engpass. Investieren Sie in zukunftsweisende IT- und Marketingprojekte, wenn der richtige Moment da ist.",
    image: "/category/marketing.png",
  },
  {
    icon: Megaphone,
    title: "Jetzt vergleichen",
    body: "",
    cta: true,
  },
];

const N = useCases.length;
const SCROLL_PER_SLIDE = 400; // px of vertical scroll per horizontal step

export default function UseCaseSlider() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const trackWrapRef = useRef<HTMLDivElement>(null);
  const cardWidthRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);

  // Raw scroll progress: 0 → N-1
  const rawProgress = useMotionValue(0);
  // Smooth spring for silky motion
  const smoothProgress = useSpring(rawProgress, { stiffness: 160, damping: 22, restDelta: 0.001 });

  // translateX: card 0 centered at progress=0, card N-1 centered at progress=N-1
  // formula: cardWidth * (1 - progress)
  const translateX = useTransform(smoothProgress, (p) => cardWidthRef.current * (1 - p));
  const progressBarWidth = useTransform(rawProgress, [0, N - 1], ["0%", "100%"]);

  // Measure card width (= 1/3 of track container)
  useEffect(() => {
    const measure = () => {
      if (trackWrapRef.current) {
        cardWidthRef.current = trackWrapRef.current.offsetWidth / 3;
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Map vertical scroll → horizontal progress
  useEffect(() => {
    const onScroll = () => {
      if (!wrapperRef.current) return;
      const scrolled = -wrapperRef.current.getBoundingClientRect().top;

      if (scrolled <= 0) {
        rawProgress.set(0);
        setActiveIndex(0);
        return;
      }
      const maxScroll = (N - 1) * SCROLL_PER_SLIDE;
      if (scrolled >= maxScroll) {
        rawProgress.set(N - 1);
        setActiveIndex(N - 1);
        return;
      }
      const p = scrolled / SCROLL_PER_SLIDE;
      rawProgress.set(p);
      setActiveIndex(Math.round(p));
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [rawProgress]);

  // Horizontal wheel → vertical scroll (so left/right swipe advances slides)
  useEffect(() => {
    const el = stickyRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      window.scrollBy({ top: e.deltaX });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // Clicking a dot scrolls the page to that slide's position
  const goToSlide = (i: number) => {
    if (!wrapperRef.current) return;
    window.scrollTo({
      top: wrapperRef.current.offsetTop + i * SCROLL_PER_SLIDE,
      behavior: "smooth",
    });
  };

  return (
    <div
      ref={wrapperRef}
      className="usecase-scroll-wrapper"
      style={{ height: `calc(100vh + ${(N - 1) * SCROLL_PER_SLIDE}px)` }}
    >
      <div ref={stickyRef} className="usecase-sticky">
        {/* Header */}
        <p className="usecase-sticky-label">Für Ihre Situation</p>
        <h2 className="usecase-sticky-heading">
          Maßgeschneiderte Working Capital Lösungen<br />für jede Unternehmenssituation
        </h2>

        {/* Scrolling card track */}
        <div ref={trackWrapRef} className="usecase-scroll-track-wrap">
          <motion.div className="usecase-scroll-track" style={{ x: translateX }}>
            {useCases.map((uc, i) => {
              const Icon = uc.icon;
              const isActive = i === activeIndex;

              if (uc.cta) {
                return (
                  <div
                    key={i}
                    className={`usecase-card usecase-card-cta${isActive ? " usecase-card-active" : " usecase-card-side"}`}
                  >
                    <p className="usecase-cta-label">Ihre Situation ist dabei.</p>
                    <h3 className="usecase-cta-heading">Jetzt die passende Finanzierung finden.</h3>
                    <a href="/plattform" className="btn btn-md btn-primary usecase-cta-btn">
                      Jetzt vergleichen
                    </a>
                  </div>
                );
              }

              return (
                <div
                  key={i}
                  className={`usecase-card${isActive ? " usecase-card-active" : " usecase-card-side"}`}
                >
                  {uc.image ? (
                    <div className="usecase-card-image">
                      <Image src={uc.image} alt={uc.title} fill className="usecase-card-img" />
                    </div>
                  ) : (
                    <div className="usecase-icon-box">
                      <Icon className="h-5 w-5 text-turquoise" />
                    </div>
                  )}
                  <div className="usecase-text">
                    <h3 className="usecase-title">{uc.title}</h3>
                    <p className="usecase-body">{uc.body}</p>
                  </div>
                </div>
              );
            })}
          </motion.div>
        </div>

        {/* Dot navigation */}
        <div className="usecase-dots">
          {useCases.map((_, i) => (
            <button
              key={i}
              onClick={() => goToSlide(i)}
              className={`usecase-dot${i === activeIndex ? " usecase-dot-active" : ""}`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>

        {/* Scroll progress bar */}
        <div className="usecase-progress-track">
          <motion.div className="usecase-progress-bar" style={{ width: progressBarWidth }} />
        </div>
      </div>
    </div>
  );
}
