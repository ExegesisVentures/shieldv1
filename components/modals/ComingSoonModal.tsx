"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { IoClose, IoRocketSharp, IoSparkles, IoTrendingUp } from "react-icons/io5";
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
 * Modal for coming soon features (Add Liquidity / Trade) with CoreumDash styling.
 * Styled with 3D effects and subtle glows matching the existing design system.
 * 
 * Location: components/modals/ComingSoonModal.tsx
 */
export default function ComingSoonModal({ isOpen, onClose, feature }: ComingSoonModalProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Only check auth when modal opens
    if (!isOpen) return;
    
    const checkAuth = async () => {
      try {
        const supabase = createSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        setIsAuthenticated(!!user);
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [isOpen]);

  const handleSignUp = () => {
    onClose();
    // Use setTimeout to ensure modal closes before navigation
    setTimeout(() => {
      router.push('/sign-up');
    }, 0);
  };

  const handleGetNotified = () => {
    onClose();
    // Use setTimeout to ensure modal closes before navigation
    setTimeout(() => {
      router.push('/settings#notifications');
    }, 0);
  };

  if (!isOpen) return null;

  const featureTitle = feature === "add" ? "Add Liquidity" : "Trade";
  const featureDescription = feature === "add" 
    ? "adding liquidity to pools"
    : "trading directly from liquidity pools";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Modal Card with CoreumDash styling */}
      <div className="relative w-full max-w-lg card-coreum shadow-2xl animate-in zoom-in-95 duration-300">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors z-10 border border-gray-700"
          aria-label="Close modal"
        >
          <IoClose className="w-5 h-5 text-gray-300" />
        </button>

        {/* Content */}
        <div className="relative p-8">
          {/* Icon with 3D effect */}
          <div className="flex justify-center mb-6">
            <div className="neo-icon-glow-purple" style={{ minWidth: '80px', minHeight: '80px' }}>
              <IoRocketSharp className="w-10 h-10 text-white relative z-10" />
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

            {/* Feature highlights with CoreumDash style */}
            <div className="glass-coreum p-5 rounded-xl border border-purple-500/20">
              <div className="flex items-start gap-3 mb-3">
                <div className="neo-icon-glow-green" style={{ minWidth: '40px', minHeight: '40px' }}>
                  <IoTrendingUp className="w-5 h-5 text-white relative z-10" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Highest Earning Pools</h3>
                  <p className="text-sm text-gray-400">
                    We hope you&apos;re saving some liquidity to put in these pools because we&apos;re gonna have some of the highest earning pools.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="neo-icon-glow-yellow" style={{ minWidth: '40px', minHeight: '40px' }}>
                  <IoSparkles className="w-5 h-5 text-white relative z-10" />
                </div>
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
                  Sign Up Now
                </Button>

                <p className="text-center text-sm text-gray-400">
                  Already have an account?{" "}
                  <button
                    onClick={() => {
                      onClose();
                      router.push('/sign-in');
                    }}
                    className="text-[#25d695] hover:text-[#1fb881] underline"
                  >
                    Sign In
                  </button>
                </p>
              </>
            )}

            {isAuthenticated && (
              <Button
                onClick={handleGetNotified}
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                🔔 Get Notified
              </Button>
            )}

            <p className="text-center text-xs text-gray-500 mt-4">
              {isAuthenticated 
                ? "Manage your notification preferences to stay updated!" 
                : "We'll notify you when this feature launches!"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
