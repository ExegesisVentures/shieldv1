/**
 * ============================================
 * COREUM PAIRS API ENDPOINT
 * ============================================
 * 
 * Fast pair lookup API using the database
 * instead of live blockchain queries.
 * 
 * File: /app/api/coreum/pairs/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  getPairById,
  getPairsByBaseToken,
  getPairsByQuoteToken,
  findPairBetweenTokens,
  searchPairs,
  getPairsBySource
} from '@/utils/coreum/token-database';

// ============================================
// GET /api/coreum/pairs
// ============================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Get query parameters
    const pairId = searchParams.get('pairId');
    const baseToken = searchParams.get('baseToken');
    const quoteToken = searchParams.get('quoteToken');
    const token1 = searchParams.get('token1');
    const token2 = searchParams.get('token2');
    const search = searchParams.get('search');
    const source = searchParams.get('source');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Get pair by specific ID
    if (pairId) {
      const pair = await getPairById(pairId);
      if (!pair) {
        return NextResponse.json({
          success: false,
          error: 'Pair not found',
          data: null
        }, { status: 404 });
      }
      
      return NextResponse.json({
        success: true,
        data: pair
      });
    }

    // Get pairs by base token
    if (baseToken) {
      const pairs = await getPairsByBaseToken(baseToken);
      return NextResponse.json({
        success: true,
        data: pairs,
        count: pairs.length
      });
    }

    // Get pairs by quote token
    if (quoteToken) {
      const pairs = await getPairsByQuoteToken(quoteToken);
      return NextResponse.json({
        success: true,
        data: pairs,
        count: pairs.length
      });
    }

    // Find pairs between two specific tokens
    if (token1 && token2) {
      const pairs = await findPairBetweenTokens(token1, token2);
      return NextResponse.json({
        success: true,
        data: pairs,
        count: pairs.length
      });
    }

    // Search pairs by symbol
    if (search) {
      const pairs = await searchPairs(search, limit);
      return NextResponse.json({
        success: true,
        data: pairs,
        count: pairs.length
      });
    }

    // Get pairs by DEX source
    if (source) {
      const pairs = await getPairsBySource(source);
      return NextResponse.json({
        success: true,
        data: pairs,
        count: pairs.length
      });
    }

    // Default: return all pairs (limited)
    const pairs = await searchPairs('', limit);
    return NextResponse.json({
      success: true,
      data: pairs,
      count: pairs.length
    });

  } catch (error) {
    console.error('Error in pairs API:', error);
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
 * COREUM PAIRS API ENDPOINTS
 * 
 * GET /api/coreum/pairs
 * 
 * Query Parameters:
 * - pairId: Get pair by specific ID
 * - baseToken: Get pairs with this token as base
 * - quoteToken: Get pairs with this token as quote
 * - token1: First token for pair search
 * - token2: Second token for pair search
 * - search: Search pairs by symbol
 * - source: Get pairs from specific DEX (e.g., "Pulsara DEX")
 * - limit: Limit results (default: 20)
 * 
 * Examples:
 * - GET /api/coreum/pairs?pairId=pulsara-core1uk4z0aq4lcpg8pp4t2da2fmzu0lrmz4s4pad8fd8rz0zejnqs3hqd05973
 * - GET /api/coreum/pairs?baseToken=ucore
 * - GET /api/coreum/pairs?quoteToken=ucore
 * - GET /api/coreum/pairs?token1=ucore&token2=ibc/E1E3674A0E4E1EF9C69646F9AF8D9497173821826074622D831BAB73CCB99A2D
 * - GET /api/coreum/pairs?search=COREUM
 * - GET /api/coreum/pairs?source=Pulsara DEX
 * 
 * Response Format:
 * {
 *   "success": true,
 *   "data": [...],
 *   "count": 111
 * }
 */
