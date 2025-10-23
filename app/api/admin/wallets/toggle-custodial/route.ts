/**
 * API Route: Toggle Custodial Status for Wallet
 * POST /api/admin/wallets/toggle-custodial
 * 
 * Requires admin authentication
 * Toggles the is_custodial status for a specific wallet
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/utils/supabase/server";
import { isUserAdmin } from "@/utils/admin";
import { uiError } from "@/utils/errors";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        uiError("UNAUTHORIZED", "You must be logged in."),
        { status: 401 }
      );
    }

    // Check admin status
    const adminStatus = await isUserAdmin(supabase);
    
    if (!adminStatus) {
      return NextResponse.json(
        uiError("FORBIDDEN", "Admin access required."),
        { status: 403 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { walletId, isCustodial, custodianNote } = body;

    if (!walletId) {
      return NextResponse.json(
        uiError("INVALID_INPUT", "walletId is required."),
        { status: 400 }
      );
    }

    if (typeof isCustodial !== 'boolean') {
      return NextResponse.json(
        uiError("INVALID_INPUT", "isCustodial must be a boolean."),
        { status: 400 }
      );
    }

    console.log(`🔄 [Admin] Toggling custodial status for wallet ${walletId} to ${isCustodial}`);

    // Update wallet
    const updateData: any = {
      is_custodial: isCustodial,
    };

    // If marking as custodial, add or update note
    if (isCustodial) {
      updateData.custodian_note = custodianNote || 'Admin marked as custodial';
    } else {
      // If unmarking, clear the note
      updateData.custodian_note = null;
    }

    const { data: updatedWallet, error: updateError } = await supabase
      .from("wallets")
      .update(updateData)
      .eq("id", walletId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating wallet:", updateError);
      return NextResponse.json(
        uiError("UPDATE_FAILED", "Failed to update wallet custodial status.", updateError.message),
        { status: 500 }
      );
    }

    console.log(`✅ [Admin] Wallet ${walletId} custodial status updated to ${isCustodial}`);

    return NextResponse.json({
      success: true,
      message: `Wallet ${isCustodial ? 'marked' : 'unmarked'} as custodial successfully`,
      wallet: updatedWallet,
    });

  } catch (error) {
    console.error("Error toggling custodial status:", error);
    return NextResponse.json(
      uiError("SERVER_ERROR", "An error occurred while toggling custodial status."),
      { status: 500 }
    );
  }
}

