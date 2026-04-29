-- Admin email allowlist: these emails get operations role automatically on signup
create or replace function handle_new_auth_user()
returns trigger as $$
declare
  default_tenant_id uuid;
  admin_emails text[] := array[
    'ta@liqinow.de',
    'sm@liqinow.de',
    'ka@liqinow.de',
    'jonsvoelker@gmail.com'
  ];
  user_role text;
begin
  select id into default_tenant_id from tenants where slug = 'liqinow';

  -- Auto-assign operations role for admin emails
  if new.email = any(admin_emails) then
    user_role := 'operations';
  else
    user_role := coalesce(new.raw_user_meta_data->>'role', 'lead');
  end if;

  insert into public.users (id, tenant_id, email, role, first_name, last_name, metadata)
  values (
    new.id,
    coalesce(
      (new.raw_user_meta_data->>'tenant_id')::uuid,
      default_tenant_id
    ),
    new.email,
    user_role,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    coalesce(new.raw_user_meta_data->'metadata', '{}')
  );

  return new;
end;
$$ language plpgsql security definer;

-- Also upgrade existing users if they're already in the table
update public.users
  set role = 'operations'
  where email in ('ta@liqinow.de', 'sm@liqinow.de', 'ka@liqinow.de')
    and role != 'operations';
