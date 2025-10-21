import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/utils/supabase/service-role";
import { verifyAndConsumeNonce } from "@/utils/wallet/adr36";
import { verifyADR36Signature } from "@/utils/coreum/rpc";
import { uiError } from "@/utils/errors";

/**
 * Verify wallet ownership via cryptographic signature
 * 
 * This endpoint is ONLY for proving ownership, not for basic wallet connection.
 * Use this when user needs to prove they own a wallet for:
 * - Signing PMA documents
 * - Verifying Shield NFT ownership
 * - Accessing Private tier features
 */
export async function POST(req: Request) {
  console.log("=== WALLET OWNERSHIP VERIFICATION START ===");

  try {
    const { address, signature, nonce, purpose } = await req.json();

    if (!address || !signature || !nonce) {
      return NextResponse.json(
        uiError("INVALID_REQUEST", "Missing required fields: address, signature, or nonce"),
        { status: 400 }
      );
    }

    console.log("Verifying ownership for address:", address);
    console.log("Purpose:", purpose || "general_verification");

    // Verify and consume nonce
    const supabase = createServiceRoleClient();
    const nonceResult = await verifyAndConsumeNonce(supabase, nonce, address);

    if (!nonceResult.valid) {
      return NextResponse.json(
        uiError("INVALID_NONCE", "Nonce is invalid, expired, or already used", nonceResult.error),
        { status: 400 }
      );
    }

    // Verify signature cryptographically
    const isValid = await verifyADR36Signature(address, signature, nonce);

    if (!isValid) {
      return NextResponse.json(
        uiError("INVALID_SIGNATURE", "Signature verification failed", "Please try signing again"),
        { status: 400 }
      );
    }

    console.log("✅ Signature verified successfully");

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        uiError("NOT_AUTHENTICATED", "You must be signed in to verify wallet ownership"),
        { status: 401 }
      );
    }

    // Get user's public_user_id
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("public_user_id")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (!profile?.public_user_id) {
      return NextResponse.json(
        uiError("PROFILE_NOT_FOUND", "User profile not found"),
        { status: 404 }
      );
    }

    // Update the wallet record to mark ownership as verified
    const { error: updateError } = await supabase
      .from("wallets")
      .update({
        ownership_verified: true,
        verified_at: new Date().toISOString(),
      })
      .eq("public_user_id", profile.public_user_id)
      .eq("address", address);

    if (updateError) {
      console.error("Failed to update wallet verification status:", updateError);
      return NextResponse.json(
        uiError("UPDATE_FAILED", "Failed to update verification status", updateError.message),
        { status: 500 }
      );
    }

    console.log("✅ Wallet ownership verified and recorded");
    console.log("=== WALLET OWNERSHIP VERIFICATION COMPLETE ===");

    return NextResponse.json({
      success: true,
      message: "Wallet ownership verified successfully",
      verified: true,
    });
  } catch (error) {
    console.error("Wallet ownership verification error:", error);
    return NextResponse.json(
      uiError("VERIFICATION_ERROR", "Failed to verify wallet ownership", String(error)),
      { status: 500 }
    );
  }
}
