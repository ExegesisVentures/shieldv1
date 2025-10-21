/**
 * API Route: Admin Refresh Historical Rewards
 * POST /api/admin/rewards/refresh
 * 
 * Requires admin authentication
 * Refreshes rewards history for all custodial wallets
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/utils/supabase/server";
import { isUserAdmin } from "@/utils/admin";
import { refreshMultipleWallets } from "@/utils/coreum/rewards-history";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: "Authentication required",
      }, { status: 401 });
    }

    // Check admin status
    const isAdmin = await isUserAdmin(supabase);
    
    if (!isAdmin) {
      return NextResponse.json({
        success: false,
        error: "Admin access required",
      }, { status: 403 });
    }

    console.log("🔄 [Admin] Starting rewards refresh for all custodial wallets");

    // Get all custodial wallet addresses
    const { data: wallets, error: walletsError } = await supabase
      .from("wallets")
      .select("address, label")
      .eq("is_custodial", true);

    if (walletsError) {
      return NextResponse.json({
        success: false,
        error: "Failed to fetch custodial wallets",
      }, { status: 500 });
    }

    if (!wallets || wallets.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No custodial wallets to refresh",
        data: { success: 0, failed: 0, results: [] },
      });
    }

    const addresses = wallets.map(w => w.address);
    console.log(`📊 [Admin] Refreshing ${addresses.length} custodial wallets`);

    // Refresh all wallets
    const result = await refreshMultipleWallets(addresses);

    console.log(`✅ [Admin] Refresh complete: ${result.success} succeeded, ${result.failed} failed`);

    return NextResponse.json({
      success: true,
      message: `Refreshed ${result.success} of ${addresses.length} custodial wallets`,
      data: result,
    });

  } catch (error: any) {
    console.error("❌ [Admin] Error refreshing rewards:", error);
    return NextResponse.json({
      success: false,
      error: error?.message || "Internal server error",
    }, { status: 500 });
  }
}

