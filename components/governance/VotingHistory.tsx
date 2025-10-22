"use client";

import { useEffect, useState } from "react";
import { IoCheckmark, IoClose, IoRemove, IoWarning } from "react-icons/io5";

interface VotingHistoryProps {
  userAddress: string;
}

interface Vote {
  proposal_id: string;
  voter: string;
  option: string;
  metadata?: string;
}

export default function VotingHistory({ userAddress }: VotingHistoryProps) {
  const [votes, setVotes] = useState<Vote[]>([]);
  const [loading, setLoading] = useState(true);
  const [votingPower, setVotingPower] = useState<string | null>(null);

  useEffect(() => {
    if (userAddress) {
      loadVotingHistory();
    }
  }, [userAddress]);

  const loadVotingHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/governance/votes/${userAddress}?votingPower=true`
      );
      const data = await response.json();

      if (data.success) {
        setVotes(data.data.votes || []);
        setVotingPower(data.data.votingPower);
      }
    } catch (error) {
      console.error('Failed to load voting history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getVoteIcon = (option: string) => {
    switch (option) {
      case 'VOTE_OPTION_YES':
        return <IoCheckmark className="w-5 h-5 text-green-400" />;
      case 'VOTE_OPTION_NO':
        return <IoClose className="w-5 h-5 text-red-400" />;
      case 'VOTE_OPTION_ABSTAIN':
        return <IoRemove className="w-5 h-5 text-gray-400" />;
      case 'VOTE_OPTION_NO_WITH_VETO':
        return <IoWarning className="w-5 h-5 text-orange-400" />;
      default:
        return null;
    }
  };

  const getVoteColor = (option: string) => {
    switch (option) {
      case 'VOTE_OPTION_YES':
        return 'bg-green-500/10 border-green-500/30 text-green-400';
      case 'VOTE_OPTION_NO':
        return 'bg-red-500/10 border-red-500/30 text-red-400';
      case 'VOTE_OPTION_ABSTAIN':
        return 'bg-gray-500/10 border-gray-500/30 text-gray-400';
      case 'VOTE_OPTION_NO_WITH_VETO':
        return 'bg-orange-500/10 border-orange-500/30 text-orange-400';
      default:
        return 'bg-gray-500/10 border-gray-500/30 text-gray-400';
    }
  };

  const getVoteLabel = (option: string) => {
    return option
      .replace('VOTE_OPTION_', '')
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const formatVotingPower = (power: string) => {
    const powerNum = parseFloat(power) / 1_000_000; // Convert ucore to CORE
    return powerNum.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  if (loading) {
    return (
      <div className="card-coreum p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-700 rounded w-1/3"></div>
          <div className="h-20 bg-gray-700 rounded"></div>
          <div className="h-20 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="card-coreum p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Your Voting History</h2>
        {votingPower && (
          <div className="px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-lg">
            <div className="text-xs text-gray-400 mb-1">Voting Power</div>
            <div className="text-lg font-bold text-purple-400">
              {formatVotingPower(votingPower)} CORE
            </div>
          </div>
        )}
      </div>

      {votes.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-2">No voting history yet</div>
          <div className="text-sm text-gray-600">
            Your votes will appear here once you participate in governance
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {votes.map((vote) => (
            <div
              key={`${vote.proposal_id}-${vote.voter}`}
              className="p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono text-gray-500">
                    Proposal #{vote.proposal_id}
                  </span>
                  <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${getVoteColor(vote.option)}`}>
                    {getVoteIcon(vote.option)}
                    {getVoteLabel(vote.option)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

