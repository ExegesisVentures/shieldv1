-- Add ShieldNest Member NFT tracking to private_users table
-- This tracks how many ShieldNest Member NFTs each private member holds
-- File: supabase/migrations/20251022_add_nft_count_tracking.sql

-- ============================================================================
-- Add shieldnest_member_nft column to private_users table
-- ============================================================================
ALTER TABLE public.private_users 
ADD COLUMN IF NOT EXISTS shieldnest_member_nft INTEGER DEFAULT 0;

-- ============================================================================
-- Add comment for documentation
-- ============================================================================
COMMENT ON COLUMN public.private_users.shieldnest_member_nft IS 
  'Number of ShieldNest Member NFTs held by this private member. Used for membership tier tracking. Other NFT types will be tracked separately in the future.';

-- ============================================================================
-- Create index for efficient querying by ShieldNest Member NFT count
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_private_users_shieldnest_nft 
ON public.private_users(shieldnest_member_nft) 
WHERE shieldnest_member_nft > 0;

-- ============================================================================
-- Verification query
-- ============================================================================
-- After running this migration, verify the column exists:
-- 
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'private_users' 
--   AND column_name = 'shieldnest_member_nft';

