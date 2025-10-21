/**
 * ============================================
 * POOL PRICE CLIENT
 * ============================================
 * 
 * Direct pool contract queries for REAL-TIME prices
 * This is how Pulsara gets accurate prices!
 * 
 * File: /utils/coreum/pool-price-client.ts
 */

const COREUM_RPC = process.env.NEXT_PUBLIC_COREUM_RPC || 'https://full-node.mainnet-1.coreum.dev:1317';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface PoolReserves {
  assets: Array<{
    info: {
      native_token?: { denom: string };
      token?: { contract_addr: string };
    };
    amount: string;
  }>;
  total_share: string;
}

export interface CurrentPoolPrice {
  price: number;
  reserves: [number, number];
  reservesRaw: [string, string];
  liquidity: number;
  poolContract: string;
  timestamp: number;
}

export interface SwapSimulation {
  returnAmount: number;
  spread: number;
  commission: number;
  effectivePrice: number;
}

// ============================================
// POOL CONTRACT QUERIES
// ============================================

/**
 * Query a pool contract's reserves
 * This is the REAL way to get current prices!
 */
export async function queryPoolReserves(poolContract: string): Promise<PoolReserves> {
  const query = { pool: {} };
  const queryBase64 = btoa(JSON.stringify(query));
  
  const url = `${COREUM_RPC}/cosmwasm/wasm/v1/contract/${poolContract}/smart/${queryBase64}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Pool query failed: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.data;
}

/**
 * Get current price from pool reserves
 * This is what Pulsara uses!
 */
export async function getCurrentPoolPrice(
  poolContract: string,
  decimals0: number = 6,
  decimals1: number = 6
): Promise<CurrentPoolPrice> {
  try {
    console.log(`💰 [Pool Price] Querying pool ${poolContract.substring(0, 20)}...`);
    
    const reserves = await queryPoolReserves(poolContract);
    
    const reserve0Raw = reserves.assets[0].amount;
    const reserve1Raw = reserves.assets[1].amount;
    
    const reserve0 = Number(reserve0Raw) / Math.pow(10, decimals0);
    const reserve1 = Number(reserve1Raw) / Math.pow(10, decimals1);
    
    if (reserve0 === 0) {
      throw new Error('Pool has zero reserves for token0');
    }
    
    // Price of token0 in terms of token1
    const price = reserve1 / reserve0;
    
    // Approximate liquidity (2x reserve0 value, assuming balanced pool)
    const liquidity = reserve0 * 2;
    
    console.log(`✅ [Pool Price] Price: ${price.toFixed(8)}, Liquidity: ${liquidity.toFixed(2)}`);
    
    return {
      price,
      reserves: [reserve0, reserve1],
      reservesRaw: [reserve0Raw, reserve1Raw],
      liquidity,
      poolContract,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error(`❌ [Pool Price] Error querying pool:`, error);
    throw error;
  }
}

/**
 * Simulate a swap to get exact output
 * More accurate than calculating from reserves
 */
export async function simulateSwap(
  poolContract: string,
  offerAmount: number,
  offerAssetDenom: string,
  offerDecimals: number = 6,
  returnDecimals: number = 6
): Promise<SwapSimulation> {
  try {
    const offerAmountRaw = Math.floor(offerAmount * Math.pow(10, offerDecimals));
    
    const query = {
      simulation: {
        offer_asset: {
          info: {
            native_token: {
              denom: offerAssetDenom
            }
          },
          amount: String(offerAmountRaw)
        }
      }
    };
    
    const queryBase64 = btoa(JSON.stringify(query));
    const url = `${COREUM_RPC}/cosmwasm/wasm/v1/contract/${poolContract}/smart/${queryBase64}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Swap simulation failed: ${response.status}`);
    }
    
    const data = await response.json();
    const result = data.data;
    
    const returnAmount = Number(result.return_amount) / Math.pow(10, returnDecimals);
    const spread = Number(result.spread_amount || 0) / Math.pow(10, returnDecimals);
    const commission = Number(result.commission_amount || 0) / Math.pow(10, returnDecimals);
    
    // Effective price after fees
    const effectivePrice = returnAmount / offerAmount;
    
    return {
      returnAmount,
      spread,
      commission,
      effectivePrice,
    };
  } catch (error) {
    console.error(`❌ [Pool Price] Swap simulation error:`, error);
    throw error;
  }
}

/**
 * Get multiple pool prices at once
 */
export async function getMultiplePoolPrices(
  pools: Array<{
    contract: string;
    decimals0: number;
    decimals1: number;
  }>
): Promise<Map<string, CurrentPoolPrice>> {
  const results = new Map<string, CurrentPoolPrice>();
  
  // Query all pools in parallel
  const promises = pools.map(async (pool) => {
    try {
      const price = await getCurrentPoolPrice(
        pool.contract,
        pool.decimals0,
        pool.decimals1
      );
      results.set(pool.contract, price);
    } catch (error) {
      console.error(`Failed to get price for ${pool.contract}:`, error);
    }
  });
  
  await Promise.all(promises);
  
  return results;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Format price for display
 */
export function formatPoolPrice(price: number): string {
  if (price === 0) return '0.00';
  if (price < 0.000001) return price.toExponential(2);
  if (price < 0.01) return price.toFixed(8);
  if (price < 1) return price.toFixed(6);
  if (price < 1000) return price.toFixed(4);
  return price.toFixed(2);
}

/**
 * Calculate price impact of a swap
 */
export function calculatePriceImpact(
  poolPrice: number,
  effectivePrice: number
): number {
  return ((effectivePrice - poolPrice) / poolPrice) * 100;
}

/**
 * Check if pool price is stale (older than 30 seconds)
 */
export function isPriceStale(priceData: CurrentPoolPrice): boolean {
  const age = Date.now() - priceData.timestamp;
  return age > 30000; // 30 seconds
}

