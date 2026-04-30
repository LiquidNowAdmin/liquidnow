-- Time-Based-Workflow-Cron + AFTER-INSERT-Triggers auf inquiries/applications/users.
-- Inquiries+applications brauchen `status_last_changed_at` für `days_in_status`.

-- ============================================
-- Spalte für days_in_status (NULL = noch nie geändert → fallback auf created_at)
-- ============================================
alter table inquiries     add column if not exists status_last_changed_at timestamptz;
alter table applications  add column if not exists status_last_changed_at timestamptz;

-- Trigger: bei Status-Wechsel status_last_changed_at aktualisieren
create or replace function update_status_last_changed_at()
returns trigger
language plpgsql
as $$
begin
  if (TG_OP = 'INSERT') or (NEW.status is distinct from OLD.status) then
    NEW.status_last_changed_at := now();
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_inquiries_status_changed on inquiries;
create trigger trg_inquiries_status_changed
  before insert or update of status on inquiries
  for each row execute procedure update_status_last_changed_at();

drop trigger if exists trg_applications_status_changed on applications;
create trigger trg_applications_status_changed
  before insert or update of status on applications
  for each row execute procedure update_status_last_changed_at();

-- ============================================
-- process_time_based_workflows — Cron (täglich 09:00 UTC)
-- ============================================
create or replace function process_time_based_workflows()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_rule record;
  v_entity_record record;
  v_entity_data jsonb;
  v_time_config jsonb;
  v_conditions_met boolean;
  v_action_results jsonb;
  v_processed int := 0;
  v_days int;
  v_status_field text;
  v_status_value text;
  v_date_field text;
  v_already boolean;
begin
  for v_rule in
    select *
      from workflow_rules
     where trigger_type = 'time_based' and is_active = true
  loop
    v_time_config := v_rule.time_config;

    -- Type 1: days_in_status — entity ist seit X Tagen im Status Y
    if v_time_config->>'type' = 'days_in_status' then
      v_status_field := coalesce(v_time_config->>'status_field','status');
      v_status_value := v_time_config->>'status_value';
      v_days := (v_time_config->>'days')::int;

      for v_entity_record in
        execute format(
          'select * from %I
           where %I = $1
             and tenant_id = $2
             and (
               (status_last_changed_at is null and created_at + interval ''%s days'' <= now())
               or status_last_changed_at + interval ''%s days'' <= now()
             )',
          v_rule.entity_type, v_status_field, v_days, v_days
        ) using v_status_value, v_rule.tenant_id
      loop
        select exists(
          select 1 from workflow_execution_tracking
           where rule_id = v_rule.id
             and entity_type = v_rule.entity_type
             and entity_id = v_entity_record.id
        ) into v_already;
        if v_already then continue; end if;

        v_entity_data := to_jsonb(v_entity_record);
        v_conditions_met := evaluate_workflow_conditions(v_entity_data, v_rule.conditions);
        if not v_conditions_met then continue; end if;

        v_action_results := execute_workflow_actions(
          v_rule.id, v_rule.entity_type, v_entity_record.id, v_entity_data, v_rule.actions, v_rule.tenant_id
        );

        insert into workflow_executions (tenant_id, rule_id, entity_type, entity_id, status, matched_conditions, executed_actions)
        values (v_rule.tenant_id, v_rule.id, v_rule.entity_type, v_entity_record.id, 'success', v_rule.conditions, v_action_results);

        insert into workflow_execution_tracking (tenant_id, rule_id, entity_type, entity_id)
        values (v_rule.tenant_id, v_rule.id, v_rule.entity_type, v_entity_record.id);

        v_processed := v_processed + 1;
      end loop;

    -- Type 2: days_after_field — X Tage nach Datums-Feld
    elsif v_time_config->>'type' = 'days_after_field' then
      v_date_field := v_time_config->>'field';
      v_days := (v_time_config->>'days')::int;

      for v_entity_record in
        execute format(
          'select * from %I
           where %I is not null
             and %I + interval ''%s days'' <= now()
             and tenant_id = $1',
          v_rule.entity_type, v_date_field, v_date_field, v_days
        ) using v_rule.tenant_id
      loop
        select exists(
          select 1 from workflow_execution_tracking
           where rule_id = v_rule.id
             and entity_type = v_rule.entity_type
             and entity_id = v_entity_record.id
        ) into v_already;
        if v_already then continue; end if;

        v_entity_data := to_jsonb(v_entity_record);
        v_conditions_met := evaluate_workflow_conditions(v_entity_data, v_rule.conditions);
        if not v_conditions_met then continue; end if;

        v_action_results := execute_workflow_actions(
          v_rule.id, v_rule.entity_type, v_entity_record.id, v_entity_data, v_rule.actions, v_rule.tenant_id
        );

        insert into workflow_executions (tenant_id, rule_id, entity_type, entity_id, status, matched_conditions, executed_actions)
        values (v_rule.tenant_id, v_rule.id, v_rule.entity_type, v_entity_record.id, 'success', v_rule.conditions, v_action_results);

        insert into workflow_execution_tracking (tenant_id, rule_id, entity_type, entity_id)
        values (v_rule.tenant_id, v_rule.id, v_rule.entity_type, v_entity_record.id);

        v_processed := v_processed + 1;
      end loop;
    end if;
  end loop;

  return jsonb_build_object('ok', true, 'processed', v_processed, 'ran_at', now());
end;
$$;

-- ============================================
-- AFTER-INSERT-Triggers für record_created
-- ============================================

-- inquiries
create or replace function trigger_workflow_on_inquiry_created()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform execute_workflow_rules('inquiries', NEW.id, to_jsonb(NEW), 'record_created');
  return NEW;
end;
$$;

drop trigger if exists workflow_trigger_inquiry_created on inquiries;
create trigger workflow_trigger_inquiry_created
  after insert on inquiries
  for each row execute procedure trigger_workflow_on_inquiry_created();

-- applications
create or replace function trigger_workflow_on_application_created()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform execute_workflow_rules('applications', NEW.id, to_jsonb(NEW), 'record_created');
  return NEW;
end;
$$;

drop trigger if exists workflow_trigger_application_created on applications;
create trigger workflow_trigger_application_created
  after insert on applications
  for each row execute procedure trigger_workflow_on_application_created();

-- users
create or replace function trigger_workflow_on_user_created()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform execute_workflow_rules('users', NEW.id, to_jsonb(NEW), 'record_created');
  return NEW;
end;
$$;

drop trigger if exists workflow_trigger_user_created on public.users;
create trigger workflow_trigger_user_created
  after insert on public.users
  for each row execute procedure trigger_workflow_on_user_created();

-- ============================================
-- Cron-Job: täglich um 09:00 UTC (=10:00/11:00 DE)
-- + alle 5min ein Sender-Run für gequeuete Mails (via http call der Edge Function)
-- ============================================
-- pg_cron muss aktiviert sein (ist es bereits, siehe 20260422000001_cron_5min.sql)

-- Time-based: einmal pro Tag
select cron.schedule(
  'workflow-time-based-daily',
  '0 9 * * *',
  $$select process_time_based_workflows()$$
) where not exists (select 1 from cron.job where jobname = 'workflow-time-based-daily');

-- Sender für gequeuete Mails: alle 2 Minuten — pattern matched zu poll_status_cron.
-- Service-Role-JWT ist im public Repo unproblematisch weil es bereits in
-- 20260401000003_poll_status_cron.sql steht.
select cron.schedule(
  'workflow-process-pending',
  '*/2 * * * *',
  $$
  select net.http_post(
    url := 'https://geomkhgveauiryjpmlnd.supabase.co/functions/v1/workflow-process-pending',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdlb21raGd2ZWF1aXJ5anBtbG5kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDkwMDkwMCwiZXhwIjoyMDg2NDc2OTAwfQ.NB2qBPoN8j0TvW3iu4fqzq7-TrM865kAiCHbG39f-FI"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
) where not exists (select 1 from cron.job where jobname = 'workflow-process-pending');
