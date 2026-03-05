-- Returns the default tenant ID (liqinow) for anonymous funnel tracking
CREATE OR REPLACE FUNCTION get_default_tenant_id()
RETURNS uuid LANGUAGE sql SECURITY DEFINER AS $$
  SELECT id FROM tenants WHERE slug = 'liqinow' LIMIT 1;
$$;

-- Upsert user profile fields into the users table
CREATE OR REPLACE FUNCTION upsert_user_profile(
  p_first_name text,
  p_last_name  text,
  p_phone      text DEFAULT NULL,
  p_dob        text DEFAULT NULL,
  p_street     text DEFAULT NULL,
  p_zip        text DEFAULT NULL,
  p_city       text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE users SET
    first_name = p_first_name,
    last_name  = p_last_name,
    phone      = COALESCE(NULLIF(p_phone, ''), phone),
    metadata   = COALESCE(metadata, '{}'::jsonb) || jsonb_strip_nulls(jsonb_build_object(
      'date_of_birth', NULLIF(p_dob, ''),
      'street',        NULLIF(p_street, ''),
      'zip',           NULLIF(p_zip, ''),
      'city',          NULLIF(p_city, '')
    )),
    updated_at = now()
  WHERE id = auth.uid();
END;
$$;

-- Get the user's existing company or create a new one; returns company_id
CREATE OR REPLACE FUNCTION get_or_create_company(
  p_name            text,
  p_hrb             text    DEFAULT NULL,
  p_ust_id          text    DEFAULT NULL,
  p_website         text    DEFAULT NULL,
  p_street          text    DEFAULT NULL,
  p_zip             text    DEFAULT NULL,
  p_city            text    DEFAULT NULL,
  p_monthly_revenue numeric DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_company_id uuid;
  v_tenant_id  uuid := get_user_tenant_id();
BEGIN
  -- Check if user already has a company in this tenant
  SELECT cm.company_id INTO v_company_id
  FROM company_members cm
  WHERE cm.user_id = auth.uid() AND cm.tenant_id = v_tenant_id
  LIMIT 1;

  IF v_company_id IS NULL THEN
    INSERT INTO companies (tenant_id, name, hrb, ust_id, website, address, annual_revenue)
    VALUES (
      v_tenant_id,
      p_name,
      NULLIF(p_hrb, ''),
      NULLIF(p_ust_id, ''),
      NULLIF(p_website, ''),
      jsonb_strip_nulls(jsonb_build_object(
        'street', NULLIF(p_street, ''),
        'zip',    NULLIF(p_zip, ''),
        'city',   NULLIF(p_city, '')
      )),
      CASE WHEN p_monthly_revenue IS NOT NULL THEN p_monthly_revenue * 12 ELSE NULL END
    )
    RETURNING id INTO v_company_id;

    INSERT INTO company_members (tenant_id, company_id, user_id, role)
    VALUES (v_tenant_id, v_company_id, auth.uid(), 'owner');
  ELSE
    UPDATE companies SET
      name           = COALESCE(NULLIF(p_name, ''), name),
      hrb            = COALESCE(NULLIF(p_hrb, ''), hrb),
      ust_id         = COALESCE(NULLIF(p_ust_id, ''), ust_id),
      website        = COALESCE(NULLIF(p_website, ''), website),
      address        = COALESCE(
        NULLIF(jsonb_strip_nulls(jsonb_build_object(
          'street', NULLIF(p_street, ''),
          'zip',    NULLIF(p_zip, ''),
          'city',   NULLIF(p_city, '')
        )), '{}'::jsonb),
        address
      ),
      annual_revenue = COALESCE(
        CASE WHEN p_monthly_revenue IS NOT NULL THEN p_monthly_revenue * 12 END,
        annual_revenue
      ),
      updated_at = now()
    WHERE id = v_company_id AND tenant_id = v_tenant_id;
  END IF;

  RETURN v_company_id;
END;
$$;
