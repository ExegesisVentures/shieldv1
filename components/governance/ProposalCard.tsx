"use client";

import { useState, useEffect } from "react";
import { IoCheckmarkCircle, IoCloseCircle, IoTimeOutline, IoTrendingUp, IoCheckmark } from "react-icons/io5";
import { EnrichedProposal } from "@/types/governance";

interface ProposalCardProps {
  proposal: EnrichedProposal;
  userAddress?: string | null;
  onClick?: () => void;
}

export default function ProposalCard({ proposal, userAddress, onClick }: ProposalCardProps) {
  const [userVoted, setUserVoted] = useState(false);
  const [userVoteOption, setUserVoteOption] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userAddress && proposal.proposal_id) {
      checkUserVote();
    }
  }, [userAddress, proposal.proposal_id]);

  const checkUserVote = async () => {
    if (!userAddress) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `/api/governance/votes/${userAddress}?proposalId=${proposal.proposal_id}`
      );
      const data = await response.json();
      
      if (data.success && data.data.hasVoted) {
        setUserVoted(true);
        setUserVoteOption(data.data.vote?.option || null);
      }
    } catch (error) {
      console.error('Failed to check user vote:', error);
    } finally {
      setLoading(false);
    }
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
      case 'PROPOSAL_STATUS_DEPOSIT_PERIOD':
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      default:
        return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PROPOSAL_STATUS_VOTING_PERIOD':
        return <IoTrendingUp className="w-4 h-4" />;
      case 'PROPOSAL_STATUS_PASSED':
        return <IoCheckmarkCircle className="w-4 h-4" />;
      case 'PROPOSAL_STATUS_REJECTED':
      case 'PROPOSAL_STATUS_FAILED':
        return <IoCloseCircle className="w-4 h-4" />;
      default:
        return <IoTimeOutline className="w-4 h-4" />;
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

  const yesPercentage = proposal.yesPercentage || 0;
  const noPercentage = proposal.noPercentage || 0;
  const abstainPercentage = proposal.abstainPercentage || 0;
  const vetoPercentage = proposal.vetoPercentage || 0;

  const isActive = proposal.status === 'PROPOSAL_STATUS_VOTING_PERIOD';

  return (
    <div
      onClick={onClick}
      className="card-coreum p-6 hover:scale-[1.02] transition-all duration-300 cursor-pointer group relative overflow-hidden"
    >
      {/* Animated background gradient on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/0 via-purple-600/5 to-purple-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm font-mono text-gray-500">
                #{proposal.proposal_id}
              </span>
              <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(proposal.status)}`}>
                {getStatusIcon(proposal.status)}
                {getStatusLabel(proposal.status)}
              </span>
              {userVoted && (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border bg-purple-500/10 border-purple-500/30 text-purple-400">
                  <IoCheckmark className="w-3 h-3" />
                  You Voted: {getVoteOptionLabel(userVoteOption || '')}
                </span>
              )}
            </div>
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">
              {proposal.content?.title || 'Untitled Proposal'}
            </h3>
            <p className="text-gray-400 text-sm line-clamp-2">
              {proposal.content?.description || 'No description available'}
            </p>
          </div>
        </div>

        {/* Vote Tally (if voting period or completed) */}
        {(isActive || proposal.status === 'PROPOSAL_STATUS_PASSED' || proposal.status === 'PROPOSAL_STATUS_REJECTED') && (
          <div className="space-y-2">
            {/* Yes */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-400">
                <span>Yes</span>
                <span className="font-medium text-green-400">{yesPercentage.toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-1000 ease-out"
                  style={{ width: `${yesPercentage}%` }}
                ></div>
              </div>
            </div>

            {/* No */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-400">
                <span>No</span>
                <span className="font-medium text-red-400">{noPercentage.toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-500 to-red-400 transition-all duration-1000 ease-out"
                  style={{ width: `${noPercentage}%` }}
                ></div>
              </div>
            </div>

            {/* Abstain & Veto */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Abstain</span>
                  <span className="font-medium text-gray-400">{abstainPercentage.toFixed(1)}%</span>
                </div>
                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-gray-500 to-gray-400 transition-all duration-1000 ease-out"
                    style={{ width: `${abstainPercentage}%` }}
                  ></div>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Veto</span>
                  <span className="font-medium text-orange-400">{vetoPercentage.toFixed(1)}%</span>
                </div>
                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-1000 ease-out"
                    style={{ width: `${vetoPercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Time Remaining (for active proposals) */}
        {isActive && proposal.timeRemaining && (
          <div className="mt-4 flex items-center gap-2 text-sm">
            <IoTimeOutline className="w-4 h-4 text-blue-400" />
            <span className="text-gray-400">
              <span className="text-blue-400 font-medium">{proposal.timeRemaining}</span> remaining
            </span>
          </div>
        )}

        {/* Click to view details */}
        <div className="mt-4 text-xs text-gray-500 group-hover:text-purple-400 transition-colors">
          Click to view details and vote →
        </div>
      </div>
    </div>
  );
}

