import { NextResponse } from "next/server";
import { uiError } from "@/utils/errors";
import { createServiceRoleClient } from "@/utils/supabase/service-role";
import { verifyAndConsumeNonce } from "@/utils/wallet/adr36";
import { verifyADR36Signature } from "@/utils/coreum/rpc";

/**
 * Sign in using wallet signature
 * This creates an authenticated session for users who have already registered their wallet
 * 
 * File: /app/api/auth/wallet/sign-in/route.ts
 */
export async function POST(req: Request) {
  console.log("\n========================================");
  console.log("🔐 [API] WALLET SIGN-IN REQUEST START");
  console.log("========================================");
  console.log("⏰ [API] Timestamp:", new Date().toISOString());
  
  try {
    console.log("📥 [API] Parsing request body...");
    const body = await req.json();
    console.log("✅ [API] Request body parsed successfully");
    console.log("📦 [API] Request details:", { 
      hasAddress: !!body.address, 
      hasSignature: !!body.signature, 
      hasNonce: !!body.nonce,
      addressLength: body.address?.length,
      signatureLength: body.signature?.length,
      nonceLength: body.nonce?.length,
    });
    
    const { address, signature, nonce } = body;
    
    if (!address || !signature || !nonce) {
      console.error("Missing required fields:", { address: !!address, signature: !!signature, nonce: !!nonce });
      return NextResponse.json(
        uiError("BAD_REQUEST", "Missing required fields: address, signature, nonce"),
        { status: 400 }
      );
    }

    console.log("Sign-in attempt for wallet:", address);

    // Create clients
    const serviceClient = createServiceRoleClient();

    // Verify nonce is valid and not expired
    console.log("Verifying nonce...");
    const nonceCheck = await verifyAndConsumeNonce(serviceClient, nonce, address);
    
    if (!nonceCheck.valid) {
      console.error("Nonce validation failed:", nonceCheck.error);
      return NextResponse.json(
        uiError("NONCE_INVALID", nonceCheck.error || "Invalid or expired nonce"),
        { status: 400 }
      );
    }

    // Verify signature cryptographically
    console.log("Verifying signature...");
    const isValidSignature = await verifyADR36Signature(address, signature, nonce);
    
    if (!isValidSignature) {
      console.error("Signature verification failed");
      return NextResponse.json(
        uiError("INVALID_SIGNATURE", "Signature verification failed", "Please try signing again"),
        { status: 400 }
      );
    }

    console.log("✅ Signature verified successfully");

    // Find the wallet in database
    const { data: wallet, error: walletError } = await serviceClient
      .from("wallets")
      .select("id, public_user_id")
      .eq("address", address)
      .maybeSingle();

    if (walletError || !wallet) {
      console.error("Wallet not found:", walletError);
      return NextResponse.json(
        uiError("WALLET_NOT_FOUND", "This wallet is not registered", "Please sign up first"),
        { status: 404 }
      );
    }

    console.log("Wallet found:", wallet.id);

    // Get user profile
    const { data: profile, error: profileError } = await serviceClient
      .from("user_profiles")
      .select("auth_user_id")
      .eq("public_user_id", wallet.public_user_id)
      .maybeSingle();

    if (profileError || !profile) {
      console.error("User profile not found:", profileError);
      return NextResponse.json(
        uiError("PROFILE_NOT_FOUND", "User profile not found", "Please contact support"),
        { status: 404 }
      );
    }

    console.log("User profile found:", profile.auth_user_id);

    // Get the user's auth details to create a session
    const { data: { user: authUser }, error: authError } = await serviceClient.auth.admin.getUserById(profile.auth_user_id);

    if (authError || !authUser) {
      console.error("Auth user not found:", authError);
      return NextResponse.json(
        uiError("USER_NOT_FOUND", "User account not found", "Please contact support"),
        { status: 404 }
      );
    }

    console.log("Auth user found:", authUser.email || authUser.id);

    // Update wallet's ownership_verified status
    await serviceClient
      .from("wallets")
      .update({
        ownership_verified: true,
        verified_at: new Date().toISOString(),
      })
      .eq("id", wallet.id);

    // Ensure wallet is properly linked to user's portfolio
    // This handles cases where wallet was registered but not properly added to portfolio
    const { data: walletInPortfolio } = await serviceClient
      .from("wallets")
      .select("id")
      .eq("public_user_id", wallet.public_user_id)
      .eq("address", address)
      .maybeSingle();

    if (!walletInPortfolio) {
      console.log("Wallet not in user's portfolio, adding it now...");
      await serviceClient
        .from("wallets")
        .insert({
          public_user_id: wallet.public_user_id,
          address,
          label: "Primary Wallet",
          source: "wallet_signin",
          ownership_verified: true,
          verified_at: new Date().toISOString(),
        });
      console.log("✅ Wallet added to user's portfolio");
    }

    // Create a proper session for the user
    console.log("Creating authentication session for user...");
    
    try {
      // Use admin API to create an OTP that can be used to sign in
      // This is better than magic links for programmatic sign-in
      const redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard`;
      console.log("📍 Setting redirect destination:", redirectUrl);
      
      const { data: otpData, error: otpError } = await serviceClient.auth.admin.generateLink({
        type: 'magiclink',
        email: authUser.email || `wallet-${authUser.id}@shieldnest.local`,
        options: {
          redirectTo: redirectUrl
        }
      });

      if (otpError || !otpData) {
        console.error("Failed to generate auth link:", otpError);
        
        // Fallback: Return success and tell client to redirect with userId
        return NextResponse.json({
          success: true,
          message: "Authentication successful",
          user: {
            id: authUser.id,
            email: authUser.email,
          },
          redirectUrl: `/api/auth/wallet/session-redirect?userId=${authUser.id}`,
        });
      }

      console.log("✅ Auth link generated");

      // Extract the action link which contains session tokens
      const actionLink = otpData.properties.action_link;
      console.log("📍 Action link:", actionLink);

      // Return the action link for the client to navigate to
      // This will establish the session automatically via Supabase SDK
      const response = {
        success: true,
        message: "Authentication successful",
        user: {
          id: authUser.id,
          email: authUser.email,
        },
        redirectUrl: actionLink, // Direct navigation to this URL will authenticate
      };
      
      console.log("📤 Sending sign-in response with redirectUrl");
      return NextResponse.json(response);

    } catch (sessionError) {
      console.error("Session creation error:", sessionError);
      
      // Fallback: Return success with redirect to session helper
      return NextResponse.json({
        success: true,
        message: "Authentication successful",
        user: {
          id: authUser.id,
          email: authUser.email,
        },
        redirectUrl: `/api/auth/wallet/session-redirect?userId=${authUser.id}`,
      });
    }

  } catch (error) {
    console.error("Wallet sign-in error:", error);
    return NextResponse.json(
      uiError("INTERNAL_ERROR", "An unexpected error occurred"),
      { status: 500 }
    );
  }
}

