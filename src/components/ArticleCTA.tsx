"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useTracking } from "@/lib/tracking";
import FunnelWidget from "@/components/FunnelWidget";

type Props = {
  variant?: "default" | "compact";
  /** Optional context that gets attached to the tracking event */
  articleSlug?: string;
  position?: "mid_article" | "article_footer" | "article_header";
};

/**
 * Single source of truth for in-article CTAs.
 * - `default` (mid-article): renders the FunnelWidget so users can start the
 *   funnel without leaving the article. Click on the widget's "Vergleichen"
 *   CTA fires cta_click via our tracking provider.
 * - `compact` (footer): simple button with tracked click.
 *
 * To change copy/destination/styling, edit ONLY this component.
 */
export default function ArticleCTA({ variant = "default", articleSlug, position = "mid_article" }: Props) {
  const { trackEvent } = useTracking();

  const handleClick = () => {
    trackEvent("cta_click", {
      cta_id: "article_cta_compare_offers_v1",
      article_slug: articleSlug,
      position,
      destination: "/plattform",
    });
  };

  if (variant === "compact") {
    return (
      <Link
        href="/plattform"
        onClick={handleClick}
        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-turquoise hover:bg-turquoise-dark text-white font-semibold transition-colors"
      >
        Jetzt Finanzierungsoptionen vergleichen
        <ArrowRight className="w-4 h-4" />
      </Link>
    );
  }

  // Default: mid-article funnel widget — fires the same tracking event when
  // the user submits the funnel from inside the article.
  return (
    <aside
      className="my-12 not-prose"
      onClickCapture={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest('a[href="/plattform"], a[href^="/plattform"], button[type="submit"]')) {
          handleClick();
        }
      }}
    >
      <div className="rounded-3xl bg-turquoise-light p-5 md:p-6 overflow-hidden">
        <div className="grid md:grid-cols-[1fr_22rem] gap-5 md:gap-6 items-stretch">
          {/* Left column: lady fills column, text overlays lower portion with soft fade */}
          <div className="relative flex flex-col justify-end overflow-hidden rounded-2xl min-h-96 md:min-h-96">
            <div
              className="absolute inset-0 flex justify-center pointer-events-none select-none"
              aria-hidden="true"
            >
              <img
                src="/frau.png"
                alt=""
                className="h-full w-auto object-contain object-bottom"
                style={{
                  maskImage: "linear-gradient(to bottom, black 45%, transparent 95%)",
                  WebkitMaskImage: "linear-gradient(to bottom, black 45%, transparent 95%)",
                }}
              />
            </div>
            <div className="relative z-10 text-left px-2 pb-1">
              <span className="inline-block text-xs font-semibold uppercase tracking-wide text-turquoise mb-2">
                Direkt loslegen
              </span>
              <h3
                className="font-heading font-bold tracking-tight leading-tight text-dark text-4xl md:text-6xl mb-4"
                style={{
                  textShadow:
                    "0 0 30px rgba(224, 234, 243, 0.9), 0 0 60px rgba(224, 234, 243, 0.7), 0 0 100px rgba(224, 234, 243, 0.5)",
                }}
              >
                In 3 Minuten zum <span className="text-turquoise">passenden Angebot</span>
              </h3>
              <p className="text-sub">
                Vergleichen Sie kostenlos Finanzierungsoptionen – schnell,
                transparent und ohne SCHUFA-Auswirkung.
              </p>
            </div>
          </div>

          <FunnelWidget />
        </div>
      </div>
    </aside>
  );
}
