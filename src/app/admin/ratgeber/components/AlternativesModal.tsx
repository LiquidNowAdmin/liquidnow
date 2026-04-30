"use client";

import { useEffect, useState } from "react";
import { X, Loader2, Sparkles } from "lucide-react";
import { fetchAlternatives, type AlternativesField, type AdminArticle } from "@/lib/articles-admin";

type Props = {
  field: AlternativesField | null;
  article: Partial<AdminArticle>;
  onClose: () => void;
  onPick: (value: string | string[]) => void;
};

const FIELD_LABELS: Record<AlternativesField, string> = {
  title: "Title",
  metaTitle: "Meta Title",
  metaDescription: "Meta Description",
  excerpt: "Excerpt",
  slug: "Slug",
  imageAlt: "Image Alt",
  focusKeyword: "Focus Keyword",
  keywords: "Keywords (Set)",
  image: "Image URL",
};

export default function AlternativesModal({ field, article, onClose, onPick }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alts, setAlts] = useState<Array<string | string[]>>([]);

  const load = async (currentField: AlternativesField) => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchAlternatives(currentField, article);
      setAlts(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (field) load(field);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [field]);

  if (!field) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#507AA6]" />
            <h3 className="font-semibold text-dark">Alternativen für {FIELD_LABELS[field]}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex items-center gap-2 text-subtle">
              <Loader2 className="w-4 h-4 animate-spin" /> Generiere Varianten…
            </div>
          )}
          {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
          {!loading && !error && (
            <ul className="space-y-2">
              {alts.map((a, i) => (
                <li key={i}>
                  <button
                    onClick={() => { onPick(a); onClose(); }}
                    className="w-full text-left p-4 rounded-xl border border-gray-200 hover:border-[#507AA6] hover:bg-[#ECF1F7]/20 transition-colors"
                  >
                    {Array.isArray(a) ? (
                      <div className="flex flex-wrap gap-1.5">
                        {a.map((kw, j) => (
                          <span key={j} className="px-2 py-0.5 rounded-full bg-gray-100 text-xs text-dark">{kw}</span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-dark">{a}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="px-6 py-3 border-t border-gray-100 flex justify-between">
          <button onClick={() => field && load(field)} disabled={loading}
                  className="text-sm text-subtle hover:text-dark disabled:opacity-50">
            🔄 Neue Varianten generieren
          </button>
          <button onClick={onClose} className="text-sm text-subtle hover:text-dark">Abbrechen</button>
        </div>
      </div>
    </div>
  );
}
