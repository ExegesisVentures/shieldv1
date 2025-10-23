"use client";

import { IoClose, IoHardwareChip, IoCheckmarkCircle, IoTime, IoWarning } from "react-icons/io5";

interface LedgerInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Ledger Info Modal
 * Provides users with instructions and tips for using Ledger hardware wallets
 * 
 * File: /components/modals/LedgerInfoModal.tsx
 */
export default function LedgerInfoModal({ isOpen, onClose }: LedgerInfoModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-purple-500/30 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-b border-purple-500/30 p-6 flex items-center justify-between backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <IoHardwareChip className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Using Ledger with ShieldNest</h2>
              <p className="text-sm text-gray-400">Hardware wallet setup guide</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700/50 rounded-lg transition-all"
          >
            <IoClose className="w-6 h-6 text-gray-400 hover:text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Before You Sign */}
          <div className="p-5 bg-blue-500/10 border border-blue-500/30 rounded-xl">
            <div className="flex items-start gap-3">
              <IoCheckmarkCircle className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-blue-400 mb-2">Before You Sign</h3>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>Connect your Ledger device via USB</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>Unlock your Ledger (enter PIN)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>Open the <strong>Coreum app</strong> on your Ledger</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span><em>(If Coreum app is not available, use the <strong>Cosmos app</strong>)</em></span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Signing Process */}
          <div className="p-5 bg-purple-500/10 border border-purple-500/30 rounded-xl">
            <div className="flex items-start gap-3">
              <IoTime className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-purple-400 mb-2">Signing Process</h3>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">1.</span>
                    <span>When you click "Submit Vote" or any transaction button, your Ledger will display the transaction details</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">2.</span>
                    <span>Review the transaction carefully on your Ledger screen</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">3.</span>
                    <span>Use the buttons on your Ledger to navigate through the transaction details</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">4.</span>
                    <span>Press both buttons together to <strong>approve</strong>, or the right button to <strong>reject</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">5.</span>
                    <span>Wait for the transaction to be broadcast (usually takes 5-10 seconds)</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Common Issues */}
          <div className="p-5 bg-orange-500/10 border border-orange-500/30 rounded-xl">
            <div className="flex items-start gap-3">
              <IoWarning className="w-6 h-6 text-orange-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-orange-400 mb-2">Troubleshooting</h3>
                <div className="space-y-3 text-gray-300">
                  <div>
                    <p className="font-semibold text-orange-300">❌ "Ledger device not found"</p>
                    <p className="text-sm ml-4">→ Ensure Ledger is connected, unlocked, and the Coreum/Cosmos app is open</p>
                  </div>
                  <div>
                    <p className="font-semibold text-orange-300">❌ "Transaction timeout"</p>
                    <p className="text-sm ml-4">→ You took too long to approve. Click the button again and approve faster</p>
                  </div>
                  <div>
                    <p className="font-semibold text-orange-300">❌ "Transaction rejected"</p>
                    <p className="text-sm ml-4">→ You pressed reject on your Ledger. Try again and approve the transaction</p>
                  </div>
                  <div>
                    <p className="font-semibold text-orange-300">❌ "Ledger is locked"</p>
                    <p className="text-sm ml-4">→ Enter your PIN to unlock your Ledger device</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="p-5 bg-gray-700/30 border border-gray-600/30 rounded-xl">
            <h3 className="text-lg font-semibold text-gray-200 mb-2">Advanced Settings (Optional)</h3>
            <p className="text-sm text-gray-400 mb-3">
              If you're experiencing issues, you may need to enable these settings in your Cosmos app on Ledger:
            </p>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-gray-400">•</span>
                <span><strong>Contract data:</strong> ON (for complex transactions)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-400">•</span>
                <span><strong>Expert mode:</strong> ON (if needed for detailed review)</span>
              </li>
            </ul>
          </div>

          {/* Security Note */}
          <div className="p-5 bg-green-500/10 border border-green-500/30 rounded-xl">
            <div className="flex items-start gap-3">
              <IoCheckmarkCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-green-400 mb-2">Security First</h3>
                <p className="text-gray-300">
                  Your Ledger device keeps your private keys secure. Always review transaction details on your 
                  Ledger screen before approving. Never approve a transaction you don't understand or didn't initiate.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gradient-to-t from-gray-900 to-transparent p-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}

