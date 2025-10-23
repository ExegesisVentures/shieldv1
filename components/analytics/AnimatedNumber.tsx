/**
 * AnimatedNumber Component
 * File: components/analytics/AnimatedNumber.tsx
 * 
 * Rolling odometer-style animated number component
 */

'use client';

import { useEffect, useState, useRef } from 'react';

interface AnimatedNumberProps {
  value: string;
  className?: string;
  duration?: number;
}

export const AnimatedNumber = ({ value, className = '', duration = 600 }: AnimatedNumberProps) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [rollingDigits, setRollingDigits] = useState<Set<number>>(new Set());
  const previousValueRef = useRef(value);
  const animationFrameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    // Handle initial render or placeholder values
    if (!previousValueRef.current || value === '--' || value === '...' || previousValueRef.current === '--' || previousValueRef.current === '...') {
      setDisplayValue(value);
      previousValueRef.current = value;
      return;
    }

    // If value hasn't changed, do nothing
    if (value === previousValueRef.current) {
      return;
    }

    // Find which digits are changing
    const oldChars = previousValueRef.current.split('');
    const newChars = value.split('');
    const changingIndices = new Set<number>();
    
    // Mark digits that are different
    for (let i = 0; i < Math.max(oldChars.length, newChars.length); i++) {
      const oldChar = oldChars[i] || '';
      const newChar = newChars[i] || '';
      if (oldChar !== newChar && /\d/.test(newChar)) {
        changingIndices.add(i);
      }
    }

    if (changingIndices.size === 0) {
      setDisplayValue(value);
      previousValueRef.current = value;
      return;
    }

    // Start rolling animation for changing digits
    setRollingDigits(changingIndices);
    
    // Animate the transition
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Animation complete
        setDisplayValue(value);
        setRollingDigits(new Set());
        previousValueRef.current = value;
      }
    };

    // Set the new value immediately (the CSS will handle the rolling animation)
    setDisplayValue(value);
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [value, duration]);

  return (
    <span className={`inline-flex items-center ${className}`}>
      {displayValue.split('').map((char, index) => {
        const isRolling = rollingDigits.has(index);
        const isDigit = /\d/.test(char);
        
        return (
          <span 
            key={`${index}`}
            className={`inline-block ${isRolling && isDigit ? 'animate-bounce' : ''} ${isDigit ? 'font-bold' : ''}`}
          >
            {char}
          </span>
        );
      })}
    </span>
  );
};

