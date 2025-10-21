"use client";

import { useState, useEffect, useRef } from "react";
import { IoRefresh, IoTime } from "react-icons/io5";
import { ThreeArrowSpinner } from "@/components/ui/ThreeArrowSpinner";

interface TimerRefreshButtonProps {
  hoursUntilRefresh: number | null;
  isRefreshing?: boolean;
  isStale?: boolean;
  onRefresh?: () => void;
  disabled?: boolean;
  className?: string;
}

export default function TimerRefreshButton({
  hoursUntilRefresh,
  isRefreshing = false,
  isStale = false,
  onRefresh,
  disabled = false,
  className = ""
}: TimerRefreshButtonProps) {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate time remaining in seconds
  useEffect(() => {
    if (hoursUntilRefresh === null || hoursUntilRefresh <= 0) {
      setTimeRemaining(null);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Set initial time remaining
    const initialSeconds = Math.ceil(hoursUntilRefresh * 3600);
    setTimeRemaining(initialSeconds);

    // Start countdown timer
    intervalRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 1) {
          // Timer finished
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [hoursUntilRefresh]);

  // Format time remaining for display
  const formatTimeRemaining = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  // Format time for tooltip
  const formatTooltipTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}, ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}, ${secs} second${secs !== 1 ? 's' : ''}`;
    } else {
      return `${secs} second${secs !== 1 ? 's' : ''}`;
    }
  };

  // If no rate limit, show regular refresh button
  if (timeRemaining === null || timeRemaining <= 0) {
    return (
      <button
        onClick={onRefresh}
        disabled={disabled || isRefreshing}
        className={`p-1 hover:bg-white/20 rounded-full transition-colors disabled:opacity-50 ${
          isStale && !isRefreshing ? 'animate-pulse' : ''
        } ${className}`}
        title={
          isStale 
            ? "Data is stale - click to refresh (max once per 24h)" 
            : "Refresh rewards history (max once per 24h)"
        }
      >
        {isRefreshing ? (
          <ThreeArrowSpinner 
            size="sm" 
            variant={isStale ? "warning" : "default"}
            className="animate-spin"
          />
        ) : (
          <IoRefresh className={`w-3 h-3 ${
            isStale 
              ? 'text-orange-500 dark:text-orange-400' 
              : 'text-gray-600 dark:text-gray-400'
          }`} />
        )}
      </button>
    );
  }

  // Show countdown timer
  return (
    <div className="relative">
      <button
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        disabled={true}
        className={`p-1 rounded-full transition-colors opacity-75 ${className}`}
        title={`Refresh available in ${formatTooltipTime(timeRemaining)}`}
      >
        <div className="flex items-center gap-1">
          <IoTime className="w-3 h-3 text-orange-500 dark:text-orange-400" />
          <span className="text-xs font-semibold text-orange-600 dark:text-orange-400">
            {formatTimeRemaining(timeRemaining)}
          </span>
        </div>
      </button>
      
      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute left-0 top-full mt-1 w-48 p-2 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg shadow-xl z-[999999]">
          <div className="flex items-center gap-1 mb-1">
            <IoTime className="w-3 h-3 text-orange-400" />
            <span className="font-semibold">Refresh Timer</span>
          </div>
          <p>You can refresh your rewards in {formatTooltipTime(timeRemaining)}.</p>
          <p className="text-gray-300 mt-1">Limited to once per 24 hours.</p>
        </div>
      )}
    </div>
  );
}
