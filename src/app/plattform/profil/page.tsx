"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { ArrowLeft, User, Building2, Check } from "lucide-react";
import { createClient } from "@/lib/supabase";

interface UserProfile {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  dob: string;
  street: string;
  zip: string;
  city: string;
}

interface Company {
  id: string;
  name: string;
  hrb: string;
  ust_id: string;
  website: string;
  street: string;
  zip: string;
  city: string;
  monthly_revenue: string;
}

const EMPTY: UserProfile = { first_name: "", last_name: "", phone: "", email: "", dob: "", street: "", zip: "", city: "" };
const EMPTY_COMPANY: Company = { id: "", name: "", hrb: "", ust_id: "", website: "", street: "", zip: "", city: "", monthly_revenue: "" };

function InlineField({
  label,
  value,
  type = "text",
  readOnly = false,
  onSave,
}: {
  label: string;
  value: string;
  type?: string;
  readOnly?: boolean;
  onSave?: (val: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saved, setSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync when parent value changes
  useEffect(() => { if (!editing) setDraft(value); }, [value, editing]);

  async function handleBlur() {
    setEditing(false);
    if (draft === value || !onSave) return;
    await onSave(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleClick() {
    if (readOnly) return;
    setDraft(value);
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", marginBottom: "0.25rem" }}>
        <p style={{ fontSize: "0.6875rem", color: "var(--color-subtle)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</p>
        {saved && <Check style={{ width: "0.625rem", height: "0.625rem", color: "var(--color-olive)" }} />}
      </div>
      {editing ? (
        <input
          ref={inputRef}
          type={type}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={e => { if (e.key === "Enter") inputRef.current?.blur(); if (e.key === "Escape") { setDraft(value); setEditing(false); } }}
          className="admin-input"
          style={{ fontSize: "0.9375rem" }}
        />
      ) : (
        <button
          onClick={handleClick}
          style={{
            width: "100%", textAlign: "left", background: "none", border: "none", padding: 0,
            fontSize: "0.9375rem", color: value ? "var(--color-dark)" : "var(--color-border)",
            cursor: readOnly ? "default" : "text",
            transition: "color 0.15s",
          }}
        >
          {value || "—"}
        </button>
      )}
    </div>
  );
}

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem", paddingBottom: "0.75rem", borderBottom: "1px solid var(--color-border)" }}>
      <Icon style={{ width: "1.125rem", height: "1.125rem", color: "var(--color-subtle)" }} />
      <h2 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--color-dark)" }}>{title}</h2>
    </div>
  );
}

const GRID = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "1.25rem 2rem" } as const;

export default function ProfilPage() {
  const [profile, setProfile] = useState<UserProfile>(EMPTY);
  const [company, setCompany] = useState<Company>(EMPTY_COMPANY);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { window.location.href = "/auth/login"; return; }

      const [profileRes, memberRes] = await Promise.all([
        supabase.from("users").select("first_name, last_name, phone, email, metadata").eq("id", session.user.id).maybeSingle(),
        supabase.from("company_members").select("company_id").eq("user_id", session.user.id).limit(1).maybeSingle(),
      ]);

      if (profileRes.data) {
        const d = profileRes.data;
        const meta = (d.metadata ?? {}) as Record<string, string>;
        setProfile({
          first_name: d.first_name ?? "",
          last_name: d.last_name ?? "",
          phone: d.phone ?? "",
          email: d.email ?? "",
          dob: meta.date_of_birth ?? "",
          street: meta.street ?? "",
          zip: meta.zip ?? "",
          city: meta.city ?? "",
        });
      }

      if (memberRes.data?.company_id) {
        const { data: co } = await supabase
          .from("companies")
          .select("id, name, hrb, ust_id, website, address, annual_revenue")
          .eq("id", memberRes.data.company_id)
          .maybeSingle();
        if (co) {
          const addr = (co.address ?? {}) as Record<string, string>;
          setCompany({
            id: co.id,
            name: co.name ?? "",
            hrb: co.hrb ?? "",
            ust_id: co.ust_id ?? "",
            website: co.website ?? "",
            street: addr.street ?? "",
            zip: addr.zip ?? "",
            city: addr.city ?? "",
            monthly_revenue: co.annual_revenue != null ? String(Math.round(co.annual_revenue / 12)) : "",
          });
        }
      }
      setLoading(false);
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveProfile = useCallback(async (patch: Partial<UserProfile>) => {
    const updated = { ...profile, ...patch };
    setProfile(updated);
    await supabase.rpc("upsert_user_profile", {
      p_first_name: updated.first_name,
      p_last_name: updated.last_name,
      p_phone: updated.phone,
      p_dob: updated.dob,
      p_street: updated.street,
      p_zip: updated.zip,
      p_city: updated.city,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const saveCompany = useCallback(async (patch: Partial<Company>) => {
    const updated = { ...company, ...patch };
    setCompany(updated);
    if (updated.id) {
      const monthly = updated.monthly_revenue ? Number(updated.monthly_revenue) : null;
      await supabase.from("companies").update({
        name: updated.name || null,
        hrb: updated.hrb || null,
        ust_id: updated.ust_id || null,
        website: updated.website || null,
        address: { street: updated.street || null, zip: updated.zip || null, city: updated.city || null },
        annual_revenue: monthly != null ? monthly * 12 : null,
        updated_at: new Date().toISOString(),
      }).eq("id", updated.id);
    } else {
      // No company yet — create one
      const { data: newId } = await supabase.rpc("get_or_create_company", {
        p_name: updated.name,
        p_hrb: updated.hrb,
        p_ust_id: updated.ust_id,
        p_website: updated.website,
        p_street: updated.street,
        p_zip: updated.zip,
        p_city: updated.city,
        p_monthly_revenue: updated.monthly_revenue ? Number(updated.monthly_revenue) : null,
      });
      if (newId) setCompany(c => ({ ...c, id: newId as string }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company]);

  if (loading) {
    return (
      <main style={{ minHeight: "100vh", background: "var(--color-light-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--color-subtle)", fontSize: "0.9375rem" }}>Laden…</p>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: "var(--color-light-bg)", padding: "2rem 1rem 4rem" }}>
      <div style={{ maxWidth: "640px", margin: "0 auto" }}>

        <a href="/plattform" className="detail-back" style={{ marginBottom: "1.5rem", display: "inline-flex" }}>
          <ArrowLeft style={{ width: "1rem", height: "1rem" }} />
          Zurück zur Plattform
        </a>

        <h1 style={{ fontSize: "1.375rem", fontWeight: 800, color: "var(--color-dark)", marginBottom: "1.75rem" }}>Mein Profil</h1>

        {/* Personal */}
        <div style={{ background: "#fff", borderRadius: "1rem", border: "1px solid var(--color-border)", padding: "1.5rem 1.75rem", marginBottom: "1rem" }}>
          <SectionHeader icon={User} title="Persönliche Daten" />
          <div style={GRID}>
            <InlineField label="Vorname" value={profile.first_name} onSave={v => saveProfile({ first_name: v })} />
            <InlineField label="Nachname" value={profile.last_name} onSave={v => saveProfile({ last_name: v })} />
            <InlineField label="E-Mail" value={profile.email} readOnly />
            <InlineField label="Telefon" value={profile.phone} onSave={v => saveProfile({ phone: v })} />
            <InlineField label="Geburtsdatum" value={profile.dob} type="date" onSave={v => saveProfile({ dob: v })} />
            <InlineField label="Straße" value={profile.street} onSave={v => saveProfile({ street: v })} />
            <InlineField label="PLZ" value={profile.zip} onSave={v => saveProfile({ zip: v })} />
            <InlineField label="Stadt" value={profile.city} onSave={v => saveProfile({ city: v })} />
          </div>
        </div>

        {/* Company */}
        <div style={{ background: "#fff", borderRadius: "1rem", border: "1px solid var(--color-border)", padding: "1.5rem 1.75rem" }}>
          <SectionHeader icon={Building2} title="Unternehmen" />
          <div style={GRID}>
            <InlineField label="Firmenname" value={company.name} onSave={v => saveCompany({ name: v })} />
            <InlineField label="HRB" value={company.hrb} onSave={v => saveCompany({ hrb: v })} />
            <InlineField label="USt-ID" value={company.ust_id} onSave={v => saveCompany({ ust_id: v })} />
            <InlineField label="Website" value={company.website} onSave={v => saveCompany({ website: v })} />
            <InlineField label="Straße" value={company.street} onSave={v => saveCompany({ street: v })} />
            <InlineField label="PLZ" value={company.zip} onSave={v => saveCompany({ zip: v })} />
            <InlineField label="Stadt" value={company.city} onSave={v => saveCompany({ city: v })} />
            <InlineField label="Monatsumsatz (€)" value={company.monthly_revenue} type="number" onSave={v => saveCompany({ monthly_revenue: v })} />
          </div>
        </div>

      </div>
    </main>
  );
}
