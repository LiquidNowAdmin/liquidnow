// Google Ads Lead Conversion Tracking.
// Feuert client-seitig via gtag (in Analytics.tsx geladen).
//
// Env-Vars (jeweils im Format "AW-XXXXXXXX/Label"):
//   NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_INQUIRY  → Primary, wird ausgelöst beim
//                                               funnel_submit (Anfrage gesendet)
//   NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_SIGNUP   → Secondary, beim Account-Anlegen
//   NEXT_PUBLIC_LEAD_COMMISSION_RATE           → Default 0.02 (2 %); Conversion-
//                                               Wert = Volumen × Rate
//
// Privacy: Pixel feuert NICHT wenn cookie_consent !== "accepted". Enhanced
// Conversions hashen Email + Telefon SHA-256 client-seitig BEVOR sie gtag
// übergeben werden — Klartext-PII verlässt den Browser nie.

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

type ConversionName = "inquiry" | "signup";

type ConversionPayload = {
  /** Wert der Conversion in EUR. Wird nur gesendet wenn > 0. */
  value?: number;
  /** Eindeutige ID (Application-/User-UUID) für Google-Ads-Deduplication */
  transactionId?: string;
  /** Wird SHA-256-gehasht bevor an Google gesendet (Enhanced Conversions) */
  email?: string | null;
  /** E.164-Format empfohlen (+49…). Wird ebenfalls SHA-256-gehasht. */
  phone?: string | null;
};

const SEND_TO: Record<ConversionName, string | undefined> = {
  inquiry: process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_INQUIRY,
  signup:  process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_SIGNUP,
};

function hasConsent(): boolean {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem("cookie_consent") === "accepted";
}

async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input.trim().toLowerCase());
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function trackConversion(
  name: ConversionName,
  payload: ConversionPayload = {},
): Promise<void> {
  if (typeof window === "undefined") return;
  if (!hasConsent()) return;
  if (typeof window.gtag !== "function") return;

  const sendTo = SEND_TO[name];
  if (!sendTo) return; // env nicht konfiguriert → silent no-op

  const params: Record<string, unknown> = { send_to: sendTo, currency: "EUR" };

  if (payload.value && payload.value > 0) {
    params.value = Math.round(payload.value * 100) / 100;
  }
  if (payload.transactionId) {
    params.transaction_id = payload.transactionId;
  }

  // Enhanced Conversions: hashed user data
  const userData: Record<string, string> = {};
  if (payload.email) {
    userData.email = await sha256(payload.email);
  }
  if (payload.phone) {
    userData.phone_number = await sha256(payload.phone);
  }
  if (Object.keys(userData).length > 0) {
    // gtag's set('user_data', ...) wird vom nächsten event berücksichtigt
    window.gtag("set", "user_data", userData);
  }

  window.gtag("event", "conversion", params);
}

/** Conversion-Wert für Anfragen: Volumen × Provisions-Rate (default 2 %). */
export function inquiryConversionValue(volume: number | null | undefined): number {
  if (!volume || volume <= 0) return 0;
  const rate = Number(process.env.NEXT_PUBLIC_LEAD_COMMISSION_RATE ?? 0.02);
  return volume * (Number.isFinite(rate) ? rate : 0.02);
}
