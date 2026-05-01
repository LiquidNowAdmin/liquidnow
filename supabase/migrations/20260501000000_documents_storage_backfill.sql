-- ============================================
-- Backfill: documents-Rows für bestehende Storage-Objects
-- ============================================
-- Vorbereitung für 20260501000001_documents_storage_tenant_isolation.sql.
-- Die neue SELECT-Policy verlangt eine documents-Row pro Storage-Object,
-- sonst sind bereits hochgeladene Files für niemanden mehr sichtbar.
--
-- Heuristik für die drei aktuell genutzten Pfad-Konventionen:
--  A) "{company_id}/{uuid}.{ext}"          → seg1 = UUID einer companies-Row
--  B) "{docType}/{application_id}/{file}"  → seg2 = UUID einer applications-Row
--  C) "bank-statements/{app_id}/{file}"    → Spezialfall von (B)
-- Files, die in keine Heuristik passen, werden übersprungen — sie wären
-- vorher zwar noch sichtbar gewesen, aber wir können sie keinem Tenant
-- zuordnen.

DO $$
DECLARE
  obj            record;
  seg1           text;
  seg2           text;
  filename       text;
  uuid_pat       constant text := '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
  v_company_id   uuid;
  v_tenant_id    uuid;
  v_user_id      uuid;
  v_app_user_id  uuid;
BEGIN
  FOR obj IN
    SELECT o.name, o.owner, o.metadata, o.created_at
    FROM storage.objects o
    WHERE o.bucket_id = 'documents'
      AND NOT EXISTS (
        SELECT 1 FROM public.documents d WHERE d.file_path = o.name
      )
  LOOP
    seg1 := split_part(obj.name, '/', 1);
    seg2 := split_part(obj.name, '/', 2);
    filename := regexp_replace(obj.name, '^.*/', '');

    IF seg1 ~* uuid_pat THEN
      -- Pattern A: company-prefixed
      SELECT id, tenant_id INTO v_company_id, v_tenant_id
      FROM public.companies WHERE id::text = seg1;
      IF FOUND THEN
        v_user_id := NULL;
        IF obj.owner IS NOT NULL
           AND EXISTS (SELECT 1 FROM public.users WHERE id = obj.owner) THEN
          v_user_id := obj.owner;
        ELSE
          SELECT user_id INTO v_user_id
          FROM public.company_members
          WHERE company_id = v_company_id LIMIT 1;
        END IF;
        IF v_user_id IS NOT NULL THEN
          INSERT INTO public.documents
            (tenant_id, company_id, uploaded_by, name, file_path,
             file_size, mime_type, created_at)
          VALUES (
            v_tenant_id, v_company_id, v_user_id, filename, obj.name,
            NULLIF(obj.metadata->>'size','')::int,
            obj.metadata->>'mimetype',
            obj.created_at
          );
        END IF;
      END IF;

    ELSIF seg2 ~* uuid_pat THEN
      -- Pattern B/C: docType-prefixed, 2. Segment ist application_id
      SELECT tenant_id, company_id, user_id
        INTO v_tenant_id, v_company_id, v_app_user_id
      FROM public.applications WHERE id::text = seg2;
      IF FOUND THEN
        v_user_id := NULL;
        IF obj.owner IS NOT NULL
           AND EXISTS (SELECT 1 FROM public.users WHERE id = obj.owner) THEN
          v_user_id := obj.owner;
        ELSE
          v_user_id := v_app_user_id;
        END IF;
        IF v_user_id IS NOT NULL THEN
          INSERT INTO public.documents
            (tenant_id, company_id, uploaded_by, name, doc_type, category,
             file_path, file_size, mime_type, created_at)
          VALUES (
            v_tenant_id, v_company_id, v_user_id, filename,
            seg1, seg1, obj.name,
            NULLIF(obj.metadata->>'size','')::int,
            obj.metadata->>'mimetype',
            obj.created_at
          );
        END IF;
      END IF;
    END IF;
  END LOOP;
END $$;
