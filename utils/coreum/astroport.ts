/**
 * ============================================
 * ASTROPORT INTEGRATION MODULE
 * ============================================
 * 
 * Comprehensive integration with Astroport AMM on Coreum
 * Astroport is the industry-standard DEX infrastructure for CosmWasm chains
 * 
 * FEATURES:
 * - Factory queries (discover all pools)
 * - Pool queries (reserves, prices, liquidity)
 * - Swap simulations and routing
 * - LP token operations
 * - Multi-pool price aggregation
 * 
 * SUPPORTED DEXS ON COREUM:
 * - Cruise Control (Astroport v5)
 * - Pulsara (Astroport-based)
 * 
 * @see https://docs.astroport.fi/
 */

const COREUM_REST_API = "https://full-node.mainnet-1.coreum.dev:1317";

// ============================================
// ASTROPORT FACTORIES ON COREUM
// ============================================

export const ASTROPORT_FACTORIES = {
  CRUISE_CONTROL: "core1gjgyvxzqnjnx8rs2yrdry6slkn50xy2xpft8cgzgq5mvmcq797vsj0qsun", // ✅ CORRECT - Working Cruise Control factory
  PULSARA: "core1t0253v8aam0hdg72m09jpswzy3592e9h5u0kuhqvsm67fxrq74dsk4xpng", // ✅ CORRECT - Working Pulsara factory
  // Add more as they become available
} as const;

// Factory health tracking
const factoryHealth = new Map<string, {
  failures: number;
  lastFailure: number;
  isDisabled: boolean;
  lastChecked: number;
}>();

// Initialize factory health tracking for both DEXs
factoryHealth.set(ASTROPORT_FACTORIES.CRUISE_CONTROL, {
  failures: 0,
  lastFailure: 0,
  isDisabled: false,
  lastChecked: 0
});

factoryHealth.set(ASTROPORT_FACTORIES.PULSARA, {
  failures: 0,
  lastFailure: 0,
  isDisabled: false,
  lastChecked: 0
});

// ============================================
// DEX CONFIGURATION
// ============================================

/**
 * Configuration for enabling/disabling specific DEXs
 * Set to false to disable a DEX that's having issues
 */
export const DEX_CONFIG = {
  CRUISE_CONTROL_ENABLED: true, // ✅ ENABLED - correct factory address now available
  PULSARA_ENABLED: true, // ✅ ENABLED - working factory with verified contracts
  // Reduce error logging for known-failing contracts
  SUPPRESS_CONTRACT_ERRORS: true, // Suppress errors to reduce noise
  // Add timeout for contract queries
  CONTRACT_QUERY_TIMEOUT: 10000, // 10 seconds
  // Factory health check settings
  ENABLE_FACTORY_HEALTH_CHECK: true,
  FACTORY_FAILURE_THRESHOLD: 3, // Disable factory after 3 consecutive failures
} as const;

// ============================================
// TYPE DEFINITIONS
// ============================================

export type PoolType = "xyk" | "stable" | "concentrated";

export interface AssetInfo {
  native_token?: { denom: string };
  token?: { contract_addr: string };
}

export interface Asset {
  info: AssetInfo;
  amount: string;
}

export interface PairInfo {
  asset_infos: [AssetInfo, AssetInfo];
  contract_addr: string;
  liquidity_token: string;
  pair_type: { xyk: {} } | { stable: {} } | { concentrated: {} };
}

export interface PoolResponse {
  assets: [Asset, Asset];
  total_share: string;
}

export interface PoolConfig {
  pair_info: PairInfo;
  factory_addr: string;
  block_time_last: number;
  price0_cumulative_last: string;
  price1_cumulative_last: string;
}

export interface SimulateSwapResponse {
  return_amount: string;
  spread_amount: string;
  commission_amount: string;
}

export interface PriceData {
  price: number;
  liquidity: number;
  volume24h?: number;
  reserve0: string;
  reserve1: string;
}

// ============================================
// CORE CONTRACT QUERY FUNCTION
// ============================================

/**
 * Query any smart contract on Coreum
 * This is the foundation for all Astroport interactions
 */
export async function queryContract<T = any>(
  contractAddress: string,
  query: object
): Promise<T> {
  try {
    const queryBase64 = Buffer.from(JSON.stringify(query)).toString("base64");
    const url = `${COREUM_REST_API}/cosmwasm/wasm/v1/contract/${contractAddress}/smart/${queryBase64}`;

    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEX_CONFIG.CONTRACT_QUERY_TIMEOUT);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Contract query failed: ${response.status}`);
    }

    const data = await response.json();
    return data.data as T;
  } catch (error) {
    // Handle timeout errors
    if (error instanceof Error && error.name === 'AbortError') {
      console.log(`⏰ [Astroport] Query timeout for ${contractAddress} - treating as no data available`);
      return null as T;
    }
    
    // Only log errors if not suppressing them
    if (!DEX_CONFIG.SUPPRESS_CONTRACT_ERRORS) {
      console.error(`❌ [Astroport] Query error for ${contractAddress}:`, error);
    }
    
    // Don't throw 500 errors - return null instead to allow graceful fallback
    if (error instanceof Error && error.message.includes('500')) {
      console.log(`⚠️ [Astroport] Contract query returned 500 for ${contractAddress} - treating as no data available`);
      return null as T;
    }
    
    // Don't throw network errors - return null instead
    if (error instanceof Error && (error.message.includes('fetch') || error.message.includes('network'))) {
      console.log(`🌐 [Astroport] Network error for ${contractAddress} - treating as no data available`);
      return null as T;
    }
    
    throw error;
  }
}

// ============================================
// FACTORY VALIDATION
// ============================================

/**
 * Record a factory failure
 */
export function recordFactoryFailure(factoryAddress: string): void {
  if (!DEX_CONFIG.ENABLE_FACTORY_HEALTH_CHECK) return;
  
  const health = factoryHealth.get(factoryAddress);
  if (!health) return;
  
  health.failures++;
  health.lastFailure = Date.now();
  
  // Disable factory if it has too many failures
  if (health.failures >= DEX_CONFIG.FACTORY_FAILURE_THRESHOLD) {
    health.isDisabled = true;
    console.log(`🚫 [Factory Health] Disabled ${factoryAddress} after ${health.failures} failures`);
  }
}

/**
 * Record a factory success
 */
export function recordFactorySuccess(factoryAddress: string): void {
  if (!DEX_CONFIG.ENABLE_FACTORY_HEALTH_CHECK) return;
  
  const health = factoryHealth.get(factoryAddress);
  if (!health) return;
  
  // Reset failure count on success
  health.failures = 0;
  health.isDisabled = false;
  health.lastChecked = Date.now();
}

/**
 * Check if we should skip a factory due to repeated failures
 */
export function shouldSkipFactory(factoryAddress: string): boolean {
  if (!DEX_CONFIG.ENABLE_FACTORY_HEALTH_CHECK) return false;
  
  const health = factoryHealth.get(factoryAddress);
  if (!health) return false;
  
  // Skip if factory is disabled
  if (health.isDisabled) {
    // Re-enable after 10 minutes
    const now = Date.now();
    if (now - health.lastFailure > 600000) { // 10 minutes
      health.isDisabled = false;
      health.failures = 0;
      console.log(`🔄 [Factory Health] Re-enabling ${factoryAddress} after cooldown`);
      return false;
    }
    return true;
  }
  
  return false;
}

// ============================================
// FACTORY QUERIES
// ============================================

/**
 * Query all pairs from an Astroport factory
 * Use this to discover available trading pairs
 */
export async function queryAllPairs(
  factoryAddress: string,
  startAfter?: [AssetInfo, AssetInfo],
  limit: number = 30
): Promise<PairInfo[]> {
  try {
    const query: any = { pairs: { limit } };
    if (startAfter) {
      query.pairs.start_after = startAfter;
    }

    const response = await queryContract<{ pairs: PairInfo[] }>(
      factoryAddress,
      query
    );

    // Handle the response structure: response is the pairs array directly
    if (Array.isArray(response)) {
      console.log(`✅ [Astroport Factory] Found ${response.length} pairs`);
      return response;
    } else if (response && response.pairs && Array.isArray(response.pairs)) {
      console.log(`✅ [Astroport Factory] Found ${response.pairs.length} pairs`);
      return response.pairs;
    } else {
      console.log(`⚠️ [Astroport Factory] Unexpected response format:`, typeof response);
      return [];
    }
  } catch (error) {
    // Only log if not suppressing errors
    if (!DEX_CONFIG.SUPPRESS_CONTRACT_ERRORS) {
      console.error(`❌ [Astroport Factory] Failed to query pairs:`, error);
    }
    return [];
  }
}

/**
 * Query a specific pair from the factory
 * Returns the pair contract address if it exists
 */
export async function queryPair(
  factoryAddress: string,
  asset0: AssetInfo,
  asset1: AssetInfo
): Promise<PairInfo | null> {
  try {
    const query = {
      pair: {
        asset_infos: [asset0, asset1],
      },
    };

    const response = await queryContract<PairInfo>(factoryAddress, query);
    
    if (response) {
      console.log(`✅ [Astroport Factory] Found pair: ${response.contract_addr}`);
      recordFactorySuccess(factoryAddress);
      return response;
    } else {
      // queryContract returned null (500 error)
      recordFactoryFailure(factoryAddress);
      return null;
    }
  } catch (error) {
    // Record failure for any error
    recordFactoryFailure(factoryAddress);
    
    // Only log if not suppressing errors
    if (!DEX_CONFIG.SUPPRESS_CONTRACT_ERRORS) {
      console.error(`❌ [Astroport Factory] Pair not found`);
    }
    // Handle 500 errors gracefully - they often mean the pair doesn't exist
    if (error instanceof Error && error.message.includes('500')) {
      console.log(`⚠️ [Astroport Factory] Contract returned 500 - pair likely doesn't exist`);
    }
    return null;
  }
}

// ============================================
// POOL QUERIES
// ============================================

/**
 * Query pool reserves and total shares
 * This is the core function for getting pricing data
 */
export async function queryPool(pairContract: string): Promise<PoolResponse | null> {
  try {
    const query = { pool: {} };
    const response = await queryContract<PoolResponse>(pairContract, query);
    
    // Check if response is null (500 error case)
    if (!response) {
      console.log(`⚠️ [Astroport Pool] Contract returned null for ${pairContract} - pool may not exist`);
      return null;
    }
    
    console.log(
      `📊 [Astroport Pool] ${pairContract}: ${response.assets[0].amount} / ${response.assets[1].amount}`
    );
    
    return response;
  } catch (error) {
    // Handle 500 errors gracefully - they often mean the pool doesn't exist or is invalid
    if (error instanceof Error && error.message.includes('500')) {
      console.log(`⚠️ [Astroport Pool] Contract returned 500 for ${pairContract} - pool may not exist`);
    } else {
      console.error(`❌ [Astroport Pool] Query failed for ${pairContract}:`, error);
    }
    return null;
  }
}

/**
 * Query pool configuration
 * Get factory address, pair info, and cumulative prices for TWAP
 */
export async function queryPoolConfig(pairContract: string): Promise<PoolConfig | null> {
  try {
    const query = { config: {} };
    const response = await queryContract<PoolConfig>(pairContract, query);
    return response;
  } catch (error) {
    console.error(`❌ [Astroport Pool] Config query failed:`, error);
    return null;
  }
}

/**
 * Simulate a swap without executing it
 * Use this to get quotes and check slippage
 */
export async function simulateSwap(
  pairContract: string,
  offerAsset: Asset,
  beliefPrice?: string
): Promise<SimulateSwapResponse | null> {
  try {
    const query: any = {
      simulation: {
        offer_asset: offerAsset,
      },
    };

    if (beliefPrice) {
      query.simulation.belief_price = beliefPrice;
    }

    const response = await queryContract<SimulateSwapResponse>(
      pairContract,
      query
    );

    console.log(
      `💱 [Astroport Swap] ${offerAsset.amount} → ${response.return_amount} (spread: ${response.spread_amount})`
    );

    return response;
  } catch (error) {
    console.error(`❌ [Astroport Swap] Simulation failed:`, error);
    return null;
  }
}

/**
 * Calculate reverse swap (how much input needed for desired output)
 */
export async function reverseSimulateSwap(
  pairContract: string,
  askAsset: Asset
): Promise<SimulateSwapResponse | null> {
  try {
    const query = {
      reverse_simulation: {
        ask_asset: askAsset,
      },
    };

    const response = await queryContract<SimulateSwapResponse>(
      pairContract,
      query
    );

    return response;
  } catch (error) {
    console.error(`❌ [Astroport Swap] Reverse simulation failed:`, error);
    return null;
  }
}

// ============================================
// PRICE CALCULATIONS
// ============================================

/**
 * Calculate price from pool reserves using constant product formula
 * Price = quote_reserve / target_reserve
 */
export function calculatePriceFromReserves(
  targetDenom: string,
  quoteDenom: string,
  pool: PoolResponse
): number {
  const [asset0, asset1] = pool.assets;

  // Determine which asset is which
  const asset0Denom = getDenomFromAsset(asset0);
  const asset1Denom = getDenomFromAsset(asset1);

  const isAsset0Target = asset0Denom === targetDenom;
  const targetReserve = parseFloat(isAsset0Target ? asset0.amount : asset1.amount);
  const quoteReserve = parseFloat(isAsset0Target ? asset1.amount : asset0.amount);

  if (targetReserve === 0 || quoteReserve === 0) {
    return 0;
  }

  return quoteReserve / targetReserve;
}

/**
 * Calculate total liquidity in terms of the quote token
 * Total liquidity = 2 * quote_reserve (both sides of the pool)
 */
export function calculateLiquidity(
  quoteDenom: string,
  pool: PoolResponse
): number {
  const [asset0, asset1] = pool.assets;

  const asset0Denom = getDenomFromAsset(asset0);
  const isAsset0Quote = asset0Denom === quoteDenom;

  const quoteReserve = parseFloat(
    isAsset0Quote ? asset0.amount : asset1.amount
  );

  return quoteReserve * 2;
}

// ============================================
// PRICE ORACLE FUNCTIONS
// ============================================

/**
 * Get price data for a token pair from a specific factory
 * This is the main function you'll use for pricing
 */
export async function getPriceFromFactory(
  factoryAddress: string,
  targetDenom: string,
  quoteDenom: string = "ucore"
): Promise<PriceData | null> {
  try {
    // Skip if factory is known to be invalid
    if (shouldSkipFactory(factoryAddress)) {
      console.log(`⏭️ [Astroport Oracle] Skipping ${factoryAddress} - known to be invalid`);
      return null;
    }

    console.log(`🔍 [Astroport Oracle] Querying ${targetDenom}/${quoteDenom}`);

    // Query the pair from factory
    const pairInfo = await queryPair(
      factoryAddress,
      { native_token: { denom: targetDenom } },
      { native_token: { denom: quoteDenom } }
    );

    if (!pairInfo) {
      // Try reversed order
      const reversedPairInfo = await queryPair(
        factoryAddress,
        { native_token: { denom: quoteDenom } },
        { native_token: { denom: targetDenom } }
      );

      if (!reversedPairInfo) {
        // Only log if not suppressing errors
        if (!DEX_CONFIG.SUPPRESS_CONTRACT_ERRORS) {
          console.log(`❌ [Astroport Oracle] No pool found for ${targetDenom}/${quoteDenom}`);
        }
        return null;
      }

      // Use reversed pair
      const pool = await queryPool(reversedPairInfo.contract_addr);
      if (!pool) return null;

      const price = calculatePriceFromReserves(targetDenom, quoteDenom, pool);
      const liquidity = calculateLiquidity(quoteDenom, pool);

      return {
        price,
        liquidity,
        reserve0: pool.assets[0].amount,
        reserve1: pool.assets[1].amount,
      };
    }

    // Query pool reserves
    const pool = await queryPool(pairInfo.contract_addr);
    if (!pool) return null;

    const price = calculatePriceFromReserves(targetDenom, quoteDenom, pool);
    const liquidity = calculateLiquidity(quoteDenom, pool);

    console.log(
      `✅ [Astroport Oracle] ${targetDenom}: ${price.toFixed(6)} ${quoteDenom} (liquidity: ${liquidity.toFixed(0)})`
    );

    return {
      price,
      liquidity,
      reserve0: pool.assets[0].amount,
      reserve1: pool.assets[1].amount,
    };
  } catch (error) {
    console.error(`❌ [Astroport Oracle] Error getting price:`, error);
    return null;
  }
}

/**
 * Get aggregated price from multiple Astroport factories
 * Uses liquidity-weighted average for best accuracy
 */
export async function getAggregatedPrice(
  targetDenom: string,
  quoteDenom: string = "ucore"
): Promise<{
  price: number;
  liquidity: number;
  sources: Array<{ factory: string; price: number; liquidity: number }>;
} | null> {
  try {
    console.log(`🔄 [Astroport Aggregated] Fetching ${targetDenom}/${quoteDenom} from all factories`);

    // Query all factories in parallel
    const factories = Object.entries(ASTROPORT_FACTORIES);
    const pricePromises = factories.map(([name, address]) =>
      getPriceFromFactory(address, targetDenom, quoteDenom).then((result) => ({
        name,
        address,
        result,
      }))
    );

    const results = await Promise.all(pricePromises);

    // Filter out null results
    const validResults = results.filter((r) => r.result !== null);

    if (validResults.length === 0) {
      console.log(`❌ [Astroport Aggregated] No price data available`);
      return null;
    }

    // Calculate liquidity-weighted average
    const totalLiquidity = validResults.reduce(
      (sum, r) => sum + (r.result?.liquidity || 0),
      0
    );

    const weightedPrice = validResults.reduce((sum, r) => {
      const weight = (r.result?.liquidity || 0) / totalLiquidity;
      return sum + (r.result?.price || 0) * weight;
    }, 0);

    const sources = validResults.map((r) => ({
      factory: r.name,
      price: r.result?.price || 0,
      liquidity: r.result?.liquidity || 0,
    }));

    console.log(`✅ [Astroport Aggregated] Weighted price: ${weightedPrice.toFixed(6)}`);
    sources.forEach((s) =>
      console.log(`   - ${s.factory}: ${s.price.toFixed(6)} (liquidity: ${s.liquidity.toFixed(0)})`)
    );

    return {
      price: weightedPrice,
      liquidity: totalLiquidity,
      sources,
    };
  } catch (error) {
    console.error(`❌ [Astroport Aggregated] Error:`, error);
    return null;
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Extract denom from Asset object
 */
export function getDenomFromAsset(asset: Asset): string {
  if (asset.info.native_token) {
    return asset.info.native_token.denom;
  }
  if (asset.info.token) {
    return asset.info.token.contract_addr;
  }
  return "";
}

/**
 * Create AssetInfo from denom string
 */
export function createAssetInfo(denom: string): AssetInfo {
  // Check if it's a contract address or native token
  if (denom.startsWith("core1")) {
    return { token: { contract_addr: denom } };
  }
  return { native_token: { denom } };
}

/**
 * Create Asset object
 */
export function createAsset(denom: string, amount: string): Asset {
  return {
    info: createAssetInfo(denom),
    amount,
  };
}

/**
 * Format pool type for display
 */
export function formatPoolType(pairType: PairInfo["pair_type"]): PoolType {
  if ("xyk" in pairType) return "xyk";
  if ("stable" in pairType) return "stable";
  if ("concentrated" in pairType) return "concentrated";
  return "xyk";
}

/**
 * Get pool type description
 */
export function getPoolTypeDescription(poolType: PoolType): string {
  switch (poolType) {
    case "xyk":
      return "Constant Product (x*y=k) - Standard AMM";
    case "stable":
      return "StableSwap - Optimized for stablecoin pairs";
    case "concentrated":
      return "Concentrated Liquidity - Capital efficient";
    default:
      return "Unknown pool type";
  }
}

// ============================================
// CACHE MANAGEMENT
// ============================================

const queryCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 60 * 1000; // 1 minute

/**
 * Query with caching
 */
export async function queryCached<T = any>(
  cacheKey: string,
  queryFn: () => Promise<T>
): Promise<T> {
  const cached = queryCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T;
  }

  const data = await queryFn();
  queryCache.set(cacheKey, { data, timestamp: Date.now() });

  return data;
}

/**
 * Clear all caches
 */
export function clearCache(): void {
  queryCache.clear();
  console.log("🗑️ [Astroport] Cache cleared");
}

/**
 * Get factory health status for debugging
 */
export function getFactoryHealthStatus(): Record<string, any> {
  const status: Record<string, any> = {};
  
  for (const [address, health] of factoryHealth.entries()) {
    status[address] = {
      failures: health.failures,
      isDisabled: health.isDisabled,
      lastFailure: new Date(health.lastFailure).toISOString(),
      lastChecked: new Date(health.lastChecked).toISOString()
    };
  }
  
  return status;
}

/**
 * Reset factory health (for testing/debugging)
 */
export function resetFactoryHealth(): void {
  for (const [address, health] of factoryHealth.entries()) {
    health.failures = 0;
    health.isDisabled = false;
    health.lastFailure = 0;
    health.lastChecked = 0;
  }
  console.log("🔄 [Factory Health] All factory health data reset");
}

/**
 * ============================================
 * USAGE EXAMPLES
 * ============================================
 * 
 * // Get price from Cruise Control
 * const priceData = await getPriceFromFactory(
 *   ASTROPORT_FACTORIES.CRUISE_CONTROL,
 *   "ucozy-core19w7yasdscfu09un47h8vf5rfjshwug2kgrplkwtfdrrgjzrld82sc7f494",
 *   "ucore"
 * );
 * 
 * // Get aggregated price from all factories
 * const aggregated = await getAggregatedPrice(
 *   "ucozy-core19w7yasdscfu09un47h8vf5rfjshwug2kgrplkwtfdrrgjzrld82sc7f494",
 *   "ucore"
 * );
 * 
 * // Simulate a swap
 * const swapResult = await simulateSwap(
 *   pairContract,
 *   { info: { native_token: { denom: "ucore" } }, amount: "1000000" }
 * );
 * 
 * // Discover all available pairs
 * const allPairs = await queryAllPairs(ASTROPORT_FACTORIES.CRUISE_CONTROL);
 * 
 * ============================================
 */

