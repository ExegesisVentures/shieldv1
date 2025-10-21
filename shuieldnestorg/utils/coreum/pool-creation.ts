/**
 * Astroport Pool Creation Utilities
 * Helper functions for creating and managing liquidity pools on Astroport DEXs
 * Supports: Cruise Control factory
 */

import {
  ASTROPORT_FACTORIES,
  queryPair,
  createAssetInfo,
  type AssetInfo,
  type PoolType,
} from './astroport';

export interface CreatePoolParams {
  token0: string;
  token1: string;
  token0Amount: string;
  token1Amount: string;
  poolType?: PoolType;
  factory?: string; // Which Astroport factory to use
  creator?: string;
}

export interface PoolCreationResponse {
  success: boolean;
  pool?: {
    id: string;
    token0: string;
    token1: string;
    token0Amount: string;
    token1Amount: string;
    feeTier: number;
    poolType: string;
    createdAt: string;
    creator: string;
  };
  error?: {
    code: string;
    message: string;
    hint?: string;
    causeId?: string;
  };
}

/**
 * Check if a liquidity pool already exists for a token pair
 * Queries all Astroport factories
 * @param token0 First token denom
 * @param token1 Second token denom
 * @param factory Optional specific factory to check
 * @returns Pool contract address if exists, null otherwise
 */
export async function checkPoolExists(
  token0: string,
  token1: string,
  factory?: string
): Promise<{ exists: boolean; pairContract?: string; factory?: string } | null> {
  try {
    console.log(`🔍 [Pool Check] Checking if pool exists for ${token0}/${token1}`);
    
    const factoriesToCheck = factory 
      ? [{ name: 'Custom', address: factory }]
      : Object.entries(ASTROPORT_FACTORIES).map(([name, address]) => ({ name, address }));
    
    for (const { name, address } of factoriesToCheck) {
      // Try both orderings
      const asset0 = createAssetInfo(token0);
      const asset1 = createAssetInfo(token1);
      
      const pairInfo = await queryPair(address, asset0, asset1);
      
      if (pairInfo) {
        console.log(`✅ [Pool Check] Pool exists on ${name}: ${pairInfo.contract_addr}`);
        return {
          exists: true,
          pairContract: pairInfo.contract_addr,
          factory: address,
        };
      }
      
      // Try reversed
      const reversedPairInfo = await queryPair(address, asset1, asset0);
      
      if (reversedPairInfo) {
        console.log(`✅ [Pool Check] Pool exists on ${name}: ${reversedPairInfo.contract_addr}`);
        return {
          exists: true,
          pairContract: reversedPairInfo.contract_addr,
          factory: address,
        };
      }
    }
    
    console.log(`❌ [Pool Check] No pool found for ${token0}/${token1}`);
    return { exists: false };
    
  } catch (error) {
    console.error('❌ [Pool Check] Error checking pool existence:', error);
    return null;
  }
}

/**
 * Prepare pool creation transaction message
 * NOTE: Actual pool creation requires wallet connection and signing
 * This prepares the message that would be sent to the factory contract
 * @param params Pool creation parameters
 * @returns Transaction message object
 */
export async function preparePoolCreationMessage(
  params: CreatePoolParams
): Promise<PoolCreationResponse> {
  try {
    // Validate parameters first
    const validation = validatePoolParams(params);
    if (!validation.valid) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: validation.error || 'Invalid parameters',
          hint: 'Check your token denoms and amounts',
        }
      };
    }
    
    // Check if pool already exists
    const existingPool = await checkPoolExists(
      params.token0,
      params.token1,
      params.factory
    );
    
    if (existingPool?.exists) {
      return {
        success: false,
        error: {
          code: 'POOL_EXISTS',
          message: 'Pool already exists for this token pair',
          hint: `Pool contract: ${existingPool.pairContract}`,
        }
      };
    }
    
    // Prepare the message
    const factoryAddress = params.factory || ASTROPORT_FACTORIES.CRUISE_CONTROL;
    const poolType = params.poolType || 'xyk';
    
    const createPairMsg = {
      create_pair: {
        pair_type: { [poolType]: {} },
        asset_infos: [
          createAssetInfo(params.token0),
          createAssetInfo(params.token1),
        ],
        init_params: null, // Can be customized for specific pool types
      }
    };
    
    console.log(`📝 [Pool Creation] Message prepared for factory ${factoryAddress}`);
    console.log(`   Token pair: ${params.token0} / ${params.token1}`);
    console.log(`   Pool type: ${poolType}`);
    console.log(`   Initial liquidity: ${params.token0Amount} / ${params.token1Amount}`);
    
    return {
      success: true,
      pool: {
        id: 'pending',
        token0: params.token0,
        token1: params.token1,
        token0Amount: params.token0Amount,
        token1Amount: params.token1Amount,
        feeTier: 0.3, // Standard Astroport fee
        poolType: poolType,
        createdAt: new Date().toISOString(),
        creator: params.creator || '',
      }
    };
    
  } catch (error) {
    console.error('❌ [Pool Creation] Error preparing message:', error);
    return {
      success: false,
      error: {
        code: 'PREPARATION_ERROR',
        message: 'Failed to prepare pool creation message',
        hint: error instanceof Error ? error.message : 'Unknown error',
      }
    };
  }
}

/**
 * Validate pool creation parameters
 * @param params Pool creation parameters
 * @returns Validation result with error message if invalid
 */
export function validatePoolParams(params: CreatePoolParams): { valid: boolean; error?: string } {
  // Check required fields
  if (!params.token0 || !params.token1 || !params.token0Amount || !params.token1Amount) {
    return {
      valid: false,
      error: 'All fields are required'
    };
  }

  // Check token pair is different
  if (params.token0 === params.token1) {
    return {
      valid: false,
      error: 'Token pair must be different'
    };
  }

  // Validate amounts
  const amount0 = parseFloat(params.token0Amount);
  const amount1 = parseFloat(params.token1Amount);
  
  if (isNaN(amount0) || isNaN(amount1)) {
    return {
      valid: false,
      error: 'Token amounts must be valid numbers'
    };
  }

  if (amount0 <= 0 || amount1 <= 0) {
    return {
      valid: false,
      error: 'Token amounts must be positive'
    };
  }

  // Note: Astroport uses a standard 0.3% fee
  // No fee tier validation needed as it's fixed

  return { valid: true };
}

/**
 * Get token symbol from denom for display purposes
 * @param denom Token denomination
 * @returns Human-readable symbol
 */
export function getTokenSymbol(denom: string): string {
  if (!denom) return 'UNKNOWN';
  
  // Handle different denom formats
  if (denom.startsWith('ibc/')) {
    // IBC tokens - try to extract from known patterns
    if (denom.includes('F082B65C88E4B6D5EF1DB243CDA1D331D002759E938A0F5CD3FFDC5D53B3E349')) {
      return 'USDC';
    }
    if (denom.includes('27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2')) {
      return 'ATOM';
    }
    return 'IBC';
  }
  
  if (denom.startsWith('ucore')) {
    return 'CORE';
  }
  
  if (denom.startsWith('drop-')) {
    return 'XRP';
  }
  
  if (denom.includes('solo')) {
    return 'SOLO';
  }
  
  if (denom.includes('osmo')) {
    return 'OSMO';
  }
  
  // Return first part before any separator
  return denom.split(/[-_]/)[0].toUpperCase();
}

/**
 * Format token amount for display
 * @param amount Token amount
 * @param decimals Number of decimal places
 * @returns Formatted amount string
 */
export function formatTokenAmount(amount: string | number, decimals: number = 6): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0';
  
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals
  });
}

/**
 * Calculate initial price ratio for the pool
 * @param token0Amount Amount of token 0
 * @param token1Amount Amount of token 1
 * @returns Price ratio (token1/token0)
 */
export function calculateInitialPrice(token0Amount: string, token1Amount: string): number {
  const amount0 = parseFloat(token0Amount);
  const amount1 = parseFloat(token1Amount);
  
  if (isNaN(amount0) || isNaN(amount1) || amount0 === 0) {
    return 0;
  }
  
  return amount1 / amount0;
}

/**
 * Get pool type description
 * @param poolType Astroport pool type
 * @returns Human-readable description
 */
export function getPoolTypeDescription(poolType: PoolType): string {
  switch (poolType) {
    case 'xyk':
      return 'XYK Pool - Constant product formula (x*y=k) for standard trading pairs';
    case 'stable':
      return 'Stable Pool - StableSwap curve optimized for stablecoin pairs with minimal slippage';
    case 'concentrated':
      return 'Concentrated Liquidity - Capital efficient pools with customizable price ranges';
    default:
      return 'Unknown pool type';
  }
}

/**
 * Get recommended pool type for a token pair
 * @param token0 First token
 * @param token1 Second token
 * @returns Recommended pool type
 */
export function getRecommendedPoolType(token0: string, token1: string): PoolType {
  const stablecoins = ['USDC', 'USDT', 'DAI', 'BUSD'];
  
  const isToken0Stable = stablecoins.some(s => token0.toUpperCase().includes(s));
  const isToken1Stable = stablecoins.some(s => token1.toUpperCase().includes(s));
  
  // Both stablecoins -> use stable pool
  if (isToken0Stable && isToken1Stable) {
    return 'stable';
  }
  
  // Standard pairs -> use XYK
  return 'xyk';
}

/**
 * Estimate Astroport fee tier (standard 0.3%)
 * @returns Fee tier in percentage
 */
export function getAstroportFeeTier(): number {
  // Astroport uses a standard 0.3% fee for all pool types
  return 0.3;
}




