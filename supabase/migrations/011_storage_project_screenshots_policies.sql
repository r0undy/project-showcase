-- Storage: project-screenshots bucket and access policies.
-- Run this via the Supabase dashboard SQL editor or CLI.

-- Create the bucket (public so screenshot images are accessible without auth)
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-screenshots', 'project-screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Public SELECT: anyone can read screenshot images
CREATE POLICY "Public read project screenshots"
ON storage.objects FOR SELECT
USING (bucket_id = 'project-screenshots');

-- Authenticated INSERT: signed-in users can upload their own screenshots
CREATE POLICY "Authenticated users can upload project screenshots"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'project-screenshots'
  AND auth.role() IN ('authenticated', 'anon')
);

-- Authenticated UPDATE: users can overwrite their own screenshots
CREATE POLICY "Authenticated users can update project screenshots"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'project-screenshots'
  AND auth.role() IN ('authenticated', 'anon')
);
