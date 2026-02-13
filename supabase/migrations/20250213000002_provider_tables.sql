-- ============================================
-- Migration: Provider Domain Tables
-- providers, products, tenant_provider_settings
-- ============================================

-- ----- PROVIDERS -----
-- Global catalog (no tenant_id — shared across all tenants)
create table providers (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  type        text,
  logo_url    text,
  website     text,
  is_active   boolean default true,
  metadata    jsonb default '{}',
  created_at  timestamptz default now()
);

-- ----- PRODUCTS -----
create table products (
  id                  uuid primary key default uuid_generate_v4(),
  provider_id         uuid not null references providers(id) on delete cascade,
  name                text not null,
  type                text,
  min_volume          integer,
  max_volume          integer,
  min_term_months     integer,
  max_term_months     integer,
  interest_rate_from  decimal,
  interest_rate_to    decimal,
  is_active           boolean default true,
  metadata            jsonb default '{}',
  created_at          timestamptz default now()
);

create index idx_products_provider on products(provider_id);
create index idx_products_type on products(type);
create index idx_products_active on products(is_active) where is_active = true;

-- ----- TENANT PROVIDER SETTINGS -----
-- Controls which providers are visible per tenant
create table tenant_provider_settings (
  id          uuid primary key default uuid_generate_v4(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  provider_id uuid not null references providers(id) on delete cascade,
  is_enabled  boolean default true,
  config      jsonb default '{}',
  created_at  timestamptz default now(),
  unique(tenant_id, provider_id)
);

create index idx_tenant_provider_tenant on tenant_provider_settings(tenant_id);
