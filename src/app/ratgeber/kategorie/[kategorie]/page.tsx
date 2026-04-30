import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import JsonLd, { breadcrumbSchema } from "@/components/JsonLd";
import { listCategoriesWithArticles, listArticlesInCategory } from "@/lib/articles-public";

export async function generateStaticParams(): Promise<Array<{ kategorie: string }>> {
  const cats = await listCategoriesWithArticles();
  if (cats.length === 0) return [{ kategorie: "__placeholder__" }];
  return cats.map((c) => ({ kategorie: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ kategorie: string }> }): Promise<Metadata> {
  const { kategorie } = await params;
  const cats = await listCategoriesWithArticles();
  const cat = cats.find((c) => c.slug === kategorie);
  if (!cat) return { title: "Kategorie nicht gefunden" };
  return {
    title: `${cat.name} – Wissen`,
    description: cat.description || `Artikel zum Thema ${cat.name} im LiqiNow Wissen.`,
    alternates: { canonical: `/ratgeber/kategorie/${cat.slug}` },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ kategorie: string }> }) {
  const { kategorie } = await params;
  const cats = await listCategoriesWithArticles();
  const cat = cats.find((c) => c.slug === kategorie);
  if (!cat) notFound();

  const articles = await listArticlesInCategory(kategorie);

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Start", url: "/" },
          { name: "Wissen", url: "/ratgeber" },
          { name: cat.name, url: `/ratgeber/kategorie/${cat.slug}` },
        ])}
      />
      <Navigation />
      <main className="pt-32 pb-20 min-h-screen">
        <div className="container mx-auto px-4 max-w-5xl">
          <nav aria-label="Breadcrumb" className="text-sm text-subtle mb-6">
            <Link href="/ratgeber" className="hover:text-dark">Wissen</Link>
            <span className="mx-2">/</span>
            <span>{cat.name}</span>
          </nav>

          <h1 className="text-4xl md:text-5xl font-bold text-dark mb-4">{cat.name}</h1>
          {cat.description && (
            <p className="text-lg text-subtle mb-12 max-w-2xl">{cat.description}</p>
          )}

          {articles.length === 0 ? (
            <p className="text-subtle">Bald gibt es hier die ersten Artikel.</p>
          ) : (
            <ul className="grid gap-6 md:grid-cols-2">
              {articles.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/ratgeber/${a.slug}`}
                    className="block bg-white rounded-2xl p-6 hover:shadow-lg transition-shadow border border-[#ECF1F7]/40"
                  >
                    <h2 className="text-lg font-semibold text-dark mb-2">{a.title}</h2>
                    <p className="text-sm text-subtle line-clamp-3">{a.excerpt}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
