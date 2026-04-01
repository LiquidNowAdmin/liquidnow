-- Update poll-application-status cron to every minute
select cron.alter_job(
  (select jobid from cron.job where jobname = 'poll-application-status'),
  schedule := '* * * * *'
);
