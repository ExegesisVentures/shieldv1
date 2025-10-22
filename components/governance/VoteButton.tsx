"use client";

import { useState } from "react";
import { IoCheckmarkCircle, IoCloseCircle, IoRemoveCircle, IoWarning } from "react-icons/io5";

interface VoteButtonProps {
  proposalId: string;
  userAddress: string;
  onVoteSuccess?: () => void;
  disabled?: boolean;
}

type VoteOption = 'VOTE_OPTION_YES' | 'VOTE_OPTION_NO' | 'VOTE_OPTION_ABSTAIN' | 'VOTE_OPTION_NO_WITH_VETO';

export default function VoteButton({ proposalId, userAddress, onVoteSuccess, disabled }: VoteButtonProps) {
  const [selectedOption, setSelectedOption] = useState<VoteOption | null>(null);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const voteOptions = [
    { value: 'VOTE_OPTION_YES', label: 'Yes', icon: IoCheckmarkCircle, color: 'green' },
    { value: 'VOTE_OPTION_NO', label: 'No', icon: IoCloseCircle, color: 'red' },
    { value: 'VOTE_OPTION_ABSTAIN', label: 'Abstain', icon: IoRemoveCircle, color: 'gray' },
    { value: 'VOTE_OPTION_NO_WITH_VETO', label: 'No with Veto', icon: IoWarning, color: 'orange' },
  ];

  const handleVote = async () => {
    if (!selectedOption || voting || disabled) return;

    setVoting(true);
    setError(null);
    setSuccess(false);

    try {
      // Check if Keplr is available
      if (!window.keplr) {
        throw new Error('Please install Keplr wallet to vote');
      }

      const chainId = 'coreum-mainnet-1';
      await window.keplr.enable(chainId);
      const offlineSigner = window.keplr.getOfflineSigner(chainId);
      
      // Send vote transaction
      const response = await fetch('/api/governance/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposalId,
          option: selectedOption,
          voterAddress: userAddress,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to submit vote');
      }

      setSuccess(true);
      setError(null);
      
      // Call success callback after 1 second
      setTimeout(() => {
        if (onVoteSuccess) {
          onVoteSuccess();
        }
      }, 1000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to vote';
      setError(errorMessage);
      console.error('Vote error:', err);
    } finally {
      setVoting(false);
    }
  };

  if (success) {
    return (
      <div className="p-6 bg-green-500/10 border border-green-500/30 rounded-xl">
        <div className="flex items-center gap-3">
          <IoCheckmarkCircle className="w-6 h-6 text-green-400" />
          <div>
            <div className="text-green-400 font-semibold">Vote Submitted!</div>
            <div className="text-sm text-gray-400">Your vote has been recorded on-chain</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Vote Options */}
      <div className="grid grid-cols-2 gap-3">
        {voteOptions.map(({ value, label, icon: Icon, color }) => (
          <button
            key={value}
            onClick={() => setSelectedOption(value as VoteOption)}
            disabled={voting || disabled}
            className={`p-4 rounded-xl border-2 transition-all duration-300 ${
              selectedOption === value
                ? `border-${color}-500 bg-${color}-500/10`
                : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
            } ${
              voting || disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Icon className={`w-5 h-5 ${
                selectedOption === value 
                  ? `text-${color}-400` 
                  : 'text-gray-400'
              }`} />
              <span className={`font-medium ${
                selectedOption === value 
                  ? `text-${color}-400` 
                  : 'text-gray-300'
              }`}>
                {label}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
          <div className="flex items-center gap-2 text-red-400 text-sm">
            <IoWarning className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={handleVote}
        disabled={!selectedOption || voting || disabled}
        className={`w-full py-4 px-6 rounded-xl font-semibold transition-all duration-300 ${
          !selectedOption || voting || disabled
            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:shadow-lg hover:shadow-purple-500/50 hover:scale-[1.02]'
        }`}
      >
        {voting ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            <span>Submitting Vote...</span>
          </div>
        ) : (
          'Submit Vote'
        )}
      </button>

      {!userAddress && (
        <div className="text-center text-sm text-gray-400">
          Please connect your wallet to vote
        </div>
      )}
    </div>
  );
}

