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
      if (code) {
        const supabase = createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          router.replace("/auth/login?error=1");
          return;
        }
        // Link anonymous marketing session to authenticated user
        const sessionId = localStorage.getItem("mkt_session_id");
        if (sessionId) {
          await supabase.rpc("link_marketing_session", { p_session_id: sessionId });
        }
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
