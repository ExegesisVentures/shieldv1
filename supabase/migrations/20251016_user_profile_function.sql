-- User Profile Auto-Creation Function
-- This creates a database function that can be called from application code
-- to create user profiles after signup
-- File: supabase/migrations/20251016_user_profile_function.sql

-- ============================================================================
-- FUNCTION: Create user profile for authenticated user
-- ============================================================================
-- This function can be called from your application code after signup
-- It's idempotent - safe to call multiple times
CREATE OR REPLACE FUNCTION public.create_user_profile_for_auth_user(
  auth_user_id uuid, 
  user_email text
)
RETURNS uuid AS $$
DECLARE
  new_public_user_id uuid;
  existing_public_user_id uuid;
BEGIN
  -- Check if mapping already exists (idempotent)
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
-- GRANT PERMISSIONS
-- ============================================================================
-- Grant execute permission to service_role (used by app/actions.ts)
GRANT EXECUTE ON FUNCTION public.create_user_profile_for_auth_user(uuid, text) TO service_role;

-- Allow authenticated and anon users to read public_users (needed for profile lookups)
GRANT SELECT ON public.public_users TO authenticated, anon;
GRANT SELECT ON public.user_profiles TO authenticated, anon;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON FUNCTION public.create_user_profile_for_auth_user(uuid, text) IS 
  'Creates public_users record and user_profiles mapping for a new auth user. Idempotent - safe to call multiple times.';

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
-- After running this migration, verify the function exists:
-- 
-- SELECT routine_name, routine_type
-- FROM information_schema.routines
-- WHERE routine_name = 'create_user_profile_for_auth_user'
--   AND routine_schema = 'public';
--
-- Expected: Should return 1 row

-- ============================================================================
-- USAGE
-- ============================================================================
-- This function is called from app/actions.ts in signUpAction and signInAction
-- Example:
-- 
-- const { data } = await supabase.rpc('create_user_profile_for_auth_user', {
--   auth_user_id: user.id,
--   user_email: user.email
-- });

