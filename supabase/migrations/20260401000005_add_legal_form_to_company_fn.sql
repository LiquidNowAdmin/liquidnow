-- Add legal_form parameter to get_or_create_company
create or replace function get_or_create_company(
  p_name            text,
  p_hrb             text    default null,
  p_ust_id          text    default null,
  p_website         text    default null,
  p_street          text    default null,
  p_zip             text    default null,
  p_city            text    default null,
  p_monthly_revenue numeric default null,
  p_crefo           text    default null,
  p_legal_form      text    default null
) returns uuid language plpgsql security definer as $$
declare
  v_company_id uuid;
  v_tenant_id  uuid := get_user_tenant_id();
begin
  select cm.company_id into v_company_id
  from company_members cm
  where cm.user_id = auth.uid() and cm.tenant_id = v_tenant_id
  limit 1;

  if v_company_id is null then
    insert into companies (tenant_id, name, legal_form, hrb, ust_id, crefo, website, address, annual_revenue)
    values (
      v_tenant_id,
      p_name,
      nullif(p_legal_form, ''),
      nullif(p_hrb, ''),
      nullif(p_ust_id, ''),
      nullif(p_crefo, ''),
      nullif(p_website, ''),
      jsonb_strip_nulls(jsonb_build_object(
        'street', nullif(p_street, ''),
        'zip',    nullif(p_zip, ''),
        'city',   nullif(p_city, '')
      )),
      case when p_monthly_revenue is not null then p_monthly_revenue * 12 else null end
    )
    returning id into v_company_id;

    insert into company_members (tenant_id, company_id, user_id, role)
    values (v_tenant_id, v_company_id, auth.uid(), 'owner');
  else
    update companies set
      name           = coalesce(nullif(p_name, ''), name),
      legal_form     = coalesce(nullif(p_legal_form, ''), legal_form),
      hrb            = coalesce(nullif(p_hrb, ''), hrb),
      ust_id         = coalesce(nullif(p_ust_id, ''), ust_id),
      crefo          = coalesce(nullif(p_crefo, ''), crefo),
      website        = coalesce(nullif(p_website, ''), website),
      address        = coalesce(
        nullif(jsonb_strip_nulls(jsonb_build_object(
          'street', nullif(p_street, ''),
          'zip',    nullif(p_zip, ''),
          'city',   nullif(p_city, '')
        )), '{}'::jsonb),
        address
      ),
      annual_revenue = coalesce(
        case when p_monthly_revenue is not null then p_monthly_revenue * 12 end,
        annual_revenue
      ),
      updated_at = now()
    where id = v_company_id and tenant_id = v_tenant_id;
  end if;

  return v_company_id;
end;
$$;
