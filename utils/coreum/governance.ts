/**
 * ============================================
 * COREUM GOVERNANCE UTILITY FUNCTIONS
 * ============================================
 * 
 * Complete utilities for interacting with Coreum governance module
 * Handles proposal fetching, voting, and vote tracking
 * 
 * File: /utils/coreum/governance.ts
 */

import { SigningStargateClient, GasPrice } from "@cosmjs/stargate";
import {
  Proposal,
  ProposalStatus,
  Vote,
  VoteOption,
  TallyResult,
  Deposit,
  GovParams,
  ProposalsResponse,
  ProposalResponse,
  VotesResponse,
  VoteResponse,
  TallyResponse,
  DepositsResponse,
  EnrichedProposal,
  ProposalType,
  VoteRequest,
  VoteTransactionResult,
  PaginationParams,
  ProposalStats,
  DelegationResponse,
} from "@/types/governance";

// ============================================
// CONFIGURATION
// ============================================

const COREUM_RPC_ENDPOINT =
  process.env.NEXT_PUBLIC_COREUM_RPC ||
  "https://full-node.mainnet-1.coreum.dev:26657";
const COREUM_REST_ENDPOINT =
  process.env.NEXT_PUBLIC_COREUM_REST ||
  "https://full-node.mainnet-1.coreum.dev:1317";
const COREUM_CHAIN_ID =
  process.env.NEXT_PUBLIC_COREUM_CHAIN_ID || "coreum-mainnet-1";
const COREUM_GAS_PRICE = GasPrice.fromString("0.0625ucore");

// API request timeout
const REQUEST_TIMEOUT = 10000; // 10 seconds

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Make a REST API call with timeout and error handling
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return response;
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

/**
 * Convert proposal status enum to human-readable label
 */
export function getStatusLabel(status: ProposalStatus): string {
  switch (status) {
    case ProposalStatus.DEPOSIT_PERIOD:
      return "Deposit Period";
    case ProposalStatus.VOTING_PERIOD:
      return "Voting Period";
    case ProposalStatus.PASSED:
      return "Passed";
    case ProposalStatus.REJECTED:
      return "Rejected";
    case ProposalStatus.FAILED:
      return "Failed";
    default:
      return "Unspecified";
  }
}

/**
 * Convert vote option enum to human-readable label
 */
export function getVoteOptionLabel(option: VoteOption): string {
  switch (option) {
    case VoteOption.YES:
      return "Yes";
    case VoteOption.NO:
      return "No";
    case VoteOption.ABSTAIN:
      return "Abstain";
    case VoteOption.NO_WITH_VETO:
      return "No with Veto";
    default:
      return "Unspecified";
  }
}

/**
 * Determine proposal type from content
 */
export function getProposalType(content: any): ProposalType {
  const typeStr = content["@type"] || content.type || "";

  if (typeStr.includes("TextProposal")) return ProposalType.TEXT;
  if (typeStr.includes("CommunityPoolSpend"))
    return ProposalType.COMMUNITY_POOL_SPEND;
  if (typeStr.includes("ParameterChange"))
    return ProposalType.PARAMETER_CHANGE;
  if (typeStr.includes("SoftwareUpgrade")) return ProposalType.SOFTWARE_UPGRADE;
  if (typeStr.includes("CancelSoftwareUpgrade"))
    return ProposalType.CANCEL_SOFTWARE_UPGRADE;
  if (typeStr.includes("ClientUpdate")) return ProposalType.CLIENT_UPDATE;
  if (typeStr.includes("Upgrade")) return ProposalType.UPGRADE;

  return ProposalType.OTHER;
}

/**
 * Calculate time remaining for a proposal
 */
export function getTimeRemaining(endTime: string): string {
  const now = new Date().getTime();
  const end = new Date(endTime).getTime();
  const diff = end - now;

  if (diff <= 0) return "Ended";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/**
 * Calculate vote percentages from tally
 */
export function calculateVotePercentages(tally: TallyResult): {
  yesPercentage: number;
  noPercentage: number;
  abstainPercentage: number;
  vetoPercentage: number;
  turnoutPercentage: number;
} {
  const yes = parseFloat(tally.yes || "0");
  const no = parseFloat(tally.no || "0");
  const abstain = parseFloat(tally.abstain || "0");
  const veto = parseFloat(tally.no_with_veto || "0");

  const total = yes + no + abstain + veto;

  if (total === 0) {
    return {
      yesPercentage: 0,
      noPercentage: 0,
      abstainPercentage: 0,
      vetoPercentage: 0,
      turnoutPercentage: 0,
    };
  }

  return {
    yesPercentage: (yes / total) * 100,
    noPercentage: (no / total) * 100,
    abstainPercentage: (abstain / total) * 100,
    vetoPercentage: (veto / total) * 100,
    turnoutPercentage: 100, // This would require total bonded tokens from chain
  };
}

/**
 * Check if proposal is active (can be voted on)
 */
export function isProposalActive(proposal: Proposal): boolean {
  return proposal.status === ProposalStatus.VOTING_PERIOD;
}

// ============================================
// PROPOSAL FETCHING FUNCTIONS
// ============================================

/**
 * Fetch all proposals with optional filtering and pagination
 */
export async function fetchProposals(
  status?: ProposalStatus,
  pagination?: PaginationParams
): Promise<ProposalsResponse> {
  try {
    // Use gov/v1 API (not v1beta1) - Coreum uses newer Cosmos SDK
    let url = `${COREUM_REST_ENDPOINT}/cosmos/gov/v1/proposals`;

    const params = new URLSearchParams();
    if (status) {
      // Convert status to numeric value for v1 API
      const statusMap: { [key: string]: string } = {
        'PROPOSAL_STATUS_UNSPECIFIED': '0',
        'PROPOSAL_STATUS_DEPOSIT_PERIOD': '1',
        'PROPOSAL_STATUS_VOTING_PERIOD': '2',
        'PROPOSAL_STATUS_PASSED': '3',
        'PROPOSAL_STATUS_REJECTED': '4',
        'PROPOSAL_STATUS_FAILED': '5',
      };
      const statusValue = statusMap[status] || status;
      params.append("proposal_status", statusValue);
    }
    if (pagination?.limit) params.append("pagination.limit", pagination.limit.toString());
    if (pagination?.offset) params.append("pagination.offset", pagination.offset.toString());
    if (pagination?.reverse) params.append("pagination.reverse", "true");
    if (pagination?.countTotal) params.append("pagination.count_total", "true");
    if (pagination?.key) params.append("pagination.key", pagination.key);

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    console.log(`📡 [Governance] Fetching proposals from v1 API: ${url}`);

    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [Governance] API error: ${errorText}`);
      throw new Error(`Failed to fetch proposals: ${response.statusText}`);
    }

    const data: ProposalsResponse = await response.json();

    console.log(
      `✅ [Governance] Fetched ${data.proposals?.length || 0} proposals`
    );

    return data;
  } catch (error) {
    console.error("❌ [Governance] Error fetching proposals:", error);
    throw error;
  }
}

/**
 * Fetch a single proposal by ID
 */
export async function fetchProposal(
  proposalId: string
): Promise<ProposalResponse> {
  try {
    // Use gov/v1 API
    const url = `${COREUM_REST_ENDPOINT}/cosmos/gov/v1/proposals/${proposalId}`;

    console.log(`📡 [Governance] Fetching proposal ${proposalId} from v1 API: ${url}`);

    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch proposal ${proposalId}: ${response.statusText}`
      );
    }

    const data: ProposalResponse = await response.json();

    console.log(`✅ [Governance] Fetched proposal ${proposalId}`);

    return data;
  } catch (error) {
    console.error(
      `❌ [Governance] Error fetching proposal ${proposalId}:`,
      error
    );
    throw error;
  }
}

/**
 * Fetch proposals by status (active, passed, rejected, etc.)
 */
export async function fetchProposalsByStatus(
  status: ProposalStatus
): Promise<Proposal[]> {
  try {
    const response = await fetchProposals(status);
    return response.proposals || [];
  } catch (error) {
    console.error(
      `❌ [Governance] Error fetching proposals by status ${status}:`,
      error
    );
    return [];
  }
}

/**
 * Fetch active proposals (in voting period)
 */
export async function fetchActiveProposals(): Promise<Proposal[]> {
  return fetchProposalsByStatus(ProposalStatus.VOTING_PERIOD);
}

/**
 * Fetch proposals in deposit period
 */
export async function fetchDepositPeriodProposals(): Promise<Proposal[]> {
  return fetchProposalsByStatus(ProposalStatus.DEPOSIT_PERIOD);
}

/**
 * Fetch all proposals with enriched data
 */
export async function fetchEnrichedProposals(
  status?: ProposalStatus
): Promise<EnrichedProposal[]> {
  try {
    const response = await fetchProposals(status);
    const proposals = response.proposals || [];

    return proposals.map((proposal) => enrichProposal(proposal));
  } catch (error) {
    console.error("❌ [Governance] Error fetching enriched proposals:", error);
    return [];
  }
}

/**
 * Enrich a proposal with computed fields
 */
export function enrichProposal(proposal: Proposal): EnrichedProposal {
  const type = getProposalType(proposal.content);
  const statusLabel = getStatusLabel(proposal.status);
  const isActive = isProposalActive(proposal);
  const canVote = isActive;

  const timeRemaining = isActive
    ? getTimeRemaining(proposal.voting_end_time)
    : undefined;

  const percentages = calculateVotePercentages(proposal.final_tally_result);

  return {
    ...proposal,
    type,
    statusLabel,
    timeRemaining,
    isActive,
    canVote,
    ...percentages,
  };
}

// ============================================
// VOTING FUNCTIONS
// ============================================

/**
 * Fetch votes for a proposal
 */
export async function fetchProposalVotes(
  proposalId: string,
  pagination?: PaginationParams
): Promise<VotesResponse> {
  try {
    // Use gov/v1 API
    let url = `${COREUM_REST_ENDPOINT}/cosmos/gov/v1/proposals/${proposalId}/votes`;

    const params = new URLSearchParams();
    if (pagination?.limit) params.append("pagination.limit", pagination.limit.toString());
    if (pagination?.offset) params.append("pagination.offset", pagination.offset.toString());

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    console.log(
      `📡 [Governance] Fetching votes for proposal ${proposalId} from v1 API: ${url}`
    );

    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch votes for proposal ${proposalId}: ${response.statusText}`
      );
    }

    const data: VotesResponse = await response.json();

    console.log(
      `✅ [Governance] Fetched ${data.votes?.length || 0} votes for proposal ${proposalId}`
    );

    return data;
  } catch (error) {
    console.error(
      `❌ [Governance] Error fetching votes for proposal ${proposalId}:`,
      error
    );
    throw error;
  }
}

/**
 * Fetch a specific user's vote on a proposal
 */
export async function fetchUserVote(
  proposalId: string,
  voterAddress: string
): Promise<Vote | null> {
  try {
    // Use gov/v1 API
    const url = `${COREUM_REST_ENDPOINT}/cosmos/gov/v1/proposals/${proposalId}/votes/${voterAddress}`;

    console.log(
      `📡 [Governance] Fetching vote for ${voterAddress} on proposal ${proposalId} from v1 API`
    );

    const response = await fetchWithTimeout(url);

    if (response.status === 404) {
      console.log(`ℹ️ [Governance] User has not voted on proposal ${proposalId}`);
      return null;
    }

    if (!response.ok) {
      throw new Error(
        `Failed to fetch user vote: ${response.statusText}`
      );
    }

    const data: VoteResponse = await response.json();

    console.log(
      `✅ [Governance] User voted ${data.vote.options?.[0]?.option || data.vote.option} on proposal ${proposalId}`
    );

    return data.vote;
  } catch (error) {
    console.error(
      `❌ [Governance] Error fetching user vote:`,
      error
    );
    return null;
  }
}

/**
 * Fetch all votes by a user across all proposals
 */
export async function fetchUserVotingHistory(
  voterAddress: string
): Promise<Vote[]> {
  try {
    // First, get all proposals
    const proposalsResponse = await fetchProposals();
    const proposals = proposalsResponse.proposals || [];

    // Then check each proposal for user's vote
    const votes: Vote[] = [];

    for (const proposal of proposals) {
      const vote = await fetchUserVote(proposal.proposal_id, voterAddress);
      if (vote) {
        votes.push(vote);
      }
    }

    console.log(
      `✅ [Governance] Fetched ${votes.length} votes for user ${voterAddress}`
    );

    return votes;
  } catch (error) {
    console.error(
      `❌ [Governance] Error fetching user voting history:`,
      error
    );
    return [];
  }
}

/**
 * Cast a vote on a proposal (requires wallet signing)
 */
export async function voteOnProposal(
  voteRequest: VoteRequest,
  signer: any
): Promise<VoteTransactionResult> {
  try {
    console.log(
      `📡 [Governance] Voting ${voteRequest.option} on proposal ${voteRequest.proposalId}`
    );

    // Connect to Coreum with signer
    const client = await SigningStargateClient.connectWithSigner(
      COREUM_RPC_ENDPOINT,
      signer,
      { gasPrice: COREUM_GAS_PRICE }
    );

    // Create vote message
    const voteMsg = {
      typeUrl: "/cosmos.gov.v1beta1.MsgVote",
      value: {
        proposalId: voteRequest.proposalId,
        voter: voteRequest.voter,
        option: voteRequest.option,
      },
    };

    // Broadcast transaction
    const result = await client.signAndBroadcast(
      voteRequest.voter,
      [voteMsg],
      "auto",
      "Vote on proposal"
    );

    if (result.code !== 0) {
      throw new Error(`Transaction failed: ${result.rawLog}`);
    }

    console.log(
      `✅ [Governance] Vote successful! TX: ${result.transactionHash}`
    );

    return {
      success: true,
      transactionHash: result.transactionHash,
      blockHeight: result.height,
      gasUsed: result.gasUsed.toString(),
    };
  } catch (error) {
    console.error(`❌ [Governance] Error voting on proposal:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ============================================
// TALLY & RESULTS FUNCTIONS
// ============================================

/**
 * Fetch current tally for a proposal
 */
export async function fetchProposalTally(
  proposalId: string
): Promise<TallyResponse> {
  try {
    // Use gov/v1 API
    const url = `${COREUM_REST_ENDPOINT}/cosmos/gov/v1/proposals/${proposalId}/tally`;

    console.log(
      `📡 [Governance] Fetching tally for proposal ${proposalId} from v1 API: ${url}`
    );

    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch tally for proposal ${proposalId}: ${response.statusText}`
      );
    }

    const data: TallyResponse = await response.json();

    console.log(`✅ [Governance] Fetched tally for proposal ${proposalId}`);

    return data;
  } catch (error) {
    console.error(
      `❌ [Governance] Error fetching tally for proposal ${proposalId}:`,
      error
    );
    throw error;
  }
}

// ============================================
// DEPOSIT FUNCTIONS
// ============================================

/**
 * Fetch deposits for a proposal
 */
export async function fetchProposalDeposits(
  proposalId: string
): Promise<DepositsResponse> {
  try {
    // Use gov/v1 API
    const url = `${COREUM_REST_ENDPOINT}/cosmos/gov/v1/proposals/${proposalId}/deposits`;

    console.log(
      `📡 [Governance] Fetching deposits for proposal ${proposalId} from v1 API: ${url}`
    );

    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch deposits for proposal ${proposalId}: ${response.statusText}`
      );
    }

    const data: DepositsResponse = await response.json();

    console.log(
      `✅ [Governance] Fetched ${data.deposits?.length || 0} deposits for proposal ${proposalId}`
    );

    return data;
  } catch (error) {
    console.error(
      `❌ [Governance] Error fetching deposits for proposal ${proposalId}:`,
      error
    );
    throw error;
  }
}

// ============================================
// GOVERNANCE PARAMETERS
// ============================================

/**
 * Fetch governance parameters
 */
export async function fetchGovParams(): Promise<GovParams | null> {
  try {
    // Use gov/v1 API
    const [votingParams, depositParams, tallyParams] = await Promise.all([
      fetchWithTimeout(
        `${COREUM_REST_ENDPOINT}/cosmos/gov/v1/params/voting`
      ).then((r) => r.json()),
      fetchWithTimeout(
        `${COREUM_REST_ENDPOINT}/cosmos/gov/v1/params/deposit`
      ).then((r) => r.json()),
      fetchWithTimeout(
        `${COREUM_REST_ENDPOINT}/cosmos/gov/v1/params/tallying`
      ).then((r) => r.json()),
    ]);

    console.log("✅ [Governance] Fetched governance parameters");

    return {
      voting_params: votingParams.voting_params,
      deposit_params: depositParams.deposit_params,
      tally_params: tallyParams.tally_params,
    };
  } catch (error) {
    console.error("❌ [Governance] Error fetching governance parameters:", error);
    return null;
  }
}

// ============================================
// STATISTICS FUNCTIONS
// ============================================

/**
 * Calculate proposal statistics
 */
export async function fetchProposalStats(): Promise<ProposalStats> {
  try {
    const response = await fetchProposals();
    const proposals = response.proposals || [];

    const stats: ProposalStats = {
      total: proposals.length,
      active: 0,
      passed: 0,
      rejected: 0,
      failed: 0,
      depositPeriod: 0,
    };

    proposals.forEach((proposal) => {
      switch (proposal.status) {
        case ProposalStatus.VOTING_PERIOD:
          stats.active++;
          break;
        case ProposalStatus.PASSED:
          stats.passed++;
          break;
        case ProposalStatus.REJECTED:
          stats.rejected++;
          break;
        case ProposalStatus.FAILED:
          stats.failed++;
          break;
        case ProposalStatus.DEPOSIT_PERIOD:
          stats.depositPeriod++;
          break;
      }
    });

    console.log("✅ [Governance] Calculated proposal statistics:", stats);

    return stats;
  } catch (error) {
    console.error("❌ [Governance] Error calculating proposal stats:", error);
    return {
      total: 0,
      active: 0,
      passed: 0,
      rejected: 0,
      failed: 0,
      depositPeriod: 0,
    };
  }
}

// ============================================
// VOTING POWER FUNCTIONS
// ============================================

/**
 * Fetch user's voting power (delegated stake)
 */
export async function fetchUserVotingPower(address: string): Promise<string> {
  try {
    const url = `${COREUM_REST_ENDPOINT}/cosmos/staking/v1beta1/delegations/${address}`;

    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      return "0";
    }

    const data: DelegationResponse = await response.json();
    const delegations = data.delegation_responses || [];

    const totalStaked = delegations.reduce((sum: bigint, del: any) => {
      return sum + BigInt(del.balance?.amount || "0");
    }, BigInt(0));

    console.log(
      `✅ [Governance] User ${address} has voting power: ${totalStaked.toString()}`
    );

    return totalStaked.toString();
  } catch (error) {
    console.error(
      `❌ [Governance] Error fetching voting power for ${address}:`,
      error
    );
    return "0";
  }
}

// ============================================
// PROPOSAL SUBMISSION
// ============================================

/**
 * Submit a new governance proposal
 */
export async function submitProposal(params: {
  title: string;
  description: string;
  proposer: string;
  initialDeposit: string; // Amount in ucore (e.g., "10000000000" for 10000 CORE)
  signer: any; // Wallet signer from Keplr/Leap/Cosmostation
}): Promise<VoteTransactionResult> {
  try {
    const { title, description, proposer, initialDeposit, signer } = params;

    console.log(`📡 [Governance] Submitting proposal: ${title}`);
    console.log(`📡 [Governance] Proposer: ${proposer}`);
    console.log(`📡 [Governance] Initial deposit: ${initialDeposit} ucore`);

    // Connect to Coreum with signer
    const client = await SigningStargateClient.connectWithSigner(
      COREUM_RPC_ENDPOINT,
      signer,
      { gasPrice: COREUM_GAS_PRICE }
    );

    // Create the proposal message
    const msg = {
      typeUrl: "/cosmos.gov.v1beta1.MsgSubmitProposal",
      value: {
        content: {
          typeUrl: "/cosmos.gov.v1beta1.TextProposal",
          value: {
            title: title,
            description: description,
          },
        },
        initialDeposit: [
          {
            denom: "ucore",
            amount: initialDeposit,
          },
        ],
        proposer: proposer,
      },
    };

    // Calculate gas
    const gasEstimate = await client.simulate(proposer, [msg], "");
    const gas = Math.round(gasEstimate * 1.5); // 50% buffer

    // Submit the transaction
    const result = await client.signAndBroadcast(
      proposer,
      [msg],
      {
        amount: [{ denom: "ucore", amount: "5000" }],
        gas: gas.toString(),
      },
      `Submit proposal: ${title}`
    );

    if (result.code !== 0) {
      throw new Error(`Transaction failed: ${result.rawLog}`);
    }

    console.log(`✅ [Governance] Proposal submitted successfully`);
    console.log(`📝 [Governance] Transaction hash: ${result.transactionHash}`);

    return {
      success: true,
      transactionHash: result.transactionHash,
      gasUsed: result.gasUsed.toString(),
    };
  } catch (error) {
    console.error(`❌ [Governance] Error submitting proposal:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

