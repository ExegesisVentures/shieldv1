import { NextResponse } from "next/server";
import { createSupabaseClient } from "@/utils/supabase/server";
import { uiError } from "@/utils/errors";

/**
 * API Route: Update Wallet Label
 * PUT /api/wallets/update-label
 * 
 * Allows users to update the label (name) of their wallets
 * File: app/api/wallets/update-label/route.ts
 */
export async function PUT(req: Request) {
  console.log("=== UPDATE WALLET LABEL REQUEST START ===");

  try {
    const { walletId, label } = await req.json();

    if (!walletId || !label) {
      return NextResponse.json(
        uiError("BAD_REQUEST", "Wallet ID and label are required"),
        { status: 400 }
      );
    }

    // Validate label length
    if (label.trim().length === 0) {
      return NextResponse.json(
        uiError("BAD_REQUEST", "Label cannot be empty"),
        { status: 400 }
      );
    }

    if (label.length > 50) {
      return NextResponse.json(
        uiError("BAD_REQUEST", "Label must be 50 characters or less"),
        { status: 400 }
      );
    }

    const supabase = await createSupabaseClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        uiError("NOT_AUTHENTICATED", "You must be signed in"),
        { status: 401 }
      );
    }

    console.log("Updating wallet label:", { walletId, label });

    // Get user's public_user_id
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("public_user_id")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (!profile?.public_user_id) {
      return NextResponse.json(
        uiError("NOT_FOUND", "User profile not found"),
        { status: 404 }
      );
    }

    // Verify wallet belongs to user and update label
    const { data: updatedWallet, error: updateError } = await supabase
      .from("wallets")
      .update({ label: label.trim() })
      .eq("id", walletId)
      .eq("public_user_id", profile.public_user_id)
      .is("deleted_at", null)
      .select()
      .maybeSingle();

    if (updateError) {
      console.error("Failed to update wallet label:", updateError);
      return NextResponse.json(
        uiError("UPDATE_FAILED", "Failed to update wallet label", updateError.message),
        { status: 500 }
      );
    }

    if (!updatedWallet) {
      return NextResponse.json(
        uiError("NOT_FOUND", "Wallet not found or you don't have permission to update it"),
        { status: 404 }
      );
    }

    console.log("✅ Wallet label updated successfully");

    return NextResponse.json({
      success: true,
      message: "Wallet label updated successfully",
      wallet: {
        id: updatedWallet.id,
        label: updatedWallet.label,
        address: updatedWallet.address,
      },
    });

  } catch (error) {
    console.error("❌ Error updating wallet label:", error);
    return NextResponse.json(
      uiError("SERVER_ERROR", "An error occurred while updating wallet label"),
      { status: 500 }
    );
  }
}

