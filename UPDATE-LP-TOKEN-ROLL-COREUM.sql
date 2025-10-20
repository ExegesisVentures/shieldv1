-- ================================================
-- Update ROLL/COREUM LP Token in Database
-- ================================================
-- This script adds or updates the ROLL/COREUM liquidity pool token
-- with proper metadata including the constituent token pair information.
--
-- File: UPDATE-LP-TOKEN-ROLL-COREUM.sql
-- LP Token Denom: ulp-core12mpplye8qzuqhe8fa6lecnu5r8jsymm0f9257tlehvs8cpcn8v6qv5zf0j
-- Pair: ROLL + COREUM
-- ================================================

-- Step 1: Add or update the LP token in coreum_tokens table
INSERT INTO coreum_tokens (
  denom,
  symbol,
  name,
  decimals,
  logo_url,
  description,
  is_lp_token,
  lp_token0_symbol,
  lp_token1_symbol,
  lp_token0_denom,
  lp_token1_denom,
  created_at,
  updated_at
)
VALUES (
  'ulp-core12mpplye8qzuqhe8fa6lecnu5r8jsymm0f9257tlehvs8cpcn8v6qv5zf0j',
  'ROLL-CORE LP',
  'ROLL/COREUM LP Token',
  6,
  '/tokens/lp.svg',
  'Liquidity Pool token for ROLL/COREUM pair',
  true,
  'ROLL',
  'CORE',
  'xrpl11f82115a5-core1zhs909jp9yktml6qqx9f0ptcq2xnhhj99cja03j3lfcsp2pgm86studdrz',
  'ucore',
  NOW(),
  NOW()
)
ON CONFLICT (denom) DO UPDATE SET
  symbol = EXCLUDED.symbol,
  name = EXCLUDED.name,
  logo_url = EXCLUDED.logo_url,
  description = EXCLUDED.description,
  is_lp_token = EXCLUDED.is_lp_token,
  lp_token0_symbol = EXCLUDED.lp_token0_symbol,
  lp_token1_symbol = EXCLUDED.lp_token1_symbol,
  lp_token0_denom = EXCLUDED.lp_token0_denom,
  lp_token1_denom = EXCLUDED.lp_token1_denom,
  updated_at = NOW();

-- Step 2: Ensure the columns exist (if they don't already)
-- Note: Run these only if the columns don't exist yet
-- You may need to uncomment these if your database doesn't have these columns

-- ALTER TABLE coreum_tokens ADD COLUMN IF NOT EXISTS is_lp_token BOOLEAN DEFAULT FALSE;
-- ALTER TABLE coreum_tokens ADD COLUMN IF NOT EXISTS lp_token0_symbol TEXT;
-- ALTER TABLE coreum_tokens ADD COLUMN IF NOT EXISTS lp_token1_symbol TEXT;
-- ALTER TABLE coreum_tokens ADD COLUMN IF NOT EXISTS lp_token0_denom TEXT;
-- ALTER TABLE coreum_tokens ADD COLUMN IF NOT EXISTS lp_token1_denom TEXT;

-- Step 3: Update the trading pair to reference this LP token
-- Find the ROLL/CORE pair and link it to this LP token
UPDATE coreum_pairs
SET liquidity_token = 'ulp-core12mpplye8qzuqhe8fa6lecnu5r8jsymm0f9257tlehvs8cpcn8v6qv5zf0j',
    updated_at = NOW()
WHERE (
  (base_denom = 'xrpl11f82115a5-core1zhs909jp9yktml6qqx9f0ptcq2xnhhj99cja03j3lfcsp2pgm86studdrz' AND quote_denom = 'ucore')
  OR
  (base_denom = 'ucore' AND quote_denom = 'xrpl11f82115a5-core1zhs909jp9yktml6qqx9f0ptcq2xnhhj99cja03j3lfcsp2pgm86studdrz')
);

-- Step 4: Verify the update
SELECT 
  denom,
  symbol,
  name,
  is_lp_token,
  lp_token0_symbol,
  lp_token1_symbol,
  logo_url
FROM coreum_tokens
WHERE denom = 'ulp-core12mpplye8qzuqhe8fa6lecnu5r8jsymm0f9257tlehvs8cpcn8v6qv5zf0j';

-- Step 5: Verify the trading pair update
SELECT 
  pair_id,
  source,
  symbol,
  base_asset,
  quote_asset,
  liquidity_token,
  pool_contract
FROM coreum_pairs
WHERE liquidity_token = 'ulp-core12mpplye8qzuqhe8fa6lecnu5r8jsymm0f9257tlehvs8cpcn8v6qv5zf0j'
   OR (base_asset = 'ROLL' AND quote_asset = 'CORE')
   OR (base_asset = 'CORE' AND quote_asset = 'ROLL');

-- ================================================
-- NOTES:
-- ================================================
-- 1. This LP token represents a liquidity pool for ROLL/COREUM
-- 2. The dual logos (ROLL + CORE) will be displayed in the UI automatically
-- 3. The UI will detect is_lp_token=true and render using DualTokenLogo component
-- 4. Logo files used:
--    - ROLL: /tokens/roll.png
--    - CORE: /tokens/core.svg
-- ================================================

