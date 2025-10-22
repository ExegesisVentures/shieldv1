"use client";

import { useState } from "react";
import { IoClose, IoCheckmarkCircle, IoWarning, IoAdd, IoInformationCircle } from "react-icons/io5";
import { submitProposal } from "@/utils/coreum/governance";

interface CreateProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  userAddress?: string | null;
  onSuccess?: () => void;
}

export default function CreateProposalModal({
  isOpen,
  onClose,
  userAddress,
  onSuccess,
}: CreateProposalModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [initialDeposit, setInitialDeposit] = useState("10000"); // Default 10,000 CORE
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const minDeposit = 10000; // Minimum deposit in CORE
  const depositInUcore = parseFloat(initialDeposit || "0") * 1_000_000; // Convert to ucore

  const handleSubmit = async () => {
    if (!title || !description || !initialDeposit || !userAddress) {
      setError("Please fill in all fields");
      return;
    }

    if (parseFloat(initialDeposit) < minDeposit) {
      setError(`Minimum deposit is ${minDeposit.toLocaleString()} CORE`);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Check for Keplr wallet
      if (!window.keplr && !window.leap && !window.cosmostation) {
        throw new Error("Please install Keplr, Leap, or Cosmostation wallet");
      }

      const chainId = "coreum-mainnet-1";
      
      // Try each wallet in order
      let signer;
      if (window.keplr) {
        await window.keplr.enable(chainId);
        signer = window.keplr.getOfflineSigner(chainId);
      } else if (window.leap) {
        await window.leap.enable(chainId);
        signer = window.leap.getOfflineSigner(chainId);
      } else if (window.cosmostation) {
        await window.cosmostation.providers.keplr.enable(chainId);
        signer = window.cosmostation.providers.keplr.getOfflineSigner(chainId);
      } else {
        throw new Error("No supported wallet found");
      }

      // Submit proposal
      const result = await submitProposal({
        title,
        description,
        proposer: userAddress,
        initialDeposit: depositInUcore.toString(),
        signer,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to submit proposal");
      }

      setSuccess(true);
      setTxHash(result.transactionHash || null);
      setError(null);

      // Call success callback and close after 3 seconds
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
        handleClose();
      }, 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to submit proposal";
      setError(errorMessage);
      console.error("Proposal submission error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setTitle("");
      setDescription("");
      setInitialDeposit("10000");
      setError(null);
      setSuccess(false);
      setTxHash(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleClose}
      ></div>

      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto card-coreum animate-fade-in">
        <div className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">
                Create Governance Proposal
              </h2>
              <p className="text-sm text-gray-400">
                Submit a new proposal to the Coreum governance
              </p>
            </div>
            <button
              onClick={handleClose}
              disabled={submitting}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
            >
              <IoClose className="w-6 h-6 text-gray-400" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {success ? (
            // Success State
            <div className="p-8 bg-green-500/10 border border-green-500/30 rounded-xl text-center">
              <IoCheckmarkCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-green-400 mb-2">
                Proposal Submitted!
              </h3>
              <p className="text-gray-300 mb-4">
                Your proposal has been submitted successfully.
              </p>
              {txHash && (
                <div className="p-3 bg-gray-800/50 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Transaction Hash:</p>
                  <p className="text-sm font-mono text-purple-400 break-all">{txHash}</p>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Info Alert */}
              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div className="flex items-start gap-3">
                  <IoInformationCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-300">
                    <p className="font-medium text-blue-400 mb-1">Before you submit:</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-400">
                      <li>Minimum deposit: {minDeposit.toLocaleString()} CORE</li>
                      <li>Your proposal will enter a deposit period first</li>
                      <li>Once minimum deposit is reached, voting begins</li>
                      <li>Make sure your title and description are clear and detailed</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Proposal Title */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Proposal Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Increase Block Size Limit"
                  disabled={submitting}
                  maxLength={140}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors disabled:opacity-50"
                />
                <p className="text-xs text-gray-500 mt-1">{title.length}/140 characters</p>
              </div>

              {/* Proposal Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide a detailed description of your proposal..."
                  disabled={submitting}
                  rows={10}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors disabled:opacity-50 resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">{description.length} characters</p>
              </div>

              {/* Initial Deposit */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Initial Deposit (CORE) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  value={initialDeposit}
                  onChange={(e) => setInitialDeposit(e.target.value)}
                  placeholder={minDeposit.toString()}
                  min={minDeposit}
                  step="1000"
                  disabled={submitting}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors disabled:opacity-50"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Minimum: {minDeposit.toLocaleString()} CORE
                  {parseFloat(initialDeposit || "0") >= minDeposit && (
                    <span className="text-green-400 ml-2">✓ Valid amount</span>
                  )}
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <div className="flex items-center gap-2 text-red-400">
                    <IoWarning className="w-5 h-5" />
                    <span className="text-sm">{error}</span>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={!title || !description || !initialDeposit || !userAddress || submitting || parseFloat(initialDeposit) < minDeposit}
                className={`w-full py-4 px-6 rounded-xl font-semibold transition-all duration-300 ${
                  !title || !description || !initialDeposit || !userAddress || submitting || parseFloat(initialDeposit) < minDeposit
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:shadow-lg hover:shadow-purple-500/50 hover:scale-[1.02]'
                }`}
              >
                {submitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Submitting Proposal...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <IoAdd className="w-5 h-5" />
                    <span>Submit Proposal</span>
                  </div>
                )}
              </button>

              {!userAddress && (
                <div className="text-center text-sm text-gray-400">
                  Please connect your wallet to submit a proposal
                </div>
              )}
            </>
          )}
        </div>
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
      `}</style>
    </div>
  );
}

