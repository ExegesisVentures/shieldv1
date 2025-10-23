"use client";

import { useState, useEffect } from "react";
import { IoShieldCheckmark, IoAnalytics, IoImages, IoLockClosed, IoFlash } from "react-icons/io5";
import ShieldNftPanel from "@/components/membership/ShieldNftPanel";
import MembershipCTA from "@/components/membership/MembershipCTA";
import { createSupabaseClient } from "@/utils/supabase/client";
import { fetchShieldSettings, pickPlaceholderUsd } from "@/utils/nft/shield";

export default function Membership() {
  const [userType, setUserType] = useState<"visitor" | "public" | "private">("visitor");
  const [shieldSettings, setShieldSettings] = useState<{ image_url: string | null; min_usd: number; max_usd: number } | null>(null);
  const [placeholderValue, setPlaceholderValue] = useState(5500);
  const [loading, setLoading] = useState(true);
  const [pulseRequestButton, setPulseRequestButton] = useState(false);

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
            ShieldNEST Membership
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            {userType === "private"
              ? "Welcome back, ShieldNEST Member! Enjoy your exclusive benefits."
              : "Unlock exclusive NFT analytics, advanced features, and PMA legal protection."}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* ShieldNEST NFT Panel */}
          <div>
            <ShieldNftPanel
              imageUrl={shieldSettings?.image_url || null}
              valueUsd={placeholderValue}
              isOwner={userType === "private"}
              loading={loading}
              onRequestMembership={() => setPulseRequestButton(true)}
            />
          </div>

          {/* Membership CTA or Status */}
          <div className="flex flex-col justify-center">
            <MembershipCTA 
              userType={userType} 
              shouldPulse={pulseRequestButton}
              onPulseComplete={() => setPulseRequestButton(false)}
            />

            {userType !== "private" && (
              <div className="mt-6 neo-float-blue p-8 bg-gradient-to-br from-blue-900/40 via-purple-900/30 to-blue-900/40 backdrop-blur-xl border border-blue-500/20 shadow-2xl">
                <h3 className="text-2xl font-bold text-white mb-6">
                  How It Works
                </h3>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 blur-xl opacity-20"></div>
                      <div className="relative w-12 h-12 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl flex items-center justify-center text-white font-bold text-lg border border-gray-700/50 shadow-xl">
                        1
                      </div>
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
                    <div className="flex-shrink-0 relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 blur-xl opacity-20"></div>
                      <div className="relative w-12 h-12 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl flex items-center justify-center text-white font-bold text-lg border border-gray-700/50 shadow-xl">
                        2
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg text-white mb-1">
                        {userType === "visitor" ? "Connect Wallet" : "Acquire ShieldNEST NFT"}
                      </h4>
                      <p className="text-gray-400">
                        {userType === "visitor"
                          ? "Link your Coreum wallet to your account"
                          : "Purchase the exclusive ShieldNEST NFT"}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-500 blur-xl opacity-20"></div>
                      <div className="relative w-12 h-12 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl flex items-center justify-center text-white font-bold text-lg border border-gray-700/50 shadow-xl">
                        3
                      </div>
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
          <div className="mt-12 neo-float-purple p-10 bg-gradient-to-br from-purple-900/40 via-blue-900/30 to-purple-900/40 backdrop-blur-xl border border-purple-500/20 shadow-2xl">
            <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-10">
              Membership Benefits
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  icon: IoAnalytics,
                  title: "Advanced Analytics",
                  description: "Deep insights into your portfolio performance",
                  gradient: "from-blue-500 to-cyan-500",
                },
                {
                  icon: IoImages,
                  title: "NFT Dashboard",
                  description: "Exclusive access to NFT metrics and tools",
                  gradient: "from-purple-500 to-pink-500",
                },
                {
                  icon: IoLockClosed,
                  title: "PMA Protection",
                  description: "Legal protection through Private Member Agreement",
                  gradient: "from-green-500 to-emerald-500",
                },
                {
                  icon: IoFlash,
                  title: "Early Access",
                  description: "First access to new features and updates",
                  gradient: "from-orange-500 to-yellow-500",
                },
              ].map((benefit) => {
                const IconComponent = benefit.icon;
                return (
                  <div key={benefit.title} className="text-center group">
                    <div className="relative inline-block mb-4">
                      <div className={`absolute inset-0 bg-gradient-to-br ${benefit.gradient} blur-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-300 rounded-full`}></div>
                      <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-2xl border border-gray-700/50 shadow-xl group-hover:scale-110 group-hover:shadow-2xl transition-all duration-300">
                        <div className={`bg-gradient-to-br ${benefit.gradient} bg-clip-text`}>
                          <IconComponent className="w-12 h-12 mx-auto text-transparent" style={{
                            filter: 'drop-shadow(0 0 10px currentColor)',
                          }} />
                        </div>
                      </div>
                    </div>
                    <h3 className="font-bold text-lg text-white mb-2">
                      {benefit.title}
                    </h3>
                    <p className="text-gray-400 leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

