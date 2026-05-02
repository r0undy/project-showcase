-- Migration: Storage policies for avatar uploads
-- Requirements: 19.5

-- Ensure RLS is enabled on storage objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Public read access for avatars bucket
CREATE POLICY "Public read avatars"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars');

-- Authenticated users can upload avatars to their own object
CREATE POLICY "Users can upload their avatar"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid() = owner);

-- Authenticated users can update their own avatar object
CREATE POLICY "Users can update their avatar"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid() = owner)
  WITH CHECK (bucket_id = 'avatars' AND auth.uid() = owner);

-- Authenticated users can delete their own avatar object
CREATE POLICY "Users can delete their avatar"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid() = owner);
