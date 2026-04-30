// Client-side wrapper for the articles-admin / articles-generate / articles-alternatives Edge Functions.
// Uses the user's JWT (operations role enforced server-side).

import { createClient } from "@/lib/supabase";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function authHeader(): Promise<HeadersInit> {
  const { data } = await createClient().auth.getSession();
  const token = data.session?.access_token;
  return {
    "content-type": "application/json",
    "apikey": ANON,
    ...(token ? { authorization: `Bearer ${token}` } : {}),
  };
}

async function callFn(name: string, body: unknown): Promise<any> {
  const headers = await authHeader();
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let detail = "";
    try { detail = (await res.json()).error || (await res.text()); } catch {}
    throw new Error(detail || `${name} failed (${res.status})`);
  }
  return res.json();
}

// ----- Articles -----
export type AdminArticleListItem = {
  id: string;
  slug: string;
  title: string;
  category_id: string | null;
  topic_id: string | null;
  published_at: string | null;
  updated_at: string;
  created_at: string;
};

export type BodyImage = {
  url: string;
  alt: string;
  caption?: string;
};

export type AdminArticle = {
  id?: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  image: string;
  imageAlt: string;
  focus_keyword: string;
  keywords: string[];
  body_images: BodyImage[];
  category_id: string | null;
  topic_id?: string | null;
  published_at?: string | null;
};

export async function listArticles(): Promise<AdminArticleListItem[]> {
  const r = await callFn("articles-admin", { resource: "article", action: "list" });
  return r.articles || [];
}

export type ArticleStats = { slug: string; views: number; cta_clicks: number };
export async function listArticleStats(): Promise<ArticleStats[]> {
  const r = await callFn("articles-admin", { resource: "article", action: "stats" });
  return r.stats || [];
}

export async function getArticle(slug: string): Promise<AdminArticle | null> {
  const r = await callFn("articles-admin", { resource: "article", action: "get", data: { slug } });
  return r.article ?? null;
}

export async function upsertArticle(data: AdminArticle): Promise<AdminArticle> {
  const r = await callFn("articles-admin", { resource: "article", action: "upsert", data });
  return r.article;
}

export async function publishArticle(slug: string): Promise<AdminArticle> {
  const r = await callFn("articles-admin", { resource: "article", action: "publish", data: { slug } });
  return r.article;
}

export async function unpublishArticle(slug: string): Promise<AdminArticle> {
  const r = await callFn("articles-admin", { resource: "article", action: "unpublish", data: { slug } });
  return r.article;
}

export async function deleteArticle(slug: string): Promise<void> {
  await callFn("articles-admin", { resource: "article", action: "delete", data: { slug } });
}

// ----- Categories -----
export type AdminCategory = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
};

export async function listCategories(): Promise<AdminCategory[]> {
  const r = await callFn("articles-admin", { resource: "category", action: "list" });
  return r.categories || [];
}

export async function upsertCategory(data: { slug: string; name: string; description?: string }): Promise<AdminCategory> {
  const r = await callFn("articles-admin", { resource: "category", action: "upsert", data });
  return r.category;
}

export async function deleteCategory(id: string): Promise<void> {
  await callFn("articles-admin", { resource: "category", action: "delete", data: { id } });
}

// ----- Topics -----
export type TopicPriority = "high" | "medium" | "low";
export type TopicIntent = "informational" | "commercial" | "transactional";

export type AdminTopic = {
  id: string;
  slug: string;
  label: string;
  notes: string | null;
  search_volume: number | null;
  priority: TopicPriority;
  intent: TopicIntent;
  target_count: number;
  article_count: number;
};

export type TopicInput = {
  id?: string;
  slug: string;
  label: string;
  notes?: string | null;
  search_volume?: number | null;
  priority?: TopicPriority;
  intent?: TopicIntent;
  target_count?: number;
};

export async function listTopics(): Promise<AdminTopic[]> {
  const r = await callFn("articles-admin", { resource: "topic", action: "list" });
  return r.topics || [];
}

export async function upsertTopic(data: TopicInput): Promise<AdminTopic> {
  const r = await callFn("articles-admin", { resource: "topic", action: "upsert", data });
  return r.topic;
}

export async function bulkInsertTopics(topics: TopicInput[]): Promise<AdminTopic[]> {
  const r = await callFn("articles-admin", { resource: "topic", action: "bulk_insert", data: { topics } });
  return r.topics || [];
}

export async function deleteTopic(id: string): Promise<void> {
  await callFn("articles-admin", { resource: "topic", action: "delete", data: { id } });
}

export async function suggestTopics(opts: {
  existing_topics: Array<{ slug: string; label: string }>;
  existing_articles: Array<{ title: string; category?: string }>;
}): Promise<TopicInput[]> {
  const r = await callFn("articles-topics-suggest", opts);
  return r.topics || [];
}

// ----- Alternatives -----
export type AlternativesField =
  | "title" | "metaTitle" | "metaDescription" | "excerpt"
  | "slug" | "imageAlt" | "focusKeyword" | "keywords" | "image";

export async function fetchAlternatives(
  field: AlternativesField,
  article: Partial<AdminArticle>
): Promise<Array<string | string[]>> {
  const r = await callFn("articles-alternatives", { field, article });
  return r.alternatives || [];
}

// ----- Generator (streaming) -----
export type GeneratorResult = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  image: string;
  imageAlt: string;
  focus_keyword: string;
  keywords: string[];
  body_images: BodyImage[];
  category_suggestion: {
    slug: string;
    name?: string;
    description?: string;
    is_new: boolean;
  };
};

export async function streamArticleGeneration(opts: {
  topic: string;
  focus_keyword?: string;
  existing_categories: Array<{ slug: string; name: string }>;
  onText?: (chunk: string) => void;
  onResult: (article: GeneratorResult) => void;
  onError: (msg: string) => void;
  signal?: AbortSignal;
}) {
  const headers = await authHeader();
  const res = await fetch(`${SUPABASE_URL}/functions/v1/articles-generate`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      topic: opts.topic,
      focus_keyword: opts.focus_keyword,
      existing_categories: opts.existing_categories,
    }),
    signal: opts.signal,
  });

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    opts.onError(text || `Generator failed (${res.status})`);
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let nl;
    while ((nl = buffer.indexOf("\n\n")) !== -1) {
      const ev = buffer.slice(0, nl);
      buffer = buffer.slice(nl + 2);

      let eventName = "message";
      let dataLines: string[] = [];
      for (const line of ev.split("\n")) {
        if (line.startsWith("event: ")) eventName = line.slice(7).trim();
        else if (line.startsWith("data: ")) dataLines.push(line.slice(6));
      }
      const data = dataLines.join("\n");
      if (!data) continue;

      try {
        const j = JSON.parse(data);
        if (eventName === "result" && j?.article) opts.onResult(j.article);
        else if (eventName === "error") opts.onError(j?.error || "Unbekannter Fehler");
        else if (j?.type === "content_block_delta" && j?.delta?.type === "input_json_delta") {
          if (opts.onText && typeof j.delta.partial_json === "string") opts.onText(j.delta.partial_json);
        }
      } catch { /* ignore non-JSON pings */ }
    }
  }
}
