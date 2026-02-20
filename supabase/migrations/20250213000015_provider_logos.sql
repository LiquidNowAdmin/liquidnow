-- ============================================
-- Set logo_url for providers with available logos
-- ============================================

-- Commerzbank
update providers set logo_url = '/logos/commerzbank.png'
where id = '10000000-0000-0000-0000-000000000002';

-- iwoca
update providers set logo_url = '/logos/iwoca.png'
where id = '10000000-0000-0000-0000-000000000004';
