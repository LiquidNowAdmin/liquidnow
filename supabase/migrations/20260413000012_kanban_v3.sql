-- Kanban v3: one card per inquiry + users-without-inquiry
-- Fixes: shows ALL inquiries, not just the latest per user

create or replace function admin_get_kanban_inquiries()
returns table (
  kanban_status text,
  inquiry_id uuid,
  user_id uuid,
  user_email text,
  user_name text,
  company_name text,
  volume integer,
  term_months integer,
  purpose text,
  provider_names text[],
  application_count integer,
  created_at timestamptz
) as $$
begin
  if get_user_role() != 'operations' then
    raise exception 'Access denied: operations role required';
  end if;

  return query

  -- Users with no inquiry = "account_created"
  select
    'account_created'::text as kanban_status,
    null::uuid as inquiry_id,
    u.id as user_id,
    u.email as user_email,
    trim(coalesce(u.first_name, '') || ' ' || coalesce(u.last_name, '')) as user_name,
    c.name as company_name,
    null::integer as volume,
    null::integer as term_months,
    null::text as purpose,
    '{}'::text[] as provider_names,
    0 as application_count,
    u.created_at
  from users u
  left join lateral (
    select c2.name
    from company_members cm
    join companies c2 on c2.id = cm.company_id
    where cm.user_id = u.id and c2.deleted_at is null
    order by cm.created_at desc
    limit 1
  ) c on true
  where u.tenant_id = get_user_tenant_id()
    and u.role = 'lead'
    and not exists (select 1 from inquiries i where i.user_id = u.id)

  union all

  -- One card per inquiry, enriched with user + company + application aggregate
  select
    case
      when app_agg.best_status = 'closed'   then 'closed'
      when app_agg.best_status = 'signed'   then 'offer'
      when app_agg.best_status = 'inquired' then 'submitted'
      when app_agg.total > 0 and app_agg.all_rejected then 'rejected'
      when app_agg.total > 0                then 'submitted'
      else 'inquiry_created'
    end as kanban_status,
    i.id as inquiry_id,
    u.id as user_id,
    u.email as user_email,
    trim(coalesce(u.first_name, '') || ' ' || coalesce(u.last_name, '')) as user_name,
    coalesce(i.company_name, c.name) as company_name,
    i.volume,
    i.term_months,
    i.purpose,
    coalesce(app_agg.providers, '{}'::text[]) as provider_names,
    coalesce(app_agg.total, 0)::integer as application_count,
    i.created_at
  from inquiries i
  join users u on u.id = i.user_id
  left join lateral (
    select c2.name
    from company_members cm
    join companies c2 on c2.id = cm.company_id
    where cm.user_id = u.id and c2.deleted_at is null
    order by cm.created_at desc
    limit 1
  ) c on true
  left join lateral (
    select
      count(*)::integer as total,
      array_agg(distinct a.provider_name) filter (where a.provider_name is not null) as providers,
      bool_and(a.status = 'rejected') as all_rejected,
      case
        when bool_or(a.status = 'closed') then 'closed'
        when bool_or(a.status = 'signed') then 'signed'
        when bool_or(a.status = 'inquired') then 'inquired'
        else 'new'
      end as best_status
    from applications a
    where a.inquiry_id = i.id
  ) app_agg on true
  where i.tenant_id = get_user_tenant_id()

  order by created_at desc;
end;
$$ language plpgsql stable security definer;
