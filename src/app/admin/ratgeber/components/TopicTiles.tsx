"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Plus, Loader2, Check, Trash2, Pencil, X, Wand2 } from "lucide-react";
import {
  type AdminTopic, type TopicInput,
  bulkInsertTopics, suggestTopics, upsertTopic, deleteTopic,
} from "@/lib/articles-admin";

type Props = {
  topics: AdminTopic[];
  existingArticleTitles: Array<{ title: string; category?: string }>;
  onChange: () => void;
};

const PRIORITY_COLORS: Record<string, string> = {
  high:   "bg-emerald-50 text-emerald-700 border-emerald-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low:    "bg-gray-50 text-gray-600 border-gray-200",
};
const INTENT_LABELS: Record<string, string> = {
  informational: "info",
  commercial:    "commercial",
  transactional: "transact",
};

function slugify(s: string): string {
  return (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

export default function TopicTiles({ topics, existingArticleTitles, onChange }: Props) {
  const router = useRouter();
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [editTopic, setEditTopic] = useState<AdminTopic | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const openGenerator = (topic: AdminTopic) => {
    const params = new URLSearchParams({
      topic_id: topic.id,
      prefill_topic: topic.label,
      prefill_focus_kw: topic.label,
      prefill_notes: topic.notes || "",
    });
    router.push(`/admin/ratgeber/neu?${params.toString()}`);
  };

  const removeTopic = async (t: AdminTopic) => {
    if (!confirm(`Topic "${t.label}" löschen? (Artikel bleiben, verlieren aber den Topic-Bezug.)`)) return;
    try { await deleteTopic(t.id); onChange(); }
    catch (err) { alert(err instanceof Error ? err.message : "Fehler"); }
  };

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-semibold text-dark uppercase tracking-wide">Topics</h2>
          <p className="text-xs text-subtle">Sortiert nach Priorität · Klick öffnet Generator mit vorbefülltem Thema</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowAddForm(true)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm inline-flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Topic
          </button>
          <button onClick={() => setSuggestOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-dark text-white hover:bg-dark/90 text-sm inline-flex items-center gap-1.5">
            <Wand2 className="w-3.5 h-3.5" /> KI-Vorschläge
          </button>
        </div>
      </div>

      {topics.length === 0 ? (
        <div className="p-6 rounded-xl border border-dashed border-gray-200 text-center text-sm text-subtle">
          Noch keine Topics. Lass dir mit „KI-Vorschläge" eine Liste generieren oder leg manuell eines an.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {topics.map((t) => {
            const done = t.article_count >= t.target_count;
            return (
              <div key={t.id}
                   className={`group relative rounded-xl border p-4 transition-all cursor-pointer ${
                     done
                       ? "bg-emerald-50/40 border-emerald-200 opacity-70"
                       : "bg-white border-gray-200 hover:border-[#507AA6] hover:shadow-md"
                   }`}
                   onClick={() => openGenerator(t)}>
                <div className="flex items-start justify-between mb-2 gap-2">
                  <div className="font-semibold text-dark text-sm leading-tight">{t.label}</div>
                  {done && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border uppercase tracking-wide ${PRIORITY_COLORS[t.priority]}`}>
                    {t.priority}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded border border-gray-200 text-subtle uppercase">
                    {INTENT_LABELS[t.intent]}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-subtle">
                  <span>{t.search_volume ? `${t.search_volume.toLocaleString("de-DE")}/M` : "—"}</span>
                  <span className="font-medium">{t.article_count}/{t.target_count}</span>
                </div>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex gap-0.5 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); setEditTopic(t); }}
                          className="p-1 rounded bg-white shadow-sm hover:bg-gray-100" title="Bearbeiten">
                    <Pencil className="w-3 h-3 text-subtle" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); removeTopic(t); }}
                          className="p-1 rounded bg-white shadow-sm hover:bg-red-50" title="Löschen">
                    <Trash2 className="w-3 h-3 text-red-500" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {suggestOpen && (
        <SuggestModal existingTopics={topics}
                      existingArticles={existingArticleTitles}
                      onClose={() => setSuggestOpen(false)}
                      onAccepted={() => { setSuggestOpen(false); onChange(); }} />
      )}

      {(showAddForm || editTopic) && (
        <TopicEditModal initial={editTopic || undefined}
                        onClose={() => { setShowAddForm(false); setEditTopic(null); }}
                        onSaved={() => { setShowAddForm(false); setEditTopic(null); onChange(); }} />
      )}
    </section>
  );
}

// ---------- Suggest Modal ----------
function SuggestModal({ existingTopics, existingArticles, onClose, onAccepted }: {
  existingTopics: AdminTopic[];
  existingArticles: Array<{ title: string; category?: string }>;
  onClose: () => void;
  onAccepted: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<TopicInput[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const list = await suggestTopics({
        existing_topics: existingTopics.map((t) => ({ slug: t.slug, label: t.label })),
        existing_articles: existingArticles,
      });
      setSuggestions(list);
      setSelected(new Set(list.map((_, i) => i)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler");
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const toggle = (i: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  };

  const accept = async () => {
    const chosen = Array.from(selected).map((i) => suggestions[i]).filter(Boolean);
    if (chosen.length === 0) return;
    setSaving(true);
    try {
      await bulkInsertTopics(chosen);
      onAccepted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Speichern fehlgeschlagen");
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#507AA6]" />
            <h3 className="font-semibold text-dark">KI-Topic-Vorschläge</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading && <div className="flex items-center gap-2 text-subtle"><Loader2 className="w-4 h-4 animate-spin" /> Generiere Vorschläge…</div>}
          {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm mb-3">{error}</div>}
          {!loading && suggestions.length > 0 && (
            <ul className="space-y-2">
              {suggestions.map((s, i) => (
                <li key={i}>
                  <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selected.has(i) ? "border-[#507AA6] bg-[#ECF1F7]/20" : "border-gray-200 hover:bg-gray-50"
                  }`}>
                    <input type="checkbox" checked={selected.has(i)} onChange={() => toggle(i)}
                           className="mt-1 w-4 h-4 accent-[#507AA6]" />
                    <div className="flex-1">
                      <div className="font-medium text-dark text-sm">{s.label}</div>
                      {s.notes && <div className="text-xs text-subtle mt-0.5">{s.notes}</div>}
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border uppercase ${PRIORITY_COLORS[s.priority || "medium"]}`}>
                          {s.priority}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded border border-gray-200 text-subtle uppercase">
                          {s.intent}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded border border-gray-200 text-subtle">
                          ~{s.search_volume ? `${s.search_volume.toLocaleString("de-DE")}/M` : "?"}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded border border-gray-200 text-subtle">
                          target {s.target_count}
                        </span>
                      </div>
                    </div>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between">
          <button onClick={load} disabled={loading || saving}
                  className="text-sm text-subtle hover:text-dark disabled:opacity-50">
            🔄 Neue Vorschläge
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-3 py-1.5 text-sm text-subtle hover:text-dark">Abbrechen</button>
            <button onClick={accept} disabled={selected.size === 0 || saving || loading}
                    className="px-4 py-1.5 rounded-lg bg-[#507AA6] hover:bg-[#243650] text-white text-sm font-semibold inline-flex items-center gap-1.5 disabled:opacity-50">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              {selected.size} übernehmen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Topic Edit Modal ----------
function TopicEditModal({ initial, onClose, onSaved }: {
  initial?: AdminTopic;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [t, setT] = useState<TopicInput>({
    id: initial?.id,
    slug: initial?.slug ?? "",
    label: initial?.label ?? "",
    notes: initial?.notes ?? "",
    search_volume: initial?.search_volume ?? null,
    priority: initial?.priority ?? "medium",
    intent: initial?.intent ?? "informational",
    target_count: initial?.target_count ?? 5,
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const save = async () => {
    if (!t.label.trim()) { setErr("Label fehlt"); return; }
    setBusy(true); setErr(null);
    try {
      await upsertTopic({ ...t, slug: t.slug.trim() || slugify(t.label) });
      onSaved();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Fehler");
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-dark">{initial ? "Topic bearbeiten" : "Neues Topic"}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          {err && <div className="p-2 rounded bg-red-50 text-red-700 text-sm">{err}</div>}
          <div>
            <label className="text-xs uppercase tracking-wide text-subtle font-semibold">Label *</label>
            <input value={t.label} onChange={(e) => setT({ ...t, label: e.target.value })}
                   className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-subtle font-semibold">Slug</label>
            <input value={t.slug} onChange={(e) => setT({ ...t, slug: slugify(e.target.value) })}
                   placeholder={slugify(t.label)}
                   className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 font-mono text-sm" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-subtle font-semibold">Notes</label>
            <textarea value={t.notes ?? ""} onChange={(e) => setT({ ...t, notes: e.target.value })} rows={2}
                      placeholder="Was soll der Pillar-Artikel abdecken?"
                      className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 text-sm" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs uppercase tracking-wide text-subtle font-semibold">Priorität</label>
              <select value={t.priority} onChange={(e) => setT({ ...t, priority: e.target.value as never })}
                      className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 text-sm">
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-subtle font-semibold">Intent</label>
              <select value={t.intent} onChange={(e) => setT({ ...t, intent: e.target.value as never })}
                      className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 text-sm">
                <option value="informational">Info</option>
                <option value="commercial">Commercial</option>
                <option value="transactional">Transact.</option>
              </select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-subtle font-semibold">Target</label>
              <input type="number" min={1} max={20}
                     value={t.target_count ?? 5}
                     onChange={(e) => setT({ ...t, target_count: parseInt(e.target.value) || 5 })}
                     className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-subtle font-semibold">Suchvolumen / Monat</label>
            <input type="number" value={t.search_volume ?? ""} onChange={(e) => setT({ ...t, search_volume: e.target.value ? parseInt(e.target.value) : null })}
                   placeholder="z. B. 4400 (Google Keyword Planner)"
                   className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 text-sm" />
          </div>
        </div>
        <div className="px-6 py-3 border-t border-gray-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 text-sm text-subtle hover:text-dark">Abbrechen</button>
          <button onClick={save} disabled={busy}
                  className="px-4 py-1.5 rounded-lg bg-[#507AA6] hover:bg-[#243650] text-white text-sm font-semibold disabled:opacity-50 inline-flex items-center gap-1.5">
            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Speichern
          </button>
        </div>
      </div>
    </div>
  );
}
