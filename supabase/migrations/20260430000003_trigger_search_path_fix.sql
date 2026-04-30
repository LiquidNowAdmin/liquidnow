-- Fix: handle_new_auth_user is SECURITY DEFINER but has no explicit search_path.
-- When called from gotrue (supabase_auth_admin role), supabase_auth_admin's
-- search_path does NOT include `public`, so the unqualified `tenants` reference
-- raises "relation does not exist" → "Database error saving new user".
--
-- Fix: pin search_path on the function AND fully qualify all table refs.

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  default_tenant_id uuid;
  admin_emails text[] := array[
    'ta@liqinow.de',
    'sm@liqinow.de',
    'ka@liqinow.de',
    'admin@liqinow.de'
  ];
  user_role text;
  derived_first text;
  derived_last  text;
  full_name     text;
begin
  select id into default_tenant_id from public.tenants where slug = 'liqinow';

  if default_tenant_id is null then
    raise exception 'Default tenant "liqinow" not found — cannot create user';
  end if;

  if new.email = any(admin_emails) then
    user_role := 'operations';
  else
    user_role := coalesce(new.raw_user_meta_data->>'role', 'lead');
  end if;

  derived_first := coalesce(
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'given_name'
  );
  derived_last := coalesce(
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'family_name'
  );
  full_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name'
  );
  if derived_first is null and full_name is not null then
    derived_first := split_part(full_name, ' ', 1);
  end if;
  if derived_last is null and full_name is not null and position(' ' in full_name) > 0 then
    derived_last := substring(full_name from position(' ' in full_name) + 1);
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
    derived_first,
    derived_last,
    coalesce(new.raw_user_meta_data->'metadata', '{}'::jsonb)
  );

  return new;
end;
$$;
