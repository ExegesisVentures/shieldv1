/**
 * MetricTooltip Component - Explains what each metric means
 * File: components/analytics/MetricTooltip.tsx
 */

'use client';

import { useState } from 'react';
import { IoHelpCircle } from 'react-icons/io5';

interface MetricTooltipProps {
  id: string;
  explanation: string;
}

export const MetricTooltip = ({ id, explanation }: MetricTooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <button
      className="relative inline-flex items-center ml-2 cursor-help group"
      onClick={(e) => {
        e.preventDefault();
        setIsVisible(!isVisible);
      }}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      type="button"
    >
      <IoHelpCircle className="w-4 h-4 text-gray-400 hover:text-cyan-400 transition-colors" />
      {isVisible && (
        <div 
          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-72 p-3 bg-slate-900 border-2 border-cyan-500 rounded-lg text-sm text-gray-200 shadow-2xl z-50"
          onClick={(e) => e.stopPropagation()}
        >
          {explanation}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
            <div className="border-8 border-transparent border-t-cyan-500"></div>
          </div>
        </div>
      )}
    </button>
  );
};

