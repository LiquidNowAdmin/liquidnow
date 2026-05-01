-- ============================================
-- Security fix: Tenant-Isolation für documents-Bucket
-- ============================================
-- Vorher: jeder authenticated User konnte Files JEDES Tenants im
-- documents-Bucket lesen/löschen/hochladen — die documents-Tabelle hatte
-- zwar tenant_id-RLS, der Storage-Layer hat das aber komplett umgangen.
--
-- Strategie: Storage-Policies an die documents-Tabelle koppeln. Eine
-- Storage-Row ist nur sichtbar/löschbar, wenn eine documents-Row mit
-- passendem file_path UND zum User passendem tenant_id/company_id
-- existiert. Für INSERT (Upload) wird auf company_members geprüft —
-- die documents-Row entsteht erst nach erfolgreichem Upload, daher
-- müssen wir hier auf Mitgliedschaft prüfen und uns auf die documents-
-- Insert-RLS verlassen, die direkt im Anschluss greift.

DROP POLICY IF EXISTS "Lead can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Lead can read own documents"   ON storage.objects;
DROP POLICY IF EXISTS "Lead can delete own documents" ON storage.objects;

-- ----- SELECT -----
-- Operations: jede Datei ihres Tenants
-- Lead: nur Dateien ihrer Companies
CREATE POLICY "documents_bucket_select"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents'
  AND (
    EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.file_path = storage.objects.name
        AND d.tenant_id = public.get_user_tenant_id()
        AND public.get_user_role() = 'operations'
    )
    OR EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.file_path = storage.objects.name
        AND d.company_id IN (SELECT public.get_user_company_ids())
    )
  )
);

-- ----- INSERT -----
-- Authentifizierte User mit mindestens einer Company-Mitgliedschaft.
-- Tenant-Isolation greift beim nachgelagerten documents-Insert
-- (siehe "Lead can upload documents to own companies" in
-- 20250213000007_rls_policies.sql) — eine ohne documents-Row liegende
-- Storage-Datei ist durch die SELECT-Policy oben anschließend für
-- niemanden mehr sichtbar.
CREATE POLICY "documents_bucket_insert"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents'
  AND auth.uid() IS NOT NULL
  AND (
    public.get_user_role() = 'operations'
    OR EXISTS (
      SELECT 1 FROM public.company_members cm
      WHERE cm.user_id = auth.uid()
    )
  )
);

-- ----- UPDATE -----
-- Selbe Logik wie SELECT (für upsert-Flows).
CREATE POLICY "documents_bucket_update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'documents'
  AND (
    EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.file_path = storage.objects.name
        AND d.tenant_id = public.get_user_tenant_id()
        AND public.get_user_role() = 'operations'
    )
    OR EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.file_path = storage.objects.name
        AND d.company_id IN (SELECT public.get_user_company_ids())
    )
  )
);

-- ----- DELETE -----
CREATE POLICY "documents_bucket_delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents'
  AND (
    EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.file_path = storage.objects.name
        AND d.tenant_id = public.get_user_tenant_id()
        AND public.get_user_role() = 'operations'
    )
    OR EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.file_path = storage.objects.name
        AND d.company_id IN (SELECT public.get_user_company_ids())
    )
  )
);
