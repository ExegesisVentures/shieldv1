/**
 * ============================================
 * PROPOSAL TALLY API ENDPOINT
 * ============================================
 * 
 * Fetch current vote tally for a specific proposal
 * 
 * File: /app/api/governance/proposals/[id]/tally/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  fetchProposalTally,
  calculateVotePercentages,
} from '@/utils/coreum/proposals';

// ============================================
// GET /api/governance/proposals/[id]/tally
// ============================================

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: proposalId } = await context.params;
    const { searchParams } = new URL(request.url);
    
    // Get query parameters
    const withPercentages = searchParams.get('percentages') !== 'false'; // default true
    
    console.log(`📡 [API] GET /api/governance/proposals/${proposalId}/tally`);

    // Fetch tally
    const response = await fetchProposalTally(proposalId);
    
    if (!response.tally) {
      return NextResponse.json({
        success: false,
        error: 'Tally not found',
        data: null,
      }, { status: 404 });
    }

    // Calculate percentages if requested
    let tallyData: any = response.tally;
    
    if (withPercentages) {
      const percentages = calculateVotePercentages(response.tally);
      tallyData = {
        ...response.tally,
        percentages,
      };
    }

    return NextResponse.json({
      success: true,
      data: tallyData,
    });

  } catch (error) {
    console.error(`❌ [API] Error fetching proposal tally:`, error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch tally',
      data: null,
    }, { status: 500 });
  }
}

// ============================================
// API DOCUMENTATION
// ============================================

/**
 * PROPOSAL TALLY API ENDPOINT
 * 
 * GET /api/governance/proposals/[id]/tally
 * 
 * Path Parameters:
 * - id: Proposal ID (e.g., "1", "2", etc.)
 * 
 * Query Parameters:
 * - percentages: Include vote percentages (default: true)
 * 
 * Examples:
 * - GET /api/governance/proposals/1/tally
 *   Returns current tally with percentages
 * 
 * - GET /api/governance/proposals/1/tally?percentages=false
 *   Returns raw tally without percentage calculations
 * 
 * Response Format (with percentages):
 * {
 *   "success": true,
 *   "data": {
 *     "yes": "1000000",
 *     "no": "500000",
 *     "abstain": "100000",
 *     "no_with_veto": "50000",
 *     "percentages": {
 *       "yesPercentage": 60.6,
 *       "noPercentage": 30.3,
 *       "abstainPercentage": 6.1,
 *       "vetoPercentage": 3.0,
 *       "turnoutPercentage": 100.0
 *     }
 *   }
 * }
 * 
 * Response Format (without percentages):
 * {
 *   "success": true,
 *   "data": {
 *     "yes": "1000000",
 *     "no": "500000",
 *     "abstain": "100000",
 *     "no_with_veto": "50000"
 *   }
 * }
 */

