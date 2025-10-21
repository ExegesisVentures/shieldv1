"use client";

import { useState, useCallback } from "react";
import { createSupabaseClient } from "@/utils/supabase/client";
import { keplrSignArbitrary } from "@/utils/wallet/keplr";
import { leapSignArbitrary } from "@/utils/wallet/leap";
import { cosmostationSignArbitrary } from "@/utils/wallet/cosmostation";
import { makeSignDoc } from "@/utils/wallet/adr36";
import { UiError } from "@/utils/errors";

type WalletProvider = "keplr" | "leap" | "cosmostation";

interface VerifyResult {
  success: boolean;
  error?: UiError;
}

/**
 * Hook for verifying wallet ownership via cryptographic signature
 * 
 * Use this when you need PROOF that user actually owns a wallet:
 * - Signing the PMA document
 * - Verifying Shield NFT ownership for Private tier
 * - Any action requiring "I actually own this wallet"
 * 
 * Do NOT use for basic wallet connection - that's useWalletConnect
 */
export function useVerifyWalletOwnership() {
  const [verifying, setVerifying] = useState(false);

  const verifyOwnership = useCallback(async (
    address: string,
    walletProvider: WalletProvider,
    purpose: "pma_signing" | "shield_nft_verification" | "private_tier_access"
  ): Promise<VerifyResult> => {
    setVerifying(true);

    try {
      console.log(`Verifying wallet ownership for: ${purpose}`);
      
      // Get signature function based on wallet provider
      let signFn: (address: string, message: string) => Promise<any>;
      
      switch (walletProvider) {
        case "keplr":
          signFn = keplrSignArbitrary;
          break;
        case "leap":
          signFn = leapSignArbitrary;
          break;
        case "cosmostation":
          signFn = cosmostationSignArbitrary;
          break;
        default:
          throw new Error("Unknown wallet provider");
      }

      // Request nonce from API
      const nonceResponse = await fetch(`/api/auth/wallet/nonce?address=${encodeURIComponent(address)}`);
      
      if (!nonceResponse.ok) {
        const errorData = await nonceResponse.json();
        return {
          success: false,
          error: errorData as UiError,
        };
      }

      const { nonce } = await nonceResponse.json();

      // Create sign document with purpose
      const signDoc = makeSignDoc(
        address,
        nonce,
        `ShieldNest: Verify wallet ownership for ${purpose.replace(/_/g, ' ')}`
      );

      // Request signature from wallet
      console.log("Requesting signature from wallet...");
      const signatureResult = await signFn(address, signDoc);

      // Verify signature with API
      const verifyResponse = await fetch("/api/auth/wallet/verify-ownership", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          signature: signatureResult.signature,
          nonce,
          purpose,
        }),
      });

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json();
        return {
          success: false,
          error: errorData as UiError,
        };
      }

      const result = await verifyResponse.json();

      console.log("✅ Wallet ownership verified successfully");
      return {
        success: true,
      };
    } catch (error: unknown) {
      console.error("Wallet verification error:", error);
      
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      // Map common errors to friendly messages
      let code = "VERIFICATION_FAILED";
      let message = "Failed to verify wallet ownership";
      let hint = "Please try again";

      if (errorMessage.includes("WALLET_NOT_INSTALLED")) {
        code = "WALLET_NOT_INSTALLED";
        message = `${walletProvider} wallet not found`;
        hint = `Please install the ${walletProvider} browser extension`;
      } else if (errorMessage.includes("User rejected") || errorMessage.includes("Request rejected")) {
        code = "USER_REJECTED";
        message = "Verification cancelled";
        hint = "You must approve the signature request to verify ownership";
      }

      return {
        success: false,
        error: { code, message, hint },
      };
    } finally {
      setVerifying(false);
    }
  }, []);

  return {
    verifyOwnership,
    verifying,
  };
}
