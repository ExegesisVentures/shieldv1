"use client";

import { useState } from "react";
import { IoShieldCheckmark, IoLockClosed, IoSparkles, IoArrowForward } from "react-icons/io5";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import GuidedOnboarding from "@/components/onboarding/GuidedOnboarding";

interface MembershipCTAProps {
  userType: "visitor" | "public" | "private";
}

export default function MembershipCTA({ userType }: MembershipCTAProps) {
  const [showOnboarding, setShowOnboarding] = useState(false);

  const handleSignUpClick = () => {
    setShowOnboarding(true);
  };

  if (userType === "private") {
    return (
      <Card className="group bg-gradient-to-r from-purple-600 to-blue-600 text-white p-8">
        <div className="flex items-start gap-4">
          <div className="neo-icon-glow-green neo-transition">
            <IoShieldCheckmark className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-2xl font-bold mb-2">You&apos;re a Shield Member!</h3>
            <p className="text-white/90 mb-4">
              Your membership is active. You&apos;re accessing protected features under PMA.
            </p>
            <div className="flex items-center gap-2 text-sm text-white/80">
              <IoSparkles className="w-4 h-4" />
              <span>All private features unlocked</span>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="group border-2 border-purple-200 dark:border-purple-800 p-8 hover:shadow-xl transition-all duration-300 hover:border-purple-400 dark:hover:border-purple-400">
      <div className="flex items-start gap-4 mb-6">
        <div className="neo-icon-glow-purple neo-transition">
          <IoLockClosed className="w-8 h-8" />
        </div>
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Unlock Shield Membership
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {userType === "visitor"
              ? "Create an account and become a Shield Member to unlock exclusive analytics, NFT metrics, and private features."
              : "Shield Members unlock exclusive analytics & NFT metrics with PMA protection."}
          </p>
        </div>
      </div>

      {/* Benefits */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        {[
          "Exclusive NFT dashboard",
          "Advanced portfolio analytics",
          "Private member features",
          "PMA legal protection",
        ].map((benefit) => (
          <div
            key={benefit}
            className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
            <span>{benefit}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <Button size="lg" className="w-full" onClick={handleSignUpClick}>
        {userType === "visitor" ? "Sign Up to Request Membership" : "Request Membership"}
        <IoArrowForward className="w-4 h-4 ml-2" />
      </Button>

      {userType === "visitor" && (
        <p className="text-xs text-center text-gray-500 dark:text-gray-500 mt-3">
          Start by creating a free account to save your portfolio
        </p>
      )}

      {/* Guided Onboarding Modal */}
      <GuidedOnboarding
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
      />
    </Card>
  );
}

