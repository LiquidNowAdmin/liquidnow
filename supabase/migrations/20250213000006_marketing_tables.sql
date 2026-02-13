-- ============================================
-- Migration: Marketing Domain Tables
-- marketing_sessions, marketing_events
-- ============================================

-- ----- MARKETING SESSIONS -----
create table marketing_sessions (
  id            uuid primary key default uuid_generate_v4(),
  tenant_id     uuid not null references tenants(id),
  visitor_id    text,
  user_id       uuid references users(id),
  utm_source    text,
  utm_medium    text,
  utm_campaign  text,
  referrer      text,
  landing_page  text,
  device_type   text,
  created_at    timestamptz default now()
);

create index idx_marketing_sessions_tenant on marketing_sessions(tenant_id);
create index idx_marketing_sessions_visitor on marketing_sessions(visitor_id);
create index idx_marketing_sessions_user on marketing_sessions(user_id) where user_id is not null;
create index idx_marketing_sessions_created on marketing_sessions(created_at);

-- ----- MARKETING EVENTS -----
create table marketing_events (
  id          uuid primary key default uuid_generate_v4(),
  tenant_id   uuid not null references tenants(id),
  session_id  uuid not null references marketing_sessions(id) on delete cascade,
  event_type  text not null,
  properties  jsonb default '{}',
  created_at  timestamptz default now()
);

create index idx_marketing_events_session on marketing_events(session_id);
create index idx_marketing_events_tenant on marketing_events(tenant_id);
create index idx_marketing_events_type on marketing_events(event_type);
create index idx_marketing_events_created on marketing_events(created_at);
