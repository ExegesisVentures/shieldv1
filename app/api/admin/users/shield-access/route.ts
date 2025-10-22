import { NextResponse } from "next/server";
import { createSupabaseClient } from "@/utils/supabase/server";
import { uiError } from "@/utils/errors";
import { isUserAdmin } from "@/utils/admin";

/**
 * Grant or revoke Shield member access for a user (admin only)
 * Shield access is determined by:
 * 1. PMA signed (has_signed_pma = true)
 * 2. Shield NFT ownership (tracked in user_profiles)
 */
export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseClient();
    
    // Check if user is authenticated and admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        uiError("UNAUTHORIZED", "You must be logged in."),
        { status: 401 }
      );
    }

    const adminStatus = await isUserAdmin(supabase);
    
    if (!adminStatus) {
      return NextResponse.json(
        uiError("FORBIDDEN", "Admin access required."),
        { status: 403 }
      );
    }

    const { userId, grantAccess, pmaSigned, hasShieldNft } = await req.json();

    if (!userId) {
      return NextResponse.json(
        uiError("INVALID_INPUT", "userId is required."),
        { status: 400 }
      );
    }

    // Get or create user profile
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("public_user_id", userId)
      .maybeSingle();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error("Error fetching profile:", profileError);
      return NextResponse.json(
        uiError("FETCH_FAILED", "Could not fetch user profile.", profileError.message),
        { status: 500 }
      );
    }

    // Prepare update data
    const updateData: any = {
      public_user_id: userId,
    };

    if (grantAccess) {
      // Grant Shield access
      updateData.has_signed_pma = pmaSigned !== undefined ? pmaSigned : true;
      updateData.has_shield_nft = hasShieldNft !== undefined ? hasShieldNft : true;
      updateData.pma_signed_at = pmaSigned ? new Date().toISOString() : null;
    } else {
      // Revoke Shield access
      updateData.has_signed_pma = false;
      updateData.has_shield_nft = false;
      updateData.pma_signed_at = null;
    }

    // Upsert profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from("user_profiles")
      .upsert(updateData, { onConflict: "public_user_id" })
      .select()
      .single();

    if (updateError) {
      console.error("Error updating profile:", updateError);
      return NextResponse.json(
        uiError("UPDATE_FAILED", "Could not update Shield access.", updateError.message),
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: grantAccess ? "Shield access granted" : "Shield access revoked",
      data: updatedProfile,
    });
  } catch (e) {
    console.error("Shield access update error:", e);
    return NextResponse.json(
      uiError("UPDATE_FAILED", "Could not update Shield access."),
      { status: 500 }
    );
  }
}

/**
 * Get Shield access status for a user
 */
export async function GET(req: Request) {
  try {
    const supabase = await createSupabaseClient();
    
    // Check if user is authenticated and admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        uiError("UNAUTHORIZED", "You must be logged in."),
        { status: 401 }
      );
    }

    const adminStatus = await isUserAdmin(supabase);
    
    if (!adminStatus) {
      return NextResponse.json(
        uiError("FORBIDDEN", "Admin access required."),
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        uiError("INVALID_INPUT", "userId is required."),
        { status: 400 }
      );
    }

    const { data: profile, error } = await supabase
      .from("user_profiles")
      .select("has_signed_pma, has_shield_nft, pma_signed_at")
      .eq("public_user_id", userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error("Error fetching profile:", error);
      return NextResponse.json(
        uiError("FETCH_FAILED", "Could not fetch Shield access status.", error.message),
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: profile || {
        has_signed_pma: false,
        has_shield_nft: false,
        pma_signed_at: null,
      },
    });
  } catch (e) {
    console.error("Shield access fetch error:", e);
    return NextResponse.json(
      uiError("FETCH_FAILED", "Could not fetch Shield access status."),
      { status: 500 }
    );
  }
}

