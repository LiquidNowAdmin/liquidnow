"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase";

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

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div />}>
      <AdminLoginContent />
    </Suspense>
  );
}

function AdminLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  // Handle return from OAuth callback
  useEffect(() => {
    const oauthError = searchParams.get("error");
    if (oauthError === "access_denied") {
      setError("Zugriff verweigert. Operations-Rolle erforderlich.");
    }
    // Check if user just logged in via OAuth
    (async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: userData } = await supabase
        .from("users")
        .select("role")
        .eq("id", session.user.id)
        .single();
      if (userData?.role === "operations") {
        router.replace("/admin");
      } else {
        await supabase.auth.signOut();
        setError("Zugriff verweigert. Operations-Rolle erforderlich.");
      }
    })();
  }, [searchParams, router]);

  async function handleGoogle() {
    setOauthLoading(true);
    setError("");
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/admin/login`,
      },
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("Ungültige Anmeldedaten. Bitte versuchen Sie es erneut.");
      setLoading(false);
      return;
    }

    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (userData?.role !== "operations") {
      await supabase.auth.signOut();
      setError("Zugriff verweigert. Operations-Rolle erforderlich.");
      setLoading(false);
      return;
    }

    router.replace("/admin");
  }

  return (
    <div className="admin-login-wrap">
      <div className="admin-login-card">
        <div className="admin-login-logo">
          L<span className="text-turquoise">IQ</span>uiNow
        </div>
        <h1 className="admin-login-title">Admin Panel</h1>
        <p className="admin-login-sub">Melden Sie sich an, um fortzufahren</p>

        <div className="admin-login-divider" />

        {error && (
          <div className="admin-login-error">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogle}
          disabled={oauthLoading || loading}
          style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
            padding: "0.625rem 1rem", borderRadius: "0.5rem", border: "1px solid var(--color-border)",
            background: "#fff", fontSize: "0.875rem", fontWeight: 600, color: "var(--color-dark)",
            cursor: oauthLoading || loading ? "default" : "pointer", marginBottom: "1rem",
          }}
        >
          <GoogleIcon />
          {oauthLoading ? "Weiterleitung…" : "Mit Google anmelden"}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", margin: "0.5rem 0 1rem", fontSize: "0.6875rem", color: "var(--color-subtle)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          <div style={{ flex: 1, height: "1px", background: "var(--color-border)" }} />
          <span>oder</span>
          <div style={{ flex: 1, height: "1px", background: "var(--color-border)" }} />
        </div>

        <form onSubmit={handleSubmit} autoComplete="on">
          <div className="admin-login-field">
            <label htmlFor="email">E-Mail Adresse</label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@liqinow.de"
              required
              autoFocus
              autoComplete="username"
            />
          </div>

          <div className="admin-login-field">
            <label htmlFor="password">Passwort</label>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Passwort eingeben"
              required
              autoComplete="current-password"
            />
          </div>

          <button type="submit" disabled={loading} className="admin-login-btn">
            <span>{loading ? "Anmelden..." : "Anmelden"}</span>
            {!loading && <ArrowRight className="h-4 w-4 ml-2" />}
          </button>
        </form>

        <div className="admin-login-footer">
          Geschützter Bereich &middot; Nur autorisierte Benutzer
        </div>
      </div>
    </div>
  );
}
