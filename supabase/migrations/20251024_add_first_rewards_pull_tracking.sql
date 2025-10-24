-- Add first rewards pull tracking to wallet_rewards_history table
-- This tracks when a ShieldNest member's rewards were first pulled
-- File: supabase/migrations/20251024_add_first_rewards_pull_tracking.sql

-- ============================================================================
-- Add first_rewards_pull_at column to track first-time rewards fetch
-- ============================================================================
ALTER TABLE wallet_rewards_history 
ADD COLUMN IF NOT EXISTS first_rewards_pull_at timestamptz DEFAULT NULL;

-- ============================================================================
-- Add comment for documentation
-- ============================================================================
COMMENT ON COLUMN wallet_rewards_history.first_rewards_pull_at IS 
  'Timestamp of first historical rewards pull. Used to detect first-time login for ShieldNest members to auto-pull their rewards.';

-- ============================================================================
-- Add function to check if user is ShieldNest member with unpulled rewards
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_shieldnest_member_with_unpulled_rewards(
  check_user_id uuid,
  wallet_address_to_check text
)
RETURNS boolean AS $$
DECLARE
  profile_record record;
  rewards_record record;
BEGIN
  -- Check if user is ShieldNest member (has NFT or has signed PMA)
  SELECT has_signed_pma, has_shield_nft 
  INTO profile_record
  FROM public.user_profiles
  WHERE public_user_id = check_user_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- User is ShieldNest member if they have EITHER PMA signed OR Shield NFT
  -- (relaxed from BOTH to be more inclusive)
  IF NOT (profile_record.has_signed_pma OR profile_record.has_shield_nft) THEN
    RETURN false;
  END IF;

  -- Check if wallet rewards have been pulled before
  SELECT first_rewards_pull_at, last_updated_at
  INTO rewards_record
  FROM public.wallet_rewards_history
  WHERE wallet_address = wallet_address_to_check;

  -- If no record exists OR first_rewards_pull_at is NULL, rewards haven't been pulled
  IF NOT FOUND OR rewards_record.first_rewards_pull_at IS NULL THEN
    RETURN true;
  END IF;

  RETURN false;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.is_shieldnest_member_with_unpulled_rewards(uuid, text) TO authenticated, anon;

COMMENT ON FUNCTION public.is_shieldnest_member_with_unpulled_rewards(uuid, text) IS 
  'Check if a user is a ShieldNest member who has not yet had their rewards pulled. Used for auto-pull on first login.';

