"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Upload, Trash2, Loader2, Paperclip } from "lucide-react";
import {
  listLibraryAttachments, uploadLibraryAttachment, deleteLibraryAttachment,
  type LibraryAttachment,
} from "@/lib/email-templates-admin";

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function LibraryPage() {
  const [items, setItems] = useState<LibraryAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [description, setDescription] = useState("");

  const load = () => {
    setLoading(true);
    listLibraryAttachments().then(setItems).catch((e) => setError(String(e))).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setError(null);
    try {
      await uploadLibraryAttachment(file, description.trim() || undefined);
      setDescription("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload fehlgeschlagen");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const remove = async (a: LibraryAttachment) => {
    if (!confirm(`"${a.filename}" aus Bibliothek löschen?`)) return;
    try { await deleteLibraryAttachment(a.id); load(); }
    catch (err) { alert(err instanceof Error ? err.message : "Fehler"); }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Link href="/admin/emails" className="text-sm text-subtle hover:text-dark inline-flex items-center gap-1 mb-6">
        <ArrowLeft className="w-4 h-4" /> Zurück
      </Link>
      <h1 className="text-2xl font-bold text-dark mb-2">Anhang-Bibliothek</h1>
      <p className="text-sm text-subtle mb-6">Wiederverwendbare Files für E-Mail-Templates (z. B. AGB, Whitepaper, Datenblätter).</p>

      {error && <div className="p-3 mb-4 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}

      <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6 space-y-3">
        <h2 className="font-semibold text-dark">Neue Datei hochladen</h2>
        <input value={description} onChange={(e) => setDescription(e.target.value)}
               placeholder="Beschreibung (optional)"
               className="w-full px-3 py-2 rounded border border-gray-200 text-sm" />
        <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-dashed border-gray-300 hover:border-turquoise cursor-pointer bg-gray-50 text-sm text-subtle">
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {uploading ? "Lade hoch…" : "Datei wählen"}
          <input type="file" className="hidden" disabled={uploading} onChange={upload} />
        </label>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-subtle">
            <tr>
              <th className="text-left px-4 py-3">Datei</th>
              <th className="text-left px-4 py-3">Typ</th>
              <th className="text-right px-4 py-3">Größe</th>
              <th className="text-right px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((a) => (
              <tr key={a.id} className="border-t border-gray-100">
                <td className="px-4 py-3">
                  <div className="font-medium text-dark inline-flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-subtle" />
                    {a.filename}
                  </div>
                  {a.description && <div className="text-xs text-subtle mt-0.5">{a.description}</div>}
                </td>
                <td className="px-4 py-3 text-subtle text-xs">{a.mime_type}</td>
                <td className="px-4 py-3 text-subtle text-xs text-right">{formatBytes(a.size_bytes)}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => remove(a)} className="p-1.5 rounded hover:bg-red-50">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </td>
              </tr>
            ))}
            {!loading && items.length === 0 && (
              <tr><td colSpan={4} className="text-center py-12 text-subtle">Bibliothek ist leer.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
