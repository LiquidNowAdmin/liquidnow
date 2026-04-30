import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import JsonLd, { breadcrumbSchema } from "@/components/JsonLd";
import { listPublishedArticles, listCategoriesWithArticles } from "@/lib/articles-public";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://liqinow.de";

export const metadata: Metadata = {
  title: "Working Capital Wissen für KMU",
  description:
    "Verständliche Ratgeber zu Betriebsmittelkredit, Einkaufsfinanzierung, Factoring und Working Capital für mittelständische Unternehmen. Aktuelle Artikel im LiqiNow Wissen.",
  keywords: [
    "Betriebsmittelkredit",
    "Einkaufsfinanzierung",
    "Factoring",
    "Working Capital",
    "KMU Finanzierung",
    "Mittelstand Liquidität",
    "Revenue-Based Finance",
  ],
  alternates: { canonical: "/ratgeber" },
  openGraph: {
    title: "Working Capital Wissen für KMU – LiqiNow",
    description:
      "Ratgeber zu Betriebsmittelkredit, Einkaufsfinanzierung, Factoring und Liquiditätsmanagement.",
    url: "/ratgeber",
    type: "website",
  },
};

export default async function RatgeberIndexPage() {
  const [articles, categories] = await Promise.all([
    listPublishedArticles(),
    listCategoriesWithArticles(),
  ]);

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${SITE_URL}/ratgeber/#collection`,
    url: `${SITE_URL}/ratgeber/`,
    name: "Working Capital Wissen für KMU",
    description:
      "Ratgeber zu Betriebsmittelkredit, Einkaufsfinanzierung, Factoring und Working Capital für mittelständische Unternehmen.",
    inLanguage: "de-DE",
    isPartOf: { "@id": `${SITE_URL}/#website` },
    about: { "@id": `${SITE_URL}/#organization` },
  };

  const itemListSchema =
    articles.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          itemListElement: articles.slice(0, 20).map((a, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: `${SITE_URL}/ratgeber/${a.slug}/`,
            name: a.title,
          })),
        }
      : null;

  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Start", url: "/" },
            { name: "Wissen", url: "/ratgeber" },
          ]),
          collectionSchema,
          ...(itemListSchema ? [itemListSchema] : []),
        ]}
      />
      <Navigation />
      <main className="pt-32 pb-20 min-h-screen">
        <div className="container mx-auto px-4 max-w-5xl">
          <nav aria-label="Breadcrumb" className="text-sm text-subtle mb-6 flex items-center">
            <Link href="/" className="hover:text-dark">Start</Link>
            <ChevronRight className="w-3.5 h-3.5 mx-1.5 text-subtle/60" aria-hidden="true" />
            <span aria-current="page">Wissen</span>
          </nav>

          <header className="mb-12 max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold text-dark mb-4">
              Working Capital Wissen für den Mittelstand
            </h1>
            <p className="text-lg text-subtle leading-relaxed">
              Beiträge zu <strong className="text-dark">Betriebsmittelkrediten</strong>,{" "}
              <strong className="text-dark">Einkaufsfinanzierung</strong>,{" "}
              <strong className="text-dark">Factoring</strong> und{" "}
              <strong className="text-dark">Liquiditätsmanagement</strong> — geschrieben für
              KMU und mittelständische Unternehmer, die ihre Finanzierungsentscheidungen
              fundiert treffen wollen.
            </p>
            <p className="text-sm text-subtle mt-4">
              LiqiNow ist Tippgeber und arbeitet mit ausgewählten Finanzierungspartnern zusammen.
              Unsere Inhalte sind redaktionell und ersetzen keine individuelle Finanzberatung.
            </p>
          </header>

          {categories.length > 0 && (
            <section className="mb-14" aria-labelledby="topics-heading">
              <h2 id="topics-heading" className="text-xl font-semibold text-dark mb-4">
                Themen
              </h2>
              <ul className="flex flex-wrap gap-2 list-none p-0">
                {categories.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/ratgeber/kategorie/${c.slug}/`}
                      className="inline-block px-4 py-2 rounded-full bg-[#ECF1F7]/40 hover:bg-[#ECF1F7] text-sm text-dark transition-colors"
                    >
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="articles-heading">
            <h2 id="articles-heading" className="text-xl font-semibold text-dark mb-6">
              Aktuelle Artikel
            </h2>
            {articles.length === 0 ? (
              <p className="text-subtle">
                Bald gibt es hier die ersten Artikel. Schauen Sie in Kürze wieder vorbei.
              </p>
            ) : (
              <ul className="grid gap-6 md:grid-cols-2 list-none p-0">
                {articles.map((a) => (
                  <li key={a.id}>
                    <article>
                      <Link
                        href={`/ratgeber/${a.slug}/`}
                        className="block bg-white rounded-2xl overflow-hidden hover:shadow-lg transition-shadow border border-[#ECF1F7]/40 group"
                      >
                        {a.image && (
                          <div className="aspect-video bg-[#ECF1F7]/30 overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={a.image}
                              alt={a.image_alt || a.title}
                              loading="lazy"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          </div>
                        )}
                        <div className="p-6">
                          {a.category_name && (
                            <div className="text-xs uppercase tracking-wide text-[#507AA6] font-semibold mb-2">
                              {a.category_name}
                            </div>
                          )}
                          <h3 className="text-lg font-semibold text-dark mb-2 leading-snug">
                            {a.title}
                          </h3>
                          <p className="text-sm text-subtle line-clamp-3">{a.excerpt}</p>
                          <time
                            dateTime={a.published_at}
                            className="block text-xs text-subtle mt-3"
                          >
                            {new Date(a.published_at).toLocaleDateString("de-DE", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </time>
                        </div>
                      </Link>
                    </article>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
