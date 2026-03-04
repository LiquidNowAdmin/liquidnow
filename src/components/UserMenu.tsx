"use client";

import { useState, useEffect, useRef } from "react";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

function getInitials(user: User): string {
  const name = user.user_metadata?.full_name as string | undefined;
  if (name) {
    return name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase();
  }
  return (user.email?.[0] ?? "?").toUpperCase();
}

function Avatar({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const rawAvatarUrl = (user.user_metadata?.avatar_url || user.user_metadata?.picture) as string | undefined;
  const avatarUrl = rawAvatarUrl?.replace(/=s\d+-c$/, "=s96-c");
  const initials = getInitials(user);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "2.25rem", height: "2.25rem", borderRadius: "50%",
          border: "2px solid var(--color-border)",
          overflow: "hidden", cursor: "pointer", padding: 0,
          backgroundColor: "var(--color-light-bg)",
          backgroundImage: avatarUrl ? `url("${avatarUrl}")` : "none",
          backgroundSize: "cover",
          backgroundPosition: "center",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "0.8125rem", fontWeight: 700, color: "var(--color-dark)",
          transition: "border-color 0.15s",
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--color-dark)")}
        onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--color-border)")}
        aria-label="Benutzerkonto"
      >
        {!avatarUrl && initials}
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 0.5rem)", right: 0,
          background: "#fff", borderRadius: "0.875rem",
          border: "1px solid var(--color-border)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
          minWidth: "200px", overflow: "hidden", zIndex: 100,
        }}>
          <div style={{ padding: "0.875rem 1rem", borderBottom: "1px solid var(--color-border)" }}>
            <p style={{ fontSize: "0.6875rem", color: "var(--color-subtle)", marginBottom: "0.125rem" }}>Angemeldet als</p>
            <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-dark)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user.email}
            </p>
          </div>
          <button
            onClick={() => { setOpen(false); onLogout(); }}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: "0.625rem",
              padding: "0.75rem 1rem", background: "none", border: "none",
              fontSize: "0.875rem", color: "var(--color-dark)", cursor: "pointer",
              textAlign: "left", transition: "background 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "var(--color-light-bg)")}
            onMouseLeave={e => (e.currentTarget.style.background = "none")}
          >
            <LogOut style={{ width: "1rem", height: "1rem", color: "var(--color-subtle)" }} />
            Abmelden
          </button>
        </div>
      )}
    </div>
  );
}

export default function UserMenu() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  if (!user) {
    return (
      <a href="/auth/login" className="btn btn-secondary btn-md" style={{ fontFamily: "var(--font-body)" }}>
        Anmelden
      </a>
    );
  }

  return <Avatar user={user} onLogout={handleLogout} />;
}
