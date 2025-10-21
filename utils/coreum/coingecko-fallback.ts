/**
 * CoinGecko Fallback Pricing (Server-Side via API Route)
 * Used ONLY for base prices when no USDC pools exist
 */

/**
 * Get CORE price from CoinGecko (via our API route to avoid CORS)
 */
export async function getCOREPriceFromCoinGecko(): Promise<{ price: number; change24h: number } | null> {
  try {
    console.log(`🦎 [CoinGecko] Fetching CORE price via API route...`);
    
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/coingecko/price?symbol=CORE`);
    
    if (!response.ok) {
      console.error(`❌ [CoinGecko] API route returned ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    if (!data.price) {
      console.error(`❌ [CoinGecko] No price data`);
      return null;
    }
    
    console.log(`✅ [CoinGecko] CORE: $${data.price.toFixed(6)} (${data.change24h >= 0 ? '+' : ''}${data.change24h.toFixed(2)}%)`);
    
    return { price: data.price, change24h: data.change24h };
  } catch (error) {
    console.error(`❌ [CoinGecko] Error fetching CORE price:`, error);
    return null;
  }
}

/**
 * Get XRP price from CoinGecko (via our API route to avoid CORS)
 */
export async function getXRPPriceFromCoinGecko(): Promise<{ price: number; change24h: number } | null> {
  try {
    console.log(`🦎 [CoinGecko] Fetching XRP price via API route...`);
    
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/coingecko/price?symbol=XRP`);
    
    if (!response.ok) {
      console.error(`❌ [CoinGecko] API route returned ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    if (!data.price) {
      console.error(`❌ [CoinGecko] No price data`);
      return null;
    }
    
    console.log(`✅ [CoinGecko] XRP: $${data.price.toFixed(6)} (${data.change24h >= 0 ? '+' : ''}${data.change24h.toFixed(2)}%)`);
    
    return { price: data.price, change24h: data.change24h };
  } catch (error) {
    console.error(`❌ [CoinGecko] Error fetching XRP price:`, error);
    return null;
  }
}

