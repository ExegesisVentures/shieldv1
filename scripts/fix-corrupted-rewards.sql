-- Fix corrupted rewards data caused by infinite loop bug
-- This script deletes all rewards history so it can be re-queried with the fixed code

-- Delete all wallet rewards history (will be re-queried with fixed code)
DELETE FROM wallet_rewards_history;

-- Optional: If you want to keep some wallets and only reset specific ones, use:
-- DELETE FROM wallet_rewards_history WHERE wallet_address = 'core1g4dfvfq4m3pen0rfrlwp5283afp9q8746jc7wq';

-- The next time a wallet is queried, it will fetch fresh data from the blockchain
-- with the corrected pagination logic

