import { NextRequest, NextResponse } from 'next/server';

const COINGECKO_API_KEY = 'CG-mcW9wYYPPxBf8fZQirAobM4A';
const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3'; // Demo API (free tier)

// In-memory cache (5-minute TTL)
let basePricesCache: {
  prices: Record<string, { price: number; change24h: number }>;
  timestamp: number;
} | null = null;

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * GET /api/prices/base-tokens
 * Batch fetch base token prices (CORE, XRP, SARA, SOLO) - cached for 5 minutes
 * All other tokens calculate from these base prices
 */
export async function GET(request: NextRequest) {
  try {
    // Check cache
    if (basePricesCache && (Date.now() - basePricesCache.timestamp < CACHE_TTL)) {
      console.log(`[Base Tokens] Returning cached prices (${Math.round((Date.now() - basePricesCache.timestamp) / 1000)}s old)`);
      return NextResponse.json(basePricesCache.prices);
    }
    
    console.log(`[Base Tokens] Fetching fresh prices from CoinGecko...`);
    
    // Batch fetch all base tokens in ONE API call
    const ids = ['coreum', 'ripple', 'pulsara', 'solo-coin'].join(',');
    const url = `${COINGECKO_API_URL}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;
    
    console.log(`[Base Tokens] CoinGecko URL: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'x-cg-demo-api-key': COINGECKO_API_KEY,
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`CoinGecko returned ${response.status}`);
    }
    
    const data = await response.json();
    
    // Map to our token symbols
    const prices = {
      'CORE': {
        price: data.coreum?.usd || 0.10,
        change24h: data.coreum?.usd_24h_change || 0,
      },
      'COREUM': {
        price: data.coreum?.usd || 0.10,
        change24h: data.coreum?.usd_24h_change || 0,
      },
      'XRP': {
        price: data.ripple?.usd || 2.63,
        change24h: data.ripple?.usd_24h_change || 0,
      },
      'DROP': {
        price: data.ripple?.usd || 2.63,
        change24h: data.ripple?.usd_24h_change || 0,
      },
      'SARA': {
        price: data.pulsara?.usd || 0.005,
        change24h: data.pulsara?.usd_24h_change || 0,
      },
      'SOLO': {
        price: data['solo-coin']?.usd || 0.21,
        change24h: data['solo-coin']?.usd_24h_change || 0,
      },
    };
    
    // Cache for 5 minutes
    basePricesCache = {
      prices,
      timestamp: Date.now(),
    };
    
    console.log(`[Base Tokens] Cached fresh prices: CORE=$${prices.CORE.price}, XRP=$${prices.XRP.price}, SARA=$${prices.SARA.price}, SOLO=$${prices.SOLO.price}`);
    
    return NextResponse.json(prices);
    
  } catch (error) {
    console.error('[Base Tokens] Error:', error);
    
    // Return fallback prices (UPDATED with current market prices)
    const fallbackPrices = {
      'CORE': { price: 0.10, change24h: 0 },
      'COREUM': { price: 0.10, change24h: 0 },
      'XRP': { price: 2.55, change24h: 0 },
      'DROP': { price: 2.55, change24h: 0 },
      'SARA': { price: 0.004, change24h: 0 },
      'SOLO': { price: 0.21, change24h: 0 },  // Updated from $0.44 (CoinGecko Demo API has stale data)
    };
    
    console.log(`[Base Tokens] Using fallback prices`);
    
    return NextResponse.json(fallbackPrices);
  }
}

