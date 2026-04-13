-- Kanban v2: one card per user, enriched with company + best inquiry + applications

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
  select
    -- Derive kanban status from best application status
    case
      when app_agg.best_status = 'closed'   then 'closed'
      when app_agg.best_status = 'signed'   then 'offer'
      when app_agg.best_status = 'inquired' then 'submitted'
      when app_agg.total > 0 and app_agg.all_rejected then 'rejected'
      when app_agg.total > 0                then 'submitted'
      when inq.id is not null               then 'inquiry_created'
      else 'account_created'
    end as kanban_status,
    inq.id as inquiry_id,
    u.id as user_id,
    u.email as user_email,
    trim(coalesce(u.first_name, '') || ' ' || coalesce(u.last_name, '')) as user_name,
    coalesce(inq.company_name, c.name) as company_name,
    inq.volume,
    inq.term_months,
    inq.purpose,
    coalesce(app_agg.providers, '{}'::text[]) as provider_names,
    coalesce(app_agg.total, 0)::integer as application_count,
    coalesce(inq.created_at, u.created_at) as created_at
  from users u
  -- Join company via company_members (user may have a company even without inquiry)
  left join lateral (
    select c2.name
    from company_members cm
    join companies c2 on c2.id = cm.company_id
    where cm.user_id = u.id and c2.deleted_at is null
    order by cm.created_at desc
    limit 1
  ) c on true
  -- Join the most recent inquiry
  left join lateral (
    select i.id, i.company_name, i.volume, i.term_months, i.purpose, i.created_at
    from inquiries i
    where i.user_id = u.id
    order by i.created_at desc
    limit 1
  ) inq on true
  -- Aggregate applications for that inquiry
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
    where a.inquiry_id = inq.id
  ) app_agg on inq.id is not null
  where u.tenant_id = get_user_tenant_id()
    and u.role = 'lead'
  order by coalesce(inq.created_at, u.created_at) desc;
end;
$$ language plpgsql stable security definer;
