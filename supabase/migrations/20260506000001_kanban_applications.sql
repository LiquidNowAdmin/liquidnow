-- Kanban-RPC für Bank-Anträge (applications-Pipeline)
-- 1 Karte = 1 application; Spalten = applications.status direkt.
-- Pendant zu admin_get_kanban_inquiries() (v5), aber ohne Aggregation.

create or replace function admin_get_kanban_applications()
returns table (
  application_id  uuid,
  status          text,
  inquiry_id      uuid,
  user_id         uuid,
  user_email      text,
  user_name       text,
  company_name    text,
  provider_name   text,
  product_name    text,
  volume          integer,
  term_months     integer,
  external_ref    text,
  external_url    text,
  created_at      timestamptz,
  updated_at      timestamptz
) as $$
begin
  if get_user_role() != 'operations' then
    raise exception 'Access denied: operations role required';
  end if;

  return query
  select
    a.id,
    a.status,
    a.inquiry_id,
    i.user_id,
    u.email::text as user_email,
    coalesce(
      nullif(trim(coalesce(u.first_name, '') || ' ' || coalesce(u.last_name, '')), ''),
      u.email
    )::text as user_name,
    c.name::text as company_name,
    a.provider_name::text,
    a.product_name::text,
    a.volume,
    a.term_months,
    nullif(a.metadata->>'external_ref', '')::text as external_ref,
    nullif(a.metadata->>'external_url', '')::text as external_url,
    a.created_at,
    a.updated_at
  from applications a
  join inquiries i on i.id = a.inquiry_id
  join users u     on u.id = i.user_id
  left join companies c on c.id = i.company_id
  order by a.updated_at desc;
end;
$$ language plpgsql security definer;

grant execute on function admin_get_kanban_applications() to authenticated;
