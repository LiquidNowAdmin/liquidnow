"use client";

import { useEffect, useState } from "react";
import { Paperclip, X, Upload, Loader2 } from "lucide-react";
import {
  listLibraryAttachments,
  uploadLibraryAttachment,
  type EmailTemplateAttachment,
  type LibraryAttachment,
} from "@/lib/email-templates-admin";

type Props = {
  attachments: EmailTemplateAttachment[];
  onChange: (next: EmailTemplateAttachment[]) => void;
};

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AttachmentPicker({ attachments, onChange }: Props) {
  const [library, setLibrary] = useState<LibraryAttachment[]>([]);
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listLibraryAttachments().then(setLibrary).catch(() => {});
  }, []);

  const addFromLibrary = (lib: LibraryAttachment) => {
    if (attachments.some((a) => a.storage_path === lib.storage_path)) return;
    onChange([...attachments, {
      kind: "library",
      filename: lib.filename,
      storage_path: lib.storage_path,
      mime_type: lib.mime_type,
      size_bytes: lib.size_bytes,
    }]);
    setOpen(false);
  };

  const handleAdHocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setError(null);
    try {
      const lib = await uploadLibraryAttachment(file);
      // Auch zur Library hinzufügen UND als Ad-hoc-Anhang anhängen.
      setLibrary((prev) => [lib, ...prev]);
      onChange([...attachments, {
        kind: "adhoc",
        filename: lib.filename,
        storage_path: lib.storage_path,
        mime_type: lib.mime_type,
        size_bytes: lib.size_bytes,
      }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload fehlgeschlagen");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs uppercase tracking-wide text-subtle font-semibold">Anhänge</label>
        <button onClick={() => setOpen(!open)}
                className="text-xs text-turquoise hover:text-turquoise-dark inline-flex items-center gap-1">
          <Paperclip className="w-3 h-3" /> Hinzufügen
        </button>
      </div>

      {error && <div className="p-2 rounded bg-red-50 text-red-700 text-xs">{error}</div>}

      {attachments.length === 0 ? (
        <p className="text-xs text-subtle italic">Keine Anhänge.</p>
      ) : (
        <ul className="space-y-1.5">
          {attachments.map((a, i) => (
            <li key={i} className="flex items-center justify-between p-2 rounded border border-gray-200 bg-white text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <Paperclip className="w-3.5 h-3.5 text-subtle shrink-0" />
                <span className="truncate">{a.filename}</span>
                {a.size_bytes && <span className="text-xs text-subtle shrink-0">{formatBytes(a.size_bytes)}</span>}
              </div>
              <button onClick={() => onChange(attachments.filter((_, k) => k !== i))}
                      className="p-1 rounded hover:bg-red-50">
                <X className="w-3.5 h-3.5 text-red-500" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && (
        <div className="p-3 rounded-lg border border-gray-200 bg-gray-50 space-y-3">
          <div>
            <label className="block text-xs text-subtle font-semibold mb-1">Aus Bibliothek wählen</label>
            {library.length === 0 ? (
              <p className="text-xs text-subtle italic">Bibliothek ist leer — lade unten ein neues File hoch.</p>
            ) : (
              <ul className="space-y-1 max-h-48 overflow-y-auto">
                {library.map((lib) => (
                  <li key={lib.id}>
                    <button onClick={() => addFromLibrary(lib)}
                            className="w-full text-left px-2 py-1.5 rounded hover:bg-white border border-transparent hover:border-gray-200 text-sm">
                      <div className="font-medium text-dark">{lib.filename}</div>
                      <div className="text-xs text-subtle">{formatBytes(lib.size_bytes)} · {lib.mime_type}</div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <label className="block text-xs text-subtle font-semibold mb-1">Oder neues File hochladen (kommt auch in die Bibliothek)</label>
            <label className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-dashed border-gray-300 hover:border-turquoise cursor-pointer bg-white text-sm text-subtle">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploading ? "Lade hoch…" : "Datei wählen"}
              <input type="file" className="hidden" disabled={uploading} onChange={handleAdHocUpload} />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
