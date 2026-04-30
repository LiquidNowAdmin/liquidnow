"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, RefreshCw, ExternalLink, Eye, EyeOff, Trash2 } from "lucide-react";
import {
  listArticles,
  listArticleStats,
  listCategories,
  listTopics,
  publishArticle,
  unpublishArticle,
  deleteArticle,
  type AdminArticleListItem,
  type AdminCategory,
  type AdminTopic,
  type ArticleStats,
} from "@/lib/articles-admin";
import TopicTiles from "./components/TopicTiles";
import { Eye as ViewIcon, MousePointerClick } from "lucide-react";

export default function RatgeberAdminPage() {
  const [articles, setArticles] = useState<AdminArticleListItem[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [topics, setTopics] = useState<AdminTopic[]>([]);
  const [stats, setStats] = useState<ArticleStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [a, c, t, s] = await Promise.all([
        listArticles(), listCategories(), listTopics(), listArticleStats().catch(() => []),
      ]);
      setArticles(a);
      setCategories(c);
      setTopics(t);
      setStats(s);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Laden");
    } finally {
      setLoading(false);
    }
  };

  const statBySlug = (slug: string) => stats.find((s) => s.slug === slug) ?? { views: 0, cta_clicks: 0 };

  useEffect(() => { load(); }, []);

  const catName = (id: string | null) => categories.find((c) => c.id === id)?.name ?? "—";

  const togglePublish = async (a: AdminArticleListItem) => {
    try {
      if (a.published_at) await unpublishArticle(a.slug);
      else await publishArticle(a.slug);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Fehler");
    }
  };

  const remove = async (a: AdminArticleListItem) => {
    if (!confirm(`Artikel "${a.title}" wirklich löschen?`)) return;
    try {
      await deleteArticle(a.slug);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Fehler");
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dark">Ratgeber</h1>
          <p className="text-sm text-subtle">{loading ? "Lade…" : `${articles.length} Artikel · ${categories.length} Kategorien`}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50" disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <Link href="/admin/ratgeber/kategorien" className="px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm">
            Kategorien
          </Link>
          <Link href="/admin/ratgeber/neu" className="px-4 py-2 rounded-lg bg-[#9BAA28] hover:bg-[#C4D42B] text-white text-sm font-semibold inline-flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Neuer Artikel
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-3 mb-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
      )}

      <TopicTiles
        topics={topics}
        existingArticleTitles={articles.map((a) => ({
          title: a.title,
          category: categories.find((c) => c.id === a.category_id)?.name,
        }))}
        onChange={load}
      />

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-subtle">
            <tr>
              <th className="text-left px-4 py-3">Titel</th>
              <th className="text-left px-4 py-3">Kategorie</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Views</th>
              <th className="text-right px-4 py-3">CTA-Klicks</th>
              <th className="text-left px-4 py-3">Aktualisiert</th>
              <th className="text-right px-4 py-3">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {articles.map((a) => (
              <tr key={a.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link href={`/admin/ratgeber/edit?slug=${encodeURIComponent(a.slug)}`} className="font-medium text-dark hover:underline">
                    {a.title}
                  </Link>
                  <div className="text-xs text-subtle">/{a.slug}</div>
                </td>
                <td className="px-4 py-3 text-subtle">{catName(a.category_id)}</td>
                <td className="px-4 py-3">
                  {a.published_at ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                      <Eye className="w-3 h-3" /> Live
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
                      <EyeOff className="w-3 h-3" /> Draft
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="inline-flex items-center gap-1 text-sm text-dark">
                    <ViewIcon className="w-3.5 h-3.5 text-subtle" />
                    {statBySlug(a.slug).views.toLocaleString("de-DE")}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="inline-flex items-center gap-1 text-sm text-dark">
                    <MousePointerClick className="w-3.5 h-3.5 text-subtle" />
                    {statBySlug(a.slug).cta_clicks.toLocaleString("de-DE")}
                  </span>
                </td>
                <td className="px-4 py-3 text-subtle text-xs">
                  {new Date(a.updated_at).toLocaleDateString("de-DE")}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-1">
                    {a.published_at && (
                      <a href={`/ratgeber/${a.slug}`} target="_blank" rel="noopener noreferrer"
                         className="p-1.5 rounded hover:bg-gray-100" title="Live ansehen">
                        <ExternalLink className="w-4 h-4 text-subtle" />
                      </a>
                    )}
                    <button onClick={() => togglePublish(a)}
                            className="p-1.5 rounded hover:bg-gray-100"
                            title={a.published_at ? "Unpublish" : "Publish"}>
                      {a.published_at ? <EyeOff className="w-4 h-4 text-subtle" /> : <Eye className="w-4 h-4 text-subtle" />}
                    </button>
                    <button onClick={() => remove(a)}
                            className="p-1.5 rounded hover:bg-red-50"
                            title="Löschen">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && articles.length === 0 && (
              <tr><td colSpan={7} className="text-center py-12 text-subtle">Noch keine Artikel. Klick auf „Neuer Artikel".</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
