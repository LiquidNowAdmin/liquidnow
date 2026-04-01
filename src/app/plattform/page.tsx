"use client";

import React, { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, ArrowRight, ArrowLeft, Search, Banknote, ChevronDown, Check, MessageCircle, Star, SlidersHorizontal, Loader2, Building2 } from "lucide-react";
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
  { title: "Ihr Unternehmen", sub: "Firma suchen – wir füllen den Rest aus." },
  { title: "Persönliche Daten", sub: "Wer stellt den Antrag?" },
  { title: "Zusammenfassung", sub: "Prüfen und absenden" },
];

const TERM_OPTIONS = [3, 6, 9, 12, 18, 24, 36];

// Provider name → Edge Function slug mapping
const PROVIDER_SLUGS: Record<string, string> = {
  "Qred Bank": "qred",
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

function FunnelPanel({ offer, amount, term, initialPurpose, onSubmitted }: { offer: Offer; amount: number; term: number; initialPurpose?: string; onSubmitted?: (app: { id: string; product_id: string; provider_name: string; product_name: string; volume: number; term_months: number; status: string; metadata: Record<string, unknown>; created_at: string }) => void }) {
  const productUrl = `/plattform?offer=${offer.product_id}&amount=${amount}&term=${term}`;
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authEmail, setAuthEmail] = useState("");
  const [authSent, setAuthSent] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [schufaConsent, setSchufaConsent] = useState(false);
  const [agbConsent, setAgbConsent] = useState(false);

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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);


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
    setOauthLoading("google");
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(productUrl)}` },
    });
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!authEmail) return;
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

  function selectCompany(c: typeof companySuggestions[0]) {
    setOrgName(c.name);
    if (c.long_crefo_number) setOrgCrefo(c.long_crefo_number);
    const street = [c.street_address, c.house_number].filter(Boolean).join(" ");
    if (street) setOrgStreet(street);
    if (c.zip_code) setOrgZip(c.zip_code);
    if (c.city) setOrgCity(c.city);
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

  function handleNext() {
    if (step === 2 && companyMode === "url" && orgWebpage && !showOrgFields) {
      handleCompanySearch();
      return;
    }
    if (step === 2) {
      trackStep(supabase, "unternehmen", { orgName, orgCity });
      syncOrg({ withTurnover: true });
    }
    setStep(s => s + 1);
  }

  const step2Valid = companyMode === "search" ? orgName.length >= 3 : companyMode === "url" ? !!orgWebpage : !!(orgName && orgStreet && orgCity);

  async function doSubmit(data: PersonalData) {
    setSubmitting(true); setSubmitError(null);
    try {
      await supabase.rpc("upsert_user_profile", {
        p_first_name: data.firstName, p_last_name: data.lastName,
        p_phone: data.phone?.startsWith("+") ? data.phone : `${data.phoneCountry}${data.phone}`,
        p_dob: data.dateOfBirth,
        p_street: data.street, p_zip: data.zip, p_city: data.city,
        p_applicant_email: data.email,
      });

      const { data: companyId, error: e1 } = await supabase.rpc("get_or_create_company", {
        p_name: orgName, p_crefo: orgCrefo, p_hrb: orgHrb, p_ust_id: orgUstId,
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

      // Call provider Edge Function if available
      const providerSlug = PROVIDER_SLUGS[offer.provider_name];
      if (providerSlug && applicationId) {
        const { data: fnResult, error: fnError } = await supabase.functions.invoke(`provider-${providerSlug}`, {
          body: { action: "submit", application_id: applicationId },
        });
        if (fnError) console.error(`[provider-${providerSlug}]`, fnError);
        else if (fnResult && !fnResult.success) console.error(`[provider-${providerSlug}]`, fnResult.error);
      }

      trackStep(supabase, "submit", { product_id: offer.product_id });
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
                Mit der Anmeldung bestätige ich, dass ich die <a href="/datenschutz" target="_blank" style={{ color: "var(--color-turquoise)", textDecoration: "underline" }}>Datenschutzbestimmungen</a> zur Kenntnis genommen habe.
              </p>
            </>
          )}
        </div>
      )}

      {/* Accordion steps — only shown when logged in */}
      {!authLoading && user && (
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
                  onClick={() => { if (isDone) { setStep(i); setFormKey(k => k + 1); } }}
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
                      initial={{ height: 0, opacity: 0, overflow: "hidden" }}
                      animate={{ height: "auto", opacity: 1, overflow: "visible", transitionEnd: { overflow: "visible" } }}
                      exit={{ height: 0, opacity: 0, overflow: "hidden" }}
                      transition={{ duration: 0.28, ease: "easeInOut" }}
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
                                    <button type="button" onClick={() => { trackStep(supabase, "anfrage", { volume: bedarfVolume, term: bedarfTerm, purpose }); setStep(s => s + 1); }} disabled={!purpose} className="btn btn-primary btn-md" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.25rem", marginTop: "0.5rem" }}>
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
                                    onEnter={() => { if (orgTurnover) { trackStep(supabase, "umsatz", { turnover: orgTurnover }); syncOrg({ withTurnover: true }); setStep(s => s + 1); } }}
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
                                <button type="button" onClick={() => { trackStep(supabase, "umsatz", { turnover: orgTurnover }); syncOrg({ withTurnover: true }); setStep(s => s + 1); }} disabled={!orgTurnover} className="btn btn-primary btn-md" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.375rem" }}>
                                  Weiter <ArrowRight style={{ width: "0.875rem", height: "0.875rem" }} />
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Step 2: Ihr Unternehmen */}
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

                          {/* Step 3: Persönliche Daten + Anschrift */}
                          {i === 3 && !submitted && (
                            <PersonalDataForm
                              key={`personal-${formKey}`}
                              defaults={{ firstName, lastName, email: applicantEmail, phone: applicantPhone, phoneCountry, dateOfBirth, street: applicantStreet, zip: applicantZip, city: applicantCity }}
                              onSubmit={(data) => {
                                setFirstName(data.firstName); setLastName(data.lastName);
                                setDateOfBirth(data.dateOfBirth); setApplicantEmail(data.email);
                                setApplicantPhone(data.phone); setPhoneCountry(data.phoneCountry);
                                setApplicantStreet(data.street); setApplicantZip(data.zip); setApplicantCity(data.city);
                                setStep(4);
                              }}
                              onBack={() => setStep(s => s - 1)}
                              submitting={false}
                              submitError={null}
                              submitLabel="Weiter"
                            />
                          )}

                          {i === 4 && !submitted && (
                            <div>
                              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                <div style={{ padding: "0.875rem", borderRadius: "0.75rem", border: "1px solid var(--color-border)" }}>
                                  <p style={{ fontSize: "0.6875rem", color: "var(--color-subtle)", marginBottom: "0.375rem" }}>Anfrage</p>
                                  <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-dark)" }}>
                                    {formatCurrency(bedarfVolume)} · {bedarfTerm} Monate · {PURPOSE_OPTIONS.find(p => p.value === purpose)?.label ?? "–"}
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

                              <div style={{ marginTop: "1.25rem", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                                <div style={{ padding: "0.875rem", borderRadius: "0.75rem", background: "rgba(80,122,166,0.05)", border: "1px solid var(--color-border)" }}>
                                  <label style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", cursor: "pointer" }}>
                                    <input type="checkbox" checked={agbConsent} onChange={e => setAgbConsent(e.target.checked)}
                                      style={{ marginTop: "0.125rem", accentColor: "var(--color-turquoise)" }} />
                                    <span style={{ fontSize: "0.8125rem", color: "var(--color-dark)", lineHeight: 1.5 }}>
                                      Ich akzeptiere die <a href="/agb" target="_blank" style={{ color: "var(--color-turquoise)", textDecoration: "underline" }}>AGB</a> und habe die <a href="/datenschutz" target="_blank" style={{ color: "var(--color-turquoise)", textDecoration: "underline" }}>Datenschutzerklärung</a> zur Kenntnis genommen.
                                    </span>
                                  </label>
                                </div>
                                <div style={{ padding: "0.875rem", borderRadius: "0.75rem", background: "rgba(80,122,166,0.05)", border: "1px solid var(--color-border)" }}>
                                  <label style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", cursor: "pointer" }}>
                                    <input type="checkbox" checked={schufaConsent} onChange={e => setSchufaConsent(e.target.checked)}
                                      style={{ marginTop: "0.125rem", accentColor: "var(--color-turquoise)" }} />
                                    <span style={{ fontSize: "0.8125rem", color: "var(--color-dark)", lineHeight: 1.5 }}>
                                      Ich willige ein, dass eine SCHUFA-Auskunft zur Bonitätsprüfung eingeholt werden darf.
                                    </span>
                                  </label>
                                </div>
                              </div>

                              {submitError && <p style={{ fontSize: "0.8125rem", color: "rgba(220,38,38,0.8)", marginTop: "0.5rem" }}>{submitError}</p>}

                              <div style={{ display: "flex", gap: "0.625rem", marginTop: "1.25rem" }}>
                                <button type="button" onClick={() => setStep(3)} className="btn btn-secondary btn-md" style={{ gap: "0.375rem" }}>
                                  <ArrowLeft style={{ width: "0.875rem", height: "0.875rem" }} /> Zurück
                                </button>
                                <button type="button" onClick={() => doSubmit({ firstName, lastName, dateOfBirth, email: applicantEmail, phone: applicantPhone, phoneCountry, street: applicantStreet, zip: applicantZip, city: applicantCity })}
                                  disabled={!agbConsent || !schufaConsent || submitting}
                                  className="btn btn-primary btn-md" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.375rem" }}>
                                  {submitting ? <><Loader2 className="animate-spin" style={{ width: "0.875rem", height: "0.875rem" }} /> Wird eingereicht…</> : <>Antrag einreichen <ArrowRight style={{ width: "0.875rem", height: "0.875rem" }} /></>}
                                </button>
                              </div>
                            </div>
                          )}

                          {i === 4 && submitted && (
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
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><Loader2 className="animate-spin" style={{ width: "2rem", height: "2rem", color: "var(--color-subtle)" }} /></div>}>
      <PlattformContent />
    </Suspense>
  );
}

function PlattformContent() {
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
        // Poll status for open applications with external_ref
        const openApps = data.filter(a =>
          !["signed", "rejected", "closed"].includes(a.status) &&
          (a.metadata as Record<string, unknown>)?.external_ref
        );
        for (const app of openApps) {
          const slug = PROVIDER_SLUGS[app.provider_name];
          if (!slug) continue;
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
                <div style={{ marginBottom: "0.75rem" }}>
                  <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--color-dark)", marginBottom: "0.5rem" }}>Meine Anfragen</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {myApplications.map(app => {
                      const s = STATUS_LABELS[app.status] || STATUS_LABELS.new;
                      const offer = offers.find(o => o.product_id === app.product_id);
                      return (
                        <div key={app.id} style={{
                          background: "#fff", borderRadius: "0.75rem", border: "1px solid var(--color-border)",
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
                              {formatCurrency(app.volume)} · {app.term_months} Mon.
                            </p>
                          </div>
                          <span style={{
                            fontSize: "0.6875rem", fontWeight: 700, color: s.color,
                            padding: "0.25rem 0.625rem", borderRadius: "999px",
                            background: `${s.color}14`, whiteSpace: "nowrap",
                          }}>
                            {s.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
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
                          <FunnelPanel offer={selectedOffer.offer} amount={selectedOffer.amount} term={selectedOffer.term} initialPurpose={filterUseCases.length > 0 ? FILTER_TO_PURPOSE[filterUseCases[0]] : undefined} onSubmitted={(app) => setMyApplications(prev => [app, ...prev])} />
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
