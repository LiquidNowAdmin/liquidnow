"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Upload } from "lucide-react";
import { createClient } from "@/lib/supabase";

export default function AnbieterNeuPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [type, setType] = useState("bank");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoPreview, setLogoPreview] = useState("");
  const [website, setWebsite] = useState("");

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview immediately
    setLogoPreview(URL.createObjectURL(file));
    setUploading(true);
    setError("");

    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("logos")
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      setError("Logo-Upload fehlgeschlagen: " + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("logos")
      .getPublicUrl(fileName);

    setLogoUrl(urlData.publicUrl);
    setUploading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const supabase = createClient();
    const { error: insertError } = await supabase.from("providers").insert({
      name,
      type,
      logo_url: logoUrl || null,
      website: website || null,
      is_active: true,
    });

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    router.push("/admin/anbieter");
  }

  return (
    <>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Neuer Anbieter</h1>
      </div>

      {error && <div className="admin-login-error mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="admin-form">
        <div className="admin-field">
          <label htmlFor="name" className="admin-label">
            Name *
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="admin-input"
            required
            autoFocus
          />
        </div>

        <div className="admin-field">
          <label htmlFor="type" className="admin-label">
            Typ
          </label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="admin-select"
          >
            <option value="bank">Bank</option>
            <option value="fintech">Fintech</option>
          </select>
        </div>

        <div className="admin-field">
          <label className="admin-label">Logo</label>
          <div className="admin-logo-upload">
            <div
              className={`admin-logo-preview ${logoPreview || logoUrl ? "admin-logo-preview-filled" : ""}`}
            >
              {logoPreview || logoUrl ? (
                <img
                  src={logoPreview || logoUrl}
                  alt="Logo Vorschau"
                />
              ) : (
                <Upload size={20} style={{ color: "var(--color-subtle)" }} />
              )}
            </div>
            <div className="admin-logo-upload-area">
              <button
                type="button"
                className="admin-logo-upload-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Upload size={14} />
                {uploading
                  ? "Wird hochgeladen..."
                  : logoUrl
                    ? "Logo ändern"
                    : "Logo hochladen"}
              </button>
              <span className="admin-logo-upload-hint">
                PNG, JPG oder SVG, max. 2 MB
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                onChange={handleLogoUpload}
                style={{ display: "none" }}
              />
            </div>
          </div>
        </div>

        <div className="admin-field">
          <label htmlFor="website" className="admin-label">
            Website
          </label>
          <input
            id="website"
            type="text"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className="admin-input"
            placeholder="https://..."
          />
        </div>

        <div className="admin-form-actions">
          <Link href="/admin/anbieter" className="btn btn-secondary btn-md">
            Abbrechen
          </Link>
          <button
            type="submit"
            disabled={saving || uploading}
            className="btn btn-primary btn-md"
          >
            {saving ? "Speichern..." : "Anbieter erstellen"}
          </button>
        </div>
      </form>
    </>
  );
}
