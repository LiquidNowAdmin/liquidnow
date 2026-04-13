"use client";

import { useState, useEffect } from "react";
import { Menu, X, LogOut, User as UserIcon, FolderOpen, Phone } from "lucide-react";
import Logo from "@/components/Logo";
import UserMenu from "@/components/UserMenu";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

const navLinks = [
  { href: "#faq", label: "FAQ" },
  { href: "/auth/login", label: "Login" },
];

export default function Navigation() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
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

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        mobileOpen ? "bg-white shadow-md" : scrolled ? "bg-white/95 backdrop-blur-md shadow-md" : "bg-white/80 backdrop-blur-sm"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-8">
        <a href="/">
          <Logo size="lg" />
        </a>

        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="nav-link">
              {link.label}
            </a>
          ))}
          <a href="/plattform" className="btn btn-primary btn-md">
            Jetzt vergleichen
          </a>
          <UserMenu />
          <a href="tel:+494099999400" className="nav-phone">
            <Phone className="h-5 w-5 shrink-0" />
            <div className="nav-phone-text">
              <span className="nav-phone-number">040 999 999 400</span>
              <span className="nav-phone-hours">Mo–Fr 09:00 – 20:00 Uhr</span>
            </div>
          </a>
        </div>

        <div className="flex items-center gap-4 md:hidden">
          <a href="tel:+494099999400" className="text-dark" aria-label="Anrufen">
            <Phone className="h-5 w-5" />
          </a>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="text-dark"
            aria-label="Menü öffnen"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="fixed inset-x-0 top-18 z-40 bg-white shadow-lg md:hidden">
          <div className="flex flex-col items-center gap-6 px-4 py-8">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} onClick={() => setMobileOpen(false)} className="nav-link-mobile">
                {link.label}
              </a>
            ))}
            {user ? (
              <div style={{ width: "100%", maxWidth: "20rem", borderRadius: "0.875rem", border: "1px solid var(--color-border)", overflow: "hidden" }}>
                <div style={{ padding: "0.875rem 1rem", borderBottom: "1px solid var(--color-border)" }}>
                  <p style={{ fontSize: "0.6875rem", color: "var(--color-subtle)" }}>Angemeldet als</p>
                  <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-dark)", overflow: "hidden", textOverflow: "ellipsis" }}>{user.email}</p>
                </div>
                {[
                  { href: "/plattform/profil", icon: UserIcon, label: "Mein Profil" },
                  { href: "/plattform/dokumente", icon: FolderOpen, label: "Meine Dokumente" },
                ].map(({ href, icon: Icon, label }) => (
                  <a key={href} href={href} onClick={() => setMobileOpen(false)} style={{ display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.875rem 1rem", borderTop: "1px solid var(--color-border)", textDecoration: "none", fontSize: "0.9375rem", color: "var(--color-dark)" }}>
                    <Icon style={{ width: "1rem", height: "1rem", color: "var(--color-subtle)" }} />
                    {label}
                  </a>
                ))}
                <button
                  onClick={() => { setMobileOpen(false); handleLogout(); }}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.875rem 1rem", background: "none", border: "none", borderTop: "1px solid var(--color-border)", fontSize: "0.9375rem", color: "var(--color-dark)", cursor: "pointer" }}
                >
                  <LogOut style={{ width: "1rem", height: "1rem", color: "var(--color-subtle)" }} />
                  Abmelden
                </button>
              </div>
            ) : null}
            <a href="/plattform" onClick={() => setMobileOpen(false)} className="btn btn-primary btn-lg mt-2 w-full max-w-xs text-center">
              Jetzt vergleichen
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
