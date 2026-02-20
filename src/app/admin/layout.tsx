"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Building2,
  Package,
  FileText,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/anbieter", label: "Anbieter", icon: Building2 },
  { href: "/admin/produkte", label: "Produkte", icon: Package },
  { href: "/admin/anfragen", label: "Anfragen", icon: FileText },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const rawPathname = usePathname();
  const pathname = rawPathname.replace(/\/+$/, "") || "/";
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    const supabase = createClient();

    async function checkAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (!isLoginPage) {
          router.replace("/admin/login");
        }
        setLoading(false);
        return;
      }

      setUser(user);

      // Check operations role
      const { data: userData } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      setRole(userData?.role ?? null);
      setLoading(false);

      if (userData?.role !== "operations" && !isLoginPage) {
        router.replace("/admin/login");
      }
    }

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setUser(null);
        setRole(null);
        if (!isLoginPage) {
          router.replace("/admin/login");
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [isLoginPage, router]);

  // Login page gets rendered without shell
  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="admin-login-wrap">
        <p className="text-subtle">Laden...</p>
      </div>
    );
  }

  if (!user || role !== "operations") {
    return null;
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/admin/login");
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <Link href="/admin" className="text-lg font-bold text-white no-underline">
            L<span className="text-turquoise">IQ</span>uiNow
          </Link>
          <p className="text-xs text-white/40 mt-1">Admin Panel</p>
        </div>

        <nav className="admin-sidebar-nav">
          {navItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href + "/") || pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`admin-nav-link ${isActive ? "admin-nav-link-active" : ""}`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="admin-sidebar-footer">
          <button
            onClick={handleLogout}
            className="admin-nav-link w-full text-left"
          >
            <LogOut className="h-4 w-4" />
            Abmelden
          </button>
        </div>
      </aside>

      <main className="admin-content">{children}</main>
    </div>
  );
}
