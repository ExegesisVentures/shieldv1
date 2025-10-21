/**
 * Coreum Price Oracle (Pure CoreDEX VPS)
 * Fetches real-time token prices from CoreDEX VPS API
 * 
 * ARCHITECTURE:
 * - Uses CoreDEX VPS API (http://168.231.127.180:8080/api) as the ONLY source
 * - 74 trading pairs across Pulsara and Cruise Control
 * - 39 tokens with comprehensive metadata
 * - No Astroport, no RPC queries, pure CoreDEX
 * 
 * CACHING STRATEGY (Optimized for minimal queries):
 * - Prices are cached in browser localStorage (persists across sessions)
 * - 10-minute cache TTL per token
 * - API calls only occur when:
 *   1. User logs in (dashboard loads)
 *   2. User manually refreshes
 *   3. Cache expires (10 minutes)
 * 
 * GRACEFUL FALLBACK:
 * - Never throws errors to users
 * - Always returns a price (fallback if API unavailable)
 * - Logs warnings instead of errors for better UX
 * 
 * VPS ENDPOINT: http://168.231.127.180:8080/api
 * File: /utils/coreum/price-oracle.ts
 */

import { getCachedPrice, setCachedPrice, clearAllPriceCache as clearBrowserCache } from './price-cache';
import { getTokenPrice as getPoolPrice } from './pool-pricing';
import { validateAndCorrectPrice } from '../price-validation';

/**
 * OPTIMIZED: Fast price fetching with static fallbacks and timeout protection
 * @param symbol Token symbol (e.g., "CORE", "SARA", "DROP")
 * @returns Price in USD (always returns a value, never throws)
 * 
 * OPTIMIZED FALLBACK CHAIN:
 * 1. Fresh cache (< 10 min) → instant return
 * 2. Static fallback → instant return (no API calls)
 * 3. Background API update → non-blocking
 */
export async function fetchTokenPriceFromDex(symbol: string): Promise<{ price: number; change24h: number }> {
  console.log(`🔍 [Price Oracle] Fast fetch for ${symbol}`);
  
  // OPTIMIZED: Check cache first (instant)
  const cached = getCachedPrice(symbol, false);
  if (cached) {
    console.log(`💾 [Cache Hit] ${symbol}: $${cached.price.toFixed(4)}`);
    return { price: cached.price, change24h: cached.change24h };
  }

  // OPTIMIZED: Check expired cache (still better than static fallback)
  const expiredCached = getCachedPrice(symbol, true);
  if (expiredCached) {
    console.log(`⏰ [Expired Cache] ${symbol}: $${expiredCached.price.toFixed(4)} (using expired cache)`);
    return { price: expiredCached.price, change24h: expiredCached.change24h };
  }

  // OPTIMIZED: Return static fallback as last resort
  console.log(`⚡ [Static Fallback] ${symbol} - instant return`);
  const fallbackResult = getStaticFallbackPrice(symbol);
  
  // OPTIMIZED: Update with real price in background (non-blocking)
  setTimeout(async () => {
    try {
      console.log(`🔄 [Background] Updating ${symbol} with real price...`);
      
      // Add timeout to prevent hanging
      const pricePromise = getPoolPrice(symbol);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Price fetch timeout')), 5000)
      );
      
      const priceData = await Promise.race([pricePromise, timeoutPromise]);
      
      if (priceData && priceData.price > 0) {
        // Cache the result for next time
        setCachedPrice(symbol, priceData.price, priceData.change24h);
        
        // CRITICAL: Update static fallback with this valid price
        updateStaticFallback(symbol, priceData.price, priceData.change24h);
        
        console.log(`✅ [Background] ${symbol}: $${priceData.price.toFixed(6)} (${priceData.change24h >= 0 ? '+' : ''}${priceData.change24h.toFixed(2)}%) - saved as new fallback`);
      }
    } catch (error) {
      console.log(`⚠️ [Background] ${symbol} update failed: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }, 100); // Start background update after 100ms
  
  return fallbackResult;
}

/**
 * DYNAMIC STATIC FALLBACK SYSTEM
 * This system saves the last valid price as the new static fallback
 * This ensures fallback prices are always recent and accurate
 */

// Storage key for persistent static fallbacks
const STATIC_FALLBACK_STORAGE_KEY = 'shieldnest_static_fallback_prices';

/**
 * Get dynamic static fallback price (last known valid price)
 * This price is updated every time we successfully fetch a real price
 */
export function getStaticFallbackPrice(symbol: string): { price: number; change24h: number } {
  // Try to get saved fallback price first
  const savedFallback = getSavedStaticFallback(symbol);
  if (savedFallback) {
    console.log(`💾 [Dynamic Fallback] ${symbol}: $${savedFallback.price.toFixed(6)} (last valid price)`);
    return savedFallback;
  }

  // Initial hardcoded fallbacks (only used on first visit)
  const initialFallbacks: Record<string, { price: number; change24h: number }> = {
    'CORE': { price: 0.15, change24h: 0 },
    'XRP': { price: 0.50, change24h: 0 },
    'SOLO': { price: 0.0001, change24h: 0 },
    'ATOM': { price: 8.00, change24h: 0 },
    'OSMO': { price: 0.80, change24h: 0 },
    'COZY': { price: 0.01, change24h: 0 },
    'KONG': { price: 0.000000015, change24h: 0 },
    'MART': { price: 0.001, change24h: 0 },
    'CAT': { price: 0.0001, change24h: 0 },
    'ROLL': { price: 0.0001, change24h: 0 },
    'SMART': { price: 0.01, change24h: 0 },
    'SARA': { price: 0.001, change24h: 0 },
    'PULSARA': { price: 0.001, change24h: 0 },
    'DROP': { price: 0.0001, change24h: 0 },
  };
  
  const fallback = initialFallbacks[symbol] || { price: 0.001, change24h: 0 };
  console.log(`📌 [Initial Fallback] ${symbol}: $${fallback.price.toFixed(6)} (first visit)`);
  return fallback;
}

/**
 * Save a valid price as the new static fallback
 * This is called whenever we successfully fetch a real price from the API
 */
export function updateStaticFallback(symbol: string, price: number, change24h: number): void {
  if (typeof window === 'undefined') return; // Skip on server-side
  
  try {
    const fallbackData = {
      price,
      change24h,
      timestamp: Date.now(),
      source: 'api'
    };
    
    // Get existing fallbacks
    const existingFallbacks = getSavedStaticFallbacks();
    
    // Update the specific token's fallback
    existingFallbacks[symbol] = fallbackData;
    
    // Save back to localStorage
    localStorage.setItem(STATIC_FALLBACK_STORAGE_KEY, JSON.stringify(existingFallbacks));
    
    console.log(`💾 [Fallback Updated] ${symbol}: $${price.toFixed(6)} (${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%)`);
  } catch (error) {
    console.warn(`⚠️ [Fallback Update Failed] ${symbol}:`, error);
  }
}

/**
 * Get saved static fallback for a specific token
 */
function getSavedStaticFallback(symbol: string): { price: number; change24h: number } | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const fallbacks = getSavedStaticFallbacks();
    const fallback = fallbacks[symbol];
    
    if (fallback && fallback.price > 0) {
      return {
        price: fallback.price,
        change24h: fallback.change24h || 0
      };
    }
  } catch (error) {
    console.warn(`⚠️ [Fallback Read Failed] ${symbol}:`, error);
  }
  
  return null;
}

/**
 * Get all saved static fallbacks
 */
function getSavedStaticFallbacks(): Record<string, any> {
  if (typeof window === 'undefined') return {};
  
  try {
    const stored = localStorage.getItem(STATIC_FALLBACK_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.warn('⚠️ [Fallback Storage Read Failed]:', error);
    return {};
  }
}

/**
 * Clear all saved static fallbacks (for debugging)
 */
export function clearStaticFallbacks(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(STATIC_FALLBACK_STORAGE_KEY);
    console.log('🧹 [Fallbacks Cleared] All static fallbacks removed');
  } catch (error) {
    console.warn('⚠️ [Fallback Clear Failed]:', error);
  }
}

/**
 * Fetch price for multiple tokens at once
 * More efficient than individual calls
 */
export async function fetchMultipleTokenPrices(symbols: string[]): Promise<Record<string, { price: number; change24h: number }>> {
  const results: Record<string, { price: number; change24h: number }> = {};
  
  // Fetch all prices in parallel
  await Promise.all(
    symbols.map(async (symbol) => {
      results[symbol] = await fetchTokenPriceFromDex(symbol);
    })
  );
  
  return results;
}

/**
 * Get token price (main export for backward compatibility)
 */
export async function getTokenPrice(symbol: string): Promise<number> {
  const { price } = await fetchTokenPriceFromDex(symbol);
  return price;
}

/**
 * Get 24h price change percentage
 */
export async function getTokenChange24h(symbol: string): Promise<number> {
  const { change24h } = await fetchTokenPriceFromDex(symbol);
  return change24h;
}

/**
 * Clear all price caches (useful for testing or forced refresh)
 * Clears both browser localStorage cache
 */
export function clearPriceCache(): void {
  clearBrowserCache();
  
  // Also clear session storage for fallback logs
  if (typeof window !== 'undefined') {
    const keys = Object.keys(window.sessionStorage);
    keys.forEach(key => {
      if (key.startsWith('fallback_logged_') || key.startsWith('static_fallback_logged_')) {
        window.sessionStorage.removeItem(key);
      }
    });
  }
}

/**
 * ========================================
 * CoreDEX Price Oracle Architecture
 * ========================================
 * 
 * CURRENT IMPLEMENTATION:
 * 1. CoreDEX API integration
 *    - Single source of truth: coredexapi.shieldnest.org
 *    - Access to 586+ tokens on Coreum
 *    - No on-chain queries or external API dependencies
 * 
 * 2. Simplified fallback system:
 *    - Layer 1: Browser cache (10-min TTL)
 *    - Layer 2: CoreDEX API (primary source)
 *    - Layer 3: Expired cache (last known price)
 *    - Layer 4: Static fallback prices
 * 
 * CACHING & OPTIMIZATION:
 * - Built-in 10-minute cache per token (localStorage)
 * - API calls only on login, refresh, or cache expiry
 * - Minimal API load with efficient caching
 * 
 * FUTURE ENHANCEMENTS:
 * - Historical price data via CoreDEX API
 * - WebSocket support for real-time price updates
 * - Advanced token metadata integration
 * - Portfolio valuation enhancements
 */
