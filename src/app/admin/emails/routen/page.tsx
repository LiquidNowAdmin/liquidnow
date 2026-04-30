"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Lock, Save, X } from "lucide-react";
import { listRoutes, upsertRoute, deleteRoute, type TemplateRoute } from "@/lib/email-templates-admin";

const ENTITY_OPTIONS = [
  { value: "", label: "(statisch)" },
  { value: "inquiries", label: "Anfragen" },
  { value: "applications", label: "Applications" },
  { value: "users", label: "Users" },
];

export default function RoutesPage() {
  const [routes, setRoutes] = useState<TemplateRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Partial<TemplateRoute> | null>(null);

  const load = async () => {
    setLoading(true); setError(null);
    try { setRoutes(await listRoutes()); }
    catch (e) { setError(e instanceof Error ? e.message : "Fehler"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing?.key?.trim() || !editing?.label?.trim() || !editing?.url_template?.trim()) {
      setError("Key, Label und URL-Template sind Pflicht"); return;
    }
    try {
      await upsertRoute({
        id: editing.id,
        key: editing.key,
        label: editing.label,
        url_template: editing.url_template,
        description: editing.description ?? null,
        entity_type: editing.entity_type || null,
      });
      setEditing(null); load();
    } catch (e) { setError(e instanceof Error ? e.message : "Fehler"); }
  };

  const remove = async (r: TemplateRoute) => {
    if (r.is_protected) { alert("Geschützte Route — nicht löschbar."); return; }
    if (!confirm(`Route "${r.key}" löschen?`)) return;
    try { await deleteRoute(r.id); load(); }
    catch (e) { alert(e instanceof Error ? e.message : "Fehler"); }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Link href="/admin/emails" className="text-sm text-subtle hover:text-dark inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Zurück
        </Link>
        <button onClick={() => setEditing({ key: "", label: "", url_template: "" })}
                className="px-4 py-2 rounded-lg bg-turquoise hover:bg-turquoise-dark text-white text-sm font-semibold inline-flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Neue Route
        </button>
      </div>

      <h1 className="text-2xl font-bold text-dark mb-2">Link-Routen</h1>
      <p className="text-sm text-subtle mb-6">
        Diese Routen werden in E-Mail-Templates und der KI als <code className="px-1 bg-gray-100 rounded font-mono">{"{{link.<key>}}"}</code>-Variablen verwendet.
        Geschützte Routen sind seedbasiert und können nicht gelöscht werden — eigene Routen kannst du jederzeit hinzufügen.
        URL-Templates können <code className="px-1 bg-gray-100 rounded font-mono">{"{{entity.id}}"}</code> oder <code className="px-1 bg-gray-100 rounded font-mono">{"{{entity.inquiry_id}}"}</code> enthalten — wird beim Send automatisch ersetzt.
      </p>

      {error && <div className="p-3 mb-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>}

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-subtle">
            <tr>
              <th className="text-left px-4 py-3">Key</th>
              <th className="text-left px-4 py-3">Label</th>
              <th className="text-left px-4 py-3">URL-Template</th>
              <th className="text-left px-4 py-3">Entity</th>
              <th className="text-right px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {routes.map((r) => (
              <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs">
                  {r.is_protected && <Lock className="w-3 h-3 inline-block mr-1 text-subtle" />}
                  {`{{link.${r.key}}}`}
                </td>
                <td className="px-4 py-3 text-dark">{r.label}</td>
                <td className="px-4 py-3 text-subtle font-mono text-xs truncate max-w-[20rem]">{r.url_template}</td>
                <td className="px-4 py-3 text-xs text-subtle">{r.entity_type ?? "—"}</td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-1">
                    <button onClick={() => setEditing(r)} className="text-xs text-turquoise hover:text-turquoise-dark px-2 py-1">Bearbeiten</button>
                    {!r.is_protected && (
                      <button onClick={() => remove(r)} className="p-1.5 rounded hover:bg-red-50">
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!loading && routes.length === 0 && (
              <tr><td colSpan={5} className="text-center py-8 text-subtle">Noch keine Routen.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-dark">{editing.id ? "Route bearbeiten" : "Neue Route"}</h3>
              <button onClick={() => setEditing(null)} className="p-1 rounded hover:bg-gray-100"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-3">
              <div>
                <label className="text-xs uppercase tracking-wide text-subtle font-semibold">Key (slug) *</label>
                <input value={editing.key ?? ""} onChange={(e) => setEditing({ ...editing, key: e.target.value.replace(/[^a-z0-9_]/g, "_") })}
                       disabled={editing.is_protected}
                       placeholder="z.B. partner_dashboard"
                       className="w-full mt-1 px-3 py-2 rounded border border-gray-200 font-mono text-sm disabled:bg-gray-100" />
                <p className="text-xs text-subtle mt-1">Wird verwendet als <code className="font-mono">{`{{link.${editing.key || "..."}}}`}</code></p>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-subtle font-semibold">Label *</label>
                <input value={editing.label ?? ""} onChange={(e) => setEditing({ ...editing, label: e.target.value })}
                       className="w-full mt-1 px-3 py-2 rounded border border-gray-200" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-subtle font-semibold">URL-Template *</label>
                <input value={editing.url_template ?? ""} onChange={(e) => setEditing({ ...editing, url_template: e.target.value })}
                       placeholder="https://liqinow.de/... oder mit {{entity.id}}"
                       className="w-full mt-1 px-3 py-2 rounded border border-gray-200 font-mono text-sm" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-subtle font-semibold">Entity-Type (optional)</label>
                <select value={editing.entity_type ?? ""} onChange={(e) => setEditing({ ...editing, entity_type: e.target.value || null })}
                        className="w-full mt-1 px-3 py-2 rounded border border-gray-200">
                  {ENTITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <p className="text-xs text-subtle mt-1">Setzen wenn die Route nur für einen bestimmten Entity-Type gilt (z.B. Inquiry-Detail-URL).</p>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-subtle font-semibold">Beschreibung</label>
                <input value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                       className="w-full mt-1 px-3 py-2 rounded border border-gray-200" />
              </div>
            </div>
            <div className="px-6 py-3 border-t border-gray-100 flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="px-3 py-1.5 text-sm text-subtle hover:text-dark">Abbrechen</button>
              <button onClick={save}
                      className="px-4 py-1.5 rounded-lg bg-turquoise hover:bg-turquoise-dark text-white text-sm font-semibold inline-flex items-center gap-1.5">
                <Save className="w-3.5 h-3.5" /> Speichern
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
