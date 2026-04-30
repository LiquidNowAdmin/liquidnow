"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useTracking } from "@/lib/tracking";

type Props = {
  variant?: "default" | "compact";
  /** Optional context that gets attached to the tracking event */
  articleSlug?: string;
  position?: "mid_article" | "article_footer" | "article_header";
};

/**
 * Single source of truth for in-article CTAs.
 * - Copy + visual identical across all articles.
 * - Click is tracked centrally via useTracking() → marketing-track Edge Function.
 * - To change copy/destination/styling, change ONLY this component.
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
      <Link href="/plattform" onClick={handleClick}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#9BAA28] hover:bg-[#C4D42B] text-white font-semibold transition-colors">
        Jetzt Finanzierungsangebote vergleichen
        <ArrowRight className="w-4 h-4" />
      </Link>
    );
  }

  return (
    <aside className="my-10 not-prose">
      <div className="rounded-2xl bg-gradient-to-br from-[#9BAA28] to-[#C4D42B] p-6 md:p-8 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-lg md:text-xl font-bold mb-1">In 3 Minuten zum passenden Angebot</h3>
            <p className="text-sm md:text-base text-white/90">
              Vergleichen Sie kostenlos Betriebsmittelkredite, Einkaufsfinanzierung und Factoring –
              für KMU mit Köpfchen.
            </p>
          </div>
          <Link href="/plattform" onClick={handleClick}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white hover:bg-white/95 text-[#3D3F52] font-semibold whitespace-nowrap transition-colors shrink-0">
            Jetzt vergleichen
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
