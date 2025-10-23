/**
 * ============================================
 * GOVERNANCE PARAMETERS API ENDPOINT
 * ============================================
 * 
 * Fetch current governance parameters for the Coreum chain
 * 
 * File: /app/api/governance/params/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchGovParams } from '@/utils/coreum/proposals';

// ============================================
// GET /api/governance/params
// ============================================

export async function GET(request: NextRequest) {
  try {
    console.log(`📡 [API] GET /api/governance/params`);

    // Fetch governance parameters
    const params = await fetchGovParams();
    
    if (!params) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch governance parameters',
        data: null,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: params,
    });

  } catch (error) {
    console.error(`❌ [API] Error fetching governance parameters:`, error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch governance parameters',
      data: null,
    }, { status: 500 });
  }
}

// ============================================
// API DOCUMENTATION
// ============================================

/**
 * GOVERNANCE PARAMETERS API ENDPOINT
 * 
 * GET /api/governance/params
 * 
 * Returns current governance parameters including:
 * - Voting period duration
 * - Minimum deposit requirements
 * - Quorum, threshold, and veto thresholds
 * 
 * Examples:
 * - GET /api/governance/params
 *   Returns all governance parameters
 * 
 * Response Format:
 * {
 *   "success": true,
 *   "data": {
 *     "voting_params": {
 *       "voting_period": "1209600s" // 14 days in seconds
 *     },
 *     "deposit_params": {
 *       "min_deposit": [
 *         {
 *           "denom": "ucore",
 *           "amount": "10000000" // 10 CORE
 *         }
 *       ],
 *       "max_deposit_period": "1209600s" // 14 days
 *     },
 *     "tally_params": {
 *       "quorum": "0.334000000000000000", // 33.4%
 *       "threshold": "0.500000000000000000", // 50%
 *       "veto_threshold": "0.334000000000000000" // 33.4%
 *     }
 *   }
 * }
 * 
 * Understanding the Parameters:
 * 
 * 1. voting_period: How long a proposal is open for voting (in seconds)
 *    Example: "1209600s" = 14 days
 * 
 * 2. min_deposit: Minimum amount required to submit a proposal
 *    Must be deposited within max_deposit_period
 * 
 * 3. max_deposit_period: Time allowed to reach min_deposit
 *    If not reached, proposal is rejected
 * 
 * 4. quorum: Minimum % of voting power that must participate
 *    Example: "0.334" = 33.4% of total staked tokens must vote
 * 
 * 5. threshold: % of votes (excluding abstain) that must be "Yes"
 *    Example: "0.500" = 50% of non-abstain votes must be "Yes"
 * 
 * 6. veto_threshold: % of votes that trigger a veto
 *    Example: "0.334" = if 33.4% vote "No with Veto", proposal is rejected
 */


