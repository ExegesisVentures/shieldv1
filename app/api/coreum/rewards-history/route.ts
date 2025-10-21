/**
 * API Route: Fetch Historical Rewards for Wallets
 * GET /api/coreum/rewards-history
 * 
 * Query params:
 * - address: Single wallet address
 * - custodial: true to get all custodial wallets
 * - refresh: true to force refresh from blockchain
 */

import { NextRequest, NextResponse } from "next/server";
import { getHistoricalRewards, getTotalCustodialRewards } from "@/utils/coreum/rewards-history";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const address = searchParams.get("address");
    const custodial = searchParams.get("custodial") === "true";
    const refresh = searchParams.get("refresh") === "true";

    // Option 1: Get all custodial wallets
    if (custodial) {
      console.log("📊 [API] Fetching total custodial rewards");
      
      const result = await getTotalCustodialRewards();
      
      return NextResponse.json({
        success: true,
        data: result,
      });
    }

    // Option 2: Get specific wallet
    if (address) {
      console.log(`📊 [API] Fetching rewards for ${address} (refresh: ${refresh})`);
      
      const result = await getHistoricalRewards(address, refresh);
      
      if (!result) {
        return NextResponse.json({
          success: false,
          error: "Failed to fetch rewards history",
        }, { status: 500 });
      }

      // Format response
      return NextResponse.json({
        success: true,
        data: {
          address: result.wallet_address,
          totalRewardsUcore: result.total_rewards_ucore,
          totalRewardsCore: (parseFloat(result.total_rewards_ucore) / 1_000_000).toFixed(6),
          transactionCount: result.total_claim_transactions,
          firstRewardAt: result.first_reward_at,
          lastRewardAt: result.last_reward_at,
          lastUpdatedAt: result.last_updated_at,
        },
      });
    }

    // No valid params
    return NextResponse.json({
      success: false,
      error: "Missing required parameter: address or custodial=true",
    }, { status: 400 });

  } catch (error: any) {
    console.error("❌ [API] Error in rewards-history:", error);
    return NextResponse.json({
      success: false,
      error: error?.message || "Internal server error",
    }, { status: 500 });
  }
}

