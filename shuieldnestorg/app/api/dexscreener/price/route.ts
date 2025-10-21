import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/dexscreener/price?symbol=ROLL&contract=core1...
 * Get price from DexScreener for tokens not on CoinGecko
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const contract = searchParams.get('contract');
    const chain = searchParams.get('chain') || 'coreum'; // Default to coreum
    
    console.log(`[DexScreener API] Request for ${symbol}, chain: ${chain}, contract: ${contract}`);
    
    if (!contract) {
      return NextResponse.json({ error: 'Contract address required' }, { status: 400 });
    }
    
    // Query DexScreener - use pairs endpoint for XRPL, tokens for others
    const url = chain === 'xrpl' 
      ? `https://api.dexscreener.com/latest/dex/pairs/${chain}/${contract}`
      : `https://api.dexscreener.com/latest/dex/tokens/${contract}`;
    
    console.log(`[DexScreener API] Fetching from ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`[DexScreener API] Error: ${response.status}`);
      return NextResponse.json({ error: 'DexScreener API failed' }, { status: response.status });
    }
    
    const data = await response.json();
    
    if (!data.pairs || data.pairs.length === 0) {
      console.log(`[DexScreener API] No pairs found for ${contract}`);
      return NextResponse.json({ error: 'No pairs found' }, { status: 404 });
    }
    
    // Find the most liquid pair
    const sortedPairs = data.pairs.sort((a: any, b: any) => 
      (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)
    );
    
    const pair = sortedPairs[0];
    const priceUsd = parseFloat(pair.priceUsd || '0');
    const priceChange24h = parseFloat(pair.priceChange?.h24 || '0');
    
    console.log(`[DexScreener API] ${symbol}: $${priceUsd} (${priceChange24h}%, liquidity: $${pair.liquidity?.usd || 0})`);
    
    return NextResponse.json({
      price: priceUsd,
      change24h: priceChange24h,
      source: 'dexscreener',
      pair: pair.pairAddress,
    });
    
  } catch (error) {
    console.error('[DexScreener API] Fatal error:', error);
    return NextResponse.json({ error: 'Failed to fetch price' }, { status: 500 });
  }
}

