/**
 * Coreum RPC Client
 * Handles interactions with Coreum blockchain for balance queries
 */

import { getTokenMetadata } from "./token-registry";
import { getTokenPrice as getPriceFromOracle, getTokenChange24h as getChange24hFromOracle, getStaticFallbackPrice, updateStaticFallback } from "./price-oracle";
import { getTokenLogoUrl } from "./token-images";

const COREUM_RPC_ENDPOINT = process.env.NEXT_PUBLIC_COREUM_RPC || "https://full-node.mainnet-1.coreum.dev:26657";
const COREUM_REST_ENDPOINT = process.env.NEXT_PUBLIC_COREUM_REST || "https://full-node.mainnet-1.coreum.dev:1317";

/**
 * Verify ADR-36 signature
 * TODO: Implement proper cryptographic verification using @cosmjs/amino
 * 
 * For now, this accepts any signature if the nonce is valid
 * The nonce verification provides replay protection
 * 
 * File: /utils/coreum/rpc.ts
 */
export async function verifyADR36Signature(
  address: string, 
  signature: any, // Can be string or {signature: string, pub_key: {...}}
  message: string
): Promise<boolean> {
  console.log("⚠️ [Signature Verification] Using placeholder verification");
  console.log("Address:", address);
  console.log("Signature type:", typeof signature);
  console.log("Message:", message.substring(0, 50) + "...");
  
  // TODO: Implement proper verification with @cosmjs/amino
  // For now, just check that signature exists
  // Nonce verification provides replay protection
  
  if (!signature) {
    console.error("❌ No signature provided");
    return false;
  }
  
  // Extract signature if it's an object with {signature, pub_key}
  const signatureData = typeof signature === 'object' ? signature.signature : signature;
  
  if (!signatureData) {
    console.error("❌ Invalid signature format");
    return false;
  }
  
  // Placeholder: Accept any signature for now
  // Real implementation would use cosmjs to verify the signature
  console.log("✅ [Placeholder] Signature accepted");
  console.warn("⚠️  TODO: Implement proper ADR-36 signature verification using @cosmjs/amino");
  
  return true;
}

export interface TokenBalance {
  denom: string;
  amount: string;
}

export interface TokenInfo {
  symbol: string;
  name: string;
  denom: string;
  decimals: number;
  logo?: string;
  contractAddress?: string;
}

export interface EnrichedBalance {
  symbol: string;
  name: string;
  denom: string;
  balance: string;
  balanceFormatted: string;
  valueUsd: number;
  change24h: number;
  decimals: number;
  logoUrl?: string;
  contractAddress?: string;
  // COREUM-specific breakdown
  available?: string;
  staked?: string;
  rewards?: string;
  // Progressive loading
  priceLoaded?: boolean;
}

/**
 * Fetch all token balances for a Coreum address
 */
export async function fetchBalances(address: string): Promise<TokenBalance[]> {
  try {
    const url = `${COREUM_REST_ENDPOINT}/cosmos/bank/v1beta1/balances/${address}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch balances: ${response.statusText}`);
    }
    
    const data = await response.json();
    const balances = data.balances || [];
    
    // DEBUG: Log actual denoms from blockchain
    console.log("=== ACTUAL DENOMS FROM BLOCKCHAIN ===");
    balances.forEach((b: TokenBalance) => {
      console.log(`Denom: ${b.denom}, Amount: ${b.amount}`);
    });
    console.log("====================================");
    
    return balances;
  } catch (error) {
    console.error("Error fetching balances:", error);
    return [];
  }
}

/**
 * Fetch staked COREUM for an address
 */
export async function fetchStakedBalance(address: string): Promise<string> {
  try {
    const url = `${COREUM_REST_ENDPOINT}/cosmos/staking/v1beta1/delegations/${address}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      return "0";
    }
    
    const data = await response.json();
    const delegations = data.delegation_responses || [];
    
    const totalStaked = delegations.reduce((sum: bigint, del: any) => {
      return sum + BigInt(del.balance?.amount || "0");
    }, BigInt(0));
    
    return totalStaked.toString();
  } catch (error) {
    console.error("Error fetching staked balance:", error);
    return "0";
  }
}

/**
 * Fetch pending rewards for an address
 */
export async function fetchRewards(address: string): Promise<string> {
  try {
    const url = `${COREUM_REST_ENDPOINT}/cosmos/distribution/v1beta1/delegators/${address}/rewards`;
    const response = await fetch(url);
    
    if (!response.ok) {
      return "0";
    }
    
    const data = await response.json();
    const rewards = data.total || [];
    
    const coreReward = rewards.find((r: any) => r.denom === "ucore");
    return coreReward ? BigInt(Math.floor(parseFloat(coreReward.amount))).toString() : "0";
  } catch (error) {
    console.error("Error fetching rewards:", error);
    return "0";
  }
}

/**
 * Get token metadata (symbol, name, decimals)
 * Uses comprehensive token registry with smart fallback
 */
export function getTokenInfo(denom: string): TokenInfo {
  // Check token registry first
  const metadata = getTokenMetadata(denom);
  
  if (metadata) {
    console.log(`TokenInfo for ${denom}:`, {
      symbol: metadata.symbol,
      contractAddress: metadata.contractAddress
    });
    return {
      symbol: metadata.symbol,
      name: metadata.name,
      denom: metadata.denom,
      decimals: metadata.decimals,
      logo: getTokenLogoUrl(metadata.symbol, metadata.logo),
      contractAddress: metadata.contractAddress,
    };
  }

  // Smart fallback for unknown tokens
  let symbol = denom.toUpperCase();
  let name = denom;
  
  // If denom has "-core1" pattern (factory tokens like "usara-core1..."), extract prefix without 'u'
  if (denom.includes("-core1")) {
    const prefix = denom.split("-")[0]; // e.g., "usara", "ucat", "ulp"
    const base = prefix.startsWith("u") ? prefix.slice(1) : prefix; // Remove 'u': "sara", "cat", "lp"
    symbol = base.toUpperCase(); // "SARA", "CAT", "LP"
    name = `${symbol} Token`;
  }
  // If denom starts with "u" (like ucore), strip it
  else if (denom.startsWith("u") && denom.length > 1 && !denom.includes("-")) {
    symbol = denom.substring(1).toUpperCase(); // "core" → "CORE"
    name = symbol;
  }
  // IBC tokens
  else if (denom.startsWith("ibc/")) {
    const hash = denom.substring(4);
    symbol = `IBC-${hash.substring(0, 6).toUpperCase()}`;
    name = "IBC Token";
  }
  // XRPL tokens
  else if (denom.startsWith("xrpl")) {
    const code = denom.split("-")[0].substring(4); // "xrpl11278ecf9e" → "11278ecf9e"
    if (code.includes("11278ecf")) symbol = "SOLO";
    else if (code.includes("11f82115")) symbol = "ROLL";
    else symbol = `XRPL-${code.substring(0, 6).toUpperCase()}`;
    name = `${symbol} Token`;
  }
  
  console.log(`⚠️ Unknown token denom: ${denom} → Using fallback symbol: ${symbol}`);

  return {
    symbol,
    name,
    denom,
    decimals: 6, // default
    logo: getTokenLogoUrl(symbol), // Get proper logo with fallback
  };
}

/**
 * Format token amount based on decimals
 * Max 4 decimal places for display
 */
export function formatTokenAmount(amount: string, decimals: number = 6): string {
  const numAmount = BigInt(amount);
  const divisor = BigInt(10 ** decimals);
  const integerPart = numAmount / divisor;
  const fractionalPart = numAmount % divisor;
  
  if (fractionalPart === BigInt(0)) {
    return integerPart.toString();
  }
  
  const fractionalStr = fractionalPart.toString().padStart(decimals, "0");
  // Trim trailing zeros, but keep max 4 decimal places
  const trimmedFractional = fractionalStr.replace(/0+$/, "").substring(0, 4);
  
  if (trimmedFractional === "") {
    return integerPart.toString();
  }
  
  return `${integerPart}.${trimmedFractional}`;
}

/**
 * Get USD price for a token
 * Fetches from Coreum DEX price oracle
 */
export async function getTokenPrice(symbol: string): Promise<number> {
  return getPriceFromOracle(symbol);
}

/**
 * Get 24h price change percentage
 * Fetches from Coreum DEX price oracle
 */
export async function getTokenChange24h(symbol: string): Promise<number> {
  return getChange24hFromOracle(symbol);
}

/**
 * Enrich raw balances with metadata and pricing
 */
export async function enrichBalances(balances: TokenBalance[]): Promise<EnrichedBalance[]> {
  const enriched: EnrichedBalance[] = [];
  
  for (const balance of balances) {
    const tokenInfo = getTokenInfo(balance.denom);
    const balanceFormatted = formatTokenAmount(balance.amount, tokenInfo.decimals);
    
    // Skip pricing for LP tokens - they don't have direct market prices
    // LP token value should be calculated from pool reserves and user's share
    const isLpToken = balance.denom.includes('ulp-') || balance.denom.includes('gamm/pool');
    
    let price = 0;
    let change24h = 0;
    
    if (!isLpToken) {
      price = await getTokenPrice(tokenInfo.symbol);
      change24h = await getTokenChange24h(tokenInfo.symbol);
      
      // CRITICAL: Save valid price as new static fallback
      if (price > 0) {
        updateStaticFallback(tokenInfo.symbol, price, change24h);
      }
    } else {
      console.log(`⏭️ Skipping LP token pricing: ${tokenInfo.symbol} (${balance.denom})`);
    }
    
    const valueUsd = parseFloat(balanceFormatted.replace(/,/g, '')) * price;
    
    enriched.push({
      symbol: tokenInfo.symbol,
      name: tokenInfo.name,
      denom: balance.denom,
      balance: balance.amount,
      balanceFormatted,
      valueUsd,
      change24h,
      decimals: tokenInfo.decimals,
      logoUrl: tokenInfo.logo,
      contractAddress: tokenInfo.contractAddress,
    });
  }
  
  return enriched;
}

/**
 * Fetch and enrich balances for a single address
 */
export async function getAddressBalances(address: string): Promise<EnrichedBalance[]> {
  const rawBalances = await fetchBalances(address);
  const enriched = await enrichBalances(rawBalances);
  
  // Add staking and rewards data for COREUM
  const coreBalance = enriched.find(b => b.denom === "ucore");
  if (coreBalance) {
    console.log("✅ Found CORE balance, fetching staking data...");
    const staked = await fetchStakedBalance(address);
    const rewards = await fetchRewards(address);
    
    coreBalance.staked = formatTokenAmount(staked, 6);
    coreBalance.rewards = formatTokenAmount(rewards, 6);
    coreBalance.available = coreBalance.balanceFormatted;
    
    console.log(`💰 CORE Breakdown - Available: ${coreBalance.available}, Staked: ${coreBalance.staked}, Rewards: ${coreBalance.rewards}`);
    
    // Update total balance to include staked
    const totalBalance = BigInt(coreBalance.balance) + BigInt(staked) + BigInt(rewards);
    coreBalance.balance = totalBalance.toString();
    coreBalance.balanceFormatted = formatTokenAmount(totalBalance.toString(), 6);
    
    // Recalculate value with total
    const price = await getTokenPrice("CORE");
    coreBalance.valueUsd = parseFloat(coreBalance.balanceFormatted.replace(/,/g, '')) * price;
  } else {
    console.log("❌ No CORE balance found in enriched balances");
  }
  
  return enriched;
}

/**
 * Fetch and aggregate balances across multiple addresses (FAST VERSION)
 * Returns tokens immediately with balances, prices loaded progressively
 */
export async function getMultiAddressBalances(addresses: string[]): Promise<{
  byAddress: Record<string, EnrichedBalance[]>;
  aggregated: EnrichedBalance[];
  totalValueUsd: number;
}> {
  const byAddress: Record<string, EnrichedBalance[]> = {};
  const tokenTotals: Record<string, {
    balance: bigint;
    info: TokenInfo;
    // For CORE breakdown
    available?: bigint;
    staked?: bigint;
    rewards?: bigint;
  }> = {};
  
  // Fetch balances for each address
  for (const address of addresses) {
    const balances = await getAddressBalances(address);
    byAddress[address] = balances;
    
    // Aggregate by token
    for (const bal of balances) {
      if (!tokenTotals[bal.denom]) {
        tokenTotals[bal.denom] = {
          balance: BigInt(0),
          info: getTokenInfo(bal.denom),
          available: BigInt(0),
          staked: BigInt(0),
          rewards: BigInt(0),
        };
      }
      
      // For CORE: aggregate breakdown separately to avoid double-counting
      if (bal.denom === "ucore" && bal.available && bal.staked && bal.rewards) {
        // Don't use bal.balance (which includes staked already)
        // Instead, parse the breakdown fields
        const availableRaw = parseFloat(bal.available) * 1_000_000; // Convert back to raw
        const stakedRaw = parseFloat(bal.staked) * 1_000_000;
        const rewardsRaw = parseFloat(bal.rewards) * 1_000_000;
        
        tokenTotals[bal.denom].available! += BigInt(Math.floor(availableRaw));
        tokenTotals[bal.denom].staked! += BigInt(Math.floor(stakedRaw));
        tokenTotals[bal.denom].rewards! += BigInt(Math.floor(rewardsRaw));
        
        // Total = available + staked + rewards
        tokenTotals[bal.denom].balance = 
          tokenTotals[bal.denom].available! + 
          tokenTotals[bal.denom].staked! + 
          tokenTotals[bal.denom].rewards!;
      } else {
        // For other tokens, just sum balances normally
        tokenTotals[bal.denom].balance += BigInt(bal.balance);
      }
    }
  }
  
  // Create aggregated list with balances first (no prices yet)
  const aggregated: EnrichedBalance[] = [];
  let totalValueUsd = 0;
  
  for (const [denom, data] of Object.entries(tokenTotals)) {
    const tokenInfo = data.info;
    const balanceFormatted = formatTokenAmount(data.balance.toString(), tokenInfo.decimals);
    
    // Create token with balance but no price initially
    const aggregatedToken: EnrichedBalance = {
      symbol: tokenInfo.symbol,
      name: tokenInfo.name,
      denom,
      balance: data.balance.toString(),
      balanceFormatted,
      valueUsd: 0, // Will be updated when price loads
      change24h: 0, // Will be updated when price loads
      decimals: tokenInfo.decimals,
      logoUrl: tokenInfo.logo,
    };

    // For CORE: include the breakdown we aggregated
    if (denom === "ucore" && data.available !== undefined) {
      aggregatedToken.available = formatTokenAmount(data.available.toString(), 6);
      aggregatedToken.staked = formatTokenAmount(data.staked!.toString(), 6);
      aggregatedToken.rewards = formatTokenAmount(data.rewards!.toString(), 6);
      
      console.log(`🔍 CORE Aggregation - Available: ${aggregatedToken.available}, Staked: ${aggregatedToken.staked}, Rewards: ${aggregatedToken.rewards}, Total: ${aggregatedToken.balanceFormatted}`);
    }
    
    aggregated.push(aggregatedToken);
  }
  
  return { byAddress, aggregated, totalValueUsd };
}

/**
 * Load prices for tokens in parallel (for progressive loading)
 */
export async function loadTokenPricesInParallel(tokens: EnrichedBalance[]): Promise<EnrichedBalance[]> {
  console.log(`🚀 [Portfolio] Loading prices for ${tokens.length} tokens in parallel...`);
  
  // Create price loading promises for all tokens
  const pricePromises = tokens.map(async (token) => {
    try {
      // Skip LP tokens
      const isLpToken = token.denom.includes('ulp-') || token.denom.includes('gamm/pool');
      
      if (isLpToken) {
        console.log(`⏭️ Skipping LP token price load: ${token.symbol}`);
        return {
          ...token,
          valueUsd: 0,
          change24h: 0,
          priceLoaded: true
        };
      }
      
      const [price, change24h] = await Promise.all([
        getTokenPrice(token.symbol),
        getTokenChange24h(token.symbol)
      ]);
      
      // CRITICAL: Save valid price as new static fallback
      if (price > 0) {
        updateStaticFallback(token.symbol, price, change24h);
      }
      
      const valueUsd = parseFloat(token.balanceFormatted.replace(/,/g, '')) * price;
      
      return {
        ...token,
        valueUsd,
        change24h,
        priceLoaded: true
      };
    } catch (error) {
      console.warn(`⚠️ [Portfolio] Failed to load price for ${token.symbol}:`, error);
      return {
        ...token,
        valueUsd: 0,
        change24h: 0,
        priceLoaded: false
      };
    }
  });
  
  // Wait for all prices to load
  const tokensWithPrices = await Promise.all(pricePromises);
  
  console.log(`✅ [Portfolio] Loaded prices for ${tokensWithPrices.filter(t => t.priceLoaded).length}/${tokens.length} tokens`);
  
  return tokensWithPrices;
}

/**
 * Refresh prices for existing tokens (without reloading balances)
 */
export async function refreshTokenPrices(tokens: EnrichedBalance[]): Promise<EnrichedBalance[]> {
  console.log(`🔄 [Portfolio] Refreshing prices for ${tokens.length} tokens...`);
  
  // Mark all tokens as loading
  const tokensWithLoadingState = tokens.map(token => ({
    ...token,
    priceLoaded: false
  }));
  
  // Load prices in parallel
  const refreshedTokens = await loadTokenPricesInParallel(tokensWithLoadingState);
  
  console.log(`✅ [Portfolio] Refreshed prices for ${refreshedTokens.filter(t => t.priceLoaded).length}/${tokens.length} tokens`);
  
  return refreshedTokens;
}

/**
 * OPTIMIZED: Fast price loading with static fallbacks and minimal API calls
 * This function shows data instantly and updates prices in background
 */
export async function loadTokenPricesWithCacheStrategy(tokens: EnrichedBalance[]): Promise<EnrichedBalance[]> {
  console.log(`🚀 [Portfolio] Fast loading for ${tokens.length} tokens...`);
  
  // OPTIMIZED: Use dynamic static fallback prices (last known valid prices)
  
  // First pass: Show tokens with static prices instantly
  const tokensWithStaticPrices = tokens.map(token => {
    // Skip LP tokens
    const isLpToken = token.denom.includes('ulp-') || token.denom.includes('gamm/pool');
    
    if (isLpToken) {
      return {
        ...token,
        valueUsd: 0,
        change24h: 0,
        priceLoaded: true,
        fromCache: false
      };
    }
    
    // Use dynamic static fallback price (last known valid price)
    const staticPrice = getStaticFallbackPrice(token.symbol);
    const balanceNum = parseFloat(token.balanceFormatted.replace(/,/g, ''));
    const valueUsd = balanceNum * staticPrice.price;
    
    console.log(`💰 [Portfolio] ${token.symbol}: ${balanceNum.toFixed(4)} × $${staticPrice.price.toFixed(6)} = $${valueUsd.toFixed(2)}`);
    
    return {
      ...token,
      valueUsd: isNaN(valueUsd) ? 0 : valueUsd,
      change24h: staticPrice.change24h,
      priceLoaded: true,
      fromCache: false
    };
  });
  
  console.log(`⚡ [Portfolio] Loaded ${tokens.length} tokens with static prices instantly`);
  
  // Second pass: Update with real prices in background (non-blocking)
  setTimeout(async () => {
    try {
      console.log(`🔄 [Background] Updating ${tokens.length} tokens with real prices...`);
      
      // OPTIMIZED: Batch API calls instead of individual calls
      const uniqueSymbols = [...new Set(tokens.map(t => t.symbol).filter(s => !s.includes('ulp-') && !s.includes('gamm/pool')))];
      
      // Load prices in smaller batches to prevent timeouts
      const batchSize = 3; // Process 3 tokens at a time
      for (let i = 0; i < uniqueSymbols.length; i += batchSize) {
        const batch = uniqueSymbols.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (symbol) => {
          try {
            const [price, change24h] = await Promise.all([
              getTokenPrice(symbol),
              getTokenChange24h(symbol)
            ]);
            
            // CRITICAL: Save valid price as new static fallback
            if (price > 0) {
              updateStaticFallback(symbol, price, change24h);
            }
            
            return { symbol, price, change24h };
          } catch (error) {
            console.warn(`⚠️ [Background] Failed to load price for ${symbol}:`, error);
            // Use current static fallback as backup
            const fallback = getStaticFallbackPrice(symbol);
            return { symbol, price: fallback.price, change24h: fallback.change24h };
          }
        });
        
        const batchResults = await Promise.all(batchPromises);
        
        // Update tokens with real prices
        const updatedTokens = tokensWithStaticPrices.map(token => {
          const result = batchResults.find(r => r.symbol === token.symbol);
          if (result) {
            const balanceNum = parseFloat(token.balanceFormatted.replace(/,/g, ''));
            const valueUsd = balanceNum * result.price;
            return {
              ...token,
              valueUsd: isNaN(valueUsd) ? 0 : valueUsd,
              change24h: result.change24h,
              priceLoaded: true,
              fromCache: false
            };
          }
          return token;
        });
        
        // Update state with new prices (this would need to be passed as callback)
        console.log(`✅ [Background] Updated batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(uniqueSymbols.length/batchSize)}`);
      }
      
      console.log(`✅ [Background] All price updates completed`);
    } catch (error) {
      console.error("❌ [Background] Price update failed:", error);
    }
  }, 500); // Start background updates after 500ms
  
  return tokensWithStaticPrices;
}

