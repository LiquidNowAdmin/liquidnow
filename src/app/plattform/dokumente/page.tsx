"use client";

import { useEffect, useState, useRef } from "react";
import { ArrowLeft, FileText, Upload, Download, Trash2, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase";

interface Doc {
  id: string;
  name: string;
  category: string | null;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  bwa: "BWA",
  bilanz: "Bilanz",
  kontoauszug: "Kontoauszug",
  steuerbescheid: "Steuerbescheid",
  gesellschaftsvertrag: "Gesellschaftsvertrag",
  sonstiges: "Sonstiges",
};

function formatBytes(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function DokumentePage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadCategory, setUploadCategory] = useState("sonstiges");
  const [deleting, setDeleting] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { window.location.href = "/auth/login"; return; }

      const { data: member } = await supabase
        .from("company_members")
        .select("company_id, tenant_id")
        .eq("user_id", session.user.id)
        .limit(1)
        .maybeSingle();

      if (!member?.company_id) { setLoading(false); return; }
      setCompanyId(member.company_id);
      setTenantId(member.tenant_id);

      const { data } = await supabase
        .from("documents")
        .select("id, name, category, file_path, file_size, mime_type, created_at")
        .eq("company_id", member.company_id)
        .order("created_at", { ascending: false });

      if (data) setDocs(data as Doc[]);
      setLoading(false);
    }
    load();
  }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !companyId || !tenantId) return;
    setUploading(true);

    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setUploading(false); return; }

    const ext = file.name.split(".").pop();
    const filePath = `${companyId}/${crypto.randomUUID()}.${ext}`;

    const { error: storageErr } = await supabase.storage.from("documents").upload(filePath, file);
    if (storageErr) { setUploading(false); return; }

    const { data: doc } = await supabase.from("documents").insert({
      tenant_id: tenantId,
      company_id: companyId,
      uploaded_by: session.user.id,
      name: file.name,
      category: uploadCategory,
      file_path: filePath,
      file_size: file.size,
      mime_type: file.type,
    }).select("id, name, category, file_path, file_size, mime_type, created_at").single();

    if (doc) setDocs(prev => [doc as Doc, ...prev]);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setUploading(false);
  }

  async function handleDownload(doc: Doc) {
    const supabase = createClient();
    const { data } = await supabase.storage.from("documents").createSignedUrl(doc.file_path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  }

  async function handleDelete(doc: Doc) {
    if (!confirm(`"${doc.name}" wirklich löschen?`)) return;
    setDeleting(doc.id);
    const supabase = createClient();
    await supabase.storage.from("documents").remove([doc.file_path]);
    await supabase.from("documents").delete().eq("id", doc.id);
    setDocs(prev => prev.filter(d => d.id !== doc.id));
    setDeleting(null);
  }

  return (
    <main style={{ minHeight: "100vh", background: "var(--color-light-bg)", padding: "2rem 1rem 4rem" }}>
      <div style={{ maxWidth: "640px", margin: "0 auto" }}>

        <a href="/plattform" className="detail-back" style={{ marginBottom: "1.5rem", display: "inline-flex" }}>
          <ArrowLeft style={{ width: "1rem", height: "1rem" }} />
          Zurück zur Plattform
        </a>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.375rem", fontWeight: 800, color: "var(--color-dark)" }}>Meine Dokumente</h1>
          {companyId && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <select
                value={uploadCategory}
                onChange={e => setUploadCategory(e.target.value)}
                className="admin-input"
                style={{ width: "auto", fontSize: "0.8125rem", padding: "0.4rem 0.625rem" }}
              >
                {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-primary btn-sm"
                style={{ gap: "0.375rem" }}
                disabled={uploading}
              >
                {uploading ? <Loader2 style={{ width: "0.875rem", height: "0.875rem", animation: "spin 1s linear infinite" }} /> : <Upload style={{ width: "0.875rem", height: "0.875rem" }} />}
                Hochladen
              </button>
              <input ref={fileInputRef} type="file" style={{ display: "none" }} onChange={handleUpload} accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.doc,.docx" />
            </div>
          )}
        </div>

        <div style={{ background: "#fff", borderRadius: "1rem", border: "1px solid var(--color-border)", overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "var(--color-subtle)", fontSize: "0.9375rem" }}>
              Laden…
            </div>
          ) : docs.length === 0 ? (
            <div style={{ padding: "3rem", textAlign: "center" }}>
              <FileText style={{ width: "2rem", height: "2rem", color: "var(--color-border)", margin: "0 auto 0.75rem" }} />
              <p style={{ color: "var(--color-subtle)", fontSize: "0.9375rem" }}>
                {companyId ? "Noch keine Dokumente hochgeladen." : "Kein Unternehmen hinterlegt."}
              </p>
            </div>
          ) : (
            <div>
              {docs.map((doc, i) => (
                <div
                  key={doc.id}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.875rem",
                    padding: "0.875rem 1.25rem",
                    borderTop: i > 0 ? "1px solid var(--color-border)" : "none",
                  }}
                >
                  <FileText style={{ width: "1.25rem", height: "1.25rem", color: "var(--color-subtle)", flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--color-dark)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {doc.name}
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "var(--color-subtle)", marginTop: "0.1rem" }}>
                      {doc.category ? (CATEGORY_LABELS[doc.category] ?? doc.category) : ""}
                      {doc.category && doc.file_size ? " · " : ""}
                      {formatBytes(doc.file_size)}
                      {(doc.category || doc.file_size) ? " · " : ""}
                      {formatDate(doc.created_at)}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "0.25rem" }}>
                    <button
                      onClick={() => handleDownload(doc)}
                      style={{ padding: "0.375rem", background: "none", border: "none", cursor: "pointer", color: "var(--color-subtle)", borderRadius: "0.375rem", transition: "background 0.15s" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "var(--color-light-bg)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "none")}
                      title="Herunterladen"
                    >
                      <Download style={{ width: "1rem", height: "1rem" }} />
                    </button>
                    <button
                      onClick={() => handleDelete(doc)}
                      disabled={deleting === doc.id}
                      style={{ padding: "0.375rem", background: "none", border: "none", cursor: "pointer", color: "var(--color-subtle)", borderRadius: "0.375rem", transition: "background 0.15s" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "var(--color-light-bg)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "none")}
                      title="Löschen"
                    >
                      {deleting === doc.id
                        ? <Loader2 style={{ width: "1rem", height: "1rem", animation: "spin 1s linear infinite" }} />
                        : <Trash2 style={{ width: "1rem", height: "1rem" }} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
