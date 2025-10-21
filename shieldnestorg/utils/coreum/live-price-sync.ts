/**
 * ============================================
 * LIVE PRICE SYNCHRONIZATION SERVICE
 * ============================================
 * 
 * This service synchronizes live CoreDEX API data with our database
 * for optimal performance while maintaining real-time accuracy.
 * 
 * File: /utils/coreum/live-price-sync.ts
 */

import { createSupabaseClient } from '@/utils/supabase/client';
import { getCachedPrice, updateCachedPrice } from './token-database';
import { trackAsyncOperation } from '@/utils/performance-monitor';
import { buildCoreDexUrl, COREDEX_NETWORK_HEADER } from '@/utils/coreum/coredex-config';

// Global type declaration for price syncing flag
declare global {
  var isPriceSyncing: boolean | undefined;
}

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface LivePriceData {
  pair_id: string;
  price: number;
  price_change_24h?: number;
  volume_24h?: number;
  liquidity?: number;
  reserve_base?: number;
  reserve_quote?: number;
  source: 'coredx-api' | 'fallback';
  last_updated: string;
}

export interface CoreDexTicker {
  pair: string;
  price: number;
  volume_24h: number;
  high_24h: number;
  low_24h: number;
  change_24h: number;
  last_updated: string;
}

// ============================================
// LIVE DATA FETCHING
// ============================================

/**
 * Fetch live ticker data from CoreDEX API
 */
export async function fetchLiveTickersFromCoreDex(): Promise<CoreDexTicker[]> {
  return trackAsyncOperation('fetchLiveTickersFromCoreDex', async () => {
    try {
      console.log('🔄 [Live Sync] Fetching live tickers from CoreDEX API...');
      
      const response = await fetch(buildCoreDexUrl('/tickers'), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Network': COREDEX_NETWORK_HEADER,
        },
      });

      if (!response.ok) {
        throw new Error(`CoreDEX API returned ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      const tickers = data.tickers || data.Tickers || data;
      
      console.log(`✅ [Live Sync] Fetched ${Array.isArray(tickers) ? tickers.length : 0} live tickers`);
      return Array.isArray(tickers) ? tickers : [];
      
    } catch (error) {
      console.error('❌ [Live Sync] Error fetching live tickers:', error);
      return [];
    }
  });
}

/**
 * Fetch live currencies from CoreDEX API
 */
export async function fetchLiveCurrenciesFromCoreDex(): Promise<any[]> {
  try {
    console.log('🔄 [Live Sync] Fetching live currencies from CoreDEX API...');
    
    const response = await fetch(buildCoreDexUrl('/currencies'), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Network': COREDEX_NETWORK_HEADER,
      },
    });

    if (!response.ok) {
      throw new Error(`CoreDEX API returned ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    const currencies = data.Currencies || data.currencies || data;
    
    console.log(`✅ [Live Sync] Fetched ${Array.isArray(currencies) ? currencies.length : 0} live currencies`);
    return Array.isArray(currencies) ? currencies : [];
    
  } catch (error) {
    console.error('❌ [Live Sync] Error fetching live currencies:', error);
    return [];
  }
}

// ============================================
// PRICE SYNCHRONIZATION
// ============================================

/**
 * Map CoreDEX ticker data to our database pairs
 */
async function mapTickerToPair(ticker: CoreDexTicker): Promise<LivePriceData | null> {
  try {
    const supabase = createSupabaseClient();
    
    // Try to find a matching pair in our database
    // CoreDEX pairs are in format like "ucore_usdc" or "CORE-USDC"
    const pairSymbol = ticker.pair.replace('_', '/').replace('-', '/');
    
    // Search for pairs that might match this ticker
    const { data: pairs, error } = await supabase
      .from('coreum_pairs')
      .select('*')
      .or(`symbol.ilike.%${pairSymbol}%,symbol.ilike.%${ticker.pair}%`)
      .eq('is_active', true)
      .limit(5);

    if (error) {
      console.error('Error searching for pairs:', error);
      return null;
    }

    if (!pairs || pairs.length === 0) {
      // No matching pair found in database
      return null;
    }

    // Use the first matching pair
    const pair = pairs[0];
    
    return {
      pair_id: pair.pair_id,
      price: ticker.price,
      price_change_24h: ticker.change_24h,
      volume_24h: ticker.volume_24h,
      source: 'coredx-api',
      last_updated: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Error mapping ticker to pair:', error);
    return null;
  }
}

/**
 * Synchronize live CoreDEX data with database
 */
export async function syncLivePricesToDatabase(): Promise<{
  synced: number;
  errors: number;
  total: number;
}> {
  try {
    console.log('🚀 [Live Sync] Starting price synchronization...');
    
    // Fetch live data from CoreDEX API
    const liveTickers = await fetchLiveTickersFromCoreDex();
    
    if (liveTickers.length === 0) {
      console.log('⚠️ [Live Sync] No live tickers available');
      return { synced: 0, errors: 0, total: 0 };
    }

    let synced = 0;
    let errors = 0;

    // Process each ticker
    for (const ticker of liveTickers) {
      try {
        const priceData = await mapTickerToPair(ticker);
        
        if (priceData) {
          const success = await updateCachedPrice(priceData);
          if (success) {
            synced++;
            console.log(`✅ [Live Sync] Updated ${priceData.pair_id}: $${priceData.price.toFixed(6)}`);
          } else {
            errors++;
            console.log(`❌ [Live Sync] Failed to update ${priceData.pair_id}`);
          }
        }
      } catch (error) {
        errors++;
        console.error(`❌ [Live Sync] Error processing ticker ${ticker.pair}:`, error);
      }
    }

    console.log(`🎉 [Live Sync] Synchronization complete: ${synced} synced, ${errors} errors, ${liveTickers.length} total`);
    
    return {
      synced,
      errors,
      total: liveTickers.length
    };
    
  } catch (error) {
    console.error('❌ [Live Sync] Synchronization failed:', error);
    return { synced: 0, errors: 1, total: 0 };
  }
}

// ============================================
// HYBRID PRICE FETCHING
// ============================================

/**
 * Get price with hybrid approach: database cache + live fallback
 * Optimized with longer cache TTL and reduced API calls
 */
export async function getHybridPrice(pairId: string, forceLive: boolean = false): Promise<LivePriceData | null> {
  try {
    // First, try to get cached price
    if (!forceLive) {
      const cachedPrice = await getCachedPrice(pairId);
      if (cachedPrice) {
        // Check if cache is fresh (less than 10 minutes old - increased from 5 minutes)
        const cacheAge = Date.now() - new Date(cachedPrice.last_updated).getTime();
        if (cacheAge < 10 * 60 * 1000) { // 10 minutes
          console.log(`💾 [Hybrid] Using cached price for ${pairId}: $${cachedPrice.price.toFixed(6)}`);
          return {
            ...cachedPrice,
            source: 'coredx-api' as const
          };
        }
      }
    }

    // If no fresh cache or force live, fetch from CoreDEX API
    console.log(`🔄 [Hybrid] Fetching live price for ${pairId}...`);
    
    // Get pair info to construct CoreDEX symbol
    const supabase = createSupabaseClient();
    const { data: pair, error } = await supabase
      .from('coreum_pairs')
      .select('*')
      .eq('pair_id', pairId)
      .single();

    if (error || !pair) {
      console.error('Error fetching pair info:', error);
      return null;
    }

    // Try to fetch live price from CoreDEX API
    const liveTickers = await fetchLiveTickersFromCoreDex();
    const matchingTicker = liveTickers.find(ticker => {
      // Try different matching strategies
      const pairSymbol = ticker.pair.replace('_', '/').replace('-', '/');
      return pair.symbol.includes(pairSymbol) || 
             pair.symbol.includes(ticker.pair) ||
             ticker.pair.includes(pair.base_denom) ||
             ticker.pair.includes(pair.quote_denom);
    });

    if (matchingTicker) {
      const livePriceData: LivePriceData = {
        pair_id: pairId,
        price: matchingTicker.price,
        price_change_24h: matchingTicker.change_24h,
        volume_24h: matchingTicker.volume_24h,
        source: 'coredx-api',
        last_updated: new Date().toISOString()
      };

      // Update cache with live data
      await updateCachedPrice(livePriceData);
      
      console.log(`✅ [Hybrid] Live price for ${pairId}: $${livePriceData.price.toFixed(6)}`);
      return livePriceData;
    }

    // Fallback to cached price if available
    const cachedPrice = await getCachedPrice(pairId);
    if (cachedPrice) {
      console.log(`⚠️ [Hybrid] Using stale cached price for ${pairId}: $${cachedPrice.price.toFixed(6)}`);
      return {
        ...cachedPrice,
        source: 'coredx-api' as const
      };
    }

    console.log(`❌ [Hybrid] No price data available for ${pairId}`);
    return null;
    
  } catch (error) {
    console.error('Error in hybrid price fetch:', error);
    return null;
  }
}

// ============================================
// BULK OPERATIONS
// ============================================

/**
 * Get multiple prices with hybrid approach
 * Optimized with smaller batches and longer delays to reduce API load
 */
export async function getBulkHybridPrices(pairIds: string[]): Promise<Record<string, LivePriceData | null>> {
  const results: Record<string, LivePriceData | null> = {};
  
  // Process in smaller batches to avoid overwhelming the API
  const batchSize = 5; // Reduced from 10 to 5
  for (let i = 0; i < pairIds.length; i += batchSize) {
    const batch = pairIds.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (pairId) => {
      const price = await getHybridPrice(pairId);
      return { pairId, price };
    });
    
    const batchResults = await Promise.all(batchPromises);
    
    batchResults.forEach(({ pairId, price }) => {
      results[pairId] = price;
    });
    
    // Longer delay between batches to reduce server load
    if (i + batchSize < pairIds.length) {
      await new Promise(resolve => setTimeout(resolve, 250)); // Increased from 100ms to 250ms
    }
  }
  
  return results;
}

// ============================================
// AUTOMATED SYNC SERVICE
// ============================================

/**
 * Start automated price synchronization service
 * Optimized to run less frequently to reduce server load
 */
export function startPriceSyncService(intervalMinutes: number = 10): NodeJS.Timeout {
  console.log(`🔄 [Sync Service] Starting automated price sync every ${intervalMinutes} minutes`);
  
  const interval = setInterval(async () => {
    try {
      // Only sync if we're not already syncing
      if (!global.isPriceSyncing) {
        global.isPriceSyncing = true;
        await syncLivePricesToDatabase();
        global.isPriceSyncing = false;
      }
    } catch (error) {
      console.error('❌ [Sync Service] Automated sync failed:', error);
      global.isPriceSyncing = false;
    }
  }, intervalMinutes * 60 * 1000);
  
  // Run initial sync only if not already running
  if (!global.isPriceSyncing) {
    global.isPriceSyncing = true;
    syncLivePricesToDatabase().finally(() => {
      global.isPriceSyncing = false;
    });
  }
  
  return interval;
}

/**
 * Stop automated price synchronization service
 */
export function stopPriceSyncService(interval: NodeJS.Timeout): void {
  console.log('🛑 [Sync Service] Stopping automated price sync');
  clearInterval(interval);
}
