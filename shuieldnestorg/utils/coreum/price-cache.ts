/**
 * Browser-Based Price Cache
 * Caches token prices in localStorage to minimize API calls and improve UX
 * 
 * CACHING STRATEGY:
 * - Prices cached in localStorage (persists across sessions)
 * - 10-minute cache TTL (same as in-memory cache)
 * - Graceful fallback when API is unavailable
 * - No errors thrown to users - always returns a price
 */

export interface CachedPrice {
  price: number;
  change24h: number;
  timestamp: number;
}

const CACHE_KEY_PREFIX = 'coreum_price_';
const CACHE_TTL = 600000; // 10 minutes

/**
 * Get cached price from localStorage
 * @param allowExpired If true, returns expired cache (useful for fallback)
 */
export function getCachedPrice(symbol: string, allowExpired: boolean = false): CachedPrice | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const cached = localStorage.getItem(`${CACHE_KEY_PREFIX}${symbol}`);
    if (!cached) return null;
    
    const data: CachedPrice = JSON.parse(cached);
    
    // Check if cache is still valid
    if (Date.now() - data.timestamp < CACHE_TTL) {
      return data;
    }
    
    // If expired but caller allows expired cache, return it
    if (allowExpired) {
      return data;
    }
    
    // Cache expired and caller wants fresh data only
    return null;
  } catch (error) {
    console.warn(`Failed to read price cache for ${symbol}:`, error);
    return null;
  }
}

/**
 * Save price to localStorage cache
 */
export function setCachedPrice(symbol: string, price: number, change24h: number): void {
  if (typeof window === 'undefined') return;
  
  try {
    const data: CachedPrice = {
      price,
      change24h,
      timestamp: Date.now(),
    };
    
    localStorage.setItem(`${CACHE_KEY_PREFIX}${symbol}`, JSON.stringify(data));
  } catch (error) {
    // localStorage might be full or unavailable - fail silently
    console.warn(`Failed to cache price for ${symbol}:`, error);
  }
}

/**
 * Clear all cached prices (useful for forced refresh)
 */
export function clearAllPriceCache(): void {
  if (typeof window === 'undefined') return;
  
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(CACHE_KEY_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.warn('Failed to clear price cache:', error);
  }
}

/**
 * Get cache statistics (for debugging)
 */
export function getCacheStats(): {
  cached: number;
  fresh: number;
  expired: number;
} {
  if (typeof window === 'undefined') {
    return { cached: 0, fresh: 0, expired: 0 };
  }
  
  const stats = { cached: 0, fresh: 0, expired: 0 };
  
  try {
    const keys = Object.keys(localStorage);
    const now = Date.now();
    
    keys.forEach(key => {
      if (key.startsWith(CACHE_KEY_PREFIX)) {
        stats.cached++;
        
        try {
          const data: CachedPrice = JSON.parse(localStorage.getItem(key) || '{}');
          if (now - data.timestamp < CACHE_TTL) {
            stats.fresh++;
          } else {
            stats.expired++;
          }
        } catch {
          stats.expired++;
        }
      }
    });
  } catch (error) {
    console.warn('Failed to get cache stats:', error);
  }
  
  return stats;
}
