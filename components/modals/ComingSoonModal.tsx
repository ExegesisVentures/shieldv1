"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { IoClose, IoRocketSharp, IoNotifications, IoSparkles, IoTrendingUp } from "react-icons/io5";
import { Button } from "@/components/ui/button";
import { createSupabaseClient } from "@/utils/supabase/client";

interface ComingSoonModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: "add" | "trade";
}

/**
 * ComingSoonModal.tsx
 * 
 * Modal shown when users click on Add or Trade buttons in liquidity pools.
 * Encourages users to sign up and enable notifications for early access.
 * 
 * Location: /Users/exe/Downloads/Cursor/shieldv2/components/modals/ComingSoonModal.tsx
 */
export default function ComingSoonModal({ isOpen, onClose, feature }: ComingSoonModalProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const handleSignUp = () => {
    onClose();
    router.push('/sign-up');
  };

  const handleEnableNotifications = () => {
    onClose();
    router.push('/settings?tab=notifications');
  };

  if (!isOpen) return null;

  const featureTitle = feature === "add" ? "Add Liquidity" : "Trade";
  const featureDescription = feature === "add" 
    ? "adding liquidity to pools"
    : "trading directly from liquidity pools";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl border-2 border-purple-500/30 animate-in zoom-in-95 duration-300">
        {/* Animated gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-green-500/10 rounded-2xl pointer-events-none animate-pulse" />
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-gray-800/50 hover:bg-gray-700 transition-colors z-10"
          aria-label="Close modal"
        >
          <IoClose className="w-5 h-5 text-gray-300" />
        </button>

        {/* Content */}
        <div className="relative p-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full blur-xl opacity-50 animate-pulse" />
              <div className="relative w-20 h-20 bg-gradient-to-br from-purple-500 via-blue-500 to-green-500 rounded-full flex items-center justify-center shadow-2xl">
                <IoRocketSharp className="w-10 h-10 text-white" />
              </div>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold text-center text-white mb-3">
            {featureTitle} Coming Soon! 🎉
          </h2>

          {/* Message */}
          <div className="space-y-4 mb-8">
            <p className="text-center text-gray-300 text-lg leading-relaxed">
              Thanks for being interested in {featureDescription}! We&apos;re glad you&apos;re here.
            </p>

            {/* Feature highlights */}
            <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-xl p-5 border border-purple-500/20">
              <div className="flex items-start gap-3 mb-3">
                <IoTrendingUp className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-white mb-1">Highest Earning Pools</h3>
                  <p className="text-sm text-gray-400">
                    We hope you&apos;re saving some liquidity to put in these pools because we&apos;re gonna have some of the highest earning pools.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <IoSparkles className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-white mb-1">Special Treats for Early Users</h3>
                  <p className="text-sm text-gray-400">
                    Be among the first to know when we launch and get exclusive access to premium features.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="space-y-3">
            {!isAuthenticated && !isLoading && (
              <>
                <Button
                  onClick={handleSignUp}
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  <IoPerson className="w-5 h-5 mr-2" />
                  Sign Up Now
                </Button>

                <p className="text-center text-sm text-gray-400">
                  Already have an account?{" "}
                  <button
                    onClick={() => {
                      onClose();
                      router.push('/sign-in');
                    }}
                    className="text-purple-400 hover:text-purple-300 underline"
                  >
                    Sign In
                  </button>
                </p>
              </>
            )}

            {isAuthenticated && (
              <Button
                onClick={handleEnableNotifications}
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                <IoNotifications className="w-5 h-5 mr-2" />
                Enable Notifications
              </Button>
            )}

            <p className="text-center text-xs text-gray-500 mt-4">
              Don&apos;t forget to enable notifications to get early access alerts and exclusive updates!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Export IoPerson for use in this component
function IoPerson({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 512 512" fill="currentColor">
      <path d="M256 256c52.805 0 96-43.201 96-96s-43.195-96-96-96-96 43.201-96 96 43.195 96 96 96zm0 48c-63.598 0-192 32.402-192 96v48h384v-48c0-63.598-128.402-96-192-96z"/>
    </svg>
  );
}

