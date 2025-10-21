import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/utils/supabase/service-role";
import { isUserAdmin } from "@/utils/admin";
import { uiError } from "@/utils/errors";

/**
 * Admin endpoint to add custodial wallets for users
 * 
 * Use this for users whose assets are held in custody by ShieldNest.
 * These wallets will be marked as read-only and won't require signature verification.
 * 
 * File: /app/api/admin/wallets/add-custodial/route.ts
 */
export async function POST(req: Request) {
  console.log("=== ADD CUSTODIAL WALLET REQUEST START ===");

  try {
    const supabase = createServiceRoleClient();

    // Check admin authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        uiError("NOT_AUTHENTICATED", "You must be signed in"),
        { status: 401 }
      );
    }

    const isAdmin = await isUserAdmin(supabase);
    if (!isAdmin) {
      return NextResponse.json(
        uiError("NOT_AUTHORIZED", "Admin access required"),
        { status: 403 }
      );
    }

    const { email, address, label, custodian_note } = await req.json();

    if (!email || !address) {
      return NextResponse.json(
        uiError("BAD_REQUEST", "Email and address are required"),
        { status: 400 }
      );
    }

    console.log("Adding custodial wallet:", { email, address, label });

    // Get user by email
    const { data: authUser, error: userError } = await supabase.auth.admin.getUserById(
      email // Try as user ID first
    );

    let targetAuthUserId: string;

    if (userError || !authUser) {
      // Try finding by email instead
      const { data: users, error: emailError } = await supabase.auth.admin.listUsers();
      
      if (emailError) {
        return NextResponse.json(
          uiError("DATABASE_ERROR", "Failed to find user", emailError.message),
          { status: 500 }
        );
      }

      const foundUser = users.users.find(u => u.email === email);
      
      if (!foundUser) {
        return NextResponse.json(
          uiError("USER_NOT_FOUND", `No user found with email: ${email}`),
          { status: 404 }
        );
      }

      targetAuthUserId = foundUser.id;
    } else {
      targetAuthUserId = authUser.id;
    }

    // Get user's public_user_id
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("public_user_id")
      .eq("auth_user_id", targetAuthUserId)
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json(
        uiError("PROFILE_NOT_FOUND", "User profile not found"),
        { status: 404 }
      );
    }

    // Check if wallet already exists for this user
    const { data: existingWallet, error: checkError } = await supabase
      .from("wallets")
      .select("id, label, is_custodial")
      .eq("public_user_id", profile.public_user_id)
      .eq("address", address)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') { // Ignore "no rows" error
      console.error("Error checking existing wallet:", checkError);
      return NextResponse.json(
        uiError("DATABASE_ERROR", "Failed to check existing wallet", checkError.message),
        { status: 500 }
      );
    }

    if (existingWallet) {
      // Update existing wallet to mark as custodial
      const { error: updateError } = await supabase
        .from("wallets")
        .update({
          is_custodial: true,
          source: 'admin',
          custodian_note: custodian_note || existingWallet.label,
          label: label || existingWallet.label,
        })
        .eq("id", existingWallet.id);

      if (updateError) {
        return NextResponse.json(
          uiError("UPDATE_FAILED", "Failed to update wallet", updateError.message),
          { status: 500 }
        );
      }

      console.log("✅ Updated existing wallet to custodial");

      return NextResponse.json({
        success: true,
        message: "Wallet updated to custodial",
        wallet: {
          id: existingWallet.id,
          address,
          label: label || existingWallet.label,
          is_custodial: true,
        },
      });
    }

    // Insert new custodial wallet
    const { data: newWallet, error: insertError } = await supabase
      .from("wallets")
      .insert({
        public_user_id: profile.public_user_id,
        address,
        label: label || `Custodial Wallet`,
        source: 'admin',
        is_custodial: true,
        custodian_note,
        ownership_verified: false, // Custodial wallets are never "verified" by user
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to insert custodial wallet:", insertError);
      return NextResponse.json(
        uiError("INSERT_FAILED", "Failed to add custodial wallet", insertError.message),
        { status: 500 }
      );
    }

    console.log("✅ Custodial wallet added successfully");

    return NextResponse.json({
      success: true,
      message: "Custodial wallet added successfully",
      wallet: {
        id: newWallet.id,
        address: newWallet.address,
        label: newWallet.label,
        is_custodial: newWallet.is_custodial,
      },
    });

  } catch (error) {
    console.error("Add custodial wallet error:", error);
    return NextResponse.json(
      uiError("INTERNAL_ERROR", "An unexpected error occurred"),
      { status: 500 }
    );
  }
}

