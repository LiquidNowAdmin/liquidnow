"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import ArticleEditor from "../components/ArticleEditor";
import { getArticle, type AdminArticle } from "@/lib/articles-admin";

function EditArticleInner() {
  const params = useSearchParams();
  const slug = params.get("slug") || "";
  const [article, setArticle] = useState<AdminArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) { setError("Kein Slug angegeben"); setLoading(false); return; }
    getArticle(slug)
      .then((a) => {
        if (!a) setError("Artikel nicht gefunden");
        else setArticle(a);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Fehler"))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="p-12 flex items-center justify-center text-subtle"><Loader2 className="w-5 h-5 animate-spin mr-2" /> Lade…</div>;
  if (error) return <div className="p-6"><div className="p-4 rounded-lg bg-red-50 text-red-700">{error}</div></div>;
  if (!article) return null;

  return <ArticleEditor isNew={false} initial={article} />;
}

export default function EditArticlePage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-subtle">Lade…</div>}>
      <EditArticleInner />
    </Suspense>
  );
}
