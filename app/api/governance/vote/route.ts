/**
 * ============================================
 * VOTE ON PROPOSAL API ENDPOINT
 * ============================================
 * 
 * Submit a vote on a governance proposal
 * Requires wallet signature
 * 
 * File: /app/api/governance/vote/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { voteOnProposal } from '@/utils/coreum/proposals';
import { VoteOption } from '@/types/governance';

// ============================================
// POST /api/governance/vote
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { proposalId, voter, option, signer } = body;
    
    if (!proposalId || !voter || !option) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: proposalId, voter, option',
        data: null,
      }, { status: 400 });
    }

    // Validate vote option
    const validOptions = Object.values(VoteOption);
    if (!validOptions.includes(option)) {
      return NextResponse.json({
        success: false,
        error: `Invalid vote option. Must be one of: ${validOptions.join(', ')}`,
        data: null,
      }, { status: 400 });
    }

    console.log(`📡 [API] POST /api/governance/vote - Proposal ${proposalId}, Option: ${option}`);

    // Note: In a real implementation, the signer would come from the wallet
    // This endpoint assumes the frontend will handle wallet signing
    // For now, return instructions for client-side signing
    
    // If signer is provided (this would be wallet instance from frontend)
    if (signer) {
      const result = await voteOnProposal(
        {
          proposalId,
          voter,
          option,
        },
        signer
      );

      if (!result.success) {
        return NextResponse.json({
          success: false,
          error: result.error || 'Failed to submit vote',
          data: null,
        }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        data: {
          transactionHash: result.transactionHash,
          blockHeight: result.blockHeight,
          gasUsed: result.gasUsed,
        },
        message: 'Vote submitted successfully',
      });
    }

    // If no signer, return message that this should be handled client-side
    return NextResponse.json({
      success: false,
      error: 'Voting requires client-side wallet signature. Use the governance utility functions directly from the frontend.',
      data: {
        instructions: 'Import { voteOnProposal } from "@/utils/coreum/proposals" and call it with wallet signer',
        example: `
          import { voteOnProposal } from '@/utils/coreum/proposals';
          import { VoteOption } from '@/types/governance';
          
          // Get signer from wallet (e.g., Keplr, Leap)
          const signer = await window.keplr.getOfflineSigner(chainId);
          
          // Submit vote
          const result = await voteOnProposal({
            proposalId: '1',
            voter: 'core1abc...xyz',
            option: VoteOption.YES,
          }, signer);
        `
      },
    }, { status: 400 });

  } catch (error) {
    console.error('❌ [API] Error submitting vote:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit vote',
      data: null,
    }, { status: 500 });
  }
}

// ============================================
// API DOCUMENTATION
// ============================================

/**
 * VOTE ON PROPOSAL API ENDPOINT
 * 
 * POST /api/governance/vote
 * 
 * Request Body:
 * {
 *   "proposalId": "1",
 *   "voter": "core1abc...xyz",
 *   "option": "VOTE_OPTION_YES",
 *   "signer": <wallet signer object> // Optional, for server-side signing
 * }
 * 
 * Vote Options:
 * - VOTE_OPTION_YES
 * - VOTE_OPTION_NO
 * - VOTE_OPTION_ABSTAIN
 * - VOTE_OPTION_NO_WITH_VETO
 * 
 * Response Format (Success):
 * {
 *   "success": true,
 *   "data": {
 *     "transactionHash": "ABC123...",
 *     "blockHeight": 12345,
 *     "gasUsed": "150000"
 *   },
 *   "message": "Vote submitted successfully"
 * }
 * 
 * Response Format (Error):
 * {
 *   "success": false,
 *   "error": "Error message",
 *   "data": null
 * }
 * 
 * IMPORTANT NOTE:
 * Voting requires wallet signature and is best handled client-side.
 * Use the voteOnProposal utility function directly from your frontend:
 * 
 * Example (Frontend):
 * ```typescript
 * import { voteOnProposal } from '@/utils/coreum/proposals';
 * import { VoteOption } from '@/types/governance';
 * 
 * // Get wallet signer (Keplr example)
 * const chainId = 'coreum-mainnet-1';
 * const signer = await window.keplr.getOfflineSigner(chainId);
 * const [account] = await signer.getAccounts();
 * 
 * // Submit vote
 * const result = await voteOnProposal({
 *   proposalId: '1',
 *   voter: account.address,
 *   option: VoteOption.YES,
 * }, signer);
 * 
 * if (result.success) {
 *   console.log('Vote submitted!', result.transactionHash);
 * }
 * ```
 */


