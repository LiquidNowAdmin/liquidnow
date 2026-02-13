-- ============================================
-- Migration: PostgreSQL Business Functions
-- All business logic lives here — FE only calls these
-- ============================================

-- ============================================
-- create_inquiry: Creates an inquiry with cross-domain copies
-- ============================================
create or replace function create_inquiry(
  p_company_id uuid,
  p_volume integer,
  p_term_months integer default null,
  p_purpose text default null,
  p_metadata jsonb default '{}'
)
returns uuid as $$
declare
  v_tenant_id uuid;
  v_company_name text;
  v_inquiry_id uuid;
begin
  -- Get user's tenant
  v_tenant_id := get_user_tenant_id();
  if v_tenant_id is null then
    raise exception 'User not authenticated or no tenant';
  end if;

  -- Verify user has access to this company
  if not exists (
    select 1 from company_members
    where company_id = p_company_id and user_id = auth.uid()
  ) and get_user_role() != 'operations' then
    raise exception 'No access to this company';
  end if;

  -- Cross-domain copy: get company name
  select name into v_company_name from companies where id = p_company_id;

  -- Create inquiry
  insert into inquiries (tenant_id, company_id, user_id, company_name, volume, term_months, purpose, metadata)
  values (v_tenant_id, p_company_id, auth.uid(), v_company_name, p_volume, p_term_months, p_purpose, p_metadata)
  returning id into v_inquiry_id;

  return v_inquiry_id;
end;
$$ language plpgsql security definer;

-- ============================================
-- submit_application: Creates application with cross-domain copies
-- ============================================
create or replace function submit_application(
  p_inquiry_id uuid,
  p_product_id uuid,
  p_metadata jsonb default '{}'
)
returns uuid as $$
declare
  v_inquiry record;
  v_product record;
  v_provider record;
  v_application_id uuid;
begin
  -- Get inquiry data
  select * into v_inquiry from inquiries where id = p_inquiry_id;
  if v_inquiry is null then
    raise exception 'Inquiry not found';
  end if;

  -- Verify access
  if not exists (
    select 1 from company_members
    where company_id = v_inquiry.company_id and user_id = auth.uid()
  ) and get_user_role() != 'operations' then
    raise exception 'No access to this inquiry';
  end if;

  -- Get product + provider data for cross-domain copy
  select * into v_product from products where id = p_product_id;
  if v_product is null then
    raise exception 'Product not found';
  end if;

  select * into v_provider from providers where id = v_product.provider_id;

  -- Create application with denormalized fields
  insert into applications (
    tenant_id, inquiry_id, product_id, company_id, user_id,
    provider_name, product_name, volume, term_months, status, metadata
  ) values (
    v_inquiry.tenant_id, p_inquiry_id, p_product_id, v_inquiry.company_id, auth.uid(),
    v_provider.name, v_product.name, v_inquiry.volume, v_inquiry.term_months,
    'new', p_metadata
  ) returning id into v_application_id;

  return v_application_id;
end;
$$ language plpgsql security definer;

-- ============================================
-- change_application_status: Validates transition, updates status
-- Event logging happens automatically via trigger → events → event chain → status_logs
-- ============================================
create or replace function change_application_status(
  p_application_id uuid,
  p_new_status text,
  p_note text default null
)
returns void as $$
declare
  v_application record;
  v_allowed boolean := false;
begin
  -- Get current application
  select * into v_application from applications where id = p_application_id;
  if v_application is null then
    raise exception 'Application not found';
  end if;

  -- Verify access
  if not exists (
    select 1 from company_members
    where company_id = v_application.company_id and user_id = auth.uid()
  ) and get_user_role() != 'operations' then
    raise exception 'No access to this application';
  end if;

  -- Validate status transition (flexible, just prevent nonsensical transitions)
  case v_application.status
    when 'new' then
      v_allowed := p_new_status in ('product_selected', 'inquired', 'rejected');
    when 'product_selected' then
      v_allowed := p_new_status in ('inquired', 'rejected');
    when 'inquired' then
      v_allowed := p_new_status in ('signed', 'rejected');
    when 'signed' then
      v_allowed := p_new_status in ('closed', 'rejected');
    when 'rejected' then
      v_allowed := false;  -- Terminal state
    when 'closed' then
      v_allowed := false;  -- Terminal state
    else
      v_allowed := true;   -- Unknown status, allow (flexibility)
  end case;

  -- Operations can force any transition
  if get_user_role() = 'operations' then
    v_allowed := true;
  end if;

  if not v_allowed then
    raise exception 'Status transition from % to % is not allowed', v_application.status, p_new_status;
  end if;

  -- Update status (triggers: updated_at, events, event_chain → status_log)
  update applications set status = p_new_status where id = p_application_id;
end;
$$ language plpgsql security definer;

-- ============================================
-- create_application_offer: Operations or system creates an offer
-- ============================================
create or replace function create_application_offer(
  p_application_id uuid,
  p_type text,
  p_interest_rate decimal default null,
  p_volume integer default null,
  p_term_months integer default null,
  p_monthly_payment decimal default null,
  p_total_cost decimal default null,
  p_conditions jsonb default '{}',
  p_valid_until date default null
)
returns uuid as $$
declare
  v_application record;
  v_offer_id uuid;
begin
  -- Get application
  select * into v_application from applications where id = p_application_id;
  if v_application is null then
    raise exception 'Application not found';
  end if;

  -- Only operations can create offers
  if get_user_role() != 'operations' then
    raise exception 'Only operations can create offers';
  end if;

  insert into application_offers (
    tenant_id, application_id, company_id, type,
    interest_rate, volume, term_months, monthly_payment, total_cost,
    conditions, valid_until, created_by
  ) values (
    v_application.tenant_id, p_application_id, v_application.company_id, p_type,
    p_interest_rate, p_volume, p_term_months, p_monthly_payment, p_total_cost,
    p_conditions, p_valid_until, auth.uid()
  ) returning id into v_offer_id;

  return v_offer_id;
end;
$$ language plpgsql security definer;

-- ============================================
-- link_marketing_session: Links anonymous session to user after signup
-- ============================================
create or replace function link_marketing_session(
  p_session_id uuid
)
returns void as $$
begin
  update marketing_sessions
  set user_id = auth.uid()
  where id = p_session_id and user_id is null;
end;
$$ language plpgsql security definer;
