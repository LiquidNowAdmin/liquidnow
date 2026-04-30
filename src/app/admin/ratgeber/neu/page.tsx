"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ArticleEditor from "../components/ArticleEditor";

function NewArticleInner() {
  const params = useSearchParams();
  return (
    <ArticleEditor
      isNew
      prefillTopic={params.get("prefill_topic") || ""}
      prefillFocusKw={params.get("prefill_focus_kw") || ""}
      prefillTopicId={params.get("topic_id") || null}
      prefillNotes={params.get("prefill_notes") || ""}
    />
  );
}

export default function NewArticlePage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-subtle">Lade…</div>}>
      <NewArticleInner />
    </Suspense>
  );
}
