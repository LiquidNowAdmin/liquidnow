"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Sparkles, Loader2, Mail, FileText, ArrowRight } from "lucide-react";
import EmailEditor from "../components/EmailEditor";
import { streamEmailGeneration, type EmailTemplate } from "@/lib/email-templates-admin";

type Step = "type" | "intent" | "generating" | "edit";

export default function NewEmailPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("type");
  const [type, setType] = useState<"newsletter" | "transactional">("transactional");
  const [audience, setAudience] = useState("");
  const [intent, setIntent] = useState("");
  const [ctaLabel, setCtaLabel] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [genStatus, setGenStatus] = useState("");
  const [generated, setGenerated] = useState<EmailTemplate | null>(null);

  const generate = async () => {
    if (!intent.trim()) { setError("Bitte beschreibe was die E-Mail tun soll."); return; }
    setError(null); setStep("generating"); setGenStatus("Verbinde…");
    try {
      await streamEmailGeneration({
        type, audience, intent, cta_label: ctaLabel, cta_url: ctaUrl,
        onText: () => setGenStatus("Schreibt…"),
        onResult: (g) => {
          setGenerated({
            slug: g.slug,
            name: g.name,
            type,
            subject: g.subject,
            preheader: g.preheader,
            blocks: g.blocks,
            cta_label: ctaLabel || null,
            cta_url: ctaUrl || null,
            variables_used: g.variables_used,
            attachments: [],
            intent,
            published: false,
          });
          setStep("edit");
        },
        onError: (msg) => { setError(msg); setStep("intent"); },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Generieren");
      setStep("intent");
    }
  };

  if (step === "edit" && generated) {
    return <EmailEditor isNew initial={generated} />;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Link href="/admin/emails" className="text-sm text-subtle hover:text-dark inline-flex items-center gap-1 mb-6">
        <ArrowLeft className="w-4 h-4" /> Zurück
      </Link>
      <h1 className="text-2xl font-bold text-dark mb-6">Neue E-Mail erstellen</h1>

      {error && <div className="p-3 mb-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>}

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        {step === "type" && (
          <>
            <h2 className="font-semibold text-dark mb-4">1. Welche Art E-Mail?</h2>
            <div className="grid md:grid-cols-2 gap-3 mb-4">
              <button onClick={() => setType("transactional")}
                      className={`p-4 rounded-xl border-2 text-left transition-colors ${
                        type === "transactional" ? "border-turquoise bg-turquoise-light/30" : "border-gray-200 hover:border-gray-300"
                      }`}>
                <FileText className="w-5 h-5 text-turquoise mb-2" />
                <div className="font-semibold text-dark">Transaktional</div>
                <div className="text-xs text-subtle mt-1">Z. B. Bestätigungen, Status-Updates, Onboarding. 1:1, ausgelöst durch Aktion.</div>
              </button>
              <button onClick={() => setType("newsletter")}
                      className={`p-4 rounded-xl border-2 text-left transition-colors ${
                        type === "newsletter" ? "border-turquoise bg-turquoise-light/30" : "border-gray-200 hover:border-gray-300"
                      }`}>
                <Mail className="w-5 h-5 text-turquoise mb-2" />
                <div className="font-semibold text-dark">Newsletter</div>
                <div className="text-xs text-subtle mt-1">Marketing/Information an viele. Mit Pflicht-Abmelde-Link.</div>
              </button>
            </div>
            <div className="mb-4">
              <label className="text-xs uppercase tracking-wide text-subtle font-semibold">Zielgruppe (optional)</label>
              <input value={audience} onChange={(e) => setAudience(e.target.value)}
                     placeholder="z. B. Bestandskunden mit aktiver Anfrage"
                     className="w-full mt-1 px-3 py-2 rounded border border-gray-200" />
            </div>
            <div className="flex justify-end">
              <button onClick={() => setStep("intent")}
                      className="px-5 py-2 rounded-lg bg-turquoise hover:bg-turquoise-dark text-white text-sm font-semibold inline-flex items-center gap-1.5">
                Weiter <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}

        {step === "intent" && (
          <>
            <h2 className="font-semibold text-dark mb-4">2. Was soll die E-Mail bewirken?</h2>
            <p className="text-sm text-subtle mb-3">Beschreibe in eigenen Worten — die KI baut daraus das Template.</p>
            <textarea value={intent} onChange={(e) => setIntent(e.target.value)} rows={6}
                      placeholder='z. B. "Eine Onboarding-Mail die nach der Registrierung verschickt wird. Soll begrüßen, kurz erklären was als nächstes passiert (Profildaten ausfüllen, Anfrage stellen) und Vertrauen schaffen."'
                      className="w-full px-3 py-2 rounded border border-gray-200 mb-4" />
            <div className="grid md:grid-cols-2 gap-3 mb-5">
              <div>
                <label className="text-xs uppercase tracking-wide text-subtle font-semibold">CTA-Label (optional)</label>
                <input value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)}
                       placeholder="z. B. Plattform öffnen"
                       className="w-full mt-1 px-3 py-2 rounded border border-gray-200" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-subtle font-semibold">CTA-URL (optional)</label>
                <input value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)}
                       placeholder="https://liqinow.de/plattform"
                       className="w-full mt-1 px-3 py-2 rounded border border-gray-200 font-mono text-sm" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <button onClick={() => setStep("type")} className="text-sm text-subtle hover:text-dark">Zurück</button>
              <button onClick={generate} disabled={!intent.trim()}
                      className="px-5 py-2 rounded-lg bg-dark hover:bg-dark/90 text-white text-sm font-semibold inline-flex items-center gap-1.5 disabled:opacity-50">
                <Sparkles className="w-4 h-4" /> Generieren
              </button>
            </div>
          </>
        )}

        {step === "generating" && (
          <div className="py-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-turquoise mx-auto mb-3" />
            <p className="text-sm text-dark font-medium">{genStatus || "Generiere…"}</p>
            <p className="text-xs text-subtle mt-1">Das dauert ~20-40 Sekunden.</p>
          </div>
        )}
      </div>
    </div>
  );
}
