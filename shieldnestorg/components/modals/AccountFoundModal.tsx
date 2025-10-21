"use client";

import { useState, useEffect } from "react";
import { IoClose, IoPerson, IoArrowForward, IoAddCircle } from "react-icons/io5";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/utils/supabase/client";
import { showToast } from "@/utils/address-utils";
import type { User } from "@supabase/supabase-js";

interface AccountFoundModalProps {
  isOpen: boolean;
  userEmail: string | null;
  walletAddress: string;
  onSignIn: () => void;
  onViewWalletOnly: () => void;
  onClose: () => void;
}

export default function AccountFoundModal({
  isOpen,
  userEmail,
  walletAddress,
  onSignIn,
  onViewWalletOnly,
  onClose,
}: AccountFoundModalProps) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      if (!isOpen) return;
      
      const supabase = createSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      console.log("🔐 [AccountFoundModal] Current auth user:", user?.email || user?.id || "none");
      setCurrentUser(user);
      setIsLoading(false);
    };

    checkAuth();
  }, [isOpen]);

  if (!isOpen) {
    console.log("🚫 [AccountFoundModal] Not rendering - isOpen is false");
    return null;
  }

  console.log("🎉 [AccountFoundModal] RENDERING with:", { userEmail, walletAddress, currentUser: currentUser?.email });

  const handleSignIn = () => {
    console.log("🔐 [AccountFoundModal] Sign In button clicked, calling onSignIn...");
    // Remember that user chose to sign in (don't show mini prompt)
    sessionStorage.setItem('account_prompt_dismissed', 'true');
    onSignIn();
  };

  const handleAddToAccount = async () => {
    console.log("➕ [AccountFoundModal] Add to Account clicked");
    
    if (!currentUser) {
      showToast("Please sign in first", "error");
      return;
    }

    try {
      const supabase = createSupabaseClient();
      
      // Get user's profile
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("public_user_id")
        .eq("auth_user_id", currentUser.id)
        .maybeSingle();

      if (!profile?.public_user_id) {
        showToast("Profile not found. Please sign in again.", "error");
        return;
      }

      console.log("➕ [AccountFoundModal] Adding wallet to account (unverified)");

      // Add wallet to account (ownership_verified: false)
      const { error: insertError } = await supabase
        .from("wallets")
        .insert({
          public_user_id: profile.public_user_id,
          address: walletAddress,
          label: "Imported Wallet",
          source: "keplr",
          ownership_verified: false, // Not verified yet
        });

      if (insertError) {
        console.error("❌ Failed to add wallet:", insertError);
        showToast("Failed to add wallet to account", "error");
        return;
      }

      console.log("✅ [AccountFoundModal] Wallet added successfully (unverified)");
      showToast("Wallet added to your account!", "success");
      
      onClose();
      router.push("/dashboard");
    } catch (error) {
      console.error("❌ Error adding wallet:", error);
      showToast("An error occurred", "error");
    }
  };

  const handleViewWalletOnly = () => {
    console.log("👁️ [AccountFoundModal] View This Wallet Only button clicked...");
    onViewWalletOnly();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[10001] p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full p-8 relative border border-gray-200 dark:border-gray-700">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <IoClose className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <IoPerson className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome Back!
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            This wallet is registered to an account
          </p>
        </div>

        {/* Account Info */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <IoPerson className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {userEmail || "Account IoPerson"}
            </span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-500 font-mono truncate">
            {walletAddress}
          </div>
        </div>

        {/* Benefits of signing in */}
        <div className="mb-6">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Sign in to unlock:
          </p>
          <ul className="space-y-2">
            <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
              Historical rewards & transaction history
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
              Sync your portfolio across devices
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
              Save wallets permanently
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
              Access advanced features
            </li>
          </ul>
        </div>

        {/* Actions */}
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : currentUser ? (
          /* User is authenticated - show Add to Account option */
          <div className="space-y-3">
            <button
              onClick={handleAddToAccount}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all flex items-center justify-center gap-2"
            >
              <IoAddCircle className="w-5 h-5" />
              Add to My Account
            </button>
            <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
              This wallet will be added to <strong>{currentUser.email || "your account"}</strong>
            </p>
            <button
              onClick={handleViewWalletOnly}
              className="w-full px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              View This Wallet Only
            </button>
          </div>
        ) : (
          /* User is NOT authenticated - show sign-in options */
          <div className="space-y-3">
            <div className="flex gap-3">
              <button
                onClick={handleViewWalletOnly}
                className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                View This Wallet Only
              </button>
              <button
                onClick={handleSignIn}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all flex items-center justify-center gap-2"
              >
                Sign In to Account
                <IoArrowForward className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-500 text-center">
              Sign in to access all features, or just view this wallet
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

