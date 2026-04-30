-- Workflow-Engine: evaluate_workflow_conditions + execute_workflow_actions
-- + execute_workflow_rules (für AFTER INSERT-Trigger).
-- Time-based-Cron-Function in separater Migration.

-- ============================================
-- evaluate_workflow_conditions
-- ============================================
create or replace function evaluate_workflow_conditions(
  p_entity_data jsonb,
  p_conditions jsonb
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_match_type text;
  v_condition jsonb;
  v_field text;
  v_operator text;
  v_value text;
  v_entity_value text;
  v_matches int := 0;
  v_total int;
begin
  v_match_type := coalesce(p_conditions->>'match_type', 'all');
  v_total := jsonb_array_length(coalesce(p_conditions->'conditions', '[]'::jsonb));
  if v_total = 0 then return true; end if;

  for v_condition in select * from jsonb_array_elements(p_conditions->'conditions') loop
    v_field := v_condition->>'field';
    v_operator := v_condition->>'operator';
    v_value := v_condition->>'value';
    v_entity_value := p_entity_data->>v_field;

    if v_operator = 'equals' and v_entity_value = v_value then
      v_matches := v_matches + 1;
    elsif v_operator = 'not_equals' and (v_entity_value <> v_value or v_entity_value is null) then
      v_matches := v_matches + 1;
    elsif v_operator = 'contains' and v_entity_value ilike '%' || v_value || '%' then
      v_matches := v_matches + 1;
    elsif v_operator = 'not_contains' and (v_entity_value not ilike '%' || v_value || '%' or v_entity_value is null) then
      v_matches := v_matches + 1;
    elsif v_operator = 'is_null' and v_entity_value is null then
      v_matches := v_matches + 1;
    elsif v_operator = 'is_not_null' and v_entity_value is not null then
      v_matches := v_matches + 1;
    elsif v_operator in ('greater_than','less_than','greater_than_or_equal','less_than_or_equal') then
      begin
        if v_operator = 'greater_than'          and v_entity_value::numeric >  v_value::numeric then v_matches := v_matches + 1;
        elsif v_operator = 'less_than'          and v_entity_value::numeric <  v_value::numeric then v_matches := v_matches + 1;
        elsif v_operator = 'greater_than_or_equal' and v_entity_value::numeric >= v_value::numeric then v_matches := v_matches + 1;
        elsif v_operator = 'less_than_or_equal'    and v_entity_value::numeric <= v_value::numeric then v_matches := v_matches + 1;
        end if;
      exception when others then null;
      end;
    end if;
  end loop;

  if v_match_type = 'any' then return v_matches > 0;
  else return v_matches = v_total;
  end if;
end;
$$;

-- ============================================
-- execute_workflow_actions
-- Aktuell: nur send_email. Email-Versand erfolgt über separate
-- Edge Function (workflow-process-pending) damit Resend von Edge aus läuft.
-- Hier wird die Action nur in workflow_executions geloggt + ein Datensatz
-- in einer Pending-Queue (sent_emails mit status='queued') angelegt, den
-- der Cron/Trigger-Endpoint dann tatsächlich versendet.
-- ============================================
create or replace function execute_workflow_actions(
  p_rule_id uuid,
  p_entity_type text,
  p_entity_id uuid,
  p_entity_data jsonb,
  p_actions jsonb,
  p_tenant_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_action jsonb;
  v_action_type text;
  v_config jsonb;
  v_result jsonb := '[]'::jsonb;
  v_action_result jsonb;
  v_template_slug text;
  v_recipient text;
  v_template_id uuid;
  v_template_subject text;
  v_user_email text;
begin
  for v_action in select * from jsonb_array_elements(p_actions) loop
    v_action_type := v_action->>'action_type';
    v_config := v_action->'config';

    begin
      if v_action_type = 'send_email' then
        v_template_slug := v_config->>'template_slug';

        -- Resolve recipient
        if v_config->>'recipient_type' = 'entity_email' then
          v_recipient := p_entity_data->>'email';
          -- inquiries/applications haben keine email-Spalte direkt — über user_id schauen
          if v_recipient is null and (p_entity_data->>'user_id') is not null then
            select email into v_user_email from public.users where id = (p_entity_data->>'user_id')::uuid;
            v_recipient := v_user_email;
          end if;
        elsif v_config->>'recipient_type' = 'custom' then
          v_recipient := v_config->>'custom_email';
        end if;

        if v_recipient is null or v_recipient = '' then
          v_action_result := jsonb_build_object('action_type','send_email','status','skipped','reason','no recipient');
        else
          select id, subject into v_template_id, v_template_subject
            from public.email_templates
           where tenant_id = p_tenant_id and slug = v_template_slug
           limit 1;
          if v_template_id is null then
            v_action_result := jsonb_build_object('action_type','send_email','status','error','reason','template not found','template_slug',v_template_slug);
          else
            -- Pending-Row in sent_emails (status='queued') — wird vom workflow-process-pending Sender abgeholt
            insert into sent_emails (
              tenant_id, recipient_email, subject, status,
              trigger_kind, trigger_rule_id, template_slug, template_id,
              entity_type, entity_id
            ) values (
              p_tenant_id, v_recipient, coalesce(v_template_subject,''), 'queued',
              'workflow', p_rule_id, v_template_slug, v_template_id,
              p_entity_type, p_entity_id
            );
            v_action_result := jsonb_build_object('action_type','send_email','status','queued','recipient',v_recipient,'template_slug',v_template_slug);
          end if;
        end if;
      else
        v_action_result := jsonb_build_object('action_type', v_action_type, 'status', 'unsupported');
      end if;
    exception when others then
      v_action_result := jsonb_build_object('action_type', v_action_type, 'status', 'error', 'error', sqlerrm);
    end;

    v_result := v_result || jsonb_build_array(v_action_result);
  end loop;

  return v_result;
end;
$$;

-- Erweitere sent_emails.status um 'queued'
alter table sent_emails drop constraint if exists sent_emails_status_check;
alter table sent_emails add constraint sent_emails_status_check
  check (status in ('queued','sending','sent','failed','bounced'));

-- ============================================
-- execute_workflow_rules — wird von record_created-Triggers aufgerufen
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
    if v_conditions_met then
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
    end if;
  end loop;
end;
$$;
