"use client";

import { useState, useEffect } from "react";
import { IoClose, IoCheckmark, IoSparkles, IoRocket, IoTrendingUp, IoShieldCheckmark } from "react-icons/io5";
import { createSupabaseClient } from "@/utils/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * NotificationCenter.tsx
 * 
 * In-app notification center showing feature updates, exclusive access, and announcements.
 * Notifications are stored in user preferences and can be marked as read.
 * 
 * Location: /Users/exe/Downloads/Cursor/shieldv2/components/notifications/NotificationCenter.tsx
 */

export interface Notification {
  id: string;
  type: "feature" | "exclusive" | "announcement" | "reward";
  title: string;
  message: string;
  icon: "sparkles" | "rocket" | "trending" | "shield";
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  actionText?: string;
}

interface NotificationCenterProps {
  userId?: string;
}

export default function NotificationCenter({ userId }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, [userId]);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      if (userId) {
        // Load from database for authenticated users
        const supabase = createSupabaseClient();
        const { data } = await supabase
          .from('user_notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        
        if (data) {
          const formattedNotifications: Notification[] = data.map((n: any) => ({
            id: n.id,
            type: n.type,
            title: n.title,
            message: n.message,
            icon: n.icon || 'sparkles',
            timestamp: n.created_at,
            read: n.read,
            actionUrl: n.action_url,
            actionText: n.action_text,
          }));
          setNotifications(formattedNotifications);
        } else {
          // Fallback to default notifications
          setNotifications(getDefaultNotifications());
        }
      } else {
        // For visitors, use default notifications
        setNotifications(getDefaultNotifications());
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
      setNotifications(getDefaultNotifications());
    } finally {
      setIsLoading(false);
    }
  };

  const getDefaultNotifications = (): Notification[] => [
    {
      id: "1",
      type: "feature",
      title: "Liquidity Pools Coming Soon!",
      message: "Add liquidity and earn rewards on our upcoming high-APY pools. Sign up now to get notified when we launch!",
      icon: "rocket",
      timestamp: new Date().toISOString(),
      read: false,
      actionUrl: "/sign-up",
      actionText: "Sign Up",
    },
    {
      id: "2",
      type: "exclusive",
      title: "Early Access for Shield Members",
      message: "Shield NFT holders will get priority access to all new DEX features. Become a member today!",
      icon: "shield",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      read: false,
      actionUrl: "/membership",
      actionText: "Learn More",
    },
    {
      id: "3",
      type: "announcement",
      title: "High Earning Pools",
      message: "Get ready for some of the highest earning liquidity pools in the Coreum ecosystem. Plus special treats for early users!",
      icon: "trending",
      timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      read: false,
    },
  ];

  const markAsRead = async (notificationId: string) => {
    try {
      if (userId) {
        const supabase = createSupabaseClient();
        await supabase
          .from('user_notifications')
          .update({ read: true })
          .eq('id', notificationId)
          .eq('user_id', userId);
      }

      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      if (userId) {
        const supabase = createSupabaseClient();
        await supabase
          .from('user_notifications')
          .update({ read: true })
          .eq('user_id', userId)
          .eq('read', false);
      }

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const getIconComponent = (icon: Notification["icon"]) => {
    const iconClass = "w-5 h-5";
    switch (icon) {
      case "sparkles":
        return <IoSparkles className={iconClass} />;
      case "rocket":
        return <IoRocket className={iconClass} />;
      case "trending":
        return <IoTrendingUp className={iconClass} />;
      case "shield":
        return <IoShieldCheckmark className={iconClass} />;
      default:
        return <IoSparkles className={iconClass} />;
    }
  };

  const getIconColor = (type: Notification["type"]) => {
    switch (type) {
      case "feature":
        return "from-blue-500 to-purple-500";
      case "exclusive":
        return "from-purple-500 to-pink-500";
      case "announcement":
        return "from-green-500 to-emerald-500";
      case "reward":
        return "from-yellow-500 to-orange-500";
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return "Just now";
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">
          Notifications
          {unreadCount > 0 && (
            <span className="ml-3 inline-flex items-center justify-center px-3 py-1 text-sm font-bold text-white bg-purple-600 rounded-full">
              {unreadCount}
            </span>
          )}
        </h2>
        {unreadCount > 0 && (
          <Button
            onClick={markAllAsRead}
            variant="outline"
            size="sm"
            className="text-sm"
          >
            <IoCheckmark className="w-4 h-4 mr-1" />
            Mark all read
          </Button>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <Card className="p-8 text-center">
            <IoSparkles className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-gray-400">No notifications yet</p>
            <p className="text-sm text-gray-500 mt-1">
              Check back later for updates and exclusive offers!
            </p>
          </Card>
        ) : (
          notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`p-5 transition-all duration-200 hover:shadow-lg ${
                !notification.read
                  ? "border-l-4 border-l-purple-500 bg-purple-900/10"
                  : "opacity-75 hover:opacity-100"
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br ${getIconColor(notification.type)} flex items-center justify-center text-white shadow-lg`}>
                  {getIconComponent(notification.icon)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-white text-base">
                      {notification.title}
                    </h3>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {formatTimestamp(notification.timestamp)}
                    </span>
                  </div>

                  <p className="text-sm text-gray-300 mb-3 leading-relaxed">
                    {notification.message}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {notification.actionUrl && notification.actionText && (
                      <Button
                        size="sm"
                        className="h-8 text-xs bg-purple-600 hover:bg-purple-700"
                        onClick={() => {
                          window.location.href = notification.actionUrl!;
                        }}
                      >
                        {notification.actionText}
                      </Button>
                    )}
                    {!notification.read && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-xs"
                        onClick={() => markAsRead(notification.id)}
                      >
                        <IoCheckmark className="w-4 h-4 mr-1" />
                        Mark read
                      </Button>
                    )}
                  </div>
                </div>

                {/* Unread indicator */}
                {!notification.read && (
                  <div className="flex-shrink-0 w-2 h-2 bg-purple-500 rounded-full mt-2" />
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

