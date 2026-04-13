"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Mail, Check } from "lucide-react";
import { createClient } from "@/lib/supabase";
import Logo from "@/components/Logo";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
      <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.96L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  );
}


function LoginContent() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/plattform";
  const hasError = searchParams.get("error") === "1";

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  async function handleOAuth(provider: "google") {
    setLoading(provider);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading("email");
    const supabase = createClient();
    await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    setSent(true);
    setLoading(null);
  }

  if (sent) {
    return (
      <div className="auth-wrap">
        <div className="auth-card">
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            <div style={{ width: "3rem", height: "3rem", borderRadius: "50%", background: "rgba(80,122,166,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
              <Check style={{ width: "1.5rem", height: "1.5rem", color: "var(--color-turquoise)" }} />
            </div>
            <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "1.25rem", fontWeight: 700, color: "var(--color-dark)", marginBottom: "0.5rem" }}>
              Link verschickt!
            </h1>
            <p style={{ fontSize: "0.875rem", color: "var(--color-subtle)", lineHeight: 1.6 }}>
              Wir haben einen Anmelde-Link an <strong>{email}</strong> geschickt. Bitte prüfen Sie Ihr Postfach und klicken Sie den Link an.
            </p>
            <button
              type="button"
              onClick={() => setSent(false)}
              style={{ marginTop: "1.5rem", fontSize: "0.8125rem", color: "var(--color-subtle)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
            >
              Andere E-Mail verwenden
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
          <Logo size="sm" />
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "1.375rem", fontWeight: 700, color: "var(--color-dark)", marginTop: "1.25rem", marginBottom: "0.375rem" }}>
            Anmelden oder Registrieren
          </h1>
          <p style={{ fontSize: "0.875rem", color: "var(--color-subtle)" }}>
            Wählen Sie eine Methode, um fortzufahren.
          </p>
        </div>

        {hasError && (
          <div style={{ background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: "0.625rem", padding: "0.75rem 1rem", fontSize: "0.875rem", color: "#b91c1c", marginBottom: "1.25rem" }}>
            Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
          <button
            type="button"
            className="auth-oauth-btn"
            onClick={() => handleOAuth("google")}
            disabled={loading !== null}
          >
            <GoogleIcon />
            {loading === "google" ? "Weiterleitung…" : "Mit Google anmelden"}
          </button>
        </div>

        <div className="auth-divider">oder</div>

        <form onSubmit={handleMagicLink}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="ihre@email.de"
              required
              className="admin-input"
              style={{ width: "100%" }}
            />
            <button
              type="submit"
              className="auth-oauth-btn"
              style={{ background: "var(--color-turquoise)", color: "#fff", borderColor: "var(--color-turquoise)", fontWeight: 600 }}
              disabled={loading !== null || !email}
            >
              {loading === "email" ? "Wird gesendet…" : "Magic Link senden"}
            </button>
          </div>
        </form>

        <p style={{ textAlign: "center", fontSize: "0.75rem", color: "var(--color-subtle)", marginTop: "1.5rem", lineHeight: 1.5 }}>
          Mit der Anmeldung stimmen Sie unseren{" "}
          <a href="/datenschutz" style={{ color: "var(--color-dark)", textDecoration: "underline" }}>
            Datenschutzbestimmungen
          </a>{" "}
          zu.
        </p>
      </div>
    </div>
  );
}

export default function AuthLoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
