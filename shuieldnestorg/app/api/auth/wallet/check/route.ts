import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/utils/supabase/service-role";
import { uiError } from "@/utils/errors";

/**
 * Check if a wallet address exists in the database and is linked to a user
 * This helps determine if a wallet connection should trigger authentication
 * 
 * File: /app/api/auth/wallet/check/route.ts
 */
export async function POST(req: Request) {
  console.log("=== WALLET CHECK REQUEST START ===");
  
  try {
    const { address } = await req.json();
    
    if (!address) {
      return NextResponse.json(
        uiError("BAD_REQUEST", "Address is required"),
        { status: 400 }
      );
    }

    console.log("Checking wallet:", address);

    // Use service role client to bypass RLS
    const supabase = createServiceRoleClient();

    // Check if user is currently authenticated
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    // Check if wallet exists in database
    const { data: wallet, error: walletError } = await supabase
      .from("wallets")
      .select("id, public_user_id, label, created_at, is_custodial, ownership_verified")
      .eq("address", address)
      .maybeSingle();

    if (walletError) {
      console.error("Error checking wallet:", walletError);
      return NextResponse.json(
        uiError("DATABASE_ERROR", "Failed to check wallet. Please try again."),
        { status: 500 }
      );
    }

    if (!wallet) {
      console.log("Wallet not found in database");
      return NextResponse.json({
        exists: false,
        message: "Wallet not registered"
      });
    }

    console.log("Wallet found:", {
      id: wallet.id,
      publicUserId: wallet.public_user_id,
      label: wallet.label,
    });

    // Get user profile info (email, etc.)
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("auth_user_id, public_user_id")
      .eq("public_user_id", wallet.public_user_id)
      .maybeSingle();

    if (profileError || !profile) {
      console.error("Error getting user profile:", profileError);
      return NextResponse.json(
        uiError("DATABASE_ERROR", "Failed to get user profile. Please try again."),
        { status: 500 }
      );
    }

    // Get auth user info
    const { data: { user: authUser }, error: authError } = await supabase.auth.admin.getUserById(profile.auth_user_id);

    if (authError || !authUser) {
      console.error("Error getting auth user:", authError);
      return NextResponse.json(
        uiError("DATABASE_ERROR", "Failed to get user info. Please try again."),
        { status: 500 }
      );
    }

    console.log("✅ Wallet is registered to user:", authUser.email || authUser.id);

    // Check if current user is trying to add their own wallet again
    const isSameUser = currentUser && currentUser.id === authUser.id;

    return NextResponse.json({
      exists: true,
      isSameUser,
      wallet: {
        id: wallet.id,
        label: wallet.label,
        created_at: wallet.created_at,
        is_custodial: wallet.is_custodial,
        ownership_verified: wallet.ownership_verified,
      },
      user: {
        id: profile.auth_user_id,
        email: authUser.email || null,
        is_anonymous: authUser.is_anonymous || false,
        created_at: authUser.created_at,
      },
      message: isSameUser 
        ? "This wallet is already connected to your account."
        : "Wallet is registered to another account. Sign a message to authenticate.",
    });

  } catch (error) {
    console.error("Wallet check error:", error);
    return NextResponse.json(
      uiError("INTERNAL_ERROR", "An unexpected error occurred"),
      { status: 500 }
    );
  }
}

