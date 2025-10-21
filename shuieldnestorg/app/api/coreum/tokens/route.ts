/**
 * ============================================
 * COREUM TOKENS API ENDPOINT
 * ============================================
 * 
 * Fast token lookup API using the database
 * instead of live blockchain queries.
 * 
 * File: /app/api/coreum/tokens/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  getTokenByDenom, 
  getTokenBySymbol, 
  searchTokens, 
  getAllTokensWithPairs,
  getTokenStats 
} from '@/utils/coreum/token-database';

// ============================================
// GET /api/coreum/tokens
// ============================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Get query parameters
    const denom = searchParams.get('denom');
    const symbol = searchParams.get('symbol');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '20');
    const withPairs = searchParams.get('withPairs') === 'true';
    const stats = searchParams.get('stats') === 'true';

    // Return statistics if requested
    if (stats) {
      const tokenStats = await getTokenStats();
      return NextResponse.json({
        success: true,
        data: tokenStats
      });
    }

    // Get token by specific denom
    if (denom) {
      const token = await getTokenByDenom(denom);
      if (!token) {
        return NextResponse.json({
          success: false,
          error: 'Token not found',
          data: null
        }, { status: 404 });
      }
      
      return NextResponse.json({
        success: true,
        data: token
      });
    }

    // Get token by specific symbol
    if (symbol) {
      const token = await getTokenBySymbol(symbol);
      if (!token) {
        return NextResponse.json({
          success: false,
          error: 'Token not found',
          data: null
        }, { status: 404 });
      }
      
      return NextResponse.json({
        success: true,
        data: token
      });
    }

    // Search tokens
    if (search) {
      const tokens = await searchTokens(search, limit);
      return NextResponse.json({
        success: true,
        data: tokens,
        count: tokens.length
      });
    }

    // Get all tokens (with or without pair counts)
    if (withPairs) {
      const tokens = await getAllTokensWithPairs();
      return NextResponse.json({
        success: true,
        data: tokens,
        count: tokens.length
      });
    }

    // Default: return all tokens without pair counts
    const tokens = await getAllTokensWithPairs();
    return NextResponse.json({
      success: true,
      data: tokens,
      count: tokens.length
    });

  } catch (error) {
    console.error('Error in tokens API:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      data: null
    }, { status: 500 });
  }
}

// ============================================
// API DOCUMENTATION
// ============================================

/**
 * COREUM TOKENS API ENDPOINTS
 * 
 * GET /api/coreum/tokens
 * 
 * Query Parameters:
 * - denom: Get token by denomination (e.g., "ucore", "ibc/...")
 * - symbol: Get token by symbol (e.g., "COREUM")
 * - search: Search tokens by symbol or name
 * - limit: Limit results (default: 20)
 * - withPairs: Include pair counts (default: false)
 * - stats: Return token statistics
 * 
 * Examples:
 * - GET /api/coreum/tokens?denom=ucore
 * - GET /api/coreum/tokens?symbol=COREUM
 * - GET /api/coreum/tokens?search=core
 * - GET /api/coreum/tokens?withPairs=true
 * - GET /api/coreum/tokens?stats=true
 * 
 * Response Format:
 * {
 *   "success": true,
 *   "data": [...],
 *   "count": 39
 * }
 */
