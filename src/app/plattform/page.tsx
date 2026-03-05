"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, ArrowRight, ArrowLeft, Search, Banknote, ChevronDown, Check, MessageCircle, Star, SlidersHorizontal, Loader2 } from "lucide-react";
import Logo from "@/components/Logo";
import Footer from "@/components/Footer";
import { GermanNumberInput, formatDE, parseDE } from "@/components/GermanNumberInput";
import UserMenu from "@/components/UserMenu";
import { createClient } from "@/lib/supabase";
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
    return { score: s, label: ["", "Langsam", "Mittel", "Schnell", "Sehr schnell"][Math.round(s)] };
  }
  if (!days || days <= 1) return { score: 4, label: "Sehr schnell" };
  if (days <= 2)          return { score: 3, label: "Schnell" };
  if (days <= 5)          return { score: 2, label: "Mittel" };
  return                         { score: 1, label: "Langsam" };
}

function approvalScore(pct: number | undefined, explicit?: number): MetricScore {
  if (explicit) {
    const s = Math.min(4, Math.max(1, explicit));
    return { score: s, label: ["", "Niedrig", "Mittel", "Hoch", "Sehr hoch"][Math.round(s)] };
  }
  if (!pct)       return { score: 2, label: "k. A." };
  if (pct >= 70)  return { score: 4, label: "Sehr hoch" };
  if (pct >= 50)  return { score: 3, label: "Hoch" };
  if (pct >= 30)  return { score: 2, label: "Mittel" };
  return                 { score: 1, label: "Niedrig" };
}

function priceScore(rate: number, hasFeeModel: boolean, explicit?: number): MetricScore {
  if (explicit) {
    const s = Math.min(4, Math.max(1, explicit));
    return { score: s, label: ["", "Teuer", "Mittel", "Günstig", "Sehr günstig"][Math.round(s)] };
  }
  if (hasFeeModel)  return { score: 2, label: "Gebührenbasiert" };
  if (rate <= 3)    return { score: 4, label: "Sehr günstig" };
  if (rate <= 6)    return { score: 3, label: "Günstig" };
  if (rate <= 12)   return { score: 2, label: "Mittel" };
  return                   { score: 1, label: "Teuer" };
}

function flexibilityScore(productType: string, m: Record<string, unknown>): MetricScore {
  const explicit = m.flexibility_score as number | undefined;
  if (explicit) {
    const labels = ["", "Fest", "Standard", "Flexibel", "Sehr flexibel"];
    const s = Math.min(4, Math.max(1, explicit));
    return { score: s, label: labels[s] };
  }
  const t = (productType ?? "").toLowerCase();
  if (t.includes("linie") || t.includes("revolv"))      return { score: 4, label: "Sehr flexibel" };
  if (t.includes("flexi") || t.includes("merchant") || t.includes("cash advance")) return { score: 3, label: "Flexibel" };
  if (t.includes("kredit") || t.includes("darlehen"))   return { score: 2, label: "Standard" };
  return { score: 2, label: "Standard" };
}

function SignalBar({ label, metric }: { label: string; metric: MetricScore }) {
  return (
    <div className="flex items-center gap-4">
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
      <span className="text-xs font-semibold" style={{ color: "var(--color-dark)" }}>{metric.label}</span>
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
  { title: "Ihr Unternehmen", sub: "Website eingeben – wir füllen den Rest aus." },
  { title: "Persönliche Daten", sub: "Wer stellt den Antrag?" },
];

const TERM_OPTIONS = [3, 6, 9, 12, 18, 24];

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

function PersonalDataForm({ defaults, onSubmit, onBack, submitting, submitError }: {
  defaults: Partial<PersonalData>;
  onSubmit: (data: PersonalData) => void;
  onBack: () => void;
  submitting?: boolean;
  submitError?: string | null;
}) {
  // Merge: OAuth defaults > localStorage > empty
  const stored: Partial<PersonalData> = typeof window !== "undefined"
    ? (() => { try { return JSON.parse(localStorage.getItem(PERSONAL_KEY) ?? "{}"); } catch { return {}; } })()
    : {};
  const merged: Partial<PersonalData> = { ...stored, ...Object.fromEntries(Object.entries(defaults).filter(([, v]) => !!v)) };

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
    localStorage.setItem(PERSONAL_KEY, JSON.stringify(data));
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
          {submitting ? <><Loader2 className="animate-spin" style={{ width: "0.875rem", height: "0.875rem" }} /> Wird eingereicht…</> : <>Antrag einreichen <ArrowRight style={{ width: "0.875rem", height: "0.875rem" }} /></>}
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

function FunnelPanel({ offer, amount, term, initialPurpose }: { offer: Offer; amount: number; term: number; initialPurpose?: string }) {
  const productUrl = `/plattform`;
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authEmail, setAuthEmail] = useState("");
  const [authSent, setAuthSent] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);

  const [step, setStep] = useState(0);
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
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Draft persistence
  const DRAFT_KEY = `funnel_draft_${offer.product_id}`;
  type FunnelDraft = {
    volume?: number; term?: number; purpose?: string; bedarfPhase?: number;
    turnover?: number;
    orgWebpage?: string; orgName?: string; orgHrb?: string; orgUstId?: string;
    orgStreet?: string; orgZip?: string; orgCity?: string;
  };
  function saveDraft(patch: Partial<FunnelDraft>) {
    try {
      const cur: FunnelDraft = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "{}");
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...cur, ...patch }));
    } catch { /* ignore */ }
  }

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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Restore draft from localStorage on mount
  useEffect(() => {
    try {
      const d: FunnelDraft = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "{}");
      if (d.volume)      setBedarfVolume(Math.min(offer.max_volume, Math.max(offer.min_volume, d.volume)));
      if (d.term)        setBedarfTerm(Math.min(offer.max_term_months, Math.max(offer.min_term_months, d.term)));
      if (d.purpose)     setPurpose(d.purpose);
      if (d.bedarfPhase) setBedarfPhase(d.bedarfPhase);
      if (d.turnover)    setOrgTurnover(d.turnover ?? null);
      if (d.orgWebpage)  setOrgWebpage(d.orgWebpage);
      if (d.orgName)     { setOrgName(d.orgName); setShowOrgFields(true); }
      if (d.orgHrb)      setOrgHrb(d.orgHrb);
      if (d.orgUstId)    setOrgUstId(d.orgUstId);
      if (d.orgStreet)   setOrgStreet(d.orgStreet);
      if (d.orgZip)      setOrgZip(d.orgZip);
      if (d.orgCity)     setOrgCity(d.orgCity);
      // If user just returned from OAuth, jump to personal data step
      const returnId = localStorage.getItem("funnel_return_product_id");
      if (returnId === offer.product_id) {
        localStorage.removeItem("funnel_return_product_id");
        setStep(3);
      }
    } catch { /* ignore */ }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Marketing event tracking (fire-and-forget, anonymous-safe)
  function trackStep(supabase: ReturnType<typeof createClient>, stepName: string, properties: Record<string, unknown>) {
    const MKT_SESSION_KEY = "mkt_session_id";
    const MKT_TENANT_KEY = "mkt_tenant_id";
    async function run() {
      let sid = localStorage.getItem(MKT_SESSION_KEY);
      let tenantId = localStorage.getItem(MKT_TENANT_KEY);
      if (!sid || !tenantId) {
        const tenantRes = await supabase.rpc("get_default_tenant_id");
        tenantId = tenantRes.data;
        if (!tenantId) return;
        localStorage.setItem(MKT_TENANT_KEY, tenantId);
        // Pre-generate UUID client-side to avoid SELECT after INSERT (anon users can't SELECT)
        const newSid = crypto.randomUUID();
        const { error: sessionErr } = await supabase.from("marketing_sessions").insert({
          id: newSid,
          tenant_id: tenantId,
          visitor_id: crypto.randomUUID(),
          landing_page: window.location.pathname,
        });
        if (sessionErr) return;
        sid = newSid;
        localStorage.setItem(MKT_SESSION_KEY, sid);
      }
      const { error: eventErr } = await supabase.from("marketing_events").insert({
        tenant_id: tenantId,
        session_id: sid,
        event_type: "funnel_step",
        properties: { step: stepName, ...properties },
      });
      // Stale session in localStorage — clear so next call creates a fresh one
      if (eventErr?.code === "23503") {
        localStorage.removeItem(MKT_SESSION_KEY);
        localStorage.removeItem(MKT_TENANT_KEY);
      }
    }
    run().catch(() => { /* ignore tracking errors */ });
  }

  // Prefill personal data from auth user metadata
  useEffect(() => {
    if (!user) return;
    const meta = user.user_metadata ?? {};
    const fullName: string = meta.full_name ?? meta.name ?? "";
    const parts = fullName.trim().split(" ");
    if (!firstName && parts.length > 0) setFirstName(parts[0]);
    if (!lastName && parts.length > 1) setLastName(parts.slice(1).join(" "));
    if (!applicantEmail && user.email) setApplicantEmail(user.email);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function handleOAuth(provider: "google" | "azure") {
    setOauthLoading(provider);
    localStorage.setItem("funnel_return_product_id", offer.product_id);
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(productUrl)}` },
    });
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!authEmail) return;
    setOauthLoading("email");
    localStorage.setItem("funnel_return_product_id", offer.product_id);
    await supabase.auth.signInWithOtp({
      email: authEmail,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(productUrl)}` },
    });
    setAuthSent(true);
    setOauthLoading(null);
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
        setShowOrgFields(true);
      } else {
        setSearchStatus("error");
        setShowOrgFields(true);
      }
    } catch { setSearchStatus("error"); setShowOrgFields(true); }
    finally { setSearchLoading(false); }
  }

  function handleNext() {
    if (step === 2 && orgWebpage && !showOrgFields) {
      handleCompanySearch();
      return;
    }
    if (step === 2) {
      saveDraft({ orgWebpage, orgName, orgHrb, orgUstId, orgStreet, orgZip, orgCity });
      trackStep(supabase, "unternehmen", { orgName, orgCity });
    }
    setStep(s => s + 1);
  }

  const step2Valid = !!(orgWebpage || (orgName && orgStreet && orgCity));

  async function doSubmit(data: PersonalData) {
    setSubmitting(true); setSubmitError(null);
    try {
      await supabase.rpc("upsert_user_profile", {
        p_first_name: data.firstName, p_last_name: data.lastName,
        p_phone: `${data.phoneCountry}${data.phone}`,
        p_dob: data.dateOfBirth,
        p_street: data.street, p_zip: data.zip, p_city: data.city,
      });

      const { data: companyId, error: e1 } = await supabase.rpc("get_or_create_company", {
        p_name: orgName, p_hrb: orgHrb, p_ust_id: orgUstId,
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

      const { error: e3 } = await supabase.rpc("submit_application", {
        p_inquiry_id: inquiryId, p_product_id: offer.product_id,
      });
      if (e3) throw e3;

      trackStep(supabase, "submit", { product_id: offer.product_id });
      localStorage.removeItem(DRAFT_KEY);
      setSubmitted(true);
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
      {/* Accordion steps */}
      {!authLoading && (
        <div>
          {FUNNEL_STEPS.map((s, i) => {
            const isActive = i === step;
            const isDone = i < step;
            const isFuture = i > step;
            return (
              <div key={i} style={{ borderBottom: i < FUNNEL_STEPS.length - 1 ? "1px solid var(--color-light-bg)" : "none" }}>
                {/* Step header */}
                <button
                  type="button"
                  onClick={() => isDone ? setStep(i) : undefined}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: "0.875rem",
                    padding: "0.875rem 1.25rem", background: "none", border: "none",
                    cursor: isDone ? "pointer" : "default", textAlign: "left",
                    opacity: isFuture ? 0.45 : 1, transition: "opacity 0.2s",
                  }}
                >
                  <span style={{
                    width: "1.75rem", height: "1.75rem", borderRadius: "50%", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.75rem", fontWeight: 700,
                    background: isDone ? "var(--color-turquoise)" : isActive ? "var(--color-dark)" : "var(--color-light-bg)",
                    color: isDone || isActive ? "#fff" : "var(--color-subtle)",
                    transition: "background 0.3s",
                  }}>
                    {isDone ? <Check style={{ width: "0.875rem", height: "0.875rem" }} /> : i + 1}
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: "0.875rem", fontWeight: isActive ? 700 : 600, color: "var(--color-dark)" }}>{s.title}</span>
                    {isDone && stepSummaries[i] && (
                      <span style={{ display: "block", fontSize: "0.75rem", color: "var(--color-subtle)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "260px" }}>{stepSummaries[i]}</span>
                    )}
                    {isActive && !isDone && (
                      <span style={{ display: "block", fontSize: "0.75rem", color: "var(--color-subtle)" }}>{s.sub}</span>
                    )}
                  </span>
                  {isDone && <span style={{ fontSize: "0.6875rem", color: "var(--color-turquoise)", fontWeight: 600, whiteSpace: "nowrap" }}>Ändern</span>}
                </button>

                {/* Step body */}
                <AnimatePresence initial={false}>
                  {isActive && (
                    <motion.div
                      key={i}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: "easeInOut" }}
                      style={{ overflow: "hidden" }}
                    >
                      <div style={{ padding: "0 1.25rem 1.25rem" }}>
                        <motion.div
                          key={`content-${i}`}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.22, delay: 0.08 }}
                        >

                          {/* Step 0: Ihre Anfrage — sequential reveal */}
                          {i === 0 && (
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>

                              {/* Phase 0: Volumen */}
                              {bedarfPhase > 0 ? (
                                <button type="button" onClick={() => setBedarfPhase(0)} style={{ textAlign: "left", padding: "0.5rem 0.875rem", borderRadius: "0.625rem", border: "1.5px solid var(--color-border)", background: "var(--color-light-bg)", fontSize: "0.875rem", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                                  <span style={{ fontWeight: 600 }}>{formatCurrency(bedarfVolume)}</span>
                                  <span style={{ fontSize: "0.75rem", color: "var(--color-subtle)" }}>Ändern</span>
                                </button>
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
                                  <button type="button" onClick={() => { saveDraft({ volume: bedarfVolume, bedarfPhase: 1 }); setBedarfPhase(1); }} className="btn btn-primary btn-md" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.25rem", marginTop: "0.5rem" }}>
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
                                        <button type="button" onClick={() => { saveDraft({ term: bedarfTerm, bedarfPhase: 2 }); setBedarfPhase(2); }} className="btn btn-primary btn-md" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.25rem", marginTop: "0.5rem" }}>
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
                                    <button type="button" onClick={() => { saveDraft({ purpose, bedarfPhase: 2 }); trackStep(supabase, "anfrage", { volume: bedarfVolume, term: bedarfTerm, purpose }); setStep(s => s + 1); }} disabled={!purpose} className="btn btn-primary btn-md" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.25rem", marginTop: "0.5rem" }}>
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
                                    onEnter={() => { if (orgTurnover) { saveDraft({ turnover: orgTurnover ?? undefined }); trackStep(supabase, "umsatz", { turnover: orgTurnover }); setStep(s => s + 1); } }}
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
                                <button type="button" onClick={() => { saveDraft({ turnover: orgTurnover ?? undefined }); trackStep(supabase, "umsatz", { turnover: orgTurnover }); setStep(s => s + 1); }} disabled={!orgTurnover} className="btn btn-primary btn-md" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.375rem" }}>
                                  Weiter <ArrowRight style={{ width: "0.875rem", height: "0.875rem" }} />
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Step 2: Ihr Unternehmen */}
                          {i === 2 && (
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                              <div>
                                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-subtle)", marginBottom: "0.375rem" }}>Website</label>
                                <div style={{ display: "flex", gap: "0.5rem" }}>
                                  <input type="text" value={orgWebpage} onChange={e => { setOrgWebpage(e.target.value); setSearchStatus("idle"); }} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleCompanySearch(); } }} placeholder="example.de" className="admin-input" style={{ flex: 1 }} />
                                  <button type="button" onClick={handleCompanySearch} disabled={!orgWebpage || searchLoading} className="btn btn-secondary btn-md" style={{ whiteSpace: "nowrap", gap: "0.375rem", flexShrink: 0 }}>
                                    {searchLoading ? <Loader2 className="animate-spin" style={{ width: "1rem", height: "1rem" }} /> : <Search style={{ width: "1rem", height: "1rem" }} />}
                                    {searchLoading ? "Suche…" : "Ausfüllen"}
                                  </button>
                                </div>
                                {searchStatus === "ok" && <p style={{ fontSize: "0.6875rem", color: "var(--color-turquoise)", marginTop: "0.25rem" }}>✓ Firmendaten eingetragen – bitte prüfen und bestätigen.</p>}
                                {searchStatus === "error" && <p style={{ fontSize: "0.6875rem", color: "rgba(220,38,38,0.8)", marginTop: "0.25rem" }}>Keine Daten gefunden – bitte manuell ausfüllen.</p>}
                              </div>
                              <AnimatePresence initial={false}>
                                {!showOrgFields && (
                                  <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                                    <button type="button" onClick={() => setShowOrgFields(true)} className="btn btn-secondary btn-sm" style={{ fontSize: "0.8125rem" }}>Manuell ausfüllen</button>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                              <AnimatePresence initial={false}>
                                {showOrgFields && (
                                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: "easeInOut" }} style={{ overflow: "hidden" }}>
                                    <div onKeyDown={stepKeyDown(handleNext)} style={{ display: "flex", flexDirection: "column", gap: "0.875rem", paddingTop: "0.25rem" }}>
                                      <FunnelField label="Firmenname" value={orgName} onChange={setOrgName} placeholder="Example GmbH" required />
                                      <FunnelField label="HRB-Nummer" value={orgHrb} onChange={setOrgHrb} placeholder="HRB 12345" hint="Handelsregisternummer" required />
                                      <FunnelField label="USt-IdNr." value={orgUstId} onChange={setOrgUstId} placeholder="DE123456789" />
                                      <div style={{ borderTop: "1px solid var(--color-light-bg)", paddingTop: "0.875rem", display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                                        <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-subtle)", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>Unternehmensanschrift</p>
                                        <FunnelField label="Straße und Hausnummer" value={orgStreet} onChange={setOrgStreet} placeholder="Beispielstraße 123" required />
                                        <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: "0.75rem" }}>
                                          <FunnelField label="PLZ" value={orgZip} onChange={setOrgZip} placeholder="10115" required />
                                          <FunnelField label="Stadt" value={orgCity} onChange={setOrgCity} placeholder="Berlin" required />
                                        </div>
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          )}

                          {/* Step 3: Persönliche Daten + Anschrift */}
                          {i === 3 && !user && (
                            <div style={{ padding: "0.25rem 0 0.5rem" }}>
                              <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-dark)", marginBottom: "0.25rem" }}>Konto erstellen oder anmelden</p>
                              <p style={{ fontSize: "0.8125rem", color: "var(--color-subtle)", marginBottom: "1.25rem" }}>Zum Absenden ist ein Konto erforderlich.</p>
                              {authSent ? (
                                <div>
                                  <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "50%", background: "rgba(80,122,166,0.1)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
                                    <Check style={{ width: "1.25rem", height: "1.25rem", color: "var(--color-turquoise)" }} />
                                  </div>
                                  <p style={{ fontSize: "0.875rem", color: "var(--color-subtle)", lineHeight: 1.6, marginBottom: "0.5rem" }}>
                                    Wir haben einen Link an <strong>{authEmail}</strong> geschickt.
                                  </p>
                                  <button type="button" onClick={() => setAuthSent(false)} style={{ fontSize: "0.8125rem", color: "var(--color-subtle)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Andere E-Mail</button>
                                </div>
                              ) : (
                                <>
                                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
                                    <button type="button" className="auth-oauth-btn" style={{ flex: 1, minWidth: "140px" }} onClick={() => handleOAuth("google")} disabled={oauthLoading !== null}>
                                      <GoogleIcon />{oauthLoading === "google" ? "…" : "Google"}
                                    </button>
                                    <button type="button" className="auth-oauth-btn" style={{ flex: 1, minWidth: "140px" }} onClick={() => handleOAuth("azure")} disabled={oauthLoading !== null}>
                                      <MicrosoftIcon />{oauthLoading === "azure" ? "…" : "Microsoft"}
                                    </button>
                                  </div>
                                  <div className="auth-divider">oder</div>
                                  <form onSubmit={handleMagicLink} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                                    <input type="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} placeholder="ihre@email.de" required className="admin-input" style={{ flex: 1, minWidth: "180px" }} />
                                    <button type="submit" className="btn btn-primary btn-md" disabled={oauthLoading !== null || !authEmail} style={{ whiteSpace: "nowrap" }}>
                                      {oauthLoading === "email" ? "…" : "Magic Link"}
                                    </button>
                                  </form>
                                </>
                              )}
                              <div style={{ marginTop: "0.75rem" }}>
                                <button type="button" onClick={() => setStep(s => s - 1)} className="btn btn-secondary btn-sm" style={{ fontSize: "0.8125rem" }}>
                                  <ArrowLeft style={{ width: "0.875rem", height: "0.875rem" }} /> Zurück
                                </button>
                              </div>
                            </div>
                          )}

                          {i === 3 && user && !submitted && (
                            <PersonalDataForm
                              key={`${firstName}|${applicantEmail}`}
                              defaults={{ firstName, lastName, email: applicantEmail, phone: applicantPhone, phoneCountry, dateOfBirth, street: applicantStreet, zip: applicantZip, city: applicantCity }}
                              onSubmit={(data) => {
                                setFirstName(data.firstName); setLastName(data.lastName);
                                setDateOfBirth(data.dateOfBirth); setApplicantEmail(data.email);
                                setApplicantPhone(data.phone); setPhoneCountry(data.phoneCountry);
                                setApplicantStreet(data.street); setApplicantZip(data.zip); setApplicantCity(data.city);
                                doSubmit(data);
                              }}
                              onBack={() => setStep(s => s - 1)}
                              submitting={submitting}
                              submitError={submitError}
                            />
                          )}

                          {i === 3 && submitted && (
                            <div style={{ padding: "1rem 0" }}>
                              <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "50%", background: "rgba(80,122,166,0.1)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
                                <Check style={{ width: "1.25rem", height: "1.25rem", color: "var(--color-turquoise)" }} />
                              </div>
                              <p style={{ fontFamily: "var(--font-heading)", fontSize: "1.125rem", fontWeight: 700, color: "var(--color-dark)", marginBottom: "0.375rem" }}>Anfrage eingereicht</p>
                              <p style={{ fontSize: "0.875rem", color: "var(--color-subtle)", lineHeight: 1.6 }}>
                                Wir prüfen Ihren Antrag und melden uns in Kürze.
                              </p>
                            </div>
                          )}

                          {/* Navigation: nur Step 2 (Unternehmen) */}
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
                        </motion.div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

export default function PlattformPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [termMonths, setTermMonths] = useState(12);
  const [volume, setVolume] = useState(50000);
  const [sortBy, setSortBy] = useState<SortKey>("speed");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [filterTopUp, setFilterTopUp] = useState(false);
  const [filter48h, setFilter48h] = useState(false);
  const [filterFlexRepayment, setFilterFlexRepayment] = useState(false);
  const [filterGracePeriod, setFilterGracePeriod] = useState(false);
  const [filterNegativeSchufa, setFilterNegativeSchufa] = useState(false);
  const [filterUseCases, setFilterUseCases] = useState<string[]>([]);
  const [filterRechtsform, setFilterRechtsform] = useState("");
  const [filterBranche, setFilterBranche] = useState("");
  const [annualRevenue, setAnnualRevenue] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [showFilter, setShowFilter] = useState(false);
  const [showUseCaseFilter, setShowUseCaseFilter] = useState(false);
  const [skeletonStartCount, setSkeletonStartCount] = useState(25);
  const [mounted, setMounted] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<{ offer: Offer; amount: number; term: number } | null>(null);

  useEffect(() => {
    setMounted(true);
    setSkeletonStartCount(22 + Math.floor(Math.random() * 6));
    if (!sessionStorage.getItem("onboarding_done")) {
      setShowOnboarding(true);
    }
  }, []);

  const fetchOffers = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("get_platform_offers");
    if (!error && data) setOffers(data as Offer[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchOffers(); }, [fetchOffers]);

  // After offers load, re-open the funnel if user just returned from OAuth
  useEffect(() => {
    if (offers.length === 0) return;
    const returnId = localStorage.getItem("funnel_return_product_id");
    if (!returnId) return;
    const match = offers.find(o => o.product_id === returnId);
    if (match) {
      setSelectedOffer({ offer: match, amount: volume, term: termMonths });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offers]);

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
    if (filterRechtsform) {
      const allowed = (m.eligible_legal_forms as string[] | undefined) ?? [];
      if (allowed.length > 0 && !allowed.includes(filterRechtsform)) return false;
    }
    if (filterBranche) {
      const allowed = (m.eligible_industries as string[] | undefined) ?? [];
      if (allowed.length > 0 && !allowed.includes(filterBranche)) return false;
    }
    if (annualRevenue > 0) {
      const req = (m.requirements ?? {}) as Record<string, unknown>;
      const minMonthly = req.min_monthly_revenue_eur as number | undefined;
      if (minMonthly != null && annualRevenue < minMonthly * 12) return false;
    }
    return true;
  };

  const matchesAll = (offer: Offer) => matchesTerm(offer) && matchesVolume(offer) && matchesFeatures(offer);

  function handleCta(offer: Offer, amount: number, term: number) {
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
    filterUseCases.length + (filterRechtsform ? 1 : 0) + (filterBranche ? 1 : 0) +
    (annualRevenue > 0 ? 1 : 0);

  const ONBOARDING_STEPS = 6;
  const matchingCount = offers.filter(matchesAll).length;
  const skeletonCount = loading
    ? skeletonStartCount
    : Math.max(matchingCount, Math.round(skeletonStartCount * Math.pow(0.65, onboardingStep)));

  function completeOnboarding() {
    sessionStorage.setItem("onboarding_done", "1");
    setShowOnboarding(false);
  }

  function nextStep() {
    if (onboardingStep < ONBOARDING_STEPS - 1) {
      setOnboardingStep(onboardingStep + 1);
    } else {
      completeOnboarding();
    }
  }

  const rechtsformen = [
    { id: "gmbh", label: "GmbH" },
    { id: "ug", label: "UG" },
    { id: "einzelunternehmen", label: "Einzelunternehmen" },
    { id: "gbr", label: "GbR" },
    { id: "ag", label: "AG" },
    { id: "kg", label: "KG" },
  ];

  const branchen = [
    { id: "handel", label: "E-Commerce & Handel" },
    { id: "dienstleistung", label: "Dienstleistung" },
    { id: "produktion", label: "Produktion & Handwerk" },
    { id: "gastronomie", label: "Gastronomie & Hotellerie" },
    { id: "andere", label: "Andere" },
  ];

  const verwendungszwecke = [
    { id: "wareneinkauf", label: "Wareneinkauf" },
    { id: "liquiditaet", label: "Liquiditätsengpass" },
    { id: "wachstum", label: "Wachstum & Expansion" },
    { id: "marketing", label: "Marketing" },
    { id: "steuer", label: "Steuerrückzahlung" },
    { id: "andere", label: "Andere" },
  ];

  const onboardingTitles = [
    { title: "Wie viel möchten Sie finanzieren?", sub: "Wählen Sie Ihren gewünschten Kreditbetrag." },
    { title: "Wie lange soll die Laufzeit sein?", sub: "Wählen Sie die gewünschte Laufzeit." },
    { title: "Was trifft auf Sie zu?", sub: "Wählen Sie Ihre Rechtsform." },
    { title: "In welcher Branche sind Sie tätig?", sub: "Wir zeigen nur passende Angebote." },
    { title: "Wofür benötigen Sie die Finanzierung?", sub: "Mehrfachauswahl möglich." },
    { title: "Wie hoch war Ihr Jahresumsatz?", sub: "Wir zeigen nur erreichbare Angebote." },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="relative z-10 bg-white border-b border-border">
        <div className="mx-auto px-[5%] py-3">
          <div className="flex items-center justify-between">
            <Logo size="md" />
            <UserMenu />
          </div>
        </div>
      </header>


      {/* Main */}
      <main className="flex-1 py-6 bg-white">
        <div className="mx-auto px-[5%]">

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

            {/* Filter Sidebar */}
            <AnimatePresence initial={false}>
            {!selectedOffer && (
            <motion.aside
              className="filter-sidebar"
              initial={false}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <button className="filter-mobile-toggle" onClick={() => setShowFilter(v => !v)}>
                <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <SlidersHorizontal className="h-4 w-4" style={{ color: "var(--color-turquoise)" }} />
                  <span className="filter-sidebar-title" style={{ margin: 0 }}>Filter</span>
                  {activeFilterCount > 0 && (
                    <span style={{ background: "var(--color-turquoise)", color: "#fff", fontSize: "0.625rem", fontWeight: 700, borderRadius: "999px", padding: "0.1rem 0.45rem", lineHeight: 1.6 }}>
                      {activeFilterCount}
                    </span>
                  )}
                </span>
                <ChevronDown className={`filter-mobile-toggle-icon${showFilter ? " filter-mobile-toggle-icon-open" : ""}`} />
              </button>
              <div className="filter-sidebar-title">Filter</div>

              <div className={`filter-sidebar-content${showFilter ? "" : " filter-sidebar-content-hidden"}`}>
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
                <button className="filter-group-toggle" onClick={() => setShowUseCaseFilter(v => !v)}>
                  <span className="filter-label">Verwendungszweck</span>
                  <ChevronDown className={`filter-mobile-toggle-icon filter-group-toggle-icon${showUseCaseFilter ? " filter-mobile-toggle-icon-open" : ""}`} />
                </button>
                <div className={`filter-group-content${showUseCaseFilter ? "" : " filter-group-content-hidden"}`}>
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
                </div>{/* filter-group-content */}
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
              </div>{/* filter-sidebar-content */}

            </motion.aside>
            )}
            </AnimatePresence>

            {/* Results */}
            <div className="platform-results">
              {!selectedOffer && (
                <p className="platform-results-header">
                  {loading || showOnboarding ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="inline-block h-3 w-28 bg-gray-200 rounded animate-pulse" />
                    </span>
                  ) : (
                    <><strong>{offers.length} Angebote</strong> verfügbar</>
                  )}
                </p>
              )}

              <div className="flex flex-col gap-2">
                {loading || showOnboarding ? (
                  Array.from({ length: skeletonCount }).map((_, i) => <SkeletonCard key={i} />)
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
                    const effectiveVolume = Math.min(Math.max(volume, offer.min_volume), offer.max_volume);
                    const effectiveTerm = Math.min(Math.max(termMonths, offer.min_term_months), offer.max_term_months);
                    const volumeClamped = volume < offer.min_volume ? "min" : volume > offer.max_volume ? "max" : null;
                    const termClamped = termMonths < offer.min_term_months ? "min" : termMonths > offer.max_term_months ? "max" : null;
                    const feeEur = feePctFrom != null ? Math.round(effectiveVolume * feePctFrom / 100) : null;
                    const monthlyPayment = hasFeeModel
                      ? (feeEur != null ? Math.round((effectiveVolume + feeEur) / effectiveTerm) : null)
                      : Math.round(calculateMonthlyRate(effectiveVolume, offer.interest_rate_from ?? 0, effectiveTerm));
                    const merkmale: string[] = [];
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
                            {/* Col 1: Logo + Name */}
                            <div className="offer-card-provider">
                              <div className="offer-provider-logo">
                                {offer.provider_logo_url
                                  ? <img src={offer.provider_logo_url} alt={offer.provider_name} />
                                  : <span>{getProviderInitials(offer.provider_name)}</span>}
                              </div>
                              <div className="offer-provider-info">
                                <div className="offer-provider-name">{offer.provider_name}</div>
                                <div className="offer-product-name">{offer.product_name}</div>
                              </div>
                            </div>

                            {/* Col 2: Signal bars */}
                            <div className="offer-signals">
                              <SignalBar label="Geschwindigkeit" metric={speedScore(days, m.speed_score as number | undefined)} />
                              <SignalBar label="Annahmequote" metric={approvalScore(approvalPct, m.approval_score as number | undefined)} />
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
                              <button
                                className="offer-cta"
                                onClick={() => handleCta(offer, effectiveVolume, effectiveTerm)}
                              >
                                {ctaPrimary ?? "Jetzt anfragen"} <ArrowRight className="h-3 w-3" />
                              </button>
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

                        {/* Accordion panel */}
                        {isExpanded && (
                          <div className="offer-accordion-panel">
                            {description && (
                              <p className="offer-accordion-desc">{description}</p>
                            )}
                            <div className="offer-accordion-grid">
                              <div className="offer-accordion-col">
                                <p className="offer-accordion-col-title">Konditionen</p>
                                <div className="offer-accordion-rows">
                                  <div className="offer-accordion-row"><span>Volumen</span><span>{formatCurrency(offer.min_volume)} – {formatCurrency(offer.max_volume)}</span></div>
                                  <div className="offer-accordion-row"><span>Laufzeit</span><span>{offer.min_term_months}–{offer.max_term_months} Monate</span></div>
                                  <div className="offer-accordion-row"><span>{hasFeeModel ? "Gebühr" : "Zinssatz"}</span><span>{hasFeeModel ? (feeModel ?? "Gebührenbasiert") : `${rateStr}% p.a.`}</span></div>
                                  {repayment && <div className="offer-accordion-row"><span>Rückzahlung</span><span>{repayment}</span></div>}
                                  {req.min_monthly_revenue_eur != null && <div className="offer-accordion-row"><span>Mindestumsatz</span><span>{(req.min_monthly_revenue_eur as number).toLocaleString("de-DE")} €/Mo.</span></div>}
                                </div>
                              </div>
                              {productUseCases.length > 0 && (
                                <div className="offer-accordion-col">
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
                          </div>
                        )}
                        {/* Inline funnel */}
                        {isSelected && selectedOffer && (
                          <FunnelPanel offer={selectedOffer.offer} amount={selectedOffer.amount} term={selectedOffer.term} initialPurpose={filterUseCases.length > 0 ? FILTER_TO_PURPOSE[filterUseCases[0]] : undefined} />
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
                    <a href="mailto:hallo@liquidnow.de" className="btn btn-secondary btn-sm" style={{ whiteSpace: "nowrap", flexShrink: 0 }}>Kontakt aufnehmen</a>
                  </div>
                )}
              </div>

              {!loading && sortedOffers.length > 0 && (
                <p className="text-xs text-subtle text-center mt-3">
                  Konditionen sind indikativ und koennen je nach Bonitaet abweichen.
                </p>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Onboarding Overlay — portal to body to escape stacking contexts */}
      {mounted && showOnboarding && createPortal(
        <div style={{ position: "fixed", inset: 0, background: "rgba(36,54,80,0.65)", backdropFilter: "blur(6px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "#fff", borderRadius: "1.5rem", padding: "2rem", width: "100%", maxWidth: "480px", boxShadow: "0 24px 80px rgba(0,0,0,0.25)" }}>

            {/* Heading CTA */}
            <p style={{ fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#507AA6", marginBottom: "0.75rem" }}>
              Auszahlung in 48h möglich · Kostenlos &amp; unverbindlich
            </p>

            {/* Progress dots */}
            <div style={{ display: "flex", gap: "0.375rem", marginBottom: "2rem" }}>
              {Array.from({ length: ONBOARDING_STEPS }).map((_, i) => (
                <div key={i} style={{ height: "3px", flex: 1, borderRadius: "2px", background: i <= onboardingStep ? "#507AA6" : "#D0DCE8", opacity: i < onboardingStep ? 0.4 : 1, transition: "background 0.3s" }} />
              ))}
            </div>

            {/* Title */}
            <p style={{ fontFamily: "var(--font-heading)", fontSize: "1.25rem", fontWeight: 700, color: "#243650", marginBottom: "0.375rem" }}>{onboardingTitles[onboardingStep].title}</p>
            <p style={{ fontSize: "0.8125rem", color: "#536B87", marginBottom: "1.5rem" }}>{onboardingTitles[onboardingStep].sub}</p>

            {/* Step 0: Volumen */}
            {onboardingStep === 0 && (
              <div style={{ marginBottom: "1.5rem" }}>
                <div style={{ textAlign: "center", marginBottom: "0.5rem" }}>
                  <span style={{ fontFamily: "var(--font-heading)", fontSize: "1.25rem", fontWeight: 700, color: "#243650" }}>{formatCurrency(volume)}</span>
                </div>
                <input type="range" min={5000} max={500000} step={5000} value={volume}
                  onChange={e => setVolume(+e.target.value)}
                  className="funnel-slider" style={{ background: sliderBg(volume, 5000, 500000) }} />
                <div className="funnel-slider-labels"><span>5k</span><span>500k</span></div>
              </div>
            )}

            {/* Step 1: Laufzeit */}
            {onboardingStep === 1 && (
              <div style={{ marginBottom: "1.5rem" }}>
                <div style={{ textAlign: "center", marginBottom: "0.5rem" }}>
                  <span style={{ fontFamily: "var(--font-heading)", fontSize: "1.25rem", fontWeight: 700, color: "#243650" }}>{termMonths} Monate</span>
                </div>
                <input type="range" min={1} max={60} step={1} value={termMonths}
                  onChange={e => setTermMonths(+e.target.value)}
                  className="funnel-slider" style={{ background: sliderBg(termMonths, 1, 60) }} />
                <div className="funnel-slider-labels"><span>1</span><span>60 Mo</span></div>
              </div>
            )}

            {/* Step 2: Rechtsform */}
            {onboardingStep === 2 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.5rem", marginBottom: "1.5rem" }}>
                {rechtsformen.map(({ id, label }) => {
                  const sel = filterRechtsform === id;
                  return (
                    <button key={id} onClick={() => setFilterRechtsform(sel ? "" : id)} style={{ padding: "0.625rem 0.5rem", borderRadius: "0.75rem", border: `1.5px solid ${sel ? "#507AA6" : "#D0DCE8"}`, fontSize: "0.8125rem", fontWeight: 600, color: sel ? "#243650" : "#536B87", background: sel ? "#E8EEF5" : "#fff", cursor: "pointer", transition: "all 0.15s" }}>
                      {label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Step 3: Branche */}
            {onboardingStep === 3 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.5rem" }}>
                {branchen.map(({ id, label }) => {
                  const sel = filterBranche === id;
                  return (
                    <button key={id} onClick={() => setFilterBranche(sel ? "" : id)} style={{ padding: "0.75rem 1rem", borderRadius: "0.75rem", border: `1.5px solid ${sel ? "#507AA6" : "#D0DCE8"}`, fontSize: "0.8125rem", fontWeight: 600, color: sel ? "#243650" : "#536B87", background: sel ? "#E8EEF5" : "#fff", cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}>
                      {label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Step 4: Verwendungszweck */}
            {onboardingStep === 4 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.5rem", marginBottom: "1.5rem" }}>
                {verwendungszwecke.map(({ id, label }) => {
                  const active = filterUseCases.includes(id);
                  return (
                    <button key={id} onClick={() => setFilterUseCases(active ? filterUseCases.filter(u => u !== id) : [...filterUseCases, id])} style={{ padding: "0.625rem 0.5rem", borderRadius: "0.75rem", border: `1.5px solid ${active ? "#507AA6" : "#D0DCE8"}`, fontSize: "0.8125rem", fontWeight: 600, color: active ? "#243650" : "#536B87", background: active ? "#E8EEF5" : "#fff", cursor: "pointer", transition: "all 0.15s" }}>
                      {label}
                    </button>
                  );
                })}
              </div>
            )}


            {/* Step 5: Jahresumsatz */}
            {onboardingStep === 5 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.5rem" }}>
                {([
                  { label: "Unter 100.000 €", value: 50000 },
                  { label: "100.000 – 250.000 €", value: 175000 },
                  { label: "250.000 – 500.000 €", value: 375000 },
                  { label: "500.000 – 1.000.000 €", value: 750000 },
                  { label: "Über 1.000.000 €", value: 1500000 },
                ]).map(({ label, value }) => {
                  const sel = annualRevenue === value;
                  return (
                    <button key={value} onClick={() => setAnnualRevenue(sel ? 0 : value)} style={{ padding: "0.75rem 1rem", borderRadius: "0.75rem", border: `1.5px solid ${sel ? "#507AA6" : "#D0DCE8"}`, fontSize: "0.8125rem", fontWeight: 600, color: sel ? "#243650" : "#536B87", background: sel ? "#E8EEF5" : "#fff", cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}>
                      {label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.625rem" }}>
              <button onClick={nextStep} className="btn btn-primary btn-md" style={{ width: "100%" }}>
                {onboardingStep < ONBOARDING_STEPS - 1 ? "Weiter →" : "Angebote anzeigen →"}
              </button>
              <p style={{ fontSize: "0.6875rem", color: "#8A9AB0", textAlign: "center" }}>
                Keine Anmeldung nötig · Keine SCHUFA-Auswirkung
              </p>
            </div>

          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
