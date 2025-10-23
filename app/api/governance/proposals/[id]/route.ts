/**
 * ============================================
 * SINGLE PROPOSAL API ENDPOINT
 * ============================================
 * 
 * Fetch details for a specific governance proposal
 * 
 * File: /app/api/governance/proposals/[id]/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  fetchProposal,
  enrichProposal,
  fetchUserVote,
} from '@/utils/coreum/proposals';

// ============================================
// GET /api/governance/proposals/[id]
// ============================================

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: proposalId } = await context.params;
    const { searchParams } = new URL(request.url);
    
    // Get query parameters
    const enriched = searchParams.get('enriched') === 'true';
    const voterAddress = searchParams.get('voter');
    
    console.log(`📡 [API] GET /api/governance/proposals/${proposalId}`);

    // Fetch proposal
    const response = await fetchProposal(proposalId);
    
    if (!response.proposal) {
      return NextResponse.json({
        success: false,
        error: 'Proposal not found',
        data: null,
      }, { status: 404 });
    }

    let proposalData = response.proposal;

    // Enrich proposal if requested
    if (enriched) {
      proposalData = enrichProposal(proposalData) as any;
    }

    // Fetch user's vote if voter address provided
    if (voterAddress) {
      const userVote = await fetchUserVote(proposalId, voterAddress);
      proposalData = {
        ...proposalData,
        userVote: userVote?.option,
        userHasVoted: !!userVote,
      } as any;
    }

    return NextResponse.json({
      success: true,
      data: proposalData,
    });

  } catch (error) {
    console.error(`❌ [API] Error fetching proposal:`, error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch proposal',
      data: null,
    }, { status: 500 });
  }
}

// ============================================
// API DOCUMENTATION
// ============================================

/**
 * SINGLE PROPOSAL API ENDPOINT
 * 
 * GET /api/governance/proposals/[id]
 * 
 * Path Parameters:
 * - id: Proposal ID (e.g., "1", "2", etc.)
 * 
 * Query Parameters:
 * - enriched: Return enriched proposal with computed fields (default: false)
 * - voter: Wallet address to check if user has voted (optional)
 * 
 * Examples:
 * - GET /api/governance/proposals/1
 *   Returns proposal #1 with raw data
 * 
 * - GET /api/governance/proposals/1?enriched=true
 *   Returns proposal #1 with enriched data (percentages, time remaining, etc.)
 * 
 * - GET /api/governance/proposals/1?voter=core1abc...xyz
 *   Returns proposal #1 and includes user's vote if they voted
 * 
 * - GET /api/governance/proposals/1?enriched=true&voter=core1abc...xyz
 *   Returns enriched proposal with user's vote status
 * 
 * Response Format:
 * {
 *   "success": true,
 *   "data": {
 *     "proposal_id": "1",
 *     "content": {
 *       "@type": "/cosmos.gov.v1beta1.TextProposal",
 *       "title": "Proposal Title",
 *       "description": "Proposal description..."
 *     },
 *     "status": "PROPOSAL_STATUS_VOTING_PERIOD",
 *     "final_tally_result": {
 *       "yes": "1000000",
 *       "no": "500000",
 *       "abstain": "100000",
 *       "no_with_veto": "50000"
 *     },
 *     "submit_time": "2025-01-01T00:00:00Z",
 *     "deposit_end_time": "2025-01-15T00:00:00Z",
 *     "total_deposit": [
 *       {
 *         "denom": "ucore",
 *         "amount": "10000000"
 *       }
 *     ],
 *     "voting_start_time": "2025-01-15T00:00:00Z",
 *     "voting_end_time": "2025-01-29T00:00:00Z",
 *     
 *     // If enriched=true, additional fields:
 *     "type": "TextProposal",
 *     "statusLabel": "Voting Period",
 *     "timeRemaining": "5d 3h",
 *     "yesPercentage": 60.6,
 *     "noPercentage": 30.3,
 *     "abstainPercentage": 6.1,
 *     "vetoPercentage": 3.0,
 *     "isActive": true,
 *     "canVote": true,
 *     
 *     // If voter parameter provided:
 *     "userVote": "VOTE_OPTION_YES",
 *     "userHasVoted": true
 *   }
 * }
 */

