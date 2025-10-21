"use client";

import { ReactNode } from "react";
import { IoLockClosed, IoShieldCheckmark } from "react-icons/io5";

interface PremiumFeatureGateProps {
  isVerified: boolean;
  walletAddress: string;
  featureName: string;
  children: ReactNode;
  onVerify?: () => void;
}

/**
 * Premium Feature Gate
 * 
 * Wraps premium features that require wallet verification.
 * If wallet is verified, shows the feature.
 * If wallet is unverified, shows a prompt to verify.
 * 
 * Usage:
 * <PremiumFeatureGate isVerified={wallet.ownership_verified} walletAddress={wallet.address} featureName="Private Notes">
 *   <PrivateNotesComponent />
 * </PremiumFeatureGate>
 */
export default function PremiumFeatureGate({
  isVerified,
  walletAddress,
  featureName,
  children,
  onVerify,
}: PremiumFeatureGateProps) {
  // If verified, show the feature
  if (isVerified) {
    return <>{children}</>;
  }

  // If not verified, show upgrade prompt
  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-2 border-purple-200 dark:border-purple-800 rounded-xl p-6">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-purple-100 dark:bg-purple-900/40 rounded-lg">
          <IoLockClosed className="w-6 h-6 text-purple-600 dark:text-purple-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            Premium Feature: {featureName}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Verify ownership of this wallet to unlock {featureName.toLowerCase()} and other premium features.
          </p>
          
          {/* Premium features list */}
          <div className="mb-4 space-y-2">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              Unlock with verification:
            </p>
            <ul className="space-y-1.5">
              <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <IoShieldCheckmark className="w-4 h-4 text-green-600 dark:text-green-400" />
                Encrypted private notes
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <IoShieldCheckmark className="w-4 h-4 text-green-600 dark:text-green-400" />
                Private portfolio sharing
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <IoShieldCheckmark className="w-4 h-4 text-green-600 dark:text-green-400" />
                Advanced analytics
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <IoShieldCheckmark className="w-4 h-4 text-green-600 dark:text-green-400" />
                Transaction exports
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <IoShieldCheckmark className="w-4 h-4 text-green-600 dark:text-green-400" />
                Custom encrypted labels
              </li>
            </ul>
          </div>

          {/* Verify button */}
          {onVerify && (
            <button
              onClick={onVerify}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <IoShieldCheckmark className="w-5 h-5" />
              Verify Wallet Ownership
            </button>
          )}

          {/* Info text */}
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-3">
            💡 Verification requires a one-time signature from your wallet. Your private keys never leave your device.
          </p>
        </div>
      </div>
    </div>
  );
}

