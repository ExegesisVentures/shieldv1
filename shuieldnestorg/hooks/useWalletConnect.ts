"use client";

import { useState, useCallback } from "react";
import { createSupabaseClient } from "@/utils/supabase/client";
import { keplrGetAddress, keplrSignArbitrary } from "@/utils/wallet/keplr";
import { leapGetAddress, leapSignArbitrary } from "@/utils/wallet/leap";
import { cosmostationGetAddress, cosmostationSignArbitrary } from "@/utils/wallet/cosmostation";
import { UiError } from "@/utils/errors";

type WalletProvider = "keplr" | "leap" | "cosmostation";

interface ConnectResult {
  success: boolean;
  error?: UiError;
  walletBootstrap?: boolean;
  authenticated?: boolean; // New: indicates if user was authenticated via wallet
}

export function useWalletConnect() {
  const [connecting, setConnecting] = useState(false);
  const [provider, setProvider] = useState<WalletProvider | null>(null);
  
  const connectWallet = useCallback(async (walletProvider: WalletProvider): Promise<ConnectResult> => {
    setConnecting(true);
    setProvider(walletProvider);

    try {
      // Step 1: Get wallet address
      let address: string;
      
      console.log("Getting wallet address for provider:", walletProvider);

      switch (walletProvider) {
        case "keplr":
          console.log("Calling keplrGetAddress()...");
          address = await keplrGetAddress();
          console.log("Keplr address received:", address);
          break;
        case "leap":
          console.log("Calling leapGetAddress()...");
          address = await leapGetAddress();
          console.log("Leap address received:", address);
          break;
        case "cosmostation":
          console.log("Calling cosmostationGetAddress()...");
          address = await cosmostationGetAddress();
          console.log("Cosmostation address received:", address);
          break;
        default:
          throw new Error("Unknown wallet provider");
      }

      // Check if user is already authenticated
      const supabase = createSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      console.log("=== WALLET CONNECTION START ===");
      console.log("Wallet provider:", walletProvider);
      console.log("Wallet address:", address);
      console.log("User authenticated:", !!user);

      // Step 2: Check if this wallet is already registered in the database
      console.log("Checking if wallet is registered...");
      const checkResponse = await fetch("/api/auth/wallet/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });

      if (!checkResponse.ok) {
        console.error("❌ Wallet check failed:", checkResponse.status, checkResponse.statusText);
        return {
          success: false,
          error: {
            code: "CHECK_FAILED",
            message: "Failed to check wallet registration",
            hint: `Server error: ${checkResponse.status}`,
          },
        };
      }

      const checkData = await checkResponse.json();
      console.log("✅ Wallet check response:", checkData);
      console.log("Wallet exists in database:", checkData.exists);
      console.log("User authenticated:", !!user);
      console.log("Will take AUTHENTICATION path:", checkData.exists && !user);
      console.log("Will take VISITOR MODE path:", !user && !checkData.exists);
      console.log("Will take AUTHENTICATED ADD path:", !!user && !checkData.exists);

      // If wallet is registered and user is NOT authenticated, prompt for sign-in
      if (checkData.exists && !user) {
        console.log("=== TAKING AUTHENTICATION PATH ===");
        console.log("✅ Wallet is registered! Prompting for authentication...");
        
        // Get nonce for signature
        console.log("Getting nonce for signature...");
        const nonceResponse = await fetch(`/api/auth/wallet/nonce?address=${encodeURIComponent(address)}`);
        
        if (!nonceResponse.ok) {
          console.error("❌ Nonce request failed:", nonceResponse.status, nonceResponse.statusText);
          return {
            success: false,
            error: {
              code: "NONCE_FAILED",
              message: "Failed to get authentication nonce",
              hint: `Server error: ${nonceResponse.status}`,
            },
          };
        }
        
        const nonceData = await nonceResponse.json();
        console.log("✅ Nonce response:", nonceData);
        
        if (!nonceData.nonce) {
          console.error("❌ No nonce in response:", nonceData);
          return {
            success: false,
            error: {
              code: "NONCE_FAILED",
              message: "Failed to get authentication nonce",
              hint: "Please try again",
            },
          };
        }

        // Prompt user to sign
        console.log("Requesting signature from wallet...");
        let signatureData: any;
        
        try {
          switch (walletProvider) {
            case "keplr":
              console.log("Calling keplrSignArbitrary...");
              signatureData = await keplrSignArbitrary(address, nonceData.nonce);
              console.log("✅ Signature received from Keplr:", signatureData);
              break;
            case "leap":
              console.log("Calling leapSignArbitrary...");
              signatureData = await leapSignArbitrary(address, nonceData.nonce);
              console.log("✅ Signature received from Leap:", signatureData);
              break;
            case "cosmostation":
              console.log("Calling cosmostationSignArbitrary...");
              signatureData = await cosmostationSignArbitrary(address, nonceData.nonce);
              console.log("✅ Signature received from Cosmostation:", signatureData);
              break;
            default:
              throw new Error("Unknown wallet provider");
          }
          console.log("Signature data type:", typeof signatureData);
          console.log("Signature data:", JSON.stringify(signatureData));
        } catch (signError: unknown) {
          console.error("❌ Signature error:", signError);
          const errorMessage = signError instanceof Error ? signError.message : "Unknown error";
          console.error("Error message:", errorMessage);
          
          if (errorMessage.includes("User rejected") || errorMessage.includes("cancelled")) {
            return {
              success: false,
              error: {
                code: "USER_REJECTED",
                message: "Signature request cancelled",
                hint: "You need to sign the message to authenticate",
              },
            };
          }
          throw signError;
        }

        // Authenticate with signature
        console.log("Authenticating with signature...");
        const signInResponse = await fetch("/api/auth/wallet/sign-in", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address, signature: signatureData, nonce: nonceData.nonce }),
        });

        if (!signInResponse.ok) {
          console.error("❌ Sign-in request failed:", signInResponse.status, signInResponse.statusText);
          const errorData = await signInResponse.json().catch(() => ({}));
          console.error("❌ Sign-in error data:", errorData);
          return {
            success: false,
            error: {
              code: errorData.code || "AUTH_FAILED",
              message: errorData.message || "Authentication failed",
              hint: errorData.hint || `Server error: ${signInResponse.status}`,
            },
          };
        }

        const signInData = await signInResponse.json();
        console.log("✅ Sign-in response:", signInData);

        if (!signInData.success) {
          console.error("❌ Sign-in failed:", signInData);
          return {
            success: false,
            error: {
              code: signInData.code || "AUTH_FAILED",
              message: signInData.message || "Authentication failed",
              hint: signInData.hint,
            },
          };
        }

        console.log("✅ Authentication successful! Wallet will be automatically added to your portfolio.");
        console.log("Sign-in response:", signInData);
        
        // Navigate to magic link to establish session
        if (signInData.session?.magicLink) {
          console.log("Magic link found:", signInData.session.magicLink);
          console.log("Navigating to magic link to establish session...");
          
          // Show a loading message
          const message = document.createElement('div');
          message.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #10b981;
            color: white;
            padding: 20px 30px;
            border-radius: 12px;
            z-index: 99999;
            font-family: system-ui, sans-serif;
            box-shadow: 0 8px 24px rgba(0,0,0,0.2);
            font-size: 16px;
            font-weight: 600;
          `;
          message.textContent = "✓ Signing you in...";
          document.body.appendChild(message);
          
          // Navigate to magic link
          setTimeout(() => {
            console.log("Redirecting now...");
            window.location.href = signInData.session.magicLink;
          }, 500);
          
          return {
            success: true,
            authenticated: true,
          };
        }
        
        // Fallback: Show success message and reload
        console.log("Authentication successful, reloading page...");
        const message = document.createElement('div');
        message.style.cssText = `
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: #10b981;
          color: white;
          padding: 16px 24px;
          border-radius: 8px;
          z-index: 9999;
          font-family: system-ui, sans-serif;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        message.textContent = "Authentication successful! Refreshing...";
        document.body.appendChild(message);
        
        setTimeout(() => {
          window.location.reload();
        }, 1000);
        
        return {
          success: true,
          authenticated: true,
        };
      }

      // If user is NOT authenticated and wallet is NOT registered
      if (!user) {
        // VISITOR MODE: Just store in localStorage without signature verification
        console.log("=== TAKING VISITOR MODE PATH ===");
        console.log("=== VISITOR MODE DETECTED ===");
        console.log("User not authenticated and wallet not registered");
        console.log("Wallet address to save:", address);
        console.log("Wallet provider:", walletProvider);
        console.log("Storing wallet in localStorage...");
        
        // Get existing addresses from localStorage
        const existingAddresses = JSON.parse(localStorage.getItem('visitor_addresses') || '[]');
        
        // Check if address already exists
        if (existingAddresses.some((w: { address: string }) => w.address === address)) {
          return {
            success: false,
            error: {
              code: "WALLET_EXISTS",
              message: "This wallet is already connected",
            },
          };
        }

        // Add to local storage
        const newWallet = {
          address,
          label: `${walletProvider.charAt(0).toUpperCase() + walletProvider.slice(1)} Wallet`,
          chain_id: "coreum-mainnet-1",
          read_only: false, // Visitor wallets are usable, just not saved to account
          is_primary: existingAddresses.length === 0,
          added_at: new Date().toISOString(),
          provider: walletProvider,
        };

        existingAddresses.push(newWallet);
        localStorage.setItem('visitor_addresses', JSON.stringify(existingAddresses));
        
        console.log("=== WALLET CONNECTED (VISITOR MODE) ===");
        console.log("Wallet added to localStorage:", newWallet);
        console.log("Total wallets in localStorage:", existingAddresses.length);
        console.log("Updated localStorage:", JSON.stringify(existingAddresses, null, 2));

        // Trigger custom event for same-window updates (storage event only fires in other tabs)
        window.dispatchEvent(new CustomEvent('walletStorageChange', { detail: { wallets: existingAddresses } }));
        console.log("Custom walletStorageChange event dispatched");

        return {
          success: true,
          walletBootstrap: false,
        };
      }

      // AUTHENTICATED USER MODE: Simple wallet add (no signature required)
      console.log("=== TAKING AUTHENTICATED ADD PATH ===");
      console.log("Authenticated mode: adding wallet without signature verification");
      console.log("User ID:", user.id);
      console.log("Wallet address to add:", address);
      
      // Get user's public_user_id - should exist from database trigger
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("public_user_id")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (!profile?.public_user_id) {
        // This should never happen if database trigger is working
        console.error("No user profile found - database trigger may not be set up");
        return {
          success: false,
          error: {
            code: "PROFILE_NOT_FOUND",
            message: "User profile not found. Please contact support or try signing out and back in.",
            hint: "Database trigger may not be configured. Check DATABASE-TRIGGER-SETUP.md",
          },
        };
      }

      // Check if wallet already exists in DATABASE (not localStorage)
      const { data: existingWallet } = await supabase
        .from("wallets")
        .select("id")
        .eq("address", address)
        .eq("public_user_id", profile.public_user_id)
        .maybeSingle();

      if (existingWallet) {
        return {
          success: false,
          error: {
            code: "WALLET_EXISTS",
            message: "This wallet is already connected to your account",
          },
        };
      }

      // Check if this is the first wallet
      const { count } = await supabase
        .from("wallets")
        .select("id", { count: "exact", head: true })
        .eq("public_user_id", profile.public_user_id);

      const isPrimary = (count || 0) === 0;

      // Add wallet WITHOUT signature verification
      // User can verify ownership later when needed (PMA signing, Private tier)
      const { error: insertError } = await supabase.from("wallets").insert({
        public_user_id: profile.public_user_id,
        address,
        label: `${walletProvider.charAt(0).toUpperCase() + walletProvider.slice(1)} Wallet`,
        source: walletProvider, // Track which wallet extension was used
        ownership_verified: false, // Not verified yet
        verified_at: null,
        created_at: new Date().toISOString(),
      });

      if (insertError) {
        console.error("Failed to insert wallet:", insertError);
        return {
          success: false,
          error: {
            code: "INSERT_FAILED",
            message: "Failed to add wallet",
            hint: insertError.message,
          },
        };
      }

      console.log("=== WALLET CONNECTED (AUTHENTICATED MODE) ===");
      console.log("Wallet added to database for user:", profile.public_user_id);
      
      // Trigger custom event for dashboard to reload
      window.dispatchEvent(new CustomEvent('walletDatabaseChange', { detail: { address, userId: profile.public_user_id } }));
      console.log("Custom walletDatabaseChange event dispatched");

      return {
        success: true,
        walletBootstrap: false,
      };
    } catch (error: unknown) {
      console.error("=== WALLET CONNECTION ERROR ===");
      console.error("Error details:", error);
      console.error("Error type:", typeof error);
      console.error("Error message:", error instanceof Error ? error.message : "Unknown error");
      
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      // Map common errors to friendly messages
      let code = "CONNECTION_FAILED";
      let message = "Failed to connect wallet";
      let hint = "Please try again";

      if (errorMessage.includes("WALLET_NOT_INSTALLED")) {
        code = "WALLET_NOT_INSTALLED";
        message = `${walletProvider} wallet not found`;
        hint = `Please install the ${walletProvider} browser extension`;
      } else if (errorMessage.includes("User rejected")) {
        code = "USER_REJECTED";
        message = "Connection cancelled";
        hint = "Please approve the connection in your wallet";
      }

      return {
        success: false,
        error: { code, message, hint },
      };
    } finally {
      setConnecting(false);
      setProvider(null);
    }
  }, []);

  const addManualAddress = useCallback(async (address: string, label?: string): Promise<ConnectResult> => {
    setConnecting(true);

    try {
      const supabase = createSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();

      // For visitors (not authenticated), store in local storage only
      if (!user) {
        // Get existing addresses from localStorage
        const existingAddresses = JSON.parse(localStorage.getItem('visitor_addresses') || '[]');
        
        // Check if address already exists
        if (existingAddresses.some((w: { address: string }) => w.address === address)) {
          return {
            success: false,
            error: {
              code: "WALLET_EXISTS",
              message: "This address is already added",
            },
          };
        }

        // Add to local storage
        const newWallet = {
          address,
          label: label || "Manual Address",
          chain_id: "coreum-mainnet-1",
          read_only: false, // Visitor wallets are usable for viewing portfolio
          is_primary: existingAddresses.length === 0,
          added_at: new Date().toISOString(),
        };

        existingAddresses.push(newWallet);
        localStorage.setItem('visitor_addresses', JSON.stringify(existingAddresses));

        // Trigger custom event for same-window updates (storage event only fires in other tabs)
        window.dispatchEvent(new CustomEvent('walletStorageChange', { detail: { wallets: existingAddresses } }));

        return { success: true };
      }

      // For authenticated users, save to database
      // Get user's public_user_id - should exist from database trigger
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("public_user_id")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (!profile?.public_user_id) {
        // This should never happen if database trigger is working
        console.error("No user profile found - database trigger may not be set up");
        return {
          success: false,
          error: {
            code: "PROFILE_NOT_FOUND",
            message: "User profile not found. Please contact support or try signing out and back in.",
            hint: "Database trigger may not be configured. Check DATABASE-TRIGGER-SETUP.md",
          },
        };
      }

      // Check if wallet already exists
      const { data: existing } = await supabase
        .from("wallets")
        .select("id")
        .eq("address", address)
        .eq("public_user_id", profile.public_user_id)
        .maybeSingle();

      if (existing) {
        return {
          success: false,
          error: {
            code: "WALLET_EXISTS",
            message: "This address is already added",
          },
        };
      }

      // Check if this is the first wallet
      const { count } = await supabase
        .from("wallets")
        .select("id", { count: "exact", head: true })
        .eq("public_user_id", profile.public_user_id);

      const isPrimary = (count || 0) === 0;

      // Add wallet WITHOUT signature verification
      // Manual addresses are read-only and unverified by default
      const { error: insertError } = await supabase.from("wallets").insert({
        public_user_id: profile.public_user_id,
        address,
        label: label || "Manual Address",
        source: "manual",
        ownership_verified: false, // Not verified
        verified_at: null,
        created_at: new Date().toISOString(),
      });

      if (insertError) {
        return {
          success: false,
          error: {
            code: "INSERT_FAILED",
            message: "Failed to add address",
            hint: insertError.message,
          },
        };
      }

      console.log("=== MANUAL ADDRESS ADDED (AUTHENTICATED MODE) ===");
      console.log("Address added to database for user:", profile.public_user_id);
      
      // Trigger custom event for dashboard to reload
      window.dispatchEvent(new CustomEvent('walletDatabaseChange', { detail: { address, userId: profile.public_user_id } }));
      console.log("Custom walletDatabaseChange event dispatched");

      return { success: true };
    } catch (error) {
      console.error("Manual address error:", error);
      return {
        success: false,
        error: {
          code: "ADD_FAILED",
          message: "Failed to add address",
        },
      };
    } finally {
      setConnecting(false);
    }
  }, []);

  return {
    connectWallet,
    addManualAddress,
    connecting,
    provider,
  };
}

