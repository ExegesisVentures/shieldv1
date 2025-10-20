-- Create user rate limits table for API security
-- File: supabase/migrations/20251014_user_rate_limits.sql

-- Create rate limits table
CREATE TABLE IF NOT EXISTS user_rate_limits (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('request', 'refresh')),
  count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_user_rate_limits_user_action_time 
ON user_rate_limits(user_id, action, created_at);

CREATE INDEX IF NOT EXISTS idx_user_rate_limits_created_at 
ON user_rate_limits(created_at);

-- Add RLS policies
ALTER TABLE user_rate_limits ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own rate limit records
CREATE POLICY "Users can view own rate limits" ON user_rate_limits
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Service role can insert/update rate limits
CREATE POLICY "Service role can manage rate limits" ON user_rate_limits
  FOR ALL USING (auth.role() = 'service_role');

-- Create function to clean up old rate limit records (older than 7 days)
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM user_rate_limits 
  WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up old records (if pg_cron is available)
-- This would need to be set up separately in production
-- SELECT cron.schedule('cleanup-rate-limits', '0 2 * * *', 'SELECT cleanup_old_rate_limits();');

-- Add comment for documentation
COMMENT ON TABLE user_rate_limits IS 
  'Tracks API usage per user for rate limiting and abuse prevention';

COMMENT ON COLUMN user_rate_limits.action IS 
  'Type of action: request (normal API call) or refresh (blockchain query)';

COMMENT ON COLUMN user_rate_limits.count IS 
  'Number of requests in this time window (usually 1, but can be batched)';

