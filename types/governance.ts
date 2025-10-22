/**
 * ============================================
 * COREUM GOVERNANCE TYPES & INTERFACES
 * ============================================
 * 
 * Complete type definitions for Coreum governance proposals and voting
 * 
 * File: /types/governance.ts
 */

// ============================================
// PROPOSAL TYPES
// ============================================

export enum ProposalStatus {
  UNSPECIFIED = "PROPOSAL_STATUS_UNSPECIFIED",
  DEPOSIT_PERIOD = "PROPOSAL_STATUS_DEPOSIT_PERIOD",
  VOTING_PERIOD = "PROPOSAL_STATUS_VOTING_PERIOD",
  PASSED = "PROPOSAL_STATUS_PASSED",
  REJECTED = "PROPOSAL_STATUS_REJECTED",
  FAILED = "PROPOSAL_STATUS_FAILED",
}

export enum VoteOption {
  UNSPECIFIED = "VOTE_OPTION_UNSPECIFIED",
  YES = "VOTE_OPTION_YES",
  NO = "VOTE_OPTION_NO",
  ABSTAIN = "VOTE_OPTION_ABSTAIN",
  NO_WITH_VETO = "VOTE_OPTION_NO_WITH_VETO",
}

export enum ProposalType {
  TEXT = "TextProposal",
  COMMUNITY_POOL_SPEND = "CommunityPoolSpendProposal",
  PARAMETER_CHANGE = "ParameterChangeProposal",
  SOFTWARE_UPGRADE = "SoftwareUpgradeProposal",
  CANCEL_SOFTWARE_UPGRADE = "CancelSoftwareUpgradeProposal",
  CLIENT_UPDATE = "ClientUpdateProposal",
  UPGRADE = "UpgradeProposal",
  OTHER = "Other",
}

// ============================================
// CORE INTERFACES
// ============================================

export interface Coin {
  denom: string;
  amount: string;
}

export interface ProposalContent {
  "@type": string;
  title: string;
  description: string;
  [key: string]: any; // Additional fields based on proposal type
}

export interface TallyResult {
  yes: string;
  no: string;
  abstain: string;
  no_with_veto: string;
  yes_count?: string;
  no_count?: string;
  abstain_count?: string;
  no_with_veto_count?: string;
}

export interface Proposal {
  proposal_id: string;
  content: ProposalContent;
  status: ProposalStatus;
  final_tally_result: TallyResult;
  submit_time: string;
  deposit_end_time: string;
  total_deposit: Coin[];
  voting_start_time: string;
  voting_end_time: string;
  metadata?: string;
  title?: string;
  summary?: string;
  proposer?: string;
}

export interface Vote {
  proposal_id: string;
  voter: string;
  option: VoteOption;
  options?: WeightedVoteOption[];
  metadata?: string;
}

export interface WeightedVoteOption {
  option: VoteOption;
  weight: string;
}

export interface Deposit {
  proposal_id: string;
  depositor: string;
  amount: Coin[];
}

// ============================================
// GOVERNANCE PARAMETERS
// ============================================

export interface VotingParams {
  voting_period: string;
}

export interface DepositParams {
  min_deposit: Coin[];
  max_deposit_period: string;
}

export interface TallyParams {
  quorum: string;
  threshold: string;
  veto_threshold: string;
}

export interface GovParams {
  voting_params: VotingParams;
  deposit_params: DepositParams;
  tally_params: TallyParams;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ProposalsResponse {
  proposals: Proposal[];
  pagination: {
    next_key: string | null;
    total: string;
  };
}

export interface ProposalResponse {
  proposal: Proposal;
}

export interface VotesResponse {
  votes: Vote[];
  pagination: {
    next_key: string | null;
    total: string;
  };
}

export interface VoteResponse {
  vote: Vote;
}

export interface TallyResponse {
  tally: TallyResult;
}

export interface DepositsResponse {
  deposits: Deposit[];
  pagination: {
    next_key: string | null;
    total: string;
  };
}

export interface DepositResponse {
  deposit: Deposit;
}

// ============================================
// ENRICHED TYPES FOR UI
// ============================================

export interface EnrichedProposal extends Proposal {
  // Computed fields
  type: ProposalType;
  statusLabel: string;
  timeRemaining?: string;
  turnoutPercentage?: number;
  yesPercentage?: number;
  noPercentage?: number;
  abstainPercentage?: number;
  vetoPercentage?: number;
  
  // User-specific fields
  userVote?: VoteOption;
  userHasVoted?: boolean;
  
  // Additional metadata
  isActive?: boolean;
  canVote?: boolean;
  totalVotingPower?: string;
}

export interface ProposalStats {
  total: number;
  active: number;
  passed: number;
  rejected: number;
  failed: number;
  depositPeriod: number;
}

// ============================================
// VOTING TRANSACTION TYPES
// ============================================

export interface VoteRequest {
  proposalId: string;
  voter: string;
  option: VoteOption;
  weightedOptions?: WeightedVoteOption[];
}

export interface VoteTransactionResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
  blockHeight?: number;
  gasUsed?: string;
}

// ============================================
// FILTERING & PAGINATION
// ============================================

export interface ProposalFilters {
  status?: ProposalStatus;
  voter?: string;
  depositor?: string;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
  reverse?: boolean;
  countTotal?: boolean;
  key?: string;
}

// ============================================
// HELPER TYPES
// ============================================

export type ProposalStatusLabel = 
  | "Unspecified"
  | "Deposit Period"
  | "Voting Period"
  | "Passed"
  | "Rejected"
  | "Failed";

export type VoteOptionLabel = 
  | "Yes"
  | "No"
  | "Abstain"
  | "No with Veto"
  | "Unspecified";

// ============================================
// VALIDATOR TYPES (for voting power calculation)
// ============================================

export interface ValidatorDelegation {
  delegation: {
    delegator_address: string;
    validator_address: string;
    shares: string;
  };
  balance: Coin;
}

export interface DelegationResponse {
  delegation_responses: ValidatorDelegation[];
  pagination: {
    next_key: string | null;
    total: string;
  };
}

// ============================================
// ERROR TYPES
// ============================================

export interface GovernanceError {
  code: number;
  message: string;
  details?: string;
}


