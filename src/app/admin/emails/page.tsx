"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, RefreshCw, Eye, EyeOff, Trash2, Mail, FileText, FolderOpen } from "lucide-react";
import {
  listEmailTemplates,
  publishEmailTemplate,
  unpublishEmailTemplate,
  deleteEmailTemplate,
  type EmailTemplateListItem,
} from "@/lib/email-templates-admin";

export default function EmailsAdminPage() {
  const [items, setItems] = useState<EmailTemplateListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "newsletter" | "transactional">("all");

  const load = async () => {
    setLoading(true); setError(null);
    try { setItems(await listEmailTemplates()); }
    catch (err) { setError(err instanceof Error ? err.message : "Fehler beim Laden"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const togglePublish = async (t: EmailTemplateListItem) => {
    try {
      if (t.published) await unpublishEmailTemplate(t.slug);
      else await publishEmailTemplate(t.slug);
      load();
    } catch (err) { alert(err instanceof Error ? err.message : "Fehler"); }
  };

  const remove = async (t: EmailTemplateListItem) => {
    if (!confirm(`Template "${t.name}" wirklich löschen?`)) return;
    try { await deleteEmailTemplate(t.slug); load(); }
    catch (err) { alert(err instanceof Error ? err.message : "Fehler"); }
  };

  const filtered = items.filter((i) => filter === "all" || i.type === filter);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dark">E-Mail Templates</h1>
          <p className="text-sm text-subtle">{loading ? "Lade…" : `${items.length} Templates`}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50" disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <Link href="/admin/emails/routen" className="px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm inline-flex items-center gap-1.5">
            🔗 Routen
          </Link>
          <Link href="/admin/emails/bibliothek" className="px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm inline-flex items-center gap-1.5">
            <FolderOpen className="w-4 h-4" /> Anhang-Bibliothek
          </Link>
          <Link href="/admin/emails/neu" className="px-4 py-2 rounded-lg bg-turquoise hover:bg-turquoise-dark text-white text-sm font-semibold inline-flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Neue E-Mail
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        {(["all", "newsletter", "transactional"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              filter === f ? "bg-dark text-white" : "bg-white border border-gray-200 hover:bg-gray-50 text-subtle"
            }`}
          >
            {f === "all" ? "Alle" : f === "newsletter" ? "Newsletter" : "Transaktional"}
          </button>
        ))}
      </div>

      {error && <div className="p-3 mb-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>}

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-subtle">
            <tr>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Typ</th>
              <th className="text-left px-4 py-3">Betreff</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Aktualisiert</th>
              <th className="text-right px-4 py-3">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link href={`/admin/emails/edit?slug=${encodeURIComponent(t.slug)}`} className="font-medium text-dark hover:underline">{t.name}</Link>
                  <div className="text-xs text-subtle">/{t.slug}</div>
                </td>
                <td className="px-4 py-3 text-subtle">
                  <span className="inline-flex items-center gap-1 text-xs">
                    {t.type === "newsletter" ? <Mail className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                    {t.type === "newsletter" ? "Newsletter" : "Transaktional"}
                  </span>
                </td>
                <td className="px-4 py-3 text-subtle truncate max-w-[28rem]">{t.subject || <em>—</em>}</td>
                <td className="px-4 py-3">
                  {t.published ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                      <Eye className="w-3 h-3" /> Bereit
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
                      <EyeOff className="w-3 h-3" /> Entwurf
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-subtle text-xs">{new Date(t.updated_at).toLocaleDateString("de-DE")}</td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-1">
                    <button onClick={() => togglePublish(t)} className="p-1.5 rounded hover:bg-gray-100" title={t.published ? "Auf Entwurf setzen" : "Bereit-stellen"}>
                      {t.published ? <EyeOff className="w-4 h-4 text-subtle" /> : <Eye className="w-4 h-4 text-subtle" />}
                    </button>
                    <button onClick={() => remove(t)} className="p-1.5 rounded hover:bg-red-50" title="Löschen">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={6} className="text-center py-12 text-subtle">Noch keine E-Mail-Templates. Klick auf „Neue E-Mail".</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
