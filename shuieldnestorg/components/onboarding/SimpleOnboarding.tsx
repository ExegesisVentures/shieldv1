/**
 * Simple Onboarding Component
 * File: components/onboarding/SimpleOnboarding.tsx
 * 
 * Post-signup onboarding flow: collect first name, optional wallet
 */

"use client";

import { useState } from "react";
import { IoArrowForward, IoWallet } from "react-icons/io5";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import WalletConnectModal from "@/components/wallet/WalletConnectModal";

interface SimpleOnboardingProps {
  userEmail: string;
  publicUserId: string;
}

export default function SimpleOnboarding({ publicUserId }: SimpleOnboardingProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showWalletModal, setShowWalletModal] = useState(false);

  const handleNameSubmit = async () => {
    if (!firstName.trim()) {
      setError("Please enter your first name");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const supabase = createSupabaseClient();
      
      // Update public_users with first name
      const { error: updateError } = await supabase
        .from("public_users")
        .update({ first_name: firstName.trim() })
        .eq("id", publicUserId);

      if (updateError) {
        console.error("Failed to update name:", updateError);
        setError("Failed to save your name. Please try again.");
        setLoading(false);
        return;
      }

      // Move to wallet connection step
      setStep(2);
    } catch (e) {
      console.error("Name update error:", e);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSkipIoWallet = async () => {
    setLoading(true);
    
    try {
      const supabase = createSupabaseClient();
      
      // Mark onboarding as completed
      const { error: updateError } = await supabase
        .from("public_users")
        .update({ onboarding_completed: true })
        .eq("id", publicUserId);

      if (updateError) {
        console.error("Failed to complete onboarding:", updateError);
        setError("Failed to complete setup. Please try again.");
        setLoading(false);
        return;
      }

      // Redirect to dashboard
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      console.error("Onboarding completion error:", e);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const handleWalletConnected = async () => {
    // IoWallet connected, mark onboarding as completed
    setShowWalletModal(false);
    
    try {
      const supabase = createSupabaseClient();
      
      const { error: updateError } = await supabase
        .from("public_users")
        .update({ onboarding_completed: true })
        .eq("id", publicUserId);

      if (updateError) {
        console.error("Failed to complete onboarding:", updateError);
      }

      // Redirect to dashboard
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      console.error("Onboarding completion error:", e);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Step {step} of 2
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {step === 1 ? "Basic Info" : "Connect IoWallet (Optional)"}
          </span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300"
            style={{ width: `${(step / 2) * 100}%` }}
          />
        </div>
      </div>

      {/* Step 1: Name */}
      {step === 1 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">👋</div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome to ShieldNest!
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Let&apos;s personalize your account
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="firstName" className="text-base font-medium">
                What&apos;s your first name?
              </Label>
              <Input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter your first name"
                className="mt-2 h-12 text-lg"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !loading) {
                    handleNameSubmit();
                  }
                }}
              />
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <Button
              onClick={handleNameSubmit}
              disabled={loading || !firstName.trim()}
              className="w-full h-12 text-lg"
            >
              {loading ? (
                "Saving..."
              ) : (
                <>
                  Continue
                  <IoArrowForward className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: IoWallet Connection */}
      {step === 2 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🔗</div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Connect Your IoWallet
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Track your Coreum portfolio by connecting your wallet
            </p>
          </div>

          <div className="space-y-4">
            <Button
              onClick={() => setShowWalletModal(true)}
              className="w-full h-14 text-lg bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
            >
              <IoWallet className="mr-2 h-5 w-5" />
              Connect IoWallet
            </Button>

            <Button
              onClick={handleSkipIoWallet}
              disabled={loading}
              variant="outline"
              className="w-full h-14 text-lg"
            >
              {loading ? "Completing..." : "Skip for Now"}
            </Button>

            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              You can always connect your wallet later from your dashboard
            </p>
          </div>
        </div>
      )}

      {/* IoWallet Connect Modal */}
      {showWalletModal && (
        <WalletConnectModal
          isOpen={showWalletModal}
          onClose={() => setShowWalletModal(false)}
          onWalletConnected={handleWalletConnected}
        />
      )}
    </div>
  );
}
