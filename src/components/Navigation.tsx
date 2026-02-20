"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import Logo from "@/components/Logo";

const navLinks = [
  { href: "/quickcheck", label: "QuickCheck" },
  { href: "#so-funktionierts", label: "So funktioniert's" },
  { href: "#faq", label: "FAQ" },
];

export default function Navigation() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md shadow-md"
          : "bg-white/80 backdrop-blur-sm"
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
          <a href="/quickcheck" className="btn btn-primary btn-md">
            QuickCheck starten
          </a>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-dark md:hidden"
          aria-label="Menü öffnen"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {mobileOpen && (
        <div className="fixed inset-0 top-[72px] z-40 bg-white md:hidden">
          <div className="flex flex-col items-center gap-6 px-4 pt-12">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="nav-link-mobile"
              >
                {link.label}
              </a>
            ))}
            <a
              href="/quickcheck"
              onClick={() => setMobileOpen(false)}
              className="btn btn-primary btn-lg mt-4 w-full max-w-xs text-center"
            >
              QuickCheck starten
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
