import { NextResponse } from "next/server";
import { createSupabaseClient } from "@/utils/supabase/server";
import { uiError } from "@/utils/errors";
import { isUserAdmin } from "@/utils/admin";

/**
 * Get all users with their wallets (admin only)
 * Supports search by email or wallet address
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

    // Get search query parameter
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.toLowerCase() || '';

    // Query users with their wallets
    let query = supabase
      .from("public_users")
      .select(`
        id,
        email,
        created_at,
        wallets (
          id,
          address,
          label,
          public_user_id,
          deleted_at,
          created_at,
          updated_at
        )
      `)
      .order("created_at", { ascending: false });

    const { data: users, error } = await query;
    
    if (error) {
      console.error("Error fetching users:", error);
      return NextResponse.json(
        uiError("FETCH_FAILED", "Could not fetch users.", error.message),
        { status: 500 }
      );
    }

    // Filter by search term if provided
    let filteredUsers = users || [];
    if (search) {
      filteredUsers = filteredUsers.filter((u) => {
        const emailMatch = u.email?.toLowerCase().includes(search);
        const walletMatch = u.wallets?.some((w: any) => 
          w.address.toLowerCase().includes(search) ||
          w.label?.toLowerCase().includes(search)
        );
        return emailMatch || walletMatch;
      });
    }

    // Transform data for easier frontend consumption
    const transformedUsers = filteredUsers.map(u => ({
      user_id: u.id,
      email: u.email,
      created_at: u.created_at,
      wallets: u.wallets || [],
      wallet_count: u.wallets?.length || 0,
      active_wallet_count: u.wallets?.filter((w: any) => !w.deleted_at).length || 0,
    }));

    return NextResponse.json({
      success: true,
      data: transformedUsers,
      count: transformedUsers.length,
    });
  } catch (e) {
    console.error("Users fetch error:", e);
    return NextResponse.json(
      uiError("FETCH_FAILED", "Could not fetch users."),
      { status: 500 }
    );
  }
}

/**
 * Delete a user (admin only)
 * This is a soft delete - marks user as deleted but retains data
 */
export async function DELETE(req: Request) {
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

    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        uiError("INVALID_INPUT", "userId is required."),
        { status: 400 }
      );
    }

    // Soft delete all user's wallets
    const { error: walletsError } = await supabase
      .from("wallets")
      .update({ deleted_at: new Date().toISOString() })
      .eq("public_user_id", userId)
      .is("deleted_at", null);

    if (walletsError) {
      console.error("Error deleting wallets:", walletsError);
      return NextResponse.json(
        uiError("DELETE_FAILED", "Could not delete user wallets.", walletsError.message),
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "User wallets soft deleted successfully",
    });
  } catch (e) {
    console.error("User delete error:", e);
    return NextResponse.json(
      uiError("DELETE_FAILED", "Could not delete user."),
      { status: 500 }
    );
  }
}

