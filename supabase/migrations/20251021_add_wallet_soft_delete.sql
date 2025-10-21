-- Add soft delete support to wallets table
-- This allows tracking deletion history and un-deleting wallets when re-added
-- File: supabase/migrations/20251021_add_wallet_soft_delete.sql

-- ============================================================================
-- Add deleted_at column to wallets table
-- ============================================================================
ALTER TABLE public.wallets 
ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

-- ============================================================================
-- Add index for efficient querying of active (non-deleted) wallets
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_wallets_not_deleted 
ON public.wallets(public_user_id, deleted_at) 
WHERE deleted_at IS NULL;

-- ============================================================================
-- Add index for querying all wallets including deleted ones
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_wallets_with_deleted 
ON public.wallets(public_user_id, address, deleted_at);

-- ============================================================================
-- Add comment for documentation
-- ============================================================================
COMMENT ON COLUMN public.wallets.deleted_at IS 
  'Timestamp when wallet was soft-deleted. NULL means active wallet. Allows tracking deletion history and un-deletion when re-adding.';

