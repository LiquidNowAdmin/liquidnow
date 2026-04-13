-- Strict: only real entry points (Landing Page + Marktplatz)

create or replace function admin_get_funnel_routes(
  p_days integer default null,
  p_provider text default null
)
returns table (
  route text,
  session_count bigint
) as $$
begin
  if get_user_role() != 'operations' then
    raise exception 'Access denied: operations role required';
  end if;

  return query
  with base_sessions as (
    select s.id as session_id,
      case
        when s.landing_page in ('/', '') then '/'
        when s.landing_page in ('/plattform', '/plattform/') then '/plattform'
        else null
      end as normalized_page
    from marketing_sessions s
    where s.tenant_id = get_user_tenant_id()
      and (p_days is null or s.created_at >= now() - (p_days || ' days')::interval)
      and s.landing_page in ('/', '', '/plattform', '/plattform/')
  ),
  filtered as (
    select bs.session_id, bs.normalized_page
    from base_sessions bs
    where p_provider is null
       or exists (
         select 1 from marketing_events e
         where e.session_id = bs.session_id
           and e.event_type = 'cta_click'
           and e.properties->>'provider_name' = p_provider
       )
  )
  select
    f.normalized_page as route,
    count(*) as session_count
  from filtered f
  group by f.normalized_page
  order by session_count desc;
end;
$$ language plpgsql stable security definer;
