/**
 * ============================================
 * USER VOTING HISTORY API ENDPOINT
 * ============================================
 * 
 * Fetch all votes by a specific user across all proposals
 * 
 * File: /app/api/governance/votes/[address]/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  fetchUserVotingHistory,
  fetchUserVote,
  fetchUserVotingPower,
} from '@/utils/coreum/proposals';

// ============================================
// GET /api/governance/votes/[address]
// ============================================

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await context.params;
    const { searchParams } = new URL(request.url);
    
    // Get query parameters
    const proposalId = searchParams.get('proposalId');
    const withVotingPower = searchParams.get('votingPower') === 'true';
    
    console.log(`📡 [API] GET /api/governance/votes/${address}`);

    // If specific proposal ID provided, fetch vote for that proposal only
    if (proposalId) {
      const vote = await fetchUserVote(proposalId, address);
      
      let votingPower: string | undefined;
      if (withVotingPower) {
        votingPower = await fetchUserVotingPower(address);
      }
      
      return NextResponse.json({
        success: true,
        data: {
          vote,
          hasVoted: !!vote,
          votingPower,
        },
      });
    }

    // Otherwise, fetch all votes for this user
    const votes = await fetchUserVotingHistory(address);
    
    let votingPower: string | undefined;
    if (withVotingPower) {
      votingPower = await fetchUserVotingPower(address);
    }

    return NextResponse.json({
      success: true,
      data: {
        votes,
        votingPower,
        totalVotes: votes.length,
      },
    });

  } catch (error) {
    console.error(`❌ [API] Error fetching user votes:`, error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch user votes',
      data: null,
    }, { status: 500 });
  }
}

// ============================================
// API DOCUMENTATION
// ============================================

/**
 * USER VOTING HISTORY API ENDPOINT
 * 
 * GET /api/governance/votes/[address]
 * 
 * Path Parameters:
 * - address: Wallet address (e.g., "core1abc...xyz")
 * 
 * Query Parameters:
 * - proposalId: Get vote for specific proposal only (optional)
 * - votingPower: Include user's current voting power (default: false)
 * 
 * Examples:
 * - GET /api/governance/votes/core1abc...xyz
 *   Returns all votes by this user
 * 
 * - GET /api/governance/votes/core1abc...xyz?proposalId=1
 *   Returns vote on proposal #1 (if exists)
 * 
 * - GET /api/governance/votes/core1abc...xyz?votingPower=true
 *   Returns all votes with user's current voting power
 * 
 * Response Format (All votes):
 * {
 *   "success": true,
 *   "data": {
 *     "votes": [
 *       {
 *         "proposal_id": "1",
 *         "voter": "core1abc...xyz",
 *         "option": "VOTE_OPTION_YES",
 *         "metadata": ""
 *       },
 *       {
 *         "proposal_id": "5",
 *         "voter": "core1abc...xyz",
 *         "option": "VOTE_OPTION_NO",
 *         "metadata": ""
 *       }
 *     ],
 *     "votingPower": "1000000000", // in ucore (if votingPower=true)
 *     "totalVotes": 2
 *   }
 * }
 * 
 * Response Format (Single proposal):
 * {
 *   "success": true,
 *   "data": {
 *     "vote": {
 *       "proposal_id": "1",
 *       "voter": "core1abc...xyz",
 *       "option": "VOTE_OPTION_YES",
 *       "metadata": ""
 *     },
 *     "hasVoted": true,
 *     "votingPower": "1000000000" // in ucore (if votingPower=true)
 *   }
 * }
 * 
 * Response Format (No vote):
 * {
 *   "success": true,
 *   "data": {
 *     "vote": null,
 *     "hasVoted": false,
 *     "votingPower": "1000000000" // in ucore (if votingPower=true)
 *   }
 * }
 */

