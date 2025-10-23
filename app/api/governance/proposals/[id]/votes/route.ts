/**
 * ============================================
 * PROPOSAL VOTES API ENDPOINT
 * ============================================
 * 
 * Fetch all votes for a specific proposal
 * 
 * File: /app/api/governance/proposals/[id]/votes/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchProposalVotes } from '@/utils/coreum/proposals';

// ============================================
// GET /api/governance/proposals/[id]/votes
// ============================================

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: proposalId } = await context.params;
    const { searchParams } = new URL(request.url);
    
    // Pagination parameters
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');
    
    console.log(`📡 [API] GET /api/governance/proposals/${proposalId}/votes`);

    // Build pagination params
    const pagination = {
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    };

    // Fetch votes
    const response = await fetchProposalVotes(proposalId, pagination);
    
    return NextResponse.json({
      success: true,
      data: response.votes || [],
      pagination: response.pagination,
      count: response.votes?.length || 0,
    });

  } catch (error) {
    console.error(`❌ [API] Error fetching proposal votes:`, error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch votes',
      data: null,
    }, { status: 500 });
  }
}

// ============================================
// API DOCUMENTATION
// ============================================

/**
 * PROPOSAL VOTES API ENDPOINT
 * 
 * GET /api/governance/proposals/[id]/votes
 * 
 * Path Parameters:
 * - id: Proposal ID (e.g., "1", "2", etc.)
 * 
 * Query Parameters:
 * - limit: Limit number of results (pagination)
 * - offset: Offset for pagination
 * 
 * Examples:
 * - GET /api/governance/proposals/1/votes
 *   Returns all votes for proposal #1
 * 
 * - GET /api/governance/proposals/1/votes?limit=50&offset=0
 *   Returns first 50 votes (pagination)
 * 
 * Response Format:
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "proposal_id": "1",
 *       "voter": "core1abc...xyz",
 *       "option": "VOTE_OPTION_YES",
 *       "metadata": ""
 *     },
 *     {
 *       "proposal_id": "1",
 *       "voter": "core1def...uvw",
 *       "option": "VOTE_OPTION_NO",
 *       "metadata": ""
 *     }
 *   ],
 *   "count": 2,
 *   "pagination": {
 *     "next_key": null,
 *     "total": "2"
 *   }
 * }
 */

