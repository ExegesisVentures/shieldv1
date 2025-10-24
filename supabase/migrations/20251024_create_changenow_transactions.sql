-- ============================================
-- ChangeNOW Transactions Table
-- ============================================
-- Tracks all ChangeNOW buy transactions for users
-- Enables transaction history, status tracking, and balance updates

CREATE TABLE IF NOT EXISTS public.changenow_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- ChangeNOW API fields
  changenow_id VARCHAR(255) UNIQUE NOT NULL, -- ChangeNOW transaction ID
  payin_address VARCHAR(255), -- Address where user sends payment
  payout_address VARCHAR(255) NOT NULL, -- User's COREUM wallet address
  payin_hash VARCHAR(255), -- Payment transaction hash
  payout_hash VARCHAR(255), -- Payout transaction hash (to COREUM)
  
  -- Transaction details
  from_currency VARCHAR(10) NOT NULL, -- e.g., 'usd', 'eur'
  from_amount DECIMAL(20, 8) NOT NULL, -- Amount user pays
  to_currency VARCHAR(10) NOT NULL DEFAULT 'coreum', -- Always coreum
  to_amount DECIMAL(20, 8), -- Amount user receives in COREUM
  expected_amount DECIMAL(20, 8), -- Expected COREUM amount
  
  -- Status tracking
  status VARCHAR(50) NOT NULL DEFAULT 'new', -- new, waiting, confirming, exchanging, sending, finished, failed, refunded, expired
  status_updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- ChangeNOW raw response (for debugging)
  raw_response JSONB,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Metadata
  user_email VARCHAR(255), -- For customer support
  user_wallet_label VARCHAR(255), -- Which wallet they used
  
  -- Indexes for performance
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_changenow_transactions_user_id ON public.changenow_transactions(user_id);
CREATE INDEX idx_changenow_transactions_changenow_id ON public.changenow_transactions(changenow_id);
CREATE INDEX idx_changenow_transactions_status ON public.changenow_transactions(status);
CREATE INDEX idx_changenow_transactions_created_at ON public.changenow_transactions(created_at DESC);
CREATE INDEX idx_changenow_transactions_payout_address ON public.changenow_transactions(payout_address);

-- Row Level Security (RLS)
ALTER TABLE public.changenow_transactions ENABLE ROW LEVEL SECURITY;

-- Users can only view their own transactions
CREATE POLICY "Users can view own transactions"
  ON public.changenow_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own transactions
CREATE POLICY "Users can insert own transactions"
  ON public.changenow_transactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- System can update any transaction (for status polling)
-- Note: This will be done via service role in API routes

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_changenow_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_changenow_transactions_updated_at
  BEFORE UPDATE ON public.changenow_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_changenow_transactions_updated_at();

-- Grant permissions
GRANT SELECT, INSERT ON public.changenow_transactions TO authenticated;
GRANT ALL ON public.changenow_transactions TO service_role;

-- Comment
COMMENT ON TABLE public.changenow_transactions IS 'Tracks ChangeNOW buy transactions for users purchasing COREUM with fiat';

