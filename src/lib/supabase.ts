import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Module-level singleton — one GoTrueClient per browser tab, no lock contention
const _client = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      flowType: "implicit",
    },
  }
);

export function createClient() {
  return _client;
}
