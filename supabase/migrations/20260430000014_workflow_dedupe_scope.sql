-- Dedupe-Scope für Workflow-Rules: anti-Spam wenn ein User/Inquiry/Company
-- mehrere Entities hat (z.B. mehrere Applications).
--
-- Standardverhalten: 'entity' = wie bisher, 1 Mail pro Entity.
-- Optionen:
--   'user'    = max 1 Mail pro User (über alle seine Entities)
--   'inquiry' = max 1 Mail pro Anfrage (z.B. wenn 5 Applications zur selben
--               Anfrage gehören und Rule-Trigger auf applications läuft)
--   'company' = max 1 Mail pro Firma

alter table workflow_rules
  add column if not exists dedupe_scope text not null default 'entity'
    check (dedupe_scope in ('entity', 'user', 'inquiry', 'company'));

-- ============================================
-- Helper: bestimmt (track_entity_type, track_entity_id) basierend auf dedupe_scope
-- Gibt NULL/NULL zurück wenn die nötige Spalte (z.B. user_id) fehlt — Caller skippt dann.
-- ============================================
create or replace function workflow_resolve_dedupe_key(
  p_dedupe_scope text,
  p_entity_type  text,
  p_entity_id    uuid,
  p_entity_data  jsonb
)
returns table (track_entity_type text, track_entity_id uuid)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_dedupe_scope = 'entity' or p_dedupe_scope is null then
    track_entity_type := p_entity_type;
    track_entity_id := p_entity_id;
  elsif p_dedupe_scope = 'user' then
    if p_entity_type = 'users' then
      track_entity_type := 'users';
      track_entity_id := p_entity_id;
    elsif p_entity_data ? 'user_id' and (p_entity_data->>'user_id') <> '' then
      track_entity_type := 'users';
      track_entity_id := (p_entity_data->>'user_id')::uuid;
    end if;
  elsif p_dedupe_scope = 'inquiry' then
    if p_entity_type = 'inquiries' then
      track_entity_type := 'inquiries';
      track_entity_id := p_entity_id;
    elsif p_entity_data ? 'inquiry_id' and (p_entity_data->>'inquiry_id') <> '' then
      track_entity_type := 'inquiries';
      track_entity_id := (p_entity_data->>'inquiry_id')::uuid;
    end if;
  elsif p_dedupe_scope = 'company' then
    if p_entity_data ? 'company_id' and (p_entity_data->>'company_id') <> '' then
      track_entity_type := 'companies';
      track_entity_id := (p_entity_data->>'company_id')::uuid;
    end if;
  end if;
  return next;
end;
$$;

-- ============================================
-- execute_workflow_rules: ergänze Dedupe-Logik (für record_created-Triggers)
-- Vorher: keine Dedupe-Prüfung beim Erstlauf — record_created feuerte
-- bei JEDEM Entity-Insert. Jetzt: wenn dedupe_scope != 'entity', prüfen
-- ob schon eine Tracking-Row existiert.
-- ============================================
create or replace function execute_workflow_rules(
  p_entity_type text,
  p_entity_id uuid,
  p_entity_data jsonb,
  p_trigger_type text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_rule record;
  v_conditions_met boolean;
  v_action_results jsonb;
  v_dedupe record;
  v_already boolean;
begin
  for v_rule in
    select *
      from workflow_rules
     where entity_type = p_entity_type
       and trigger_type = p_trigger_type
       and is_active = true
       and tenant_id = (p_entity_data->>'tenant_id')::uuid
  loop
    v_conditions_met := evaluate_workflow_conditions(p_entity_data, v_rule.conditions);
    if not v_conditions_met then continue; end if;

    -- Dedupe-Check
    select * into v_dedupe
      from workflow_resolve_dedupe_key(v_rule.dedupe_scope, p_entity_type, p_entity_id, p_entity_data);

    if v_dedupe.track_entity_type is null then
      -- Konnte Dedupe-Key nicht resolven (z.B. user_id fehlt) → fall back auf entity
      v_dedupe.track_entity_type := p_entity_type;
      v_dedupe.track_entity_id := p_entity_id;
    end if;

    -- Wenn dedupe_scope != 'entity': prüfen ob schon eine Tracking-Row existiert
    if v_rule.dedupe_scope is not null and v_rule.dedupe_scope <> 'entity' then
      select exists(
        select 1 from workflow_execution_tracking
         where rule_id = v_rule.id
           and entity_type = v_dedupe.track_entity_type
           and entity_id = v_dedupe.track_entity_id
      ) into v_already;
      if v_already then continue; end if;
    end if;

    v_action_results := execute_workflow_actions(
      v_rule.id, p_entity_type, p_entity_id, p_entity_data, v_rule.actions, v_rule.tenant_id
    );

    insert into workflow_executions (
      tenant_id, rule_id, entity_type, entity_id, status,
      matched_conditions, executed_actions
    ) values (
      v_rule.tenant_id, v_rule.id, p_entity_type, p_entity_id, 'success',
      v_rule.conditions, v_action_results
    );

    -- Tracking schreiben (auch für scope='entity', damit time-based + record_created
    -- konsistent dedupen)
    insert into workflow_execution_tracking (tenant_id, rule_id, entity_type, entity_id, last_executed_at, execution_count)
    values (v_rule.tenant_id, v_rule.id, v_dedupe.track_entity_type, v_dedupe.track_entity_id, now(), 1)
    on conflict (rule_id, entity_type, entity_id) do update
      set last_executed_at = now(),
          execution_count = workflow_execution_tracking.execution_count + 1;
  end loop;
end;
$$;

-- ============================================
-- process_time_based_workflows: gleiche Dedupe-Resolution
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
  v_track record;
  v_dedupe record;
  v_can_run boolean;
begin
  for v_rule in
    select *
      from workflow_rules
     where trigger_type = 'time_based' and is_active = true
  loop
    v_time_config := v_rule.time_config;

    if v_time_config->>'type' = 'days_in_status' then
      v_status_field := coalesce(v_time_config->>'status_field', 'status');
      v_status_value := v_time_config->>'status_value';
      v_days := (v_time_config->>'days')::int;

      for v_entity_record in
        execute format(
          'select * from %I
           where %I = $1
             and tenant_id = $2
             and (
               (status_last_changed_at is null and created_at + make_interval(days => %s) <= now())
               or status_last_changed_at + make_interval(days => %s) <= now()
             )',
          v_rule.entity_type, v_status_field, v_days, v_days
        ) using v_status_value, v_rule.tenant_id
      loop
        v_entity_data := to_jsonb(v_entity_record);

        -- Resolve dedupe-key
        select * into v_dedupe
          from workflow_resolve_dedupe_key(v_rule.dedupe_scope, v_rule.entity_type, v_entity_record.id, v_entity_data);
        if v_dedupe.track_entity_type is null then
          v_dedupe.track_entity_type := v_rule.entity_type;
          v_dedupe.track_entity_id := v_entity_record.id;
        end if;

        select * into v_track from workflow_execution_tracking
         where rule_id = v_rule.id
           and entity_type = v_dedupe.track_entity_type
           and entity_id = v_dedupe.track_entity_id
         limit 1;

        v_can_run := false;
        if v_track is null then
          v_can_run := true;
        elsif v_rule.repeat_interval_days is not null then
          if (v_rule.repeat_max is null or v_track.execution_count < v_rule.repeat_max)
             and v_track.last_executed_at + make_interval(days => v_rule.repeat_interval_days) <= now() then
            v_can_run := true;
          end if;
        end if;

        if not v_can_run then continue; end if;

        v_conditions_met := evaluate_workflow_conditions(v_entity_data, v_rule.conditions);
        if not v_conditions_met then continue; end if;

        v_action_results := execute_workflow_actions(
          v_rule.id, v_rule.entity_type, v_entity_record.id, v_entity_data, v_rule.actions, v_rule.tenant_id
        );

        insert into workflow_executions (tenant_id, rule_id, entity_type, entity_id, status, matched_conditions, executed_actions)
        values (v_rule.tenant_id, v_rule.id, v_rule.entity_type, v_entity_record.id, 'success', v_rule.conditions, v_action_results);

        if v_track is null then
          insert into workflow_execution_tracking (tenant_id, rule_id, entity_type, entity_id, last_executed_at, execution_count)
          values (v_rule.tenant_id, v_rule.id, v_dedupe.track_entity_type, v_dedupe.track_entity_id, now(), 1);
        else
          update workflow_execution_tracking
             set last_executed_at = now(),
                 execution_count = execution_count + 1
           where id = v_track.id;
        end if;

        v_processed := v_processed + 1;
      end loop;

    elsif v_time_config->>'type' = 'days_after_field' then
      v_date_field := v_time_config->>'field';
      v_days := (v_time_config->>'days')::int;

      for v_entity_record in
        execute format(
          'select * from %I
           where %I is not null
             and %I + make_interval(days => %s) <= now()
             and tenant_id = $1',
          v_rule.entity_type, v_date_field, v_date_field, v_days
        ) using v_rule.tenant_id
      loop
        v_entity_data := to_jsonb(v_entity_record);

        select * into v_dedupe
          from workflow_resolve_dedupe_key(v_rule.dedupe_scope, v_rule.entity_type, v_entity_record.id, v_entity_data);
        if v_dedupe.track_entity_type is null then
          v_dedupe.track_entity_type := v_rule.entity_type;
          v_dedupe.track_entity_id := v_entity_record.id;
        end if;

        select * into v_track from workflow_execution_tracking
         where rule_id = v_rule.id
           and entity_type = v_dedupe.track_entity_type
           and entity_id = v_dedupe.track_entity_id
         limit 1;

        v_can_run := false;
        if v_track is null then
          v_can_run := true;
        elsif v_rule.repeat_interval_days is not null then
          if (v_rule.repeat_max is null or v_track.execution_count < v_rule.repeat_max)
             and v_track.last_executed_at + make_interval(days => v_rule.repeat_interval_days) <= now() then
            v_can_run := true;
          end if;
        end if;

        if not v_can_run then continue; end if;

        v_conditions_met := evaluate_workflow_conditions(v_entity_data, v_rule.conditions);
        if not v_conditions_met then continue; end if;

        v_action_results := execute_workflow_actions(
          v_rule.id, v_rule.entity_type, v_entity_record.id, v_entity_data, v_rule.actions, v_rule.tenant_id
        );

        insert into workflow_executions (tenant_id, rule_id, entity_type, entity_id, status, matched_conditions, executed_actions)
        values (v_rule.tenant_id, v_rule.id, v_rule.entity_type, v_entity_record.id, 'success', v_rule.conditions, v_action_results);

        if v_track is null then
          insert into workflow_execution_tracking (tenant_id, rule_id, entity_type, entity_id, last_executed_at, execution_count)
          values (v_rule.tenant_id, v_rule.id, v_dedupe.track_entity_type, v_dedupe.track_entity_id, now(), 1);
        else
          update workflow_execution_tracking
             set last_executed_at = now(),
                 execution_count = execution_count + 1
           where id = v_track.id;
        end if;

        v_processed := v_processed + 1;
      end loop;
    end if;
  end loop;

  return jsonb_build_object('ok', true, 'processed', v_processed, 'ran_at', now());
end;
$$;
