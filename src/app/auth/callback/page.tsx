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
      console.log("[callback] code:", code, "next:", next);
      if (code) {
        const supabase = createClient();
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        console.log("[callback] exchange result:", { data, error });
        if (error) {
          console.error("[callback] exchange error:", error);
          router.replace("/auth/login?error=1");
          return;
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
