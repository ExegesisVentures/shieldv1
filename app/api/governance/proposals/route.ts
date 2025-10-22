/**
 * ============================================
 * GOVERNANCE PROPOSALS API ENDPOINT
 * ============================================
 * 
 * Fetch all governance proposals with optional filtering
 * 
 * File: /app/api/governance/proposals/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  fetchProposals,
  fetchEnrichedProposals,
  fetchActiveProposals,
  fetchDepositPeriodProposals,
  fetchProposalStats,
} from '@/utils/coreum/governance';
import { ProposalStatus } from '@/types/governance';

// ============================================
// GET /api/governance/proposals
// ============================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Get query parameters
    const statusParam = searchParams.get('status');
    const enriched = searchParams.get('enriched') === 'true';
    const stats = searchParams.get('stats') === 'true';
    const activeOnly = searchParams.get('active') === 'true';
    const depositPeriod = searchParams.get('depositPeriod') === 'true';
    
    // Pagination parameters
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');
    const reverse = searchParams.get('reverse') === 'true';
    
    console.log(`📡 [API] GET /api/governance/proposals - status: ${statusParam}, enriched: ${enriched}`);

    // Return statistics if requested
    if (stats) {
      const proposalStats = await fetchProposalStats();
      return NextResponse.json({
        success: true,
        data: proposalStats,
      });
    }

    // Return active proposals only
    if (activeOnly) {
      const proposals = await fetchActiveProposals();
      return NextResponse.json({
        success: true,
        data: enriched ? proposals.map(p => ({
          ...p,
          // Add enrichment fields manually or use enrichProposal utility
        })) : proposals,
        count: proposals.length,
      });
    }

    // Return deposit period proposals only
    if (depositPeriod) {
      const proposals = await fetchDepositPeriodProposals();
      return NextResponse.json({
        success: true,
        data: proposals,
        count: proposals.length,
      });
    }

    // Parse status filter
    let status: ProposalStatus | undefined;
    if (statusParam) {
      // Convert string to ProposalStatus enum
      const statusMap: { [key: string]: ProposalStatus } = {
        'PROPOSAL_STATUS_UNSPECIFIED': ProposalStatus.UNSPECIFIED,
        'PROPOSAL_STATUS_DEPOSIT_PERIOD': ProposalStatus.DEPOSIT_PERIOD,
        'PROPOSAL_STATUS_VOTING_PERIOD': ProposalStatus.VOTING_PERIOD,
        'PROPOSAL_STATUS_PASSED': ProposalStatus.PASSED,
        'PROPOSAL_STATUS_REJECTED': ProposalStatus.REJECTED,
        'PROPOSAL_STATUS_FAILED': ProposalStatus.FAILED,
        // Also support simplified names
        'deposit': ProposalStatus.DEPOSIT_PERIOD,
        'voting': ProposalStatus.VOTING_PERIOD,
        'passed': ProposalStatus.PASSED,
        'rejected': ProposalStatus.REJECTED,
        'failed': ProposalStatus.FAILED,
      };
      status = statusMap[statusParam.toUpperCase()] || statusMap[statusParam.toLowerCase()];
    }

    // Build pagination params
    const pagination = {
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
      reverse,
      countTotal: true,
    };

    // Fetch proposals (enriched or raw)
    if (enriched) {
      const proposals = await fetchEnrichedProposals(status);
      return NextResponse.json({
        success: true,
        data: proposals,
        count: proposals.length,
      });
    } else {
      const response = await fetchProposals(status, pagination);
      return NextResponse.json({
        success: true,
        data: response.proposals,
        pagination: response.pagination,
        count: response.proposals?.length || 0,
      });
    }

  } catch (error) {
    console.error('❌ [API] Error in proposals endpoint:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch proposals',
      data: null,
    }, { status: 500 });
  }
}

// ============================================
// API DOCUMENTATION
// ============================================

/**
 * GOVERNANCE PROPOSALS API ENDPOINTS
 * 
 * GET /api/governance/proposals
 * 
 * Query Parameters:
 * - status: Filter by proposal status (deposit, voting, passed, rejected, failed)
 * - enriched: Return enriched proposals with computed fields (default: false)
 * - stats: Return proposal statistics instead of list (default: false)
 * - active: Return only active (voting period) proposals (default: false)
 * - depositPeriod: Return only proposals in deposit period (default: false)
 * - limit: Limit number of results (pagination)
 * - offset: Offset for pagination
 * - reverse: Reverse order of results (default: false)
 * 
 * Examples:
 * - GET /api/governance/proposals
 *   Returns all proposals
 * 
 * - GET /api/governance/proposals?status=voting&enriched=true
 *   Returns all proposals in voting period with enriched data
 * 
 * - GET /api/governance/proposals?active=true
 *   Returns only active proposals
 * 
 * - GET /api/governance/proposals?stats=true
 *   Returns proposal statistics
 * 
 * - GET /api/governance/proposals?limit=10&offset=0
 *   Returns first 10 proposals (pagination)
 * 
 * Response Format:
 * {
 *   "success": true,
 *   "data": [...],
 *   "count": 15,
 *   "pagination": {
 *     "next_key": "...",
 *     "total": "15"
 *   }
 * }
 * 
 * Statistics Response Format:
 * {
 *   "success": true,
 *   "data": {
 *     "total": 100,
 *     "active": 5,
 *     "passed": 80,
 *     "rejected": 10,
 *     "failed": 2,
 *     "depositPeriod": 3
 *   }
 * }
 */

