"use client";

import { useState } from "react";
import { IoClose, IoArrowForward, IoArrowBack, IoCheckmark } from "react-icons/io5";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

interface GuidedOnboardingProps {
  isOpen: boolean;
  onClose: () => void;
}

interface OnboardingData {
  email?: string;
  password?: string;
  confirmPassword?: string;
  fullName?: string;
  preferredName?: string;
}

const STEPS = [
  {
    id: 1,
    title: "Welcome to ShieldNest!",
    subtitle: "Let's set up your account in a few simple steps",
    icon: "👋",
  },
  {
    id: 2,
    title: "What's your email?",
    subtitle: "We'll use this to secure your account and keep your data safe",
    icon: "📧",
    field: "email",
  },
  {
    id: 3,
    title: "Create a password",
    subtitle: "Choose a strong password to protect your account",
    icon: "🔒",
    field: "password",
  },
  {
    id: 4,
    title: "What should we call you?",
    subtitle: "This helps personalize your experience (optional)",
    icon: "👤",
    field: "name",
  },
  {
    id: 5,
    title: "All set!",
    subtitle: "We're creating your account and migrating your wallet data",
    icon: "🎉",
  },
];

export default function GuidedOnboarding({ isOpen, onClose }: GuidedOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (!isOpen) return null;

  const currentStepData = STEPS.find(s => s.id === currentStep)!;
  const isLastStep = currentStep === STEPS.length;
  const isFirstStep = currentStep === 1;

  const handleNext = async () => {
    setError(null);

    // Validation
    if (currentStep === 2 && !data.email) {
      setError("Please enter your email");
      return;
    }
    if (currentStep === 2 && !data.email?.includes('@')) {
      setError("Please enter a valid email address");
      return;
    }
    if (currentStep === 3 && !data.password) {
      setError("Please enter a password");
      return;
    }
    if (currentStep === 3 && (data.password?.length ?? 0) < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (currentStep === 3 && data.password !== data.confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    // If on the last data-collection step, create account
    if (currentStep === 4) {
      setLoading(true);
      try {
        await createAccount();
        setCurrentStep(currentStep + 1);
        
        // Auto-redirect after 2 seconds on success screen
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      } catch (e) {
        const error = e as Error;
        setError(error.message || "Failed to create account");
        setLoading(false);
      }
      return;
    }

    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    setError(null);
    setCurrentStep(Math.max(1, currentStep - 1));
  };

  const createAccount = async () => {
    const supabase = createSupabaseClient();

    // Sign up the user
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: data.email!,
      password: data.password!,
      options: {
        data: {
          full_name: data.fullName,
          preferred_name: data.preferredName,
        },
      },
    });

    if (signUpError) {
      throw new Error(signUpError.message);
    }

    if (!authData.user) {
      throw new Error("Account creation failed");
    }

    // Wait a moment for triggers to create public_users record
    await new Promise(resolve => setTimeout(resolve, 1000));

    // If visitor had wallets, migrate them
    const visitorAddresses = JSON.parse(localStorage.getItem('visitor_addresses') || '[]');
    if (visitorAddresses.length > 0) {
      try {
        // Get the user's public_user_id
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("public_user_id")
          .eq("auth_user_id", authData.user.id)
          .single();

        if (profile?.public_user_id) {
          // Add each visitor wallet to the database
          for (const wallet of visitorAddresses) {
            await supabase
              .from("wallets")
              .insert({
                public_user_id: profile.public_user_id,
                address: wallet.address,
                label: wallet.label || "Migrated Wallet",
                source: "migrated",
                ownership_verified: false,
              });
          }

          // Clear visitor storage
          localStorage.removeItem('visitor_addresses');
          window.dispatchEvent(new Event('storage'));
        }
      } catch (e) {
        console.error("Wallet migration failed:", e);
        // Don't throw - account creation succeeded
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Progress bar */}
        <div className="h-1.5 bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300"
            style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
          />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          disabled={loading}
        >
          <IoClose className="w-6 h-6" />
        </button>

        <div className="p-8">
          {/* Icon */}
          <div className="text-6xl text-center mb-6">{currentStepData.icon}</div>

          {/* Title */}
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-3">
            {currentStepData.title}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-center mb-8">
            {currentStepData.subtitle}
          </p>

          {/* Step Content */}
          <div className="min-h-[120px]">
            {currentStep === 1 && (
              <div className="text-center text-gray-600 dark:text-gray-400">
                <p className="mb-4">Create a free account to:</p>
                <ul className="text-left inline-block space-y-2">
                  <li className="flex items-center gap-2">
                    <IoCheckmark className="w-5 h-5 text-green-500" />
                    Save your portfolio across devices
                  </li>
                  <li className="flex items-center gap-2">
                    <IoCheckmark className="w-5 h-5 text-green-500" />
                    Track your assets permanently
                  </li>
                  <li className="flex items-center gap-2">
                    <IoCheckmark className="w-5 h-5 text-green-500" />
                    Unlock advanced features
                  </li>
                </ul>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={data.email || ""}
                    onChange={(e) => setData({ ...data, email: e.target.value })}
                    autoFocus
                    disabled={loading}
                    autoComplete="email"
                  />
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="At least 6 characters"
                    value={data.password || ""}
                    onChange={(e) => setData({ ...data, password: e.target.value })}
                    autoFocus
                    disabled={loading}
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Re-enter your password"
                    value={data.confirmPassword || ""}
                    onChange={(e) => setData({ ...data, confirmPassword: e.target.value })}
                    disabled={loading}
                    autoComplete="new-password"
                  />
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="fullName">Full Name (Optional)</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={data.fullName || ""}
                    onChange={(e) => setData({ ...data, fullName: e.target.value })}
                    autoFocus
                    disabled={loading}
                  />
                </div>
                <div>
                  <Label htmlFor="preferredName">Preferred Name (Optional)</Label>
                  <Input
                    id="preferredName"
                    type="text"
                    placeholder="What should we call you?"
                    value={data.preferredName || ""}
                    onChange={(e) => setData({ ...data, preferredName: e.target.value })}
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            {currentStep === 5 && (
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
                  <IoCheckmark className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  Redirecting to your dashboard...
                </p>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          {!isLastStep && (
            <div className="flex gap-3 mt-8">
              {!isFirstStep && (
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={loading}
                  className="flex-1"
                >
                  <IoArrowBack className="w-4 h-4 mr-2" />
                  Back
                </Button>
              )}
              <Button
                onClick={handleNext}
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  "Creating Account..."
                ) : (
                  <>
                    {currentStep === 4 ? "Create Account" : "Continue"}
                    <IoArrowForward className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Step indicator */}
          <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Step {currentStep} of {STEPS.length}
          </div>
        </div>
      </div>
    </div>
  );
}

