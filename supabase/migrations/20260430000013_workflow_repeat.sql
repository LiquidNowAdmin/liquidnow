-- Wiederholungs-Funktion für time-based Rules.
-- Beispiel: "Erinnerung alle 7 Tage, max 3 Mal" → repeat_interval_days=7, repeat_max=3.

alter table workflow_rules
  add column if not exists repeat_interval_days integer,         -- NULL = kein Repeat (default-Verhalten: nur 1×)
  add column if not exists repeat_max            integer;         -- NULL = unbegrenzt (mit interval_days kombiniert)

alter table workflow_execution_tracking
  add column if not exists execution_count integer not null default 1;

-- Re-create unique constraint: jetzt erlauben wir mehrere Rows pro (rule, entity)
-- — pro Lauf eine separate tracking-Row, oder ein gemeinsamer Counter.
-- Wir nutzen den COUNTER-Ansatz: 1 Row pro (rule, entity), execution_count zählt.
-- Unique-Constraint von vorher bleibt; wir UPDATEn den Counter statt INSERT.

-- ============================================
-- process_time_based_workflows: Repeat-Logic
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
  v_can_run boolean;
begin
  for v_rule in
    select *
      from workflow_rules
     where trigger_type = 'time_based' and is_active = true
  loop
    v_time_config := v_rule.time_config;

    -- Type 1: days_in_status
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
        -- Check tracking: gab's schon einen Lauf? Wenn ja, Repeat-Logik.
        select * into v_track from workflow_execution_tracking
         where rule_id = v_rule.id
           and entity_type = v_rule.entity_type
           and entity_id = v_entity_record.id
         limit 1;

        v_can_run := false;
        if v_track is null then
          v_can_run := true;  -- Erstlauf
        elsif v_rule.repeat_interval_days is not null then
          -- Repeat erlaubt? Max nicht erreicht UND Intervall vergangen?
          if (v_rule.repeat_max is null or v_track.execution_count < v_rule.repeat_max)
             and v_track.last_executed_at + make_interval(days => v_rule.repeat_interval_days) <= now() then
            v_can_run := true;
          end if;
        end if;

        if not v_can_run then continue; end if;

        v_entity_data := to_jsonb(v_entity_record);
        v_conditions_met := evaluate_workflow_conditions(v_entity_data, v_rule.conditions);
        if not v_conditions_met then continue; end if;

        v_action_results := execute_workflow_actions(
          v_rule.id, v_rule.entity_type, v_entity_record.id, v_entity_data, v_rule.actions, v_rule.tenant_id
        );

        insert into workflow_executions (tenant_id, rule_id, entity_type, entity_id, status, matched_conditions, executed_actions)
        values (v_rule.tenant_id, v_rule.id, v_rule.entity_type, v_entity_record.id, 'success', v_rule.conditions, v_action_results);

        if v_track is null then
          insert into workflow_execution_tracking (tenant_id, rule_id, entity_type, entity_id, last_executed_at, execution_count)
          values (v_rule.tenant_id, v_rule.id, v_rule.entity_type, v_entity_record.id, now(), 1);
        else
          update workflow_execution_tracking
             set last_executed_at = now(),
                 execution_count = execution_count + 1
           where id = v_track.id;
        end if;

        v_processed := v_processed + 1;
      end loop;

    -- Type 2: days_after_field
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
        select * into v_track from workflow_execution_tracking
         where rule_id = v_rule.id
           and entity_type = v_rule.entity_type
           and entity_id = v_entity_record.id
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

        v_entity_data := to_jsonb(v_entity_record);
        v_conditions_met := evaluate_workflow_conditions(v_entity_data, v_rule.conditions);
        if not v_conditions_met then continue; end if;

        v_action_results := execute_workflow_actions(
          v_rule.id, v_rule.entity_type, v_entity_record.id, v_entity_data, v_rule.actions, v_rule.tenant_id
        );

        insert into workflow_executions (tenant_id, rule_id, entity_type, entity_id, status, matched_conditions, executed_actions)
        values (v_rule.tenant_id, v_rule.id, v_rule.entity_type, v_entity_record.id, 'success', v_rule.conditions, v_action_results);

        if v_track is null then
          insert into workflow_execution_tracking (tenant_id, rule_id, entity_type, entity_id, last_executed_at, execution_count)
          values (v_rule.tenant_id, v_rule.id, v_rule.entity_type, v_entity_record.id, now(), 1);
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
