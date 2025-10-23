"use client";

import { useState } from "react";
import { IoCheckmarkCircle, IoCloseCircle, IoRemoveCircle, IoWarning, IoWallet } from "react-icons/io5";
import { voteOnProposal } from "@/utils/coreum/proposals";
import { VoteOption } from "@/types/governance";

interface VoteButtonProps {
  proposalId: string;
  userAddress: string;
  onVoteSuccess?: () => void;
  disabled?: boolean;
  onConnectWallet?: () => void; // Callback to trigger wallet connection
}

export default function VoteButton({ proposalId, userAddress, onVoteSuccess, disabled, onConnectWallet }: VoteButtonProps) {
  const [selectedOption, setSelectedOption] = useState<VoteOption | null>(null);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showWalletPrompt, setShowWalletPrompt] = useState(false);

  const voteOptions = [
    { value: VoteOption.YES, label: 'Yes', icon: IoCheckmarkCircle, color: 'green' },
    { value: VoteOption.NO, label: 'No', icon: IoCloseCircle, color: 'red' },
    { value: VoteOption.ABSTAIN, label: 'Abstain', icon: IoRemoveCircle, color: 'gray' },
    { value: VoteOption.NO_WITH_VETO, label: 'No with Veto', icon: IoWarning, color: 'orange' },
  ];

  const handleVoteAttempt = async () => {
    if (!selectedOption || voting || disabled) return;

    // Check if Keplr is available
    if (!window.keplr) {
      setError('Please install Keplr wallet extension to vote');
      return;
    }

    await submitVote();
  };

  const submitVote = async () => {
    if (!selectedOption) return;

    setVoting(true);
    setError(null);
    setSuccess(false);

    try {
      console.log('🗳️ [Vote] Starting vote submission...');
      
      const chainId = 'coreum-mainnet-1';
      
      // Enable Keplr and get signer
      await window.keplr.enable(chainId);
      const offlineSigner = await window.keplr.getOfflineSigner(chainId);
      
      // Get accounts to get the voter address
      const accounts = await offlineSigner.getAccounts();
      if (!accounts || accounts.length === 0) {
        throw new Error('No wallet accounts found');
      }
      
      const voterAddress = accounts[0].address;
      console.log('🗳️ [Vote] Voter address:', voterAddress);
      console.log('🗳️ [Vote] Proposal ID:', proposalId);
      console.log('🗳️ [Vote] Option:', selectedOption);
      
      // Use the governance utility to submit vote directly
      const result = await voteOnProposal(
        {
          proposalId,
          voter: voterAddress,
          option: selectedOption,
        },
        offlineSigner
      );

      console.log('🗳️ [Vote] Result:', result);

      if (!result.success) {
        throw new Error(result.error || 'Failed to submit vote');
      }

      console.log('✅ [Vote] Vote submitted successfully!', result.transactionHash);
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
      console.error('❌ [Vote] Error:', err);
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
            onClick={() => setSelectedOption(value)}
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
        onClick={handleVoteAttempt}
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

      <div className="text-center text-xs text-gray-400">
        Voting requires Keplr, Leap, or Cosmostation wallet
      </div>
    </div>
  );
}

