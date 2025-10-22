/**
 * ============================================
 * PROPOSAL DEPOSITS API ENDPOINT
 * ============================================
 * 
 * Fetch all deposits for a specific proposal
 * 
 * File: /app/api/governance/deposits/[id]/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchProposalDeposits } from '@/utils/coreum/governance';

// ============================================
// GET /api/governance/deposits/[id]
// ============================================

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: proposalId } = await context.params;
    
    console.log(`📡 [API] GET /api/governance/deposits/${proposalId}`);

    // Fetch deposits
    const response = await fetchProposalDeposits(proposalId);
    
    return NextResponse.json({
      success: true,
      data: response.deposits || [],
      count: response.deposits?.length || 0,
    });

  } catch (error) {
    console.error(`❌ [API] Error fetching proposal deposits:`, error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch deposits',
      data: null,
    }, { status: 500 });
  }
}

// ============================================
// API DOCUMENTATION
// ============================================

/**
 * PROPOSAL DEPOSITS API ENDPOINT
 * 
 * GET /api/governance/deposits/[id]
 * 
 * Path Parameters:
 * - id: Proposal ID (e.g., "1", "2", etc.)
 * 
 * Examples:
 * - GET /api/governance/deposits/1
 *   Returns all deposits for proposal #1
 * 
 * Response Format:
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "proposal_id": "1",
 *       "depositor": "core1abc...xyz",
 *       "amount": [
 *         {
 *           "denom": "ucore",
 *           "amount": "10000000"
 *         }
 *       ]
 *     },
 *     {
 *       "proposal_id": "1",
 *       "depositor": "core1def...uvw",
 *       "amount": [
 *         {
 *           "denom": "ucore",
 *           "amount": "5000000"
 *         }
 *       ]
 *     }
 *   ],
 *   "count": 2
 * }
 */

