// Edge-Function-Mirror von src/lib/company-info.ts.
// WICHTIG: synchron halten — Edge Functions können nicht aus src/ importieren.

export const COMPANY_INFO = {
  legalName: 'Deutsche Einkaufsfinanzierer GmbH',
  brandName: 'LiQiNow',
  brandTagline: 'ist eine Marke der Deutschen Einkaufsfinanzierer GmbH',

  address: 'Grabenstraße 28 · 70734 Fellbach',
  street: 'Grabenstraße 28',
  zip: '70734',
  city: 'Fellbach',

  hauptsitzStreet: 'ABC-Straße 35',
  hauptsitzZip: '20354',
  hauptsitzCity: 'Hamburg',

  phone: '040 999 999 400',
  phoneE164: '+494099999400',
  phoneHours: 'Mo–Fr 09:00 – 20:00 Uhr',
  email: 'info@liqinow.de',
  url: 'https://liqinow.de',
  urlDisplay: 'liqinow.de',

  ceo: 'Thomas Auerbach',
  ceoTitle: 'Geschäftsführender Gesellschafter',

  court: 'Amtsgericht Hamburg',
  hrb: 'HRB 141686',
  taxNumber: '48 / 714 / 03703',
  ustId: 'DE306361948',
} as const;
