-- ============================================
-- Migration: Inquiry & Application Domain Tables
-- inquiries, applications, application_offers,
-- application_status_logs, application_documents
-- ============================================

-- ----- INQUIRIES -----
create table inquiries (
  id            uuid primary key default uuid_generate_v4(),
  tenant_id     uuid not null references tenants(id),
  company_id    uuid not null references companies(id),
  user_id       uuid not null references users(id),
  company_name  text,
  volume        integer not null,
  term_months   integer,
  purpose       text,
  status        text default 'new',
  metadata      jsonb default '{}',
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index idx_inquiries_tenant on inquiries(tenant_id);
create index idx_inquiries_company on inquiries(company_id);
create index idx_inquiries_user on inquiries(user_id);
create index idx_inquiries_status on inquiries(status);

-- ----- APPLICATIONS -----
create table applications (
  id              uuid primary key default uuid_generate_v4(),
  tenant_id       uuid not null references tenants(id),
  inquiry_id      uuid not null references inquiries(id),
  product_id      uuid not null references products(id),
  company_id      uuid not null references companies(id),
  user_id         uuid not null references users(id),
  provider_name   text,
  product_name    text,
  volume          integer,
  term_months     integer,
  status          text default 'new',
  metadata        jsonb default '{}',
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index idx_applications_tenant on applications(tenant_id);
create index idx_applications_inquiry on applications(inquiry_id);
create index idx_applications_company on applications(company_id);
create index idx_applications_user on applications(user_id);
create index idx_applications_status on applications(status);

-- ----- APPLICATION OFFERS -----
create table application_offers (
  id              uuid primary key default uuid_generate_v4(),
  tenant_id       uuid not null references tenants(id),
  application_id  uuid not null references applications(id) on delete cascade,
  company_id      uuid not null references companies(id),
  type            text,
  interest_rate   decimal,
  volume          integer,
  term_months     integer,
  monthly_payment decimal,
  total_cost      decimal,
  conditions      jsonb default '{}',
  valid_until     date,
  created_by      uuid references users(id),
  created_at      timestamptz default now()
);

create index idx_app_offers_application on application_offers(application_id);
create index idx_app_offers_tenant on application_offers(tenant_id);

-- ----- APPLICATION STATUS LOGS -----
create table application_status_logs (
  id              uuid primary key default uuid_generate_v4(),
  tenant_id       uuid not null references tenants(id),
  application_id  uuid not null references applications(id) on delete cascade,
  from_status     text,
  to_status       text,
  changed_by      uuid references users(id),
  note            text,
  created_at      timestamptz default now()
);

create index idx_app_status_logs_application on application_status_logs(application_id);
create index idx_app_status_logs_tenant on application_status_logs(tenant_id);

-- ----- APPLICATION DOCUMENTS -----
-- Junction table: which documents are attached to which application
create table application_documents (
  id              uuid primary key default uuid_generate_v4(),
  tenant_id       uuid not null references tenants(id),
  application_id  uuid not null references applications(id) on delete cascade,
  document_id     uuid not null,  -- FK added in documents migration
  created_at      timestamptz default now(),
  unique(application_id, document_id)
);

create index idx_app_docs_application on application_documents(application_id);
create index idx_app_docs_tenant on application_documents(tenant_id);

-- Auto-update updated_at triggers
create trigger trg_inquiries_updated_at before update on inquiries
  for each row execute function update_updated_at();
create trigger trg_applications_updated_at before update on applications
  for each row execute function update_updated_at();
