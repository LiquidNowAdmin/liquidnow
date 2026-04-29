-- Reduce poll-application-status cron to every 5 minutes (Qred rate limit: 5000/day)
select cron.alter_job(
  (select jobid from cron.job where jobname = 'poll-application-status'),
  schedule := '*/5 * * * *'
);
