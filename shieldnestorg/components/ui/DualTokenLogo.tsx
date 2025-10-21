/**
 * DualTokenLogo Component
 * Displays two equal-sized token logos for liquidity pool (LP) tokens
 * File: shuieldnestorg/components/ui/DualTokenLogo.tsx
 */

import React from 'react';

interface DualTokenLogoProps {
  token0Logo: string;
  token1Logo: string;
  token0Symbol: string;
  token1Symbol: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Renders two overlapping token logos for LP tokens
 * ROLL (token0) at bottom-left in front, CORE (token1) at top-right behind
 */
export default function DualTokenLogo({
  token0Logo,
  token1Logo,
  token0Symbol,
  token1Symbol,
  size = 'md',
  className = '',
}: DualTokenLogoProps) {
  // Size configurations - tighter fit
  const sizeConfig = {
    sm: {
      containerSize: 'w-12 h-10',
      logoSize: 'w-7 h-7',
    },
    md: {
      containerSize: 'w-16 h-14',
      logoSize: 'w-9 h-9',
    },
    lg: {
      containerSize: 'w-20 h-16',
      logoSize: 'w-11 h-11',
    },
  };

  const config = sizeConfig[size];

  return (
    <div className={`relative ${config.containerSize} ${className}`}>
      {/* Token 1 (CORE) - Top right, behind, no background */}
      <div
        className={`absolute top-0 right-0 ${config.logoSize} rounded-full shadow-md flex items-center justify-center overflow-hidden z-0`}
        style={{ backgroundColor: 'transparent' }}
      >
        <img
          src={token1Logo}
          alt={token1Symbol}
          className="w-full h-full object-contain"
          onError={(e) => {
            console.error(`❌ Failed to load ${token1Symbol} logo: ${token1Logo}`);
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>

      {/* Token 0 (ROLL) - Bottom left, in front, no border */}
      <div
        className={`absolute bottom-0 left-0 ${config.logoSize} rounded-full shadow-lg flex items-center justify-center overflow-hidden z-10`}
        style={{ backgroundColor: 'transparent' }}
      >
        <img
          src={token0Logo}
          alt={token0Symbol}
          className="w-full h-full object-contain"
          onError={(e) => {
            console.error(`❌ Failed to load ${token0Symbol} logo: ${token0Logo}`);
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>
    </div>
  );
}

