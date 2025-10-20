-- Add last_block_height column to wallet_rewards_history table
-- This tracks the last blockchain height processed for incremental updates
-- File: supabase/migrations/20251014_add_last_block_height.sql

-- Add column if it doesn't exist
ALTER TABLE wallet_rewards_history 
ADD COLUMN IF NOT EXISTS last_block_height BIGINT DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN wallet_rewards_history.last_block_height IS 
  'Last blockchain height processed for this wallet (used for incremental updates)';

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_wallet_rewards_last_block 
ON wallet_rewards_history(wallet_address, last_block_height);

