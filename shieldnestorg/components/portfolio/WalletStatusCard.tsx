"use client";

import { useState, useEffect } from "react";
import { IoCopy } from "react-icons/io5";
import { showToast } from "@/utils/address-utils";
import { getAllWallets } from "@/utils/wallet/simplified-operations";
import { keplrGetAddress } from "@/utils/wallet/keplr";

interface WalletStatusCardProps {
  walletCount: number;
  onRefresh?: number;
}

export default function WalletStatusCard({ walletCount, onRefresh }: WalletStatusCardProps) {
  const [primaryWallet, setPrimaryWallet] = useState<{ address: string; label?: string; provider?: string } | null>(null);

  // Load active wallet
  useEffect(() => {
    const loadActiveWallet = async () => {
      try {
        // First try to get the currently active Keplr wallet
        if (window.keplr) {
          try {
            const activeAddress = await keplrGetAddress();
            setPrimaryWallet({
              address: activeAddress,
              label: "Keplr",
              provider: "keplr"
            });
            return;
          } catch (keplrError) {
            console.log("Keplr not connected or available:", keplrError);
          }
        }
        
        // Fallback to first wallet in the list
        const wallets = await getAllWallets();
        if (wallets.length > 0) {
          setPrimaryWallet({
            address: wallets[0].address,
            label: wallets[0].label,
            provider: "manual"
          });
        } else {
          // No wallets found, clear the primary wallet
          setPrimaryWallet(null);
        }
      } catch (error) {
        console.error("Error loading active wallet:", error);
      }
    };

    loadActiveWallet();
  }, [onRefresh, walletCount]);

  const handleCopyAddress = async (address: string, label?: string) => {
    try {
      await navigator.clipboard.writeText(address);
      showToast(`${label || 'Wallet'} address copied!`, "success");
    } catch (error) {
      showToast("Failed to copy address", "error");
    }
  };

  if (!primaryWallet || walletCount === 0) {
    return null;
  }

  return (
    <div className="mb-4">
      <div className="flex items-center gap-3 bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900 dark:from-gray-700/50 dark:via-gray-750/50 dark:to-gray-800/50 rounded-2xl p-4 border border-gray-700 dark:border-gray-600 shadow-lg">
        <div className="flex items-center gap-3 flex-1">
          {/* Wallet Icon */}
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
            <span className="text-3xl">📁</span>
          </div>
          
          {/* Text Content */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-gray-400">
                Connected IoWallets
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-white">
                  {walletCount}
                </span>
                <span className="text-sm text-gray-300">
                  Click to view wallets
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Status Section */}
        <div className="flex items-center gap-3 pl-4 border-l border-gray-700 dark:border-gray-600">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-400">
              Status:
            </span>
            <span className="text-sm font-semibold text-green-400 capitalize">
              {primaryWallet.provider === 'keplr' ? 'Keplr' : 
               primaryWallet.provider === 'leap' ? 'Leap' : 
               primaryWallet.provider === 'cosmostation' ? 'Cosmostation' : 
               'Manual'} Connected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-300 font-mono">
              {primaryWallet.address.slice(-4)}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCopyAddress(primaryWallet.address, primaryWallet.label);
              }}
              className="p-1.5 hover:bg-gray-700 dark:hover:bg-gray-600 rounded transition-colors"
              title={`Copy ${primaryWallet.label || 'wallet'} address`}
            >
              <IoCopy className="w-4 h-4 text-gray-400 hover:text-gray-200" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

