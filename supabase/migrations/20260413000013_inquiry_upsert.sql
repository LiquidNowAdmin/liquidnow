-- Make create_inquiry idempotent: reuse existing inquiry for same user+company+volume+term+purpose

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
  v_tenant_id := get_user_tenant_id();
  if v_tenant_id is null then
    raise exception 'User not authenticated or no tenant';
  end if;

  if not exists (
    select 1 from company_members
    where company_id = p_company_id and user_id = auth.uid()
  ) and get_user_role() != 'operations' then
    raise exception 'No access to this company';
  end if;

  -- Reuse existing inquiry if same user+company+volume+term+purpose
  select id into v_inquiry_id
  from inquiries
  where user_id = auth.uid()
    and company_id = p_company_id
    and volume = p_volume
    and term_months is not distinct from p_term_months
    and purpose is not distinct from p_purpose
  order by created_at desc
  limit 1;

  if v_inquiry_id is not null then
    return v_inquiry_id;
  end if;

  select name into v_company_name from companies where id = p_company_id;

  insert into inquiries (tenant_id, company_id, user_id, company_name, volume, term_months, purpose, metadata)
  values (v_tenant_id, p_company_id, auth.uid(), v_company_name, p_volume, p_term_months, p_purpose, p_metadata)
  returning id into v_inquiry_id;

  return v_inquiry_id;
end;
$$ language plpgsql security definer;
