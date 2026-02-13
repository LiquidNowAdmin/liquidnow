-- ============================================
-- Seed Data: German Bank Providers & Products
-- Uses dynamic tenant lookup instead of hardcoded UUID
-- ============================================

-- ===== PROVIDERS =====
insert into providers (id, name, type, logo_url, website, is_active, metadata) values
  ('10000000-0000-0000-0000-000000000001', 'Deutsche Bank', 'bank', null, 'https://www.deutsche-bank.de', true, '{"founded": 1870, "headquarters": "Frankfurt am Main"}'),
  ('10000000-0000-0000-0000-000000000002', 'Commerzbank', 'bank', null, 'https://www.commerzbank.de', true, '{"founded": 1870, "headquarters": "Frankfurt am Main"}'),
  ('10000000-0000-0000-0000-000000000003', 'KfW', 'bank', null, 'https://www.kfw.de', true, '{"founded": 1948, "headquarters": "Frankfurt am Main"}'),
  ('10000000-0000-0000-0000-000000000004', 'iwoca', 'fintech', null, 'https://www.iwoca.de', true, '{"founded": 2012, "headquarters": "London"}'),
  ('10000000-0000-0000-0000-000000000005', 'Creditshelf', 'fintech', null, 'https://www.creditshelf.com', true, '{"founded": 2014, "headquarters": "Frankfurt am Main"}')
on conflict do nothing;

-- ===== PRODUCTS =====

insert into products (id, provider_id, name, type, min_volume, max_volume, min_term_months, max_term_months, interest_rate_from, interest_rate_to, is_active, metadata) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'db BusinessKredit', 'term_loan', 25000, 500000, 12, 60, 4.90, 8.50, true, '{"processing_time_days": 5, "requires_collateral": false, "fees": "0.5% Bearbeitungsgebuehr"}'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'UnternehmerKredit direkt', 'term_loan', 10000, 300000, 6, 48, 5.40, 9.20, true, '{"processing_time_days": 3, "requires_collateral": false, "fees": "keine"}'),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 'ERP-Foerderkredit KMU', 'term_loan', 25000, 500000, 24, 60, 2.80, 5.90, true, '{"processing_time_days": 10, "requires_collateral": false, "fees": "keine", "note": "Antrag ueber Hausbank"}'),
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', 'Flexi-Kredit', 'credit_line', 10000, 200000, 3, 24, 6.90, 12.00, true, '{"processing_time_days": 1, "requires_collateral": false, "fees": "keine", "note": "Schnellauszahlung in 24h"}'),
  ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005', 'Wachstumsfinanzierung', 'term_loan', 50000, 500000, 6, 36, 5.20, 10.50, true, '{"processing_time_days": 2, "requires_collateral": false, "fees": "1% Strukturierungsgebuehr"}')
on conflict do nothing;

-- ===== TENANT PROVIDER SETTINGS =====
-- Dynamically look up the LiqiNow tenant ID
insert into tenant_provider_settings (tenant_id, provider_id, is_enabled)
select t.id, p.id, true
from tenants t
cross join providers p
where t.slug = 'liqinow'
  and p.id in (
    '10000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000004',
    '10000000-0000-0000-0000-000000000005'
  )
on conflict do nothing;
