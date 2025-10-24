/**
 * CountdownPie Component - Visual countdown timer for data refresh
 * File: components/analytics/CountdownPie.tsx
 * 
 * Shows a circular progress indicator that drains over 30 seconds
 */

'use client';

import { useEffect, useState } from 'react';

interface CountdownPieProps {
  /** Duration in milliseconds (default: 30000 for 30 seconds) */
  duration?: number;
  /** Size of the pie in pixels */
  size?: number;
  /** Color of the progress arc */
  color?: string;
  /** Key to force reset when data is refreshed */
  refreshKey?: string;
}

export const CountdownPie = ({ 
  duration = 30000, 
  size = 20,
  color = '#06b6d4', // cyan-500
  refreshKey 
}: CountdownPieProps) => {
  const [progress, setProgress] = useState(100);
  const [startTime, setStartTime] = useState(Date.now());

  // Reset when refresh happens
  useEffect(() => {
    setStartTime(Date.now());
    setProgress(100);
  }, [refreshKey]);

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, duration - elapsed);
      const newProgress = (remaining / duration) * 100;
      
      setProgress(newProgress);
      
      // Reset when countdown completes
      if (remaining === 0) {
        setStartTime(Date.now());
      }
    }, 50); // Update every 50ms for smooth animation

    return () => clearInterval(interval);
  }, [startTime, duration]);

  // Calculate SVG circle properties
  const radius = (size - 4) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div 
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      title={`Refreshing in ${Math.ceil((progress / 100) * (duration / 1000))}s`}
    >
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        style={{ filter: 'drop-shadow(0 2px 4px rgba(6, 182, 212, 0.3))' }}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(100, 116, 139, 0.3)"
          strokeWidth="3"
        />
        
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 0.05s linear',
          }}
        />
      </svg>
      
      {/* Center dot */}
      <div 
        className="absolute"
        style={{
          width: size / 3,
          height: size / 3,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${color}, #3b82f6)`,
          boxShadow: `0 0 8px ${color}50`,
        }}
      />
    </div>
  );
};

