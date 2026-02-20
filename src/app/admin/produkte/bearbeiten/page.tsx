"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

interface Provider {
  id: string;
  name: string;
}

function ProduktEditForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");

  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [providerId, setProviderId] = useState("");
  const [name, setName] = useState("");
  const [isTermLoan, setIsTermLoan] = useState(true);
  const [isCreditLine, setIsCreditLine] = useState(false);
  const [minVolume, setMinVolume] = useState("");
  const [maxVolume, setMaxVolume] = useState("");
  const [minTermMonths, setMinTermMonths] = useState("");
  const [maxTermMonths, setMaxTermMonths] = useState("");
  const [interestRateFrom, setInterestRateFrom] = useState("");
  const [interestRateTo, setInterestRateTo] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!id) return;

    async function fetchData() {
      const supabase = createClient();

      const [{ data: product }, { data: providerList }] = await Promise.all([
        supabase.from("products").select("*").eq("id", id).single(),
        supabase.from("providers").select("id, name").order("name"),
      ]);

      setProviders(providerList ?? []);

      if (product) {
        setProviderId(product.provider_id);
        setName(product.name);
        const t = product.type ?? "term_loan";
        setIsTermLoan(t === "term_loan" || t === "both");
        setIsCreditLine(t === "credit_line" || t === "both");
        setMinVolume(String(product.min_volume ?? ""));
        setMaxVolume(String(product.max_volume ?? ""));
        setMinTermMonths(String(product.min_term_months ?? ""));
        setMaxTermMonths(String(product.max_term_months ?? ""));
        setInterestRateFrom(String(product.interest_rate_from ?? ""));
        setInterestRateTo(String(product.interest_rate_to ?? ""));
        setIsActive(product.is_active);
      }

      setLoading(false);
    }

    fetchData();
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("products")
      .update({
        provider_id: providerId,
        name,
        type: isCreditLine && isTermLoan ? "both" : isCreditLine ? "credit_line" : "term_loan",
        min_volume: parseInt(minVolume) || null,
        max_volume: parseInt(maxVolume) || null,
        min_term_months: parseInt(minTermMonths) || null,
        max_term_months: parseInt(maxTermMonths) || null,
        interest_rate_from: parseFloat(interestRateFrom) || null,
        interest_rate_to: parseFloat(interestRateTo) || null,
        is_active: isActive,
      })
      .eq("id", id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    router.push("/admin/produkte");
  }

  if (!id) {
    return <p className="text-subtle">Keine Produkt-ID angegeben.</p>;
  }

  if (loading) {
    return (
      <div className="admin-page-header">
        <h1 className="admin-page-title">Laden...</h1>
      </div>
    );
  }

  return (
    <>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Produkt bearbeiten</h1>
      </div>

      {error && <div className="admin-login-error mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="admin-form">
        <div className="admin-field">
          <label htmlFor="provider" className="admin-label">
            Anbieter *
          </label>
          <select
            id="provider"
            value={providerId}
            onChange={(e) => setProviderId(e.target.value)}
            className="admin-select"
            required
          >
            {providers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="admin-field">
          <label htmlFor="name" className="admin-label">
            Produktname *
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="admin-input"
            required
          />
        </div>

        <div className="admin-field">
          <label className="admin-label">Typ</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isTermLoan}
                onChange={(e) => setIsTermLoan(e.target.checked)}
                className="admin-checkbox"
              />
              Laufzeitkredit
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isCreditLine}
                onChange={(e) => setIsCreditLine(e.target.checked)}
                className="admin-checkbox"
              />
              Kreditlinie
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="admin-field">
            <label htmlFor="min_volume" className="admin-label">
              Min. Volumen (EUR)
            </label>
            <input
              id="min_volume"
              type="number"
              value={minVolume}
              onChange={(e) => setMinVolume(e.target.value)}
              className="admin-input"
            />
          </div>
          <div className="admin-field">
            <label htmlFor="max_volume" className="admin-label">
              Max. Volumen (EUR)
            </label>
            <input
              id="max_volume"
              type="number"
              value={maxVolume}
              onChange={(e) => setMaxVolume(e.target.value)}
              className="admin-input"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4" style={{ opacity: isTermLoan ? 1 : 0.4 }}>
          <div className="admin-field">
            <label htmlFor="min_term" className="admin-label">
              Min. Laufzeit (Monate)
            </label>
            <input
              id="min_term"
              type="number"
              value={minTermMonths}
              onChange={(e) => setMinTermMonths(e.target.value)}
              className="admin-input"
              disabled={!isTermLoan}
            />
          </div>
          <div className="admin-field">
            <label htmlFor="max_term" className="admin-label">
              Max. Laufzeit (Monate)
            </label>
            <input
              id="max_term"
              type="number"
              value={maxTermMonths}
              onChange={(e) => setMaxTermMonths(e.target.value)}
              className="admin-input"
              disabled={!isTermLoan}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="admin-field">
            <label htmlFor="rate_from" className="admin-label">
              Zins von (%)
            </label>
            <input
              id="rate_from"
              type="number"
              step="0.01"
              value={interestRateFrom}
              onChange={(e) => setInterestRateFrom(e.target.value)}
              className="admin-input"
            />
          </div>
          <div className="admin-field">
            <label htmlFor="rate_to" className="admin-label">
              Zins bis (%)
            </label>
            <input
              id="rate_to"
              type="number"
              step="0.01"
              value={interestRateTo}
              onChange={(e) => setInterestRateTo(e.target.value)}
              className="admin-input"
            />
          </div>
        </div>

        <div className="admin-field">
          <label className="admin-label">Status</label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`admin-toggle ${isActive ? "admin-toggle-active" : ""}`}
            >
              <span className="admin-toggle-knob" />
            </button>
            <span
              className={`admin-status ${isActive ? "admin-status-active" : "admin-status-inactive"}`}
            >
              {isActive ? "Aktiv" : "Inaktiv"}
            </span>
          </div>
        </div>

        <div className="admin-form-actions">
          <Link href="/admin/produkte" className="btn btn-secondary btn-md">
            Abbrechen
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary btn-md"
          >
            {saving ? "Speichern..." : "Speichern"}
          </button>
        </div>
      </form>
    </>
  );
}

export default function ProduktEditPage() {
  return (
    <Suspense
      fallback={
        <div className="admin-page-header">
          <h1 className="admin-page-title">Laden...</h1>
        </div>
      }
    >
      <ProduktEditForm />
    </Suspense>
  );
}
