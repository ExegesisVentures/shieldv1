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

  const getVoteOptionColor = (option: string) => {
    if (option.includes('YES')) {
      return {
        border: 'border-green-500/50',
        bg: 'bg-green-500/10',
        text: 'text-green-400',
        cardBorder: 'border-green-500'
      };
    }
    if (option.includes('NO_WITH_VETO')) {
      return {
        border: 'border-orange-500/50',
        bg: 'bg-orange-500/10',
        text: 'text-orange-400',
        cardBorder: 'border-orange-500'
      };
    }
    if (option.includes('NO')) {
      return {
        border: 'border-red-500/50',
        bg: 'bg-red-500/10',
        text: 'text-red-400',
        cardBorder: 'border-red-500'
      };
    }
    if (option.includes('ABSTAIN')) {
      return {
        border: 'border-gray-500/50',
        bg: 'bg-gray-500/10',
        text: 'text-gray-400',
        cardBorder: 'border-gray-500'
      };
    }
    return {
      border: 'border-purple-500/50',
      bg: 'bg-purple-500/10',
      text: 'text-purple-400',
      cardBorder: 'border-purple-500'
    };
  };

  const voteColors = userVoted && userVoteOption ? getVoteOptionColor(userVoteOption) : null;

  const yesPercentage = proposal.yesPercentage || 0;
  const noPercentage = proposal.noPercentage || 0;
  const abstainPercentage = proposal.abstainPercentage || 0;
  const vetoPercentage = proposal.vetoPercentage || 0;

  const isActive = proposal.status === 'PROPOSAL_STATUS_VOTING_PERIOD';

  return (
    <div
      onClick={onClick}
      className={`card-coreum p-6 hover:scale-[1.02] transition-all duration-300 cursor-pointer group relative overflow-hidden ${
        voteColors ? `border-2 ${voteColors.cardBorder}/40` : ''
      }`}
    >
      {/* Animated background gradient on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/0 via-purple-600/5 to-purple-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span className="text-sm font-mono text-gray-500">
                #{proposal.proposal_id}
              </span>
              <div className="flex items-center gap-2">
                <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(proposal.status)}`}>
                  {getStatusIcon(proposal.status)}
                  {getStatusLabel(proposal.status)}
                </span>
                {/* Time Remaining (moved next to status) */}
                {isActive && proposal.timeRemaining && (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border border-blue-500/30 bg-blue-500/10 text-blue-400">
                    <IoTimeOutline className="w-3 h-3" />
                    {proposal.timeRemaining}
                  </span>
                )}
              </div>
            </div>
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">
              {proposal.content?.title || 'Untitled Proposal'}
            </h3>
            <p className="text-gray-400 text-sm line-clamp-2">
              {proposal.content?.description || 'No description available'}
            </p>
          </div>
          
          {/* You Voted Badge - Moved to right side */}
          {userVoted && voteColors && (
            <div className="flex-shrink-0">
              <div className={`flex flex-col items-center gap-2 px-4 py-3 rounded-lg border-2 ${voteColors.border} ${voteColors.bg}`}>
                <IoCheckmark className={`w-6 h-6 ${voteColors.text}`} />
                <div className="text-center">
                  <div className={`text-xs font-semibold ${voteColors.text}`}>You Voted</div>
                  <div className={`text-sm font-bold ${voteColors.text}`}>
                    {getVoteOptionLabel(userVoteOption || '')}
                  </div>
                </div>
              </div>
            </div>
          )}
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

        {/* Click to view details */}
        <div className="mt-4 text-sm font-medium text-gray-400 group-hover:text-purple-400 transition-colors">
          Click to view details and vote →
        </div>
      </div>
    </div>
  );
}

