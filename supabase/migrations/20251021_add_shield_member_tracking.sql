-- Add Shield Member Access Tracking to user_profiles
-- File: supabase/migrations/20251021_add_shield_member_tracking.sql

-- ============================================================================
-- Add Shield Member columns to user_profiles table
-- ============================================================================
-- These columns track whether a user has Shield member (Private) access
-- Requirements: PMA signed AND Shield NFT ownership

ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS has_signed_pma boolean DEFAULT false;

ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS has_shield_nft boolean DEFAULT false;

ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS pma_signed_at timestamptz;

-- ============================================================================
-- Add indexes for performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_user_profiles_has_signed_pma 
ON public.user_profiles(has_signed_pma) WHERE has_signed_pma = true;

CREATE INDEX IF NOT EXISTS idx_user_profiles_has_shield_nft 
ON public.user_profiles(has_shield_nft) WHERE has_shield_nft = true;

-- ============================================================================
-- Add comments
-- ============================================================================
COMMENT ON COLUMN public.user_profiles.has_signed_pma IS 
  'Whether user has signed the Private Membership Agreement (PMA)';

COMMENT ON COLUMN public.user_profiles.has_shield_nft IS 
  'Whether user owns a Shield NFT (required for Private member access)';

COMMENT ON COLUMN public.user_profiles.pma_signed_at IS 
  'Timestamp when user signed the PMA';

-- ============================================================================
-- RLS Policies
-- ============================================================================
-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "Users can read own shield access" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own shield access" ON public.user_profiles;

-- Allow users to read their own Shield access status
CREATE POLICY "Users can read own shield access"
  ON public.user_profiles
  FOR SELECT
  USING (
    auth.uid() = auth_user_id
  );

-- Allow authenticated users to update their own Shield access status
-- (when they sign PMA or receive Shield NFT)
CREATE POLICY "Users can update own shield access"
  ON public.user_profiles
  FOR UPDATE
  USING (
    auth.uid() = auth_user_id
  );

-- ============================================================================
-- Helper function to check if user is Shield member
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_shield_member(check_user_id uuid)
RETURNS boolean AS $$
DECLARE
  profile_record record;
BEGIN
  SELECT has_signed_pma, has_shield_nft 
  INTO profile_record
  FROM public.user_profiles
  WHERE public_user_id = check_user_id;

  -- User is Shield member if they have BOTH PMA signed AND Shield NFT
  RETURN profile_record.has_signed_pma = true AND profile_record.has_shield_nft = true;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.is_shield_member(uuid) TO authenticated, anon;

COMMENT ON FUNCTION public.is_shield_member(uuid) IS 
  'Check if a user has Shield member (Private) access. Requires both PMA signed and Shield NFT ownership.';

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
-- Run this to verify the columns were added:
-- 
-- SELECT 
--   column_name, 
--   data_type, 
--   column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'public' 
--   AND table_name = 'user_profiles'
--   AND column_name IN ('has_signed_pma', 'has_shield_nft', 'pma_signed_at');
--
-- Expected: Should return 3 rows

-- ============================================================================
-- USAGE EXAMPLES
-- ============================================================================
-- Grant Shield access to a user:
-- 
-- UPDATE public.user_profiles
-- SET 
--   has_signed_pma = true,
--   has_shield_nft = true,
--   pma_signed_at = NOW()
-- WHERE public_user_id = 'user-uuid-here';

-- Revoke Shield access:
-- 
-- UPDATE public.user_profiles
-- SET 
--   has_signed_pma = false,
--   has_shield_nft = false,
--   pma_signed_at = NULL
-- WHERE public_user_id = 'user-uuid-here';

-- Check Shield members:
-- 
-- SELECT 
--   pu.email,
--   up.has_signed_pma,
--   up.has_shield_nft,
--   up.pma_signed_at,
--   public.is_shield_member(pu.id) as is_member
-- FROM public.public_users pu
-- JOIN public.user_profiles up ON up.public_user_id = pu.id
-- WHERE up.has_signed_pma = true OR up.has_shield_nft = true;

