"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Save, Send, EyeOff, Trash2, Loader2, ArrowLeft, Mail as MailIcon,
} from "lucide-react";
import Link from "next/link";
import {
  upsertEmailTemplate, publishEmailTemplate, unpublishEmailTemplate,
  deleteEmailTemplate, sendTestEmail,
  type EmailTemplate,
} from "@/lib/email-templates-admin";
import BlockEditor from "./BlockEditor";
import EmailPreview from "./EmailPreview";
import AttachmentPicker from "./AttachmentPicker";
import AIAssistantPanel from "./AIAssistantPanel";
import { Sparkles } from "lucide-react";

function slugify(s: string): string {
  return (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

type Props = {
  initial: EmailTemplate;
  isNew: boolean;
};

export default function EmailEditor({ initial, isNew }: Props) {
  const router = useRouter();
  const [t, setT] = useState<EmailTemplate>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testEmail, setTestEmail] = useState("");
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [aiOpen, setAiOpen] = useState(false);

  const update = <K extends keyof EmailTemplate>(k: K, v: EmailTemplate[K]) => {
    setT((prev) => ({ ...prev, [k]: v }));
  };

  const validate = (): string | null => {
    if (!t.name.trim()) return "Name ist Pflicht.";
    if (!t.subject.trim()) return "Betreff ist Pflicht.";
    if (!t.blocks.length) return "Mindestens ein Inhalts-Block ist erforderlich.";
    return null;
  };

  const handleSave = async () => {
    const err = validate(); if (err) { setError(err); return; }
    setBusy(true); setError(null);
    try {
      const slug = t.slug || slugify(t.name);
      const saved = await upsertEmailTemplate({ ...t, slug });
      setT(saved);
      if (isNew) router.replace(`/admin/emails/edit?slug=${encodeURIComponent(saved.slug)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Speichern fehlgeschlagen");
    } finally { setBusy(false); }
  };

  const handlePublishToggle = async () => {
    setBusy(true); setError(null);
    try {
      const slug = t.slug || slugify(t.name);
      const saved = await upsertEmailTemplate({ ...t, slug });
      const next = saved.published
        ? await unpublishEmailTemplate(saved.slug)
        : await publishEmailTemplate(saved.slug);
      setT(next);
      if (isNew) router.replace(`/admin/emails/edit?slug=${encodeURIComponent(next.slug)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler");
    } finally { setBusy(false); }
  };

  const handleDelete = async () => {
    if (!confirm(`Template "${t.name}" wirklich löschen?`)) return;
    try { await deleteEmailTemplate(t.slug); router.replace("/admin/emails"); }
    catch (err) { setError(err instanceof Error ? err.message : "Fehler"); }
  };

  const handleTestSend = async () => {
    setError(null); setTestStatus(null);
    if (isNew) {
      setError("Bitte zuerst speichern, dann Test-Mail versenden.");
      return;
    }
    setBusy(true);
    try {
      const r = await sendTestEmail({ template_slug: t.slug, recipient_email: testEmail || undefined });
      setTestStatus(`Gesendet an ${r.sent_to}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Versand fehlgeschlagen");
    } finally { setBusy(false); }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Link href="/admin/emails" className="text-sm text-subtle hover:text-dark inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Zurück
        </Link>
        <div className="flex gap-2">
          <button onClick={() => setAiOpen(!aiOpen)} disabled={busy}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-1.5 transition-colors ${
                    aiOpen ? "bg-turquoise text-white" : "border border-turquoise text-turquoise hover:bg-turquoise-light/40"
                  }`}>
            <Sparkles className="w-4 h-4" /> KI-Assistent
          </button>
          <button onClick={handleSave} disabled={busy}
                  className="px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm inline-flex items-center gap-1.5 disabled:opacity-50">
            <Save className="w-4 h-4" /> Speichern
          </button>
          <button onClick={handlePublishToggle} disabled={busy}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-1.5 ${
                    t.published
                      ? "border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700"
                      : "bg-turquoise hover:bg-turquoise-dark text-white"
                  }`}>
            {t.published ? <><EyeOff className="w-4 h-4" /> Auf Entwurf setzen</> : <><Send className="w-4 h-4" /> Bereit-stellen</>}
          </button>
          {!isNew && (
            <button onClick={handleDelete} className="px-3 py-2 rounded-lg border border-red-200 hover:bg-red-50 text-red-600">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {error && <div className="p-3 mb-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>}
      {testStatus && <div className="p-3 mb-4 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700">{testStatus}</div>}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* LEFT: Form + Editor */}
        <div className="space-y-5">
          <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
            <div>
              <label className="text-xs uppercase tracking-wide text-subtle font-semibold">Name (intern)</label>
              <input value={t.name} onChange={(e) => update("name", e.target.value)}
                     className="w-full mt-1 px-3 py-2 rounded border border-gray-200" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs uppercase tracking-wide text-subtle font-semibold">Slug</label>
                <input value={t.slug} onChange={(e) => update("slug", slugify(e.target.value))}
                       placeholder={slugify(t.name)}
                       className="w-full mt-1 px-3 py-2 rounded border border-gray-200 font-mono text-sm" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-subtle font-semibold">Typ</label>
                <select value={t.type} onChange={(e) => update("type", e.target.value as EmailTemplate["type"])}
                        className="w-full mt-1 px-3 py-2 rounded border border-gray-200">
                  <option value="newsletter">Newsletter</option>
                  <option value="transactional">Transaktional</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-subtle font-semibold">Betreff</label>
              <input value={t.subject} onChange={(e) => update("subject", e.target.value)}
                     placeholder="z. B. Willkommen bei {{tenant.name}}, {{recipient.first_name}}!"
                     className="w-full mt-1 px-3 py-2 rounded border border-gray-200" />
              <div className="text-xs text-subtle mt-1">{t.subject.length}/75 Zeichen · Variablen mit {`{{key}}`} möglich</div>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-subtle font-semibold">Preheader</label>
              <input value={t.preheader} onChange={(e) => update("preheader", e.target.value)}
                     placeholder="Inbox-Vorschautext (40-90 Zeichen)"
                     className="w-full mt-1 px-3 py-2 rounded border border-gray-200" />
              <div className="text-xs text-subtle mt-1">{t.preheader.length}/90 Zeichen</div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <h3 className="text-xs uppercase tracking-wide text-subtle font-semibold mb-3">Inhalt</h3>
            <BlockEditor blocks={t.blocks} onChange={(blocks) => update("blocks", blocks)} />
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <AttachmentPicker
              attachments={t.attachments}
              onChange={(attachments) => update("attachments", attachments)}
            />
          </div>

          {!isNew && (
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <h3 className="text-xs uppercase tracking-wide text-subtle font-semibold mb-3 inline-flex items-center gap-1">
                <MailIcon className="w-3.5 h-3.5" /> Test-Mail senden
              </h3>
              <div className="flex gap-2">
                <input value={testEmail} onChange={(e) => setTestEmail(e.target.value)}
                       placeholder="leer = an dich selbst"
                       className="flex-1 px-3 py-2 rounded border border-gray-200 text-sm" />
                <button onClick={handleTestSend} disabled={busy}
                        className="px-4 py-2 rounded-lg bg-dark text-white text-sm hover:bg-dark/90 disabled:opacity-50 inline-flex items-center gap-1.5">
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Senden
                </button>
              </div>
              <p className="text-xs text-subtle mt-2">
                BCC immer auf <code className="bg-gray-100 px-1 rounded">platformmails@liqinow.de</code> für Archiv.
                Variablen werden mit deinen Operator-Daten aufgelöst.
              </p>
            </div>
          )}
        </div>

        {/* RIGHT: Preview */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <EmailPreview blocks={t.blocks} type={t.type} preheader={t.preheader} />
        </div>
      </div>

      {aiOpen && (
        <AIAssistantPanel
          template={t}
          onApply={(result) => {
            setT((prev) => ({
              ...prev,
              subject: result.subject ?? prev.subject,
              preheader: result.preheader ?? prev.preheader,
              blocks: Array.isArray(result.blocks) ? result.blocks : prev.blocks,
              variables_used: result.variables_used ?? prev.variables_used,
            }));
          }}
          onClose={() => setAiOpen(false)}
        />
      )}
    </div>
  );
}
