/**
 * Astroport Liquidity Pools Integration
 * Fetches real-time liquidity pool data from Astroport DEXs on Coreum
 * Supports: Cruise Control, Pulsara
 */

import {
  ASTROPORT_FACTORIES,
  queryAllPairs,
  queryPool,
  getDenomFromAsset,
  formatPoolType,
  calculateLiquidity,
  calculatePriceFromReserves,
  type PairInfo,
  type PoolType,
} from './astroport';
import { getTokenByDenom } from './token-database';
import { getCachedPools, updatePoolCache, isCacheStale } from './pool-cache';

// Removed pulsara-oracle import - using CoreDEX for price data only

export interface LiquidityPool {
  id: string;
  contractAddress: string;
  factoryAddress: string;
  dexName: string;
  token0: string;
  token1: string;
  token0Symbol: string;
  token1Symbol: string;
  tvl: number;
  apy: number;
  volume24h: number;
  fees24h: number;
  liquidity: number;
  reserve0: string;
  reserve1: string;
  price0: number;
  price1: number;
  change24h: number;
  poolType: PoolType;
  feeTier: number;
  createdAt: string;
  lastUpdated: string;
}

export interface PoolsResponse {
  pools: LiquidityPool[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Fetch all liquidity pools from Astroport DEXs on Coreum
 * Uses cache-first strategy for fast initial load
 * @param page Page number (1-based)
 * @param limit Number of pools per page
 * @param search Search term for pool filtering
 * @param useCache Whether to use cached data (default: true)
 * @returns Paginated pools response
 */
export async function fetchLiquidityPools(
  page: number = 1,
  limit: number = 10,
  search: string = '',
  useCache: boolean = true
): Promise<PoolsResponse> {
  try {
    console.log(`🔍 [Liquidity Pools] Fetching pools (page ${page}, limit ${limit}, cache: ${useCache})`);
    
    // If cache is enabled and this is the first page, try to use cached data
    let allPools: LiquidityPool[] = [];
    let usedCache = false;
    
    if (useCache && page === 1) {
      const cachedPools = await getCachedPools();
      if (cachedPools.length > 0) {
        allPools = cachedPools;
        usedCache = true;
        console.log(`💾 [Liquidity Pools] Using ${cachedPools.length} cached pools`);
      }
    }
    
    // If no cache or cache disabled, fetch live data
    if (!usedCache) {
      // Fetch pools from BOTH Cruise Control and Pulsara in parallel
      const [cruiseControlPools, pulsaraPools] = await Promise.allSettled([
        fetchCruiseControlPools(),
        fetchPulsaraPools(),
      ]);
      
      // Add Cruise Control pools
      if (cruiseControlPools.status === 'fulfilled') {
        allPools = allPools.concat(cruiseControlPools.value);
        console.log(`✅ [Cruise Control] Added ${cruiseControlPools.value.length} pools`);
      } else {
        console.log(`⚠️  [Cruise Control] Failed to fetch pools`);
      }
      
      // Add Pulsara pools
      if (pulsaraPools.status === 'fulfilled') {
        allPools = allPools.concat(pulsaraPools.value);
        console.log(`✅ [Pulsara] Added ${pulsaraPools.value.length} pools`);
      } else {
        console.log(`⚠️  [Pulsara] Failed to fetch pools`);
      }
      
      console.log(`✅ [Liquidity Pools] Found ${allPools.length} total pools from DEXs`);
      
      // Update cache in background (don't await)
      if (allPools.length > 0) {
        updatePoolCache(allPools).catch(err => 
          console.error('Failed to update pool cache:', err)
        );
      }
    }
    
    // Filter out pools without liquidity (only for live data)
    const activePools = usedCache ? allPools : allPools.filter(pool => pool.liquidity > 0);
    console.log(`💰 [Liquidity Pools] ${activePools.length} active pools`);
    
    // Apply search filter
    let filteredPools = activePools;
    if (search) {
      const query = search.toLowerCase();
      filteredPools = activePools.filter(pool => 
        pool.token0Symbol.toLowerCase().includes(query) ||
        pool.token1Symbol.toLowerCase().includes(query) ||
        `${pool.token0Symbol}/${pool.token1Symbol}`.toLowerCase().includes(query)
      );
    }
    
    // Sort by liquidity (highest first)
    filteredPools.sort((a, b) => b.liquidity - a.liquidity);
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPools = filteredPools.slice(startIndex, endIndex);
    
    return {
      pools: paginatedPools,
      total: filteredPools.length,
      page,
      limit,
      hasMore: endIndex < filteredPools.length
    };

  } catch (error) {
    console.error('❌ [Liquidity Pools] Error fetching pools:', error);
    
    // Return empty response on error
    return {
      pools: [],
      total: 0,
      page,
      limit,
      hasMore: false
    };
  }
}

/**
 * Fetch pools from Cruise Control (Astroport factory)
 */
async function fetchCruiseControlPools(): Promise<LiquidityPool[]> {
  // Import DEX_CONFIG to check if Cruise Control is enabled
  const { DEX_CONFIG } = await import('./astroport');
  
  // Skip if Cruise Control is disabled
  if (!DEX_CONFIG.CRUISE_CONTROL_ENABLED) {
    console.log('⏭️  [Cruise Control] Skipped (disabled in config)');
    return [];
  }

  try {
    console.log('🚢 [Cruise Control] Fetching all pools...');
    
    const factoryAddress = ASTROPORT_FACTORIES.CRUISE_CONTROL;
    const pairs = await queryAllPairs(factoryAddress);
    
    console.log(`📊 [Cruise Control] Found ${pairs.length} pairs`);
    
    // Query pool data for each pair
    const poolPromises = pairs.map((pair, index) => 
      fetchPoolData(pair, factoryAddress, 'Cruise Control', `cc-${index}`)
    );
    
    const pools = await Promise.all(poolPromises);
    
    // Filter out nulls
    const validPools = pools.filter((p): p is LiquidityPool => p !== null);
    
    console.log(`✅ [Cruise Control] Processed ${validPools.length} pools`);
    
    return validPools;
  } catch (error) {
    console.error('❌ [Cruise Control] Error fetching pools:', error);
    return [];
  }
}

/**
 * Fetch pools from Pulsara (Astroport factory)
 */
async function fetchPulsaraPools(): Promise<LiquidityPool[]> {
  // Import DEX_CONFIG to check if Pulsara is enabled
  const { DEX_CONFIG } = await import('./astroport');
  
  // Skip if Pulsara is disabled
  if (!DEX_CONFIG.PULSARA_ENABLED) {
    console.log('⏭️  [Pulsara] Skipped (disabled in config)');
    return [];
  }

  try {
    console.log('🌊 [Pulsara] Fetching all pools...');
    
    const factoryAddress = ASTROPORT_FACTORIES.PULSARA;
    const pairs = await queryAllPairs(factoryAddress);
    
    console.log(`📊 [Pulsara] Found ${pairs.length} pairs`);
    
    // Query pool data for each pair
    const poolPromises = pairs.map((pair, index) => 
      fetchPoolData(pair, factoryAddress, 'Pulsara', `pulsara-${index}`)
    );
    
    const pools = await Promise.all(poolPromises);
    
    // Filter out nulls
    const validPools = pools.filter((p): p is LiquidityPool => p !== null);
    
    console.log(`✅ [Pulsara] Processed ${validPools.length} pools`);
    
    return validPools;
  } catch (error) {
    console.error('❌ [Pulsara] Error fetching pools:', error);
    return [];
  }
}

/**
 * Fetch pool data from a PairInfo and factory
 * Used for Cruise Control and Pulsara pools discovered from factory
 */
async function fetchPoolData(
  pair: PairInfo,
  factoryAddress: string,
  dexName: string,
  id: string
): Promise<LiquidityPool | null> {
  try {
    const pool = await queryPool(pair.contract_addr);
    if (!pool) return null;
    
    const token0 = getDenomFromAsset(pool.assets[0]);
    const token1 = getDenomFromAsset(pool.assets[1]);
    
    // Get token info from database for proper symbols and decimals
    const token0Symbol = await getTokenSymbol(token0);
    const token1Symbol = await getTokenSymbol(token1);
    
    const token0Decimals = await getTokenDecimals(token0);
    const token1Decimals = await getTokenDecimals(token1);
    
    // Calculate liquidity with proper decimals
    const liquidity = calculateLiquidityWithDecimals(token1, token1Decimals, pool);
    const price0 = calculatePriceFromReservesWithDecimals(
      token0, token1, token0Decimals, token1Decimals, pool
    );
    const price1 = price0 > 0 ? 1 / price0 : 0;
    
    // Estimate APY based on liquidity (real APY would need historical fee data)
    const estimatedAPY = Math.min(100, Math.max(5, 50 - Math.log10(liquidity + 1) * 5));
    
    return {
      id,
      contractAddress: pair.contract_addr,
      factoryAddress,
      dexName,
      token0,
      token1,
      token0Symbol,
      token1Symbol,
      tvl: liquidity,
      apy: estimatedAPY,
      volume24h: 0, // Would need historical data
      fees24h: 0, // Would need historical data
      liquidity,
      reserve0: pool.assets[0].amount,
      reserve1: pool.assets[1].amount,
      price0,
      price1,
      change24h: 0, // Would need historical data
      poolType: formatPoolType(pair.pair_type),
      feeTier: 0.3, // Standard Astroport fee
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`❌ Error fetching pool data for ${pair.contract_addr}:`, error);
    return null;
  }
}

/**
 * Fetch pool data from a contract address
 * Used for Pulsara known pools
 */
async function fetchPoolDataFromContract(
  contractAddress: string,
  dexName: string,
  name: string,
  id: string
): Promise<LiquidityPool | null> {
  try {
    const pool = await queryPool(contractAddress);
    if (!pool) return null;
    
    const token0 = getDenomFromAsset(pool.assets[0]);
    const token1 = getDenomFromAsset(pool.assets[1]);
    
    // Get token info from database for proper symbols and decimals
    const token0Symbol = await getTokenSymbol(token0);
    const token1Symbol = await getTokenSymbol(token1);
    
    const token0Decimals = await getTokenDecimals(token0);
    const token1Decimals = await getTokenDecimals(token1);
    
    // Calculate liquidity with proper decimals
    const liquidity = calculateLiquidityWithDecimals(token1, token1Decimals, pool);
    const price0 = calculatePriceFromReservesWithDecimals(
      token0, token1, token0Decimals, token1Decimals, pool
    );
    const price1 = price0 > 0 ? 1 / price0 : 0;
    
    // Estimate APY based on liquidity
    const estimatedAPY = Math.min(100, Math.max(5, 50 - Math.log10(liquidity + 1) * 5));
    
    return {
      id,
      contractAddress,
      factoryAddress: '', // Pulsara doesn't expose factory
      dexName,
      token0,
      token1,
      token0Symbol,
      token1Symbol,
      tvl: liquidity,
      apy: estimatedAPY,
      volume24h: 0,
      fees24h: 0,
      liquidity,
      reserve0: pool.assets[0].amount,
      reserve1: pool.assets[1].amount,
      price0,
      price1,
      change24h: 0,
      poolType: 'xyk', // Pulsara uses XYK
      feeTier: 0.3,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`❌ Error fetching pool data for ${contractAddress}:`, error);
    return null;
  }
}

/**
 * Fetch a specific pool by contract address
 * @param contractAddress Pool contract address
 * @returns Pool details
 */
export async function fetchPoolByAddress(contractAddress: string): Promise<LiquidityPool | null> {
  try {
    return await fetchPoolDataFromContract(
      contractAddress,
      'Unknown',
      'custom',
      contractAddress
    );
  } catch (error) {
    console.error(`❌ Failed to fetch pool ${contractAddress}:`, error);
    return null;
  }
}

/**
 * Search pools by token symbol or pair
 * @param query Search query
 * @param limit Maximum results
 * @returns Matching pools
 */
export async function searchPools(query: string, limit: number = 20): Promise<LiquidityPool[]> {
  try {
    // Fetch all pools and filter
    const response = await fetchLiquidityPools(1, 100, query);
    return response.pools.slice(0, limit);
  } catch (error) {
    console.error('❌ Failed to search pools:', error);
    return [];
  }
}

/**
 * Get token symbol from database or fallback to parsing
 * Uses database for accurate symbols
 */
async function getTokenSymbol(denom: string): Promise<string> {
  if (!denom) return 'UNKNOWN';
  
  try {
    // Try to get from database first
    const tokenInfo = await getTokenByDenom(denom);
    if (tokenInfo) {
      return tokenInfo.symbol;
    }
  } catch (error) {
    console.error(`Failed to get token symbol from database for ${denom}:`, error);
  }
  
  // Fallback to parsing
  return extractSymbolFromDenom(denom);
}

/**
 * Get token decimals from database or use defaults
 */
async function getTokenDecimals(denom: string): Promise<number> {
  try {
    // Try to get from database first
    const tokenInfo = await getTokenByDenom(denom);
    if (tokenInfo) {
      return tokenInfo.decimals;
    }
  } catch (error) {
    console.error(`Failed to get token decimals from database for ${denom}:`, error);
  }
  
  // Fallback to defaults based on token type
  if (denom.startsWith('xrpl') && (denom.includes('solo') || denom.includes('11278ecf9e'))) {
    return 15; // SOLO and some XRPL tokens use 15 decimals
  }
  
  if (denom.startsWith('xrpl') && (denom.includes('roll') || denom.includes('11f82115a5'))) {
    return 15; // ROLL uses 15 decimals
  }
  
  // Default: 6 decimals (Coreum standard, XRP drops)
  return 6;
}

/**
 * Extract token symbol from denom (fallback method)
 * Handles IBC tokens, native tokens, and contract tokens
 */
function extractSymbolFromDenom(denom: string): string {
  if (!denom) return 'UNKNOWN';
  
  // Native Coreum token
  if (denom === 'ucore') return 'CORE';
  
  // Drop tokens (XRP) - show full denom since it's contract address
  if (denom.startsWith('drop-')) return 'XRP';
  
  // XRPL tokens - extract code
  if (denom.startsWith('xrpl')) {
    const parts = denom.split('-');
    const code = parts[0].substring(4); // Remove 'xrpl' prefix
    // Known XRPL codes
    if (code === '11278ecf9e') return 'SOLO';
    if (code === '11f82115a5') return 'ROLL';
    return `XRPL-${code.substring(0, 6)}`;
  }
  
  // IBC tokens - show short hash
  if (denom.startsWith('ibc/')) {
    const hash = denom.substring(4);
    // Known hashes
    if (hash === 'F082B65C88E4B6D5EF1DB243CDA1D331D002759E938A0F5CD3FFDC5D53B3E349') return 'USDC';
    if (hash === '27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2') return 'ATOM';
    return `IBC-${hash.substring(0, 6)}`;
  }
  
  // Factory tokens (most Coreum native tokens)
  if (denom.startsWith('u') && denom.includes('-core1')) {
    const symbol = denom.split('-')[0].substring(1); // Remove 'u' prefix
    return symbol.toUpperCase();
  }
  
  // Contract addresses - show short version
  if (denom.startsWith('core1')) {
    return `${denom.substring(0, 12)}...`;
  }
  
  // Default: use first part of denom
  const parts = denom.split(/[-_]/);
  return parts[0].toUpperCase();
}

/**
 * Calculate liquidity with proper decimal handling
 */
function calculateLiquidityWithDecimals(
  quoteDenom: string,
  quoteDecimals: number,
  pool: any
): number {
  try {
    const quoteReserve = pool.assets.find((a: any) => {
      const denom = getDenomFromAsset(a);
      return denom === quoteDenom;
    });
    
    if (!quoteReserve) return 0;
    
    const amount = BigInt(quoteReserve.amount);
    const divisor = BigInt(10 ** quoteDecimals);
    const liquidity = Number(amount) / Number(divisor);
    
    // Assume $1 price for quote token (rough estimate)
    return liquidity;
  } catch (error) {
    console.error('Error calculating liquidity:', error);
    return 0;
  }
}

/**
 * Calculate price from reserves with proper decimal handling
 */
function calculatePriceFromReservesWithDecimals(
  token0: string,
  token1: string,
  token0Decimals: number,
  token1Decimals: number,
  pool: any
): number {
  try {
    const asset0 = pool.assets.find((a: any) => {
      const denom = getDenomFromAsset(a);
      return denom === token0;
    });
    
    const asset1 = pool.assets.find((a: any) => {
      const denom = getDenomFromAsset(a);
      return denom === token1;
    });
    
    if (!asset0 || !asset1) return 0;
    
    // Adjust for decimals
    const reserve0 = Number(asset0.amount) / (10 ** token0Decimals);
    const reserve1 = Number(asset1.amount) / (10 ** token1Decimals);
    
    if (reserve0 === 0) return 0;
    
    // Price of token0 in terms of token1
    return reserve1 / reserve0;
  } catch (error) {
    console.error('Error calculating price:', error);
    return 0;
  }
}

