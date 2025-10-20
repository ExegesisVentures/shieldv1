-- Auto-create user profile on signup via Supabase webhook alternative
-- Since we can't create triggers on auth.users directly (permission denied),
-- we'll use Supabase's built-in auth webhook functionality or Database Webhooks
-- File: supabase/migrations/20251016_create_auto_user_profile_trigger.sql

-- ============================================================================
-- IMPORTANT: This migration uses Supabase's authentication hooks system
-- You MUST configure this in the Supabase Dashboard after running this SQL
-- ============================================================================

-- ============================================================================
-- FUNCTION: Auto-create public user profile and mapping
-- ============================================================================
-- This function will be called by Supabase's auth hooks system
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_public_user_id uuid;
BEGIN
  -- Create public_users record
  INSERT INTO public.public_users (id, email, created_at, updated_at)
  VALUES (gen_random_uuid(), NEW.email, NOW(), NOW())
  RETURNING id INTO new_public_user_id;

  -- Create user_profiles mapping
  INSERT INTO public.user_profiles (auth_user_id, public_user_id, created_at)
  VALUES (NEW.id, new_public_user_id, NOW());

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail
    RAISE WARNING 'Failed to create user profile for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ALTERNATIVE: Manual function for server-side use
-- ============================================================================
-- This function can be called from your application code after signup
CREATE OR REPLACE FUNCTION public.create_user_profile_for_auth_user(auth_user_id uuid, user_email text)
RETURNS uuid AS $$
DECLARE
  new_public_user_id uuid;
  existing_public_user_id uuid;
BEGIN
  -- Check if mapping already exists
  SELECT public_user_id INTO existing_public_user_id
  FROM public.user_profiles
  WHERE auth_user_id = $1;

  IF existing_public_user_id IS NOT NULL THEN
    RETURN existing_public_user_id;
  END IF;

  -- Create public_users record
  INSERT INTO public.public_users (id, email, created_at, updated_at)
  VALUES (gen_random_uuid(), user_email, NOW(), NOW())
  RETURNING id INTO new_public_user_id;

  -- Create user_profiles mapping
  INSERT INTO public.user_profiles (auth_user_id, public_user_id, created_at)
  VALUES ($1, new_public_user_id, NOW());

  RETURN new_public_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Note: Since we can't add triggers to auth.users, this function should be
-- called from your application code in app/actions.ts after signup
-- ============================================================================

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================
-- Allow authenticated and anon users to read public_users (needed for profile lookups)
GRANT SELECT ON public.public_users TO authenticated, anon;
GRANT SELECT ON public.user_profiles TO authenticated, anon;

-- Grant execute permission on the function to service_role (used by app/actions.ts)
GRANT EXECUTE ON FUNCTION public.create_user_profile_for_auth_user(uuid, text) TO service_role;

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
-- Run this to verify the trigger is working:
-- 
-- 1. Sign up a new user
-- 2. Run this query:
--
-- SELECT 
--   au.id as auth_user_id,
--   au.email,
--   up.public_user_id,
--   pu.id as public_users_id,
--   pu.created_at
-- FROM auth.users au
-- LEFT JOIN public.user_profiles up ON au.id = up.auth_user_id
-- LEFT JOIN public.public_users pu ON up.public_user_id = pu.id
-- WHERE au.email = 'test@example.com';
--
-- Expected: All three records should exist (auth.users, user_profiles, public_users)

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON FUNCTION public.create_user_profile_for_auth_user(uuid, text) IS 
  'Creates public_users record and user_profiles mapping for a new auth user. Called from app code after signup. Idempotent.';


