"use client";

import { useState, useEffect } from "react";
import { IoShieldCheckmark } from "react-icons/io5";
import ShieldNftPanel from "@/components/membership/ShieldNftPanel";
import MembershipCTA from "@/components/membership/MembershipCTA";
import { createSupabaseClient } from "@/utils/supabase/client";
import { fetchShieldSettings, pickPlaceholderUsd } from "@/utils/nft/shield";

export default function Membership() {
  const [userType, setUserType] = useState<"visitor" | "public" | "private">("visitor");
  const [shieldSettings, setShieldSettings] = useState<{ image_url: string | null; min_usd: number; max_usd: number } | null>(null);
  const [placeholderValue, setPlaceholderValue] = useState(5500);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUserStatus();
    loadShieldSettings();
  }, []);

  const checkUserStatus = async () => {
    const supabase = createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setUserType("visitor");
      setLoading(false);
      return;
    }

    // Check for private membership
    const { data: privateProfile } = await supabase
      .from("private_user_profiles")
      .select("private_user_id")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (privateProfile?.private_user_id) {
      const { data: privateUser } = await supabase
        .from("private_users")
        .select("pma_signed, shield_nft_verified")
        .eq("id", privateProfile.private_user_id)
        .single();

      if (privateUser?.pma_signed && privateUser?.shield_nft_verified) {
        setUserType("private");
        setLoading(false);
        return;
      }
    }

    setUserType("public");
    setLoading(false);
  };

  const loadShieldSettings = async () => {
    try {
      const supabase = createSupabaseClient();
      const settings = await fetchShieldSettings(supabase);
      setShieldSettings(settings);
      
      // Get user ID for placeholder calculation
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const value = pickPlaceholderUsd(user.id, settings.min_usd, settings.max_usd);
        setPlaceholderValue(value);
      }
    } catch (error) {
      console.error("Failed to load shield settings:", error);
    }
  };

  return (
    <main className="min-h-screen neo-gradient-bg p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 neo-glass px-6 py-3 rounded-full mb-6 neo-transition hover:scale-105">
            <IoShieldCheckmark className="w-5 h-5 text-[#25d695] dark:text-[#25d695]" />
            <span className="text-sm font-semibold text-[#179b69] dark:text-[#25d695]">
              Exclusive Membership
            </span>
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-white mb-6">
            IoShieldCheckmark Membership
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            {userType === "private"
              ? "Welcome back, IoShieldCheckmark Member! Enjoy your exclusive benefits."
              : "Unlock exclusive NFT analytics, advanced features, and PMA legal protection."}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* IoShieldCheckmark NFT Panel */}
          <div>
            <ShieldNftPanel
              imageUrl={shieldSettings?.image_url || null}
              valueUsd={placeholderValue}
              isOwner={userType === "private"}
              loading={loading}
            />
          </div>

          {/* Membership CTA or Status */}
          <div className="flex flex-col justify-center">
            <MembershipCTA userType={userType} />

            {userType !== "private" && (
              <div className="mt-6 neo-float-blue p-8">
                <h3 className="text-2xl font-bold text-white mb-6">
                  How It Works
                </h3>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 neo-icon-glow-purple rounded-full flex items-center justify-center text-white font-bold text-lg">
                      1
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg text-white mb-1">
                        {userType === "visitor" ? "Create Account" : "Sign PMA"}
                      </h4>
                      <p className="text-gray-400">
                        {userType === "visitor"
                          ? "Create a free account to get started"
                          : "Review and sign the Private Member Agreement"}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 neo-icon-glow-blue rounded-full flex items-center justify-center text-white font-bold text-lg">
                      2
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg text-white mb-1">
                        {userType === "visitor" ? "Connect Wallet" : "Acquire IoShieldCheckmark NFT"}
                      </h4>
                      <p className="text-gray-400">
                        {userType === "visitor"
                          ? "Link your Coreum wallet to your account"
                          : "Purchase the exclusive IoShieldCheckmark NFT"}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 neo-icon-glow-green rounded-full flex items-center justify-center text-white font-bold text-lg">
                      3
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg text-white mb-1">
                        Unlock Features
                      </h4>
                      <p className="text-gray-400">
                        Access exclusive dashboard, analytics, and member tools
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Benefits Section */}
        {userType !== "private" && (
          <div className="mt-12 neo-float-purple p-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-10">
              Membership Benefits
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  icon: "📊",
                  title: "Advanced Analytics",
                  description: "Deep insights into your portfolio performance",
                },
                {
                  icon: "🎨",
                  title: "NFT Dashboard",
                  description: "Exclusive access to NFT metrics and tools",
                },
                {
                  icon: "🔒",
                  title: "PMA Protection",
                  description: "Legal protection through Private Member Agreement",
                },
                {
                  icon: "⚡",
                  title: "Early Access",
                  description: "First access to new features and updates",
                },
              ].map((benefit) => (
                <div key={benefit.title} className="text-center group">
                  <div className="text-5xl mb-4 neo-transition group-hover:scale-110">{benefit.icon}</div>
                  <h3 className="font-bold text-lg text-white mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

