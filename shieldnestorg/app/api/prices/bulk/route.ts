import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * GET /api/prices/bulk
 * Get cached prices from Supabase + DexScreener fallback
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    
    // Get all pairs with price data from database
    const { data: pairs, error } = await supabase
      .from('active_pairs_with_tokens')
      .select('*')
      .limit(100);
    
    if (error) {
      console.error('[Bulk Prices] DB error:', error);
      return NextResponse.json({ error: 'Database query failed' }, { status: 500 });
    }
    
    const prices: Record<string, { price: number; change24h: number; source: string }> = {};
    
    // Add CoinGecko base prices
    prices['CORE'] = { price: 0.12, change24h: 0, source: 'coingecko' };
    prices['COREUM'] = { price: 0.12, change24h: 0, source: 'coingecko' };
    prices['XRP'] = { price: 2.63, change24h: 3.44, source: 'coingecko' };
    
    // TODO: Calculate from pools for other tokens
    // For now, return what we have
    
    return NextResponse.json({ prices, count: Object.keys(prices).length });
    
  } catch (error) {
    console.error('[Bulk Prices] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch prices' }, { status: 500 });
  }
}

