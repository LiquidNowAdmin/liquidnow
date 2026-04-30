-- Fix: COALESCE types jsonb and text cannot be matched
-- Google-OAuth-Signups liefern raw_user_meta_data ohne 'metadata'-Key.
-- Dadurch greift der COALESCE-Fallback `'{}'` (text) gegen `->'metadata'` (jsonb)
-- → Trigger crashed → "Database error saving new user" beim Login.
--
-- Fix: '{}'::jsonb explizit casten. Außerdem first_name/last_name aus
-- den Google-OAuth-Standardfeldern (`given_name`/`family_name`/`name`) ableiten,
-- falls keine first_name/last_name im meta_data steht.

create or replace function handle_new_auth_user()
returns trigger as $$
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
  select id into default_tenant_id from tenants where slug = 'liqinow';

  if default_tenant_id is null then
    raise exception 'Default tenant "liqinow" not found — cannot create user';
  end if;

  if new.email = any(admin_emails) then
    user_role := 'operations';
  else
    user_role := coalesce(new.raw_user_meta_data->>'role', 'lead');
  end if;

  -- Names: prefer explicit first_name/last_name, then Google-OAuth standard fields,
  -- then split full name on the first space.
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
$$ language plpgsql security definer;
