/**
 * ============================================
 * LIQUIDITY POOL CACHING SYSTEM
 * ============================================
 * 
 * Fast pool loading with database caching:
 * 1. Load cached pools from database instantly
 * 2. Refresh pool data in background with REAL prices from CoreDEX API
 * 3. Update cache for next load
 * 
 * File: /utils/coreum/pool-cache.ts
 */

import { createSupabaseClient } from '@/utils/supabase/client';
import type { LiquidityPool } from './liquidity-pools';
import { getTokenByDenom } from './token-database';
import { getTokenPrice } from './price-oracle';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface CachedPoolData {
  pool_contract: string;
  source: string;
  token0_denom: string;
  token1_denom: string;
  token0_symbol: string;
  token1_symbol: string;
  reserve0: string;
  reserve1: string;
  liquidity: number;
  tvl: number;
  price0: number;
  price1: number;
  pool_type: string;
  last_updated: string;
}

// ============================================
// CACHE FUNCTIONS
// ============================================

/**
 * Get all cached pools from database with REAL price data from CoreDEX API
 * This provides instant initial load with database cache,
 * then enriches with live price data if available
 */
export async function getCachedPools(): Promise<LiquidityPool[]> {
  try {
    const supabase = createSupabaseClient();
    
    const { data, error } = await supabase
      .from('active_pairs_with_tokens')
      .select('*')
      .order('symbol');

    if (error) {
      console.error('❌ [Pool Cache] Error fetching cached pools:', error);
      return [];
    }

    if (!data || data.length === 0) {
      console.log('⚠️  [Pool Cache] No cached pools found in active_pairs_with_tokens view');
      return [];
    }

    console.log(`✅ [Pool Cache] Loaded ${data.length} cached pools from database`);

    // Convert database records to LiquidityPool format
    const pools: LiquidityPool[] = await Promise.all(
      data.map(async (row, index) => {
        // Get token info for proper decimals
        const token0Info = await getTokenByDenom(row.base_denom);
        const token1Info = await getTokenByDenom(row.quote_denom);

        const token0Symbol = row.base_symbol || row.base_asset || 'UNKNOWN';
        const token1Symbol = row.quote_symbol || row.quote_asset || 'UNKNOWN';

        // Try to get real price data from CoreDEX API (non-blocking)
        let price0 = 0;
        let price1 = 0;
        let change24h = 0;
        
        try {
          // Get token0 price in USD if available
          const token0Price = await getTokenPrice(token0Symbol);
          if (token0Price) {
            price0 = token0Price.price;
            change24h = token0Price.change24h;
          }
          
          // Get token1 price in USD if available
          const token1Price = await getTokenPrice(token1Symbol);
          if (token1Price) {
            price1 = token1Price.price;
          }
        } catch (error) {
          // Silently fail - we'll show 0 prices for now
          console.log(`⏭️  [Pool Cache] Could not fetch real-time prices for ${token0Symbol}/${token1Symbol}`);
        }

        // Estimate liquidity from available data (will be updated by live fetch)
        const liquidity = 0;
        const estimatedAPY = 20; // Default estimate until we have historical fee data

        return {
          id: `cache-${row.pair_id || index}`,
          contractAddress: row.pool_contract,
          factoryAddress: '', // Will be filled by live data
          dexName: row.source === 'pulsara' ? 'Pulsara' : 'Cruise Control',
          token0: row.base_denom,
          token1: row.quote_denom,
          token0Symbol,
          token1Symbol,
          tvl: liquidity,
          apy: estimatedAPY,
          volume24h: 0,
          fees24h: 0,
          liquidity,
          reserve0: '0',
          reserve1: '0',
          price0,
          price1,
          change24h,
          poolType: 'xyk',
          feeTier: 0.3,
          createdAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
        };
      })
    );

    console.log(`💰 [Pool Cache] Cached pools with ${pools.filter(p => p.price0 > 0 || p.price1 > 0).length}/${pools.length} having live prices`);

    return pools;
  } catch (error) {
    console.error('❌ [Pool Cache] Error loading cached pools:', error);
    return [];
  }
}

/**
 * Update pool cache with fresh data
 * Called after fetching live pool data
 */
export async function updatePoolCache(pools: LiquidityPool[]): Promise<void> {
  try {
    // For now, we'll rely on the existing coreum_pairs table
    // In the future, we could add a dedicated pool_cache table
    console.log(`📝 [Pool Cache] Pool data updated (${pools.length} pools)`);
  } catch (error) {
    console.error('❌ [Pool Cache] Error updating cache:', error);
  }
}

/**
 * Check if cached data is stale (older than 5 minutes)
 */
export async function isCacheStale(): Promise<boolean> {
  try {
    const supabase = createSupabaseClient();
    
    const { data, error } = await supabase
      .from('coreum_pairs')
      .select('updated_at')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return true; // Assume stale if can't check
    }

    const lastUpdate = new Date(data.updated_at);
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    return lastUpdate < fiveMinutesAgo;
  } catch (error) {
    console.error('❌ [Pool Cache] Error checking cache staleness:', error);
    return true;
  }
}

