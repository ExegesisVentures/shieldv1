"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { IoClose } from "react-icons/io5";
import WalletButton from "./WalletButton";
import ManualAddressInput from "./ManualAddressInput";
import AccountFoundModal from "../modals/AccountFoundModal";
import MiniSignInPrompt from "../modals/MiniSignInPrompt";
import WelcomeBackOverlay from "../modals/WelcomeBackOverlay";
import { useSimplifiedWalletConnect } from "@/hooks/useSimplifiedWalletConnect";

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function WalletConnectModal({
  isOpen,
  onClose,
  onSuccess,
}: WalletConnectModalProps) {
  const { 
    connectKeplr, 
    connectLeap, 
    connectCosmostation, 
    addManualAddress, 
    connecting, 
    provider,
    showAccountFoundModal,
    showMiniPrompt,
    accountFoundData,
    closeAccountFoundModal,
    closeMiniPrompt,
    signInToAccount,
    viewThisWalletOnly,
    showWelcomeOverlay,
    welcomeEmail,
  } = useSimplifiedWalletConnect();
  const [error, setError] = useState<string | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Listen for wallet connected as guest event to close this modal
  useEffect(() => {
    const handleGuestConnection = () => {
      console.log("🎉 Guest wallet connected, closing connect modal");
      onClose();
    };
    
    window.addEventListener('walletConnectedAsGuest', handleGuestConnection);
    return () => window.removeEventListener('walletConnectedAsGuest', handleGuestConnection);
  }, [onClose]);

  if (!isOpen || !mounted) return null;

  console.log("WalletConnectModal rendered, showManual:", showManual);

  const handleConnect = async (walletProvider: "keplr" | "leap" | "cosmostation") => {
    setError(null);
    console.log(`=== WALLET CONNECT MODAL ===`);
    console.log(`🔄 Connecting ${walletProvider} wallet...`);
    
    try {
      let result;
      switch (walletProvider) {
        case "keplr":
          result = await connectKeplr();
          break;
        case "leap":
          result = await connectLeap();
          break;
        case "cosmostation":
          result = await connectCosmostation();
          break;
        default:
          throw new Error(`Unknown wallet provider: ${walletProvider}`);
      }
      
      console.log(`📋 ${walletProvider} connection result:`, result);

      if (result.success) {
        console.log(`✅ ${walletProvider} connection successful!`);
        
        // Check if AccountFoundModal is being shown (via return flag)
        if (result.showingModal) {
          console.log("🔍 Account found modal is showing, keeping connect modal open...");
          // Don't close - modal will close after user makes a choice in AccountFoundModal
          return;
        }
        
        console.log("Calling onSuccess callback...");
        onSuccess?.();
        console.log("Closing modal...");
        onClose();
        console.log("Modal close initiated");
      } else if (result.error) {
        console.error(`❌ ${walletProvider} connection failed:`, result.error);
        setError(result.error.hint || result.error.message);
      }
    } catch (error) {
      console.error(`💥 ${walletProvider} connection error:`, error);
      setError(`Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleManualAdd = async (address: string, label?: string) => {
    setError(null);
    const result = await addManualAddress(address, label);

    if (result.success) {
      onSuccess?.();
      onClose(); // Close the modal on success
    } else if (result.error) {
      setError(result.error.hint || result.error.message);
    }
  };

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[10000] p-4 overflow-y-auto"
      style={{ userSelect: 'text' }}
    >
      <div 
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6 relative my-auto border border-gray-200 dark:border-gray-700"
        style={{ userSelect: 'text' }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={connecting}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <IoClose className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">
            {showManual ? "Add Address" : "Connect Wallet"}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {showManual
              ? "Enter a Coreum address to track"
              : "Choose your preferred wallet to connect"}
          </p>
          {!showManual && (
            <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-green-800 dark:text-green-200 text-xs">
                <strong>Easy Setup:</strong> Connect your wallet instantly to view your portfolio. 
                No sign-up required! You can optionally create an account later to save your wallets permanently.
              </p>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
          </div>
        )}

        {/* Content */}
        {showManual ? (
          <div className="space-y-4">
            <ManualAddressInput onAdd={handleManualAdd} />
            <button
              onClick={() => setShowManual(false)}
              disabled={connecting}
              className="w-full text-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            >
              ← Back to wallet connect
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Wallet Buttons */}
            <WalletButton
              provider="keplr"
              onClick={() => handleConnect("keplr")}
              connecting={connecting && provider === "keplr"}
              disabled={connecting && provider !== "keplr"}
            />
            <WalletButton
              provider="leap"
              onClick={() => handleConnect("leap")}
              connecting={connecting && provider === "leap"}
              disabled={connecting && provider !== "leap"}
            />
            <WalletButton
              provider="cosmostation"
              onClick={() => handleConnect("cosmostation")}
              connecting={connecting && provider === "cosmostation"}
              disabled={connecting && provider !== "cosmostation"}
            />

            {/* Divider */}
            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white dark:bg-gray-900 text-gray-500">
                  Or
                </span>
              </div>
            </div>

            {/* Manual Address Button */}
            <button
              onClick={() => setShowManual(true)}
              disabled={connecting}
              className="w-full px-6 py-3 border-2 border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 rounded-xl font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Enter Address Manually
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {isOpen && createPortal(modalContent, document.body)}
      {showAccountFoundModal && accountFoundData && (
        <AccountFoundModal
          isOpen={showAccountFoundModal}
          onClose={closeAccountFoundModal}
          onSignIn={signInToAccount}
          onViewWalletOnly={viewThisWalletOnly}
          userEmail={accountFoundData.userEmail}
          walletAddress={accountFoundData.walletAddress}
        />
      )}
      {showMiniPrompt && accountFoundData && (
        <MiniSignInPrompt
          userEmail={accountFoundData.userEmail}
          onClose={closeMiniPrompt}
        />
      )}
      <WelcomeBackOverlay
        isOpen={showWelcomeOverlay}
        userEmail={welcomeEmail}
      />
    </>
  );
}

