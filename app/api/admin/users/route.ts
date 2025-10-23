import { NextResponse } from "next/server";
import { createSupabaseClient } from "@/utils/supabase/server";
import { uiError } from "@/utils/errors";
import { isUserAdmin } from "@/utils/admin";

/**
 * Get all users with their wallets and roles (admin only)
 * Supports search by email or wallet address, filtering by role, and pagination
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

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.toLowerCase() || '';
    const roleFilter = searchParams.get('role') || 'all'; // all, admin, private, public, visitor
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // Get all auth users using service role client
    const { data: { users: authUsers }, error: authUsersError } = await supabase.auth.admin.listUsers({
      page,
      perPage: 1000, // Get a large batch, we'll filter client-side
    });

    if (authUsersError) {
      console.error("Error fetching auth users:", authUsersError);
      return NextResponse.json(
        uiError("FETCH_FAILED", "Could not fetch users.", authUsersError.message),
        { status: 500 }
      );
    }

    // Get admin emails from env
    const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(Boolean);

    const ADMIN_WALLET_ADDRESSES = (process.env.ADMIN_WALLET_ADDRESSES || '')
      .split(',')
      .map(a => a.trim().toLowerCase())
      .filter(Boolean);

    // Process each user
    const usersData = await Promise.all(
      authUsers.map(async (authUser) => {
        // Get user profile mapping
        const { data: userProfile } = await supabase
          .from('user_profiles')
          .select('public_user_id')
          .eq('auth_user_id', authUser.id)
          .maybeSingle();

        // Get private user profile mapping
        const { data: privateProfile } = await supabase
          .from('private_user_profiles')
          .select('private_user_id')
          .eq('auth_user_id', authUser.id)
          .maybeSingle();

        // Get private user details if exists
        let shieldNftVerified = false;
        let pmaSigned = false;

        if (privateProfile?.private_user_id) {
          const { data: privateUser } = await supabase
            .from('private_users')
            .select('shield_nft_verified, pma_signed')
            .eq('id', privateProfile.private_user_id)
            .maybeSingle();

          if (privateUser) {
            shieldNftVerified = privateUser.shield_nft_verified || false;
            pmaSigned = privateUser.pma_signed || false;
          }
        }

        // Get wallets
        const wallets: any[] = [];
        if (userProfile?.public_user_id) {
          const { data: userWallets } = await supabase
            .from('wallets')
            .select('id, address, label, deleted_at, created_at, updated_at, public_user_id, is_custodial, custodian_note')
            .eq('public_user_id', userProfile.public_user_id)
            .order('created_at', { ascending: false });

          if (userWallets) {
            wallets.push(...userWallets);
          }
        }

        // Determine role
        let role = 'visitor';
        let roleLabel = 'Visitor';
        
        // Check admin status
        const isEmailAdmin = authUser.email && ADMIN_EMAILS.includes(authUser.email.toLowerCase());
        const isMetadataAdmin = authUser.user_metadata?.is_admin === true;
        const isAppMetadataAdmin = authUser.app_metadata?.role === 'admin';
        const hasAdminWallet = wallets.some(w => ADMIN_WALLET_ADDRESSES.includes(w.address.toLowerCase()));

        if (isEmailAdmin || isMetadataAdmin || isAppMetadataAdmin || hasAdminWallet) {
          role = 'admin';
          roleLabel = 'Admin';
        } else if (privateProfile?.private_user_id && shieldNftVerified && pmaSigned) {
          role = 'private';
          roleLabel = 'Private Member';
        } else if (userProfile?.public_user_id) {
          role = 'public';
          roleLabel = 'Public User';
        }

        return {
          auth_user_id: authUser.id,
          user_id: userProfile?.public_user_id || authUser.id,
          email: authUser.email || null,
          email_confirmed: !!authUser.email_confirmed_at,
          created_at: authUser.created_at,
          public_user_id: userProfile?.public_user_id || null,
          private_user_id: privateProfile?.private_user_id || null,
          shield_nft_verified: shieldNftVerified,
          pma_signed: pmaSigned,
          role,
          role_label: roleLabel,
          wallets,
          wallet_count: wallets.length,
          active_wallet_count: wallets.filter((w: any) => !w.deleted_at).length,
        };
      })
    );

    // Filter by search term
    let filteredUsers = usersData;
    if (search) {
      filteredUsers = filteredUsers.filter((u) => {
        const emailMatch = u.email?.toLowerCase().includes(search);
        const walletMatch = u.wallets.some((w: any) => 
          w.address.toLowerCase().includes(search) ||
          w.label?.toLowerCase().includes(search)
        );
        return emailMatch || walletMatch;
      });
    }

    // Filter by role
    if (roleFilter !== 'all') {
      filteredUsers = filteredUsers.filter((u) => u.role === roleFilter);
    }

    // Sort by created_at descending
    filteredUsers.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Paginate
    const total = filteredUsers.length;
    const paginatedUsers = filteredUsers.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: paginatedUsers,
      count: paginatedUsers.length,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
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

