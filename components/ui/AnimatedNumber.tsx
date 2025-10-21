"use client";

import { useEffect, useRef, useState } from "react";

interface AnimatedNumberProps {
  value: number;
  /**
   * Format type for the number
   * - 'currency': Adds $ prefix and 2 decimal places (e.g., $1,234.56)
   * - 'percentage': Adds % suffix and 2 decimal places (e.g., 12.34%)
   * - 'decimal': Custom decimal places (default 2)
   * - 'integer': No decimal places (e.g., 1,234)
   * - 'custom': Provide your own formatter function
   */
  format?: 'currency' | 'percentage' | 'decimal' | 'integer' | 'custom';
  /**
   * Number of decimal places (used for 'decimal' format)
   */
  decimals?: number;
  /**
   * Custom formatter function (used for 'custom' format)
   */
  formatter?: (value: number) => string;
  /**
   * Duration of animation in milliseconds
   */
  duration?: number;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Prefix to show before the number (e.g., currency symbol)
   */
  prefix?: string;
  /**
   * Suffix to show after the number (e.g., %)
   */
  suffix?: string;
  /**
   * Whether to use rolling digit animation (default: true)
   */
  useRollingAnimation?: boolean;
  /**
   * Whether to show + sign for positive numbers in percentage mode
   */
  showPlusSign?: boolean;
}

export default function AnimatedNumber({
  value,
  format = 'decimal',
  decimals = 2,
  formatter,
  duration = 800,
  className = '',
  prefix,
  suffix,
  useRollingAnimation = true,
  showPlusSign = false,
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const previousValueRef = useRef(value);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    // If value hasn't changed, do nothing
    if (value === previousValueRef.current) {
      return;
    }

    // Don't animate if component is being hovered (prevents glitching)
    if (isHovered) {
      setDisplayValue(value);
      previousValueRef.current = value;
      return;
    }

    if (!useRollingAnimation) {
      setDisplayValue(value);
      previousValueRef.current = value;
      return;
    }

    setIsAnimating(true);
    const startValue = previousValueRef.current;
    const endValue = value;
    const difference = endValue - startValue;

    // Easing function (ease-out-cubic for smooth deceleration)
    const easeOutCubic = (t: number): number => {
      return 1 - Math.pow(1 - t, 3);
    };

    const animate = (currentTime: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = currentTime;
      }

      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);

      const currentValue = startValue + difference * easedProgress;
      setDisplayValue(currentValue);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(endValue);
        setIsAnimating(false);
        startTimeRef.current = null;
        previousValueRef.current = endValue;
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [value, duration, useRollingAnimation, isHovered]);

  const formatNumber = (num: number): string => {
    if (format === 'custom' && formatter) {
      return formatter(num);
    }

    let formatted = '';

    switch (format) {
      case 'currency':
        formatted = num.toLocaleString('en-US', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        });
        return `$${formatted}`;

      case 'percentage':
        formatted = num.toFixed(decimals);
        const sign = showPlusSign && num > 0 ? '+' : '';
        return `${sign}${formatted}%`;

      case 'integer':
        formatted = Math.round(num).toLocaleString('en-US');
        return formatted;

      case 'decimal':
      default:
        formatted = num.toLocaleString('en-US', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        });
        return formatted;
    }
  };

  const formattedValue = formatNumber(displayValue);

  // Split the formatted value into parts for individual digit animation
  const parts = formattedValue.split('');

  return (
    <span 
      className={`inline-flex items-center ${className} ${isAnimating ? 'animate-pulse-subtle' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {prefix && <span className="mr-0.5">{prefix}</span>}
      {useRollingAnimation && !isHovered ? (
        <span className="inline-flex">
          {parts.map((char, index) => {
            // Check if character is a digit
            const isDigit = /\d/.test(char);
            
            return (
              <span
                key={`${char}-${index}`}
                className={`inline-block ${isDigit && isAnimating ? 'rolling-digit' : ''}`}
                style={{
                  animation: isDigit && isAnimating ? `roll ${duration}ms ease-out` : 'none',
                }}
              >
                {char}
              </span>
            );
          })}
        </span>
      ) : (
        <span>{formattedValue}</span>
      )}
      {suffix && <span className="ml-0.5">{suffix}</span>}

      <style jsx>{`
        @keyframes roll {
          0% {
            transform: translateY(-20%);
            opacity: 0.7;
          }
          50% {
            transform: translateY(5%);
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .rolling-digit {
          display: inline-block;
          transform-origin: center center;
        }

        .animate-pulse-subtle {
          animation: pulse-subtle 0.8s ease-out;
        }

        @keyframes pulse-subtle {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.95;
          }
        }
      `}</style>
    </span>
  );
}

/**
 * Specialized components for common use cases
 */

export function AnimatedCurrency({ 
  value, 
  decimals = 2,
  duration = 800,
  className = '',
  symbol = '$'
}: { 
  value: number; 
  decimals?: number;
  duration?: number;
  className?: string;
  symbol?: string;
}) {
  return (
    <AnimatedNumber
      value={value}
      format="decimal"
      decimals={decimals}
      duration={duration}
      className={className}
      prefix={symbol}
    />
  );
}

export function AnimatedPercentage({ 
  value, 
  decimals = 2,
  duration = 800,
  className = '',
  showPlusSign = true
}: { 
  value: number; 
  decimals?: number;
  duration?: number;
  className?: string;
  showPlusSign?: boolean;
}) {
  return (
    <AnimatedNumber
      value={value}
      format="percentage"
      decimals={decimals}
      duration={duration}
      className={className}
      showPlusSign={showPlusSign}
    />
  );
}

export function AnimatedBalance({ 
  value, 
  decimals = 2,
  duration = 800,
  className = ''
}: { 
  value: number; 
  decimals?: number;
  duration?: number;
  className?: string;
}) {
  return (
    <AnimatedNumber
      value={value}
      format="decimal"
      decimals={decimals}
      duration={duration}
      className={className}
    />
  );
}

export function AnimatedInteger({ 
  value, 
  duration = 600,
  className = ''
}: { 
  value: number; 
  duration?: number;
  className?: string;
}) {
  return (
    <AnimatedNumber
      value={value}
      format="integer"
      duration={duration}
      className={className}
    />
  );
}

