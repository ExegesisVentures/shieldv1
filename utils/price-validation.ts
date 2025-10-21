/**
 * Price Validation Utility
 * 
 * Validates token prices to prevent unrealistic values from being displayed
 * and provides fallback mechanisms for price data.
 * 
 * File: /utils/price-validation.ts
 */

interface PriceValidationResult {
  isValid: boolean;
  correctedPrice?: number;
  reason?: string;
}

/**
 * Validate token price based on symbol and expected ranges
 */
export function validateTokenPrice(symbol: string, price: number): PriceValidationResult {
  // Define reasonable price ranges for different tokens
  const priceRanges: Record<string, { min: number; max: number; reason: string }> = {
    'CORE': { min: 0.01, max: 10.0, reason: 'CORE token price should be between $0.01 and $10' },
    'KONG': { min: 0.000000001, max: 0.001, reason: 'KONG token price should be between $0.000000001 and $0.001' },
    'COZY': { min: 0.001, max: 1.0, reason: 'COZY token price should be between $0.001 and $1' },
    'MART': { min: 0.001, max: 1.0, reason: 'MART token price should be between $0.001 and $1' },
    'CAT': { min: 0.0001, max: 0.1, reason: 'CAT token price should be between $0.0001 and $0.1' },
    'XRP': { min: 0.1, max: 10.0, reason: 'XRP price should be between $0.1 and $10' },
    'ATOM': { min: 1.0, max: 50.0, reason: 'ATOM price should be between $1 and $50' },
  };

  const range = priceRanges[symbol];
  if (!range) {
    // No specific range defined, use general validation
    if (price <= 0 || price > 10000) {
      return {
        isValid: false,
        reason: `Price ${price} seems unrealistic for token ${symbol}`
      };
    }
    return { isValid: true };
  }

  if (price < range.min || price > range.max) {
    // Try to correct the price based on common issues
    let correctedPrice = price;
    
    // Common correction: if price seems too high, it might be in wrong units
    if (price > range.max * 1000) {
      correctedPrice = price / 1000000; // Might be in micro-units
    } else if (price > range.max * 100) {
      correctedPrice = price / 1000; // Might be in milli-units
    }
    
    // If correction is still invalid, use a reasonable fallback
    if (correctedPrice < range.min || correctedPrice > range.max) {
      correctedPrice = (range.min + range.max) / 2; // Use middle of range
    }

    return {
      isValid: false,
      correctedPrice,
      reason: `${range.reason}. Original price: $${price}, corrected to: $${correctedPrice}`
    };
  }

  return { isValid: true };
}

/**
 * Get fallback price for a token when validation fails
 */
export function getFallbackPrice(symbol: string): number {
  const fallbackPrices: Record<string, number> = {
    'CORE': 0.12,
    'KONG': 0.000000015,
    'COZY': 0.12,
    'MART': 0.15,
    'CAT': 0.001,
    'XRP': 0.52,
    'ATOM': 7.50,
    'OSMO': 0.45,
    'SOLO': 0.12,
    'LP': 0,  // LP tokens need pool-based calculation
    'ULP': 0, // Unknown LP tokens
  };

  return fallbackPrices[symbol] || 0; // Default fallback for unknown tokens (including LP tokens)
}

/**
 * Validate and correct price data
 */
export function validateAndCorrectPrice(symbol: string, price: number): { price: number; wasCorrected: boolean; reason?: string } {
  const validation = validateTokenPrice(symbol, price);
  
  if (validation.isValid) {
    return { price, wasCorrected: false };
  }
  
  const correctedPrice = validation.correctedPrice || getFallbackPrice(symbol);
  
  console.warn(`⚠️ [Price Validation] ${symbol}: ${validation.reason}`);
  
  return {
    price: correctedPrice,
    wasCorrected: true,
    reason: validation.reason
  };
}
