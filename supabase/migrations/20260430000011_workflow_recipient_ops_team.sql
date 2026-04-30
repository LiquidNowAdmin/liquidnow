-- Erweitere execute_workflow_actions um recipient_type='operations_team':
-- pro Operations-User im Tenant wird eine sent_emails-Row gequeued.

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
  v_ops_user record;
  v_queued_count int;
begin
  for v_action in select * from jsonb_array_elements(p_actions) loop
    v_action_type := v_action->>'action_type';
    v_config := v_action->'config';

    begin
      if v_action_type = 'send_email' then
        v_template_slug := v_config->>'template_slug';

        select id, subject into v_template_id, v_template_subject
          from public.email_templates
         where tenant_id = p_tenant_id and slug = v_template_slug
         limit 1;

        if v_template_id is null then
          v_action_result := jsonb_build_object(
            'action_type','send_email','status','error',
            'reason','template not found','template_slug',v_template_slug
          );
        elsif v_config->>'recipient_type' = 'operations_team' then
          -- Pro Ops-User eine Row queuen
          v_queued_count := 0;
          for v_ops_user in
            select email from public.users
             where tenant_id = p_tenant_id and role = 'operations' and email is not null
          loop
            insert into sent_emails (
              tenant_id, recipient_email, subject, status,
              trigger_kind, trigger_rule_id, template_slug, template_id,
              entity_type, entity_id
            ) values (
              p_tenant_id, v_ops_user.email, coalesce(v_template_subject,''), 'queued',
              'workflow', p_rule_id, v_template_slug, v_template_id,
              p_entity_type, p_entity_id
            );
            v_queued_count := v_queued_count + 1;
          end loop;

          if v_queued_count = 0 then
            v_action_result := jsonb_build_object(
              'action_type','send_email','status','skipped',
              'reason','no operations users in tenant'
            );
          else
            v_action_result := jsonb_build_object(
              'action_type','send_email','status','queued',
              'recipient_type','operations_team',
              'recipient_count', v_queued_count,
              'template_slug', v_template_slug
            );
          end if;
        else
          -- Single recipient (entity_email | custom)
          if v_config->>'recipient_type' = 'entity_email' then
            v_recipient := p_entity_data->>'email';
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
            insert into sent_emails (
              tenant_id, recipient_email, subject, status,
              trigger_kind, trigger_rule_id, template_slug, template_id,
              entity_type, entity_id
            ) values (
              p_tenant_id, v_recipient, coalesce(v_template_subject,''), 'queued',
              'workflow', p_rule_id, v_template_slug, v_template_id,
              p_entity_type, p_entity_id
            );
            v_action_result := jsonb_build_object(
              'action_type','send_email','status','queued',
              'recipient',v_recipient,'template_slug',v_template_slug
            );
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
