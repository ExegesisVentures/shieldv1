"use client";

/**
 * Notification Item Component - Individual notification card
 * File: components/notifications/NotificationItem.tsx
 * Mobile-first design with touch-friendly interactions
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  IoTrendingUp,
  IoNotifications,
  IoShield,
  IoWater,
  IoSwapHorizontal,
  IoSparkles,
  IoInformationCircle,
  IoPeople,
  IoLockClosed,
  IoCheckmarkCircle,
  IoTrash,
  IoChevronForward
} from 'react-icons/io5';
import type { Notification } from '@/types/notifications';
import { NotificationConfig } from '@/types/notifications';
import { Button } from '@/components/ui/button';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => Promise<void>;
  onMarkActionCompleted: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const iconMap = {
  IoTrendingUp,
  IoNotifications,
  IoShield,
  IoWater,
  IoSwapHorizontal,
  IoSparkles,
  IoInformationCircle,
  IoPeople,
  IoLockClosed
};

const colorClasses = {
  blue: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
  yellow: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
  purple: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
  cyan: 'bg-cyan-100 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400',
  green: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400',
  pink: 'bg-pink-100 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400',
  gray: 'bg-gray-100 dark:bg-gray-900/20 text-gray-600 dark:text-gray-400',
  indigo: 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400',
  red: 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400'
};

export default function NotificationItem({
  notification,
  onMarkAsRead,
  onMarkActionCompleted,
  onDelete
}: NotificationItemProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const router = useRouter();

  const config = NotificationConfig[notification.type];
  const IconComponent = iconMap[config.icon as keyof typeof iconMap];
  const colorClass = colorClasses[config.color as keyof typeof colorClasses];

  // Format relative time
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleMarkAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (notification.read || isProcessing) return;
    
    setIsProcessing(true);
    try {
      await onMarkAsRead(notification.id);
    } catch (error) {
      console.error('Failed to mark as read:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleActionComplete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsProcessing(true);
    
    try {
      // If there's an action URL, navigate to it
      if (notification.action_url) {
        router.push(notification.action_url);
      }
      
      // Mark action as completed
      await onMarkActionCompleted(notification.id);
      
      // Also mark as read if not already
      if (!notification.read) {
        await onMarkAsRead(notification.id);
      }
    } catch (error) {
      console.error('Failed to complete action:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsProcessing(true);
    
    try {
      await onDelete(notification.id);
    } catch (error) {
      console.error('Failed to delete notification:', error);
      setIsProcessing(false);
    }
  };

  const handleCardClick = () => {
    // Mark as read when clicking the card
    if (!notification.read && !isProcessing) {
      onMarkAsRead(notification.id);
    }
  };

  return (
    <div
      className={`
        relative p-4 rounded-lg border transition-all duration-200
        ${notification.read 
          ? 'bg-gray-50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-800' 
          : 'bg-white dark:bg-gray-900 border-[#25d695]/30 shadow-sm'
        }
        hover:shadow-md hover:border-[#25d695]/50
        cursor-pointer
        ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
      `}
      onClick={handleCardClick}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Unread indicator dot */}
      {!notification.read && (
        <div className="absolute top-2 right-2 w-2 h-2 bg-[#25d695] rounded-full animate-pulse" />
      )}

      <div className="flex gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 p-2.5 rounded-lg ${colorClass} h-fit`}>
          <IconComponent className="w-5 h-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`text-sm font-semibold ${
                notification.read ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-white'
              }`}>
                {notification.title}
              </h3>
              <span className={`text-xs px-2 py-0.5 rounded-full ${colorClass}`}>
                {config.label}
              </span>
            </div>
            
            <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
              {getRelativeTime(notification.created_at)}
            </span>
          </div>

          {/* Message */}
          <p className={`text-sm mb-3 ${
            notification.read ? 'text-gray-500 dark:text-gray-400' : 'text-gray-700 dark:text-gray-300'
          }`}>
            {notification.message}
          </p>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Action Required Button */}
            {notification.action_required && !notification.action_completed && (
              <Button
                onClick={handleActionComplete}
                disabled={isProcessing}
                size="sm"
                className="bg-[#25d695] hover:bg-[#1fb881] text-white text-xs"
              >
                {notification.action_label || 'Take Action'}
                <IoChevronForward className="ml-1 w-3 h-3" />
              </Button>
            )}

            {/* Action Completed Indicator */}
            {notification.action_completed && (
              <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <IoCheckmarkCircle className="w-4 h-4" />
                Completed
              </span>
            )}

            {/* Mark as Read Button (mobile-friendly) */}
            {!notification.read && (
              <button
                onClick={handleMarkAsRead}
                disabled={isProcessing}
                className="text-xs text-gray-500 hover:text-[#25d695] dark:text-gray-400 dark:hover:text-[#25d695] transition-colors px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Mark as read
              </button>
            )}

            {/* Delete Button (shows on hover or always on mobile) */}
            <button
              onClick={handleDelete}
              disabled={isProcessing}
              className={`
                ml-auto text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 
                transition-all px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20
                ${showActions ? 'opacity-100' : 'opacity-0 md:opacity-0'}
                touch-manipulation
              `}
              aria-label="Delete notification"
            >
              <IoTrash className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

