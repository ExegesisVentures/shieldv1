/**
 * Utility functions for formatting values
 * File: utils/formatters.ts
 */

/**
 * Format a number to a compact string (e.g., 15420 → "15.4K")
 */
export function formatCompactNumber(value: number): string {
  if (value === 0) return '0';
  
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
}

/**
 * Format a number with commas (e.g., 15420 → "15,420")
 */
export function formatNumberWithCommas(value: number): string {
  return value.toLocaleString('en-US');
}

/**
 * Format CORE token amount
 */
export function formatCORE(value: number, compact: boolean = false): string {
  if (compact) {
    return `${formatCompactNumber(value)} CORE`;
  }
  return `${formatNumberWithCommas(value)} CORE`;
}

