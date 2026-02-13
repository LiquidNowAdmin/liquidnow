-- ============================================
-- Add Qred Bank AB + Geschäftskredit
-- Update existing products with selling tags
-- ============================================

-- ===== QRED PROVIDER =====
insert into providers (id, name, type, logo_url, website, is_active, metadata) values
  ('10000000-0000-0000-0000-000000000006', 'Qred Bank', 'fintech', null, 'https://www.qred.de', true,
   '{"founded": 2015, "headquarters": "Stockholm", "license": "Banklizenz seit 2023", "markets": 7, "employees": 250, "trustpilot_de": 4.9}')
on conflict do nothing;

-- ===== QRED GESCHÄFTSKREDIT =====
-- Pricing: 0.95%-1.95% monthly fee → ~11.4%-23.4% annualized
insert into products (id, provider_id, name, type, min_volume, max_volume, min_term_months, max_term_months, interest_rate_from, interest_rate_to, is_active, metadata) values
  ('20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000006', 'Geschäftskredit', 'term_loan', 5000, 500000, 1, 36, 11.40, 23.40, true,
   '{"processing_time_days": 1, "requires_collateral": false, "personal_guarantee": true, "fee_model": "0.95%-1.95% Gebuehr/Monat", "fees": "keine zusaetzlichen", "note": "Auszahlung innerhalb von 24 Stunden", "highlight": "Schnellste Auszahlung", "tags": ["24h Auszahlung", "Keine Mindestlaufzeit", "Digital & schnell", "Banklizenz"], "trustpilot": 4.9}')
on conflict do nothing;

-- ===== TENANT PROVIDER SETTING FOR QRED =====
insert into tenant_provider_settings (tenant_id, provider_id, is_enabled)
select t.id, '10000000-0000-0000-0000-000000000006'::uuid, true
from tenants t where t.slug = 'liqinow'
on conflict do nothing;

-- ===== UPDATE EXISTING PRODUCTS WITH TAGS =====

-- Deutsche Bank - db BusinessKredit
update products set metadata = '{
  "processing_time_days": 5,
  "requires_collateral": false,
  "fees": "0.5% Bearbeitungsgebuehr",
  "highlight": "Grosse deutsche Bank",
  "tags": ["Grosse Bank", "Bis 500k EUR", "Lange Laufzeiten"]
}'::jsonb where id = '20000000-0000-0000-0000-000000000001';

-- Commerzbank - UnternehmerKredit
update products set metadata = '{
  "processing_time_days": 3,
  "requires_collateral": false,
  "fees": "keine",
  "highlight": "Keine Gebuehren",
  "tags": ["Keine Gebuehren", "Ab 10k EUR", "Schnelle Bearbeitung"]
}'::jsonb where id = '20000000-0000-0000-0000-000000000002';

-- KfW - ERP-Foerderkredit KMU
update products set metadata = '{
  "processing_time_days": 10,
  "requires_collateral": false,
  "fees": "keine",
  "note": "Antrag ueber Hausbank",
  "highlight": "Guenstigster Zinssatz",
  "tags": ["KfW-Foerderung", "Ab 2.80%", "Keine Gebuehren", "Bis 500k EUR"]
}'::jsonb where id = '20000000-0000-0000-0000-000000000003';

-- iwoca - Flexi-Kredit
update products set metadata = '{
  "processing_time_days": 1,
  "requires_collateral": false,
  "fees": "keine",
  "note": "Schnellauszahlung in 24h",
  "highlight": "Flexibler Kreditrahmen",
  "tags": ["24h Auszahlung", "Flexibel", "Ab 3 Monate", "Digital"]
}'::jsonb where id = '20000000-0000-0000-0000-000000000004';

-- Creditshelf - Wachstumsfinanzierung
update products set metadata = '{
  "processing_time_days": 2,
  "requires_collateral": false,
  "fees": "1% Strukturierungsgebuehr",
  "highlight": "Wachstumsfinanzierung",
  "tags": ["Schnelle Pruefung", "Ab 50k EUR", "Wachstum"]
}'::jsonb where id = '20000000-0000-0000-0000-000000000005';
