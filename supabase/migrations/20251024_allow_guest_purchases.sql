-- ============================================
-- Allow Guest Purchases
-- ============================================
-- Makes user_id nullable and adds guest transaction tracking

-- Make user_id nullable
ALTER TABLE public.changenow_transactions 
  ALTER COLUMN user_id DROP NOT NULL;

-- Add guest tracking field
ALTER TABLE public.changenow_transactions 
  ADD COLUMN is_guest BOOLEAN DEFAULT false;

-- Add guest session identifier (for grouping guest purchases)
ALTER TABLE public.changenow_transactions 
  ADD COLUMN guest_session_id TEXT;

-- Update RLS policies to allow guest transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON public.changenow_transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.changenow_transactions;

-- New policy: Authenticated users can view their own transactions
CREATE POLICY "Authenticated users can view own transactions"
  ON public.changenow_transactions
  FOR SELECT
  USING (
    (auth.uid() = user_id) OR 
    (user_id IS NULL AND guest_session_id IS NOT NULL)
  );

-- New policy: Anyone can insert transactions (guest or authenticated)
CREATE POLICY "Anyone can insert transactions"
  ON public.changenow_transactions
  FOR INSERT
  WITH CHECK (
    (auth.uid() = user_id) OR 
    (user_id IS NULL AND is_guest = true)
  );

-- Add index for guest transactions
CREATE INDEX idx_guest_transactions 
  ON public.changenow_transactions(guest_session_id) 
  WHERE is_guest = true;

-- Add index for guest email lookups
CREATE INDEX idx_guest_email 
  ON public.changenow_transactions(user_email) 
  WHERE is_guest = true AND user_email IS NOT NULL;

COMMENT ON COLUMN public.changenow_transactions.is_guest IS 'True if transaction was made by guest user';
COMMENT ON COLUMN public.changenow_transactions.guest_session_id IS 'Session identifier for grouping guest purchases';

