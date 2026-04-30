"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import EmailEditor from "../components/EmailEditor";
import { getEmailTemplate, type EmailTemplate } from "@/lib/email-templates-admin";

function EditInner() {
  const params = useSearchParams();
  const slug = params.get("slug") || "";
  const [tpl, setTpl] = useState<EmailTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) { setError("Kein Slug angegeben"); setLoading(false); return; }
    getEmailTemplate(slug)
      .then((t) => { if (!t) setError("Template nicht gefunden"); else setTpl(t); })
      .catch((e) => setError(e instanceof Error ? e.message : "Fehler"))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="p-12 flex items-center justify-center text-subtle"><Loader2 className="w-5 h-5 animate-spin mr-2" /> Lade…</div>;
  if (error) return <div className="p-6"><div className="p-4 rounded-lg bg-red-50 text-red-700">{error}</div></div>;
  if (!tpl) return null;

  return <EmailEditor isNew={false} initial={tpl} />;
}

export default function EditEmailPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-subtle">Lade…</div>}>
      <EditInner />
    </Suspense>
  );
}
