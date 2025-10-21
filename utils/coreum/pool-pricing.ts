/**
 * ============================================
 * POOL-BASED PRICING SYSTEM
 * ============================================
 * 
 * Direct pool queries + batch CoinGecko for base tokens
 * NO VPS API dependency
 * 
 * Features:
 * - Pool hopping (calculate via CORE)
 * - Batch pricing (CORE, XRP, SARA, SOLO)
 * - 111 trading pairs
 * - 5-minute caching
 * - XRPL Oracle fallback
 * 
 * File: /utils/coreum/pool-pricing.ts
 */

import { getCurrentPoolPrice } from './pool-price-client';
import { buildCoreDexUrl, COREDEX_NETWORK_HEADER, COREDEX_BASE_URL, COREDEX_WS_URL } from './coredex-config';
import tokensListData from '@/data/tokens-list.json';

// Use full pairs file (111 pairs from root coreum_tokens.json)
let tradingPairsData: any;
try {
  tradingPairsData = require('@/data/trading-pairs-full.json');
} catch {
  // Fallback to partial file if full doesn't exist yet
  tradingPairsData = require('@/data/trading-pairs.json');
}

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface Ticker {
  OpenTime: number;
  CloseTime: number;
  OpenPrice: number;
  HighPrice: number;
  LowPrice: number;
  LastPrice: number;
  FirstPrice: number;
  Volume: number;
  InvertedVolume: number;
}

export interface TickersResponse {
  Tickers: Record<string, Ticker>;
  USDTickers: Record<string, Ticker>;
}

export interface Currency {
  Denom: {
    Currency: string;
    Issuer: string;
    Precision: number;
  };
  MetaData?: {
    Symbol?: string;
    Name?: string;
    Decimals?: number;
  };
}

export interface Trade {
  Account: string;
  OrderID: string;
  Sequence: number;
  Amount: { Value: string };
  Price: number;
  Denom1: { Denom: string; Currency: string };
  Denom2: { Denom: string; Currency: string };
  Side: number; // 1 = buy, 2 = sell
  BlockTime: { seconds: number };
  USD?: number;
}

export interface OHLCPoint {
  OpenTime: number;
  CloseTime: number;
  Open: number;
  High: number;
  Low: number;
  Close: number;
  Volume: number;
}

export interface TokenInfo {
  symbol: string;
  name: string;
  denom: string;
  contractAddress?: string;
  type: 'native' | 'cw20' | 'xrpl' | 'ibc';
  decimals: number;
  logo?: string;
  description?: string;
}

export interface TradingPair {
  symbol: string;
  displaySymbol: string;
  baseDenom: string;
  quoteDenom: string;
  baseSymbol: string;
  quoteSymbol: string;
  apiSymbol: string;
  pools: Array<{
    dex: string;
    contract: string;
  }>;
  popular?: boolean;
}

// ============================================
// CACHE MANAGEMENT
// ============================================

interface CachedData<T> {
  data: T;
  timestamp: number;
}

const currenciesCache: { data: Currency[] | null; timestamp: number } = {
  data: null,
  timestamp: 0
};

const tickersCache: Map<string, { data: Ticker; timestamp: number }> = new Map();

const CURRENCY_CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const TICKER_CACHE_TTL = 30 * 1000; // 30 seconds

// ============================================
// STATIC DATA HELPERS
// ============================================

/**
 * Get all tokens from local JSON data
 */
export function getAllTokens(): TokenInfo[] {
  return tokensListData.tokens as TokenInfo[];
}

/**
 * Get all trading pairs from local JSON data
 */
export function getAllTradingPairs(): TradingPair[] {
  return tradingPairsData.pairs as TradingPair[];
}

/**
 * Symbol aliases for common variations
 */
const SYMBOL_ALIASES: Record<string, string> = {
  'CORE': 'COREUM',  // Wallet uses "CORE" but tokens-list has "COREUM"
  'COREUM': 'CORE',  // Reverse alias
  'XRP': 'XRP-570c00a6', // Default XRP variant
  'DROP': 'XRP',     // DROP is XRP
  'SOLO': 'XRP-11278ecf', // SOLO variant
  'ROLL': 'XRP-11f82115a5', // ROLL variant
};

/**
 * Find token by symbol (with alias support)
 */
export function findTokenBySymbol(symbol: string): TokenInfo | null {
  const tokens = getAllTokens();
  const upperSymbol = symbol.toUpperCase();
  
  // Try direct match first
  let token = tokens.find(t => t.symbol.toUpperCase() === upperSymbol);
  
  // Try alias
  if (!token && SYMBOL_ALIASES[upperSymbol]) {
    const aliasSymbol = SYMBOL_ALIASES[upperSymbol];
    token = tokens.find(t => t.symbol.toUpperCase() === aliasSymbol.toUpperCase());
  }
  
  return token || null;
}

/**
 * Find token by denom
 */
export function findTokenByDenom(denom: string): TokenInfo | null {
  const tokens = getAllTokens();
  return tokens.find(t => t.denom === denom) || null;
}

/**
 * Find trading pair by symbols
 */
export function findTradingPair(baseSymbol: string, quoteSymbol: string): TradingPair | null {
  const pairs = getAllTradingPairs();
  return pairs.find(p => 
    p.baseSymbol.toUpperCase() === baseSymbol.toUpperCase() &&
    p.quoteSymbol.toUpperCase() === quoteSymbol.toUpperCase()
  ) || null;
}

/**
 * Get trading pairs for a token (with alias support)
 */
export function getTradingPairsForToken(symbol: string): TradingPair[] {
  const pairs = getAllTradingPairs();
  let upperSymbol = symbol.toUpperCase();
  
  // Apply alias if exists
  if (SYMBOL_ALIASES[upperSymbol]) {
    upperSymbol = SYMBOL_ALIASES[upperSymbol].toUpperCase();
  }
  
  return pairs.filter(p => {
    // Null safety
    if (!p || !p.baseSymbol || !p.quoteSymbol) return false;
    
    return p.baseSymbol.toUpperCase() === upperSymbol ||
           p.quoteSymbol.toUpperCase() === upperSymbol;
  });
}

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Fetch all available currencies from CoreDEX API
 * Cached for 10 minutes
 */
export async function fetchCurrencies(forceFresh: boolean = false): Promise<Currency[]> {
  // Check cache
  if (!forceFresh && currenciesCache.data && (Date.now() - currenciesCache.timestamp < CURRENCY_CACHE_TTL)) {
    console.log(`💾 [CoreDEX VPS] Returning ${currenciesCache.data.length} currencies from cache`);
    return currenciesCache.data;
  }

  try {
    console.log(`🌐 [CoreDEX VPS] Fetching currencies from API...`);
    
    const response = await fetch(buildCoreDexUrl('/currencies'), {
      headers: {
        'Network': COREDEX_NETWORK_HEADER,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`CoreDEX API returned ${response.status}`);
    }

    const data = await response.json();
    const currencies = data.Currencies || [];

    // Update cache
    currenciesCache.data = currencies;
    currenciesCache.timestamp = Date.now();

    console.log(`✅ [CoreDEX VPS] Fetched ${currencies.length} currencies`);
    return currencies;

  } catch (error) {
    console.error(`❌ [CoreDEX VPS] Failed to fetch currencies:`, error);
    
    // Return stale cache if available
    if (currenciesCache.data) {
      console.log(`⚠️ [CoreDEX VPS] Returning stale cache (${currenciesCache.data.length} currencies)`);
      return currenciesCache.data;
    }
    
    return [];
  }
}

/**
 * Fetch tickers for specific trading pair symbols
 * @param symbols Array of trading pair symbols (e.g., ["ucore_usara-core1r9gc..."])
 * @param maxSymbols Maximum 40 symbols per request (API limit)
 * @returns Ticker data for each symbol
 */
export async function fetchTickers(symbols: string[]): Promise<TickersResponse | null> {
  if (symbols.length === 0) {
    console.warn(`⚠️ [CoreDEX VPS] No symbols provided to fetchTickers`);
    return null;
  }

  if (symbols.length > 40) {
    console.warn(`⚠️ [CoreDEX VPS] Maximum 40 symbols per request (got ${symbols.length})`);
    symbols = symbols.slice(0, 40);
  }

  try {
    // Base64 encode the symbols array (VPS API format)
    const symbolsParam = btoa(JSON.stringify(symbols));
    
    console.log(`📊 [CoreDEX VPS] Fetching tickers for ${symbols.length} symbols...`);
    
    const response = await fetch(buildCoreDexUrl('/tickers', `symbols=${symbolsParam}`), {
      headers: {
        'Network': COREDEX_NETWORK_HEADER,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [CoreDEX VPS] Tickers API returned ${response.status}: ${errorText}`);
      return null;
    }

    const data: TickersResponse = await response.json();
    
    const tickerCount = Object.keys(data.Tickers || {}).length;
    console.log(`✅ [CoreDEX VPS] Received ${tickerCount} tickers`);
    
    // Update cache for each ticker
    Object.entries(data.Tickers || {}).forEach(([symbol, ticker]) => {
      tickersCache.set(symbol, {
        data: ticker,
        timestamp: Date.now()
      });
    });
    
    return data;

  } catch (error) {
    console.error(`❌ [CoreDEX VPS] Failed to fetch tickers:`, error);
    return null;
  }
}

/**
 * Get OHLC candlestick data
 * @param symbol Trading pair symbol
 * @param interval 1m, 5m, 15m, 1h, 4h, 1d, 1w
 * @param from Unix timestamp
 * @param to Unix timestamp
 */
export async function getOHLC(
  symbol: string,
  interval: string,
  from?: number,
  to?: number
): Promise<{ OHLC: OHLCPoint[] } | null> {
  try {
    let url = `/ohlc?symbol=${encodeURIComponent(symbol)}&interval=${interval}`;
    if (from) url += `&from=${from}`;
    if (to) url += `&to=${to}`;
    
    console.log(`📈 [CoreDEX VPS] Fetching OHLC for ${symbol}...`);
    
    const response = await fetch(buildCoreDexUrl(url), {
      headers: {
        'Network': COREDEX_NETWORK_HEADER,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`CoreDEX OHLC API returned ${response.status}`);
    }

    const data = await response.json();
    
    console.log(`✅ [CoreDEX VPS] Received ${data.OHLC?.length || 0} OHLC data points`);
    
    return data;

  } catch (error) {
    console.error(`❌ [CoreDEX VPS] Failed to fetch OHLC:`, error);
    return null;
  }
}

/**
 * Get trade history for a symbol
 */
export async function getTrades(symbol: string, limit: number = 50): Promise<{ Trades: Trade[] } | null> {
  try {
    const url = `/trades?symbol=${encodeURIComponent(symbol)}&limit=${limit}`;
    
    console.log(`📜 [CoreDEX VPS] Fetching trades for ${symbol}...`);
    
    const response = await fetch(buildCoreDexUrl(url), {
      headers: {
        'Network': COREDEX_NETWORK_HEADER,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`CoreDEX Trades API returned ${response.status}`);
    }

    const data = await response.json();
    
    console.log(`✅ [CoreDEX VPS] Received ${data.Trades?.length || 0} trades`);
    
    return data;

  } catch (error) {
    console.error(`❌ [CoreDEX VPS] Failed to fetch trades:`, error);
    return null;
  }
}

/**
 * Get market data for a specific pair
 */
export async function getMarket(symbol: string): Promise<any | null> {
  try {
    const url = `/market?symbol=${encodeURIComponent(symbol)}`;
    
    const response = await fetch(buildCoreDexUrl(url), {
      headers: {
        'Network': COREDEX_NETWORK_HEADER,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`CoreDEX Market API returned ${response.status}`);
    }

    return await response.json();

  } catch (error) {
    console.error(`❌ [CoreDEX VPS] Failed to fetch market:`, error);
    return null;
  }
}

/**
 * Get order book for a trading pair
 */
export async function getOrderBook(symbol: string): Promise<any | null> {
  try {
    const url = `/order/orderbook?symbol=${encodeURIComponent(symbol)}`;
    
    const response = await fetch(buildCoreDexUrl(url), {
      headers: {
        'Network': COREDEX_NETWORK_HEADER,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`CoreDEX OrderBook API returned ${response.status}`);
    }

    return await response.json();

  } catch (error) {
    console.error(`❌ [CoreDEX VPS] Failed to fetch order book:`, error);
    return null;
  }
}

/**
 * Get wallet assets
 */
export async function getWalletAssets(address: string): Promise<any | null> {
  try {
    const url = `/wallet/assets?address=${address}`;
    
    const response = await fetch(buildCoreDexUrl(url), {
      headers: {
        'Network': COREDEX_NETWORK_HEADER,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`CoreDEX Wallet API returned ${response.status}`);
    }

    return await response.json();

  } catch (error) {
    console.error(`❌ [CoreDEX VPS] Failed to fetch wallet assets:`, error);
    return null;
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Build API symbol from two denoms
 * IMPORTANT: Use short denoms for API calls!
 */
export function buildSymbol(denom1: string, denom2: string): string {
  // For factory tokens like "usara-core1...", extract just "usara"
  const cleanDenom1 = denom1.includes('-core1') ? denom1.split('-')[0] : denom1;
  const cleanDenom2 = denom2.includes('-core1') ? denom2.split('-')[0] : denom2;
  
  return `${cleanDenom1}_${cleanDenom2}`;
}

/**
 * Extract short symbol from denom for trading pairs
 */
export function extractShortSymbol(denom: string): string {
  // Native token
  if (denom === 'ucore') return 'ucore';
  
  // Factory tokens: "usara-core1..." -> "usara"
  if (denom.includes('-core1')) {
    return denom.split('-')[0];
  }
  
  // IBC tokens: keep as-is
  if (denom.startsWith('ibc/')) {
    return denom;
  }
  
  // XRPL tokens: keep as-is
  if (denom.startsWith('xrpl')) {
    return denom;
  }
  
  // Default: return as-is
  return denom;
}

/**
 * Format price with proper decimals
 */
export function formatPrice(price: number, decimals: number = 6): string {
  return price.toFixed(decimals);
}

/**
 * Calculate 24h price change percentage
 */
export function priceChangePercent(ticker: Ticker): number {
  if (ticker.OpenPrice === 0) return 0;
  return ((ticker.LastPrice - ticker.OpenPrice) / ticker.OpenPrice) * 100;
}

/**
 * Get token price from POOL CONTRACTS + CoinGecko
 * NO USDC pools exist, so we use CoinGecko for CORE/XRP base prices
 */
export async function getTokenPrice(symbol: string): Promise<{ 
  price: number; 
  change24h: number;
  volume24h: number;
} | null> {
  try {
    console.log(`💰 [Pool Price] Getting price for ${symbol}...`);
    
    // Get base token prices (CORE, XRP, SARA, SOLO) from batch endpoint
    const baseTokens = ['CORE', 'COREUM', 'XRP', 'DROP', 'SARA', 'SOLO'];
    if (baseTokens.some(t => symbol.toUpperCase().includes(t))) {
      console.log(`🦎 [Pool Price] Base token detected: ${symbol}, fetching from batch...`);
      try {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
        const response = await fetch(`${baseUrl}/api/prices/base-tokens`);
        
        if (response.ok) {
          const basePrices = await response.json();
          const priceData = basePrices[symbol.toUpperCase()];
          
          if (priceData && priceData.price > 0) {
            console.log(`✅ [Batch Prices] ${symbol}: $${priceData.price.toFixed(6)}`);
            return {
              price: priceData.price,
              change24h: priceData.change24h,
              volume24h: 0,
            };
          }
        }
      } catch (batchError) {
        console.log(`⚠️ [Batch Prices] Failed:`, batchError);
      }
      
      // Fallback for base tokens
      const fallbacks: Record<string, number> = {
        'CORE': 0.10, 'COREUM': 0.10,
        'XRP': 2.63, 'DROP': 2.63,
        'SARA': 0.005, 'SOLO': 0.44,
      };
      const fallbackPrice = fallbacks[symbol.toUpperCase()] || 0.10;
      console.log(`📌 [Static Fallback] ${symbol}: $${fallbackPrice}`);
      return { price: fallbackPrice, change24h: 0, volume24h: 0 };
    }
    
    // OTHER TOKENS: Calculate via CORE pool
    const pairs = getTradingPairsForToken(symbol);
    
    if (pairs.length === 0) {
      console.log(`⚠️ [Pool Price] No trading pairs found for ${symbol}`);
      
      // Try XRPL oracle for ROLL, then fallback to static price
      if (symbol.toUpperCase() === 'ROLL') {
        try {
          const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
          const response = await fetch(`${baseUrl}/api/xrpl/oracle?symbol=ROLL`);
          
          if (response.ok) {
            const data = await response.json();
            if (data.price > 0) {
              console.log(`✅ [XRPL Oracle] ROLL: $${data.price.toFixed(8)}`);
              return {
                price: data.price,
                change24h: data.change24h || 0,
                volume24h: 0,
              };
            }
          }
        } catch (error) {
          console.log(`⚠️ [XRPL Oracle] ROLL error:`, error);
        }
        
        // Static fallback price for ROLL
        const rollPrice = 0.0000051;
        console.log(`📌 [Static ROLL Price] $${rollPrice.toFixed(8)}`);
        return {
          price: rollPrice,
          change24h: 0,
          volume24h: 0,
        };
      }
      
      // Static fallback for other tokens
      const staticPrices: Record<string, number> = {
        'AWKTUAH': 0.01,
        'KONG': 0.000000015,
        'LP': 0,  // Unknown LP pair - needs investigation
        'ULP': 1.00,
      };
      
      const staticPrice = staticPrices[symbol.toUpperCase()];
      if (staticPrice) {
        console.log(`📌 [Static Price] ${symbol}: $${staticPrice}`);
        return {
          price: staticPrice,
          change24h: 0,
          volume24h: 0,
        };
      }
      
      return null;
    }
    
    // Find a CORE pair (all tokens pair with CORE)
    const corePair = pairs.find(p => 
      p.baseSymbol.toUpperCase().includes('CORE') || 
      p.quoteSymbol.toUpperCase().includes('CORE')
    ) || pairs[0];
    
    const poolContract = corePair.pools?.[0]?.contract;
    if (!poolContract) {
      console.log(`⚠️ [Pool Price] No pool contract for ${symbol}`);
      return null;
    }
    
    // Get token decimals
    const tokens = getAllTokens();
    const baseToken = tokens.find(t => t.denom === corePair.baseDenom);
    const quoteToken = tokens.find(t => t.denom === corePair.quoteDenom);
    const baseDecimals = baseToken?.decimals ?? 6;
    const quoteDecimals = quoteToken?.decimals ?? 6;
    
    // Query pool for token/CORE price
    const poolPrice = await getCurrentPoolPrice(poolContract, baseDecimals, quoteDecimals);
    
    // Get CORE/USD price from batch endpoint
    let coreUsdPrice = 0.10; // Default
    try {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/prices/base-tokens`);
      if (response.ok) {
        const basePrices = await response.json();
        coreUsdPrice = basePrices.CORE?.price || 0.10;
      }
    } catch (err) {
      console.log(`⚠️ [Pool Price] Using fallback CORE price: $0.10`);
    }
    
    let usdPrice = 0;
    
    // Calculate token USD price via CORE
    // poolPrice.price = reserve1 / reserve0 (quote / base)
    if (corePair.quoteSymbol.toUpperCase().includes('CORE')) {
      // base is token, quote is CORE
      // poolPrice = CORE per token
      // token USD = (CORE per token) × (USD per CORE)
      usdPrice = poolPrice.price * coreUsdPrice;
      console.log(`✅ [Pool Price] ${symbol}: $${usdPrice.toFixed(6)} (pool: ${poolPrice.price.toFixed(6)} CORE/token × $${coreUsdPrice.toFixed(4)} CORE)`);
    } else if (corePair.baseSymbol.toUpperCase().includes('CORE')) {
      // base is CORE, quote is token
      // poolPrice = token per CORE
      // token USD = (USD per CORE) / (token per CORE) = (USD per CORE) × (CORE per token)
      usdPrice = coreUsdPrice / poolPrice.price;
      console.log(`✅ [Pool Price] ${symbol}: $${usdPrice.toFixed(6)} (pool: ${poolPrice.price.toFixed(6)} token/CORE × $${coreUsdPrice.toFixed(4)} CORE)`);
    }
    
    if (usdPrice > 0) {
      return {
        price: usdPrice,
        change24h: 0,
        volume24h: 0,
      };
    }
    
    console.log(`⚠️ [Pool Price] Could not calculate USD price for ${symbol}`);
    return null;
    
  } catch (error) {
    console.error(`❌ [Pool Price] Error getting price for ${symbol}:`, error);
    return null;
  }
}

/**
 * Get prices for multiple tokens at once
 * More efficient than calling getTokenPrice individually
 */
export async function getMultipleTokenPrices(
  symbols: string[]
): Promise<Map<string, { price: number; change24h: number; volume24h: number }>> {
  const priceMap = new Map();
  
  try {
    console.log(`💰 [CoreDEX VPS] Getting prices for ${symbols.length} tokens...`);
    
    // Collect all API symbols we need
    const apiSymbols: string[] = [];
    const symbolToPair = new Map<string, TradingPair>();
    
    for (const symbol of symbols) {
      const pairs = getTradingPairsForToken(symbol);
      if (pairs.length > 0) {
        // Prefer USDC pairs
        const preferredPair = pairs.find(p => 
          p.quoteSymbol.includes('USDC') || 
          p.quoteSymbol.includes('USDT') ||
          p.quoteSymbol.includes('USBC')
        ) || pairs[0];
        
        apiSymbols.push(preferredPair.apiSymbol);
        symbolToPair.set(symbol, preferredPair);
      }
    }
    
    // Fetch all tickers at once (batch in groups of 40)
    for (let i = 0; i < apiSymbols.length; i += 40) {
      const batch = apiSymbols.slice(i, i + 40);
      const tickersData = await fetchTickers(batch);
      
      if (tickersData && tickersData.Tickers) {
        // Map tickers back to symbols
        for (const symbol of symbols) {
          const pair = symbolToPair.get(symbol);
          if (!pair) continue;
          
          const ticker = tickersData.Tickers[pair.apiSymbol];
          
          if (ticker) {
            const change24h = priceChangePercent(ticker);
            
            priceMap.set(symbol, {
              price: ticker.LastPrice,
              change24h,
              volume24h: ticker.Volume,
            });
          }
        }
      }
    }
    
    console.log(`✅ [CoreDEX VPS] Got prices for ${priceMap.size}/${symbols.length} tokens`);
    
  } catch (error) {
    console.error(`❌ [CoreDEX VPS] Error getting multiple prices:`, error);
  }
  
  return priceMap;
}

/**
 * Health check
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const response = await fetch(buildCoreDexUrl('/healthz'));
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get API status
 */
export async function getAPIStatus(): Promise<{
  available: boolean;
  endpoint: string;
  network: string;
}> {
  const available = await healthCheck();
  
  return {
    available,
    endpoint: COREDEX_BASE_URL,
    network: COREDEX_NETWORK_HEADER,
  };
}

/**
 * Create a WebSocket connection for real-time updates
 */
export function createWebSocket(onMessage: (data: any) => void): WebSocket {
  const ws = new WebSocket(COREDEX_WS_URL);

  ws.onopen = () => {
    console.log('✅ [CoreDEX VPS] WebSocket connected');
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (error) {
      console.error('❌ [CoreDEX VPS] WebSocket message parse error:', error);
    }
  };

  ws.onerror = (error) => {
    console.error('❌ [CoreDEX VPS] WebSocket error:', error);
  };

  ws.onclose = () => {
    console.log('🔌 [CoreDEX VPS] WebSocket closed');
  };

  return ws;
}

/**
 * Clear all caches
 */
export function clearCaches(): void {
  currenciesCache.data = null;
  currenciesCache.timestamp = 0;
  tickersCache.clear();
  console.log(`🗑️ [CoreDEX VPS] Caches cleared`);
}

// ============================================
// EXPORT SINGLETON INSTANCE
// ============================================

export const coredexVPS = {
  // API Functions
  fetchCurrencies,
  fetchTickers,
  getOHLC,
  getTrades,
  getMarket,
  getOrderBook,
  getWalletAssets,
  
  // Price Functions
  getTokenPrice,
  getMultipleTokenPrices,
  
  // Static Data
  getAllTokens,
  getAllTradingPairs,
  findTokenBySymbol,
  findTokenByDenom,
  findTradingPair,
  getTradingPairsForToken,
  
  // Helpers
  buildSymbol,
  formatPrice,
  priceChangePercent,
  healthCheck,
  getAPIStatus,
  createWebSocket,
  clearCaches,
};

