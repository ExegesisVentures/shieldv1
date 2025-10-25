"use client";

/**
 * Notification Context Provider for global notification state management
 * File: contexts/NotificationContext.tsx
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createSupabaseClient } from '@/utils/supabase/client';
import type { Notification, NotificationFilter, NotificationContextType } from '@/types/notifications';

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createSupabaseClient();

  // Fetch unread count
  const refreshUnreadCount = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setUnreadCount(0);
        return;
      }

      // Get user's public_user_id
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('public_user_id')
        .eq('auth_user_id', user.id)
        .single();

      if (profile) {
        const { count, error } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', profile.public_user_id)
          .eq('read', false);

        if (!error && count !== null) {
          setUnreadCount(count);
        }
      }
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  }, [supabase]);

  // Fetch notifications with optional filters
  const fetchNotifications = useCallback(async (filter?: NotificationFilter) => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Handle visitor mode - could use localStorage for demo notifications
        setNotifications([]);
        setLoading(false);
        return;
      }

      // Get user's public_user_id
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('public_user_id')
        .eq('auth_user_id', user.id)
        .single();

      if (!profile) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      // Build query with filters
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile.public_user_id)
        .order('created_at', { ascending: false })
        .limit(50); // Pagination limit

      if (filter?.type) {
        query = query.eq('type', filter.type);
      }
      if (filter?.read !== undefined) {
        query = query.eq('read', filter.read);
      }
      if (filter?.action_required !== undefined) {
        query = query.eq('action_required', filter.action_required);
      }

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;

      setNotifications(data || []);
      await refreshUnreadCount();
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, [supabase, refreshUnreadCount]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          read: true, 
          read_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', notificationId);

      if (error) throw error;

      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, read: true, read_at: new Date().toISOString() }
            : notif
        )
      );

      await refreshUnreadCount();
    } catch (err) {
      console.error('Error marking notification as read:', err);
      throw err;
    }
  }, [supabase, refreshUnreadCount]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('public_user_id')
        .eq('auth_user_id', user.id)
        .single();

      if (!profile) return;

      const { error } = await supabase
        .from('notifications')
        .update({ 
          read: true, 
          read_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', profile.public_user_id)
        .eq('read', false);

      if (error) throw error;

      // Update local state
      setNotifications(prev => 
        prev.map(notif => ({ 
          ...notif, 
          read: true, 
          read_at: new Date().toISOString() 
        }))
      );

      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
      throw err;
    }
  }, [supabase]);

  // Mark action as completed
  const markActionCompleted = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          action_completed: true,
          action_completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', notificationId);

      if (error) throw error;

      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, action_completed: true, action_completed_at: new Date().toISOString() }
            : notif
        )
      );
    } catch (err) {
      console.error('Error marking action completed:', err);
      throw err;
    }
  }, [supabase]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      // Update local state
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      await refreshUnreadCount();
    } catch (err) {
      console.error('Error deleting notification:', err);
      throw err;
    }
  }, [supabase, refreshUnreadCount]);

  // Set up real-time subscription for new notifications
  useEffect(() => {
    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('public_user_id')
        .eq('auth_user_id', user.id)
        .single();

      if (!profile) return;

      // Subscribe to notification changes
      const subscription = supabase
        .channel('notifications_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${profile.public_user_id}`
          },
          (payload) => {
            console.log('Notification change received:', payload);
            
            if (payload.eventType === 'INSERT') {
              setNotifications(prev => [payload.new as Notification, ...prev]);
              refreshUnreadCount();
            } else if (payload.eventType === 'UPDATE') {
              setNotifications(prev => 
                prev.map(notif => 
                  notif.id === payload.new.id ? payload.new as Notification : notif
                )
              );
              refreshUnreadCount();
            } else if (payload.eventType === 'DELETE') {
              setNotifications(prev => 
                prev.filter(notif => notif.id !== payload.old.id)
              );
              refreshUnreadCount();
            }
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    };

    setupRealtimeSubscription();
  }, [supabase, refreshUnreadCount]);

  // Initial load of unread count
  useEffect(() => {
    refreshUnreadCount();
  }, [refreshUnreadCount]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    markActionCompleted,
    deleteNotification,
    refreshUnreadCount
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

