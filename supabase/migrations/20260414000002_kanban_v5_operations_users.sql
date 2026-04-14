-- Kanban v5: include operations users + offer_received/offer_accepted status mapping

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
    case
      when agg.best_status = 'closed'          then 'closed'
      when agg.best_status = 'signed'          then 'closed'
      when agg.best_status = 'offer_accepted'  then 'offer'
      when agg.best_status = 'offer_received'  then 'offer'
      when agg.best_status = 'inquired'        then 'submitted'
      when agg.app_total > 0 and agg.all_rejected then 'rejected'
      when agg.app_total > 0            then 'submitted'
      when agg.inq_count > 0            then 'inquiry_created'
      else 'account_created'
    end as kanban_status,
    agg.latest_inquiry_id as inquiry_id,
    u.id as user_id,
    u.email as user_email,
    trim(coalesce(u.first_name, '') || ' ' || coalesce(u.last_name, '')) as user_name,
    coalesce(agg.latest_company_name, c.name) as company_name,
    agg.latest_volume as volume,
    agg.latest_term as term_months,
    agg.latest_purpose as purpose,
    coalesce(agg.providers, '{}'::text[]) as provider_names,
    coalesce(agg.app_total, 0)::integer as application_count,
    coalesce(agg.first_inquiry_at, u.created_at) as created_at
  from users u
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
      count(distinct i.id)::integer as inq_count,
      (array_agg(i.id order by i.created_at desc))[1] as latest_inquiry_id,
      (array_agg(i.company_name order by i.created_at desc))[1] as latest_company_name,
      (array_agg(i.volume order by i.created_at desc))[1] as latest_volume,
      (array_agg(i.term_months order by i.created_at desc))[1] as latest_term,
      (array_agg(i.purpose order by i.created_at desc))[1] as latest_purpose,
      min(i.created_at) as first_inquiry_at,
      count(a.id)::integer as app_total,
      array_agg(distinct a.provider_name) filter (where a.provider_name is not null) as providers,
      bool_and(a.status = 'rejected') filter (where a.id is not null) as all_rejected,
      case
        when bool_or(a.status = 'closed') then 'closed'
        when bool_or(a.status = 'signed') then 'signed'
        when bool_or(a.status = 'offer_accepted') then 'offer_accepted'
        when bool_or(a.status = 'offer_received') then 'offer_received'
        when bool_or(a.status = 'inquired') then 'inquired'
        when count(a.id) > 0 then 'new'
        else null
      end as best_status
    from inquiries i
    left join applications a on a.inquiry_id = i.id
    where i.user_id = u.id
  ) agg on true
  where u.tenant_id = get_user_tenant_id()
    and u.role in ('lead', 'operations')
  order by coalesce(agg.first_inquiry_at, u.created_at) desc;
end;
$$ language plpgsql stable security definer;
