"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import {
  listCategories, upsertCategory, deleteCategory,
  type AdminCategory,
} from "@/lib/articles-admin";

function slugify(s: string): string {
  return (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

export default function CategoriesPage() {
  const [cats, setCats] = useState<AdminCategory[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = () => listCategories().then(setCats).catch((e) => setError(String(e)));
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!name.trim()) return;
    try {
      await upsertCategory({
        slug: slug.trim() || slugify(name),
        name: name.trim(),
        description: description.trim() || undefined,
      });
      setName(""); setSlug(""); setDescription("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler");
    }
  };

  const remove = async (c: AdminCategory) => {
    if (!confirm(`Kategorie "${c.name}" löschen? (Nur möglich wenn keine Artikel mehr zugeordnet)`)) return;
    try { await deleteCategory(c.id); load(); }
    catch (err) { alert(err instanceof Error ? err.message : "Fehler — vermutlich noch Artikel zugeordnet."); }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Link href="/admin/ratgeber" className="text-sm text-subtle hover:text-dark inline-flex items-center gap-1 mb-6">
        <ArrowLeft className="w-4 h-4" /> Zurück
      </Link>
      <h1 className="text-2xl font-bold text-dark mb-6">Kategorien</h1>

      {error && <div className="p-3 mb-4 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}

      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <h2 className="font-semibold text-dark mb-3">Neue Kategorie</h2>
        <div className="grid gap-3 md:grid-cols-2 mb-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name *"
                 className="px-4 py-2 rounded-lg border border-gray-200" />
          <input value={slug} onChange={(e) => setSlug(slugify(e.target.value))} placeholder="Slug (optional)"
                 className="px-4 py-2 rounded-lg border border-gray-200 font-mono text-sm" />
        </div>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
                  placeholder="Beschreibung (optional, für Kategorie-Übersichtsseite)"
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 mb-3" />
        <button onClick={add} disabled={!name.trim()}
                className="px-4 py-2 rounded-lg bg-[#9BAA28] hover:bg-[#C4D42B] text-white text-sm font-semibold disabled:opacity-50 inline-flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Anlegen
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-subtle">
            <tr>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Slug</th>
              <th className="text-right px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {cats.map((c) => (
              <tr key={c.id} className="border-t border-gray-100">
                <td className="px-4 py-3">
                  <div className="font-medium text-dark">{c.name}</div>
                  {c.description && <div className="text-xs text-subtle">{c.description}</div>}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-subtle">{c.slug}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => remove(c)} className="p-1.5 rounded hover:bg-red-50">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </td>
              </tr>
            ))}
            {cats.length === 0 && (
              <tr><td colSpan={3} className="text-center py-8 text-subtle">Noch keine Kategorien.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
