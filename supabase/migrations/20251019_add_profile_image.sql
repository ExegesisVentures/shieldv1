-- Add profile image support to public_users table
-- File: supabase/migrations/20251019_add_profile_image.sql

-- ============================================================================
-- Add profile_image_url column to public_users
-- ============================================================================
ALTER TABLE public.public_users 
ADD COLUMN IF NOT EXISTS profile_image_url text;

-- ============================================================================
-- Create Storage Bucket for Profile Pictures
-- ============================================================================
-- Note: This needs to be done via Supabase Dashboard or API
-- Bucket name: 'profile-pictures'
-- Public: false (users can only access their own images)
-- Allowed MIME types: image/jpeg, image/jpg, image/png, image/gif, image/webp
-- Max file size: 5MB

-- ============================================================================
-- Storage Policies
-- ============================================================================
-- These policies need to be created in Supabase Storage settings:
-- 
-- 1. INSERT policy: "Users can upload their own profile pictures"
--    SELECT: authenticated
--    INSERT: bucket_id = 'profile-pictures' AND (storage.foldername(name))[1] = auth.uid()::text
--
-- 2. SELECT policy: "Users can view their own profile pictures"
--    SELECT: authenticated
--    SELECT: bucket_id = 'profile-pictures' AND (storage.foldername(name))[1] = auth.uid()::text
--
-- 3. UPDATE policy: "Users can update their own profile pictures"
--    SELECT: authenticated
--    UPDATE: bucket_id = 'profile-pictures' AND (storage.foldername(name))[1] = auth.uid()::text
--
-- 4. DELETE policy: "Users can delete their own profile pictures"
--    SELECT: authenticated
--    DELETE: bucket_id = 'profile-pictures' AND (storage.foldername(name))[1] = auth.uid()::text

-- ============================================================================
-- RLS Policy: Allow users to update their own profile image URL
-- ============================================================================
-- This assumes you already have RLS enabled on public_users
-- Add a policy to allow users to update their profile_image_url

-- First, check if update policy exists for public_users
DO $$
BEGIN
  -- Allow users to update their own public_users record (including profile_image_url)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'public_users' 
    AND policyname = 'Users can update their own profile'
  ) THEN
    -- Create policy using the get_public_user_id() function
    EXECUTE 'CREATE POLICY "Users can update their own profile"
      ON public.public_users
      FOR UPDATE
      TO authenticated
      USING (id = get_public_user_id())
      WITH CHECK (id = get_public_user_id())';
  END IF;
END $$;

-- ============================================================================
-- Comments
-- ============================================================================
COMMENT ON COLUMN public.public_users.profile_image_url IS 
  'URL to user profile picture stored in Supabase Storage (profile-pictures bucket)';

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After running this migration:
-- 1. Go to Supabase Dashboard > Storage
-- 2. Create a new bucket called 'profile-pictures'
-- 3. Set it to private (not public)
-- 4. Add the storage policies listed above
-- 5. Test by uploading a profile picture from the settings page

