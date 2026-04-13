-- Funnel waterfall with two bars per stage: one per entry route

drop function if exists admin_get_funnel_waterfall(integer, text);

create or replace function admin_get_funnel_waterfall(
  p_days integer default null,
  p_provider text default null
)
returns table (
  stage text,
  stage_order integer,
  session_count bigint,
  route text
) as $$
begin
  if get_user_role() != 'operations' then
    raise exception 'Access denied: operations role required';
  end if;

  return query
  with sessions_in_range as (
    select distinct s.id as session_id,
      case
        when s.landing_page in ('/', '') then '/'
        when s.landing_page in ('/plattform', '/plattform/') then '/plattform'
        else null
      end as entry_route
    from marketing_sessions s
    where s.tenant_id = get_user_tenant_id()
      and (p_days is null or s.created_at >= now() - (p_days || ' days')::interval)
  ),
  provider_sessions as (
    select sr.session_id, sr.entry_route
    from sessions_in_range sr
    where p_provider is null
       or exists (
         select 1 from marketing_events e
         where e.session_id = sr.session_id
           and e.event_type = 'cta_click'
           and e.properties->>'provider_name' = p_provider
       )
  ),
  events as (
    select
      e.session_id,
      ps.entry_route,
      e.event_type,
      e.properties->>'step' as step_name
    from marketing_events e
    join provider_sessions ps on ps.session_id = e.session_id
  ),
  per_session as (
    select
      session_id,
      entry_route,
      bool_or(event_type = 'page_view') as hit_page_view,
      bool_or(event_type = 'cta_click') as hit_cta_click,
      bool_or(event_type = 'signup_start') as hit_signup_start,
      bool_or(event_type = 'signup_completed') as hit_signup_completed,
      bool_or(event_type = 'funnel_step' and step_name = 'anfrage') as hit_anfrage,
      bool_or(event_type = 'funnel_step' and step_name = 'umsatz') as hit_umsatz,
      bool_or(event_type = 'funnel_step' and step_name = 'unternehmen') as hit_unternehmen,
      bool_or(event_type = 'funnel_step' and step_name = 'persoenliche_daten') as hit_persoenliche_daten,
      bool_or(event_type = 'funnel_submit'
              or (event_type = 'funnel_step' and step_name = 'submit')) as hit_submit
    from events
    group by session_id, entry_route
  )
  select s.stage, s.stage_order, count(*) as session_count, coalesce(p.entry_route, 'other') as route
  from per_session p,
  lateral (values
    ('Seitenaufruf',        0, p.hit_page_view),
    ('Antrag starten',      1, p.hit_cta_click),
    ('Signup gestartet',    2, p.hit_signup_start),
    ('Signup abgeschlossen',3, p.hit_signup_completed),
    ('Anfrage',             4, p.hit_anfrage),
    ('Umsatz',              5, p.hit_umsatz),
    ('Unternehmen',         6, p.hit_unternehmen),
    ('Persönliche Daten',   7, p.hit_persoenliche_daten),
    ('Abgesendet',          8, p.hit_submit)
  ) as s(stage, stage_order, reached)
  where s.reached = true
  group by s.stage, s.stage_order, p.entry_route
  order by s.stage_order, p.entry_route;
end;
$$ language plpgsql stable security definer;
