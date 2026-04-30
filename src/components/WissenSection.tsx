import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { listPublishedArticles, type PublicArticle } from "@/lib/articles-public";

/**
 * Server component — pulls the 4 most recent published articles.
 * Renders them as a teaser section between use-cases and FAQ.
 *
 * SEO:
 * - Internal links to /ratgeber + /ratgeber/[slug] strengthen Topic Cluster
 * - h2 contains the primary cluster keyword ("Working Capital Wissen")
 * - Each card has descriptive anchor text (article title)
 * - Article preview content (excerpt) is crawlable HTML, not behind JS
 */
export default async function WissenSection() {
  let articles: PublicArticle[] = [];
  try {
    articles = (await listPublishedArticles()).slice(0, 4);
  } catch {
    return null;
  }
  if (articles.length === 0) return null;

  return (
    <section id="wissen" className="section bg-[#ECF1F7]/20" aria-labelledby="wissen-heading">
      <div className="section-container">
        <header className="section-header text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#ECF1F7] text-xs font-semibold text-[#507AA6] uppercase tracking-wide mb-4">
            <BookOpen className="w-3.5 h-3.5" />
            Wissen
          </div>
          <h2 id="wissen-heading" className="text-3xl md:text-4xl font-bold text-dark mb-4">
            Working Capital Wissen für den Mittelstand
          </h2>
          <p className="text-base text-subtle leading-relaxed">
            Verständliche Beiträge zu Betriebsmittelkredit, Einkaufsfinanzierung,
            Factoring und Liquiditätsmanagement — geschrieben für Unternehmer,
            die fundiert entscheiden wollen.
          </p>
        </header>

        <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-4 list-none p-0">
          {articles.map((a) => (
            <li key={a.id}>
              <Link
                href={`/ratgeber/${a.slug}/`}
                className="group flex flex-col h-full bg-white rounded-2xl overflow-hidden border border-[#ECF1F7]/60 hover:border-[#507AA6] hover:shadow-lg transition-all"
              >
                {a.image && (
                  <div className="relative aspect-video bg-[#ECF1F7]/30 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={a.image}
                      alt={a.image_alt || a.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                )}
                <div className="flex flex-col flex-1 p-5">
                  {a.category_name && (
                    <div className="text-[10px] uppercase tracking-wide text-[#507AA6] font-semibold mb-2">
                      {a.category_name}
                    </div>
                  )}
                  <h3 className="font-semibold text-dark text-base leading-snug mb-2 group-hover:text-[#507AA6] transition-colors">
                    {a.title}
                  </h3>
                  <p className="text-sm text-subtle line-clamp-3 flex-1">{a.excerpt}</p>
                  <span className="inline-flex items-center gap-1 mt-4 text-sm font-medium text-[#507AA6]">
                    Weiterlesen
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        <div className="text-center mt-10">
          <Link
            href="/ratgeber/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-[#507AA6] text-[#507AA6] hover:bg-[#507AA6] hover:text-white font-semibold transition-colors"
          >
            Alle Beiträge ansehen
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
