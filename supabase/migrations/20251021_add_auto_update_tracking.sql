-- Add auto-update tracking to wallet_rewards_history table
-- This tracks when automatic background updates occur (every 48 hours)
-- File: supabase/migrations/20251021_add_auto_update_tracking.sql

-- ============================================================================
-- Add last_auto_update_at column to track automatic background refreshes
-- ============================================================================
ALTER TABLE wallet_rewards_history 
ADD COLUMN IF NOT EXISTS last_auto_update_at timestamptz DEFAULT NULL;

-- ============================================================================
-- Add index for efficient querying of wallets needing auto-update
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_wallet_rewards_auto_update 
ON wallet_rewards_history(last_auto_update_at) 
WHERE last_auto_update_at IS NOT NULL;

-- ============================================================================
-- Add comment for documentation
-- ============================================================================
COMMENT ON COLUMN wallet_rewards_history.last_auto_update_at IS 
  'Timestamp of last automatic background update (runs every 48 hours). NULL means never auto-updated. This is separate from last_updated_at which tracks all updates including manual ones.';

