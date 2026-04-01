-- Add applicant_email parameter to upsert_user_profile
-- Allows storing a separate contact email for applications (different from auth email)
create or replace function upsert_user_profile(
  p_first_name      text,
  p_last_name       text,
  p_phone           text default null,
  p_dob             text default null,
  p_street          text default null,
  p_zip             text default null,
  p_city            text default null,
  p_applicant_email text default null
) returns void language plpgsql security definer as $$
begin
  update users set
    first_name = p_first_name,
    last_name  = p_last_name,
    phone      = coalesce(nullif(p_phone, ''), phone),
    metadata   = coalesce(metadata, '{}'::jsonb) || jsonb_strip_nulls(jsonb_build_object(
      'date_of_birth',   nullif(p_dob, ''),
      'street',          nullif(p_street, ''),
      'zip',             nullif(p_zip, ''),
      'city',            nullif(p_city, ''),
      'applicant_email', nullif(p_applicant_email, '')
    )),
    updated_at = now()
  where id = auth.uid();
end;
$$;
