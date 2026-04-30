import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import JsonLd, { breadcrumbSchema } from "@/components/JsonLd";
import ArticleBody from "@/components/ArticleBody";
import ArticleCTA from "@/components/ArticleCTA";
import { getArticleBySlug, listPublishedArticles } from "@/lib/articles-public";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://liqinow.de";

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  const articles = await listPublishedArticles();
  if (articles.length === 0) return [{ slug: "__placeholder__" }];
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const a = await getArticleBySlug(slug);
  if (!a) return { title: "Artikel nicht gefunden" };
  return {
    title: a.meta_title || a.title,
    description: a.meta_description || a.excerpt,
    alternates: { canonical: `/ratgeber/${a.slug}` },
    openGraph: {
      title: a.meta_title || a.title,
      description: a.meta_description || a.excerpt,
      url: `/ratgeber/${a.slug}`,
      type: "article",
      publishedTime: a.published_at,
      modifiedTime: a.updated_at,
      images: a.image ? [{ url: a.image, alt: a.image_alt || a.title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: a.meta_title || a.title,
      description: a.meta_description || a.excerpt,
      images: a.image ? [a.image] : undefined,
    },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.meta_description || article.excerpt,
    image: article.image || undefined,
    datePublished: article.published_at,
    dateModified: article.updated_at,
    author: { "@type": "Organization", name: "LiqiNow", url: SITE_URL },
    publisher: { "@type": "Organization", name: "LiqiNow", url: SITE_URL, logo: { "@type": "ImageObject", url: `${SITE_URL}/favicon.svg` } },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}/ratgeber/${article.slug}` },
    keywords: (article.keywords || []).join(", "),
    articleSection: article.category_name,
  };

  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Start", url: "/" },
            { name: "Wissen", url: "/ratgeber" },
            { name: article.category_name, url: `/ratgeber/kategorie/${article.category_slug}` },
            { name: article.title, url: `/ratgeber/${article.slug}` },
          ]),
          articleSchema,
        ]}
      />
      <Navigation />
      <main className="pt-32 pb-20 min-h-screen">
        <article className="container mx-auto px-4 max-w-3xl">
          <nav aria-label="Breadcrumb" className="text-sm text-subtle mb-6">
            <Link href="/ratgeber" className="hover:text-dark">Wissen</Link>
            <span className="mx-2">/</span>
            <Link href={`/ratgeber/kategorie/${article.category_slug}`} className="hover:text-dark">
              {article.category_name}
            </Link>
          </nav>

          <h1 className="text-4xl md:text-5xl font-bold text-dark mb-4">{article.title}</h1>
          {article.excerpt && (
            <p className="text-lg text-subtle mb-8 leading-relaxed">{article.excerpt}</p>
          )}

          <ArticleBody
            html={article.content}
            bodyImages={article.body_images || []}
            articleSlug={article.slug}
          />

          <aside className="mt-12 p-6 rounded-2xl bg-[#ECF1F7]/30 border border-[#ECF1F7]/60 text-sm text-subtle">
            <strong className="text-dark">Hinweis:</strong> LiqiNow ist Tippgeber und arbeitet mit
            Finanzierungspartnern zusammen. Wir leiten Ihre Anfrage an passende Anbieter weiter.
            Konditionen sind marktabhängig und individuell. Dieser Beitrag ersetzt keine
            individuelle Finanzierungs-, Rechts- oder Steuerberatung.
          </aside>

          <div className="mt-8 flex justify-center">
            <ArticleCTA articleSlug={article.slug} position="article_footer" variant="compact" />
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
