"use client";

/**
 * Notifications Page - View and manage all user notifications
 * File: app/notifications/page.tsx
 * Mobile-responsive design with filtering and bulk actions
 */

import React, { useEffect, useState } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import NotificationItem from '@/components/notifications/NotificationItem';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  IoNotificationsOutline,
  IoCheckmarkDone,
  IoFilter,
  IoRefresh,
  IoClose
} from 'react-icons/io5';
import type { NotificationType } from '@/types/notifications';
import { NotificationConfig } from '@/types/notifications';

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    markActionCompleted,
    deleteNotification
  } = useNotifications();

  const [filterType, setFilterType] = useState<NotificationType | 'all'>('all');
  const [filterRead, setFilterRead] = useState<'all' | 'unread' | 'read'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Apply filters
  const handleApplyFilters = () => {
    const filter: any = {};
    
    if (filterType !== 'all') {
      filter.type = filterType;
    }
    
    if (filterRead === 'unread') {
      filter.read = false;
    } else if (filterRead === 'read') {
      filter.read = true;
    }

    fetchNotifications(filter);
    setShowFilters(false);
  };

  // Clear filters
  const handleClearFilters = () => {
    setFilterType('all');
    setFilterRead('all');
    fetchNotifications();
    setShowFilters(false);
  };

  // Refresh notifications
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  // Filter notifications locally for immediate UI feedback
  const filteredNotifications = notifications.filter(notif => {
    if (filterType !== 'all' && notif.type !== filterType) return false;
    if (filterRead === 'unread' && notif.read) return false;
    if (filterRead === 'read' && !notif.read) return false;
    return true;
  });

  const hasActiveFilters = filterType !== 'all' || filterRead !== 'all';

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-[#0a0b0d] p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 sm:p-3 bg-gradient-to-br from-[#25d695] to-[#1fb881] rounded-xl">
                <IoNotificationsOutline className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  Notifications
                </h1>
                {unreadCount > 0 && (
                  <p className="text-sm text-gray-400 mt-0.5">
                    {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>

            {/* Refresh Button (desktop) */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-[#25d695] dark:hover:text-[#25d695] transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <IoRefresh className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`
                flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${hasActiveFilters || showFilters
                  ? 'bg-[#25d695] text-white'
                  : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
                }
              `}
            >
              <IoFilter className="w-4 h-4" />
              Filters
              {hasActiveFilters && (
                <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded text-xs">
                  {(filterType !== 'all' ? 1 : 0) + (filterRead !== 'all' ? 1 : 0)}
                </span>
              )}
            </button>

            {/* Mark All Read Button */}
            {unreadCount > 0 && (
              <Button
                onClick={handleMarkAllRead}
                size="sm"
                variant="outline"
                className="flex items-center gap-2 text-xs sm:text-sm"
              >
                <IoCheckmarkDone className="w-4 h-4" />
                <span className="hidden sm:inline">Mark all read</span>
                <span className="sm:hidden">Mark all</span>
              </Button>
            )}

            {/* Refresh Button (mobile) */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="sm:hidden p-2 text-gray-600 dark:text-gray-400 hover:text-[#25d695] dark:hover:text-[#25d695] transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <IoRefresh className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <Card className="mt-3 p-4 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notification Type
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <button
                      onClick={() => setFilterType('all')}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        filterType === 'all'
                          ? 'bg-[#25d695] text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      All Types
                    </button>
                    {Object.entries(NotificationConfig).map(([type, config]) => (
                      <button
                        key={type}
                        onClick={() => setFilterType(type as NotificationType)}
                        className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all truncate ${
                          filterType === type
                            ? 'bg-[#25d695] text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >
                        {config.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Read Status
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['all', 'unread', 'read'] as const).map((status) => (
                      <button
                        key={status}
                        onClick={() => setFilterRead(status)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                          filterRead === status
                            ? 'bg-[#25d695] text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={handleApplyFilters}
                    className="flex-1 bg-[#25d695] hover:bg-[#1fb881] text-white"
                  >
                    Apply Filters
                  </Button>
                  {hasActiveFilters && (
                    <Button
                      onClick={handleClearFilters}
                      variant="outline"
                      className="flex items-center gap-1"
                    >
                      <IoClose className="w-4 h-4" />
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Error State */}
        {error && (
          <Card className="p-4 mb-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <p className="text-red-800 dark:text-red-200 text-sm">
              {error}
            </p>
          </Card>
        )}

        {/* Loading State */}
        {loading && notifications.length === 0 ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4 animate-pulse">
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-gray-300 dark:bg-gray-700 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4" />
                    <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-full" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          /* Empty State */
          <Card className="p-8 sm:p-12 text-center">
            <div className="max-w-sm mx-auto">
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <IoNotificationsOutline className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {hasActiveFilters ? 'No notifications match your filters' : 'No notifications yet'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {hasActiveFilters 
                  ? 'Try adjusting your filters to see more notifications'
                  : 'When you receive notifications, they will appear here'
                }
              </p>
              {hasActiveFilters && (
                <Button onClick={handleClearFilters} variant="outline" size="sm">
                  Clear Filters
                </Button>
              )}
            </div>
          </Card>
        ) : (
          /* Notifications List */
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={markAsRead}
                onMarkActionCompleted={markActionCompleted}
                onDelete={deleteNotification}
              />
            ))}
          </div>
        )}

        {/* Pagination Placeholder - Add if needed */}
        {filteredNotifications.length >= 50 && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing first 50 notifications
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

