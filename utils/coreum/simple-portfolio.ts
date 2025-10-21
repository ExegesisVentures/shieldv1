/**
 * SIMPLE PORTFOLIO LOADER
 * One RPC query to get balances + prices directly from Coreum
 * No caching, no fallbacks, no complexity - just direct data
 */

import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';

const COREUM_RPC = 'https://full-node.mainnet-1.coreum.dev:26657';

interface SimpleTokenBalance {
  denom: string;
  amount: string;
  symbol: string;
  decimals: number;
  price?: number;
  valueUsd?: number;
}

interface SimplePortfolio {
  tokens: SimpleTokenBalance[];
  totalValueUsd: number;
  address: string;
}

/**
 * Get complete portfolio data in ONE RPC call
 * This is what the portfolio should actually do - simple and direct
 */
export async function getSimplePortfolio(address: string): Promise<SimplePortfolio> {
  console.log(`🚀 [Simple Portfolio] Loading portfolio for ${address}...`);
  
  try {
    // Connect to Coreum RPC
    const client = await CosmWasmClient.connect(COREUM_RPC);
    
    // Get all balances using REST API
    const response = await fetch(`${COREUM_RPC.replace('26657', '1317')}/cosmos/bank/v1beta1/balances/${address}`);
    const data = await response.json();
    const balances = data.balances || [];
    
    console.log(`📊 [Simple Portfolio] Found ${balances.length} token balances`);
    
    // Convert to simple format
    const tokens: SimpleTokenBalance[] = balances.map(balance => {
      const denom = balance.denom;
      const amount = balance.amount;
      
      // Basic token info (you can expand this)
      let symbol = denom;
      let decimals = 6;
      
      if (denom === 'ucore') {
        symbol = 'CORE';
        decimals = 6;
      } else if (denom.startsWith('ibc/')) {
        // IBC tokens - you'd need to resolve these
        symbol = denom.substring(0, 20) + '...';
      } else if (denom.startsWith('factory/')) {
        // Factory tokens
        symbol = denom.split('/').pop() || denom;
      }
      
      return {
        denom,
        amount,
        symbol,
        decimals,
        // Price will be calculated from pool data
      };
    });
    
    // Get prices from liquidity pools (if needed)
    // This is where you'd add ONE simple price lookup
    const tokensWithPrices = await addSimplePrices(tokens);
    
    // Calculate total value
    const totalValueUsd = tokensWithPrices.reduce((sum, token) => {
      return sum + (token.valueUsd || 0);
    }, 0);
    
    console.log(`✅ [Simple Portfolio] Loaded ${tokensWithPrices.length} tokens, total value: $${totalValueUsd.toFixed(2)}`);
    
    return {
      tokens: tokensWithPrices,
      totalValueUsd,
      address
    };
    
  } catch (error) {
    console.error('❌ [Simple Portfolio] Error:', error);
    throw error;
  }
}

/**
 * Add simple prices from liquidity pools
 * This is the ONLY place we should get prices from
 */
async function addSimplePrices(tokens: SimpleTokenBalance[]): Promise<SimpleTokenBalance[]> {
  console.log(`💰 [Simple Portfolio] Getting prices for ${tokens.length} tokens...`);
  
  // For now, just add basic prices
  // You can expand this to query actual liquidity pools
  return tokens.map(token => {
    let price = 0;
    
    // Basic price mapping (expand this with actual pool queries)
    if (token.symbol === 'CORE') {
      price = 0.12; // Example price
    } else if (token.symbol.includes('XRP')) {
      price = 0.5; // Example price
    }
    // Add more tokens as needed
    
    const valueUsd = price * (parseInt(token.amount) / Math.pow(10, token.decimals));
    
    return {
      ...token,
      price,
      valueUsd
    };
  });
}

/**
 * Get portfolio for multiple addresses
 */
export async function getMultiAddressSimplePortfolio(addresses: string[]): Promise<{
  byAddress: Record<string, SimplePortfolio>;
  aggregated: SimpleTokenBalance[];
  totalValueUsd: number;
}> {
  console.log(`🚀 [Simple Portfolio] Loading portfolios for ${addresses.length} addresses...`);
  
  // Load all portfolios in parallel
  const portfolios = await Promise.all(
    addresses.map(address => getSimplePortfolio(address))
  );
  
  // Create by-address mapping
  const byAddress: Record<string, SimplePortfolio> = {};
  portfolios.forEach(portfolio => {
    byAddress[portfolio.address] = portfolio;
  });
  
  // Aggregate all tokens
  const tokenMap = new Map<string, SimpleTokenBalance>();
  
  portfolios.forEach(portfolio => {
    portfolio.tokens.forEach(token => {
      const existing = tokenMap.get(token.denom);
      if (existing) {
        // Add to existing balance
        const existingAmount = parseInt(existing.amount);
        const newAmount = parseInt(token.amount);
        existing.amount = (existingAmount + newAmount).toString();
        existing.valueUsd = (existing.valueUsd || 0) + (token.valueUsd || 0);
      } else {
        // Add new token
        tokenMap.set(token.denom, { ...token });
      }
    });
  });
  
  const aggregated = Array.from(tokenMap.values());
  const totalValueUsd = aggregated.reduce((sum, token) => sum + (token.valueUsd || 0), 0);
  
  console.log(`✅ [Simple Portfolio] Aggregated ${aggregated.length} unique tokens, total value: $${totalValueUsd.toFixed(2)}`);
  
  return {
    byAddress,
    aggregated,
    totalValueUsd
  };
}

/**
 * Test the simple portfolio loader
 */
export async function testSimplePortfolio(address: string): Promise<void> {
  console.log(`🧪 [Test] Testing simple portfolio for ${address}...`);
  
  const startTime = Date.now();
  
  try {
    const portfolio = await getSimplePortfolio(address);
    const endTime = Date.now();
    
    console.log(`✅ [Test] Success! Loaded in ${endTime - startTime}ms`);
    console.log(`📊 [Test] Portfolio:`, {
      address: portfolio.address,
      tokenCount: portfolio.tokens.length,
      totalValue: `$${portfolio.totalValueUsd.toFixed(2)}`,
      tokens: portfolio.tokens.map(t => ({
        symbol: t.symbol,
        balance: (parseInt(t.amount) / Math.pow(10, t.decimals)).toFixed(4),
        value: `$${(t.valueUsd || 0).toFixed(2)}`
      }))
    });
    
  } catch (error) {
    console.error(`❌ [Test] Failed:`, error);
  }
}
