-- Create notifications system for ShieldNest
-- This migration creates the notifications table and related functions

-- Create enum for notification types
CREATE TYPE notification_type AS ENUM (
  'portfolio_update',
  'price_alert',
  'membership',
  'liquidity_pool',
  'trading_feature',
  'new_feature',
  'system',
  'governance',
  'security'
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User reference (can be auth_user_id or public_user_id)
  user_id UUID NOT NULL,
  
  -- Notification details
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Status tracking
  read BOOLEAN DEFAULT FALSE,
  action_required BOOLEAN DEFAULT FALSE,
  action_completed BOOLEAN DEFAULT FALSE,
  
  -- Optional action details
  action_url TEXT,
  action_label TEXT,
  
  -- Metadata
  metadata JSONB,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  action_completed_at TIMESTAMPTZ
);

-- Create indexes for performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_read ON public.notifications(read);
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, read) WHERE read = FALSE;
CREATE INDEX idx_notifications_type ON public.notifications(type);

-- Add RLS policies
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications
  FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM auth.users WHERE auth.uid() = id
      UNION
      SELECT public_user_id FROM user_profiles WHERE auth_user_id = auth.uid()
    )
  );

-- Policy: Users can update their own notifications (mark as read, complete actions)
CREATE POLICY "Users can update their own notifications"
  ON public.notifications
  FOR UPDATE
  USING (
    user_id IN (
      SELECT id FROM auth.users WHERE auth.uid() = id
      UNION
      SELECT public_user_id FROM user_profiles WHERE auth_user_id = auth.uid()
    )
  );

-- Policy: Service role can insert notifications (for system/admin notifications)
CREATE POLICY "Service role can insert notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (true);

-- Policy: Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
  ON public.notifications
  FOR DELETE
  USING (
    user_id IN (
      SELECT id FROM auth.users WHERE auth.uid() = id
      UNION
      SELECT public_user_id FROM user_profiles WHERE auth_user_id = auth.uid()
    )
  );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on notification updates
CREATE TRIGGER trigger_update_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notifications_updated_at();

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(notification_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.notifications
  SET 
    read = TRUE,
    read_at = NOW(),
    updated_at = NOW()
  WHERE id = notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark notification action as completed
CREATE OR REPLACE FUNCTION mark_notification_action_completed(notification_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.notifications
  SET 
    action_completed = TRUE,
    action_completed_at = NOW(),
    updated_at = NOW()
  WHERE id = notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread notification count for a user
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO count
  FROM public.notifications
  WHERE user_id = p_user_id AND read = FALSE;
  
  RETURN count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark all notifications as read for a user
CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  affected_count INTEGER;
BEGIN
  UPDATE public.notifications
  SET 
    read = TRUE,
    read_at = NOW(),
    updated_at = NOW()
  WHERE user_id = p_user_id AND read = FALSE;
  
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RETURN affected_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert some example notifications for testing (optional - remove in production)
-- These will help demonstrate the notification system
COMMENT ON TABLE public.notifications IS 'Stores user notifications for portfolio updates, alerts, and system messages';
COMMENT ON COLUMN public.notifications.user_id IS 'References either auth.users.id or public_users.id depending on user type';
COMMENT ON COLUMN public.notifications.metadata IS 'Additional data in JSON format (e.g., token info, transaction details)';
COMMENT ON COLUMN public.notifications.action_url IS 'URL to navigate to when user clicks the action button';
COMMENT ON COLUMN public.notifications.action_label IS 'Text to display on the action button (e.g., "View Transaction", "Complete Setup")';

