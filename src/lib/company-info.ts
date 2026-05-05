// Single Source of Truth für Firmen-Stammdaten — wird vom
// Impressum + Footer + E-Mail-Renderer verwendet. Bei Änderungen
// IMMER zusätzlich `supabase/functions/_shared/company-info.ts`
// synchron halten (Edge Functions können nicht aus `src/` importieren).

export const COMPANY_INFO = {
  legalName: "Deutsche Einkaufsfinanzierer GmbH",
  brandName: "LiQiNow",
  brandTagline: "ist eine Marke der Deutschen Einkaufsfinanzierer GmbH",

  // Hauptsitz / Geschäftssitz (legal § 5 TMG) — für Footer + Geschäftsbrief
  address: "ABC-Straße 35 · 20354 Hamburg",
  street: "ABC-Straße 35",
  zip: "20354",
  city: "Hamburg",

  // Postadresse (separater Versandpunkt, nur im Impressum angezeigt)
  postStreet: "Grabenstraße 28",
  postZip: "70734",
  postCity: "Fellbach",

  // Kontakt
  phone: "040 999 999 400",
  phoneE164: "+4940999999400",
  phoneHours: "Mo–Fr 09:00 – 20:00 Uhr",
  email: "info@liqinow.de",
  url: "https://liqinow.de",
  urlDisplay: "liqinow.de",

  // Vertretung
  ceo: "Thomas Auerbach",
  ceoTitle: "Geschäftsführender Gesellschafter",

  // Register
  court: "Amtsgericht Hamburg",
  hrb: "HRB 141686",
  taxNumber: "48 / 714 / 03703",
  ustId: "DE306361948",
} as const;

export type CompanyInfo = typeof COMPANY_INFO;
