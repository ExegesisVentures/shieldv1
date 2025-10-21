/**
 * Simplified Wallet Connect Hook
 * 
 * Replaces the complex useWalletConnect with simple wallet connection
 * that works for both authenticated and anonymous users
 */

import { useState, useCallback } from "react";
import { connectWallet, type WalletConnectionResult } from "@/utils/wallet/simplified-operations";
import { showToast } from "@/utils/address-utils";
import { isValidCoreumAddress } from "@/utils/address-utils";
import { createSupabaseClient } from "@/utils/supabase/client";

export interface UseSimplifiedWalletConnectReturn {
  connecting: boolean;
  provider: string | null;
  connectKeplr: () => Promise<WalletConnectionResult>;
  connectLeap: () => Promise<WalletConnectionResult>;
  connectCosmostation: () => Promise<WalletConnectionResult>;
  addManualAddress: (address: string, label?: string) => Promise<WalletConnectionResult>;
  // Account found modal state
  showAccountFoundModal: boolean;
  showMiniPrompt: boolean;
  accountFoundData: {
    userEmail: string | null;
    walletAddress: string;
  } | null;
  closeAccountFoundModal: () => void;
  closeMiniPrompt: () => void;
  signInToAccount: () => Promise<void>;
  viewThisWalletOnly: () => void;
  // Welcome back overlay state
  showWelcomeOverlay: boolean;
  welcomeEmail: string | null;
}

export function useSimplifiedWalletConnect(): UseSimplifiedWalletConnectReturn {
  const [connecting, setConnecting] = useState(false);
  const [provider, setProvider] = useState<string | null>(null);
  
  // Account found modal state
  const [showAccountFoundModal, setShowAccountFoundModal] = useState(false);
  const [showMiniPrompt, setShowMiniPrompt] = useState(false);
  const [accountFoundData, setAccountFoundData] = useState<{
    userEmail: string | null;
    walletAddress: string;
  } | null>(null);
  
  // Welcome back overlay state
  const [showWelcomeOverlay, setShowWelcomeOverlay] = useState(false);
  const [welcomeEmail, setWelcomeEmail] = useState<string | null>(null);


  // Modal handler functions
  const closeAccountFoundModal = useCallback(() => {
    setShowAccountFoundModal(false);
    
    // After closing big modal, show mini prompt (unless already dismissed)
    const permanentlyDismissed = sessionStorage.getItem('mini_prompt_permanently_dismissed');
    const accountPromptDismissed = sessionStorage.getItem('account_prompt_dismissed');
    
    if (!permanentlyDismissed && !accountPromptDismissed) {
      // Show mini prompt after a short delay
      setTimeout(() => {
        setShowMiniPrompt(true);
      }, 2000);
    }
  }, []);

  const autoSignInWithWallet = useCallback(async (walletAddress: string, userEmail: string | null) => {
    console.log("🚀 [AutoSignIn] Starting SIGNATURE-FREE wallet sign-in for:", walletAddress);
    console.log("🔓 [AutoSignIn] No signature required - just Keplr approval!");
    
    try {
      // Get hashed token from backend
      console.log("🔐 [AutoSignIn] Requesting auth token...");
      const signInResponse = await fetch("/api/auth/wallet/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: walletAddress,
        }),
      });

      if (!signInResponse.ok) {
        const errorData = await signInResponse.json();
        throw new Error(errorData.message || errorData.error || "Authentication failed");
      }

      const signInData = await signInResponse.json();
      console.log("✅ [AutoSignIn] Token received for:", signInData.email);

      // Verify the hashed token with Supabase
      const supabase = createSupabaseClient();
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: signInData.email,
        token: signInData.hashedToken,
        type: 'magiclink'
      });

      if (verifyError) {
        console.error("❌ [AutoSignIn] Failed to verify token:", verifyError);
        throw verifyError;
      }

      console.log("✅ [AutoSignIn] Session established successfully!");

      // Show success message
      const displayName = userEmail || signInData.email || "there";
      showToast(`Welcome back, ${displayName}! 🎉`, "success");
      
      // Hide overlay
      setShowWelcomeOverlay(false);
      
      // Dispatch event to refresh dashboard
      window.dispatchEvent(new Event('walletDatabaseChange'));

    } catch (error) {
      console.error("❌ [AutoSignIn] Error:", error);
      setShowWelcomeOverlay(false);
      throw error; // Re-throw so caller can handle
    }
  }, []);

  const signInToAccount = useCallback(async () => {
    console.log("🚀 [SignIn] signInToAccount function called!");
    console.log("🚀 [SignIn] accountFoundData:", accountFoundData);
    
    if (!accountFoundData) {
      console.error("❌ [SignIn] No accountFoundData, aborting");
      return;
    }

    try {
      const walletAddress = accountFoundData.walletAddress;
      console.log("🔐 [SignIn] Starting wallet sign-in for:", walletAddress);
      
      showToast("Signing you in...", "success");
      
      // Get hashed token from backend
      const signInResponse = await fetch("/api/auth/wallet/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: walletAddress,
        }),
      });

      if (!signInResponse.ok) {
        const errorData = await signInResponse.json();
        console.error("❌ Sign-in failed:", errorData);
        showToast(errorData.message || errorData.error || "Sign-in failed", "error");
        return;
      }

      const signInData = await signInResponse.json();
      console.log("✅ [SignIn] Action link received for:", signInData.email);
      console.log("🔗 [SignIn] Navigating to:", signInData.actionLink);

      // Close modal
      closeAccountFoundModal();
      
      // Navigate to the action link to establish session
      showToast("Signing you in...", "success");
      
      setTimeout(() => {
        window.location.href = signInData.actionLink;
      }, 300);
      
    } catch (error) {
      console.error("❌ [SignIn] Error:", error);
      showToast("Sign-in failed. Please try again.", "error");
    }
  }, [accountFoundData, closeAccountFoundModal]);

  const closeMiniPrompt = useCallback(() => {
    setShowMiniPrompt(false);
  }, []);

  const viewThisWalletOnly = useCallback(async () => {
    console.log("🚀 [ViewOnly] viewThisWalletOnly function called!");
    console.log("🚀 [ViewOnly] accountFoundData:", accountFoundData);
    
    if (!accountFoundData) {
      console.error("❌ [ViewOnly] No accountFoundData, aborting");
      return;
    }
    
    console.log("👁️ [ViewOnly] User chose to view this wallet only, address:", accountFoundData.walletAddress);
    
    // Mark that user chose to view wallet only (don't show save prompt)
    sessionStorage.setItem('viewWalletOnly', 'true');
    sessionStorage.setItem('viewWalletAddress', accountFoundData.walletAddress);
    
    // Save wallet to localStorage temporarily
    try {
      console.log("➕ [ViewOnly] Adding wallet to temporary view...");
      const result = await connectWallet(accountFoundData.walletAddress, "Keplr", "keplr");
      console.log("✅ [ViewOnly] Wallet added for viewing:", result);
      
      console.log("🔄 [ViewOnly] Closing modal...");
      closeAccountFoundModal();
      
      // Dispatch event to notify parent modal and dashboard
      console.log("📢 [ViewOnly] Dispatching walletConnectedAsGuest event");
      window.dispatchEvent(new CustomEvent('walletConnectedAsGuest', {
        detail: { address: accountFoundData.walletAddress }
      }));
      
      // Navigate to dashboard (not reload current page!)
      console.log("🎯 [ViewOnly] Navigating to dashboard...");
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 300);
    } catch (error) {
      console.error("❌ [ViewOnly] Failed to add wallet:", error);
      closeAccountFoundModal();
      showToast("Failed to add wallet", "error");
    }
  }, [accountFoundData, closeAccountFoundModal]);

  const connectKeplr = useCallback(async (): Promise<WalletConnectionResult> => {
    setConnecting(true);
    setProvider("keplr");

    try {
      // Check if Keplr is installed
      if (!window.keplr) {
        return {
          success: false,
          error: {
            code: 'WALLET_NOT_INSTALLED',
            message: 'Keplr wallet is not installed',
            hint: 'Please install Keplr wallet extension and try again'
          }
        };
      }

      // Enable Keplr for Coreum
      await window.keplr.enable("coreum-mainnet-1");

      // Get the offline signer
      const offlineSigner = window.keplr.getOfflineSigner("coreum-mainnet-1");
      const accounts = await offlineSigner.getAccounts();

      if (accounts.length === 0) {
        return {
          success: false,
          error: {
            code: 'NO_ACCOUNTS',
            message: 'No accounts found in Keplr wallet',
            hint: 'Please create or import an account in Keplr wallet'
          }
        };
      }

      const address = accounts[0].address;
      console.log("🔍 [Keplr] Got address:", address);
      
      // STEP 1: Check if user is ALREADY authenticated (persistent session)
      console.log("🔐 [Keplr] Checking for existing authenticated session...");
      const supabase = createSupabaseClient();
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (currentUser) {
        console.log("✅ [Keplr] User already authenticated:", currentUser.email || currentUser.id);
        console.log("🔍 [Keplr] Checking if this wallet belongs to current user...");
        
        // Check if wallet belongs to this user's account
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("public_user_id")
          .eq("auth_user_id", currentUser.id)
          .maybeSingle();
        
        if (profile?.public_user_id) {
          const { data: existingWallet } = await supabase
            .from("wallets")
            .select("id, public_user_id")
            .eq("address", address)
            .eq("public_user_id", profile.public_user_id)
            .maybeSingle();
          
          if (existingWallet) {
            console.log("🎉 [Keplr] Wallet already in authenticated user's account! No signature needed.");
            // Just add to localStorage for this session - no signature needed!
            const result = await connectWallet(address, "Keplr", "keplr");
            showToast("Wallet reconnected!", "success");
            return {
              success: true,
              wallet: { address, label: "Keplr" },
            };
          } else {
            console.log("➕ [Keplr] New wallet for authenticated user, adding to account...");
            // Add to database for authenticated user (no signature needed since they're already logged in)
            const { error: insertError } = await supabase
              .from("wallets")
              .insert({
                public_user_id: profile.public_user_id,
                address: address,
                label: "Keplr",
                source: "keplr",
                ownership_verified: false, // Can verify later if needed
              });
            
            if (!insertError) {
              const result = await connectWallet(address, "Keplr", "keplr");
              showToast("New wallet added to account!", "success");
              return {
                success: true,
                wallet: { address, label: "Keplr" },
              };
            } else {
              console.error("❌ [Keplr] Failed to add wallet to account:", insertError);
              // Fall through to normal flow
            }
          }
        }
      } else {
        console.log("👤 [Keplr] No authenticated session found, checking wallet registration...");
      }
      
      // STEP 2: Just connect the wallet - let user view it without signing in
      // They can sign in later if they want more features
      console.log("➕ [Keplr] Adding wallet for viewing...");
      const result = await connectWallet(address, "Keplr", "keplr");
      console.log("✅ [Keplr] Wallet connected for viewing:", result);
      
      // Set flag so we don't show "Save Portfolio" prompt
      sessionStorage.setItem('viewWalletOnly', 'true');
      sessionStorage.setItem('viewWalletAddress', address);
      
      return result;

    } catch (error) {
      console.error("Keplr connection error:", error);
      return {
        success: false,
        error: {
          code: 'CONNECTION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to connect Keplr wallet',
          hint: 'Please make sure Keplr is unlocked and try again'
        }
      };
    } finally {
      setConnecting(false);
      setProvider(null);
    }
  }, [setAccountFoundData, setShowAccountFoundModal]);

  const connectLeap = useCallback(async (): Promise<WalletConnectionResult> => {
    setConnecting(true);
    setProvider("leap");

    try {
      // Check if Leap is installed
      if (!window.leap) {
        return {
          success: false,
          error: {
            code: 'WALLET_NOT_INSTALLED',
            message: 'Leap wallet is not installed',
            hint: 'Please install Leap wallet extension and try again'
          }
        };
      }

      // Enable Leap for Coreum
      await window.leap.enable("coreum-mainnet-1");

      // Get the offline signer
      const offlineSigner = window.leap.getOfflineSigner("coreum-mainnet-1");
      const accounts = await offlineSigner.getAccounts();

      if (accounts.length === 0) {
        return {
          success: false,
          error: {
            code: 'NO_ACCOUNTS',
            message: 'No accounts found in Leap wallet',
            hint: 'Please create or import an account in Leap wallet'
          }
        };
      }

      const address = accounts[0].address;
      console.log("🔍 [Leap] Got address:", address);
      
      // Check FIRST if this wallet belongs to an account
      console.log("🔍 [Leap] Checking if wallet is registered...");
      const checkRes = await fetch("/api/auth/wallet/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });

      console.log("🔍 [Leap] Check response status:", checkRes.status);

      if (checkRes.ok) {
        const checkData = await checkRes.json();
        console.log("🔍 [Leap] Check data:", checkData);
        
        if (checkData?.exists && checkData?.user?.id) {
          // Wallet belongs to an account - show sign-in modal
          console.log("🎯 [Leap] Wallet IS registered! Showing modal...");
          setAccountFoundData({
            userEmail: checkData.user.email || null,
            walletAddress: address,
          });
          setShowAccountFoundModal(true);
          
          console.log("✅ [Leap] Modal state set, returning success");
          // Don't add wallet yet - wait for user to sign in or choose guest
          return {
            success: true,
            wallet: { address, label: "Leap" },
            showingModal: true // Tell parent modal to stay open
          };
        } else {
          console.log("ℹ️ [Leap] Wallet not registered or no user data");
        }
      }
      
      // Wallet doesn't belong to an account OR user chose guest - add it now
      console.log("➕ [Leap] Adding wallet to localStorage...");
      const result = await connectWallet(address, "Leap", "leap");
      console.log("✅ [Leap] connectWallet result:", result);
      return result;

    } catch (error) {
      console.error("Leap connection error:", error);
      return {
        success: false,
        error: {
          code: 'CONNECTION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to connect Leap wallet',
          hint: 'Please make sure Leap is unlocked and try again'
        }
      };
    } finally {
      setConnecting(false);
      setProvider(null);
    }
  }, [setAccountFoundData, setShowAccountFoundModal]);

  const connectCosmostation = useCallback(async (): Promise<WalletConnectionResult> => {
    setConnecting(true);
    setProvider("cosmostation");

    try {
      // Check if Cosmostation is installed
      if (!window.cosmostation) {
        return {
          success: false,
          error: {
            code: 'WALLET_NOT_INSTALLED',
            message: 'Cosmostation wallet is not installed',
            hint: 'Please install Cosmostation wallet extension and try again'
          }
        };
      }

      // Enable Cosmostation for Coreum
      await window.cosmostation.cosmos.request({
        method: "cos_requestAccount",
        params: { chainName: "coreum" }
      });

      // Get account info
      const account = await window.cosmostation.cosmos.request({
        method: "cos_account",
        params: { chainName: "coreum" }
      });

      if (!account?.address) {
        return {
          success: false,
          error: {
            code: 'NO_ACCOUNTS',
            message: 'No accounts found in Cosmostation wallet',
            hint: 'Please create or import an account in Cosmostation wallet'
          }
        };
      }

      console.log("🔍 [Cosmostation] Got address:", account.address);
      
      // Check FIRST if this wallet belongs to an account
      console.log("🔍 [Cosmostation] Checking if wallet is registered...");
      const checkRes = await fetch("/api/auth/wallet/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: account.address }),
      });

      console.log("🔍 [Cosmostation] Check response status:", checkRes.status);

      if (checkRes.ok) {
        const checkData = await checkRes.json();
        console.log("🔍 [Cosmostation] Check data:", checkData);
        
        if (checkData?.exists && checkData?.user?.id) {
          // Wallet belongs to an account - show sign-in modal
          console.log("🎯 [Cosmostation] Wallet IS registered! Showing modal...");
          setAccountFoundData({
            userEmail: checkData.user.email || null,
            walletAddress: account.address,
          });
          setShowAccountFoundModal(true);
          
          console.log("✅ [Cosmostation] Modal state set, returning success");
          // Don't add wallet yet - wait for user to sign in or choose guest
          return {
            success: true,
            wallet: { address: account.address, label: "Cosmostation" },
            showingModal: true // Tell parent modal to stay open
          };
        } else {
          console.log("ℹ️ [Cosmostation] Wallet not registered or no user data");
        }
      }
      
      // Wallet doesn't belong to an account OR user chose guest - add it now
      console.log("➕ [Cosmostation] Adding wallet to localStorage...");
      const result = await connectWallet(account.address, "Cosmostation", "cosmostation");
      console.log("✅ [Cosmostation] connectWallet result:", result);
      return result;

    } catch (error) {
      console.error("Cosmostation connection error:", error);
      return {
        success: false,
        error: {
          code: 'CONNECTION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to connect Cosmostation wallet',
          hint: 'Please make sure Cosmostation is unlocked and try again'
        }
      };
    } finally {
      setConnecting(false);
      setProvider(null);
    }
  }, [setAccountFoundData, setShowAccountFoundModal]);

  const addManualAddress = useCallback(async (
    address: string, 
    label?: string
  ): Promise<WalletConnectionResult> => {
    setConnecting(true);
    setProvider("manual");

    try {
      // Validate address format (normalize to lowercase for bech32)
      const normalized = address.trim().toLowerCase();
      if (!isValidCoreumAddress(normalized)) {
        return {
          success: false,
          error: {
            code: 'INVALID_ADDRESS',
            message: 'Invalid Coreum address format',
            hint: 'Please enter a valid Coreum address that starts with "core1" (lowercase)'
          }
        };
      }

      // Add wallet using simplified operations
      const result = await connectWallet(
        normalized, 
        label || `Manual Address ${address.slice(0, 10)}...`,
        "manual"
      );
      return result;

    } catch (error) {
      console.error("Manual address error:", error);
      return {
        success: false,
        error: {
          code: 'CONNECTION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to add manual address',
          hint: 'Please check the address format and try again'
        }
      };
    } finally {
      setConnecting(false);
      setProvider(null);
    }
  }, []);

  return {
    connecting,
    provider,
    connectKeplr,
    connectLeap,
    connectCosmostation,
    addManualAddress,
    // Account found modal state
    showAccountFoundModal,
    showMiniPrompt,
    accountFoundData,
    closeAccountFoundModal,
    closeMiniPrompt,
    signInToAccount,
    viewThisWalletOnly,
    // Welcome back overlay state
    showWelcomeOverlay,
    welcomeEmail,
  };
}

// Extend the Window interface for wallet types
declare global {
  interface Window {
    keplr?: any;
    leap?: any;
    cosmostation?: any;
  }
}
