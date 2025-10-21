"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { IoClose, IoMail, IoWallet as WalletIcon } from "react-icons/io5";
import { signInModalAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormStatus } from "react-dom";
import WalletButton from "@/components/wallet/WalletButton";
import ManualAddressInput from "@/components/wallet/ManualAddressInput";
import { useWalletConnect } from "@/hooks/useWalletConnect";

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type TabType = "email" | "wallet";

function EmailSignInButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Signing in..." : "Sign In"}
    </Button>
  );
}

export default function SignInModal({
  isOpen,
  onClose,
  onSuccess,
}: SignInModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("wallet");
  const [message, setMessage] = useState<Message | null>(null);
  const { connectWallet, addManualAddress, connecting, provider } = useWalletConnect();
  const [walletError, setWalletError] = useState<string | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!isOpen || !mounted) return null;

  // Simple wallet connection (no signature required)
  const handleWalletConnect = async (walletProvider: "keplr" | "leap" | "cosmostation") => {
    setWalletError(null);
    const result = await connectWallet(walletProvider);

    if (result.success) {
      onSuccess?.();
      onClose();
    } else if (result.error) {
      setWalletError(result.error.hint || result.error.message);
    }
  };

  const handleManualAdd = async (address: string, label?: string) => {
    setWalletError(null);
    const result = await addManualAddress(address, label);

    if (result.success) {
      onSuccess?.();
      setShowManual(false);
      onClose();
    } else if (result.error) {
      setWalletError(result.error.hint || result.error.message);
    }
  };

  const handleEmailSubmit = async (formData: FormData) => {
    const result = await signInModalAction(formData);
    
    if (result.error) {
      setMessage({ error: result.error });
    } else {
      // Success - close modal and trigger success callback
      onSuccess?.();
      onClose();
    }
  };

  const modalContent = (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 overflow-y-auto"
      style={{ isolation: 'isolate' }}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full relative my-auto border border-gray-200 dark:border-gray-700">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={connecting}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors z-10"
        >
          <IoClose className="w-5 h-5" />
        </button>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => {
              setActiveTab("wallet");
              setMessage(null);
              setWalletError(null);
              setShowManual(false);
            }}
            className={`flex-1 px-6 py-4 font-semibold transition-colors ${
              activeTab === "wallet"
                ? "text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <WalletIcon className="w-4 h-4 inline-block mr-2" />
            Connect Wallet
          </button>
          <button
            onClick={() => {
              setActiveTab("email");
              setMessage(null);
              setWalletError(null);
            }}
            className={`flex-1 px-6 py-4 font-semibold transition-colors ${
              activeTab === "email"
                ? "text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <IoMail className="w-4 h-4 inline-block mr-2" />
            Email / Password
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === "wallet" ? (
            /* Wallet Connection Tab - Simple, no signature */
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">
                  {showManual ? "Add Address" : "Connect Your Wallet"}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {showManual
                    ? "Enter a Coreum address to track your portfolio"
                    : "Connect your wallet to view and track your Coreum portfolio"}
                </p>
              </div>

              {/* Error Display */}
              {walletError && (
                <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-800 dark:text-red-200 text-sm">{walletError}</p>
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
                  {/* Info Banner */}
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-blue-900 dark:text-blue-200 text-xs">
                      💡 Just approve the Coreum chain connection. No signature required to view your portfolio!
                    </p>
                  </div>

                  {/* Wallet Buttons */}
                  <WalletButton
                    provider="keplr"
                    onClick={() => handleWalletConnect("keplr")}
                    connecting={connecting && provider === "keplr"}
                    disabled={connecting && provider !== "keplr"}
                  />
                  <WalletButton
                    provider="leap"
                    onClick={() => handleWalletConnect("leap")}
                    connecting={connecting && provider === "leap"}
                    disabled={connecting && provider !== "leap"}
                  />
                  <WalletButton
                    provider="cosmostation"
                    onClick={() => handleWalletConnect("cosmostation")}
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
          ) : (
            /* Email/Password Tab */
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">Sign In with Email</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Enter your email and password to continue
                </p>
              </div>

              {message && (
                <div className="mb-4">
                  <FormMessage message={message} />
                </div>
              )}

              <form action={handleEmailSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                  />
                </div>
                <EmailSignInButton />
              </form>

              <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
                  Don&apos;t have an account?{" "}
                <a
                  href="/sign-up"
                  className="text-purple-600 dark:text-purple-400 hover:underline font-semibold"
                >
                  Sign up
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

