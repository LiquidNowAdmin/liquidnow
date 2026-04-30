"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Save, Sparkles, Send, Eye, EyeOff, Trash2, Loader2, Plus, RefreshCw, ArrowLeft,
  Code2,
} from "lucide-react";
import Link from "next/link";
import {
  upsertArticle, publishArticle, unpublishArticle, deleteArticle,
  listCategories, upsertCategory, streamArticleGeneration,
  type AdminArticle, type AdminCategory, type AlternativesField,
} from "@/lib/articles-admin";
import AlternativesModal from "./AlternativesModal";
import ArticleBody from "@/components/ArticleBody";

const EMPTY: AdminArticle = {
  slug: "", title: "", excerpt: "", content: "",
  metaTitle: "", metaDescription: "", image: "", imageAlt: "",
  focus_keyword: "", keywords: [], body_images: [], category_id: null,
};

function slugify(s: string): string {
  return (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

function countWords(html: string): number {
  return String(html).replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
}

type Props = {
  initial?: AdminArticle;
  isNew: boolean;
  prefillTopic?: string;
  prefillFocusKw?: string;
  prefillTopicId?: string | null;
  prefillNotes?: string;
};

export default function ArticleEditor({ initial, isNew, prefillTopic, prefillFocusKw, prefillTopicId, prefillNotes }: Props) {
  const router = useRouter();
  const [article, setArticle] = useState<AdminArticle>(() => {
    if (initial) return initial;
    return { ...EMPTY, topic_id: prefillTopicId ?? null };
  });
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [topic, setTopic] = useState(prefillTopic || "");
  const [focusKw, setFocusKw] = useState(prefillFocusKw || "");
  const [generating, setGenerating] = useState(false);
  const [genStatus, setGenStatus] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [altsField, setAltsField] = useState<AlternativesField | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [pendingCategorySuggestion, setPendingCategorySuggestion] = useState<{ slug: string; name: string; description?: string } | null>(null);
  const [contentView, setContentView] = useState<"edit" | "preview">("edit");

  const wordCount = useMemo(() => countWords(article.content || ""), [article.content]);

  useEffect(() => {
    listCategories().then(setCategories).catch((e) => setError(String(e)));
  }, []);

  const update = <K extends keyof AdminArticle>(key: K, value: AdminArticle[K]) => {
    setArticle((p) => ({ ...p, [key]: value }));
  };

  const handleGenerate = async () => {
    if (!topic.trim()) { setError("Bitte ein Thema angeben."); return; }
    setGenerating(true); setError(null); setGenStatus("Verbinde…");
    try {
      await streamArticleGeneration({
        topic: topic.trim(),
        focus_keyword: focusKw.trim() || undefined,
        existing_categories: categories.map((c) => ({ slug: c.slug, name: c.name })),
        onText: () => setGenStatus("Schreibt…"),
        onResult: (a) => {
          setArticle((prev) => ({
            slug: a.slug || slugify(a.title),
            title: a.title || "",
            excerpt: a.excerpt || "",
            content: a.content || "",
            metaTitle: a.metaTitle || "",
            metaDescription: a.metaDescription || "",
            image: a.image || "",
            imageAlt: a.imageAlt || "",
            focus_keyword: a.focus_keyword || "",
            keywords: Array.isArray(a.keywords) ? a.keywords : [],
            body_images: Array.isArray(a.body_images) ? a.body_images.slice(0, 3) : [],
            category_id: prev.category_id,
            topic_id: prev.topic_id ?? prefillTopicId ?? null,
          }));
          // Apply category suggestion
          const sug = a.category_suggestion;
          if (sug?.is_new && sug.name) {
            setPendingCategorySuggestion({ slug: sug.slug, name: sug.name, description: sug.description });
          } else if (sug?.slug) {
            const existing = categories.find((c) => c.slug === sug.slug);
            if (existing) setArticle((p) => ({ ...p, category_id: existing.id }));
          }
          setGenStatus("Fertig.");
        },
        onError: (msg) => setError(msg),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Generieren");
    } finally {
      setGenerating(false);
    }
  };

  const handleAcceptCategorySuggestion = async () => {
    if (!pendingCategorySuggestion) return;
    try {
      const cat = await upsertCategory({
        slug: pendingCategorySuggestion.slug,
        name: pendingCategorySuggestion.name,
        description: pendingCategorySuggestion.description,
      });
      setCategories((prev) => [...prev.filter((c) => c.id !== cat.id), cat]);
      update("category_id", cat.id);
      setPendingCategorySuggestion(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Konnte Kategorie nicht anlegen");
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const cat = await upsertCategory({ slug: slugify(newCategoryName), name: newCategoryName.trim() });
      setCategories((prev) => [...prev.filter((c) => c.id !== cat.id), cat]);
      update("category_id", cat.id);
      setNewCategoryName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler");
    }
  };

  const handleSave = async () => {
    if (!article.slug) update("slug", slugify(article.title));
    if (!article.title || !article.content || !article.category_id) {
      setError("Title, Inhalt und Kategorie sind Pflicht."); return;
    }
    setBusy(true); setError(null);
    try {
      const saved = await upsertArticle({ ...article, slug: article.slug || slugify(article.title) });
      setArticle(saved);
      if (isNew) router.replace(`/admin/ratgeber/edit?slug=${encodeURIComponent(saved.slug)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Speichern fehlgeschlagen");
    } finally { setBusy(false); }
  };

  const handlePublish = async () => {
    setBusy(true); setError(null);
    try {
      // Save first
      if (!article.title || !article.content || !article.category_id) {
        throw new Error("Title, Inhalt und Kategorie sind Pflicht.");
      }
      const saved = await upsertArticle({ ...article, slug: article.slug || slugify(article.title) });
      const published = await publishArticle(saved.slug);
      setArticle(published);
      if (isNew) router.replace(`/admin/ratgeber/edit?slug=${encodeURIComponent(published.slug)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Veröffentlichen fehlgeschlagen");
    } finally { setBusy(false); }
  };

  const handleUnpublish = async () => {
    setBusy(true);
    try { setArticle(await unpublishArticle(article.slug)); }
    catch (err) { setError(err instanceof Error ? err.message : "Fehler"); }
    finally { setBusy(false); }
  };

  const handleDelete = async () => {
    if (!confirm(`Artikel "${article.title}" wirklich löschen?`)) return;
    try { await deleteArticle(article.slug); router.replace("/admin/ratgeber"); }
    catch (err) { setError(err instanceof Error ? err.message : "Fehler"); }
  };

  const onAltPick = (value: string | string[]) => {
    if (!altsField) return;
    const map: Record<AlternativesField, keyof AdminArticle> = {
      title: "title", metaTitle: "metaTitle", metaDescription: "metaDescription",
      excerpt: "excerpt", slug: "slug", imageAlt: "imageAlt",
      focusKeyword: "focus_keyword", keywords: "keywords", image: "image",
    };
    const key = map[altsField];
    if (Array.isArray(value)) update(key, value as never);
    else update(key, value as never);
  };

  const FieldRow = ({ label, field, children }: { label: string; field: AlternativesField; children: React.ReactNode }) => (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs uppercase tracking-wide text-subtle font-semibold">{label}</label>
        <button type="button" onClick={() => setAltsField(field)}
                className="text-xs text-[#507AA6] hover:text-[#243650] inline-flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> Alternativen
        </button>
      </div>
      {children}
    </div>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Link href="/admin/ratgeber" className="text-sm text-subtle hover:text-dark inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Zurück zur Liste
        </Link>
        <div className="flex gap-2">
          <button onClick={handleSave} disabled={busy}
                  className="px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm inline-flex items-center gap-1.5 disabled:opacity-50">
            <Save className="w-4 h-4" /> Speichern
          </button>
          {article.published_at ? (
            <button onClick={handleUnpublish} disabled={busy}
                    className="px-4 py-2 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 text-sm inline-flex items-center gap-1.5">
              <EyeOff className="w-4 h-4" /> Unpublish
            </button>
          ) : (
            <button onClick={handlePublish} disabled={busy}
                    className="px-4 py-2 rounded-lg bg-[#507AA6] hover:bg-[#243650] text-white text-sm inline-flex items-center gap-1.5">
              <Send className="w-4 h-4" /> Veröffentlichen
            </button>
          )}
          {!isNew && (
            <button onClick={handleDelete} className="px-3 py-2 rounded-lg border border-red-200 hover:bg-red-50 text-red-600">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {error && <div className="p-3 mb-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>}

      {isNew && (
        <section className="mb-8 p-6 bg-[#ECF1F7]/20 rounded-2xl border border-[#ECF1F7]/60">
          <h2 className="text-lg font-semibold text-dark mb-2 inline-flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#507AA6]" /> Mit KI generieren
          </h2>
          <p className="text-sm text-subtle mb-4">Sonnet 4.6 schreibt einen vollständigen Ratgeber-Artikel zum Thema. Du kannst ihn anschließend bearbeiten.</p>
          <div className="grid gap-3 md:grid-cols-2">
            <input value={topic} onChange={(e) => setTopic(e.target.value)} disabled={generating}
                   placeholder="Thema (z. B. Betriebsmittelkredit für Handwerker)"
                   className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#507AA6]" />
            <input value={focusKw} onChange={(e) => setFocusKw(e.target.value)} disabled={generating}
                   placeholder="Focus Keyword (optional)"
                   className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#507AA6]" />
          </div>
          {prefillNotes && (
            <div className="mt-3 p-3 rounded-lg bg-white/60 border border-[#ECF1F7] text-xs text-subtle">
              <strong className="text-dark">Topic-Hinweis:</strong> {prefillNotes}
            </div>
          )}
          <div className="mt-4 flex items-center gap-3">
            <button onClick={handleGenerate} disabled={generating || !topic.trim()}
                    className="px-5 py-2.5 rounded-lg bg-dark text-white text-sm font-semibold hover:bg-dark/90 disabled:opacity-50 inline-flex items-center gap-2">
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {generating ? genStatus || "Generiert…" : "Artikel generieren"}
            </button>
            {generating && <span className="text-sm text-subtle">Das dauert ~30-60 Sekunden.</span>}
          </div>
        </section>
      )}

      {pendingCategorySuggestion && (
        <div className="mb-6 p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-blue-900">KI-Vorschlag: neue Kategorie „{pendingCategorySuggestion.name}"</div>
            {pendingCategorySuggestion.description && <div className="text-xs text-blue-700">{pendingCategorySuggestion.description}</div>}
          </div>
          <div className="flex gap-2">
            <button onClick={handleAcceptCategorySuggestion} className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm">Anlegen</button>
            <button onClick={() => setPendingCategorySuggestion(null)} className="px-3 py-1.5 rounded-lg text-blue-700 text-sm">Ablehnen</button>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-5">
          <FieldRow label="Title" field="title">
            <input value={article.title} onChange={(e) => update("title", e.target.value)}
                   className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-lg font-semibold" />
          </FieldRow>

          <FieldRow label="Slug" field="slug">
            <input value={article.slug} onChange={(e) => update("slug", slugify(e.target.value))}
                   className="w-full px-4 py-2 rounded-lg border border-gray-200 font-mono text-sm" />
          </FieldRow>

          <FieldRow label="Excerpt" field="excerpt">
            <textarea value={article.excerpt} onChange={(e) => update("excerpt", e.target.value)} rows={2}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 text-sm" />
          </FieldRow>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs uppercase tracking-wide text-subtle font-semibold">Inhalt</label>
              <div className="flex items-center gap-3">
                <span className="text-xs text-subtle">{wordCount} Wörter</span>
                <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-50">
                  <button type="button" onClick={() => setContentView("edit")}
                          className={`px-2.5 py-1 rounded text-xs inline-flex items-center gap-1 transition-colors ${
                            contentView === "edit" ? "bg-white text-dark shadow-sm" : "text-subtle hover:text-dark"
                          }`}>
                    <Code2 className="w-3 h-3" /> HTML
                  </button>
                  <button type="button" onClick={() => setContentView("preview")}
                          className={`px-2.5 py-1 rounded text-xs inline-flex items-center gap-1 transition-colors ${
                            contentView === "preview" ? "bg-white text-dark shadow-sm" : "text-subtle hover:text-dark"
                          }`}>
                    <Eye className="w-3 h-3" /> Vorschau
                  </button>
                </div>
              </div>
            </div>
            {contentView === "edit" ? (
              <textarea value={article.content} onChange={(e) => update("content", e.target.value)} rows={20}
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 font-mono text-xs" />
            ) : (
              <div className="rounded-lg border border-gray-200 bg-white">
                <div className="px-6 py-3 border-b border-gray-100 bg-gray-50/50 text-xs text-subtle">
                  So sieht der Artikel später aus (ohne Header/Footer/CTAs).
                </div>
                <div className="px-8 py-6 max-h-175 overflow-y-auto">
                  {article.title && <h1 className="text-3xl font-bold text-dark mb-3">{article.title}</h1>}
                  {article.excerpt && <p className="text-base text-subtle mb-6 leading-relaxed">{article.excerpt}</p>}
                  {article.content ? (
                    <ArticleBody
                      html={article.content}
                      bodyImages={article.body_images || []}
                      articleSlug={article.slug || "preview"}
                      preview
                    />
                  ) : (
                    <p className="text-subtle italic">Noch kein Inhalt.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wide text-subtle font-semibold">Kategorie *</label>
            <select value={article.category_id ?? ""}
                    onChange={(e) => update("category_id", e.target.value || null)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200">
              <option value="">— wählen —</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <div className="flex gap-1.5">
              <input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)}
                     placeholder="Neue Kategorie…"
                     className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm" />
              <button onClick={handleAddCategory} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <FieldRow label="Focus Keyword" field="focusKeyword">
            <input value={article.focus_keyword} onChange={(e) => update("focus_keyword", e.target.value)}
                   className="w-full px-4 py-2 rounded-lg border border-gray-200 text-sm" />
          </FieldRow>

          <FieldRow label="Keywords" field="keywords">
            <input value={(article.keywords || []).join(", ")}
                   onChange={(e) => update("keywords", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
                   className="w-full px-4 py-2 rounded-lg border border-gray-200 text-sm"
                   placeholder="kw1, kw2, kw3" />
          </FieldRow>

          <FieldRow label="Meta Title" field="metaTitle">
            <input value={article.metaTitle} onChange={(e) => update("metaTitle", e.target.value)}
                   className="w-full px-4 py-2 rounded-lg border border-gray-200 text-sm" />
            <div className="text-xs text-subtle">{article.metaTitle.length}/60</div>
          </FieldRow>

          <FieldRow label="Meta Description" field="metaDescription">
            <textarea value={article.metaDescription} onChange={(e) => update("metaDescription", e.target.value)} rows={3}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 text-sm" />
            <div className="text-xs text-subtle">{article.metaDescription.length}/155</div>
          </FieldRow>

          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wide text-subtle font-semibold">Google-Snippet-Vorschau</label>
            <div className="p-4 rounded-lg border border-gray-200 bg-white">
              <div className="text-xs text-[#202124] truncate">
                liqinow.de › ratgeber › {article.slug || "..."}
              </div>
              <div className="text-[#1a0dab] text-base mt-0.5 leading-snug truncate hover:underline cursor-default">
                {article.metaTitle || article.title || "Title fehlt"}
              </div>
              <div className="text-[#4d5156] text-sm mt-1 line-clamp-2">
                {article.metaDescription || article.excerpt || "Description fehlt"}
              </div>
            </div>
          </div>

          <FieldRow label="Image URL" field="image">
            <input value={article.image} onChange={(e) => update("image", e.target.value)}
                   className="w-full px-4 py-2 rounded-lg border border-gray-200 text-sm" />
          </FieldRow>

          <FieldRow label="Image Alt" field="imageAlt">
            <input value={article.imageAlt} onChange={(e) => update("imageAlt", e.target.value)}
                   className="w-full px-4 py-2 rounded-lg border border-gray-200 text-sm" />
          </FieldRow>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs uppercase tracking-wide text-subtle font-semibold">Body-Bilder (3)</label>
              <span className="text-xs text-subtle">
                Platzhalter: <code className="px-1 bg-gray-100 rounded">[[IMG_1]]</code>
                <code className="px-1 ml-1 bg-gray-100 rounded">[[IMG_2]]</code>
                <code className="px-1 ml-1 bg-gray-100 rounded">[[IMG_3]]</code>
              </span>
            </div>
            {[0, 1, 2].map((idx) => {
              const img = (article.body_images || [])[idx] || { url: "", alt: "", caption: "" };
              const setImg = (next: { url?: string; alt?: string; caption?: string }) => {
                const list = [...(article.body_images || [])];
                while (list.length <= idx) list.push({ url: "", alt: "" });
                list[idx] = { ...list[idx], ...next };
                update("body_images", list);
              };
              return (
                <div key={idx} className="p-3 rounded-lg border border-gray-200 space-y-1.5 bg-gray-50/40">
                  <div className="text-[10px] uppercase tracking-wide text-subtle font-semibold">[[IMG_{idx + 1}]]</div>
                  <input value={img.url} onChange={(e) => setImg({ url: e.target.value })}
                         placeholder="https://images.pexels.com/..."
                         className="w-full px-3 py-1.5 rounded border border-gray-200 text-xs font-mono bg-white" />
                  <input value={img.alt} onChange={(e) => setImg({ alt: e.target.value })}
                         placeholder="Alt-Text"
                         className="w-full px-3 py-1.5 rounded border border-gray-200 text-xs bg-white" />
                  <input value={img.caption || ""} onChange={(e) => setImg({ caption: e.target.value })}
                         placeholder="Bildunterschrift (optional)"
                         className="w-full px-3 py-1.5 rounded border border-gray-200 text-xs bg-white" />
                  {img.url && (
                    <img src={img.url} alt={img.alt}
                         className="w-full h-24 object-cover rounded mt-1"
                         onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  )}
                </div>
              );
            })}
          </div>

          {!isNew && (
            <button onClick={handleGenerate} disabled={generating || !topic.trim()}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm inline-flex items-center justify-center gap-1.5">
              <RefreshCw className="w-4 h-4" /> Artikel komplett neu generieren
            </button>
          )}
        </aside>
      </div>

      <AlternativesModal field={altsField} article={article}
                         onClose={() => setAltsField(null)} onPick={onAltPick} />
    </div>
  );
}
