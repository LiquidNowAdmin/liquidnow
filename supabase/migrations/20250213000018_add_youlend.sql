-- ============================================
-- Add YouLend + Merchant Cash Advance (MCA)
-- ============================================

-- ===== YOULEND PROVIDER =====
insert into providers (id, name, type, logo_url, website, is_active, metadata) values
  ('10000000-0000-0000-0000-000000000007', 'YouLend', 'fintech', null, 'https://www.youlend.com', true,
   '{"founded": 2017, "headquarters": "London", "funded_smes": 200000, "monthly_volume_eur": 190000000, "repeat_customers_pct": 87}')
on conflict do nothing;

-- ===== YOULEND MCA =====
insert into products (id, provider_id, name, type, min_volume, max_volume, min_term_months, max_term_months, interest_rate_from, interest_rate_to, is_active, metadata) values
  ('20000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000007', 'Merchant Cash Advance', 'both', 1000, 300000, 1, 12, 3.00, 30.00, true,
   '{
     "processing_time_days": 1,
     "requires_collateral": false,
     "fee_model": "3-30% Fee auf Vorschussbetrag",
     "fee_example": "100.000 EUR -> 110.000 EUR Rueckzahlung",
     "repayment": "woechentlich 1-30% vom Umsatz ODER woechentlicher Fixbetrag",
     "approval_rate_pct": 85,
     "decision_speed": "instant bis 24h",
     "payout_speed": "same day moeglich",
     "highlight": "85% Zusagequote",
     "description": "Premium-Liquiditaet: schnelle Entscheidung, Rueckzahlung flexibel aus Umsatz.",
     "tags": ["Instant-24h Entscheidung", "85% Zusagen", "Umsatzbasierte Rueckzahlung"],
     "suitability": {
       "crefo_max": 499,
       "schufa_min": 0,
       "good_for": ["schwaechere Bonitaet", "Umsatzschwankungen", "saisonales Geschaeft"],
       "typical_profile": "2-10 Mitarbeiter, ca. 12.000 EUR/Monat Umsatz"
     },
     "requirements": {
       "min_monthly_revenue_eur": 3000,
       "bank_statements_months": 3,
       "openbanking": true,
       "for_100k": "ideal 12 Monate Auszuege + BWA/SuSa falls vorhanden",
       "ubo_required": "wirtschaftlich Berechtigte >25%"
     },
     "use_cases": ["Steuerzahlungen", "Warenkauf / Working Capital", "Kurzfristige Liquiditaetsluecke", "Saisonale Peaks"],
     "trust": {
       "funded_smes": "200.000+",
       "monthly_volume": "190 Mio EUR/Monat",
       "repeat_customers_pct": 87
     },
     "pros": ["Instant-24h Entscheidung", "85% Zusagechance", "Flexible umsatzabhaengige Rueckzahlung", "Weniger klassische Unterlagen (Fokus Openbanking + Kontoauszuege)"],
     "cons": ["Premium-Preis (Fee 3-30%)", "Daten-/Kontotransparenz noetig (Openbanking + Kontoauszuege)", "Mindestumsatz 3.000 EUR/Monat"],
     "cta_primary": "Zusagechance pruefen",
     "cta_secondary": "Konditionen & Requirements ansehen"
   }')
on conflict do nothing;

-- ===== TENANT PROVIDER SETTING FOR YOULEND =====
insert into tenant_provider_settings (tenant_id, provider_id, is_enabled)
select t.id, '10000000-0000-0000-0000-000000000007'::uuid, true
from tenants t where t.slug = 'liqinow'
on conflict do nothing;
