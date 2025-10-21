"use client";

import { useEffect, useState } from "react";
import { createSupabaseClient } from "@/utils/supabase/client";
import { keplrGetAddress } from "@/utils/wallet/keplr";

/**
 * AutoConnectWallet Component
 * 
 * Automatically adds the connected Keplr wallet to a user's profile when they sign in/up
 * if the wallet is not already in their account.
 * 
 * This provides a seamless UX where users don't have to manually add their wallet
 * after creating an account.
 */
export default function AutoConnectWallet() {
  const [lastCheckedUserId, setLastCheckedUserId] = useState<string | null>(null);

  useEffect(() => {
    const autoConnectWallet = async () => {
      try {
        const supabase = createSupabaseClient();
        
        // Check if user is authenticated
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log("🔌 [AutoConnect] No authenticated user, skipping");
          setLastCheckedUserId(null);
          return;
        }
        
        // Only run once per user session (not per page load)
        if (lastCheckedUserId === user.id) {
          console.log("🔌 [AutoConnect] Already checked for user:", user.id);
          return;
        }
        
        console.log("🔌 [AutoConnect] User authenticated:", {
          userId: user.id,
          email: user.email,
          isAnonymous: user.is_anonymous
        });

        // Mark this user as checked
        setLastCheckedUserId(user.id);

        // Check if Keplr is available and connected
        if (!window.keplr) {
          console.log("🔌 [AutoConnect] Keplr not available, skipping");
          return;
        }

        // Get the connected Keplr address
        let keplrAddress: string;
        try {
          keplrAddress = await keplrGetAddress();
          console.log("🔌 [AutoConnect] Found connected Keplr wallet:", keplrAddress);
        } catch (error) {
          console.log("🔌 [AutoConnect] No Keplr wallet connected, skipping");
          return;
        }

        // Get user's public_user_id first
        const { data: profile, error: profileError } = await supabase
          .from("user_profiles")
          .select("public_user_id")
          .eq("auth_user_id", user.id)
          .maybeSingle();

        if (profileError) {
          console.error("🔌 [AutoConnect] Error fetching user profile:", profileError);
          return;
        }

        if (!profile?.public_user_id) {
          console.warn("🔌 [AutoConnect] No user profile found, skipping");
          return;
        }
        
        console.log("🔌 [AutoConnect] User profile found:", {
          publicUserId: profile.public_user_id
        });

        // Check if wallet exists in database for this user
        console.log("🔌 [AutoConnect] Checking if wallet exists:", {
          address: keplrAddress,
          addressLower: keplrAddress.toLowerCase()
        });
        
        // Check by address only (don't use JOIN as it might fail)
        const { data: existingWallet, error: walletCheckError } = await supabase
          .from("wallets")
          .select("id, public_user_id, address, ownership_verified")
          .eq("address", keplrAddress)
          .eq("public_user_id", profile.public_user_id)
          .maybeSingle();

        if (walletCheckError) {
          console.error("🔌 [AutoConnect] Error checking existing wallet:", walletCheckError);
        }

        console.log("🔌 [AutoConnect] Existing wallet check result:", {
          found: !!existingWallet,
          wallet: existingWallet || null
        });

        if (existingWallet) {
          // Wallet already exists in this account - just update label/source if needed
          console.log("🔌 [AutoConnect] Wallet already in account, updating metadata only");
          
          const { error: updateError } = await supabase
            .from("wallets")
            .update({
              label: "Keplr Wallet",
              source: "keplr"
            })
            .eq("id", existingWallet.id);

          if (updateError) {
            console.error("🔌 [AutoConnect] Failed to update wallet metadata:", updateError);
          } else {
            console.log("✅ [AutoConnect] Wallet metadata updated");
          }
          
          // Trigger refresh without page reload
          window.dispatchEvent(new CustomEvent('walletDatabaseChange', {
            detail: { action: 'updated', address: keplrAddress }
          }));
          return;
        }

        // Wallet doesn't exist - add it (unverified by default)
        console.log("➕ [AutoConnect] Adding new Keplr wallet to account (unverified)");
        
        const insertData = {
          public_user_id: profile.public_user_id,
          address: keplrAddress,
          label: "Keplr Wallet",
          source: "keplr",
          ownership_verified: false, // User can verify later if they want premium features
        };
        
        console.log("🔍 [AutoConnect] Insert data:", {
          ...insertData,
          addressLength: keplrAddress.length,
          addressLower: keplrAddress.toLowerCase(),
          publicUserIdType: typeof profile.public_user_id,
        });
        
        const { error: insertError, data: insertedWallet } = await supabase
          .from("wallets")
          .insert(insertData)
          .select();

        if (insertError) {
          console.error("🔌 [AutoConnect] Failed to add wallet - DETAILED ERROR:", {
            message: insertError.message,
            code: insertError.code,
            details: insertError.details,
            hint: insertError.hint,
            statusCode: (insertError as any).statusCode,
            fullError: JSON.stringify(insertError, null, 2)
          });
          
          // Try to get more info about what's in the database
          const { data: debugWallets } = await supabase
            .from("wallets")
            .select("address, public_user_id, ownership_verified")
            .eq("public_user_id", profile.public_user_id);
          
          console.error("🔌 [AutoConnect] Current wallets for this user:", debugWallets);
          return;
        }

        console.log("✅ [AutoConnect] Successfully added Keplr wallet to account (unverified)!", insertedWallet);
        console.log("💡 [AutoConnect] User can verify ownership later to unlock premium features");
        
        // Trigger a wallet refresh event (but DON'T reload the page)
        window.dispatchEvent(new CustomEvent('walletDatabaseChange', {
          detail: { action: 'add', address: keplrAddress }
        }));

      } catch (error) {
        console.error("🔌 [AutoConnect] Error:", error);
      }
    };

    // Run after a short delay to ensure auth state is settled
    const timer = setTimeout(autoConnectWallet, 1000);
    return () => clearTimeout(timer);
  }, [lastCheckedUserId]); // Re-run when lastCheckedUserId changes

  // This component doesn't render anything
  return null;
}
