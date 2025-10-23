"use client";

import { useEffect, useState, useRef } from "react";
import { IoClose, IoCheckmarkCircle, IoCloseCircle, IoTimeOutline, IoCalendar, IoPerson, IoDocumentText, IoWallet, IoCash, IoInformationCircle } from "react-icons/io5";
import { EnrichedProposal } from "@/types/governance";
import VoteButton from "./VoteButton";

interface ProposalDetailModalProps {
  proposal: EnrichedProposal;
  userAddress?: string | null;
  isOpen: boolean;
  onClose: () => void;
  onVoteSuccess?: () => void;
}

export default function ProposalDetailModal({
  proposal,
  userAddress,
  isOpen,
  onClose,
  onVoteSuccess,
}: ProposalDetailModalProps) {
  const [mounted, setMounted] = useState(false);
  const [userHasVoted, setUserHasVoted] = useState(false);
  const [userVoteOption, setUserVoteOption] = useState<string | null>(null);
  const [loadingVoteStatus, setLoadingVoteStatus] = useState(false);
  const [showScrollHint, setShowScrollHint] = useState(true);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (userAddress && proposal.proposal_id) {
      checkUserVoteStatus();
    }
  }, [userAddress, proposal.proposal_id]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const checkUserVoteStatus = async () => {
    if (!userAddress) return;

    setLoadingVoteStatus(true);
    try {
      const response = await fetch(
        `/api/governance/votes/${userAddress}?proposalId=${proposal.proposal_id}`
      );
      const data = await response.json();

      if (data.success && data.data.hasVoted) {
        setUserHasVoted(true);
        setUserVoteOption(data.data.vote?.option || null);
      }
    } catch (error) {
      console.error('Failed to check vote status:', error);
    } finally {
      setLoadingVoteStatus(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PROPOSAL_STATUS_VOTING_PERIOD':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 'PROPOSAL_STATUS_PASSED':
        return 'text-green-400 bg-green-500/10 border-green-500/30';
      case 'PROPOSAL_STATUS_REJECTED':
      case 'PROPOSAL_STATUS_FAILED':
        return 'text-red-400 bg-red-500/10 border-red-500/30';
      default:
        return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
    }
  };

  const getStatusLabel = (status: string) => {
    return status
      .replace('PROPOSAL_STATUS_', '')
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getVoteOptionLabel = (option: string) => {
    return option
      .replace('VOTE_OPTION_', '')
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getProposalType = () => {
    if (!proposal.content?.['@type']) return 'Unknown';
    const type = proposal.content['@type'];
    // Extract the type name after the last dot
    const typeName = type.split('.').pop() || 'Unknown';
    return typeName.replace(/([A-Z])/g, ' $1').trim();
  };

  const formatAmount = (coins: any[] | undefined) => {
    if (!coins || coins.length === 0) return 'N/A';
    const coin = coins[0];
    const amount = parseInt(coin.amount) / 1000000; // Convert ucore to CORE
    return `${amount.toLocaleString()} CORE`;
  };

  const isVotingPeriod = proposal.status === 'PROPOSAL_STATUS_VOTING_PERIOD';
  const canVote = isVotingPeriod && userAddress && !userHasVoted;

  if (!mounted || !isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
        onWheel={(e) => e.preventDefault()}
        onTouchMove={(e) => e.preventDefault()}
      ></div>

      {/* Modal */}
      <div 
        ref={modalRef}
        className="relative w-full max-w-4xl bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
        onScroll={(e) => {
          const target = e.currentTarget;
          if (target.scrollTop > 50) {
            setShowScrollHint(false);
          }
        }}
        style={{ 
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column'
        } as React.CSSProperties}
      >
        <div className="flex-shrink-0 bg-gray-900 border-b border-gray-700 p-6 rounded-t-2xl">
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm font-mono text-gray-500">
                  #{proposal.proposal_id}
                </span>
                <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(proposal.status)}`}>
                  {getStatusLabel(proposal.status)}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-white">
                {proposal.content?.title || 'Untitled Proposal'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <IoClose className="w-6 h-6 text-gray-400" />
            </button>
          </div>
        </div>

        <div 
          className="flex-1 overflow-y-auto p-6 space-y-6 rounded-b-2xl"
          style={{
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain'
          }}
        >
          {/* Proposal Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Proposal Type */}
            <div className="p-4 bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <IoDocumentText className="w-4 h-4" />
                <span className="text-sm font-medium">Proposal Type</span>
              </div>
              <div className="text-white text-sm font-semibold">
                {getProposalType()}
              </div>
            </div>

            {/* Total Deposit */}
            <div className="p-4 bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <IoCash className="w-4 h-4" />
                <span className="text-sm font-medium">Total Deposit</span>
              </div>
              <div className="text-white text-sm font-semibold">
                {formatAmount(proposal.total_deposit)}
              </div>
            </div>

            {/* Proposer */}
            {proposal.proposer && (
              <div className="p-4 bg-gray-800/50 rounded-lg md:col-span-2">
                <div className="flex items-center gap-2 text-gray-400 mb-2">
                  <IoPerson className="w-4 h-4" />
                  <span className="text-sm font-medium">Proposer</span>
                </div>
                <div className="text-white text-xs font-mono break-all">
                  {proposal.proposer}
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Description</h3>
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300 whitespace-pre-wrap">
                {proposal.content?.description || 'No description available'}
              </p>
            </div>
          </div>

          {/* Additional Details from Content */}
          {proposal.content && Object.keys(proposal.content).length > 2 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <IoInformationCircle className="w-5 h-5 text-blue-400" />
                Additional Details
              </h3>
              <div className="p-4 bg-gray-800/50 rounded-lg space-y-2">
                {Object.entries(proposal.content).map(([key, value]) => {
                  // Skip title, description, and @type as they're shown elsewhere
                  if (key === 'title' || key === 'description' || key === '@type') return null;
                  
                  return (
                    <div key={key} className="border-b border-gray-700/50 last:border-0 pb-2 last:pb-0">
                      <span className="text-gray-400 text-sm font-medium capitalize">
                        {key.replace(/_/g, ' ')}:
                      </span>
                      <div className="text-white text-sm mt-1 break-all">
                        {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <IoCalendar className="w-4 h-4" />
                <span className="text-sm font-medium">Submit Time</span>
              </div>
              <div className="text-white text-sm">
                {proposal.submit_time 
                  ? formatDate(proposal.submit_time)
                  : 'N/A'
                }
              </div>
            </div>
            <div className="p-4 bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <IoCalendar className="w-4 h-4" />
                <span className="text-sm font-medium">Deposit End Time</span>
              </div>
              <div className="text-white text-sm">
                {proposal.deposit_end_time 
                  ? formatDate(proposal.deposit_end_time)
                  : 'N/A'
                }
              </div>
            </div>
            <div className="p-4 bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <IoCalendar className="w-4 h-4" />
                <span className="text-sm font-medium">Voting Start</span>
              </div>
              <div className="text-white text-sm">
                {proposal.voting_start_time 
                  ? formatDate(proposal.voting_start_time)
                  : 'N/A'
                }
              </div>
            </div>
            <div className="p-4 bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <IoCalendar className="w-4 h-4" />
                <span className="text-sm font-medium">Voting End</span>
              </div>
              <div className="text-white text-sm">
                {proposal.voting_end_time 
                  ? formatDate(proposal.voting_end_time)
                  : 'N/A'
                }
              </div>
            </div>
          </div>

          {/* Time Remaining */}
          {isVotingPeriod && proposal.timeRemaining && (
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <div className="flex items-center gap-2">
                <IoTimeOutline className="w-5 h-5 text-blue-400" />
                <span className="text-blue-400 font-medium">
                  {proposal.timeRemaining} remaining to vote
                </span>
              </div>
            </div>
          )}

          {/* Vote Tally */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Current Results</h3>
            <div className="space-y-3">
              {/* Yes */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Yes</span>
                  <span className="font-medium text-green-400">
                    {proposal.yesPercentage?.toFixed(2) || '0.00'}%
                  </span>
                </div>
                <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-1000"
                    style={{ width: `${proposal.yesPercentage || 0}%` }}
                  ></div>
                </div>
              </div>

              {/* No */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">No</span>
                  <span className="font-medium text-red-400">
                    {proposal.noPercentage?.toFixed(2) || '0.00'}%
                  </span>
                </div>
                <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-500 to-red-400 transition-all duration-1000"
                    style={{ width: `${proposal.noPercentage || 0}%` }}
                  ></div>
                </div>
              </div>

              {/* Abstain */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Abstain</span>
                  <span className="font-medium text-gray-400">
                    {proposal.abstainPercentage?.toFixed(2) || '0.00'}%
                  </span>
                </div>
                <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-gray-500 to-gray-400 transition-all duration-1000"
                    style={{ width: `${proposal.abstainPercentage || 0}%` }}
                  ></div>
                </div>
              </div>

              {/* Veto */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">No with Veto</span>
                  <span className="font-medium text-orange-400">
                    {proposal.vetoPercentage?.toFixed(2) || '0.00'}%
                  </span>
                </div>
                <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-1000"
                    style={{ width: `${proposal.vetoPercentage || 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* User Vote Status */}
          {userHasVoted && (
            <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
              <div className="flex items-center gap-2">
                <IoCheckmarkCircle className="w-5 h-5 text-purple-400" />
                <span className="text-purple-400 font-medium">
                  You voted: {getVoteOptionLabel(userVoteOption || '')}
                </span>
              </div>
            </div>
          )}

          {/* Voting Interface */}
          {canVote && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Cast Your Vote</h3>
              <VoteButton
                proposalId={proposal.proposal_id || ''}
                userAddress={userAddress || ''}
                onVoteSuccess={onVoteSuccess}
              />
            </div>
          )}

          {/* Connect Wallet Prompt */}
          {!userAddress && isVotingPeriod && (
            <div className="p-6 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-center">
              <IoPerson className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-yellow-400 mb-2">
                Connect Wallet to Vote
              </h3>
              <p className="text-gray-400 text-sm">
                Please connect your Keplr, Leap, or Cosmostation wallet to participate in governance
              </p>
            </div>
          )}
        </div>

        {/* Scroll Hint Indicator */}
        {showScrollHint && (canVote || (!userAddress && isVotingPeriod)) && (
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-900 to-transparent pointer-events-none flex items-end justify-center pb-4">
            <div className="animate-bounce text-purple-400 text-sm font-medium flex items-center gap-2">
              <span>Scroll down to vote</span>
              <span className="text-2xl">↓</span>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }

        /* Custom scrollbar styles for webkit browsers */
        :global(.scrollbar-thin::-webkit-scrollbar) {
          width: 8px;
        }

        :global(.scrollbar-thin::-webkit-scrollbar-track) {
          background: #1f2937;
          border-radius: 4px;
        }

        :global(.scrollbar-thin::-webkit-scrollbar-thumb) {
          background: #9333ea;
          border-radius: 4px;
        }

        :global(.scrollbar-thin::-webkit-scrollbar-thumb:hover) {
          background: #a855f7;
        }
      `}</style>
    </div>
  );
}

