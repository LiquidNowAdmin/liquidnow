-- GCLID (Google Click ID) auf marketing_sessions persistieren.
-- Wird vom Frontend-Tracking aus der URL ausgelesen (?gclid=...) und beim
-- Session-Init mitgeschickt; ermöglicht später Offline-Conversion-Imports
-- via Google Ads API für nachgelagerte Stages (offer_received, signed, …).

alter table public.marketing_sessions
  add column if not exists gclid text;

create index if not exists idx_marketing_sessions_gclid
  on public.marketing_sessions(gclid)
  where gclid is not null;
