-- Update funnel waterfall: add signup_start + signup_completed stages

create or replace function admin_get_funnel_waterfall(
  p_days integer default 30
)
returns table (
  stage text,
  stage_order integer,
  session_count bigint
) as $$
begin
  if get_user_role() != 'operations' then
    raise exception 'Access denied: operations role required';
  end if;

  return query
  with sessions_in_range as (
    select distinct s.id as session_id
    from marketing_sessions s
    where s.tenant_id = get_user_tenant_id()
      and s.created_at >= now() - (p_days || ' days')::interval
  ),
  events as (
    select
      e.session_id,
      e.event_type,
      e.properties->>'step' as step_name
    from marketing_events e
    join sessions_in_range sr on sr.session_id = e.session_id
  ),
  per_session as (
    select
      session_id,
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
    group by session_id
  )
  select s.stage, s.stage_order, count(*) as session_count
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
  group by s.stage, s.stage_order
  order by s.stage_order;
end;
$$ language plpgsql stable security definer;
