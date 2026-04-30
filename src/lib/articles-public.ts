// Public-side article fetching. Uses anon key + RLS — only published rows come back.
// Used at build-time by Server Components for static export.

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function client() {
  return createClient(SUPABASE_URL, SUPABASE_ANON, { auth: { persistSession: false } });
}

export type ArticleBodyImage = { url: string; alt: string; caption?: string };

export type PublicArticle = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  meta_title: string;
  meta_description: string;
  image: string;
  image_alt: string;
  focus_keyword: string;
  keywords: string[];
  body_images: ArticleBodyImage[];
  category_id: string;
  category_slug: string;
  category_name: string;
  published_at: string;
  updated_at: string;
};

export type PublicCategory = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
};

async function joinCategories(rows: any[]): Promise<PublicArticle[]> {
  if (!rows.length) return [];
  try {
    const ids = Array.from(new Set(rows.map((r) => r.category_id).filter(Boolean)));
    const { data: cats } = await client()
      .from("article_categories")
      .select("id, slug, name")
      .in("id", ids);
    const map = new Map((cats || []).map((c: any) => [c.id, c]));
    return rows.map((r) => ({
      ...r,
      category_slug: map.get(r.category_id)?.slug ?? "",
      category_name: map.get(r.category_id)?.name ?? "",
    }));
  } catch {
    return rows.map((r) => ({ ...r, category_slug: "", category_name: "" }));
  }
}

export async function listPublishedArticles(): Promise<PublicArticle[]> {
  try {
    const { data, error } = await client()
      .from("articles")
      .select("*")
      .not("published_at", "is", null)
      .order("published_at", { ascending: false });
    if (error) {
      // Table may not exist yet (migration not deployed) — fall back to empty list
      if (error.code === "PGRST205" || error.code === "42P01") return [];
      console.error("listPublishedArticles failed:", error);
      return [];
    }
    return joinCategories(data || []);
  } catch (err) {
    console.error("listPublishedArticles threw:", err);
    return [];
  }
}

export async function getArticleBySlug(slug: string): Promise<PublicArticle | null> {
  const { data, error } = await client()
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .not("published_at", "is", null)
    .maybeSingle();
  if (error || !data) return null;
  const [withCat] = await joinCategories([data]);
  return withCat;
}

export async function listCategoriesWithArticles(): Promise<PublicCategory[]> {
  try {
    const { data, error } = await client()
      .from("article_categories")
      .select("id, slug, name, description")
      .order("name", { ascending: true });
    if (error) return [];
    const articles = await listPublishedArticles();
    const usedIds = new Set(articles.map((a) => a.category_id));
    return (data || []).filter((c) => usedIds.has(c.id));
  } catch {
    return [];
  }
}

export async function listArticlesInCategory(categorySlug: string): Promise<PublicArticle[]> {
  const articles = await listPublishedArticles();
  return articles.filter((a) => a.category_slug === categorySlug);
}
