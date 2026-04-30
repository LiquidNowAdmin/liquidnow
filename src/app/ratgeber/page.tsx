import type { Metadata } from "next";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import JsonLd, { breadcrumbSchema } from "@/components/JsonLd";
import { listPublishedArticles, listCategoriesWithArticles } from "@/lib/articles-public";

export const metadata: Metadata = {
  title: "Ratgeber – Working Capital für KMU",
  description:
    "Ratgeber rund um Betriebsmittelkredit, Einkaufsfinanzierung, Factoring und Working Capital für mittelständische Unternehmen.",
  alternates: { canonical: "/ratgeber" },
};

export default async function RatgeberIndexPage() {
  const [articles, categories] = await Promise.all([
    listPublishedArticles(),
    listCategoriesWithArticles(),
  ]);

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Start", url: "/" },
          { name: "Ratgeber", url: "/ratgeber" },
        ])}
      />
      <Navigation />
      <main className="pt-32 pb-20 min-h-screen">
        <div className="container mx-auto px-4 max-w-5xl">
          <h1 className="text-4xl md:text-5xl font-bold text-dark mb-4">Ratgeber</h1>
          <p className="text-lg text-subtle mb-12 max-w-2xl">
            Wissen rund um Working Capital, Betriebsmittelkredit, Einkaufsfinanzierung und Factoring –
            verständlich für Unternehmer.
          </p>

          {categories.length > 0 && (
            <section className="mb-12">
              <h2 className="text-xl font-semibold text-dark mb-4">Themen</h2>
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <Link
                    key={c.id}
                    href={`/ratgeber/kategorie/${c.slug}`}
                    className="px-4 py-2 rounded-full bg-[#EDE6DB]/40 hover:bg-[#EDE6DB] text-sm text-dark transition-colors"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="text-xl font-semibold text-dark mb-6">Aktuelle Artikel</h2>
            {articles.length === 0 ? (
              <p className="text-subtle">Bald gibt es hier die ersten Artikel.</p>
            ) : (
              <ul className="grid gap-6 md:grid-cols-2">
                {articles.map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`/ratgeber/${a.slug}`}
                      className="block bg-white rounded-2xl p-6 hover:shadow-lg transition-shadow border border-[#EDE6DB]/40"
                    >
                      {a.category_name && (
                        <div className="text-xs uppercase tracking-wide text-[#9BAA28] font-semibold mb-2">
                          {a.category_name}
                        </div>
                      )}
                      <h3 className="text-lg font-semibold text-dark mb-2">{a.title}</h3>
                      <p className="text-sm text-subtle line-clamp-3">{a.excerpt}</p>
                    </Link>
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
