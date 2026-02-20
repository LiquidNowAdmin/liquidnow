-- ============================================
-- Migration: Storage Bucket for Provider Logos
-- ============================================

-- Create public bucket for logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- Anyone can view logos (public bucket)
CREATE POLICY "Public read access for logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'logos');

-- Only operations users can upload/update/delete logos
CREATE POLICY "Operations can upload logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'logos'
  AND (SELECT role FROM public.users WHERE id = auth.uid()) = 'operations'
);

CREATE POLICY "Operations can update logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'logos'
  AND (SELECT role FROM public.users WHERE id = auth.uid()) = 'operations'
);

CREATE POLICY "Operations can delete logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'logos'
  AND (SELECT role FROM public.users WHERE id = auth.uid()) = 'operations'
);
