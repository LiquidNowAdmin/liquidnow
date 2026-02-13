-- ============================================
-- Migration: Event System
-- events table + generic trigger function
-- ============================================

-- ----- EVENTS -----
create table events (
  id          uuid primary key default uuid_generate_v4(),
  tenant_id   uuid,
  entity_type text not null,
  entity_id   uuid not null,
  event_type  text not null,
  actor_id    uuid,
  actor_type  text default 'system',
  payload     jsonb default '{}',
  metadata    jsonb default '{}',
  created_at  timestamptz default now()
);

create index idx_events_tenant on events(tenant_id);
create index idx_events_entity on events(entity_type, entity_id);
create index idx_events_type on events(event_type);
create index idx_events_created on events(created_at);
create index idx_events_actor on events(actor_id) where actor_id is not null;

-- ----- GENERIC EVENT LOGGING TRIGGER -----
-- Fires on INSERT, UPDATE, DELETE on any table that has this trigger attached.
-- Automatically captures entity_type (table name), entity_id, event_type, and payload.
create or replace function log_event()
returns trigger as $$
declare
  event_row record;
  ev_type text;
  ev_payload jsonb;
  ev_tenant_id uuid;
  ev_entity_id uuid;
begin
  -- Determine event type
  if TG_OP = 'INSERT' then
    event_row := new;
    ev_type := TG_ARGV[0] || '.created';
  elsif TG_OP = 'UPDATE' then
    event_row := new;
    -- Check if status changed specifically
    if old.status is distinct from new.status then
      ev_type := TG_ARGV[0] || '.status_changed';
    else
      ev_type := TG_ARGV[0] || '.updated';
    end if;
  elsif TG_OP = 'DELETE' then
    event_row := old;
    ev_type := TG_ARGV[0] || '.deleted';
  end if;

  -- Extract tenant_id and id from the row
  ev_entity_id := event_row.id;
  ev_tenant_id := event_row.tenant_id;

  -- Build payload
  if TG_OP = 'UPDATE' then
    ev_payload := jsonb_build_object(
      'old', to_jsonb(old),
      'new', to_jsonb(new)
    );
  else
    ev_payload := to_jsonb(event_row);
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

-- ----- ATTACH TRIGGERS TO ALL BUSINESS TABLES -----

-- Core
create trigger trg_events_companies after insert or update or delete on companies
  for each row execute function log_event('company');

create trigger trg_events_company_members after insert or update or delete on company_members
  for each row execute function log_event('company_member');

-- Provider (no tenant_id, but still logged)
create trigger trg_events_providers after insert or update or delete on providers
  for each row execute function log_event('provider');

create trigger trg_events_products after insert or update or delete on products
  for each row execute function log_event('product');

-- Inquiry
create trigger trg_events_inquiries after insert or update or delete on inquiries
  for each row execute function log_event('inquiry');

-- Application
create trigger trg_events_applications after insert or update or delete on applications
  for each row execute function log_event('application');

create trigger trg_events_app_offers after insert or update or delete on application_offers
  for each row execute function log_event('application_offer');

create trigger trg_events_app_status_logs after insert on application_status_logs
  for each row execute function log_event('application_status_log');

create trigger trg_events_app_documents after insert or delete on application_documents
  for each row execute function log_event('application_document');

-- Documents
create trigger trg_events_documents after insert or update or delete on documents
  for each row execute function log_event('document');

-- ----- EVENT CHAIN FUNCTION -----
-- Runs after each event insert. Checks conditions and triggers follow-up actions.
create or replace function check_event_chains()
returns trigger as $$
begin
  -- Example chain: when all documents for an application are uploaded,
  -- auto-advance status. Add chains here as business rules evolve.

  -- Chain: application.status_changed → log to application_status_logs
  if new.entity_type = 'application' and new.event_type = 'application.status_changed' then
    insert into application_status_logs (
      tenant_id,
      application_id,
      from_status,
      to_status,
      changed_by
    ) values (
      new.tenant_id,
      new.entity_id,
      new.payload->'old'->>'status',
      new.payload->'new'->>'status',
      new.actor_id
    );
  end if;

  return new;
end;
$$ language plpgsql security definer;

create trigger trg_event_chains after insert on events
  for each row execute function check_event_chains();
