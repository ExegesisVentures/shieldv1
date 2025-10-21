/**
 * Coreum RPC Price Oracle
 * 
 * Fetches token information and pricing data directly from the Coreum blockchain
 * using the public RPC endpoints. This provides a more reliable source of
 * token data than external APIs.
 */

// Coreum RPC endpoints
const COREDEX_RPC = "https://rpc.coreum.com";
const COREDEX_REST = "https://rest.coreum.com";

// Token metadata cache
const tokenCache = new Map<string, any>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface TokenInfo {
  denom: string;
  symbol: string;
  name: string;
  decimals: number;
  total_supply: string;
  description?: string;
  uri?: string;
  uri_hash?: string;
}

interface TokenBalance {
  denom: string;
  amount: string;
}

interface PoolInfo {
  id: string;
  token_a: TokenBalance;
  token_b: TokenBalance;
  swap_fee: string;
  exit_fee: string;
  pool_coin_denom: string;
  max_amount_in: string;
  max_amount_out: string;
}

/**
 * Fetch token information from Coreum RPC
 */
export async function fetchTokenInfoFromRPC(denom: string): Promise<TokenInfo | null> {
  try {
    console.log(`🔍 [Coreum RPC] Fetching token info for ${denom}`);
    
    // Check cache first
    const cached = tokenCache.get(denom);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      console.log(`💾 [Coreum RPC Cache] ${denom}: Using cached data`);
      return cached.data;
    }

    // Fetch from RPC
    const response = await fetch(`${COREDEX_REST}/coreum/asset/ft/v1/tokens/${denom}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.log(`❌ [Coreum RPC] Failed to fetch token info for ${denom}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const tokenInfo: TokenInfo = {
      denom: data.token?.denom || denom,
      symbol: data.token?.symbol || denom,
      name: data.token?.name || denom,
      decimals: data.token?.decimals || 6,
      total_supply: data.token?.total_supply || "0",
      description: data.token?.description,
      uri: data.token?.uri,
      uri_hash: data.token?.uri_hash,
    };

    // Cache the result
    tokenCache.set(denom, { data: tokenInfo, timestamp: Date.now() });
    
    console.log(`✅ [Coreum RPC] ${denom}: ${tokenInfo.symbol} (${tokenInfo.name})`);
    return tokenInfo;

  } catch (error) {
    console.error(`❌ [Coreum RPC] Error fetching token info for ${denom}:`, error);
    return null;
  }
}

/**
 * Fetch all available tokens from Coreum RPC
 */
export async function fetchAllTokensFromRPC(): Promise<TokenInfo[]> {
  try {
    console.log(`🔍 [Coreum RPC] Fetching all tokens`);
    
    const response = await fetch(`${COREDEX_REST}/coreum/asset/ft/v1/tokens`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.log(`❌ [Coreum RPC] Failed to fetch all tokens: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const tokens: TokenInfo[] = (data.tokens || []).map((token: any) => ({
      denom: token.denom,
      symbol: token.symbol,
      name: token.name,
      decimals: token.decimals,
      total_supply: token.total_supply,
      description: token.description,
      uri: token.uri,
      uri_hash: token.uri_hash,
    }));

    console.log(`✅ [Coreum RPC] Found ${tokens.length} tokens`);
    return tokens;

  } catch (error) {
    console.error(`❌ [Coreum RPC] Error fetching all tokens:`, error);
    return [];
  }
}

/**
 * Fetch liquidity pools from Coreum RPC
 */
export async function fetchLiquidityPoolsFromRPC(): Promise<PoolInfo[]> {
  try {
    console.log(`🔍 [Coreum RPC] Fetching liquidity pools`);
    
    const response = await fetch(`${COREDEX_REST}/coreum/asset/ft/v1/pools`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.log(`❌ [Coreum RPC] Failed to fetch pools: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const pools: PoolInfo[] = (data.pools || []).map((pool: any) => ({
      id: pool.id,
      token_a: pool.token_a,
      token_b: pool.token_b,
      swap_fee: pool.swap_fee,
      exit_fee: pool.exit_fee,
      pool_coin_denom: pool.pool_coin_denom,
      max_amount_in: pool.max_amount_in,
      max_amount_out: pool.max_amount_out,
    }));

    console.log(`✅ [Coreum RPC] Found ${pools.length} liquidity pools`);
    return pools;

  } catch (error) {
    console.error(`❌ [Coreum RPC] Error fetching liquidity pools:`, error);
    return [];
  }
}

/**
 * Calculate token price from liquidity pool
 */
export function calculateTokenPriceFromPool(pool: PoolInfo, targetDenom: string): number | null {
  try {
    // Find which token in the pool is our target
    const isTokenA = pool.token_a.denom === targetDenom;
    const isTokenB = pool.token_b.denom === targetDenom;
    
    if (!isTokenA && !isTokenB) {
      return null;
    }

    const targetToken = isTokenA ? pool.token_a : pool.token_b;
    const otherToken = isTokenA ? pool.token_b : pool.token_a;
    
    // Calculate price based on pool ratio
    const targetAmount = parseFloat(targetToken.amount);
    const otherAmount = parseFloat(otherToken.amount);
    
    if (targetAmount === 0 || otherAmount === 0) {
      return null;
    }

    // Price = other_token_amount / target_token_amount
    const price = otherAmount / targetAmount;
    
    console.log(`💰 [Pool Price] ${targetDenom}: ${price.toFixed(6)} (from pool ${pool.id})`);
    return price;

  } catch (error) {
    console.error(`❌ [Pool Price] Error calculating price for ${targetDenom}:`, error);
    return null;
  }
}

/**
 * Fetch token price from Coreum RPC using liquidity pools
 */
export async function fetchTokenPriceFromRPC(denom: string): Promise<{ price: number; change24h: number } | null> {
  try {
    console.log(`🔍 [Coreum RPC] Fetching price for ${denom}`);
    
    // First, get token info
    const tokenInfo = await fetchTokenInfoFromRPC(denom);
    if (!tokenInfo) {
      console.log(`❌ [Coreum RPC] Token ${denom} not found`);
      return null;
    }

    // Get all liquidity pools
    const pools = await fetchLiquidityPoolsFromRPC();
    
    // Find pools that contain our token
    const relevantPools = pools.filter(pool => 
      pool.token_a.denom === denom || pool.token_b.denom === denom
    );

    if (relevantPools.length === 0) {
      console.log(`❌ [Coreum RPC] No liquidity pools found for ${denom}`);
      return null;
    }

    // Calculate price from the first relevant pool
    const price = calculateTokenPriceFromPool(relevantPools[0], denom);
    if (price === null) {
      console.log(`❌ [Coreum RPC] Could not calculate price for ${denom}`);
      return null;
    }

    // For now, we don't have 24h change data from RPC
    // This would require historical data or external price feeds
    const change24h = 0;

    console.log(`✅ [Coreum RPC] ${denom}: $${price.toFixed(6)} (from liquidity pool)`);
    return { price, change24h };

  } catch (error) {
    console.error(`❌ [Coreum RPC] Error fetching price for ${denom}:`, error);
    return null;
  }
}

/**
 * Get token balance for an address
 */
export async function getTokenBalanceFromRPC(address: string, denom: string): Promise<string> {
  try {
    console.log(`🔍 [Coreum RPC] Fetching balance for ${address} (${denom})`);
    
    const response = await fetch(`${COREDEX_REST}/cosmos/bank/v1beta1/balances/${address}/${denom}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.log(`❌ [Coreum RPC] Failed to fetch balance: ${response.status}`);
      return "0";
    }

    const data = await response.json();
    const balance = data.balance?.amount || "0";
    
    console.log(`✅ [Coreum RPC] ${address} balance: ${balance} ${denom}`);
    return balance;

  } catch (error) {
    console.error(`❌ [Coreum RPC] Error fetching balance:`, error);
    return "0";
  }
}

/**
 * Get all token balances for an address
 */
export async function getAllTokenBalancesFromRPC(address: string): Promise<TokenBalance[]> {
  try {
    console.log(`🔍 [Coreum RPC] Fetching all balances for ${address}`);
    
    const response = await fetch(`${COREDEX_REST}/cosmos/bank/v1beta1/balances/${address}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.log(`❌ [Coreum RPC] Failed to fetch balances: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const balances: TokenBalance[] = (data.balances || []).map((balance: any) => ({
      denom: balance.denom,
      amount: balance.amount,
    }));

    console.log(`✅ [Coreum RPC] Found ${balances.length} token balances for ${address}`);
    return balances;

  } catch (error) {
    console.error(`❌ [Coreum RPC] Error fetching balances:`, error);
    return [];
  }
}

/**
 * Test Coreum RPC connectivity
 */
export async function testCoreumRPCConnectivity(): Promise<boolean> {
  try {
    console.log(`🔍 [Coreum RPC] Testing connectivity`);
    
    const response = await fetch(`${COREDEX_REST}/cosmos/base/tendermint/v1beta1/node_info`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.log(`❌ [Coreum RPC] Connectivity test failed: ${response.status}`);
      return false;
    }

    const data = await response.json();
    console.log(`✅ [Coreum RPC] Connected to: ${data.default_node_info?.moniker || 'Unknown'}`);
    return true;

  } catch (error) {
    console.error(`❌ [Coreum RPC] Connectivity test error:`, error);
    return false;
  }
}
