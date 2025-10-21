import { NextRequest, NextResponse } from 'next/server';

const COINGECKO_API_KEY = 'CG-mcW9wYYPPxBf8fZQirAobM4A';
const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3'; // Demo API (free tier)

/**
 * GET /api/coingecko/price?symbol=CORE
 * Server-side CoinGecko proxy to avoid CORS
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    
    console.log(`[CoinGecko API Route] Request for symbol: ${symbol}`);
    
    if (!symbol) {
      return NextResponse.json({ error: 'Symbol required' }, { status: 400 });
    }
    
    // Map symbols to CoinGecko IDs (VERIFIED)
    const coinGeckoIds: Record<string, string> = {
      'CORE': 'coreum',
      'COREUM': 'coreum',
      'XRP': 'ripple',
      'DROP': 'ripple',
      'SARA': 'pulsara',
      'SOLO': 'sologenic',  // Correct ID
    };
    
    const coinId = coinGeckoIds[symbol.toUpperCase()];
    
    if (!coinId) {
      console.log(`[CoinGecko API Route] Token ${symbol} not supported`);
      return NextResponse.json({ error: 'Token not supported' }, { status: 404 });
    }
    
    console.log(`[CoinGecko API Route] Fetching ${coinId} from CoinGecko...`);
    
    const url = `${COINGECKO_API_URL}/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`;
    
    const response = await fetch(url, {
      headers: {
        'x-cg-demo-api-key': COINGECKO_API_KEY,
        'Accept': 'application/json',
      },
    });
    
    console.log(`[CoinGecko API Route] Response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[CoinGecko API Route] Error: ${response.status} - ${errorText}`);
      throw new Error(`CoinGecko API returned ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    console.log(`[CoinGecko API Route] Data received:`, data);
    
    const price = data[coinId]?.usd || 0;
    const change24h = data[coinId]?.usd_24h_change || 0;
    
    console.log(`[CoinGecko API Route] Returning: price=${price}, change24h=${change24h}`);
    
    return NextResponse.json({ price, change24h });
    
  } catch (error) {
    console.error('[CoinGecko API Route] Fatal error:', error);
    // Return static fallback instead of error (UPDATED PRICES)
    const staticPrices: Record<string, { price: number; change24h: number }> = {
      'CORE': { price: 0.10, change24h: 0 },      // Updated from market
      'COREUM': { price: 0.10, change24h: 0 },    // Updated from market
      'XRP': { price: 2.63, change24h: 3.44 },    // Updated from market
      'DROP': { price: 2.63, change24h: 3.44 },   // Same as XRP
      'SARA': { price: 0.005, change24h: 0 },     // Estimated
      'SOLO': { price: 0.44, change24h: 0 },      // Estimated
    };
    
    const symbol = new URL(request.url).searchParams.get('symbol') || '';
    const fallback = staticPrices[symbol.toUpperCase()] || { price: 0, change24h: 0 };
    
    console.log(`[CoinGecko API Route] Using static fallback for ${symbol}: $${fallback.price}`);
    
    return NextResponse.json(fallback);
  }
}

