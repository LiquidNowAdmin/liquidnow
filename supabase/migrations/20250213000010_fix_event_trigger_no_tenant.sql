-- ============================================
-- Fix: log_event() trigger for tables without tenant_id
-- (providers, products have no tenant_id column)
-- ============================================

create or replace function log_event()
returns trigger as $$
declare
  event_row record;
  ev_type text;
  ev_payload jsonb;
  ev_tenant_id uuid;
  ev_entity_id uuid;
  ev_row_json jsonb;
begin
  -- Determine event type
  if TG_OP = 'INSERT' then
    event_row := new;
    ev_type := TG_ARGV[0] || '.created';
  elsif TG_OP = 'UPDATE' then
    event_row := new;
    if old.status is distinct from new.status then
      ev_type := TG_ARGV[0] || '.status_changed';
    else
      ev_type := TG_ARGV[0] || '.updated';
    end if;
  elsif TG_OP = 'DELETE' then
    event_row := old;
    ev_type := TG_ARGV[0] || '.deleted';
  end if;

  -- Extract id and tenant_id safely (tenant_id may not exist on all tables)
  ev_row_json := to_jsonb(event_row);
  ev_entity_id := (ev_row_json->>'id')::uuid;
  ev_tenant_id := (ev_row_json->>'tenant_id')::uuid;  -- NULL if column doesn't exist

  -- Build payload
  if TG_OP = 'UPDATE' then
    ev_payload := jsonb_build_object(
      'old', to_jsonb(old),
      'new', to_jsonb(new)
    );
  else
    ev_payload := ev_row_json;
  end if;

  -- Insert event
  insert into events (tenant_id, entity_type, entity_id, event_type, actor_id, actor_type, payload)
  values (
    ev_tenant_id,
    TG_ARGV[0],
    ev_entity_id,
    ev_type,
    auth.uid(),
    case when auth.uid() is not null then 'user' else 'system' end,
    ev_payload
  );

  if TG_OP = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$ language plpgsql security definer;
