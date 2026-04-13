"use client";

import React, { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, ArrowRight, ArrowLeft, Search, Banknote, ChevronDown, Check, MessageCircle, Star, SlidersHorizontal, Loader2, Building2, Zap, ReceiptText, Shield, RefreshCw, Sparkles, Users, Headphones, Upload, Landmark } from "lucide-react";
import Logo from "@/components/Logo";
import Footer from "@/components/Footer";
import { GermanNumberInput, formatDE, parseDE } from "@/components/GermanNumberInput";
import UserMenu from "@/components/UserMenu";
import { createClient } from "@/lib/supabase";
import { useTracking } from "@/lib/tracking";
import type { User } from "@supabase/supabase-js";

interface Offer {
  product_id: string;
  provider_id: string;
  provider_name: string;
  provider_logo_url: string | null;
  provider_type: string;
  product_name: string;
  product_type: string;
  min_volume: number;
  max_volume: number;
  min_term_months: number;
  max_term_months: number;
  interest_rate_from: number;
  interest_rate_to: number;
  metadata: Record<string, unknown> | null;
}

type SortKey = "rate" | "term" | "volume" | "speed";

function calculateMonthlyRate(principal: number, annualRate: number, months: number): number {
  const monthlyRate = annualRate / 100 / 12;
  if (monthlyRate === 0) return principal / months;
  return (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
}


function formatVolume(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
  return `${value}`;
}

const USE_CASE_LABELS: Record<string, string> = {
  wareneinkauf: "Wareneinkauf",
  liquiditaet: "Liquiditätsengpass",
  wachstum: "Wachstum & Expansion",
  marketing: "Marketing",
  steuer: "Steuerrückzahlung",
  andere: "Andere",
};

function getProviderInitials(name: string): string {
  return name.split(" ").map(w => w[0]).join("").slice(0, 3).toUpperCase();
}

interface MetricScore { score: number; label: string; }

function speedScore(days: number | undefined, explicit?: number): MetricScore {
  if (explicit) {
    const s = Math.min(4, Math.max(1, explicit));
    return { score: s, label: ["", "Langsam", "Mittel", "Schnell", "Top"][Math.round(s)] };
  }
  if (!days || days <= 1) return { score: 4, label: "Top" };
  if (days <= 2)          return { score: 3, label: "Schnell" };
  if (days <= 5)          return { score: 2, label: "Mittel" };
  return                         { score: 1, label: "Langsam" };
}

function approvalScore(pct: number | undefined, explicit?: number): MetricScore {
  if (explicit) {
    const s = Math.min(4, Math.max(1, explicit));
    return { score: s, label: ["", "Niedrig", "Mittel", "Hoch", "Top"][Math.round(s)] };
  }
  if (!pct)       return { score: 2, label: "k. A." };
  if (pct >= 70)  return { score: 4, label: "Top" };
  if (pct >= 50)  return { score: 3, label: "Hoch" };
  if (pct >= 30)  return { score: 2, label: "Mittel" };
  return                 { score: 1, label: "Niedrig" };
}

function priceScore(rate: number, hasFeeModel: boolean, explicit?: number): MetricScore {
  if (explicit) {
    const s = Math.min(4, Math.max(1, explicit));
    return { score: s, label: ["", "Teuer", "Mittel", "Günstig", "Top"][Math.round(s)] };
  }
  if (hasFeeModel)  return { score: 2, label: "Gebühr" };
  if (rate <= 3)    return { score: 4, label: "Top" };
  if (rate <= 6)    return { score: 3, label: "Günstig" };
  if (rate <= 12)   return { score: 2, label: "Mittel" };
  return                   { score: 1, label: "Teuer" };
}

function flexibilityScore(productType: string, m: Record<string, unknown>): MetricScore {
  const explicit = m.flexibility_score as number | undefined;
  if (explicit) {
    const labels = ["", "Fest", "Standard", "Flexibel", "Top"];
    const s = Math.min(4, Math.max(1, explicit));
    return { score: s, label: labels[s] };
  }
  const t = (productType ?? "").toLowerCase();
  if (t.includes("linie") || t.includes("revolv"))      return { score: 4, label: "Top" };
  if (t.includes("flexi") || t.includes("merchant") || t.includes("cash advance")) return { score: 3, label: "Flexibel" };
  if (t.includes("kredit") || t.includes("darlehen"))   return { score: 2, label: "Standard" };
  return { score: 2, label: "Standard" };
}

function SignalBar({ label, metric }: { label: string; metric: MetricScore }) {
  return (
    <div className="flex items-center gap-3" title={`${label}: ${metric.label}`}>
      <span style={{ width: "5rem", fontSize: "0.6875rem", color: "var(--color-subtle)", flexShrink: 0, whiteSpace: "nowrap" }}>{label}</span>
      <div className="flex gap-0.5 items-center shrink-0">
        {[1, 2, 3, 4].map(i => (
          <span
            key={i}
            style={{
              display: "block",
              width: "1.125rem",
              height: "0.375rem",
              borderRadius: "999px",
              background: i <= metric.score ? "var(--color-turquoise)" : "var(--color-border)",
            }}
          />
        ))}
      </div>
      <span style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--color-dark)", whiteSpace: "nowrap" }}>{metric.label}</span>
    </div>
  );
}

function TrustpilotStars({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating);
  return (
    <span className="offer-trustpilot">
      <span className="offer-trustpilot-stars">
        {Array.from({ length: fullStars }).map((_, i) => (
          <span key={i} className="offer-trustpilot-star">
            <Star className="h-2 w-2 fill-current" />
          </span>
        ))}
      </span>
      <span className="offer-trustpilot-score">{rating}</span>
    </span>
  );
}

function SkeletonCard() {
  return (
    <div className="offer-card animate-pulse">
      <div className="offer-card-body">
        <div className="offer-card-grid">
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 bg-gray-200 rounded-xl shrink-0" />
            <div className="flex flex-col gap-2">
              <div className="h-3 w-24 bg-gray-200 rounded" />
              <div className="h-2.5 w-16 bg-gray-100 rounded" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="h-3 w-full bg-gray-100 rounded" />
            <div className="h-3 w-4/5 bg-gray-100 rounded" />
            <div className="h-3 w-3/4 bg-gray-100 rounded" />
          </div>
          <div className="flex flex-col gap-2">
            <div className="h-3 w-full bg-gray-100 rounded" />
            <div className="h-3 w-2/3 bg-gray-100 rounded" />
          </div>
          <div className="flex flex-col gap-2 items-end">
            <div className="h-4 w-16 bg-gray-200 rounded" />
            <div className="h-3 w-20 bg-gray-100 rounded" />
            <div className="h-3 w-14 bg-gray-100 rounded" />
            <div className="h-9 w-28 bg-gray-200 rounded-lg mt-1" />
          </div>
        </div>
        <div style={{ height: "1.25rem" }} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   INLINE FUNNEL PANEL
───────────────────────────────────────────────────────── */

const FILTER_TO_PURPOSE: Record<string, string> = {
  wareneinkauf: "INVENTORY",
  liquiditaet:  "WORKING_CAPITAL",
  wachstum:     "EXPANSION",
  marketing:    "MARKETING",
  steuer:       "OTHER",
  andere:       "OTHER",
};

const PURPOSE_OPTIONS = [
  { value: "WORKING_CAPITAL", label: "Betriebsmittel / Liquidität" },
  { value: "INVENTORY", label: "Wareneinkauf" },
  { value: "MARKETING", label: "Investition in Marketing" },
  { value: "EMPLOY_PERSONNEL", label: "Personal einstellen" },
  { value: "BUY_EQUIPMENT", label: "Ausstattung / Maschinen" },
  { value: "EXPANSION", label: "Wachstum & Expansion" },
  { value: "REPAY_OTHER_LOAN", label: "Anderen Kredit ablösen" },
  { value: "OTHER", label: "Anderes" },
];

const FUNNEL_STEPS = [
  { title: "Ihre Anfrage", sub: "Volumen, Laufzeit & Verwendungszweck" },
  { title: "Ihr Umsatz", sub: "Durchschnittlicher Monatsumsatz" },
  { title: "Ihr Unternehmen", sub: "Firma suchen – wir füllen den Rest aus." },
  { title: "Persönliche Daten", sub: "Wer stellt den Antrag?" },
  { title: "Zusammenfassung", sub: "Prüfen und absenden" },
  { title: "Kontoauszüge", sub: "Bankdaten verifizieren" },
];

const TERM_OPTIONS = [3, 6, 9, 12, 18, 24, 36];

// YouLend: estimated financing based on monthly revenue + trading history
// Base values for 10k/month revenue
const YOULEND_TABLE: [number, number][] = [
  [3, 9000], [4, 9250], [5, 9500], [6, 10000], [7, 10500],
  [8, 11000], [9, 11500], [12, 13000], [15, 15000], [18, 18000],
  [24, 19000], [36, 19250], [48, 19500], [60, 20000],
];
function youlendEstimate(monthlyRevenue: number, tradingMonths: number): number {
  // Interpolate from table, scale linearly with revenue
  let base = YOULEND_TABLE[0][1];
  for (const [m, v] of YOULEND_TABLE) {
    if (tradingMonths >= m) base = v;
    else break;
  }
  return Math.round(base * (monthlyRevenue / 10000));
}

function buildPhone(phone: string, countryCode: string): string {
  const full = phone.startsWith("+") ? phone : `${countryCode}${phone}`;
  return full.replace(/^(\+\d{2,3})\1+/, "$1");
}

// YouLend company type options + mapping
const YL_COMPANY_TYPES = [
  { value: "GmbH", label: "GmbH", yl: "GmbhUg", needsHrb: true },
  { value: "UG", label: "UG (haftungsbeschränkt)", yl: "GmbhUg", needsHrb: true },
  { value: "AG", label: "AG", yl: "GmbhUg", needsHrb: true },
  { value: "GmbH & Co. KG", label: "GmbH & Co. KG", yl: "GmbhUg", needsHrb: true },
  { value: "UG & Co. KG", label: "UG & Co. KG", yl: "GmbhUg", needsHrb: true },
  { value: "e.K.", label: "e.K. (eingetragener Kaufmann)", yl: "EK", needsHrb: true },
  { value: "KG", label: "KG", yl: "KG", needsHrb: true },
  { value: "OHG", label: "OHG", yl: "OHG", needsHrb: true },
  { value: "GbR", label: "GbR", yl: "Gbr", needsHrb: false },
  { value: "Einzelunternehmen", label: "Einzelunternehmen / Gewerbetreibende", yl: "Gewerbebetrieb", needsHrb: false },
  { value: "Freiberufler", label: "Freiberufler", yl: "Gewerbebetrieb", needsHrb: false },
  { value: "Ltd", label: "Ltd", yl: "GmbhUg", needsHrb: true },
  { value: "SE", label: "SE (Europäische AG)", yl: "GmbhUg", needsHrb: true },
  { value: "PartG", label: "Partnerschaftsgesellschaft", yl: "GbrOhg", needsHrb: false },
  { value: "eG", label: "eG (eingetragene Genossenschaft)", yl: "eGbR", needsHrb: true },
];

// Provider name → Edge Function slug mapping
const PROVIDER_SLUGS: Record<string, string> = {
  "Qred Bank": "qred",
  "YouLend": "youlend",
};

function stepKeyDown(onLastEnter: () => void) {
  return function(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "Enter" || (e.target as HTMLElement).tagName !== "INPUT") return;
    e.preventDefault();
    const inputs = Array.from(e.currentTarget.querySelectorAll<HTMLInputElement>("input"));
    const idx = inputs.indexOf(e.target as HTMLInputElement);
    if (idx < inputs.length - 1) {
      inputs[idx + 1].focus();
    } else {
      onLastEnter();
    }
  };
}

const COUNTRY_CODES = [
  { code: "+49", flag: "🇩🇪", name: "DE" },
  { code: "+43", flag: "🇦🇹", name: "AT" },
  { code: "+41", flag: "🇨🇭", name: "CH" },
  { code: "+31", flag: "🇳🇱", name: "NL" },
  { code: "+32", flag: "🇧🇪", name: "BE" },
  { code: "+33", flag: "🇫🇷", name: "FR" },
  { code: "+34", flag: "🇪🇸", name: "ES" },
  { code: "+39", flag: "🇮🇹", name: "IT" },
  { code: "+45", flag: "🇩🇰", name: "DK" },
  { code: "+46", flag: "🇸🇪", name: "SE" },
  { code: "+48", flag: "🇵🇱", name: "PL" },
  { code: "+420", flag: "🇨🇿", name: "CZ" },
];

const LABEL_STYLE: React.CSSProperties = { display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-subtle)", marginBottom: "0.375rem" };
const ERROR_STYLE: React.CSSProperties = { fontSize: "0.6875rem", color: "rgba(220,38,38,0.8)", marginTop: "0.25rem" };

// Simple uncontrolled field — Chrome autofill works without React state interference
function UField({ label, name, autoComplete, type = "text", defaultValue = "", placeholder = "", required = false }: {
  label: string; name: string; autoComplete: string; type?: string;
  defaultValue?: string; placeholder?: string; required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} style={LABEL_STYLE}>
        {label}{required && <span style={{ color: "var(--color-turquoise)", marginLeft: "2px" }}>*</span>}
      </label>
      <input id={name} type={type} name={name} autoComplete={autoComplete} defaultValue={defaultValue}
        placeholder={placeholder} className="admin-input" style={{ width: "100%" }} />
    </div>
  );
}

type PersonalData = {
  firstName: string; lastName: string; dateOfBirth: string;
  email: string; phone: string; phoneCountry: string;
  street: string; zip: string; city: string;
};

const PERSONAL_KEY = "funnel_personal";

function PersonalDataForm({ defaults, onSubmit, onBack, submitting, submitError, submitLabel }: {
  defaults: Partial<PersonalData>;
  onSubmit: (data: PersonalData) => void;
  onBack: () => void;
  submitting?: boolean;
  submitError?: string | null;
  submitLabel?: string;
}) {
  const merged: Partial<PersonalData> = Object.fromEntries(Object.entries(defaults).filter(([, v]) => !!v));

  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [phoneCountry, setPhoneCountry] = useState(merged.phoneCountry ?? "+49");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const els = e.currentTarget.elements;
    const get = (name: string) => (els.namedItem(name) as HTMLInputElement | null)?.value ?? "";
    const email = get("email");
    const phone = get("tel");
    let valid = true;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { setEmailError("Bitte gültige E-Mail-Adresse eingeben"); valid = false; }
    if (phone && phone.replace(/\D/g, "").length < 6) { setPhoneError("Mindestens 6 Ziffern"); valid = false; }
    if (!valid) return;
    const data: PersonalData = { firstName: get("given-name"), lastName: get("family-name"), dateOfBirth: get("bday"),
      email, phone, phoneCountry, street: get("street-address"), zip: get("postal-code"), city: get("address-level2") };
    onSubmit(data);
  }

  return (
    <form action="#" autoComplete="on" onSubmit={handleSubmit}>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <UField label="Vorname" name="given-name" autoComplete="given-name" defaultValue={merged.firstName} placeholder="Hans" required />
          <UField label="Nachname" name="family-name" autoComplete="family-name" defaultValue={merged.lastName} placeholder="Schmidt" required />
        </div>
        <UField label="Geburtsdatum" name="bday" autoComplete="bday" type="date" defaultValue={merged.dateOfBirth} required />
        <div>
          <label htmlFor="email" style={LABEL_STYLE}>E-Mail<span style={{ color: "var(--color-turquoise)", marginLeft: "2px" }}>*</span></label>
          <input id="email" type="email" name="email" autoComplete="email" defaultValue={merged.email ?? ""}
            placeholder="hans@example.de" className="admin-input"
            style={{ width: "100%", ...(emailError ? { borderColor: "rgba(220,38,38,0.5)" } : {}) }}
            onChange={() => setEmailError("")} />
          {emailError && <p style={ERROR_STYLE}>{emailError}</p>}
        </div>
        <div>
          <label style={LABEL_STYLE}>Telefon</label>
          <div style={{ display: "flex", gap: "0.375rem" }}>
            <select name="tel-country-code" autoComplete="tel-country-code" value={phoneCountry}
              onChange={e => setPhoneCountry(e.target.value)} className="admin-input"
              style={{ width: "95px", flexShrink: 0, paddingLeft: "0.5rem", paddingRight: "0.25rem" }}>
              {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
            </select>
            <input id="tel" type="tel" name="tel" autoComplete="tel" defaultValue={merged.phone ?? ""}
              placeholder="170 1234567" className="admin-input"
              style={{ flex: 1, ...(phoneError ? { borderColor: "rgba(220,38,38,0.5)" } : {}) }}
              onChange={() => setPhoneError("")} />
          </div>
          {phoneError && <p style={ERROR_STYLE}>{phoneError}</p>}
        </div>
        <UField label="Straße und Hausnummer" name="street-address" autoComplete="street-address" defaultValue={merged.street} placeholder="Musterstraße 456" required />
        <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: "0.75rem" }}>
          <UField label="PLZ" name="postal-code" autoComplete="postal-code" defaultValue={merged.zip} placeholder="80331" required />
          <UField label="Stadt" name="address-level2" autoComplete="address-level2" defaultValue={merged.city} placeholder="München" required />
        </div>
      </div>
      {submitError && <p style={{ fontSize: "0.8125rem", color: "rgba(220,38,38,0.8)", marginTop: "0.75rem" }}>{submitError}</p>}
      <div style={{ display: "flex", gap: "0.625rem", marginTop: "1.25rem" }}>
        <button type="button" onClick={onBack} className="btn btn-secondary btn-md" style={{ gap: "0.375rem" }} disabled={submitting}>
          <ArrowLeft style={{ width: "0.875rem", height: "0.875rem" }} /> Zurück
        </button>
        <button type="submit" className="btn btn-primary btn-md" disabled={submitting} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.375rem" }}>
          {submitting ? <><Loader2 className="animate-spin" style={{ width: "0.875rem", height: "0.875rem" }} /> Wird eingereicht…</> : <>{submitLabel || "Antrag einreichen"} <ArrowRight style={{ width: "0.875rem", height: "0.875rem" }} /></>}
        </button>
      </div>
    </form>
  );
}

function FunnelField({ label, value, onChange, type = "text", placeholder = "", hint, required = false, autoComplete, name }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; hint?: string; required?: boolean; autoComplete?: string; name?: string;
}) {
  return (
    <div>
      <label htmlFor={name} style={LABEL_STYLE}>
        {label}{required && <span style={{ color: "var(--color-turquoise)", marginLeft: "2px" }}>*</span>}
      </label>
      <input id={name} type={type} name={name} autoComplete={autoComplete} value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder} className="admin-input" style={{ width: "100%" }} />
      {hint && <p style={{ fontSize: "0.6875rem", color: "var(--color-subtle)", marginTop: "0.25rem" }}>{hint}</p>}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 14.233 17.64 11.926 17.64 9.2z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
      <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.96L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M0 0h8.571v8.571H0z" fill="#F25022" />
      <path d="M9.429 0H18v8.571H9.429z" fill="#7FBA00" />
      <path d="M0 9.429h8.571V18H0z" fill="#00A4EF" />
      <path d="M9.429 9.429H18V18H9.429z" fill="#FFB900" />
    </svg>
  );
}

function FunnelPanel({ offer, amount, term, initialPurpose, onSubmitted, onEstimateChange }: { offer: Offer; amount: number; term: number; initialPurpose?: string; onSubmitted?: (app: { id: string; product_id: string; provider_name: string; product_name: string; volume: number; term_months: number; status: string; metadata: Record<string, unknown>; created_at: string }) => void; onEstimateChange?: (estimate: number) => void }) {
  const productUrl = `/plattform?offer=${offer.product_id}&amount=${amount}&term=${term}`;
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authEmail, setAuthEmail] = useState("");
  const [authSent, setAuthSent] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [schufaConsent, setSchufaConsent] = useState(false);
  const [agbConsent, setAgbConsent] = useState(false);
  const [creditSearchConsent, setCreditSearchConsent] = useState(false);
  const [typeOfPerson, setTypeOfPerson] = useState("DirectorAndBeneficialOwner");
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const [submittedAppId, setSubmittedAppId] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [uploadResults, setUploadResults] = useState<Array<{ name: string; status: string; error?: string }>>([]);

  const [step, setStep] = useState(0);
  const [formKey, setFormKey] = useState(0);
  const [bedarfPhase, setBedarfPhase] = useState(0);
  const [bedarfVolume, setBedarfVolume] = useState(Math.min(offer.max_volume, Math.max(offer.min_volume, amount)));
  const [bedarfTerm, setBedarfTerm] = useState(Math.min(offer.max_term_months, Math.max(offer.min_term_months, term)));
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [applicantEmail, setApplicantEmail] = useState("");
  const [applicantPhone, setApplicantPhone] = useState("");
  const [phoneCountry, setPhoneCountry] = useState("+49");
  const [applicantStreet, setApplicantStreet] = useState("");
  const [applicantZip, setApplicantZip] = useState("");
  const [applicantCity, setApplicantCity] = useState("");
  const [orgName, setOrgName] = useState("");
  const [orgHrb, setOrgHrb] = useState("");
  const [orgUstId, setOrgUstId] = useState("");
  const [orgCrefo, setOrgCrefo] = useState("");
  const [orgTurnover, setOrgTurnover] = useState<number | null>(null);
  const [orgWebpage, setOrgWebpage] = useState("");
  const [orgStreet, setOrgStreet] = useState("");
  const [orgZip, setOrgZip] = useState("");
  const [orgCity, setOrgCity] = useState("");
  const [purpose, setPurpose] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("funnel_purpose");
      if (saved) return saved;
    }
    return initialPurpose ?? "WORKING_CAPITAL";
  });
  const [purposeManual, setPurposeManual] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchStatus, setSearchStatus] = useState<"idle" | "ok" | "error">("idle");
  const [showOrgFields, setShowOrgFields] = useState(false);
  const [companyMode, setCompanyMode] = useState<"search" | "url" | "manual">("search");
  const [companySuggestions, setCompanySuggestions] = useState<Array<{ name: string; long_crefo_number: string; street_address: string; house_number: string; zip_code: string; city: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);


  const isLastStep = step === FUNNEL_STEPS.length - 1;

  const stepSummaries = [
    purpose ? `${formatCurrency(bedarfVolume)} · ${bedarfTerm} Mon. · ${PURPOSE_OPTIONS.find(p => p.value === purpose)?.label ?? ""}` : null,
    orgTurnover ? `Ø ${formatCurrency(orgTurnover)} / Monat` : null,
    orgName ? `${orgName}${orgCity ? ` · ${orgCity}` : ""}` : null,
    firstName ? `${firstName} ${lastName}${applicantCity ? ` · ${applicantCity}` : ""}` : null,
  ];

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const wasLoggedOut = !user;
      setUser(session?.user ?? null);
      setAuthLoading(false);
      if (session?.user && wasLoggedOut && (event === "SIGNED_IN" || event === "USER_UPDATED")) {
        trackEvent("signup_completed", { method: session.user.app_metadata?.provider ?? "unknown" });
      }
    });
    return () => subscription.unsubscribe();
  }, []);


  const { trackEvent } = useTracking();

  // Prefill funnel fields from user profile + company data
  useEffect(() => {
    if (!user) return;
    // Seed from OAuth metadata immediately (fast, no network)
    const meta = user.user_metadata ?? {};
    const fullName: string = meta.full_name ?? meta.name ?? "";
    const parts = fullName.trim().split(" ");
    if (!firstName && parts.length > 0) setFirstName(parts[0]);
    if (!lastName && parts.length > 1) setLastName(parts.slice(1).join(" "));
    if (!applicantEmail && user.email) setApplicantEmail(user.email);

    // Then fetch DB profile (overrides metadata if richer data exists)
    async function fetchProfile() {
      const [profileRes, memberRes] = await Promise.all([
        supabase.from("users").select("first_name, last_name, phone, email, metadata").eq("id", user!.id).maybeSingle(),
        supabase.from("company_members").select("company_id").eq("user_id", user!.id).limit(1).maybeSingle(),
      ]);

      if (profileRes.data) {
        const d = profileRes.data;
        const m = (d.metadata ?? {}) as Record<string, string>;
        if (d.first_name) setFirstName(d.first_name);
        if (d.last_name)  setLastName(d.last_name);
        if (d.email)      setApplicantEmail(d.email);
        if (d.phone && !applicantPhone) {
          // Strip country code prefix if present
          const phoneStr = d.phone as string;
          const matchedCode = COUNTRY_CODES.find(c => phoneStr.startsWith(c.code));
          if (matchedCode) {
            setPhoneCountry(matchedCode.code);
            setApplicantPhone(phoneStr.slice(matchedCode.code.length));
          } else {
            setApplicantPhone(phoneStr);
          }
        }
        if (m.date_of_birth && !dateOfBirth) setDateOfBirth(m.date_of_birth);
        if (m.street && !applicantStreet)    setApplicantStreet(m.street);
        if (m.zip && !applicantZip)          setApplicantZip(m.zip);
        if (m.city && !applicantCity)        setApplicantCity(m.city);
      }

      if (memberRes.data?.company_id) {
        const { data: co } = await supabase
          .from("companies")
          .select("name, crefo, hrb, ust_id, website, address, annual_revenue")
          .eq("id", memberRes.data.company_id)
          .maybeSingle();
        if (co) {
          const addr = (co.address ?? {}) as Record<string, string>;
          if (co.name    && !orgName)     { setOrgName(co.name); setShowOrgFields(true); setCompanyMode("manual"); }
          if (co.crefo   && !orgCrefo)    setOrgCrefo(co.crefo);
          if (co.hrb     && !orgHrb)      setOrgHrb(co.hrb);
          if (co.ust_id  && !orgUstId)    setOrgUstId(co.ust_id);
          if (co.website && !orgWebpage)  setOrgWebpage(co.website);
          if (addr.street && !orgStreet)  setOrgStreet(addr.street);
          if (addr.zip    && !orgZip)     setOrgZip(addr.zip);
          if (addr.city   && !orgCity)    setOrgCity(addr.city);
          if (co.annual_revenue && !orgTurnover) setOrgTurnover(Math.round(co.annual_revenue / 12));
        }
      }
      return profileRes.data;
    }
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function handleOAuth() {
    trackEvent("signup_start", { method: "google" });
    setOauthLoading("google");
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(productUrl)}` },
    });
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!authEmail) return;
    trackEvent("signup_start", { method: "magic_link" });
    setOauthLoading("email");
    await supabase.auth.signInWithOtp({
      email: authEmail,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(productUrl)}` },
    });
    setAuthSent(true);
    setOauthLoading(null);
  }

  function handleOrgNameChange(value: string) {
    setOrgName(value);
    if (isYouLend) {
      const detected = detectLegalForm(value);
      if (detected) setYlCompanyType(detected);
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.length < 3) { setCompanySuggestions([]); setShowSuggestions(false); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/crefo-lookup`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}` },
          body: JSON.stringify({ query: value }),
        });
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setCompanySuggestions(json.data.slice(0, 5));
          setShowSuggestions(json.data.length > 0);
        }
      } catch { setCompanySuggestions([]); }
    }, 300);
  }

  function detectLegalForm(name: string): string {
    const n = name.toLowerCase();
    if (n.includes("gmbh & co. kg") || n.includes("gmbh & co kg")) return "GmbH & Co. KG";
    if (n.includes("ug & co. kg") || n.includes("ug & co kg")) return "UG & Co. KG";
    if (n.includes("ug ")) return "UG";
    if (n.includes("gmbh") || n.includes("mbh")) return "GmbH";
    if (n.includes("e.k.") || n.includes("e. k.") || n.includes("e.kfm") || n.includes("e.kfr")) return "e.K.";
    if (n.includes("kgaa") || n.includes("kgaa")) return "KG";
    if (n.includes(" kg")) return "KG";
    if (n.includes(" ohg")) return "OHG";
    if (n.includes(" gbr") || n.includes("g.b.r.")) return "GbR";
    if (n.includes(" ag") || n.endsWith(" ag")) return "AG";
    if (n.includes(" se") || n.endsWith(" se")) return "SE";
    if (n.includes("partg") || n.includes("partnerschaft")) return "PartG";
    if (n.includes(" eg") || n.includes("e.g.") || n.includes("genossenschaft")) return "eG";
    if (n.includes(" ltd")) return "Ltd";
    if (n.includes("e.v.") || n.includes("e. v.")) return "";
    return "";
  }

  function selectCompany(c: typeof companySuggestions[0]) {
    setOrgName(c.name);
    if (c.long_crefo_number) setOrgCrefo(c.long_crefo_number);
    const street = [c.street_address, c.house_number].filter(Boolean).join(" ");
    if (street) setOrgStreet(street);
    if (c.zip_code) setOrgZip(c.zip_code);
    if (c.city) setOrgCity(c.city);
    const detected = detectLegalForm(c.name);
    if (detected) setYlCompanyType(detected);
    setCompanySuggestions([]); setShowSuggestions(false);
    setCompanyMode("manual"); setShowOrgFields(true);
  }

  // Close suggestions on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) setShowSuggestions(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function lookupCrefo(companyName: string) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/crefo-lookup`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ query: companyName }),
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        const match = json.data[0];
        if (match.long_crefo_number) setOrgCrefo(match.long_crefo_number);
      }
    } catch { /* best-effort */ }
  }

  async function handleCompanySearch() {
    if (!orgWebpage) return;
    const url = /^https?:\/\//i.test(orgWebpage) ? orgWebpage : `https://${orgWebpage}`;
    if (url !== orgWebpage) setOrgWebpage(url);
    setSearchLoading(true);
    setSearchStatus("idle");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/company-search`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ website: url }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        const d = json.data;
        if (d.name) setOrgName(d.name);
        if (d.hrb) setOrgHrb(d.hrb);
        if (d.ustId) setOrgUstId(d.ustId);
        if (d.address?.street) setOrgStreet(d.address.street);
        if (d.address?.zip) setOrgZip(d.address.zip);
        if (d.address?.city) setOrgCity(d.address.city);
        setSearchStatus("ok");
        setShowOrgFields(true); setCompanyMode("manual");
      } else {
        setSearchStatus("error");
        setShowOrgFields(true);
      }
    } catch { setSearchStatus("error"); setShowOrgFields(true); }
    finally { setSearchLoading(false); }
  }

  // Fire-and-forget: persist org data to DB profile if logged in
  async function syncOrg({ withTurnover = false } = {}) {
    if (!user || !orgName) return;
    await supabase.rpc("get_or_create_company", {
      p_name: orgName,
      p_legal_form: ylCompanyType || null,
      p_crefo: orgCrefo || null,
      p_hrb: orgHrb || null,
      p_ust_id: orgUstId || null,
      p_website: orgWebpage || null,
      p_street: orgStreet || null,
      p_zip: orgZip || null,
      p_city: orgCity || null,
      p_monthly_revenue: withTurnover ? orgTurnover : null,
    });
  }

  const isYouLend = offer.provider_name === "YouLend";
  const [ylCompanyType, setYlCompanyType] = useState("");

  function handleNext() {
    if (step === 2 && companyMode === "url" && orgWebpage && !showOrgFields) {
      handleCompanySearch();
      return;
    }
    if (step === 2) {
      trackEvent("funnel_step", { step: "unternehmen", orgName, orgCity });
      syncOrg({ withTurnover: true });
    }
    // YouLend: skip Umsatz step (step 1), calculator already captures revenue
    if (isYouLend && step === 0) {
      setStep(2);
      return;
    }
    setStep(s => s + 1);
  }

  const step2Valid = companyMode === "search" ? orgName.length >= 3 : companyMode === "url" ? !!orgWebpage : !!(orgName && orgStreet && orgCity);

  async function doSubmit(data: PersonalData) {
    setSubmitting(true); setSubmitError(null);
    try {
      await supabase.rpc("upsert_user_profile", {
        p_first_name: data.firstName, p_last_name: data.lastName,
        p_phone: buildPhone(data.phone, data.phoneCountry),
        p_dob: data.dateOfBirth,
        p_street: data.street, p_zip: data.zip, p_city: data.city,
        p_applicant_email: data.email,
      });

      const { data: companyId, error: e1 } = await supabase.rpc("get_or_create_company", {
        p_name: orgName, p_legal_form: ylCompanyType || null, p_crefo: orgCrefo, p_hrb: orgHrb, p_ust_id: orgUstId,
        p_website: orgWebpage, p_street: orgStreet, p_zip: orgZip, p_city: orgCity,
        p_monthly_revenue: orgTurnover,
      });
      if (e1) throw e1;

      const { data: inquiryId, error: e2 } = await supabase.rpc("create_inquiry", {
        p_company_id: companyId,
        p_volume: bedarfVolume, p_term_months: bedarfTerm, p_purpose: purpose,
        p_metadata: { purpose_manual: purposeManual || null },
      });
      if (e2) throw e2;

      const { data: applicationId, error: e3 } = await supabase.rpc("submit_application", {
        p_inquiry_id: inquiryId, p_product_id: offer.product_id,
      });
      if (e3) throw e3;

      setSubmittedAppId(applicationId as string);

      // Call provider Edge Function if available
      const providerSlug = PROVIDER_SLUGS[offer.provider_name];
      if (providerSlug && applicationId) {
        const fnBody: Record<string, unknown> = { action: "submit", application_id: applicationId };
        // YouLend-specific extra data
        if (providerSlug === "youlend") {
          fnBody.extra = {
            confirmedCreditSearch: creditSearchConsent,
            typeOfPerson,
            ylCompanyType,
          };
        }
        const { data: fnResult, error: fnError } = await supabase.functions.invoke(`provider-${providerSlug}`, {
          body: fnBody,
        });
        if (fnError) console.error(`[provider-${providerSlug}]`, fnError);
        else if (fnResult && !fnResult.success) console.error(`[provider-${providerSlug}]`, fnResult.error);
        else if (fnResult?.data?.openBankingURL) setRedirectUrl(fnResult.data.openBankingURL);
      }

      trackEvent("funnel_submit", { product_id: offer.product_id, provider_name: offer.provider_name });
      onSubmitted?.({
        id: applicationId as string,
        product_id: offer.product_id,
        provider_name: offer.provider_name,
        product_name: offer.product_name,
        volume: bedarfVolume,
        term_months: bedarfTerm,
        status: "new",
        metadata: {},
        created_at: new Date().toISOString(),
      });
      // YouLend: go to Step 5 (bank data) instead of showing submitted view
      if (isYouLend) {
        setStep(5);
      } else {
        setSubmitted(true);
      }
    } catch (err) {
      console.error("[doSubmit]", err);
      setSubmitError("Fehler beim Einreichen. Bitte versuchen Sie es erneut.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      style={{ borderTop: "2px solid var(--color-light-bg)" }}
    >
      {/* Auth gate — shown before funnel if not logged in */}
      {!authLoading && !user && (
        <div style={{ padding: "1.5rem 1.25rem" }}>
          <p style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--color-dark)", marginBottom: "0.25rem" }}>Anmelden oder Konto erstellen</p>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-subtle)", marginBottom: "1.25rem" }}>Um einen Antrag einzureichen, benötigen Sie ein Konto.</p>
          {authSent ? (
            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
              <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "50%", background: "rgba(80,122,166,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Check style={{ width: "1.25rem", height: "1.25rem", color: "var(--color-turquoise)" }} />
              </div>
              <div>
                <p style={{ fontSize: "0.875rem", color: "var(--color-dark)", lineHeight: 1.5, marginBottom: "0.25rem" }}>
                  Wir haben einen Link an <strong>{authEmail}</strong> geschickt.
                </p>
                <p style={{ fontSize: "0.8125rem", color: "var(--color-subtle)", lineHeight: 1.5, marginBottom: "0.5rem" }}>
                  Bestätigen Sie die E-Mail, um fortzufahren.
                </p>
                <button type="button" onClick={() => setAuthSent(false)} style={{ fontSize: "0.8125rem", color: "var(--color-turquoise)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Andere E-Mail</button>
              </div>
            </div>
          ) : (
            <>
              <button type="button" className="auth-oauth-btn" style={{ width: "100%", marginBottom: "0.75rem" }} onClick={handleOAuth} disabled={oauthLoading !== null}>
                <GoogleIcon />{oauthLoading === "google" ? "Weiterleitung…" : "Mit Google anmelden"}
              </button>
              <div className="auth-divider">oder</div>
              <form onSubmit={handleMagicLink} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <input type="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} placeholder="ihre@email.de" required className="admin-input" style={{ flex: 1, minWidth: "180px" }} />
                <button type="submit" className="btn btn-primary btn-md" disabled={oauthLoading !== null || !authEmail} style={{ whiteSpace: "nowrap" }}>
                  {oauthLoading === "email" ? "…" : "Weiter"}
                </button>
              </form>
              <p style={{ fontSize: "0.75rem", color: "var(--color-subtle)", lineHeight: 1.5, marginTop: "1rem" }}>
                Mit der Anmeldung bestätige ich, dass ich die <a href="/datenschutz" target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ color: "var(--color-turquoise)", textDecoration: "underline" }}>Datenschutzbestimmungen</a> zur Kenntnis genommen habe.
              </p>
            </>
          )}
        </div>
      )}

      {/* Funnel steps — only shown when logged in */}
      {!authLoading && user && (
        <div className="funnel-two-col">
          {/* Left: step navigation */}
          <div className="funnel-nav">
            {(() => { let visibleIdx = 0; return FUNNEL_STEPS.map((s, i) => {
              if (isYouLend && i === 1) return null;
              if (!isYouLend && i === 5) return null;
              const stepNum = ++visibleIdx;
              const isActive = i === step;
              const isDone = i < step;
              const isFuture = i > step;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => { if (isDone) { setStep(i); setFormKey(k => k + 1); } }}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: "0.75rem",
                    padding: "0.75rem 1rem", background: isActive ? "#fff" : "none",
                    border: "none", borderRadius: "0.625rem",
                    cursor: isDone ? "pointer" : "default", textAlign: "left",
                    opacity: isFuture ? 0.45 : 1, transition: "all 0.25s",
                    boxShadow: isActive ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
                  }}
                >
                  <span style={{
                    width: "1.75rem", height: "1.75rem", borderRadius: "50%", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.75rem", fontWeight: 700,
                    background: isDone ? "var(--color-turquoise)" : isActive ? "var(--color-dark)" : "var(--color-border)",
                    color: isDone || isActive ? "#fff" : "var(--color-subtle)",
                    transition: "background 0.3s",
                  }}>
                    {isDone ? <Check style={{ width: "0.875rem", height: "0.875rem" }} /> : stepNum}
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: "0.8125rem", fontWeight: isActive ? 700 : 600, color: "var(--color-dark)" }}>{s.title}</span>
                    {isDone && stepSummaries[i] && (
                      <span style={{ display: "block", fontSize: "0.6875rem", color: "var(--color-subtle)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{stepSummaries[i]}</span>
                    )}
                    {isActive && (
                      <span style={{ display: "block", fontSize: "0.6875rem", color: "var(--color-subtle)" }}>{s.sub}</span>
                    )}
                  </span>
                </button>
              );
            }); })()}
          </div>

          {/* Right: active step content */}
          <div className="funnel-content">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                {(() => {
                  const i = step;
                  return (<>
                          {/* Step 0: Ihre Anfrage — sequential reveal */}
                          {i === 0 && (
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>

                              {/* Phase 0: Volumen (YouLend: calculator, others: number input) */}
                              {bedarfPhase > 0 ? (
                                <button type="button" onClick={() => setBedarfPhase(0)} style={{ textAlign: "left", padding: "0.5rem 0.875rem", borderRadius: "0.625rem", border: "1.5px solid var(--color-border)", background: "var(--color-light-bg)", fontSize: "0.875rem", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                                  <span style={{ fontWeight: 600 }}>{formatCurrency(bedarfVolume)}</span>
                                  <span style={{ fontSize: "0.75rem", color: "var(--color-subtle)" }}>Ändern</span>
                                </button>
                              ) : offer.provider_name === "YouLend" ? (
                                <YouLendCalculator
                                  initialRevenue={bedarfVolume > 0 ? Math.round(bedarfVolume / 10) : 10000}
                                  maxVolume={offer.max_volume}
                                  onContinue={(estimate) => { setBedarfVolume(estimate); setStep(2); }}
                                  onEstimateChange={onEstimateChange}
                                />
                              ) : (
                                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                                  <label style={LABEL_STYLE}>Wie viel Kapital benötigen Sie?</label>
                                  <div style={{ position: "relative", marginTop: "0.375rem" }}>
                                    <GermanNumberInput
                                      value={bedarfVolume} min={offer.min_volume} max={offer.max_volume} step={1000}
                                      onChange={n => setBedarfVolume(n ?? offer.min_volume)}
                                      onEnter={() => setBedarfPhase(1)}
                                      className="admin-input" style={{ width: "100%", paddingRight: "2rem" }}
                                    />
                                    <span style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", fontSize: "0.875rem", color: "var(--color-subtle)", pointerEvents: "none" }}>€</span>
                                  </div>
                                  <p style={{ fontSize: "0.6875rem", color: "var(--color-subtle)", marginTop: "0.25rem" }}>{formatCurrency(offer.min_volume)} – {formatCurrency(offer.max_volume)}</p>
                                  <button type="button" onClick={() => { setBedarfPhase(1); }} className="btn btn-primary btn-md" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.25rem", marginTop: "0.5rem" }}>
                                    Weiter <ArrowRight style={{ width: "0.875rem", height: "0.875rem" }} />
                                  </button>
                                </motion.div>
                              )}

                              {/* Phase 1: Laufzeit */}
                              <AnimatePresence>
                                {bedarfPhase >= 1 && (
                                  <motion.div key="laufzeit" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                                    {bedarfPhase > 1 ? (
                                      <button type="button" onClick={() => setBedarfPhase(1)} style={{ textAlign: "left", padding: "0.5rem 0.875rem", borderRadius: "0.625rem", border: "1.5px solid var(--color-border)", background: "var(--color-light-bg)", fontSize: "0.875rem", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                                        <span style={{ fontWeight: 600 }}>{bedarfTerm} Monate</span>
                                        <span style={{ fontSize: "0.75rem", color: "var(--color-subtle)" }}>Ändern</span>
                                      </button>
                                    ) : (
                                      <div>
                                        <label style={LABEL_STYLE}>Über welchen Zeitraum?</label>
                                        <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap", marginTop: "0.375rem" }}>
                                          {TERM_OPTIONS.filter(t => t >= offer.min_term_months && t <= offer.max_term_months).map(t => (
                                            <button key={t} type="button" onClick={() => setBedarfTerm(t)}
                                              style={{ padding: "0.5rem 0.875rem", borderRadius: "0.625rem", border: `1.5px solid ${bedarfTerm === t ? "var(--color-turquoise)" : "var(--color-border)"}`, background: bedarfTerm === t ? "rgba(80,122,166,0.06)" : "#fff", fontWeight: bedarfTerm === t ? 600 : 400, fontSize: "0.875rem", cursor: "pointer" }}>
                                              {t}M
                                            </button>
                                          ))}
                                        </div>
                                        <button type="button" onClick={() => { setBedarfPhase(2); }} className="btn btn-primary btn-md" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.25rem", marginTop: "0.5rem" }}>
                                          Weiter <ArrowRight style={{ width: "0.875rem", height: "0.875rem" }} />
                                        </button>
                                      </div>
                                    )}
                                  </motion.div>
                                )}
                              </AnimatePresence>

                              {/* Phase 2: Verwendungszweck */}
                              <AnimatePresence>
                                {bedarfPhase >= 2 && (
                                  <motion.div key="zweck" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                                    <label style={{ ...LABEL_STYLE, marginBottom: "0.5rem" }}>Wofür benötigen Sie das Kapital?</label>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", marginTop: "0.375rem" }}>
                                      {PURPOSE_OPTIONS.map(({ value, label }) => (
                                        <button key={value} type="button" onClick={() => {
                                          setPurpose(value); localStorage.setItem("funnel_purpose", value);
                                        }} style={{ width: "100%", textAlign: "left", padding: "0.625rem 0.875rem", borderRadius: "0.625rem", border: `1.5px solid ${purpose === value ? "var(--color-turquoise)" : "var(--color-border)"}`, background: purpose === value ? "rgba(80,122,166,0.06)" : "#fff", color: "var(--color-dark)", fontSize: "0.875rem", fontWeight: purpose === value ? 600 : 400, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", transition: "border-color 0.15s" }}>
                                          {label}
                                          {purpose === value && <Check style={{ width: "0.875rem", height: "0.875rem", color: "var(--color-turquoise)", flexShrink: 0 }} />}
                                        </button>
                                      ))}
                                      {purpose === "OTHER" && (
                                        <textarea value={purposeManual} onChange={e => setPurposeManual(e.target.value)} placeholder="Beschreiben Sie den Verwendungszweck…" maxLength={200} rows={3} style={{ marginTop: "0.25rem", padding: "0.625rem 0.875rem", border: "1.5px solid var(--color-border)", borderRadius: "0.625rem", fontSize: "0.875rem", resize: "vertical", outline: "none", width: "100%", fontFamily: "inherit" }} />
                                      )}
                                    </div>
                                    <button type="button" onClick={() => { trackEvent("funnel_step", { step: "anfrage", volume: bedarfVolume, term: bedarfTerm, purpose }); setStep(s => s + 1); }} disabled={!purpose} className="btn btn-primary btn-md" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.25rem", marginTop: "0.5rem" }}>
                                      Weiter <ArrowRight style={{ width: "0.875rem", height: "0.875rem" }} />
                                    </button>
                                  </motion.div>
                                )}
                              </AnimatePresence>

                              <p style={{ textAlign: "center", fontSize: "0.6875rem", color: "var(--color-subtle)", marginTop: "0.25rem" }}>Kostenlos & unverbindlich · DSGVO-konform</p>
                            </div>
                          )}

                          {/* Step 1: Ihr Umsatz */}
                          {i === 1 && (
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                              <div>
                                <label style={LABEL_STYLE}>Wie hoch ist Ihr durchschnittlicher Monatsumsatz?</label>
                                <div style={{ position: "relative", marginTop: "0.375rem" }}>
                                  <GermanNumberInput
                                    value={orgTurnover} min={1} max={10_000_000} step={1000}
                                    onChange={setOrgTurnover}
                                    onEnter={() => { if (orgTurnover) { trackEvent("funnel_step", { step: "umsatz", turnover: orgTurnover }); syncOrg({ withTurnover: true }); setStep(s => s + 1); } }}
                                    placeholder="20.000"
                                    className="admin-input" style={{ width: "100%", paddingRight: "2rem" }}
                                  />
                                  <span style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", fontSize: "0.875rem", color: "var(--color-subtle)", pointerEvents: "none" }}>€</span>
                                </div>
                              </div>
                              <div style={{ display: "flex", gap: "0.625rem" }}>
                                <button type="button" onClick={() => setStep(s => s - 1)} className="btn btn-secondary btn-md" style={{ gap: "0.375rem" }}>
                                  <ArrowLeft style={{ width: "0.875rem", height: "0.875rem" }} /> Zurück
                                </button>
                                <button type="button" onClick={() => { trackEvent("funnel_step", { step: "umsatz", turnover: orgTurnover }); syncOrg({ withTurnover: true }); setStep(s => s + 1); }} disabled={!orgTurnover} className="btn btn-primary btn-md" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.375rem" }}>
                                  Weiter <ArrowRight style={{ width: "0.875rem", height: "0.875rem" }} />
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Step 2: Ihr Unternehmen — full version (all providers) */}
                          {i === 2 && (
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>

                              {/* Mode: Search by name */}
                              {companyMode === "search" && (
                                <>
                                  <div ref={suggestionsRef} style={{ position: "relative" }}>
                                    <FunnelField label="Firmenname" value={orgName} onChange={handleOrgNameChange} placeholder="Firmenname eingeben…" required />
                                    {showSuggestions && companySuggestions.length > 0 && (
                                      <div style={{
                                        position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50,
                                        background: "#fff", border: "1px solid var(--color-border)", borderRadius: "0.75rem",
                                        boxShadow: "0 8px 24px rgba(0,0,0,0.12)", marginTop: "0.25rem", overflow: "hidden",
                                      }}>
                                        {companySuggestions.map((c, idx) => (
                                          <button
                                            key={idx}
                                            type="button"
                                            onClick={() => selectCompany(c)}
                                            style={{
                                              width: "100%", textAlign: "left", padding: "0.625rem 0.875rem",
                                              background: "none", border: "none", cursor: "pointer",
                                              borderBottom: idx < companySuggestions.length - 1 ? "1px solid var(--color-border)" : "none",
                                              fontSize: "0.875rem", color: "var(--color-dark)",
                                            }}
                                            onMouseEnter={e => (e.currentTarget.style.background = "var(--color-light-bg)")}
                                            onMouseLeave={e => (e.currentTarget.style.background = "none")}
                                          >
                                            <span style={{ fontWeight: 600 }}>{c.name}</span>
                                            <span style={{ display: "block", fontSize: "0.75rem", color: "var(--color-subtle)", marginTop: "0.125rem" }}>
                                              {[c.street_address, c.house_number].filter(Boolean).join(" ")}{c.zip_code || c.city ? ", " : ""}{[c.zip_code, c.city].filter(Boolean).join(" ")}
                                            </span>
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  <div style={{ display: "flex", gap: "1rem" }}>
                                    <button type="button" onClick={() => setCompanyMode("url")} style={{ fontSize: "0.8125rem", color: "var(--color-subtle)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                                      Per Website suchen
                                    </button>
                                    <button type="button" onClick={() => { setCompanyMode("manual"); setShowOrgFields(true); }} style={{ fontSize: "0.8125rem", color: "var(--color-subtle)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                                      Manuell anlegen
                                    </button>
                                  </div>
                                </>
                              )}

                              {/* Mode: Search by URL */}
                              {companyMode === "url" && (
                                <>
                                  <div>
                                    <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-subtle)", marginBottom: "0.375rem" }}>Website</label>
                                    <div style={{ display: "flex", gap: "0.5rem" }}>
                                      <input type="text" value={orgWebpage} onChange={e => { setOrgWebpage(e.target.value); setSearchStatus("idle"); }} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleCompanySearch(); } }} placeholder="example.de" className="admin-input" style={{ flex: 1 }} />
                                      <button type="button" onClick={handleCompanySearch} disabled={!orgWebpage || searchLoading} className="btn btn-secondary btn-md" style={{ whiteSpace: "nowrap", gap: "0.375rem", flexShrink: 0 }}>
                                        {searchLoading ? <Loader2 className="animate-spin" style={{ width: "1rem", height: "1rem" }} /> : <Search style={{ width: "1rem", height: "1rem" }} />}
                                        {searchLoading ? "Suche…" : "Ausfüllen"}
                                      </button>
                                    </div>
                                    {searchStatus === "ok" && <p style={{ fontSize: "0.6875rem", color: "var(--color-turquoise)", marginTop: "0.25rem" }}>Firmendaten eingetragen – bitte prüfen und bestätigen.</p>}
                                    {searchStatus === "error" && <p style={{ fontSize: "0.6875rem", color: "rgba(220,38,38,0.8)", marginTop: "0.25rem" }}>Keine Daten gefunden – bitte manuell ausfüllen.</p>}
                                  </div>
                                  <div style={{ display: "flex", gap: "1rem" }}>
                                    <button type="button" onClick={() => setCompanyMode("search")} style={{ fontSize: "0.8125rem", color: "var(--color-subtle)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                                      Per Name suchen
                                    </button>
                                    <button type="button" onClick={() => { setCompanyMode("manual"); setShowOrgFields(true); }} style={{ fontSize: "0.8125rem", color: "var(--color-subtle)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                                      Manuell anlegen
                                    </button>
                                  </div>
                                </>
                              )}

                              {/* Mode: Manual — show all fields */}
                              {companyMode === "manual" && (
                                <>
                                  <div onKeyDown={stepKeyDown(handleNext)} style={{ display: "flex", flexDirection: "column", gap: "0.875rem", paddingTop: "0.25rem" }}>
                                    <div>
                                      <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-subtle)", marginBottom: "0.375rem" }}>Website</label>
                                      <div style={{ display: "flex", gap: "0.5rem" }}>
                                        <input type="text" value={orgWebpage} onChange={e => { setOrgWebpage(e.target.value); setSearchStatus("idle"); }} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleCompanySearch(); } }} placeholder="example.de" className="admin-input" style={{ flex: 1 }} />
                                        <button type="button" onClick={handleCompanySearch} disabled={!orgWebpage || searchLoading} className="btn btn-secondary btn-md" style={{ whiteSpace: "nowrap", gap: "0.375rem", flexShrink: 0 }}>
                                          {searchLoading ? <Loader2 className="animate-spin" style={{ width: "1rem", height: "1rem" }} /> : <Search style={{ width: "1rem", height: "1rem" }} />}
                                          {searchLoading ? "Suche…" : "Ausfüllen"}
                                        </button>
                                      </div>
                                      {searchStatus === "ok" && <p style={{ fontSize: "0.6875rem", color: "var(--color-turquoise)", marginTop: "0.25rem" }}>Firmendaten eingetragen.</p>}
                                      {searchStatus === "error" && <p style={{ fontSize: "0.6875rem", color: "rgba(220,38,38,0.8)", marginTop: "0.25rem" }}>Keine Daten gefunden.</p>}
                                    </div>
                                    <div ref={suggestionsRef} style={{ position: "relative" }}>
                                      <FunnelField label="Firmenname" value={orgName} onChange={handleOrgNameChange} placeholder="Example GmbH" required />
                                      {showSuggestions && companySuggestions.length > 0 && (
                                        <div style={{
                                          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50,
                                          background: "#fff", border: "1px solid var(--color-border)", borderRadius: "0.75rem",
                                          boxShadow: "0 8px 24px rgba(0,0,0,0.12)", marginTop: "0.25rem", overflow: "hidden",
                                        }}>
                                          {companySuggestions.map((c, idx) => (
                                            <button
                                              key={idx}
                                              type="button"
                                              onClick={() => selectCompany(c)}
                                              style={{
                                                width: "100%", textAlign: "left", padding: "0.625rem 0.875rem",
                                                background: "none", border: "none", cursor: "pointer",
                                                borderBottom: idx < companySuggestions.length - 1 ? "1px solid var(--color-border)" : "none",
                                                fontSize: "0.875rem", color: "var(--color-dark)",
                                              }}
                                              onMouseEnter={e => (e.currentTarget.style.background = "var(--color-light-bg)")}
                                              onMouseLeave={e => (e.currentTarget.style.background = "none")}
                                            >
                                              <span style={{ fontWeight: 600 }}>{c.name}</span>
                                              <span style={{ display: "block", fontSize: "0.75rem", color: "var(--color-subtle)", marginTop: "0.125rem" }}>
                                                {[c.street_address, c.house_number].filter(Boolean).join(" ")}{c.zip_code || c.city ? ", " : ""}{[c.zip_code, c.city].filter(Boolean).join(" ")}
                                              </span>
                                            </button>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                    {isYouLend && (
                                      <div>
                                        <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-subtle)", marginBottom: "0.375rem" }}>Rechtsform<span style={{ color: "var(--color-turquoise)", marginLeft: "2px" }}>*</span></label>
                                        <select value={ylCompanyType} onChange={e => setYlCompanyType(e.target.value)} className="admin-input" style={{ width: "100%" }}>
                                          <option value="">Bitte wählen…</option>
                                          {YL_COMPANY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                        </select>
                                      </div>
                                    )}
                                    <FunnelField label="Crefo-Nummer" value={orgCrefo} onChange={setOrgCrefo} placeholder="3XXXXXXXX9" hint="Creditreform-Nummer" />
                                    <FunnelField label="HRB-Nummer" value={orgHrb} onChange={setOrgHrb} placeholder="HRB 12345" hint="Handelsregisternummer (optional)" />
                                    <FunnelField label="USt-IdNr." value={orgUstId} onChange={setOrgUstId} placeholder="DE123456789" />
                                    <div style={{ borderTop: "1px solid var(--color-light-bg)", paddingTop: "0.875rem", display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                                      <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-subtle)", margin: 0 }}>Unternehmensanschrift</p>
                                      <FunnelField label="Straße und Hausnummer" value={orgStreet} onChange={setOrgStreet} placeholder="Beispielstraße 123" required />
                                      <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: "0.75rem" }}>
                                        <FunnelField label="PLZ" value={orgZip} onChange={setOrgZip} placeholder="10115" required />
                                        <FunnelField label="Stadt" value={orgCity} onChange={setOrgCity} placeholder="Berlin" required />
                                      </div>
                                    </div>
                                  </div>
                                  <button type="button" onClick={() => setCompanyMode("search")} style={{ fontSize: "0.8125rem", color: "var(--color-subtle)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                                    Stattdessen suchen
                                  </button>
                                </>
                              )}

                            </div>
                          )}

                          {/* Step 3: Persönliche Daten + Anschrift (all providers) */}
                          {i === 3 && !submitted && (
                            <PersonalDataForm
                              key={`personal-${formKey}`}
                              defaults={{ firstName, lastName, email: applicantEmail, phone: applicantPhone, phoneCountry, dateOfBirth, street: applicantStreet, zip: applicantZip, city: applicantCity }}
                              onSubmit={async (data) => {
                                setFirstName(data.firstName); setLastName(data.lastName);
                                setDateOfBirth(data.dateOfBirth); setApplicantEmail(data.email);
                                setApplicantPhone(data.phone); setPhoneCountry(data.phoneCountry);
                                setApplicantStreet(data.street); setApplicantZip(data.zip); setApplicantCity(data.city);

                                trackEvent("funnel_step", { step: "persoenliche_daten" });
                                setStep(4);
                              }}
                              onBack={() => setStep(s => s - 1)}
                              submitting={false}
                              submitError={null}
                              submitLabel="Weiter"
                            />
                          )}

                          {/* Step 4: Zusammenfassung — all providers */}
                          {i === 4 && !submitted && (
                            <div>
                              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                <div style={{ padding: "0.875rem", borderRadius: "0.75rem", border: "1px solid var(--color-border)" }}>
                                  <p style={{ fontSize: "0.6875rem", color: "var(--color-subtle)", marginBottom: "0.375rem" }}>Anfrage</p>
                                  <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-dark)" }}>
                                    {formatCurrency(bedarfVolume)}{!isYouLend && <> · {bedarfTerm} Monate · {PURPOSE_OPTIONS.find(p => p.value === purpose)?.label ?? "–"}</>}
                                  </p>
                                </div>
                                <div style={{ padding: "0.875rem", borderRadius: "0.75rem", border: "1px solid var(--color-border)" }}>
                                  <p style={{ fontSize: "0.6875rem", color: "var(--color-subtle)", marginBottom: "0.375rem" }}>Unternehmen</p>
                                  <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-dark)" }}>
                                    {orgName || "–"}{orgCity ? ` · ${orgCity}` : ""}{orgTurnover ? ` · ${formatCurrency(orgTurnover)}/Mon.` : ""}
                                  </p>
                                </div>
                                <div style={{ padding: "0.875rem", borderRadius: "0.75rem", border: "1px solid var(--color-border)" }}>
                                  <p style={{ fontSize: "0.6875rem", color: "var(--color-subtle)", marginBottom: "0.375rem" }}>Persönliche Daten</p>
                                  <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-dark)" }}>
                                    {firstName} {lastName} · {applicantEmail}
                                  </p>
                                </div>
                              </div>

                              <div style={{ marginTop: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                <div style={{ padding: "0.875rem", borderRadius: "0.75rem", background: "rgba(80,122,166,0.05)", border: "1px solid var(--color-border)" }}>
                                  <label style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", cursor: "pointer" }}>
                                    <input type="checkbox" checked={agbConsent} onChange={e => setAgbConsent(e.target.checked)}
                                      style={{ marginTop: "0.125rem", accentColor: "var(--color-turquoise)" }} />
                                    <span style={{ fontSize: "0.8125rem", color: "var(--color-dark)", lineHeight: 1.5 }}>
                                      Ich akzeptiere die <a href="/agb" target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ color: "var(--color-turquoise)", textDecoration: "underline" }}>AGB</a> und habe die <a href="/datenschutz" target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ color: "var(--color-turquoise)", textDecoration: "underline" }}>Datenschutzerklärung</a> zur Kenntnis genommen.
                                    </span>
                                  </label>
                                </div>

                                {isYouLend && (
                                  <div style={{ padding: "0.875rem", borderRadius: "0.75rem", background: "rgba(80,122,166,0.05)", border: "1px solid var(--color-border)" }}>
                                    <label style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", cursor: "pointer" }}>
                                      <input type="checkbox" checked={creditSearchConsent} onChange={e => setCreditSearchConsent(e.target.checked)}
                                        style={{ marginTop: "0.125rem", accentColor: "var(--color-turquoise)" }} />
                                      <span style={{ fontSize: "0.8125rem", color: "var(--color-dark)", lineHeight: 1.5 }}>
                                        Ich stimme einer Bonitätsprüfung durch YouLend zu. Diese hat keinen Einfluss auf Ihren Schufa-Score.
                                      </span>
                                    </label>
                                  </div>
                                )}
                              </div>

                              {submitError && <p style={{ fontSize: "0.8125rem", color: "rgba(220,38,38,0.8)", marginTop: "0.5rem" }}>{submitError}</p>}

                              <div style={{ display: "flex", gap: "0.625rem", marginTop: "1.25rem" }}>
                                <button type="button" onClick={() => setStep(3)} className="btn btn-secondary btn-md" style={{ gap: "0.375rem" }}>
                                  <ArrowLeft style={{ width: "0.875rem", height: "0.875rem" }} /> Zurück
                                </button>
                                <button type="button" onClick={() => doSubmit({ firstName, lastName, dateOfBirth, email: applicantEmail, phone: applicantPhone, phoneCountry, street: applicantStreet, zip: applicantZip, city: applicantCity })}
                                  disabled={!agbConsent || (isYouLend && !creditSearchConsent) || submitting}
                                  className="btn btn-primary btn-md" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.375rem" }}>
                                  {submitting ? <><Loader2 className="animate-spin" style={{ width: "0.875rem", height: "0.875rem" }} /> Wird eingereicht…</> : <>Antrag einreichen <ArrowRight style={{ width: "0.875rem", height: "0.875rem" }} /></>}
                                </button>
                              </div>
                            </div>
                          )}

                          {i === 4 && submitted && !isYouLend && (
                            <div style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 0" }}>
                              <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "50%", background: "rgba(80,122,166,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <Check style={{ width: "1.25rem", height: "1.25rem", color: "var(--color-turquoise)" }} />
                              </div>
                              <div>
                                <p style={{ fontFamily: "var(--font-heading)", fontSize: "1.125rem", fontWeight: 700, color: "var(--color-dark)", marginBottom: "0.25rem" }}>Anfrage eingereicht</p>
                                <p style={{ fontSize: "0.875rem", color: "var(--color-subtle)", lineHeight: 1.6 }}>
                                  Wir prüfen Ihren Antrag und melden uns in Kürze.
                                </p>
                              </div>
                            </div>
                          )}

                          {i === 4 && submitted && isYouLend && (
                            <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
                              <div style={{ width: "3rem", height: "3rem", borderRadius: "50%", background: "rgba(80,122,166,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
                                <Check style={{ width: "1.5rem", height: "1.5rem", color: "var(--color-turquoise)" }} />
                              </div>
                              <p style={{ fontFamily: "var(--font-heading)", fontSize: "1.25rem", fontWeight: 700, color: "var(--color-dark)", marginBottom: "0.5rem" }}>Antrag eingereicht!</p>
                              <p style={{ fontSize: "0.875rem", color: "var(--color-subtle)", lineHeight: 1.6, marginBottom: "1.25rem", maxWidth: "380px", margin: "0 auto 1.25rem" }}>
                                {redirectUrl
                                  ? "Im nächsten Schritt verifizieren Sie Ihre Bankdaten über Open Banking. Dies dauert nur wenige Minuten."
                                  : "Wir bearbeiten Ihren Antrag und melden uns bei Ihnen."}
                              </p>
                              {redirectUrl && (
                                <a
                                  href={redirectUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-primary btn-md"
                                  style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem" }}
                                >
                                  Weiter zur Bankverifizierung <ArrowRight style={{ width: "0.875rem", height: "0.875rem" }} />
                                </a>
                              )}
                              <p style={{ fontSize: "0.75rem", color: "var(--color-subtle)", marginTop: "1.25rem", lineHeight: 1.5 }}>
                                Updates zu Ihrem Antrag finden Sie jederzeit in Ihrem <a href="/plattform" style={{ color: "var(--color-turquoise)", textDecoration: "underline" }}>Loginbereich</a>.
                              </p>
                            </div>
                          )}

                          {/* Step 5: Kontoauszüge — YouLend only */}
                          {i === 5 && isYouLend && (
                            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "1rem", background: "rgba(80,122,166,0.05)", borderRadius: "0.75rem" }}>
                                <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "50%", background: "rgba(80,122,166,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                  <Check style={{ width: "1.25rem", height: "1.25rem", color: "var(--color-turquoise)" }} />
                                </div>
                                <div>
                                  <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--color-dark)", marginBottom: "0.125rem" }}>Antrag eingereicht</p>
                                  <p style={{ fontSize: "0.75rem", color: "var(--color-subtle)" }}>Verifizieren Sie jetzt Ihre Bankdaten, um den Antrag abzuschließen.</p>
                                </div>
                              </div>

                              <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-subtle)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Bitte wählen Sie eine Option</p>

                              {/* Option 1: Open Banking */}
                              <button
                                type="button"
                                onClick={() => { if (redirectUrl) window.open(redirectUrl, "_blank"); }}
                                disabled={!redirectUrl}
                                style={{
                                  width: "100%", padding: "1.25rem", borderRadius: "0.75rem",
                                  border: "2px solid var(--color-turquoise)", background: "#fff",
                                  cursor: redirectUrl ? "pointer" : "default",
                                  opacity: redirectUrl ? 1 : 0.5,
                                  textAlign: "left", display: "flex", alignItems: "center", gap: "1rem",
                                  transition: "all 0.2s",
                                }}
                              >
                                <div style={{ width: "2.75rem", height: "2.75rem", borderRadius: "0.625rem", background: "rgba(80,122,166,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                  <Landmark style={{ width: "1.25rem", height: "1.25rem", color: "var(--color-turquoise)" }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                  <p style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--color-dark)", marginBottom: "0.25rem" }}>Open Banking</p>
                                  <p style={{ fontSize: "0.75rem", color: "var(--color-subtle)", lineHeight: 1.5 }}>Bankdaten sicher und automatisch verifizieren. Schnellste Option — dauert nur 2 Minuten.</p>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", flexShrink: 0, padding: "0.25rem 0.625rem", borderRadius: "1rem", background: "rgba(80,122,166,0.08)", fontSize: "0.6875rem", fontWeight: 600, color: "var(--color-turquoise)" }}>
                                  <Zap style={{ width: "0.75rem", height: "0.75rem" }} /> Empfohlen
                                </div>
                              </button>

                              {/* Option 2: PDF Upload */}
                              {(() => {
                                function addFiles(files: File[]) {
                                  const pdfs = files.filter(f => f.type === "application/pdf");
                                  if (pdfs.length === 0) return;
                                  setPendingFiles(prev => {
                                    const existing = new Set(prev.map(f => f.name + f.size));
                                    return [...prev, ...pdfs.filter(f => !existing.has(f.name + f.size))];
                                  });
                                }
                                async function submitFiles() {
                                  if (pendingFiles.length === 0 || !submittedAppId) return;
                                  setUploadingFiles(true); setUploadResults([]);
                                  try {
                                    // 1. Save to Supabase Storage
                                    for (const file of pendingFiles) {
                                      const path = `bank-statements/${submittedAppId}/${file.name}`;
                                      await supabase.storage.from("documents").upload(path, file, { upsert: true });
                                    }
                                    // 2. Send to YouLend
                                    const formData = new FormData();
                                    formData.append("application_id", submittedAppId);
                                    pendingFiles.forEach(f => formData.append("files", f));
                                    const { data: result, error } = await supabase.functions.invoke("provider-youlend", { body: formData });
                                    if (error) throw error;
                                    if (result?.data?.uploaded) setUploadResults(result.data.uploaded);
                                    else setUploadResults(pendingFiles.map(f => ({ name: f.name, status: "ok" })));
                                    // 3. Auto-trigger Stage 1 submission after successful upload
                                    if (!result?.data?.uploaded?.some((r: any) => r.status !== "ok")) {
                                      await supabase.functions.invoke("provider-youlend", {
                                        body: { action: "submit_stage1", application_id: submittedAppId },
                                      }).catch(err => console.error("[submit_stage1]", err));
                                    }
                                  } catch (err) {
                                    console.error("[upload]", err);
                                    setUploadResults(pendingFiles.map(f => ({ name: f.name, status: "error", error: "Upload fehlgeschlagen" })));
                                  } finally {
                                    setUploadingFiles(false);
                                  }
                                }
                                return (
                              <div style={{
                                width: "100%", padding: "1.25rem", borderRadius: "0.75rem",
                                border: "1px solid var(--color-border)", background: "#fff",
                                textAlign: "left",
                              }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
                                  <div style={{ width: "2.75rem", height: "2.75rem", borderRadius: "0.625rem", background: "var(--color-light-bg)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                    <Upload style={{ width: "1.25rem", height: "1.25rem", color: "var(--color-subtle)" }} />
                                  </div>
                                  <div style={{ flex: 1 }}>
                                    <p style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--color-dark)", marginBottom: "0.25rem" }}>Kontoauszüge hochladen</p>
                                    <p style={{ fontSize: "0.75rem", color: "var(--color-subtle)", lineHeight: 1.5 }}>PDF-Kontoauszüge der letzten 3–12 Monate hochladen. Max. 16 MB pro Datei.</p>
                                  </div>
                                </div>

                                {uploadingFiles ? (
                                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", padding: "1.5rem" }}>
                                    <Loader2 className="animate-spin" style={{ width: "2rem", height: "2rem", color: "var(--color-turquoise)" }} />
                                    <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-dark)" }}>Dokumente werden übermittelt…</p>
                                    <p style={{ fontSize: "0.6875rem", color: "var(--color-subtle)" }}>{pendingFiles.length} Datei{pendingFiles.length !== 1 ? "en" : ""}</p>
                                  </div>
                                ) : uploadResults.length > 0 ? (
                                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                    {uploadResults.map((r, idx) => (
                                      <div key={idx} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.75rem", borderRadius: "0.5rem", background: r.status === "ok" ? "rgba(80,122,166,0.05)" : "rgba(220,38,38,0.05)" }}>
                                        {r.status === "ok"
                                          ? <Check style={{ width: "1rem", height: "1rem", color: "var(--color-turquoise)", flexShrink: 0 }} />
                                          : <span style={{ width: "1rem", height: "1rem", color: "rgba(220,38,38,0.8)", flexShrink: 0, fontSize: "1rem", lineHeight: 1 }}>!</span>}
                                        <span style={{ fontSize: "0.8125rem", color: "var(--color-dark)", flex: 1 }}>{r.name}</span>
                                        <span style={{ fontSize: "0.6875rem", color: r.status === "ok" ? "var(--color-turquoise)" : "rgba(220,38,38,0.8)" }}>
                                          {r.status === "ok" ? "Übermittelt" : "Fehler"}
                                        </span>
                                      </div>
                                    ))}
                                    {uploadResults.every(r => r.status === "ok") && (
                                      <div style={{ textAlign: "center", padding: "1rem 0" }}>
                                        <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "50%", background: "rgba(80,122,166,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 0.75rem" }}>
                                          <Check style={{ width: "1.25rem", height: "1.25rem", color: "var(--color-turquoise)" }} />
                                        </div>
                                        <p style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--color-dark)", marginBottom: "0.375rem" }}>Antrag vollständig eingereicht</p>
                                        <p style={{ fontSize: "0.8125rem", color: "var(--color-subtle)", lineHeight: 1.6, maxWidth: "360px", margin: "0 auto 1rem" }}>
                                          YouLend prüft jetzt Ihre Unterlagen. Sie erhalten Ihr Angebot in der Regel innerhalb von 24 Stunden — direkt hier in Ihrem Dashboard.
                                        </p>
                                        <button type="button" onClick={() => window.location.href = "/plattform"}
                                          className="btn btn-primary btn-md" style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem" }}>
                                          Zurück zum Marktplatz <ArrowRight style={{ width: "0.875rem", height: "0.875rem" }} />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <>
                                    {/* File list */}
                                    {pendingFiles.length > 0 && (
                                      <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem", marginBottom: "0.75rem" }}>
                                        {pendingFiles.map((f, idx) => (
                                          <div key={f.name + f.size} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.75rem", borderRadius: "0.5rem", background: "var(--color-light-bg)" }}>
                                            <span style={{ fontSize: "0.8125rem", color: "var(--color-dark)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
                                            <span style={{ fontSize: "0.6875rem", color: "var(--color-subtle)", flexShrink: 0 }}>{(f.size / 1024 / 1024).toFixed(1)} MB</span>
                                            <button type="button" onClick={() => setPendingFiles(prev => prev.filter((_, i) => i !== idx))}
                                              style={{ background: "none", border: "none", cursor: "pointer", padding: "0.125rem", color: "var(--color-subtle)", fontSize: "1rem", lineHeight: 1 }}>×</button>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {/* Drop zone */}
                                    <label
                                      style={{
                                        display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                                        padding: "0.75rem 1rem", borderRadius: "0.625rem",
                                        border: "2px dashed var(--color-border)", cursor: "pointer",
                                        fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-subtle)",
                                        transition: "all 0.2s",
                                      }}
                                      onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = "var(--color-turquoise)"; e.currentTarget.style.background = "rgba(80,122,166,0.03)"; }}
                                      onDragLeave={e => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.background = "none"; }}
                                      onDrop={e => {
                                        e.preventDefault();
                                        e.currentTarget.style.borderColor = "var(--color-border)";
                                        e.currentTarget.style.background = "none";
                                        addFiles(Array.from(e.dataTransfer.files));
                                      }}
                                    >
                                      <input type="file" accept=".pdf" multiple style={{ display: "none" }}
                                        onChange={e => { addFiles(Array.from(e.target.files || [])); e.target.value = ""; }} />
                                      <Upload style={{ width: "1rem", height: "1rem" }} />
                                      {pendingFiles.length > 0 ? "Weitere Dateien hinzufügen" : "PDF-Dateien auswählen oder hierher ziehen"}
                                    </label>

                                    {/* Submit button */}
                                    {pendingFiles.length > 0 && (
                                      <button type="button" onClick={submitFiles}
                                        className="btn btn-primary btn-md"
                                        style={{ width: "100%", marginTop: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.375rem" }}>
                                        {pendingFiles.length} Dokument{pendingFiles.length !== 1 ? "e" : ""} übermitteln <ArrowRight style={{ width: "0.875rem", height: "0.875rem" }} />
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                                ); })()}

                              <div style={{ padding: "0.75rem", borderRadius: "0.5rem", background: "var(--color-light-bg)", textAlign: "center" }}>
                                <p style={{ fontSize: "0.75rem", color: "var(--color-subtle)", lineHeight: 1.6 }}>
                                  Nach Abschluss der Bankverifizierung erhalten Sie Ihr Angebot in der Regel innerhalb von <strong style={{ color: "var(--color-dark)" }}>24 Stunden</strong> — direkt hier in Ihrem Dashboard.
                                </p>
                              </div>
                              <p style={{ fontSize: "0.6875rem", color: "var(--color-subtle)", lineHeight: 1.5, textAlign: "center" }}>
                                Ihre Bankdaten werden verschlüsselt übertragen und nur zur Prüfung Ihres Antrags verwendet.
                              </p>
                            </div>
                          )}

                          {/* Navigation: Step 2 (Unternehmen) */}
                          {i === 2 && (
                            <div style={{ display: "flex", gap: "0.625rem", marginTop: "1.25rem" }}>
                              <button type="button" onClick={() => setStep(s => s - 1)} className="btn btn-secondary btn-md" style={{ gap: "0.375rem" }}>
                                <ArrowLeft style={{ width: "0.875rem", height: "0.875rem" }} /> Zurück
                              </button>
                              <button type="button" onClick={handleNext} disabled={!step2Valid || searchLoading} className="btn btn-primary btn-md" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.375rem" }}>
                                {searchLoading
                                  ? <><Loader2 className="animate-spin" style={{ width: "0.875rem", height: "0.875rem" }} /> Wird geladen…</>
                                  : <>Weiter <ArrowRight style={{ width: "0.875rem", height: "0.875rem" }} /></>
                                }
                              </button>
                            </div>
                          )}
                </>);
                })()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ─── MY APPLICATIONS LIST (with inline document upload for YouLend) ──

type AppItem = { id: string; product_id: string; provider_name: string; product_name: string; volume: number; term_months: number; status: string; metadata: Record<string, unknown>; created_at: string };

function MyApplicationsList({ applications, offers, statusLabels, formatCurrency }: {
  applications: AppItem[];
  offers: Array<{ product_id: string; provider_logo_url?: string | null }>;
  statusLabels: Record<string, { label: string; color: string }>;
  formatCurrency: (n: number) => string;
}) {
  const supabase = createClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<Array<{ name: string; status: string }>>([]);

  function addFiles(files: File[]) {
    const pdfs = files.filter(f => f.type === "application/pdf");
    setPendingFiles(prev => {
      const existing = new Set(prev.map(f => f.name + f.size));
      return [...prev, ...pdfs.filter(f => !existing.has(f.name + f.size))];
    });
  }

  async function submitFiles(appId: string) {
    if (pendingFiles.length === 0) return;
    setUploading(true); setUploadResults([]);
    try {
      for (const file of pendingFiles) {
        await supabase.storage.from("documents").upload(`bank-statements/${appId}/${file.name}`, file, { upsert: true });
      }
      const formData = new FormData();
      formData.append("application_id", appId);
      pendingFiles.forEach(f => formData.append("files", f));
      const { data: result, error } = await supabase.functions.invoke("provider-youlend", { body: formData });
      if (error) throw error;
      if (result?.data?.uploaded) setUploadResults(result.data.uploaded);
      else setUploadResults(pendingFiles.map(f => ({ name: f.name, status: "ok" })));
    } catch (err) {
      console.error("[upload]", err);
      setUploadResults(pendingFiles.map(f => ({ name: f.name, status: "error" })));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{ marginBottom: "0.75rem" }}>
      <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--color-dark)", marginBottom: "0.5rem" }}>Meine Anfragen</p>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {applications.map(app => {
          const s = statusLabels[app.status] || statusLabels.new;
          const offer = offers.find(o => o.product_id === app.product_id);
          const isYouLend = app.provider_name === "YouLend";
          const meta = app.metadata || {};
          const hasOpenBanking = !!(meta as any).open_banking_url;
          const showUpload = isYouLend && ["inquired", "new", "product_selected"].includes(app.status);
          const hasOffers = isYouLend && app.status === "offer_received";
          const ylOffers = (meta as any).offers as Array<{ OfferId: string; YouWillGet: string; YouWillRepay: string; Sweep: string; CurrencyISOCode: string }> | undefined;
          const showActions = showUpload || hasOffers;
          const isExpanded = expandedId === app.id;

          return (
            <div key={app.id} style={{
              background: "#fff", borderRadius: "0.75rem", border: "1px solid var(--color-border)",
              overflow: "hidden",
            }}>
              <div style={{
                padding: "0.75rem 1rem", display: "flex", alignItems: "center", gap: "0.75rem",
              }}>
                <div className="offer-provider-logo" style={{ width: "2rem", height: "2rem", flexShrink: 0 }}>
                  {offer?.provider_logo_url
                    ? <img src={offer.provider_logo_url} alt={app.provider_name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                    : <span style={{ fontSize: "0.625rem" }}>{app.provider_name.slice(0, 2).toUpperCase()}</span>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-dark)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {app.provider_name} — {app.product_name}
                  </p>
                  <p style={{ fontSize: "0.75rem", color: "var(--color-subtle)" }}>
                    {formatCurrency(app.volume)}{app.term_months ? ` · ${app.term_months} Mon.` : ""}
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
                  {showActions && (
                    <button type="button"
                      onClick={() => { setExpandedId(isExpanded ? null : app.id); setPendingFiles([]); setUploadResults([]); }}
                      style={{
                        display: "flex", alignItems: "center", gap: "0.25rem",
                        fontSize: "0.6875rem", fontWeight: 600, color: "var(--color-turquoise)",
                        background: "none", border: "1px solid var(--color-turquoise)", borderRadius: "999px",
                        padding: "0.25rem 0.625rem", cursor: "pointer", whiteSpace: "nowrap",
                      }}>
                      {hasOffers ? <><ArrowRight style={{ width: "0.625rem", height: "0.625rem" }} /> Angebote</> : <><Upload style={{ width: "0.625rem", height: "0.625rem" }} /> Dokumente</>}
                    </button>
                  )}
                  <span style={{
                    fontSize: "0.6875rem", fontWeight: 700, color: s.color,
                    padding: "0.25rem 0.625rem", borderRadius: "999px",
                    background: `${s.color}14`, whiteSpace: "nowrap",
                  }}>
                    {s.label}
                  </span>
                </div>
              </div>

              {/* Expandable offers panel */}
              {isExpanded && hasOffers && ylOffers && ylOffers.length > 0 && (
                <div style={{ padding: "0 1rem 1rem", borderTop: "1px solid var(--color-border)" }}>
                  <p style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--color-subtle)", margin: "0.75rem 0 0.5rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    {ylOffers.length} Angebot{ylOffers.length !== 1 ? "e" : ""} verfügbar
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {ylOffers.map((o, idx) => (
                      <div key={o.OfferId || idx} style={{
                        padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid var(--color-border)",
                        display: "flex", alignItems: "center", gap: "0.75rem",
                      }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--color-dark)" }}>
                            {formatCurrency(Number(o.YouWillGet))}
                          </p>
                          <p style={{ fontSize: "0.6875rem", color: "var(--color-subtle)", marginTop: "0.125rem" }}>
                            Rückzahlung {formatCurrency(Number(o.YouWillRepay))} · {o.Sweep}% vom Umsatz
                          </p>
                        </div>
                        <button type="button"
                          onClick={async () => {
                            try {
                              const { data: result, error } = await supabase.functions.invoke("provider-youlend", {
                                body: { action: "accept_offer", application_id: app.id, extra: { offerId: o.OfferId } },
                              });
                              if (error) throw error;
                              if (result?.data?.accepted) {
                                // Reload page to reflect new status
                                window.location.reload();
                              }
                            } catch (err) {
                              console.error("[accept offer]", err);
                            }
                          }}
                          className="btn btn-primary btn-md"
                          style={{ fontSize: "0.75rem", padding: "0.375rem 0.75rem", whiteSpace: "nowrap", flexShrink: 0 }}>
                          Annehmen
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Expandable upload panel */}
              {isExpanded && showUpload && (
                <div style={{ padding: "0 1rem 1rem", borderTop: "1px solid var(--color-border)" }}>
                  {hasOpenBanking && (
                    <a href={(meta as any).open_banking_url} target="_blank" rel="noopener noreferrer"
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "center", gap: "0.375rem",
                        padding: "0.625rem", marginTop: "0.75rem", borderRadius: "0.5rem",
                        border: "1px solid var(--color-turquoise)", fontSize: "0.8125rem", fontWeight: 600,
                        color: "var(--color-turquoise)", textDecoration: "none",
                      }}>
                      <Landmark style={{ width: "0.875rem", height: "0.875rem" }} /> Open Banking starten
                    </a>
                  )}

                  <p style={{ fontSize: "0.6875rem", color: "var(--color-subtle)", margin: "0.75rem 0 0.5rem", fontWeight: 600 }}>
                    Oder Kontoauszüge als PDF hochladen
                  </p>

                  {uploading ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", padding: "1rem" }}>
                      <Loader2 className="animate-spin" style={{ width: "1.25rem", height: "1.25rem", color: "var(--color-turquoise)" }} />
                      <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-dark)" }}>Wird übermittelt…</span>
                    </div>
                  ) : uploadResults.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                      {uploadResults.map((r, idx) => (
                        <div key={idx} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.375rem 0.5rem", borderRadius: "0.375rem", background: r.status === "ok" ? "rgba(80,122,166,0.05)" : "rgba(220,38,38,0.05)", fontSize: "0.75rem" }}>
                          {r.status === "ok" ? <Check style={{ width: "0.75rem", height: "0.75rem", color: "var(--color-turquoise)" }} /> : <span style={{ color: "rgba(220,38,38,0.8)" }}>!</span>}
                          <span style={{ flex: 1, color: "var(--color-dark)" }}>{r.name}</span>
                          <span style={{ color: r.status === "ok" ? "var(--color-turquoise)" : "rgba(220,38,38,0.8)", fontSize: "0.6875rem" }}>{r.status === "ok" ? "Übermittelt" : "Fehler"}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      {pendingFiles.length > 0 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", marginBottom: "0.5rem" }}>
                          {pendingFiles.map((f, idx) => (
                            <div key={f.name + f.size} style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.375rem 0.5rem", borderRadius: "0.375rem", background: "var(--color-light-bg)", fontSize: "0.75rem" }}>
                              <span style={{ flex: 1, color: "var(--color-dark)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
                              <span style={{ color: "var(--color-subtle)", flexShrink: 0 }}>{(f.size / 1024 / 1024).toFixed(1)} MB</span>
                              <button type="button" onClick={() => setPendingFiles(prev => prev.filter((_, i) => i !== idx))}
                                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-subtle)", fontSize: "0.875rem", lineHeight: 1, padding: "0 0.125rem" }}>×</button>
                            </div>
                          ))}
                        </div>
                      )}
                      <label style={{
                        display: "flex", alignItems: "center", justifyContent: "center", gap: "0.375rem",
                        padding: "0.5rem", borderRadius: "0.5rem", border: "2px dashed var(--color-border)",
                        cursor: "pointer", fontSize: "0.75rem", fontWeight: 600, color: "var(--color-subtle)", transition: "all 0.2s",
                      }}
                        onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = "var(--color-turquoise)"; }}
                        onDragLeave={e => { e.currentTarget.style.borderColor = "var(--color-border)"; }}
                        onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = "var(--color-border)"; addFiles(Array.from(e.dataTransfer.files)); }}
                      >
                        <input type="file" accept=".pdf" multiple style={{ display: "none" }} onChange={e => { addFiles(Array.from(e.target.files || [])); e.target.value = ""; }} />
                        <Upload style={{ width: "0.75rem", height: "0.75rem" }} />
                        {pendingFiles.length > 0 ? "Weitere hinzufügen" : "PDF auswählen oder hierher ziehen"}
                      </label>
                      {pendingFiles.length > 0 && (
                        <button type="button" onClick={() => submitFiles(app.id)}
                          className="btn btn-primary btn-md"
                          style={{ width: "100%", marginTop: "0.5rem", fontSize: "0.8125rem", padding: "0.5rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.375rem" }}>
                          {pendingFiles.length} Dokument{pendingFiles.length !== 1 ? "e" : ""} übermitteln <ArrowRight style={{ width: "0.75rem", height: "0.75rem" }} />
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function PlattformPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><Loader2 className="animate-spin" style={{ width: "2rem", height: "2rem", color: "var(--color-subtle)" }} /></div>}>
      <PlattformContent />
    </Suspense>
  );
}

const YL_REVENUE_STEPS = [
  1000, 1500, 2000, 2500, 3000, 4000, 5000, 7500, 10000, 12500, 15000,
  20000, 25000, 30000, 35000, 40000, 45000, 50000,
  60000, 70000, 80000, 90000, 100000,
  125000, 150000, 175000, 200000, 225000, 250000,
  300000, 350000, 400000, 450000, 500000,
];

function YouLendCalculator({ initialRevenue, maxVolume, onContinue, onEstimateChange }: { initialRevenue: number; maxVolume: number; onContinue?: (estimate: number) => void; onEstimateChange?: (estimate: number) => void }) {
  // Find closest step index for initial value
  const closestIdx = YL_REVENUE_STEPS.reduce((best, v, i) => Math.abs(v - initialRevenue) < Math.abs(YL_REVENUE_STEPS[best] - initialRevenue) ? i : best, 0);
  const [revenueIdx, setRevenueIdx] = useState(closestIdx);
  const revenue = YL_REVENUE_STEPS[revenueIdx];
  const [months, setMonths] = useState(12);
  const estimate = Math.min(youlendEstimate(revenue, months), maxVolume);

  useEffect(() => { onEstimateChange?.(estimate); }, [estimate]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div style={{ background: onContinue ? "none" : "var(--color-light-bg)", borderRadius: "0.75rem", padding: onContinue ? 0 : "1.25rem", marginBottom: onContinue ? 0 : "1rem" }}>
      {!onContinue && <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--color-dark)", marginBottom: "0.25rem" }}>Finanzierungsrechner</p>}
      <p style={{ fontSize: "0.75rem", color: "var(--color-subtle)", marginBottom: "1rem" }}>
        {onContinue ? "Schätzen Sie Ihren möglichen Finanzierungsbetrag." : "Schätzen Sie Ihren möglichen Kreditbetrag."}
      </p>
      <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginBottom: "1.25rem" }}>
        <span style={{ fontSize: "2rem", fontWeight: 800, color: "var(--color-dark)" }}>
          {estimate.toLocaleString("de-DE")} €
        </span>
        <span style={{ fontSize: "0.75rem", color: "var(--color-subtle)" }}>geschätzt*</span>
      </div>
      <div style={{ marginBottom: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.375rem" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-subtle)" }}>Monatlicher Umsatz</span>
          <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--color-dark)" }}>{revenue.toLocaleString("de-DE")} €</span>
        </div>
        <input type="range" min={0} max={YL_REVENUE_STEPS.length - 1} step={1} value={revenueIdx}
          onChange={e => setRevenueIdx(+e.target.value)}
          className="funnel-slider" style={{ width: "100%", background: `linear-gradient(to right, var(--color-turquoise) ${(revenueIdx / (YL_REVENUE_STEPS.length - 1)) * 100}%, var(--color-border) 0%)` }} />
      </div>
      <div style={{ marginBottom: "0.75rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.375rem" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-subtle)" }}>Handelshistorie</span>
          <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--color-dark)" }}>{months} Monate</span>
        </div>
        <input type="range" min={3} max={60} step={1} value={months}
          onChange={e => setMonths(+e.target.value)}
          className="funnel-slider" style={{ width: "100%", background: `linear-gradient(to right, var(--color-turquoise) ${((months - 3) / (60 - 3)) * 100}%, var(--color-border) 0%)` }} />
      </div>
      <p style={{ fontSize: "0.6875rem", color: "var(--color-subtle)", lineHeight: 1.5, marginBottom: onContinue ? "0.75rem" : 0 }}>
        *Grobe Schätzung — der finale Betrag hängt von Ihrer Bonität und Geschäftsdaten ab.
      </p>
      {onContinue && (
        <button type="button" onClick={() => onContinue(estimate)} className="btn btn-primary btn-md" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.25rem" }}>
          Mit {estimate.toLocaleString("de-DE")} € anfragen <ArrowRight style={{ width: "0.875rem", height: "0.875rem" }} />
        </button>
      )}
    </div>
  );
}

function PlattformContent() {
  const { trackEvent } = useTracking();
  const searchParams = useSearchParams();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [termMonths, setTermMonths] = useState(() => {
    const t = Number(searchParams.get("term"));
    return t >= 1 && t <= 60 ? t : 12;
  });
  const [volume, setVolume] = useState(() => {
    const amt = Number(searchParams.get("amount"));
    return amt >= 10000 && amt <= 500000 ? amt : 50000;
  });
  const [sortBy, setSortBy] = useState<SortKey>("speed");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<Record<string, "description" | "process" | "conditions">>({});
  const [filterTopUp, setFilterTopUp] = useState(false);
  const [filter48h, setFilter48h] = useState(false);
  const [filterFlexRepayment, setFilterFlexRepayment] = useState(false);
  const [filterGracePeriod, setFilterGracePeriod] = useState(false);
  const [filterNegativeSchufa, setFilterNegativeSchufa] = useState(false);
  const [filterUseCases, setFilterUseCases] = useState<string[]>([]);
  const [showFilter, setShowFilter] = useState(false);
  useEffect(() => { setShowFilter(window.innerWidth >= 1024); }, []);
  const [showUseCaseFilter, setShowUseCaseFilter] = useState(false);
  const [skeletonStartCount, setSkeletonStartCount] = useState(25);
  const [selectedOffer, setSelectedOffer] = useState<{ offer: Offer; amount: number; term: number } | null>(null);
  const [funnelEstimate, setFunnelEstimate] = useState<number | null>(null);
  const [myApplications, setMyApplications] = useState<Array<{ id: string; product_id: string; provider_name: string; product_name: string; volume: number; term_months: number; status: string; metadata: Record<string, unknown>; created_at: string }>>([]);

  // "Mein Unternehmen" bar state
  const [companyType, setCompanyType] = useState<"" | "kapitalgesellschaft" | "personengesellschaft">("");
  const [companyBranche, setCompanyBranche] = useState("");
  const [companyRevenue, setCompanyRevenue] = useState<number | null>(null);
  const [companyBarOpen, setCompanyBarOpen] = useState(true);
  const companyBarComplete = !!(companyType && companyBranche && companyRevenue);
  // Company profile data (from DB, read-only display)
  const [companyProfile, setCompanyProfile] = useState<{ name?: string; hrb?: string; ust_id?: string; website?: string; street?: string; zip?: string; city?: string } | null>(null);

  const COMPANY_TYPE_FORMS: Record<string, string[]> = {
    kapitalgesellschaft: ["gmbh", "ug", "ag"],
    personengesellschaft: ["gbr", "einzelunternehmen", "ohg", "kg"],
  };

  const BRANCHEN = [
    { id: "handel", label: "E-Commerce & Handel" },
    { id: "dienstleistung", label: "Dienstleistung" },
    { id: "produktion", label: "Produktion & Handwerk" },
    { id: "gastronomie", label: "Gastronomie & Hotellerie" },
    { id: "andere", label: "Andere" },
  ];

  useEffect(() => {
    setSkeletonStartCount(22 + Math.floor(Math.random() * 6));
    // Restore from localStorage
    try {
      const saved = JSON.parse(localStorage.getItem("company_bar") ?? "{}");
      if (saved.companyType) setCompanyType(saved.companyType);
      if (saved.branche) setCompanyBranche(saved.branche);
      if (saved.revenue) setCompanyRevenue(saved.revenue);
      if (saved.companyType && saved.branche && saved.revenue) setCompanyBarOpen(false);
    } catch { /* keep open */ }
  }, []);

  const fetchOffers = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("get_platform_offers");
    if (!error && data) setOffers(data as Offer[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchOffers(); }, [fetchOffers]);

  // Load user's existing applications + poll status for open ones
  useEffect(() => {
    async function loadApplications() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase
        .from("applications")
        .select("id, product_id, provider_name, product_name, volume, term_months, status, metadata, created_at")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });
      if (data) {
        setMyApplications(data);
        // Poll status for latest open application per provider (avoid spamming APIs)
        const openApps = data.filter(a =>
          !["signed", "rejected", "closed"].includes(a.status) &&
          (a.metadata as Record<string, unknown>)?.external_ref
        );
        const polledProviders = new Set<string>();
        for (const app of openApps) {
          const slug = PROVIDER_SLUGS[app.provider_name];
          if (!slug || polledProviders.has(slug)) continue;
          polledProviders.add(slug);
          // Skip very fresh applications (< 5 min old)
          const age = Date.now() - new Date(app.created_at).getTime();
          if (age < 5 * 60 * 1000) continue;
          supabase.functions.invoke(`provider-${slug}`, {
            body: { action: "status", application_id: app.id },
          }).then(({ data: result }) => {
            if (result?.success && result.data?.changed) {
              setMyApplications(prev => prev.map(a =>
                a.id === app.id ? { ...a, status: result.data.internal_status } : a
              ));
            }
          }).catch(() => { /* silent */ });
        }
      }
    }
    loadApplications();
  }, []);

  // After offers load, re-open the funnel if user just returned from OAuth or magic link
  useEffect(() => {
    if (offers.length === 0) return;
    const returnId = searchParams.get("offer");
    if (!returnId) return;
    const match = offers.find(o => o.product_id === returnId);
    if (match) {
      setSelectedOffer({ offer: match, amount: volume, term: termMonths });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offers]);

  const appliedProductIds = new Set(myApplications.map(a => a.product_id));

  const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    new: { label: "Eingereicht", color: "var(--color-turquoise)" },
    inquired: { label: "In Prüfung", color: "var(--color-olive)" },
    offer_received: { label: "Angebote", color: "#d97706" },
    offer_accepted: { label: "Angenommen", color: "var(--color-olive)" },
    signed: { label: "Genehmigt", color: "#16a34a" },
    rejected: { label: "Abgelehnt", color: "rgba(220,38,38,0.8)" },
    closed: { label: "Abgeschlossen", color: "var(--color-subtle)" },
  };

  const matchesTerm = (offer: Offer) => offer.min_term_months <= termMonths && offer.max_term_months >= termMonths;

  const matchesVolume = (offer: Offer) => {
    return offer.min_volume <= volume && offer.max_volume >= volume;
  };

  const matchesFeatures = (offer: Offer) => {
    const m = (offer.metadata ?? {}) as Record<string, unknown>;
    if (filterTopUp && !m.top_up) return false;
    if (filter48h && !m.payout_48h) return false;
    if (filterFlexRepayment && !m.flexible_repayment) return false;
    if (filterGracePeriod && !m.grace_period) return false;
    if (filterNegativeSchufa && !m.negative_schufa) return false;
    if (filterUseCases.length > 0) {
      const productUseCases = (m.use_cases as string[] | undefined) ?? [];
      if (!filterUseCases.some((uc) => productUseCases.includes(uc))) return false;
    }
    if (companyType) {
      const allowed = (m.eligible_legal_forms as string[] | undefined) ?? [];
      const forms = COMPANY_TYPE_FORMS[companyType] ?? [];
      if (allowed.length > 0 && !forms.some(f => allowed.includes(f))) return false;
    }
    if (companyBranche) {
      const allowed = (m.eligible_industries as string[] | undefined) ?? [];
      if (allowed.length > 0 && !allowed.includes(companyBranche)) return false;
    }
    if (companyRevenue && companyRevenue > 0) {
      const req = (m.requirements ?? {}) as Record<string, unknown>;
      const minMonthly = req.min_monthly_revenue_eur as number | undefined;
      if (minMonthly != null && companyRevenue < minMonthly * 12) return false;
    }
    return true;
  };

  const matchesAll = (offer: Offer) => matchesTerm(offer) && matchesVolume(offer) && matchesFeatures(offer);

  function handleCta(offer: Offer, amount: number, term: number) {
    trackEvent("cta_click", { provider_name: offer.provider_name, product_id: offer.product_id, amount, term });
    setSelectedOffer({ offer, amount, term });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const sortedOffers = [...offers].sort((a, b) => {
    const aMatch = matchesAll(a) ? 0 : 1;
    const bMatch = matchesAll(b) ? 0 : 1;
    if (aMatch !== bMatch) return aMatch - bMatch;

    if (sortBy === "rate") return a.interest_rate_from - b.interest_rate_from;
    if (sortBy === "term") return b.max_term_months - a.max_term_months;
    if (sortBy === "speed") {
      const aS = (a.metadata as Record<string, unknown>)?.processing_time_days as number ?? 999;
      const bS = (b.metadata as Record<string, unknown>)?.processing_time_days as number ?? 999;
      return aS - bS;
    }
    return b.max_volume - a.max_volume;
  });

  const sliderBg = (val: number, min: number, max: number) =>
    `linear-gradient(to right, #507AA6 0%, #507AA6 ${((val - min) / (max - min)) * 100}%, #D0DCE8 ${((val - min) / (max - min)) * 100}%, #D0DCE8 100%)`;

  const activeFilterCount =
    (termMonths !== 12 ? 1 : 0) + (volume !== 50000 ? 1 : 0) +
    (filterTopUp ? 1 : 0) + (filter48h ? 1 : 0) + (filterFlexRepayment ? 1 : 0) +
    (filterGracePeriod ? 1 : 0) + (filterNegativeSchufa ? 1 : 0) +
    filterUseCases.length;

  const matchingCount = offers.filter(matchesAll).length;

  // Save company bar to localStorage + sync to DB if logged in
  function saveCompanyBar(patch: { companyType?: string; branche?: string; revenue?: number | null }) {
    const cur = JSON.parse(localStorage.getItem("company_bar") ?? "{}");
    const updated = { ...cur, ...patch };
    localStorage.setItem("company_bar", JSON.stringify(updated));
    // Fire-and-forget DB sync for logged-in users
    (async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const { data: member } = await supabase.from("company_members").select("company_id").eq("user_id", session.user.id).limit(1).maybeSingle();
        if (!member?.company_id) return;
        const type = updated.companyType || companyType;
        const br = updated.branche || companyBranche;
        const rev = updated.revenue ?? companyRevenue;
        await supabase.from("companies").update({
          legal_form: type,
          industry: br,
          annual_revenue: rev,
          updated_at: new Date().toISOString(),
        }).eq("id", member.company_id);
      } catch { /* ignore sync errors */ }
    })();
  }

  // Load company bar from DB for logged-in users
  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const { data: member } = await supabase.from("company_members").select("company_id").eq("user_id", session.user.id).limit(1).maybeSingle();
        if (!member?.company_id) return;
        const { data: co } = await supabase.from("companies").select("name, hrb, ust_id, website, address, legal_form, industry, annual_revenue").eq("id", member.company_id).maybeSingle();
        if (!co) return;
        if (co.legal_form) setCompanyType(co.legal_form as typeof companyType);
        if (co.industry) setCompanyBranche(co.industry);
        if (co.annual_revenue) setCompanyRevenue(co.annual_revenue);
        if (co.legal_form && co.industry && co.annual_revenue) setCompanyBarOpen(false);
        const addr = (co.address ?? {}) as Record<string, string>;
        if (co.name) setCompanyProfile({ name: co.name, hrb: co.hrb, ust_id: co.ust_id, website: co.website, street: addr.street, zip: addr.zip, city: addr.city });
      } catch { /* ignore */ }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="relative z-10 bg-white border-b border-border">
        <div className="mx-auto px-4 max-w-[1400px] mx-auto py-3">
          <div className="flex items-center justify-between">
            <Logo size="md" />
            <UserMenu />
          </div>
        </div>
      </header>


      {/* Main */}
      <main className="flex-1 py-6 bg-white">
        <div className="mx-auto px-4 max-w-[1400px] mx-auto">

          {/* Back button when product is selected */}
          <AnimatePresence>
            {selectedOffer && (
              <motion.button
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
                onClick={() => setSelectedOffer(null)}
                className="detail-back"
                style={{ marginBottom: "1rem" }}
              >
                <ArrowLeft className="h-4 w-4" /> Alle Angebote
              </motion.button>
            )}
          </AnimatePresence>

          <div className={selectedOffer ? "" : "platform-layout"}>

            {/* Sidebar: Company + Filter */}
            <AnimatePresence initial={false}>
            {!selectedOffer && (
            <motion.aside
              className="filter-sidebar"
              initial={false}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              {/* ── Mobile: Toggle Row / Desktop: Stacked ── */}
              {(() => {
                const wizardStep = !companyType ? 0 : !companyBranche ? 1 : 2;
                const COMPANY_TYPES = [
                  { id: "kapitalgesellschaft", label: "Kapitalgesellschaft" },
                  { id: "personengesellschaft", label: "Personengesellschaft" },
                ] as const;
                const companySummary = companyBarComplete
                  ? `${companyType === "kapitalgesellschaft" ? "Kapitalgesellschaft" : "Personengesellschaft"} · ${BRANCHEN.find(b => b.id === companyBranche)?.label ?? companyBranche} · ${formatCurrency(companyRevenue!)}/Jahr`
                  : null;
                const mobileActivePanel = showFilter ? "filter" : companyBarOpen ? "company" : null;
                return (
                  <>
                    {/* Toggle buttons row (mobile only, desktop hidden via CSS) */}
                    <div className="sidebar-toggle-row">
                      <button
                        className={`sidebar-pill${showFilter ? " sidebar-pill-active" : ""}`}
                        onClick={() => { setShowFilter(v => !v); if (!showFilter) setCompanyBarOpen(false); }}
                      >
                        <SlidersHorizontal className="h-3.5 w-3.5" />
                        <span>Filter</span>
                        {activeFilterCount > 0 && (
                          <span className="sidebar-accordion-badge">{activeFilterCount}</span>
                        )}
                        <ChevronDown className={`sidebar-pill-chevron${showFilter ? " sidebar-pill-chevron-open" : ""}`} />
                      </button>
                      <button
                        className={`sidebar-pill${companyBarOpen ? " sidebar-pill-active" : ""}`}
                        onClick={() => { setCompanyBarOpen(o => !o); if (!companyBarOpen) setShowFilter(false); }}
                      >
                        <Building2 className="h-3.5 w-3.5" />
                        <span>{companyProfile?.name || "Unternehmen"}</span>
                        <ChevronDown className={`sidebar-pill-chevron${companyBarOpen ? " sidebar-pill-chevron-open" : ""}`} />
                      </button>
                    </div>

                    {/* Desktop: Company Accordion (above filter) */}
                    <div className="sidebar-accordion sidebar-desktop-company">
                      <button className="sidebar-accordion-toggle" onClick={() => setCompanyBarOpen(o => !o)}>
                        <span className="sidebar-accordion-toggle-left">
                          <Building2 className="h-4 w-4 text-turquoise shrink-0" />
                          <span className="sidebar-accordion-text">
                            <span className="sidebar-accordion-label">{companyProfile?.name || "Unternehmen"}</span>
                            {companySummary && !companyBarOpen && (
                              <span className="sidebar-accordion-hint">{companySummary}</span>
                            )}
                          </span>
                        </span>
                        <ChevronDown className={`filter-mobile-toggle-icon${companyBarOpen ? " filter-mobile-toggle-icon-open" : ""}`} />
                      </button>
                      {companyBarOpen && (
                        companyBarComplete ? (
                          <div className="sidebar-accordion-body">
                            <div className="company-fields-inline">
                              <span className="company-inline-label">Rechtsform</span>
                              {COMPANY_TYPES.map(({ id, label }) => (
                                <button key={id} className={`company-prompt-chip${companyType === id ? " company-prompt-chip-selected" : ""}`}
                                  onClick={() => { setCompanyType(id); saveCompanyBar({ companyType: id }); }}>
                                  {label}
                                </button>
                              ))}
                              <span className="company-inline-label">Branche</span>
                              {BRANCHEN.map(({ id, label }) => (
                                <button key={id} className={`company-prompt-chip${companyBranche === id ? " company-prompt-chip-selected" : ""}`}
                                  onClick={() => { setCompanyBranche(id); saveCompanyBar({ branche: id }); }}>
                                  {label}
                                </button>
                              ))}
                              <span className="company-inline-label">Umsatz</span>
                              <div className="company-prompt-revenue-wrap">
                                <GermanNumberInput value={companyRevenue} min={1} max={100_000_000} step={10000}
                                  onChange={v => { setCompanyRevenue(v); if (v) saveCompanyBar({ revenue: v }); }}
                                  onEnter={() => setCompanyBarOpen(false)}
                                  placeholder="500.000" className="admin-input" style={{ width: "100%", paddingRight: "2rem" }} />
                                <span className="company-prompt-revenue-suffix">€</span>
                              </div>
                            </div>
                            {companyProfile && (
                              <div className="sidebar-company-profile">
                                <span className="sidebar-field-label">Firmenprofil</span>
                                <div className="sidebar-profile-inline">
                                  {[
                                    companyProfile.hrb,
                                    companyProfile.ust_id,
                                    companyProfile.website?.replace(/^https?:\/\//, ""),
                                    [companyProfile.street, [companyProfile.zip, companyProfile.city].filter(Boolean).join(" ")].filter(Boolean).join(", "),
                                  ].filter(Boolean).map((item, i) => (
                                    <span key={i} className="sidebar-profile-meta-item">{item}</span>
                                  ))}
                                </div>
                                <a href="/plattform/profil" className="sidebar-profile-link">Profil bearbeiten</a>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="company-incomplete-wrap">
                            <div className="company-incomplete-spinner" />
                            <div className="company-incomplete-inner">
                              <p className="sidebar-field-hint">
                                {wizardStep === 0 && "Vervollständigen Sie Ihre Angaben"}
                                {wizardStep === 1 && "In welcher Branche sind Sie tätig?"}
                                {wizardStep === 2 && "Wie hoch ist Ihr Jahresumsatz?"}
                              </p>
                              <AnimatePresence mode="wait">
                                {wizardStep === 0 && (
                                  <motion.div key="s0" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
                                    <div className="company-prompt-chips">
                                      {COMPANY_TYPES.map(({ id, label }) => (
                                        <button key={id} className="company-prompt-chip"
                                          onClick={() => { setCompanyType(id); saveCompanyBar({ companyType: id }); }}>
                                          {label}
                                        </button>
                                      ))}
                                    </div>
                                  </motion.div>
                                )}
                                {wizardStep === 1 && (
                                  <motion.div key="s1" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
                                    <div className="company-prompt-chips">
                                      {BRANCHEN.map(({ id, label }) => (
                                        <button key={id} className="company-prompt-chip"
                                          onClick={() => { setCompanyBranche(id); saveCompanyBar({ branche: id }); }}>
                                          {label}
                                        </button>
                                      ))}
                                    </div>
                                    <button className="company-prompt-back" onClick={() => { setCompanyType(""); saveCompanyBar({ companyType: "" }); }}>
                                      <ArrowLeft /> Zurück
                                    </button>
                                  </motion.div>
                                )}
                                {wizardStep === 2 && (
                                  <motion.div key="s2" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
                                    <div className="company-prompt-revenue">
                                      <div className="company-prompt-revenue-wrap">
                                        <GermanNumberInput value={companyRevenue} min={1} max={100_000_000} step={10000}
                                          onChange={v => { setCompanyRevenue(v); if (v) saveCompanyBar({ revenue: v }); }}
                                          onEnter={() => { if (companyRevenue) { saveCompanyBar({ revenue: companyRevenue }); setCompanyBarOpen(false); } }}
                                          placeholder="500.000" className="admin-input" style={{ width: "100%", paddingRight: "2rem" }} />
                                        <span className="company-prompt-revenue-suffix">€</span>
                                      </div>
                                      <button className="btn btn-primary btn-md" disabled={!companyRevenue}
                                        onClick={() => { if (companyRevenue) { saveCompanyBar({ revenue: companyRevenue }); setCompanyBarOpen(false); } }}>
                                        Fertig
                                      </button>
                                    </div>
                                    <button className="company-prompt-back" onClick={() => { setCompanyBranche(""); saveCompanyBar({ branche: "" }); }}>
                                      <ArrowLeft /> Zurück
                                    </button>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        )
                      )}
                    </div>

                    {/* Desktop: Filter Accordion (toggle hidden via CSS, body always visible) */}
                    <div className="sidebar-accordion sidebar-desktop-filter">
                      <button className="sidebar-accordion-toggle" onClick={() => setShowFilter(v => !v)}>
                        <span className="sidebar-accordion-toggle-left">
                          <SlidersHorizontal className="h-4 w-4 text-turquoise" />
                          <span className="sidebar-accordion-label">Filter</span>
                          {activeFilterCount > 0 && (
                            <span className="sidebar-accordion-badge">{activeFilterCount}</span>
                          )}
                        </span>
                        <ChevronDown className={`filter-mobile-toggle-icon${showFilter ? " filter-mobile-toggle-icon-open" : ""}`} />
                      </button>

                      <div className={`sidebar-accordion-body${showFilter ? "" : " sidebar-accordion-body-hidden"}`}>
                        <div className="filter-group">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-turquoise" />
                            <span className="filter-label">Laufzeit</span>
                          </div>
                          <div className="text-center">
                            <span className="filter-value">{termMonths} Monate</span>
                          </div>
                          <input type="range" min={1} max={60} step={1} value={termMonths}
                            onChange={e => setTermMonths(+e.target.value)}
                            className="funnel-slider" style={{ background: sliderBg(termMonths, 1, 60) }} />
                          <div className="funnel-slider-labels"><span>1</span><span>60 Mo</span></div>
                        </div>

                        <div className="filter-group">
                          <div className="flex items-center gap-1.5">
                            <Banknote className="h-3.5 w-3.5 text-turquoise" />
                            <span className="filter-label">Volumen</span>
                          </div>
                          <div className="text-center">
                            <span className="filter-value">{formatCurrency(volume)}</span>
                          </div>
                          <input type="range" min={5000} max={500000} step={5000} value={volume}
                            onChange={e => setVolume(+e.target.value)}
                            className="funnel-slider" style={{ background: sliderBg(volume, 5000, 500000) }} />
                          <div className="funnel-slider-labels"><span>5k</span><span>500k</span></div>
                        </div>

                        <div className="filter-group">
                          <span className="filter-label">Verwendungszweck</span>
                          {([
                            { id: "wareneinkauf", label: "Wareneinkauf" },
                            { id: "liquiditaet", label: "Liquiditätsengpass" },
                            { id: "wachstum", label: "Wachstum & Expansion" },
                            { id: "marketing", label: "Marketing" },
                            { id: "steuer", label: "Steuerrückzahlung" },
                            { id: "andere", label: "Andere" },
                          ]).map(({ id, label }) => {
                            const active = filterUseCases.includes(id);
                            return (
                              <button
                                key={id}
                                onClick={() => setFilterUseCases(active ? filterUseCases.filter((u) => u !== id) : [...filterUseCases, id])}
                                className={`w-full text-left text-xs font-medium px-3 py-2 rounded-lg mb-1 transition-all cursor-pointer flex items-center justify-between ${active ? "bg-turquoise text-white" : "bg-gray-100 text-subtle hover:bg-gray-200"}`}
                              >
                                {label}
                                {active && <Check className="h-3 w-3" />}
                              </button>
                            );
                          })}
                        </div>

                        <div className="filter-group">
                          <span className="filter-label">Merkmale</span>
                          <div>
                          {([
                            { label: "Aufstockung möglich", value: filterTopUp, set: setFilterTopUp },
                            { label: "48h Auszahlung", value: filter48h, set: setFilter48h },
                            { label: "Flexible Rückzahlung", value: filterFlexRepayment, set: setFilterFlexRepayment },
                            { label: "Tilgungsfreie Zeit", value: filterGracePeriod, set: setFilterGracePeriod },
                            { label: "Negative Schufa/Crefo", value: filterNegativeSchufa, set: setFilterNegativeSchufa },
                          ] as { label: string; value: boolean; set: (v: boolean) => void }[]).map(({ label, value, set }) => (
                            <button
                              key={label}
                              onClick={() => set(!value)}
                              className={`w-full text-left text-xs font-medium px-3 py-2 rounded-lg mb-1 transition-all cursor-pointer flex items-center justify-between ${value ? "bg-turquoise text-white" : "bg-gray-100 text-subtle hover:bg-gray-200"}`}
                            >
                              {label}
                              {value && <Check className="h-3 w-3" />}
                            </button>
                          ))}
                          </div>
                        </div>

                        {(termMonths !== 12 || volume !== 50000 || filterTopUp || filter48h || filterFlexRepayment || filterGracePeriod || filterNegativeSchufa || filterUseCases.length > 0) && (
                          <button
                            onClick={() => { setTermMonths(12); setVolume(50000); setFilterTopUp(false); setFilter48h(false); setFilterFlexRepayment(false); setFilterGracePeriod(false); setFilterNegativeSchufa(false); setFilterUseCases([]); }}
                            className="w-full text-center text-xs text-turquoise font-semibold mt-1 hover:underline cursor-pointer"
                          >
                            Zurücksetzen
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Mobile: Expanded body (below toggle row) */}
                    <AnimatePresence mode="wait">
                      {mobileActivePanel === "filter" && (
                        <motion.div
                          key="mobile-filter"
                          className="sidebar-mobile-body"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25, ease: "easeInOut" }}
                        >
                          <div className="sidebar-accordion-body">
                            <div className="filter-group">
                              <div className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5 text-turquoise" />
                                <span className="filter-label">Laufzeit</span>
                              </div>
                              <div className="text-center">
                                <span className="filter-value">{termMonths} Monate</span>
                              </div>
                              <input type="range" min={1} max={60} step={1} value={termMonths}
                                onChange={e => setTermMonths(+e.target.value)}
                                className="funnel-slider" style={{ background: sliderBg(termMonths, 1, 60) }} />
                              <div className="funnel-slider-labels"><span>1</span><span>60 Mo</span></div>
                            </div>

                            <div className="filter-group">
                              <div className="flex items-center gap-1.5">
                                <Banknote className="h-3.5 w-3.5 text-turquoise" />
                                <span className="filter-label">Volumen</span>
                              </div>
                              <div className="text-center">
                                <span className="filter-value">{formatCurrency(volume)}</span>
                              </div>
                              <input type="range" min={5000} max={500000} step={5000} value={volume}
                                onChange={e => setVolume(+e.target.value)}
                                className="funnel-slider" style={{ background: sliderBg(volume, 5000, 500000) }} />
                              <div className="funnel-slider-labels"><span>5k</span><span>500k</span></div>
                            </div>

                            <div className="filter-group">
                              <span className="filter-label">Verwendungszweck</span>
                              {([
                                { id: "wareneinkauf", label: "Wareneinkauf" },
                                { id: "liquiditaet", label: "Liquiditätsengpass" },
                                { id: "wachstum", label: "Wachstum & Expansion" },
                                { id: "marketing", label: "Marketing" },
                                { id: "steuer", label: "Steuerrückzahlung" },
                                { id: "andere", label: "Andere" },
                              ]).map(({ id, label }) => {
                                const active = filterUseCases.includes(id);
                                return (
                                  <button
                                    key={id}
                                    onClick={() => setFilterUseCases(active ? filterUseCases.filter((u) => u !== id) : [...filterUseCases, id])}
                                    className={`w-full text-left text-xs font-medium px-3 py-2 rounded-lg mb-1 transition-all cursor-pointer flex items-center justify-between ${active ? "bg-turquoise text-white" : "bg-gray-100 text-subtle hover:bg-gray-200"}`}
                                  >
                                    {label}
                                    {active && <Check className="h-3 w-3" />}
                                  </button>
                                );
                              })}
                            </div>

                            <div className="filter-group">
                              <span className="filter-label">Merkmale</span>
                              <div>
                              {([
                                { label: "Aufstockung möglich", value: filterTopUp, set: setFilterTopUp },
                                { label: "48h Auszahlung", value: filter48h, set: setFilter48h },
                                { label: "Flexible Rückzahlung", value: filterFlexRepayment, set: setFilterFlexRepayment },
                                { label: "Tilgungsfreie Zeit", value: filterGracePeriod, set: setFilterGracePeriod },
                                { label: "Negative Schufa/Crefo", value: filterNegativeSchufa, set: setFilterNegativeSchufa },
                              ] as { label: string; value: boolean; set: (v: boolean) => void }[]).map(({ label, value, set }) => (
                                <button
                                  key={label}
                                  onClick={() => set(!value)}
                                  className={`w-full text-left text-xs font-medium px-3 py-2 rounded-lg mb-1 transition-all cursor-pointer flex items-center justify-between ${value ? "bg-turquoise text-white" : "bg-gray-100 text-subtle hover:bg-gray-200"}`}
                                >
                                  {label}
                                  {value && <Check className="h-3 w-3" />}
                                </button>
                              ))}
                              </div>
                            </div>

                            {(termMonths !== 12 || volume !== 50000 || filterTopUp || filter48h || filterFlexRepayment || filterGracePeriod || filterNegativeSchufa || filterUseCases.length > 0) && (
                              <button
                                onClick={() => { setTermMonths(12); setVolume(50000); setFilterTopUp(false); setFilter48h(false); setFilterFlexRepayment(false); setFilterGracePeriod(false); setFilterNegativeSchufa(false); setFilterUseCases([]); }}
                                className="w-full text-center text-xs text-turquoise font-semibold mt-1 hover:underline cursor-pointer"
                              >
                                Zurücksetzen
                              </button>
                            )}
                          </div>
                        </motion.div>
                      )}
                      {mobileActivePanel === "company" && (
                        <motion.div
                          key="mobile-company"
                          className="sidebar-mobile-body"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25, ease: "easeInOut" }}
                        >
                          {companyBarComplete ? (
                            <div className="sidebar-accordion-body">
                              <div className="company-fields-inline">
                                <span className="company-inline-label">Rechtsform</span>
                                {COMPANY_TYPES.map(({ id, label }) => (
                                  <button key={id} className={`company-prompt-chip${companyType === id ? " company-prompt-chip-selected" : ""}`}
                                    onClick={() => { setCompanyType(id); saveCompanyBar({ companyType: id }); }}>
                                    {label}
                                  </button>
                                ))}
                                <span className="company-inline-label">Branche</span>
                                {BRANCHEN.map(({ id, label }) => (
                                  <button key={id} className={`company-prompt-chip${companyBranche === id ? " company-prompt-chip-selected" : ""}`}
                                    onClick={() => { setCompanyBranche(id); saveCompanyBar({ branche: id }); }}>
                                    {label}
                                  </button>
                                ))}
                                <span className="company-inline-label">Umsatz</span>
                                <div className="company-prompt-revenue-wrap">
                                  <GermanNumberInput value={companyRevenue} min={1} max={100_000_000} step={10000}
                                    onChange={v => { setCompanyRevenue(v); if (v) saveCompanyBar({ revenue: v }); }}
                                    onEnter={() => setCompanyBarOpen(false)}
                                    placeholder="500.000" className="admin-input" style={{ width: "100%", paddingRight: "2rem" }} />
                                  <span className="company-prompt-revenue-suffix">€</span>
                                </div>
                              </div>
                              {companyProfile && (
                                <div className="sidebar-company-profile">
                                  <span className="sidebar-field-label">Firmenprofil</span>
                                  <div className="sidebar-profile-inline">
                                    {[
                                      companyProfile.hrb,
                                      companyProfile.ust_id,
                                      companyProfile.website?.replace(/^https?:\/\//, ""),
                                      [companyProfile.street, [companyProfile.zip, companyProfile.city].filter(Boolean).join(" ")].filter(Boolean).join(", "),
                                    ].filter(Boolean).map((item, i) => (
                                      <span key={i} className="sidebar-profile-meta-item">{item}</span>
                                    ))}
                                  </div>
                                  <a href="/plattform/profil" className="sidebar-profile-link">Profil bearbeiten</a>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="company-incomplete-wrap">
                              <div className="company-incomplete-spinner" />
                              <div className="company-incomplete-inner">
                                <p className="sidebar-field-hint">
                                  {wizardStep === 0 && "Vervollständigen Sie Ihre Angaben"}
                                  {wizardStep === 1 && "In welcher Branche sind Sie tätig?"}
                                  {wizardStep === 2 && "Wie hoch ist Ihr Jahresumsatz?"}
                                </p>
                                <AnimatePresence mode="wait">
                                  {wizardStep === 0 && (
                                    <motion.div key="s0" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
                                      <div className="company-prompt-chips">
                                        {COMPANY_TYPES.map(({ id, label }) => (
                                          <button key={id} className="company-prompt-chip"
                                            onClick={() => { setCompanyType(id); saveCompanyBar({ companyType: id }); }}>
                                            {label}
                                          </button>
                                        ))}
                                      </div>
                                    </motion.div>
                                  )}
                                  {wizardStep === 1 && (
                                    <motion.div key="s1" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
                                      <div className="company-prompt-chips">
                                        {BRANCHEN.map(({ id, label }) => (
                                          <button key={id} className="company-prompt-chip"
                                            onClick={() => { setCompanyBranche(id); saveCompanyBar({ branche: id }); }}>
                                            {label}
                                          </button>
                                        ))}
                                      </div>
                                      <button className="company-prompt-back" onClick={() => { setCompanyType(""); saveCompanyBar({ companyType: "" }); }}>
                                        <ArrowLeft /> Zurück
                                      </button>
                                    </motion.div>
                                  )}
                                  {wizardStep === 2 && (
                                    <motion.div key="s2" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
                                      <div className="company-prompt-revenue">
                                        <div className="company-prompt-revenue-wrap">
                                          <GermanNumberInput value={companyRevenue} min={1} max={100_000_000} step={10000}
                                            onChange={v => { setCompanyRevenue(v); if (v) saveCompanyBar({ revenue: v }); }}
                                            onEnter={() => { if (companyRevenue) { saveCompanyBar({ revenue: companyRevenue }); setCompanyBarOpen(false); } }}
                                            placeholder="500.000" className="admin-input" style={{ width: "100%", paddingRight: "2rem" }} />
                                          <span className="company-prompt-revenue-suffix">€</span>
                                        </div>
                                        <button className="btn btn-primary btn-md" disabled={!companyRevenue}
                                          onClick={() => { if (companyRevenue) { saveCompanyBar({ revenue: companyRevenue }); setCompanyBarOpen(false); } }}>
                                          Fertig
                                        </button>
                                      </div>
                                      <button className="company-prompt-back" onClick={() => { setCompanyBranche(""); saveCompanyBar({ branche: "" }); }}>
                                        <ArrowLeft /> Zurück
                                      </button>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                );
              })()}

            </motion.aside>
            )}
            </AnimatePresence>

            {/* Results */}
            <div className="platform-results">

              {/* My Applications */}
              {myApplications.length > 0 && !selectedOffer && (
                <MyApplicationsList
                  applications={myApplications}
                  offers={offers}
                  statusLabels={STATUS_LABELS}
                  formatCurrency={formatCurrency}
                />
              )}

              {/* Compact sliders (mobile only) */}
              {!selectedOffer && (
                <div className="compact-sliders">
                  <div className="compact-slider-row">
                    <span className="compact-slider-title"><Banknote className="h-3 w-3" /> Volumen</span>
                    <input type="range" min={5000} max={500000} step={5000} value={volume}
                      onChange={e => setVolume(+e.target.value)}
                      className="funnel-slider compact-slider-input" style={{ background: sliderBg(volume, 5000, 500000) }} />
                    <span className="compact-slider-label">{formatCurrency(volume)}</span>
                  </div>
                  <div className="compact-slider-row">
                    <span className="compact-slider-title"><Clock className="h-3 w-3" /> Laufzeit</span>
                    <input type="range" min={1} max={60} step={1} value={termMonths}
                      onChange={e => setTermMonths(+e.target.value)}
                      className="funnel-slider compact-slider-input" style={{ background: sliderBg(termMonths, 1, 60) }} />
                    <span className="compact-slider-label">{termMonths} Monate</span>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2">
                {loading ? (
                  Array.from({ length: skeletonStartCount }).map((_, i) => <SkeletonCard key={i} />)
                ) : sortedOffers.length === 0 && !selectedOffer ? (
                  <div className="bg-white rounded-lg p-8 text-center">
                    <Search className="h-8 w-8 text-turquoise mx-auto mb-3" />
                    <p className="font-bold text-dark mb-1">Keine passenden Angebote</p>
                    <p className="text-sm text-subtle mb-4">Filter anpassen, um mehr Angebote zu sehen.</p>
                    <button onClick={() => { setTermMonths(12); setVolume(50000); }} className="btn btn-md btn-primary">
                      Zurücksetzen
                    </button>
                  </div>
                ) : (
                  <AnimatePresence mode="popLayout" initial={false}>
                  {(selectedOffer ? sortedOffers.filter(o => o.product_id === selectedOffer.offer.product_id) : sortedOffers).map((offer) => {
                    const m = (offer.metadata ?? {}) as Record<string, unknown>;
                    const ctaPrimary = m.cta_primary as string | undefined;
                    const days = m.processing_time_days as number | undefined;
                    const approvalPct = m.approval_rate_pct as number | undefined;
                    const hasFeeModel = !!m.fee_model && (m.fee_pct_from as number | undefined) != null;
                    const feePctFrom = m.fee_pct_from as number | undefined;
                    const isSel = selectedOffer?.offer.product_id === offer.product_id;
                    const effectiveVolume = (isSel && funnelEstimate != null) ? funnelEstimate : Math.min(Math.max(volume, offer.min_volume), offer.max_volume);
                    const effectiveTerm = Math.min(Math.max(termMonths, offer.min_term_months), offer.max_term_months);
                    const volumeClamped = volume < offer.min_volume ? "min" : volume > offer.max_volume ? "max" : null;
                    const termClamped = termMonths < offer.min_term_months ? "min" : termMonths > offer.max_term_months ? "max" : null;
                    const feeEur = feePctFrom != null ? Math.round(effectiveVolume * feePctFrom / 100) : null;
                    const monthlyPayment = hasFeeModel
                      ? (feeEur != null ? Math.round((effectiveVolume + feeEur) / effectiveTerm) : null)
                      : Math.round(calculateMonthlyRate(effectiveVolume, offer.interest_rate_from ?? 0, effectiveTerm));
                    const merkmale: string[] = [];
                    if (m.revenue_based_repayment) merkmale.push("Umsatzbasierte Rückzahlung");
                    if (m.fixed_fee_no_interest) merkmale.push("Feste Gebühr statt Zinsen");
                    if (m.high_approval_rate) merkmale.push("Hohe Zusagequote");
                    if (m.up_to_2x_revenue) merkmale.push("Bis zu 2× Monatsumsatz");
                    if (m.top_up) merkmale.push("Aufstockung möglich");
                    if (m.payout_48h) merkmale.push("48h Auszahlung");
                    if (m.flexible_repayment) merkmale.push("Flexible Rückzahlung");
                    if (m.grace_period) merkmale.push("Tilgungsfreie Zeit");
                    if (m.negative_schufa) merkmale.push("Neg. Schufa/Crefo ok");
                    const rateStr = (offer.interest_rate_from ?? 0).toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 2 });
                    const laufzeit = `${effectiveTerm} Monate`;
                    const isExpanded = expandedIds.has(offer.product_id);
                    const feeModel = m.fee_model as string | undefined;
                    const repayment = m.repayment as string | undefined;
                    const description = m.description as string | undefined;
                    const req = (m.requirements ?? {}) as Record<string, unknown>;
                    const productUseCases = (m.use_cases as string[] | undefined) ?? [];

                    const isSelected = selectedOffer?.offer.product_id === offer.product_id;

                    return (
                      <motion.div
                        key={offer.product_id}
                        layout
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.97, y: -8 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                      >
                      <div className="offer-card" style={!matchesAll(offer) && !isSelected ? { opacity: 0.45 } : undefined}>
                        <div className="offer-card-body">
                          <div className="offer-card-grid">
                            {/* Col 1: Logo + Name + Description */}
                            <div className="offer-card-provider" style={{ flexDirection: "column", alignItems: "stretch", gap: "0.75rem" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
                                <div className="offer-provider-logo">
                                  {offer.provider_logo_url
                                    ? <img src={offer.provider_logo_url} alt={offer.provider_name} />
                                    : <span>{getProviderInitials(offer.provider_name)}</span>}
                                </div>
                                <div className="offer-provider-info">
                                  <div className="offer-provider-name">{offer.provider_name}</div>
                                  <div className="offer-product-name">{offer.product_name}</div>
                                  {(m.trustpilot as number) > 0 && (
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", marginTop: "0.25rem" }}>
                                      <svg width="58" height="11" viewBox="0 0 58 11" fill="none">
                                        {[0,1,2,3,4].map(j => (
                                          <g key={j} transform={`translate(${j * 12}, 0)`}>
                                            <rect width="11" height="11" rx="1.2" fill="#00b67a" />
                                            <path d="M5.5 2l1.2 2.5 2.7.2-2.1 1.8.6 2.7L5.5 7.8 3.1 9.2l.6-2.7L1.6 4.7l2.7-.2z" fill="#fff" />
                                          </g>
                                        ))}
                                      </svg>
                                      <span style={{ fontSize: "0.5625rem", fontWeight: 600, color: "var(--color-subtle)" }}>{(m.trustpilot as number).toLocaleString("de-DE", { minimumFractionDigits: 1 })}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              {description && (
                                <p style={{ fontSize: "0.75rem", color: "var(--color-subtle)", lineHeight: 1.5 }}>{description}</p>
                              )}
                            </div>

                            {/* Col 2: Signal bars */}
                            <div className="offer-signals">
                              <SignalBar label="Geschwindigkeit" metric={speedScore(days, m.speed_score as number | undefined)} />
                              <SignalBar label="Annahmequote" metric={approvalScore(approvalPct, (() => {
                                const explicit = m.approval_score as number | undefined;
                                const above = m.approval_score_above_60k as number | undefined;
                                if (above != null && effectiveVolume > 60000) return above;
                                return explicit;
                              })())} />
                              <SignalBar label="Preis" metric={priceScore(offer.interest_rate_from, hasFeeModel, m.price_score as number | undefined)} />
                              <SignalBar label="Flexibilität" metric={flexibilityScore(offer.product_type, m)} />
                            </div>

                            {/* Col 3: Merkmale */}
                            {merkmale.length > 0 && (
                              <div className="offer-pros">
                                {merkmale.map((p) => (
                                  <div key={p} className="offer-pro-item">
                                    <Check className="offer-pro-icon" />
                                    <span>{p}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Col 4: Konditionen + CTA */}
                            <div className="offer-card-pricing">
                              <div className="offer-terms-compact">
                                <span className="offer-terms-laufzeit">{effectiveVolume.toLocaleString("de-DE")} €</span>
                                <span className="offer-terms-rate">{`${rateStr}%`}</span>
                                {monthlyPayment != null && (
                                  <span className="offer-terms-calc">{`${monthlyPayment.toLocaleString("de-DE")} € mtl.`}</span>
                                )}
                                <div className="offer-terms-laufzeit">{laufzeit}</div>
                              </div>
                              {appliedProductIds.has(offer.product_id) ? (
                                <span style={{
                                  fontSize: "0.75rem", fontWeight: 700, color: "var(--color-turquoise)",
                                  padding: "0.5rem 1rem", borderRadius: "0.5rem",
                                  background: "rgba(80,122,166,0.08)", display: "inline-flex", alignItems: "center", gap: "0.375rem",
                                }}>
                                  <Check className="h-3 w-3" /> Angefragt
                                </span>
                              ) : (
                                <button
                                  className="offer-cta"
                                  onClick={() => handleCta(offer, effectiveVolume, effectiveTerm)}
                                >
                                  {ctaPrimary ?? "Jetzt anfragen"} <ArrowRight className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Accordion toggle – inside card-body, no border */}
                          <button
                            className="offer-accordion-toggle"
                            onClick={() => setExpandedIds(prev => { const s = new Set(prev); isExpanded ? s.delete(offer.product_id) : s.add(offer.product_id); return s; })}
                          >
                            <ChevronDown className={`offer-accordion-chevron${isExpanded ? " offer-accordion-chevron-open" : ""}`} />
                            <span>{isExpanded ? "Weniger" : "Details"}</span>
                          </button>
                        </div>

                        {/* Accordion panel with tabs */}
                        {isExpanded && (() => {
                          const currentTab = activeTab[offer.product_id] ?? "description";
                          const longDescription = (m.long_description as string) ?? description;
                          const processSteps = (m.process_steps as string[] | undefined) ?? [];
                          return (
                            <div className="offer-accordion-panel">
                              {/* Tab headers */}
                              <div style={{ display: "flex", gap: "1.5rem", borderBottom: "1px solid var(--color-light-bg)", marginBottom: "1rem" }}>
                                {([
                                  { id: "description" as const, label: "Produktbeschreibung" },
                                  { id: "process" as const, label: "Antragsprozess" },
                                  { id: "conditions" as const, label: "Konditionen" },
                                ]).map(({ id, label }) => {
                                  const isActiveTab = currentTab === id;
                                  return (
                                    <button
                                      key={id}
                                      type="button"
                                      onClick={() => setActiveTab(prev => ({ ...prev, [offer.product_id]: id }))}
                                      style={{
                                        background: "none",
                                        border: "none",
                                        padding: "0.5rem 0",
                                        fontSize: "0.75rem",
                                        fontWeight: isActiveTab ? 700 : 600,
                                        color: isActiveTab ? "var(--color-dark)" : "var(--color-subtle)",
                                        cursor: "pointer",
                                        borderBottom: isActiveTab ? "2px solid var(--color-turquoise)" : "2px solid transparent",
                                        marginBottom: "-1px",
                                      }}
                                    >
                                      {label}
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Tab content */}
                              {currentTab === "description" && (
                                <div>
                                  {offer.provider_name === "iwoca" ? (
                                    <div>
                                      {/* Hero box */}
                                      <div style={{ textAlign: "center", padding: "1rem", background: "var(--color-light-bg)", borderRadius: "0.75rem", marginBottom: "1.25rem" }}>
                                        <p style={{ fontFamily: "var(--font-heading)", fontSize: "1.125rem", fontWeight: 700, color: "var(--color-dark)", marginBottom: "0.375rem" }}>Firmenkredite zugeschnitten auf Ihre Bedürfnisse</p>
                                        <p style={{ fontSize: "0.75rem", color: "var(--color-subtle)", lineHeight: 1.5 }}>Nehmen Sie zwischen 1.000 € und 500.000 € auf — finanzieren Sie Wachstum, überbrücken Sie Liquiditätsengpässe oder kaufen Sie Waren ein.</p>
                                      </div>
                                      {/* 6 Features grid 3x2 */}
                                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
                                        {([
                                          { Icon: Users, title: "Für alle Branchen und Rechtsformen", text: "Zur freien geschäftlichen Verwendung." },
                                          { Icon: Zap, title: "Schneller papierloser Antrag", text: "In nur 5 Minuten, komplett ohne Papierkram." },
                                          { Icon: Banknote, title: "Entscheidung und Auszahlung in 48 Std.", text: "Sie bestimmen die Auszahlungssumme selbst." },
                                          { Icon: Headphones, title: "Persönlicher Kundenservice", text: "Ihre Ansprechperson unterstützt Sie auf Wunsch bei jedem Schritt." },
                                          { Icon: SlidersHorizontal, title: "Flexible Laufzeit und Rückzahlung", text: "Laufzeit von 1 Tag bis 5 Jahre — jederzeit kostenlos tilgen." },
                                          { Icon: ReceiptText, title: "Transparente Kosten", text: "Zinsen von 1 % bis 2,99 % p.M., ohne versteckte Gebühren." },
                                        ] as const).map(({ Icon, title, text }) => (
                                          <div key={title} style={{ display: "flex", gap: "0.75rem", padding: "0.875rem" }}>
                                            <div style={{ width: "2.25rem", height: "2.25rem", borderRadius: "0.5rem", background: "var(--color-light-bg)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                              <Icon style={{ width: "1.125rem", height: "1.125rem", color: "var(--color-turquoise)" }} />
                                            </div>
                                            <div>
                                              <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--color-dark)", marginBottom: "0.25rem" }}>{title}</p>
                                              <p style={{ fontSize: "0.75rem", color: "var(--color-subtle)", lineHeight: 1.5 }}>{text}</p>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ) : offer.provider_name === "YouLend" ? (
                                    <div>
                                      {/* Trust banner */}
                                      <div style={{ textAlign: "center", padding: "1rem", background: "var(--color-light-bg)", borderRadius: "0.75rem", marginBottom: "1.25rem" }}>
                                        <p style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--color-dark)", marginBottom: "0.125rem" }}>Über 300.000 zufriedene Kunden</p>
                                        <p style={{ fontSize: "0.75rem", color: "var(--color-subtle)" }}>aus 10 Ländern weltweit</p>
                                      </div>

                                      {/* 4 Features grid */}
                                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
                                        {([
                                          { Icon: Banknote, title: "Klare Preisgestaltung", text: "Keine Zinsen — Sie zahlen nur eine im Voraus vereinbarte feste Gebühr." },
                                          { Icon: RefreshCw, title: "Keine großen monatlichen Rechnungen", text: "Sie zahlen automatisch mit einem Prozentsatz von den Auszahlungen, die Sie erhalten." },
                                          { Icon: Zap, title: "Schneller als eine Bank", text: "Sichere Finanzierung in nur 24 Stunden." },
                                          { Icon: Sparkles, title: "Maßgeschneiderte Angebote", text: "Bis zum 2-fachen Ihrer monatlichen Einnahmen aus Karten- oder Online-Verkäufen." },
                                        ] as const).map(({ Icon, title, text }) => (
                                          <div key={title} style={{ display: "flex", gap: "0.75rem", padding: "0.875rem" }}>
                                            <div style={{ width: "2.25rem", height: "2.25rem", borderRadius: "0.5rem", background: "var(--color-light-bg)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                              <Icon style={{ width: "1.125rem", height: "1.125rem", color: "var(--color-turquoise)" }} />
                                            </div>
                                            <div>
                                              <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--color-dark)", marginBottom: "0.25rem" }}>{title}</p>
                                              <p style={{ fontSize: "0.75rem", color: "var(--color-subtle)", lineHeight: 1.5 }}>{text}</p>
                                            </div>
                                          </div>
                                        ))}
                                      </div>

                                      {/* Repayment visualization */}
                                      <div style={{ marginTop: "1.5rem", padding: "1.5rem", background: "#fff", borderRadius: "0.75rem", display: "flex", flexDirection: "column-reverse", gap: "1.5rem", alignItems: "center" }} className="yl-repayment-grid">
                                        <div style={{ borderRadius: "0.625rem", overflow: "hidden", width: "100%", maxWidth: "240px" }}>
                                          {/* eslint-disable-next-line @next/next/no-img-element */}
                                          <img src="/img/youlend-portal.png" alt="YouLend Dashboard mit Zahlungsfortschritt" style={{ width: "100%", height: "auto", display: "block" }} />
                                        </div>
                                        <div>
                                          <p style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--color-turquoise)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.5rem" }}>So funktioniert die Rückzahlung</p>
                                          <p style={{ fontFamily: "var(--font-heading)", fontSize: "1.125rem", fontWeight: 700, color: "var(--color-dark)", lineHeight: 1.3, marginBottom: "0.625rem" }}>Wie eine Umsatzbeteiligung — keine festen Raten</p>
                                          <p style={{ fontSize: "0.8125rem", color: "var(--color-subtle)", lineHeight: 1.6, marginBottom: "0.875rem" }}>
                                            Sie zahlen automatisch einen festen Prozentsatz Ihrer täglichen Umsätze zurück. In starken Monaten zahlen Sie mehr, in schwachen Monaten weniger. So bleibt Ihr Cashflow flexibel.
                                          </p>
                                          <div style={{ padding: "0.75rem 0.875rem", background: "var(--color-light-bg)", borderRadius: "0.5rem", borderLeft: "3px solid var(--color-turquoise)" }}>
                                            <p style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--color-subtle)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.25rem" }}>Beispiel</p>
                                            <p style={{ fontSize: "0.75rem", color: "var(--color-dark)", lineHeight: 1.5 }}>
                                              Bei <strong>18 % Rückzahlungsrate</strong> und einem Tagesumsatz von <strong>1.000 €</strong> zahlen Sie automatisch <strong>180 €</strong> zurück. An umsatzschwachen Tagen entsprechend weniger.
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ) : longDescription ? (
                                    <p style={{ fontSize: "0.8125rem", color: "var(--color-dark)", lineHeight: 1.6 }}>{longDescription}</p>
                                  ) : (
                                    <p style={{ fontSize: "0.75rem", color: "var(--color-subtle)" }}>Keine Produktbeschreibung hinterlegt.</p>
                                  )}
                                  {productUseCases.length > 0 && (
                                    <div style={{ marginTop: "1rem" }}>
                                      <p className="offer-accordion-col-title">Geeignet für</p>
                                      <div className="flex flex-wrap gap-1.5 mt-1">
                                        {productUseCases.map((uc) => (
                                          <span key={uc} style={{ fontSize: "0.6875rem", fontWeight: 600, padding: "0.25rem 0.625rem", borderRadius: "999px", background: filterUseCases.includes(uc) ? "var(--color-turquoise)" : "var(--color-light-bg)", color: filterUseCases.includes(uc) ? "#fff" : "var(--color-subtle)" }}>
                                            {USE_CASE_LABELS[uc] ?? uc}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {currentTab === "process" && (
                                <div>
                                  {offer.provider_name === "iwoca" ? (
                                    <div style={{ textAlign: "center", padding: "0.5rem 0" }}>
                                      <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.25rem", fontWeight: 700, color: "var(--color-dark)", marginBottom: "0.375rem" }}>Wie funktionieren Kredite von iwoca?</h3>
                                      <p style={{ fontSize: "0.8125rem", color: "var(--color-subtle)", marginBottom: "1.75rem" }}>Wir zeigen Ihnen, wie Sie Ihre Finanzierung in nur 3 schnellen Schritten erhalten.</p>
                                      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr auto 1fr", gap: "1rem", alignItems: "start", padding: "1rem 0", marginBottom: "1.5rem" }}>
                                        {([
                                          { num: "1", title: "Antrag in 5 Minuten stellen", sub: "Wunschbetrag wählen, Firmen- und Kontodaten eingeben, Dokumente hochladen" },
                                          { num: "2", title: "In 48 Stunden auf dem Konto", sub: "Kreditentscheidung in 24 Stunden, dann direkt aufs Konto" },
                                          { num: "3", title: "Flexible Aufstockung & Tilgung", sub: "Kostenlose Sondertilgungen jederzeit möglich" },
                                        ]).flatMap(({ num, title, sub }, idx, arr) => [
                                          <div key={num} style={{ textAlign: "center" }}>
                                            <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "50%", background: "var(--color-dark)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 0.5rem", fontSize: "0.875rem", fontWeight: 700 }}>{num}</div>
                                            <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--color-dark)" }}>{title}</p>
                                            <p style={{ fontSize: "0.6875rem", color: "var(--color-subtle)", marginTop: "0.125rem", lineHeight: 1.4 }}>{sub}</p>
                                          </div>,
                                          ...(idx < arr.length - 1 ? [<div key={`arrow-${idx}`} style={{ display: "flex", alignItems: "center", justifyContent: "center", paddingTop: "0.875rem" }}><ArrowRight style={{ width: "1rem", height: "1rem", color: "var(--color-border)" }} /></div>] : []),
                                        ])}
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleCta(offer, effectiveVolume, effectiveTerm)}
                                        className="btn btn-primary btn-md"
                                        style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem" }}
                                      >
                                        Jetzt anfragen <ArrowRight style={{ width: "0.875rem", height: "0.875rem" }} />
                                      </button>
                                    </div>
                                  ) : offer.provider_name === "YouLend" ? (
                                    <div style={{ textAlign: "center", padding: "0.5rem 0" }}>
                                      <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.25rem", fontWeight: 700, color: "var(--color-dark)", marginBottom: "0.375rem" }}>Komplett digitaler Antrag</h3>
                                      <p style={{ fontSize: "0.8125rem", color: "var(--color-subtle)", marginBottom: "1.75rem" }}>Geld auf dem Konto innerhalb von 24–48 Stunden.</p>
                                      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr auto 1fr auto 1fr", gap: "0.875rem", alignItems: "start", padding: "1rem 0", marginBottom: "1.5rem" }}>
                                        {([
                                          { num: "1", title: "Anfrage stellen", sub: "Daten bei LiQiNow ausfüllen" },
                                          { num: "2", title: "Antrag bestätigen", sub: "Direkt bei YouLend" },
                                          { num: "3", title: "Antrag abschließen", sub: "Unterlagen hochladen" },
                                          { num: "4", title: "Geld erhalten", sub: "Innerhalb von 24h" },
                                        ]).flatMap(({ num, title, sub }, idx, arr) => [
                                          <div key={num} style={{ textAlign: "center" }}>
                                            <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "50%", background: "var(--color-dark)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 0.5rem", fontSize: "0.875rem", fontWeight: 700 }}>{num}</div>
                                            <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--color-dark)" }}>{title}</p>
                                            <p style={{ fontSize: "0.6875rem", color: "var(--color-subtle)", marginTop: "0.125rem", lineHeight: 1.4 }}>{sub}</p>
                                          </div>,
                                          ...(idx < arr.length - 1 ? [<div key={`arrow-${idx}`} style={{ display: "flex", alignItems: "center", justifyContent: "center", paddingTop: "0.875rem" }}><ArrowRight style={{ width: "1rem", height: "1rem", color: "var(--color-border)" }} /></div>] : []),
                                        ])}
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleCta(offer, effectiveVolume, effectiveTerm)}
                                        className="btn btn-primary btn-md"
                                        style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem" }}
                                      >
                                        Jetzt anfragen <ArrowRight style={{ width: "0.875rem", height: "0.875rem" }} />
                                      </button>
                                    </div>
                                  ) : processSteps.length > 0 ? (
                                    <ol style={{ display: "flex", flexDirection: "column", gap: "0.625rem", padding: 0, margin: 0, listStyle: "none" }}>
                                      {processSteps.map((s, idx) => (
                                        <li key={idx} style={{ display: "flex", gap: "0.625rem", alignItems: "flex-start", fontSize: "0.8125rem", color: "var(--color-dark)", lineHeight: 1.5 }}>
                                          <span style={{ width: "1.25rem", height: "1.25rem", borderRadius: "50%", background: "var(--color-turquoise)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.625rem", fontWeight: 700, flexShrink: 0 }}>{idx + 1}</span>
                                          <span>{s}</span>
                                        </li>
                                      ))}
                                    </ol>
                                  ) : (
                                    <p style={{ fontSize: "0.75rem", color: "var(--color-subtle)" }}>Kein Antragsprozess hinterlegt.</p>
                                  )}
                                </div>
                              )}

                              {currentTab === "conditions" && (
                                <div>
                                  <div className="offer-accordion-rows">
                                    <div className="offer-accordion-row"><span>Volumen</span><span>{formatCurrency(offer.min_volume)} – {formatCurrency(offer.max_volume)}</span></div>
                                    <div className="offer-accordion-row"><span>Laufzeit</span><span>{offer.min_term_months}–{offer.max_term_months} Monate</span></div>
                                    <div className="offer-accordion-row"><span>{hasFeeModel ? "Gebühr" : "Zinssatz"}</span><span>{hasFeeModel ? (feeModel ?? "Gebührenbasiert") : `${rateStr}% p.a.`}</span></div>
                                    {repayment && <div className="offer-accordion-row"><span>Rückzahlung</span><span>{repayment}</span></div>}
                                    {req.min_monthly_revenue_eur != null && <div className="offer-accordion-row"><span>Mindestumsatz</span><span>{(req.min_monthly_revenue_eur as number).toLocaleString("de-DE")} €/Mo.</span></div>}
                                  </div>

                                  {/* iwoca: required documents table */}
                                  {offer.provider_name === "iwoca" && (
                                    <div style={{ marginTop: "1.75rem" }}>
                                      <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--color-dark)", marginBottom: "0.375rem" }}>Benötigte Unterlagen</p>
                                      <p style={{ fontSize: "0.75rem", color: "var(--color-subtle)", lineHeight: 1.5, marginBottom: "1rem" }}>
                                        Ihre Kontoumsätze können Sie direkt per Open Banking an uns übermitteln. Das sind die richtigen Geschäftsdokumente für Ihre Finanzierung:
                                      </p>
                                      <div style={{ overflowX: "auto" }}>
                                        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: "0.75rem" }}>
                                          <thead>
                                            <tr>
                                              <th style={{ background: "var(--color-dark)", color: "#fff", textAlign: "left", padding: "0.75rem 0.875rem", fontWeight: 700, borderTopLeftRadius: "0.5rem" }}></th>
                                              <th style={{ background: "var(--color-dark)", color: "#fff", textAlign: "center", padding: "0.75rem 0.875rem", fontWeight: 700 }}>1.000 € – 15.000 €</th>
                                              <th style={{ background: "var(--color-dark)", color: "#fff", textAlign: "center", padding: "0.75rem 0.875rem", fontWeight: 700 }}>15.001 € – 50.000 €</th>
                                              <th style={{ background: "var(--color-dark)", color: "#fff", textAlign: "center", padding: "0.75rem 0.875rem", fontWeight: 700, borderTopRightRadius: "0.5rem" }}>50.001 € – 500.000 €</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {([
                                              {
                                                title: "Geschäftliche Kontoumsätze",
                                                sub: "Letzten 90 Tage über Open Banking oder im PDF-Format aus dem Online Banking gespeichert",
                                                cells: ["check-auto", "check", "check"],
                                              },
                                              {
                                                title: "BWA",
                                                sub: "Der letzten 2 Geschäftsjahre und aktuelle BWA (nicht älter als 4 Monate)",
                                                cells: ["no", "no", "check"],
                                              },
                                              {
                                                title: "Summen- und Saldenliste",
                                                sub: "Der letzten 2 Geschäftsjahre und aktuelle SuSa (nicht älter als 4 Monate)",
                                                cells: ["no", "no", "check"],
                                              },
                                            ] as { title: string; sub: string; cells: ("check" | "no" | "check-auto")[] }[]).map(({ title, sub, cells }, rowIdx, rows) => (
                                              <tr key={title} style={{ borderBottom: rowIdx < rows.length - 1 ? "1px solid var(--color-light-bg)" : "none" }}>
                                                <td style={{ padding: "1rem 0.875rem", verticalAlign: "top", background: "var(--color-light-bg)" }}>
                                                  <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--color-dark)", marginBottom: "0.25rem" }}>{title}</p>
                                                  <p style={{ fontSize: "0.6875rem", color: "var(--color-subtle)", lineHeight: 1.5 }}>{sub}</p>
                                                </td>
                                                {cells.map((cell, ci) => (
                                                  <td key={ci} style={{ padding: "1rem 0.875rem", textAlign: "center", verticalAlign: "middle" }}>
                                                    {cell === "check" || cell === "check-auto" ? (
                                                      <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: "0.375rem" }}>
                                                        <div style={{ width: "1.75rem", height: "1.75rem", borderRadius: "50%", background: "var(--color-dark)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                          <Check style={{ width: "0.875rem", height: "0.875rem", color: "#fff" }} />
                                                        </div>
                                                        {cell === "check-auto" && (
                                                          <span style={{ fontSize: "0.625rem", fontWeight: 600, color: "var(--color-subtle)", textAlign: "center", lineHeight: 1.3 }}>Teils automatisiert ganz ohne Unterlagen</span>
                                                        )}
                                                      </div>
                                                    ) : (
                                                      <div style={{ width: "1.75rem", height: "1.75rem", borderRadius: "50%", border: "1.5px solid #16a34a", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                                                        <div style={{ width: "0.75rem", height: "1.5px", background: "#16a34a", transform: "rotate(-45deg)" }} />
                                                      </div>
                                                    )}
                                                  </td>
                                                ))}
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                        {/* Inline funnel */}
                        {isSelected && selectedOffer && (
                          <FunnelPanel offer={selectedOffer.offer} amount={selectedOffer.amount} term={selectedOffer.term} initialPurpose={filterUseCases.length > 0 ? FILTER_TO_PURPOSE[filterUseCases[0]] : undefined} onSubmitted={(app) => setMyApplications(prev => [app, ...prev])} onEstimateChange={setFunnelEstimate} />
                        )}
                      </div>
                      </motion.div>
                    );
                  })}
                  </AnimatePresence>
                )}

                {/* Kontakt-Info */}
                {!loading && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1.5rem", padding: "1rem 1.25rem", borderRadius: "0.75rem", background: "var(--color-light-bg)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <MessageCircle className="h-4 w-4 shrink-0" style={{ color: "var(--color-subtle)" }} />
                      <p className="text-sm" style={{ color: "var(--color-subtle)" }}>
                        <span style={{ fontWeight: 600, color: "var(--color-dark)" }}>{selectedOffer ? "Fragen zum Antrag?" : "Kein passendes Angebot dabei?"}</span><br />
                        {selectedOffer ? "Wir helfen Ihnen gerne weiter." : "Wir beraten Sie gerne persönlich."}
                      </p>
                    </div>
                    <a href="mailto:hallo@liqinow.de" className="btn btn-secondary btn-sm" style={{ whiteSpace: "nowrap", flexShrink: 0 }}>Kontakt aufnehmen</a>
                  </div>
                )}
              </div>

              {!loading && sortedOffers.length > 0 && (
                <p className="text-xs text-subtle text-center mt-3">
                  Konditionen sind indikativ und können je nach Bonität abweichen.
                </p>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />

    </div>
  );
}
