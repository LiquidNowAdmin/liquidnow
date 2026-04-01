"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, ArrowLeft, Check, Loader2, Search } from "lucide-react";
import Logo from "@/components/Logo";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

const STEPS = [
  { title: "Ihr Unternehmen",        sub: "Angaben zu Ihrer Firma" },
  { title: "Unternehmensanschrift",  sub: "Anschrift Ihres Unternehmens" },
  { title: "Verwendungszweck",       sub: "Wofür benötigen Sie das Kapital?" },
  { title: "Persönliche Daten",      sub: "Wer stellt den Antrag?" },
  { title: "Ihre Anschrift",         sub: "Ihre private Wohnadresse" },
];

const PURPOSE_OPTIONS = [
  { value: "WORKING_CAPITAL",   label: "Betriebsmittel / Liquidität" },
  { value: "INVENTORY",         label: "Wareneinkauf" },
  { value: "MARKETING",         label: "Investition in Marketing" },
  { value: "EMPLOY_PERSONNEL",  label: "Personal einstellen" },
  { value: "BUY_EQUIPMENT",     label: "Ausstattung / Maschinen" },
  { value: "EXPANSION",         label: "Wachstum & Expansion" },
  { value: "REPAY_OTHER_LOAN",  label: "Anderen Kredit ablösen" },
  { value: "OTHER",             label: "Anderes" },
];

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

function Field({
  label, value, onChange, type = "text", placeholder = "", hint, required = false,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; hint?: string; required?: boolean;
}) {
  return (
    <div>
      <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-subtle)", marginBottom: "0.375rem" }}>
        {label}{required && <span style={{ color: "var(--color-turquoise)", marginLeft: "2px" }}>*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="admin-input"
        style={{ width: "100%" }}
      />
      {hint && <p style={{ fontSize: "0.6875rem", color: "var(--color-subtle)", marginTop: "0.25rem" }}>{hint}</p>}
    </div>
  );
}

function QredFunnelContent() {
  const searchParams = useSearchParams();
  const amount = parseInt(searchParams.get("amount") ?? "50000");
  const term   = parseInt(searchParams.get("term")   ?? "12");

  // Auth state
  const [user,        setUser]        = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authEmail,   setAuthEmail]   = useState("");
  const [authSent,    setAuthSent]    = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
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

  async function handleOAuth(provider: "google" | "azure") {
    setOauthLoading(provider);
    const supabase = createClient();
    const next = `/antrag/qred?amount=${amount}&term=${term}`;
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!authEmail) return;
    setOauthLoading("email");
    const supabase = createClient();
    const next = `/antrag/qred?amount=${amount}&term=${term}`;
    await supabase.auth.signInWithOtp({
      email: authEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    setAuthSent(true);
    setOauthLoading(null);
  }

  // Funnel state
  const [step, setStep] = useState(0);
  const [firstName,       setFirstName]       = useState("");
  const [lastName,        setLastName]        = useState("");
  const [dateOfBirth,     setDateOfBirth]     = useState("");
  const [applicantEmail,  setApplicantEmail]  = useState("");
  const [applicantPhone,  setApplicantPhone]  = useState("");
  const [applicantStreet, setApplicantStreet] = useState("");
  const [applicantZip,    setApplicantZip]    = useState("");
  const [applicantCity,   setApplicantCity]   = useState("");
  const [orgName,         setOrgName]         = useState("");
  const [orgHrb,          setOrgHrb]          = useState("");
  const [orgUstId,        setOrgUstId]        = useState("");
  const [orgCrefo,        setOrgCrefo]        = useState("");
  const [orgTurnover,     setOrgTurnover]     = useState("");
  const [orgWebpage,      setOrgWebpage]      = useState("");
  const [orgStreet,       setOrgStreet]       = useState("");
  const [orgZip,          setOrgZip]          = useState("");
  const [orgCity,         setOrgCity]         = useState("");
  const [purpose,         setPurpose]         = useState("WORKING_CAPITAL");
  const [purposeManual,   setPurposeManual]   = useState("");
  const [searchLoading,   setSearchLoading]   = useState(false);
  const [searchStatus,    setSearchStatus]    = useState<"idle" | "ok" | "error">("idle");
  const [companyMode,     setCompanyMode]     = useState<"search" | "url" | "manual">("search");
  const [submitting,      setSubmitting]      = useState(false);
  const [submitted,       setSubmitted]       = useState(false);
  const [submitError,     setSubmitError]     = useState<string | null>(null);
  const [companySuggestions, setCompanySuggestions] = useState<Array<{ name: string; long_crefo_number: string; street_address: string; house_number: string; zip_code: string; city: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const isLastStep = step === STEPS.length - 1;

  function handleOrgNameChange(value: string) {
    setOrgName(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.length < 3) {
      setCompanySuggestions([]);
      setShowSuggestions(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/crefo-lookup`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({ query: value }),
          }
        );
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setCompanySuggestions(json.data.slice(0, 5));
          setShowSuggestions(json.data.length > 0);
        }
      } catch {
        setCompanySuggestions([]);
      }
    }, 300);
  }

  function selectCompany(c: typeof companySuggestions[0]) {
    setOrgName(c.name);
    if (c.long_crefo_number) setOrgCrefo(c.long_crefo_number);
    const street = [c.street_address, c.house_number].filter(Boolean).join(" ");
    if (street) setOrgStreet(street);
    if (c.zip_code) setOrgZip(c.zip_code);
    if (c.city) setOrgCity(c.city);
    setCompanySuggestions([]);
    setShowSuggestions(false);
  }

  // Close suggestions on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function lookupCrefo(companyName: string) {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/crefo-lookup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ query: companyName }),
        }
      );
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        const match = json.data[0];
        if (match.long_crefo_number) setOrgCrefo(match.long_crefo_number);
      }
    } catch {
      // Crefo lookup is best-effort — don't block the flow
    }
  }

  async function handleCompanySearch() {
    if (!orgWebpage) return;
    setSearchLoading(true);
    setSearchStatus("idle");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/company-search`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ website: orgWebpage }),
        }
      );
      const json = await res.json();
      if (json.success && json.data) {
        const d = json.data;
        if (d.name)            setOrgName(d.name);
        if (d.hrb)             setOrgHrb(d.hrb);
        if (d.ustId)           setOrgUstId(d.ustId);
        if (d.address?.street) setOrgStreet(d.address.street);
        if (d.address?.zip)    setOrgZip(d.address.zip);
        if (d.address?.city)   setOrgCity(d.address.city);
        setSearchStatus("ok");
        setCompanyMode("manual");
      } else {
        setSearchStatus("error");
      }
    } catch {
      setSearchStatus("error");
    } finally {
      setSearchLoading(false);
    }
  }

  const QRED_PRODUCT_ID = "20000000-0000-0000-0000-000000000006";

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const supabase = createClient();

      // 1. Save user profile
      await supabase.rpc("upsert_user_profile", {
        p_first_name: firstName,
        p_last_name: lastName,
        p_phone: applicantPhone,
        p_dob: dateOfBirth,
        p_street: applicantStreet,
        p_zip: applicantZip,
        p_city: applicantCity,
      });

      // 2. Get or create company
      const { data: companyId, error: e1 } = await supabase.rpc("get_or_create_company", {
        p_name: orgName,
        p_hrb: orgHrb,
        p_ust_id: orgUstId,
        p_crefo: orgCrefo,
        p_website: orgWebpage,
        p_street: orgStreet,
        p_zip: orgZip,
        p_city: orgCity,
        p_monthly_revenue: orgTurnover ? parseInt(orgTurnover) : null,
      });
      if (e1) throw e1;

      // 3. Create inquiry
      const { data: inquiryId, error: e2 } = await supabase.rpc("create_inquiry", {
        p_company_id: companyId,
        p_volume: amount,
        p_term_months: term,
        p_purpose: purpose,
        p_metadata: { purpose_manual: purpose === "OTHER" ? purposeManual : null },
      });
      if (e2) throw e2;

      // 4. Create application
      const { data: applicationId, error: e3 } = await supabase.rpc("submit_application", {
        p_inquiry_id: inquiryId,
        p_product_id: QRED_PRODUCT_ID,
      });
      if (e3) throw e3;

      // 5. Call Qred Edge Function
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/provider-qred`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ action: "submit", application_id: applicationId }),
        }
      );
      const result = await res.json();
      if (!result.success) throw new Error(result.error || "Qred submission failed");

      console.log("[Qred] Submitted:", result.data);
      setSubmitted(true);
    } catch (err) {
      console.error("[Qred] Submit error:", err);
      setSubmitError("Fehler beim Einreichen. Bitte versuchen Sie es erneut.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleNext() {
    if (isLastStep) {
      handleSubmit();
    } else {
      setStep(s => s + 1);
    }
  }

  // Chips shown on every step
  const chips = (
    <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
      {[`${amount.toLocaleString("de-DE")} €`, `${term} Monate`].map(label => (
        <span key={label} style={{ fontSize: "0.75rem", fontWeight: 600, padding: "0.25rem 0.75rem", borderRadius: "999px", background: "var(--color-light-bg)", color: "var(--color-subtle)" }}>
          {label}
        </span>
      ))}
      <span style={{ fontSize: "0.75rem", fontWeight: 600, padding: "0.25rem 0.75rem", borderRadius: "999px", background: "rgba(80,122,166,0.1)", color: "var(--color-dark)" }}>
        Qred Bank
      </span>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-light-bg)", display: "flex", flexDirection: "column" }}>

      {/* Header */}
      <header style={{ background: "#fff", borderBottom: "1px solid var(--color-border)", padding: "0.875rem 1.5rem" }}>
        <Logo size="sm" />
      </header>

      {/* Progress bar — only when logged in */}
      {!authLoading && user && (
        <div style={{ background: "#fff", padding: "1rem 1.5rem 0.75rem", borderBottom: "1px solid var(--color-border)" }}>
          <div style={{ maxWidth: "480px", margin: "0 auto" }}>
            <div style={{ display: "flex", gap: "0.375rem", marginBottom: "0.5rem" }}>
              {STEPS.map((_, i) => (
                <div key={i} style={{ flex: 1, height: "3px", borderRadius: "2px", background: i <= step ? "var(--color-turquoise)" : "var(--color-border)", transition: "background 0.3s" }} />
              ))}
            </div>
            <p style={{ fontSize: "0.75rem", color: "var(--color-subtle)" }}>Schritt {step + 1} von {STEPS.length}</p>
          </div>
        </div>
      )}

      <main style={{ flex: 1, display: "flex", justifyContent: "center", padding: "2rem 1rem" }}>
        <div style={{ background: "#fff", borderRadius: "1.25rem", padding: "2rem", width: "100%", maxWidth: "480px", boxShadow: "0 4px 24px rgba(0,0,0,0.07)", alignSelf: "flex-start" }}>

          {/* ── Auth loading ── */}
          {authLoading && (
            <div style={{ textAlign: "center", padding: "2rem 0", color: "var(--color-subtle)", fontSize: "0.9375rem" }}>
              Wird geladen…
            </div>
          )}

          {/* ── Auth step ── */}
          {!authLoading && !user && (
            <>
              {chips}

              {authSent ? (
                <div style={{ textAlign: "center", padding: "1rem 0" }}>
                  <div style={{ width: "3rem", height: "3rem", borderRadius: "50%", background: "rgba(80,122,166,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
                    <Check style={{ width: "1.5rem", height: "1.5rem", color: "var(--color-turquoise)" }} />
                  </div>
                  <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "1.25rem", fontWeight: 700, color: "var(--color-dark)", marginBottom: "0.5rem" }}>Link verschickt!</h1>
                  <p style={{ fontSize: "0.875rem", color: "var(--color-subtle)", lineHeight: 1.6 }}>
                    Wir haben einen Anmelde-Link an <strong>{authEmail}</strong> geschickt. Bitte prüfen Sie Ihr Postfach.
                  </p>
                  <button type="button" onClick={() => setAuthSent(false)} style={{ marginTop: "1.25rem", fontSize: "0.8125rem", color: "var(--color-subtle)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                    Andere E-Mail verwenden
                  </button>
                </div>
              ) : (
                <>
                  <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "1.375rem", fontWeight: 700, color: "var(--color-dark)", marginBottom: "0.375rem" }}>
                    Anmelden oder Registrieren
                  </h1>
                  <p style={{ fontSize: "0.875rem", color: "var(--color-subtle)", marginBottom: "1.75rem" }}>
                    Um Ihren Antrag einzureichen, benötigen wir ein Konto.
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                    <button type="button" className="auth-oauth-btn" onClick={() => handleOAuth("google")} disabled={oauthLoading !== null}>
                      <GoogleIcon />
                      {oauthLoading === "google" ? "Weiterleitung…" : "Mit Google anmelden"}
                    </button>
                    <button type="button" className="auth-oauth-btn" onClick={() => handleOAuth("azure")} disabled={oauthLoading !== null}>
                      <MicrosoftIcon />
                      {oauthLoading === "azure" ? "Weiterleitung…" : "Mit Microsoft anmelden"}
                    </button>
                  </div>

                  <div className="auth-divider">oder</div>

                  <form onSubmit={handleMagicLink}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                      <input
                        type="email"
                        value={authEmail}
                        onChange={e => setAuthEmail(e.target.value)}
                        placeholder="ihre@email.de"
                        required
                        className="admin-input"
                        style={{ width: "100%" }}
                      />
                      <button type="submit" className="auth-oauth-btn" style={{ background: "var(--color-turquoise)", color: "#fff", borderColor: "var(--color-turquoise)", fontWeight: 600 }} disabled={oauthLoading !== null || !authEmail}>
                        {oauthLoading === "email" ? "Wird gesendet…" : "Magic Link senden"}
                      </button>
                    </div>
                  </form>

                  <p style={{ textAlign: "center", fontSize: "0.75rem", color: "var(--color-subtle)", marginTop: "1.5rem", lineHeight: 1.6 }}>
                    Mit der Anmeldung nehmen Sie unsere{" "}
                    <a href="/agb" style={{ color: "var(--color-dark)", textDecoration: "underline" }}>AGB</a>
                    {" "}und{" "}
                    <a href="/datenschutz" style={{ color: "var(--color-dark)", textDecoration: "underline" }}>Datenschutzbestimmungen</a>
                    {" "}zur Kenntnis.
                  </p>
                </>
              )}
            </>
          )}

          {/* ── Funnel steps ── */}
          {!authLoading && user && !submitted && (
            <>
              {chips}

              <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "1.375rem", fontWeight: 700, color: "var(--color-dark)", marginBottom: "0.375rem" }}>
                {STEPS[step].title}
              </h1>
              <p style={{ fontSize: "0.875rem", color: "var(--color-subtle)", marginBottom: "1.75rem" }}>
                {STEPS[step].sub}
              </p>

              {/* Step 0: Unternehmen */}
              {step === 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

                  {/* Mode: Search by name */}
                  {companyMode === "search" && (
                    <>
                      <div ref={suggestionsRef} style={{ position: "relative" }}>
                        <Field label="Firmenname" value={orgName} onChange={handleOrgNameChange} placeholder="Firmenname eingeben…" required />
                        {showSuggestions && companySuggestions.length > 0 && (
                          <div style={{
                            position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50,
                            background: "#fff", border: "1px solid var(--color-border)", borderRadius: "0.75rem",
                            boxShadow: "0 8px 24px rgba(0,0,0,0.12)", marginTop: "0.25rem", overflow: "hidden",
                          }}>
                            {companySuggestions.map((c, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => { selectCompany(c); setCompanyMode("manual"); }}
                                style={{
                                  width: "100%", textAlign: "left", padding: "0.625rem 0.875rem",
                                  background: "none", border: "none", cursor: "pointer",
                                  borderBottom: i < companySuggestions.length - 1 ? "1px solid var(--color-border)" : "none",
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
                      <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
                        <button type="button" onClick={() => setCompanyMode("url")} style={{ fontSize: "0.8125rem", color: "var(--color-subtle)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                          Per Website suchen
                        </button>
                        <button type="button" onClick={() => setCompanyMode("manual")} style={{ fontSize: "0.8125rem", color: "var(--color-subtle)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                          Manuell anlegen
                        </button>
                      </div>
                    </>
                  )}

                  {/* Mode: Search by URL */}
                  {companyMode === "url" && (
                    <>
                      <div>
                        <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-subtle)", marginBottom: "0.375rem" }}>
                          Website
                        </label>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <input
                            type="url"
                            value={orgWebpage}
                            onChange={e => { setOrgWebpage(e.target.value); setSearchStatus("idle"); }}
                            placeholder="https://example.de"
                            className="admin-input"
                            style={{ flex: 1 }}
                          />
                          <button
                            type="button"
                            onClick={handleCompanySearch}
                            disabled={!orgWebpage || searchLoading}
                            className="btn btn-secondary btn-md"
                            style={{ whiteSpace: "nowrap", gap: "0.375rem", flexShrink: 0 }}
                          >
                            {searchLoading
                              ? <Loader2 className="animate-spin" style={{ width: "1rem", height: "1rem" }} />
                              : <Search style={{ width: "1rem", height: "1rem" }} />}
                            {searchLoading ? "Suche…" : "Ausfüllen"}
                          </button>
                        </div>
                        {searchStatus === "ok" && (
                          <p style={{ fontSize: "0.6875rem", color: "var(--color-turquoise)", marginTop: "0.25rem" }}>Firmendaten gefunden und eingetragen.</p>
                        )}
                        {searchStatus === "error" && (
                          <p style={{ fontSize: "0.6875rem", color: "rgba(220,38,38,0.8)", marginTop: "0.25rem" }}>Keine Daten gefunden. Bitte manuell ausfüllen.</p>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
                        <button type="button" onClick={() => setCompanyMode("search")} style={{ fontSize: "0.8125rem", color: "var(--color-subtle)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                          Per Name suchen
                        </button>
                        <button type="button" onClick={() => setCompanyMode("manual")} style={{ fontSize: "0.8125rem", color: "var(--color-subtle)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                          Manuell anlegen
                        </button>
                      </div>
                    </>
                  )}

                  {/* Mode: Manual — show all fields */}
                  {companyMode === "manual" && (
                    <>
                      <div>
                        <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-subtle)", marginBottom: "0.375rem" }}>Website</label>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <input
                            type="text"
                            value={orgWebpage}
                            onChange={e => { setOrgWebpage(e.target.value); setSearchStatus("idle"); }}
                            placeholder="example.de"
                            className="admin-input"
                            style={{ flex: 1 }}
                          />
                          <button
                            type="button"
                            onClick={handleCompanySearch}
                            disabled={!orgWebpage || searchLoading}
                            className="btn btn-secondary btn-md"
                            style={{ whiteSpace: "nowrap", gap: "0.375rem", flexShrink: 0 }}
                          >
                            {searchLoading ? <Loader2 className="animate-spin" style={{ width: "1rem", height: "1rem" }} /> : <Search style={{ width: "1rem", height: "1rem" }} />}
                            {searchLoading ? "Suche…" : "Ausfüllen"}
                          </button>
                        </div>
                        {searchStatus === "ok" && <p style={{ fontSize: "0.6875rem", color: "var(--color-turquoise)", marginTop: "0.25rem" }}>Firmendaten eingetragen.</p>}
                        {searchStatus === "error" && <p style={{ fontSize: "0.6875rem", color: "rgba(220,38,38,0.8)", marginTop: "0.25rem" }}>Keine Daten gefunden.</p>}
                      </div>
                      <div ref={suggestionsRef} style={{ position: "relative" }}>
                        <Field label="Firmenname" value={orgName} onChange={handleOrgNameChange} placeholder="Example GmbH" required />
                        {showSuggestions && companySuggestions.length > 0 && (
                          <div style={{
                            position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50,
                            background: "#fff", border: "1px solid var(--color-border)", borderRadius: "0.75rem",
                            boxShadow: "0 8px 24px rgba(0,0,0,0.12)", marginTop: "0.25rem", overflow: "hidden",
                          }}>
                            {companySuggestions.map((c, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => { selectCompany(c); setCompanyMode("manual"); }}
                                style={{
                                  width: "100%", textAlign: "left", padding: "0.625rem 0.875rem",
                                  background: "none", border: "none", cursor: "pointer",
                                  borderBottom: i < companySuggestions.length - 1 ? "1px solid var(--color-border)" : "none",
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
                      <Field label="Crefo-Nummer" value={orgCrefo} onChange={setOrgCrefo} placeholder="3XXXXXXXX9" hint="Creditreform-Nummer (10-stellig)" required />
                      <Field label="HRB-Nummer" value={orgHrb} onChange={setOrgHrb} placeholder="HRB 12345" hint="Handelsregisternummer" required />
                      <Field label="USt-IdNr." value={orgUstId} onChange={setOrgUstId} placeholder="DE123456789" hint="Umsatzsteuer-Identifikationsnummer" />
                      <Field label="Ø Monatsumsatz – letzte 3 Monate (EUR)" value={orgTurnover} onChange={setOrgTurnover} type="number" placeholder="20000" required />
                      <button type="button" onClick={() => setCompanyMode("search")} style={{ fontSize: "0.8125rem", color: "var(--color-subtle)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", textAlign: "center" }}>
                        Stattdessen suchen
                      </button>
                    </>
                  )}

                </div>
              )}

              {/* Step 1: Unternehmensanschrift */}
              {step === 1 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <Field label="Straße und Hausnummer" value={orgStreet} onChange={setOrgStreet} placeholder="Beispielstraße 123" required />
                  <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: "0.75rem" }}>
                    <Field label="PLZ" value={orgZip} onChange={setOrgZip} placeholder="10115" required />
                    <Field label="Stadt" value={orgCity} onChange={setOrgCity} placeholder="Berlin" required />
                  </div>
                </div>
              )}

              {/* Step 2: Verwendungszweck */}
              {step === 2 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                  {PURPOSE_OPTIONS.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setPurpose(value)}
                      style={{
                        width: "100%", textAlign: "left",
                        padding: "0.875rem 1rem", borderRadius: "0.75rem",
                        border: `1.5px solid ${purpose === value ? "var(--color-turquoise)" : "var(--color-border)"}`,
                        background: purpose === value ? "rgba(80,122,166,0.06)" : "#fff",
                        color: "var(--color-dark)",
                        fontSize: "0.9375rem", fontWeight: purpose === value ? 600 : 400,
                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between",
                        transition: "border-color 0.15s",
                      }}
                    >
                      {label}
                      {purpose === value && <Check style={{ width: "1rem", height: "1rem", color: "var(--color-turquoise)", flexShrink: 0 }} />}
                    </button>
                  ))}
                  {purpose === "OTHER" && (
                    <textarea
                      value={purposeManual}
                      onChange={e => setPurposeManual(e.target.value)}
                      placeholder="Beschreiben Sie den Verwendungszweck … (max. 200 Zeichen)"
                      maxLength={200}
                      rows={3}
                      style={{ marginTop: "0.25rem", padding: "0.75rem 1rem", border: "1.5px solid var(--color-border)", borderRadius: "0.75rem", fontSize: "0.9375rem", resize: "vertical", outline: "none", width: "100%", fontFamily: "inherit" }}
                    />
                  )}
                </div>
              )}

              {/* Step 3: Persönliche Daten */}
              {step === 3 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                    <Field label="Vorname" value={firstName} onChange={setFirstName} placeholder="Hans" required />
                    <Field label="Nachname" value={lastName} onChange={setLastName} placeholder="Schmidt" required />
                  </div>
                  <Field label="Geburtsdatum" value={dateOfBirth} onChange={setDateOfBirth} type="date" required />
                  <Field label="E-Mail" value={applicantEmail} onChange={setApplicantEmail} type="email" placeholder="hans@example.de" required />
                  <Field label="Telefon" value={applicantPhone} onChange={setApplicantPhone} placeholder="+49 170 1234567" />
                </div>
              )}

              {/* Step 4: Anschrift Antragsteller */}
              {step === 4 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <Field label="Straße und Hausnummer" value={applicantStreet} onChange={setApplicantStreet} placeholder="Musterstraße 456" required />
                  <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: "0.75rem" }}>
                    <Field label="PLZ" value={applicantZip} onChange={setApplicantZip} placeholder="80331" required />
                    <Field label="Stadt" value={applicantCity} onChange={setApplicantCity} placeholder="München" required />
                  </div>
                </div>
              )}

              {/* Submit error */}
              {submitError && (
                <p style={{ fontSize: "0.8125rem", color: "rgba(220,38,38,0.9)", marginTop: "1rem" }}>{submitError}</p>
              )}

              {/* Navigation */}
              <div style={{ display: "flex", gap: "0.75rem", marginTop: "2rem" }}>
                {step > 0 && (
                  <button type="button" onClick={() => setStep(s => s - 1)} disabled={submitting} className="btn btn-secondary btn-lg" style={{ gap: "0.375rem" }}>
                    <ArrowLeft style={{ width: "1rem", height: "1rem" }} />
                    Zurück
                  </button>
                )}
                <button type="button" onClick={handleNext} disabled={submitting} className="btn btn-primary btn-lg" style={{ flex: 1, justifyContent: "center", gap: "0.375rem" }}>
                  {submitting ? (
                    <><Loader2 className="animate-spin" style={{ width: "1rem", height: "1rem" }} /> Wird eingereicht…</>
                  ) : isLastStep ? (
                    "Antrag einreichen"
                  ) : (
                    <>Weiter <ArrowRight style={{ width: "1rem", height: "1rem" }} /></>
                  )}
                </button>
              </div>

              {step === 0 && (
                <p style={{ textAlign: "center", fontSize: "0.75rem", color: "var(--color-subtle)", marginTop: "1rem" }}>
                  Kostenlos & unverbindlich · DSGVO-konform
                </p>
              )}
            </>
          )}

          {/* ── Success state ── */}
          {submitted && (
            <div style={{ textAlign: "center", padding: "2rem 0" }}>
              <div style={{ width: "3.5rem", height: "3.5rem", borderRadius: "50%", background: "rgba(80,122,166,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
                <Check style={{ width: "1.75rem", height: "1.75rem", color: "var(--color-turquoise)" }} />
              </div>
              <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "1.375rem", fontWeight: 700, color: "var(--color-dark)", marginBottom: "0.5rem" }}>
                Antrag eingereicht!
              </h1>
              <p style={{ fontSize: "0.9375rem", color: "var(--color-subtle)", lineHeight: 1.6, maxWidth: "360px", margin: "0 auto" }}>
                Ihr Antrag wurde erfolgreich an die Qred Bank übermittelt. Sie werden in Kürze per E-Mail über den Status informiert.
              </p>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default function QredAntragPage() {
  return (
    <Suspense>
      <QredFunnelContent />
    </Suspense>
  );
}
