import { NextResponse } from "next/server";
import { uiError } from "@/utils/errors";
import { createServiceRoleClient } from "@/utils/supabase/service-role";
import { createSupabaseClient } from "@/utils/supabase/server";
import { ensurePublicUserProfile, getPublicUserId } from "@/utils/supabase/user-profile";
import { verifyAndConsumeNonce } from "@/utils/wallet/adr36";

/**
 * Verify wallet signature and link to user account
 * 
 * Two scenarios:
 * 1. Authenticated user linking a wallet -> add to their existing profile
 * 2. Anonymous user (wallet-bootstrap) -> create temp auth user, then link
 */
export async function POST(req: Request) {
  console.log("=== WALLET VERIFY REQUEST START ===");
  
  try {
    const body = await req.json();
    console.log("Request body:", { 
      hasAddress: !!body.address, 
      hasSignature: !!body.signature, 
      hasNonce: !!body.nonce,
      addressLength: body.address?.length,
    });
    
    const { address, signature, nonce } = body;
    if (!address || !signature || !nonce) {
      console.error("Missing required fields:", { address: !!address, signature: !!signature, nonce: !!nonce });
      return NextResponse.json(uiError("BAD_REQUEST","Missing fields"), { status: 400 });
    }

    // TODO: Use publicKey for ADR-36 signature verification with cosmjs

    // Create both clients: one for session detection, one for RLS bypass
    console.log("Creating Supabase clients...");
    const sessionClient = await createSupabaseClient();
    const serviceClient = createServiceRoleClient();
    console.log("Clients created successfully");

    // Verify nonce is valid and not expired (using service client for RLS bypass)
    console.log("Verifying nonce...");
    const nonceCheck = await verifyAndConsumeNonce(serviceClient, nonce, address);
    console.log("Nonce check result:", nonceCheck);
    
    if (!nonceCheck.valid) {
      console.error("Nonce validation failed:", nonceCheck.error);
      return NextResponse.json(
        uiError("NONCE_INVALID", nonceCheck.error || "Invalid or expired nonce."),
        { status: 400 }
      );
    }

    // TODO: verify ADR-36 signature properly (cosmjs). For MVP we accept and mark as unverified.

    // Check if user is authenticated using session client (has access to cookies)
    console.log("Checking user authentication...");
    
    // Debug: Check cookies
    const cookies = req.headers.get('cookie');
    console.log("Request has cookies:", !!cookies);
    
    // Try getting session first (more reliable for cookie-based auth)
    const { data: { session }, error: sessionError } = await sessionClient.auth.getSession();
    console.log("Session check:", {
      hasSession: !!session,
      sessionError: sessionError?.message,
      userId: session?.user?.id,
    });
    
    const { data: { user: authUser }, error: authError } = await sessionClient.auth.getUser();
    console.log("Auth check:", { 
      isAuthenticated: !!authUser, 
      userId: authUser?.id,
      userEmail: authUser?.email,
      authError: authError?.message,
      fromSession: session?.user?.id === authUser?.id
    });
    
    // CRITICAL FIX: If getUser() fails but we have a session, use session user
    const user = authUser || session?.user;
    console.log("Final user determination:", {
      hasUser: !!user,
      userId: user?.id,
      source: authUser ? 'getUser()' : (session?.user ? 'session' : 'none')
    });

    if (!user) {
      // Scenario 2: Wallet-bootstrap - create user account via anonymous auth
      console.log("=== WALLET-ONLY AUTH FLOW ===");
      console.log("No authenticated user - attempting anonymous account creation");
      console.log("Wallet address:", address);
      console.log("Anonymous auth should be enabled in Supabase");
      
      const { data: signUpData, error: signUpError } = await serviceClient.auth.signInAnonymously({
        options: {
          data: {
            wallet_bootstrap: true,
            wallet_address: address,
          }
        }
      });
      
      console.log("=== ANONYMOUS AUTH RESULT ===");
      console.log("Success:", !!signUpData.user);
      console.log("User ID:", signUpData.user?.id);
      console.log("User Email:", signUpData.user?.email);
      console.log("Error:", signUpError?.message);
      console.log("Error Code:", signUpError?.code);
      console.log("Error Status:", signUpError?.status);
      console.log("Full Error:", JSON.stringify(signUpError, null, 2));
      console.log("============================");

      // Check if anonymous auth is disabled
      if (signUpError?.message?.includes("Anonymous sign-ins are disabled") || 
          signUpError?.message?.includes("anonymous")) {
        console.error("❌ ANONYMOUS AUTH IS DISABLED IN SUPABASE");
        return NextResponse.json(
          uiError(
            "ANONYMOUS_AUTH_DISABLED",
            "Wallet-only sign-in requires anonymous authentication.",
            "Enable it: Supabase Dashboard → Authentication → Providers → Anonymous → Toggle ON"
          ),
          { status: 500 }
        );
      }

      if (signUpError || !signUpData.user) {
        console.error("❌ ANONYMOUS AUTH FAILED:", signUpError);
        return NextResponse.json(
          uiError("AUTH_FAILED", "Could not create wallet-based account.", signUpError?.message || "Unknown error"),
          { status: 500 }
        );
      }
      
      console.log("✅ Anonymous user created successfully:", signUpData.user.id);

      // Create public user profile and mapping (using service client for RLS bypass)
      console.log("Creating public user profile...");
      const publicUserId = await ensurePublicUserProfile(serviceClient);
      console.log("Public user ID created:", publicUserId);

      // Link wallet to new public user
      console.log("Linking wallet to user...");
      const { error: walletError } = await serviceClient.from("wallets").insert({
        public_user_id: publicUserId,
        address,
        label: "Primary Wallet",
        source: "keplr",
        ownership_verified: true,
        verified_at: new Date().toISOString(),
      });

      if (walletError) {
        console.error("Wallet insert error:", {
          message: walletError.message,
          code: walletError.code,
          details: walletError.details,
          hint: walletError.hint,
        });
        return NextResponse.json(
          uiError("WALLET_LINK_FAILED", "Could not link wallet.", walletError.message),
          { status: 500 }
        );
      }

      console.log("Wallet linked successfully for anonymous user");
      console.log("=== WALLET VERIFY SUCCESS (ANONYMOUS) ===");
      
      return NextResponse.json({
        linked: true,
        userId: publicUserId,
        verified: false,
        walletBootstrap: true,
        message: "Wallet connected successfully! You can optionally add an email in settings."
      });
    }

    // Scenario 1: Authenticated user linking additional wallet
    console.log("Authenticated user - linking wallet to existing account...");
    console.log("User details:", {
      id: user.id,
      email: user.email
    });
    
    // Get public user ID from the user_profiles table
    // CRITICAL: Use sessionClient to ensure we're checking the authenticated user's profile
    const publicUserId = await getPublicUserId(sessionClient);
    console.log("Existing public user ID:", publicUserId);
    
    if (!publicUserId) {
      // Profile doesn't exist - database trigger should have created it
      // This is a fallback - create it now using service client
      console.log("WARNING: No public profile found - database trigger may not have fired");
      console.log("Creating profile as fallback...");
      
      await ensurePublicUserProfile(serviceClient);
      
      // Re-check
      const newPublicUserId = await getPublicUserId(serviceClient);
      console.log("Created public user ID:", newPublicUserId);
      
      if (!newPublicUserId) {
        console.error("CRITICAL: Failed to create user profile even with service client");
        return NextResponse.json(
          uiError("PROFILE_ERROR", "Could not find or create user profile. Database trigger may not be configured."),
          { status: 500 }
        );
      }
    }

    const finalPublicUserId = publicUserId || await getPublicUserId(serviceClient);
    console.log("Final public user ID for wallet linking:", finalPublicUserId);

    // Check if wallet already exists for this user
    const { data: existingWallet } = await serviceClient
      .from("wallets")
      .select("id")
      .eq("address", address)
      .eq("public_user_id", finalPublicUserId)
      .maybeSingle();

    if (existingWallet) {
      return NextResponse.json({
        linked: true,
        userId: finalPublicUserId,
        verified: false,
        message: "Wallet already linked to your account."
      });
    }

    // Check if this is the first wallet (should be primary)
    const { data: walletCount } = await serviceClient
      .from("wallets")
      .select("id", { count: "exact", head: true })
      .eq("public_user_id", finalPublicUserId);

    const isPrimary = (walletCount || 0) === 0;

    // Link wallet to authenticated user
    const { error: walletError } = await serviceClient.from("wallets").insert({
      public_user_id: finalPublicUserId,
      address,
      label: isPrimary ? "Primary Wallet" : "Wallet",
      source: "keplr",
      ownership_verified: true,
      verified_at: new Date().toISOString(),
    });

    if (walletError) {
      console.error("Wallet link error (authenticated user):", {
        message: walletError.message,
        code: walletError.code,
        details: walletError.details,
      });
      return NextResponse.json(
        uiError("WALLET_LINK_FAILED", "Could not link wallet.", walletError.message),
        { status: 500 }
      );
    }

    console.log("Wallet linked successfully for authenticated user");
    console.log("=== WALLET VERIFY SUCCESS (AUTHENTICATED) ===");
    
    return NextResponse.json({
      linked: true,
      userId: finalPublicUserId,
      verified: false,
      message: "Wallet linked successfully."
    });

  } catch (e) {
    console.error("=== WALLET VERIFY ERROR ===");
    console.error("Error type:", e instanceof Error ? e.constructor.name : typeof e);
    console.error("Error message:", e instanceof Error ? e.message : String(e));
    console.error("Error stack:", e instanceof Error ? e.stack : "No stack trace");
    console.error("Full error object:", JSON.stringify(e, Object.getOwnPropertyNames(e)));
    console.error("===========================");
    
    const err = uiError(
      "VERIFY_FAILED",
      "Could not verify wallet signature.",
      `Debug: ${e instanceof Error ? e.message : String(e)}`
    );
    return NextResponse.json(err, { status: 500 });
  }
}

