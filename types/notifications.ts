/**
 * Notification types and interfaces for ShieldNest
 * File: types/notifications.ts
 */

export type NotificationType = 
  | 'portfolio_update'
  | 'price_alert'
  | 'membership'
  | 'liquidity_pool'
  | 'trading_feature'
  | 'new_feature'
  | 'system'
  | 'governance'
  | 'security';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  action_required: boolean;
  action_completed: boolean;
  action_url?: string | null;
  action_label?: string | null;
  metadata?: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  read_at?: string | null;
  action_completed_at?: string | null;
}

export interface NotificationFilter {
  type?: NotificationType;
  read?: boolean;
  action_required?: boolean;
}

export interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  fetchNotifications: (filter?: NotificationFilter) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  markActionCompleted: (notificationId: string) => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
}

// Notification type icons and colors for UI
export const NotificationConfig: Record<NotificationType, { icon: string; color: string; label: string }> = {
  portfolio_update: {
    icon: 'IoTrendingUp',
    color: 'blue',
    label: 'Portfolio Update'
  },
  price_alert: {
    icon: 'IoNotifications',
    color: 'yellow',
    label: 'Price Alert'
  },
  membership: {
    icon: 'IoShield',
    color: 'purple',
    label: 'Membership'
  },
  liquidity_pool: {
    icon: 'IoWater',
    color: 'cyan',
    label: 'Liquidity Pool'
  },
  trading_feature: {
    icon: 'IoSwapHorizontal',
    color: 'green',
    label: 'Trading'
  },
  new_feature: {
    icon: 'IoSparkles',
    color: 'pink',
    label: 'New Feature'
  },
  system: {
    icon: 'IoInformationCircle',
    color: 'gray',
    label: 'System'
  },
  governance: {
    icon: 'IoPeople',
    color: 'indigo',
    label: 'Governance'
  },
  security: {
    icon: 'IoLockClosed',
    color: 'red',
    label: 'Security'
  }
};

