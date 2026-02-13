-- ============================================
-- Migration: Row Level Security Policies
-- ============================================

-- Enable RLS on all tables
alter table tenants enable row level security;
alter table users enable row level security;
alter table companies enable row level security;
alter table company_members enable row level security;
alter table providers enable row level security;
alter table products enable row level security;
alter table tenant_provider_settings enable row level security;
alter table inquiries enable row level security;
alter table applications enable row level security;
alter table application_offers enable row level security;
alter table application_status_logs enable row level security;
alter table application_documents enable row level security;
alter table documents enable row level security;
alter table events enable row level security;
alter table marketing_sessions enable row level security;
alter table marketing_events enable row level security;

-- ============================================
-- Helper function: get current user's tenant_id
-- ============================================
create or replace function get_user_tenant_id()
returns uuid as $$
  select tenant_id from users where id = auth.uid();
$$ language sql stable security definer;

-- Helper function: get current user's role
create or replace function get_user_role()
returns text as $$
  select role from users where id = auth.uid();
$$ language sql stable security definer;

-- Helper function: get company IDs the current user belongs to
create or replace function get_user_company_ids()
returns setof uuid as $$
  select company_id from company_members where user_id = auth.uid();
$$ language sql stable security definer;

-- ============================================
-- TENANTS: users see only their own tenant
-- ============================================
create policy "Users can view own tenant"
  on tenants for select
  using (id = get_user_tenant_id());

-- ============================================
-- USERS: see own tenant's users
-- Operations: all users in tenant
-- Lead: only themselves
-- ============================================
create policy "Operations can view all tenant users"
  on users for select
  using (
    tenant_id = get_user_tenant_id()
    and get_user_role() = 'operations'
  );

create policy "Lead can view own profile"
  on users for select
  using (id = auth.uid());

create policy "Users can update own profile"
  on users for update
  using (id = auth.uid());

-- ============================================
-- COMPANIES: tenant-scoped
-- Operations: all companies in tenant
-- Lead: only companies they belong to
-- ============================================
create policy "Operations can view all tenant companies"
  on companies for select
  using (
    tenant_id = get_user_tenant_id()
    and get_user_role() = 'operations'
    and deleted_at is null
  );

create policy "Lead can view own companies"
  on companies for select
  using (
    id in (select get_user_company_ids())
    and deleted_at is null
  );

create policy "Operations can manage tenant companies"
  on companies for all
  using (
    tenant_id = get_user_tenant_id()
    and get_user_role() = 'operations'
  );

create policy "Lead can insert companies in own tenant"
  on companies for insert
  with check (tenant_id = get_user_tenant_id());

create policy "Lead can update own companies"
  on companies for update
  using (id in (select get_user_company_ids()));

-- ============================================
-- COMPANY MEMBERS: tenant-scoped
-- ============================================
create policy "Users can view own tenant members"
  on company_members for select
  using (tenant_id = get_user_tenant_id());

create policy "Operations can manage tenant members"
  on company_members for all
  using (
    tenant_id = get_user_tenant_id()
    and get_user_role() = 'operations'
  );

create policy "Lead can insert own memberships"
  on company_members for insert
  with check (
    tenant_id = get_user_tenant_id()
    and user_id = auth.uid()
  );

-- ============================================
-- PROVIDERS & PRODUCTS: global read access (filtered by tenant_provider_settings in app)
-- ============================================
create policy "Authenticated users can view active providers"
  on providers for select
  using (is_active = true);

create policy "Authenticated users can view active products"
  on products for select
  using (is_active = true);

create policy "Operations can manage providers"
  on providers for all
  using (get_user_role() = 'operations');

create policy "Operations can manage products"
  on products for all
  using (get_user_role() = 'operations');

-- ============================================
-- TENANT PROVIDER SETTINGS: tenant-scoped
-- ============================================
create policy "Users can view own tenant provider settings"
  on tenant_provider_settings for select
  using (tenant_id = get_user_tenant_id());

create policy "Operations can manage tenant provider settings"
  on tenant_provider_settings for all
  using (
    tenant_id = get_user_tenant_id()
    and get_user_role() = 'operations'
  );

-- ============================================
-- INQUIRIES: tenant + company scoped
-- ============================================
create policy "Operations can view all tenant inquiries"
  on inquiries for select
  using (
    tenant_id = get_user_tenant_id()
    and get_user_role() = 'operations'
  );

create policy "Lead can view own company inquiries"
  on inquiries for select
  using (company_id in (select get_user_company_ids()));

create policy "Lead can create inquiries for own companies"
  on inquiries for insert
  with check (
    tenant_id = get_user_tenant_id()
    and company_id in (select get_user_company_ids())
  );

create policy "Operations can manage all tenant inquiries"
  on inquiries for all
  using (
    tenant_id = get_user_tenant_id()
    and get_user_role() = 'operations'
  );

-- ============================================
-- APPLICATIONS: tenant + company scoped
-- ============================================
create policy "Operations can view all tenant applications"
  on applications for select
  using (
    tenant_id = get_user_tenant_id()
    and get_user_role() = 'operations'
  );

create policy "Lead can view own company applications"
  on applications for select
  using (company_id in (select get_user_company_ids()));

create policy "Lead can create applications for own companies"
  on applications for insert
  with check (
    tenant_id = get_user_tenant_id()
    and company_id in (select get_user_company_ids())
  );

create policy "Operations can manage all tenant applications"
  on applications for all
  using (
    tenant_id = get_user_tenant_id()
    and get_user_role() = 'operations'
  );

-- ============================================
-- APPLICATION OFFERS: tenant + company scoped
-- ============================================
create policy "Operations can manage all tenant offers"
  on application_offers for all
  using (
    tenant_id = get_user_tenant_id()
    and get_user_role() = 'operations'
  );

create policy "Lead can view own company offers"
  on application_offers for select
  using (company_id in (select get_user_company_ids()));

-- ============================================
-- APPLICATION STATUS LOGS: tenant-scoped (read-only for leads)
-- ============================================
create policy "Operations can view all tenant status logs"
  on application_status_logs for select
  using (
    tenant_id = get_user_tenant_id()
    and get_user_role() = 'operations'
  );

create policy "Lead can view own application status logs"
  on application_status_logs for select
  using (
    application_id in (
      select id from applications where company_id in (select get_user_company_ids())
    )
  );

-- ============================================
-- APPLICATION DOCUMENTS: tenant-scoped
-- ============================================
create policy "Operations can manage all tenant app documents"
  on application_documents for all
  using (
    tenant_id = get_user_tenant_id()
    and get_user_role() = 'operations'
  );

create policy "Lead can manage own company app documents"
  on application_documents for all
  using (
    application_id in (
      select id from applications where company_id in (select get_user_company_ids())
    )
  );

-- ============================================
-- DOCUMENTS: tenant + company scoped
-- ============================================
create policy "Operations can manage all tenant documents"
  on documents for all
  using (
    tenant_id = get_user_tenant_id()
    and get_user_role() = 'operations'
  );

create policy "Lead can view own company documents"
  on documents for select
  using (company_id in (select get_user_company_ids()));

create policy "Lead can upload documents to own companies"
  on documents for insert
  with check (
    tenant_id = get_user_tenant_id()
    and company_id in (select get_user_company_ids())
  );

-- ============================================
-- EVENTS: tenant-scoped (read-only)
-- Operations only — leads don't need to see raw events
-- ============================================
create policy "Operations can view tenant events"
  on events for select
  using (
    tenant_id = get_user_tenant_id()
    and get_user_role() = 'operations'
  );

-- Events are insert-only via triggers (security definer), no direct user access
create policy "System can insert events"
  on events for insert
  with check (false);  -- Only triggers with security definer can insert

-- ============================================
-- MARKETING: tenant-scoped
-- Marketing events can be inserted by anonymous users (via anon key)
-- ============================================
create policy "Anyone can insert marketing sessions"
  on marketing_sessions for insert
  with check (true);

create policy "Anyone can insert marketing events"
  on marketing_events for insert
  with check (true);

create policy "Operations can view tenant marketing data"
  on marketing_sessions for select
  using (
    tenant_id = get_user_tenant_id()
    and get_user_role() = 'operations'
  );

create policy "Operations can view tenant marketing events"
  on marketing_events for select
  using (
    tenant_id = get_user_tenant_id()
    and get_user_role() = 'operations'
  );
