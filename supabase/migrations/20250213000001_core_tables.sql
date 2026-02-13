-- ============================================
-- Migration: Core Domain Tables
-- tenants, users, companies, company_members
-- ============================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ----- TENANTS -----
create table tenants (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  slug        text unique not null,
  domain      text,
  branding    jsonb default '{}',
  config      jsonb default '{}',
  is_active   boolean default true,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Insert default tenant (LiqiNow itself)
insert into tenants (name, slug) values ('LiqiNow', 'liqinow');

-- ----- USERS -----
-- Extends auth.users via trigger
create table users (
  id          uuid primary key references auth.users(id) on delete cascade,
  tenant_id   uuid not null references tenants(id),
  email       text not null,
  role        text not null default 'lead',
  first_name  text,
  last_name   text,
  phone       text,
  metadata    jsonb default '{}',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create index idx_users_tenant on users(tenant_id);
create index idx_users_email on users(email);
create index idx_users_role on users(role);

-- ----- COMPANIES -----
create table companies (
  id              uuid primary key default uuid_generate_v4(),
  tenant_id       uuid not null references tenants(id),
  name            text not null,
  legal_form      text,
  ust_id          text,
  hrb             text,
  website         text,
  address         jsonb default '{}',
  industry        text,
  annual_revenue  integer,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  deleted_at      timestamptz
);

create index idx_companies_tenant on companies(tenant_id);
create index idx_companies_name on companies(name);
create index idx_companies_deleted on companies(deleted_at) where deleted_at is null;

-- ----- COMPANY MEMBERS -----
create table company_members (
  id          uuid primary key default uuid_generate_v4(),
  tenant_id   uuid not null references tenants(id),
  company_id  uuid not null references companies(id) on delete cascade,
  user_id     uuid not null references users(id) on delete cascade,
  role        text default 'member',
  created_at  timestamptz default now(),
  unique(company_id, user_id)
);

create index idx_company_members_tenant on company_members(tenant_id);
create index idx_company_members_user on company_members(user_id);
create index idx_company_members_company on company_members(company_id);

-- ----- TRIGGER: auto-create user on auth signup -----
create or replace function handle_new_auth_user()
returns trigger as $$
declare
  default_tenant_id uuid;
begin
  -- Get default tenant (LiqiNow)
  select id into default_tenant_id from tenants where slug = 'liqinow';

  insert into public.users (id, tenant_id, email, role, first_name, last_name, metadata)
  values (
    new.id,
    coalesce(
      (new.raw_user_meta_data->>'tenant_id')::uuid,
      default_tenant_id
    ),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'lead'),
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    coalesce(new.raw_user_meta_data->'metadata', '{}')
  );

  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();

-- ----- TRIGGER: auto-update updated_at -----
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_tenants_updated_at before update on tenants
  for each row execute function update_updated_at();
create trigger trg_users_updated_at before update on users
  for each row execute function update_updated_at();
create trigger trg_companies_updated_at before update on companies
  for each row execute function update_updated_at();
