-- Enable pg_cron extension (must be enabled in Supabase Dashboard first: Database > Extensions > pg_cron)
create extension if not exists pg_cron with schema pg_catalog;

-- Poll application status every 15 minutes via pg_cron + pg_net
select cron.schedule(
  'poll-application-status',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://geomkhgveauiryjpmlnd.supabase.co/functions/v1/poll-application-status',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdlb21raGd2ZWF1aXJ5anBtbG5kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDkwMDkwMCwiZXhwIjoyMDg2NDc2OTAwfQ.NB2qBPoN8j0TvW3iu4fqzq7-TrM865kAiCHbG39f-FI"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
