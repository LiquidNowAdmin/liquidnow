"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/plattform";

    async function exchange() {
      const supabase = createClient();

      if (code) {
        // PKCE flow fallback (if code is present)
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error("[auth/callback] Code exchange failed:", error.message);
          // Don't redirect to error immediately — implicit flow may still work via hash
        }
      }

      // Wait briefly for implicit flow to process hash fragment
      await new Promise(r => setTimeout(r, 500));

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error("[auth/callback] No session after exchange");
        router.replace("/auth/login?error=1");
        return;
      }

      // Link anonymous marketing session to authenticated user
      const sessionId = localStorage.getItem("mkt_session_id");
      if (sessionId) {
        try { await supabase.rpc("link_marketing_session", { p_session_id: sessionId }); } catch {};
      }

      window.location.href = next;
    }

    exchange();
  }, [searchParams]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-light-bg)" }}>
      <div style={{ textAlign: "center", color: "var(--color-subtle)", fontSize: "0.9375rem" }}>
        Anmeldung wird abgeschlossen…
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense>
      <CallbackContent />
    </Suspense>
  );
}
