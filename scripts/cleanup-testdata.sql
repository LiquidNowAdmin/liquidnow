-- DESTRUCTIVE: Löscht alle Test-/Lead-Daten in Prod.
--   • Behält: Operations-Users (Admins) + ihre auth.users-Rows, Tenants,
--             Configs (products, providers, email_templates, workflow_rules,
--             articles, attachment_library, template_routes, settings)
--   • Löscht: alle Leads + ihre auth.users, alle Companies/Members der Leads,
--             alle Inquiries/Applications + abhängige Tabellen, alle
--             sent_emails (Audit-Trail), alle events, marketing_events,
--             marketing_sessions, workflow_executions, workflow_execution_tracking
--
-- Reihenfolge berücksichtigt FKs (Leaf-Tabellen zuerst). Manche Cascades
-- räumen automatisch ab, sind hier dennoch explizit aufgeführt.
--
-- VOR DEM AUSFÜHREN: cleanup-testdata-preview.sql laufen lassen + Counts prüfen.

begin;

-- 1) Audit / Logs / Events (kein FK auf Lead-Tables, aber pro Tenant alles weg)
truncate table
  public.events,
  public.marketing_events,
  public.marketing_sessions,
  public.sent_emails,
  public.workflow_execution_tracking,
  public.workflow_executions
restart identity cascade;

-- 2) Application-abhängige (FK applications, mit cascade — explizit für Klarheit)
delete from public.application_documents;
delete from public.application_offers;
delete from public.application_status_logs;

-- 3) Applications + Inquiries
delete from public.applications;
delete from public.inquiries;

-- 4) Documents (nicht über cascade abgedeckt — eigene company-FK)
delete from public.documents;

-- 5) Lead-User-Beziehungen + Companies
delete from public.company_members
  where user_id in (select id from public.users where role = 'lead');

-- Companies löschen, an denen NUR noch Leads beteiligt waren (oder gar niemand mehr)
delete from public.companies c
  where not exists (
    select 1 from public.company_members cm
      join public.users u on u.id = cm.user_id
      where cm.company_id = c.id and u.role = 'operations'
  );

-- 6) Lead-Users (public.users) — auth.users wird per Cascade durch
--    "id references auth.users(id) on delete cascade" NICHT mitgelöscht;
--    der FK geht andersrum. Daher auth.users separat unten.
with leads_to_delete as (
  select id from public.users where role = 'lead'
)
delete from public.users where role = 'lead';

-- 7) auth.users für die Leads — direkter ID-Match. Operations-User bleiben.
delete from auth.users
  where id not in (select id from public.users);

commit;

-- Hinweis: Storage-Buckets werden NICHT bereinigt. Falls Document-Files
-- (Scaleway / Supabase Storage) auch weg sollen, separat über Bucket-API
-- löschen — Tabellen-Refs sind dann eh schon leer, Files wären verwaist.
