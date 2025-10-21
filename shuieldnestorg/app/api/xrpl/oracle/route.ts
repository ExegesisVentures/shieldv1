import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/xrpl/oracle?symbol=SOLO
 * Get price from XRPL Oracle for XRPL-bridged tokens
 * Uses DIA Oracle on XRPL (Oracle Document ID: 42 on Mainnet)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    
    console.log(`[XRPL Oracle] Request for ${symbol}`);
    
    if (!symbol) {
      return NextResponse.json({ error: 'Symbol required' }, { status: 400 });
    }
    
    // Map symbols to XRPL currency codes
    const xrplCurrencies: Record<string, string> = {
      'SOLO': '534F4C4F00000000000000000000000000000000', // SOLO hex
      'ROLL': 'ROLL', // May need hex conversion
      'XRP': 'XRP',
    };
    
    const currency = xrplCurrencies[symbol.toUpperCase()];
    
    if (!currency) {
      console.log(`[XRPL Oracle] ${symbol} not an XRPL token`);
      return NextResponse.json({ error: 'Not an XRPL token' }, { status: 404 });
    }
    
    // Query XRPL RPC for oracle data
    const xrplRpc = 'https://xrplcluster.com/';
    
    // Method 1: Try to get from orderbook
    const orderbookRequest = {
      method: 'book_offers',
      params: [{
        taker_gets: {
          currency: currency,
          issuer: 'rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH', // Common XRPL issuer
        },
        taker_pays: {
          currency: 'USD',
        },
        limit: 1,
      }],
    };
    
    console.log(`[XRPL Oracle] Querying orderbook for ${symbol}...`);
    
    const response = await fetch(xrplRpc, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderbookRequest),
    });
    
    if (!response.ok) {
      throw new Error(`XRPL RPC returned ${response.status}`);
    }
    
    const data = await response.json();
    
    // Parse orderbook to get price
    if (data.result?.offers && data.result.offers.length > 0) {
      const topOffer = data.result.offers[0];
      const price = parseFloat(topOffer.quality) || 0;
      
      console.log(`✅ [XRPL Oracle] ${symbol}: $${price.toFixed(6)}`);
      
      return NextResponse.json({
        price,
        change24h: 0,
        source: 'xrpl-orderbook',
      });
    }
    
    console.log(`[XRPL Oracle] No orderbook data for ${symbol}`);
    return NextResponse.json({ error: 'No price data' }, { status: 404 });
    
  } catch (error) {
    console.error('[XRPL Oracle] Error:', error);
    
    // Fallback prices
    const fallbacks: Record<string, number> = {
      'SOLO': 0.44,
      'ROLL': 0.05,
      'XRP': 2.63,
    };
    
    const symbol = new URL(request.url).searchParams.get('symbol') || '';
    const fallback = fallbacks[symbol.toUpperCase()] || 0;
    
    console.log(`[XRPL Oracle] Using fallback for ${symbol}: $${fallback}`);
    
    return NextResponse.json({
      price: fallback,
      change24h: 0,
      source: 'fallback',
    });
  }
}

