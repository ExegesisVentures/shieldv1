/**
 * DIRECT RPC PRICE FETCHER
 * Get token prices directly from Coreum liquidity pools
 * No APIs, no caching, no complexity - just direct on-chain data
 */

import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';

const COREUM_RPC = 'https://full-node.mainnet-1.coreum.dev:26657';

interface PoolInfo {
  id: string;
  token_a: { denom: string; amount: string };
  token_b: { denom: string; amount: string };
  pool_type: string;
}

interface TokenPrice {
  denom: string;
  price: number;
  liquidity: number;
  pool_id: string;
}

/**
 * Get ALL token prices from liquidity pools in ONE RPC call
 * This is how it should be done - simple and direct
 */
export async function getAllTokenPricesFromRPC(): Promise<Map<string, TokenPrice>> {
  console.log(`🚀 [Direct RPC] Fetching all token prices from liquidity pools...`);
  
  try {
    const client = await CosmWasmClient.connect(COREUM_RPC);
    
    // Query all liquidity pools
    const pools = await client.queryContractSmart(
      'core1eg7rdhf8mz8dhkxq6r2dtfkxkyds3330gkkfkj', // Astroport factory address
      {
        pools: {}
      }
    );
    
    console.log(`📊 [Direct RPC] Found ${pools.pools.length} liquidity pools`);
    
    const priceMap = new Map<string, TokenPrice>();
    
    // Calculate prices from each pool
    pools.pools.forEach((pool: PoolInfo) => {
      const { token_a, token_b, id } = pool;
      
      // Calculate price of token_a in terms of token_b
      const amountA = parseInt(token_a.amount);
      const amountB = parseInt(token_b.amount);
      
      if (amountA > 0 && amountB > 0) {
        const priceA = amountB / amountA; // Price of A in terms of B
        const priceB = amountA / amountB; // Price of B in terms of A
        
        // Store both prices
        priceMap.set(token_a.denom, {
          denom: token_a.denom,
          price: priceA,
          liquidity: amountA + amountB,
          pool_id: id
        });
        
        priceMap.set(token_b.denom, {
          denom: token_b.denom,
          price: priceB,
          liquidity: amountA + amountB,
          pool_id: id
        });
      }
    });
    
    console.log(`✅ [Direct RPC] Calculated prices for ${priceMap.size} tokens`);
    
    return priceMap;
    
  } catch (error) {
    console.error('❌ [Direct RPC] Error fetching prices:', error);
    throw error;
  }
}

/**
 * Get price for a specific token from RPC
 */
export async function getTokenPriceFromRPC(denom: string): Promise<number | null> {
  console.log(`🔍 [Direct RPC] Getting price for ${denom}...`);
  
  try {
    const priceMap = await getAllTokenPricesFromRPC();
    const tokenPrice = priceMap.get(denom);
    
    if (tokenPrice) {
      console.log(`✅ [Direct RPC] ${denom}: $${tokenPrice.price.toFixed(6)} (liquidity: ${tokenPrice.liquidity})`);
      return tokenPrice.price;
    } else {
      console.log(`❌ [Direct RPC] No price found for ${denom}`);
      return null;
    }
    
  } catch (error) {
    console.error(`❌ [Direct RPC] Error getting price for ${denom}:`, error);
    return null;
  }
}

/**
 * Get prices for multiple tokens in one call
 */
export async function getMultipleTokenPricesFromRPC(denoms: string[]): Promise<Map<string, number>> {
  console.log(`🚀 [Direct RPC] Getting prices for ${denoms.length} tokens...`);
  
  try {
    const priceMap = await getAllTokenPricesFromRPC();
    const result = new Map<string, number>();
    
    denoms.forEach(denom => {
      const tokenPrice = priceMap.get(denom);
      if (tokenPrice) {
        result.set(denom, tokenPrice.price);
      }
    });
    
    console.log(`✅ [Direct RPC] Found prices for ${result.size}/${denoms.length} tokens`);
    
    return result;
    
  } catch (error) {
    console.error('❌ [Direct RPC] Error getting multiple prices:', error);
    throw error;
  }
}

/**
 * Complete portfolio loader with direct RPC prices
 * This is the RIGHT way to do it - one call for balances, one call for prices
 */
export async function getCompletePortfolioFromRPC(address: string): Promise<{
  tokens: Array<{
    denom: string;
    amount: string;
    symbol: string;
    decimals: number;
    price: number;
    valueUsd: number;
  }>;
  totalValueUsd: number;
}> {
  console.log(`🚀 [Complete RPC] Loading complete portfolio for ${address}...`);
  
  try {
    const client = await CosmWasmClient.connect(COREUM_RPC);
    
    // Get balances using REST API
    const response = await fetch(`${COREUM_RPC.replace('26657', '1317')}/cosmos/bank/v1beta1/balances/${address}`);
    const data = await response.json();
    const balances = data.balances || [];
    console.log(`📊 [Complete RPC] Found ${balances.length} token balances`);
    
    // Get all prices
    const priceMap = await getAllTokenPricesFromRPC();
    console.log(`💰 [Complete RPC] Found ${priceMap.size} token prices`);
    
    // Combine balances with prices
    const tokens = balances.map(balance => {
      const denom = balance.denom;
      const amount = balance.amount;
      
      // Get price
      const tokenPrice = priceMap.get(denom);
      const price = tokenPrice ? tokenPrice.price : 0;
      
      // Basic token info
      let symbol = denom;
      let decimals = 6;
      
      if (denom === 'ucore') {
        symbol = 'CORE';
        decimals = 6;
      } else if (denom.startsWith('ibc/')) {
        symbol = denom.substring(0, 20) + '...';
      } else if (denom.startsWith('factory/')) {
        symbol = denom.split('/').pop() || denom;
      }
      
      // Calculate value
      const balanceFormatted = parseInt(amount) / Math.pow(10, decimals);
      const valueUsd = balanceFormatted * price;
      
      return {
        denom,
        amount,
        symbol,
        decimals,
        price,
        valueUsd
      };
    });
    
    // Calculate total value
    const totalValueUsd = tokens.reduce((sum, token) => sum + token.valueUsd, 0);
    
    console.log(`✅ [Complete RPC] Portfolio loaded: ${tokens.length} tokens, total value: $${totalValueUsd.toFixed(2)}`);
    
    return {
      tokens,
      totalValueUsd
    };
    
  } catch (error) {
    console.error('❌ [Complete RPC] Error loading portfolio:', error);
    throw error;
  }
}

/**
 * Test the direct RPC approach
 */
export async function testDirectRPCApproach(address: string): Promise<void> {
  console.log(`🧪 [Test] Testing direct RPC approach for ${address}...`);
  
  const startTime = Date.now();
  
  try {
    const portfolio = await getCompletePortfolioFromRPC(address);
    const endTime = Date.now();
    
    console.log(`✅ [Test] Success! Loaded in ${endTime - startTime}ms`);
    console.log(`📊 [Test] Portfolio:`, {
      address,
      tokenCount: portfolio.tokens.length,
      totalValue: `$${portfolio.totalValueUsd.toFixed(2)}`,
      tokens: portfolio.tokens.map(t => ({
        symbol: t.symbol,
        balance: (parseInt(t.amount) / Math.pow(10, t.decimals)).toFixed(4),
        price: `$${t.price.toFixed(6)}`,
        value: `$${t.valueUsd.toFixed(2)}`
      }))
    });
    
  } catch (error) {
    console.error(`❌ [Test] Failed:`, error);
  }
}
