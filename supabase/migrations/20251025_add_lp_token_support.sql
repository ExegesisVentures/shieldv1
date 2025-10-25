-- ============================================================================
-- Add LP Token Support to coreum_tokens table
-- ============================================================================
-- This migration adds columns for tracking Liquidity Pool (LP) tokens
-- including their constituent token pairs and logo URLs.
--
-- File: supabase/migrations/20251025_add_lp_token_support.sql
-- ============================================================================

-- Step 1: Add logo_url column for all tokens
ALTER TABLE public.coreum_tokens 
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Step 2: Add is_lp_token flag
ALTER TABLE public.coreum_tokens 
ADD COLUMN IF NOT EXISTS is_lp_token BOOLEAN DEFAULT FALSE;

-- Step 3: Add LP token constituent information (token pair details)
ALTER TABLE public.coreum_tokens 
ADD COLUMN IF NOT EXISTS lp_token0_symbol TEXT;

ALTER TABLE public.coreum_tokens 
ADD COLUMN IF NOT EXISTS lp_token1_symbol TEXT;

ALTER TABLE public.coreum_tokens 
ADD COLUMN IF NOT EXISTS lp_token0_denom TEXT;

ALTER TABLE public.coreum_tokens 
ADD COLUMN IF NOT EXISTS lp_token1_denom TEXT;

-- Step 4: Add indexes for efficient LP token queries
CREATE INDEX IF NOT EXISTS idx_coreum_tokens_is_lp_token 
ON public.coreum_tokens(is_lp_token) 
WHERE is_lp_token = true;

CREATE INDEX IF NOT EXISTS idx_coreum_tokens_lp_token0_denom 
ON public.coreum_tokens(lp_token0_denom) 
WHERE lp_token0_denom IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_coreum_tokens_lp_token1_denom 
ON public.coreum_tokens(lp_token1_denom) 
WHERE lp_token1_denom IS NOT NULL;

-- Step 5: Add comments for documentation
COMMENT ON COLUMN public.coreum_tokens.logo_url IS 
  'Path to token logo image (e.g., /tokens/core.svg)';

COMMENT ON COLUMN public.coreum_tokens.is_lp_token IS 
  'Whether this token is a liquidity pool (LP) token';

COMMENT ON COLUMN public.coreum_tokens.lp_token0_symbol IS 
  'Symbol of first token in LP pair (e.g., ROLL). Only for LP tokens.';

COMMENT ON COLUMN public.coreum_tokens.lp_token1_symbol IS 
  'Symbol of second token in LP pair (e.g., CORE). Only for LP tokens.';

COMMENT ON COLUMN public.coreum_tokens.lp_token0_denom IS 
  'Full denomination of first token in LP pair. Only for LP tokens.';

COMMENT ON COLUMN public.coreum_tokens.lp_token1_denom IS 
  'Full denomination of second token in LP pair. Only for LP tokens.';

-- ============================================================================
-- Verification
-- ============================================================================
-- Check that all columns were created successfully:
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'coreum_tokens' 
  AND column_name IN (
    'logo_url', 
    'is_lp_token', 
    'lp_token0_symbol', 
    'lp_token1_symbol', 
    'lp_token0_denom', 
    'lp_token1_denom'
  )
ORDER BY column_name;

