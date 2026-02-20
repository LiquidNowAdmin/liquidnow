"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
