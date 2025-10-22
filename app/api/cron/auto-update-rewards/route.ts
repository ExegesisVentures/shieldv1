/**
 * API Route: Automatic Rewards Update Cron Job
 * GET /api/cron/auto-update-rewards
 * 
 * This endpoint is called by a cron service (e.g., Vercel Cron) every 72 hours (3 days)
 * to automatically refresh reward history for wallets that haven't been updated recently.
 * 
 * Security: Protected by CRON_SECRET environment variable
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { queryRewardsTransactions, aggregateRewards } from "@/utils/coreum/rewards-history";

// 72 hours in milliseconds - threshold for auto-updating (3 days)
const AUTO_UPDATE_THRESHOLD = 72 * 60 * 60 * 1000;

// Supabase client with service role for database writes
const getServiceSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, supabaseServiceKey);
};

export async function GET(req: NextRequest) {
  try {
    // Security check: verify cron secret
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET || "your-secret-here";
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error("❌ [Cron] Unauthorized access attempt");
      return NextResponse.json({
        success: false,
        error: "Unauthorized",
      }, { status: 401 });
    }

    console.log("🔄 [Cron] Starting automatic rewards update");
    const startTime = Date.now();
    const supabase = getServiceSupabase();

    // IMPORTANT: Only update wallets that belong to users in our system
    // Get all wallet addresses from the wallets table (user wallets only)
    const { data: userWallets, error: walletsError } = await supabase
      .from("wallets")
      .select("address")
      .is("deleted_at", null); // Only active wallets

    if (walletsError) {
      console.error("❌ [Cron] Failed to fetch user wallets:", walletsError);
      return NextResponse.json({
        success: false,
        error: "Failed to fetch user wallets",
      }, { status: 500 });
    }

    if (!userWallets || userWallets.length === 0) {
      console.log("✅ [Cron] No user wallets found");
      return NextResponse.json({
        success: true,
        message: "No user wallets to update",
        data: {
          updated: 0,
          failed: 0,
          skipped: 0,
          duration: `${Date.now() - startTime}ms`,
        },
      });
    }

    const userWalletAddresses = userWallets.map(w => w.address);
    console.log(`📊 [Cron] Found ${userWalletAddresses.length} user wallets in system`);

    // Get wallet_rewards_history for these user wallets that need updating
    // Criteria: last_auto_update_at is NULL OR older than 72 hours (3 days)
    const cutoffTime = new Date(Date.now() - AUTO_UPDATE_THRESHOLD).toISOString();
    
    const { data: walletsToUpdate, error: fetchError } = await supabase
      .from("wallet_rewards_history")
      .select("wallet_address, last_auto_update_at, last_updated_at")
      .in("wallet_address", userWalletAddresses)
      .or(`last_auto_update_at.is.null,last_auto_update_at.lt.${cutoffTime}`);

    if (fetchError) {
      console.error("❌ [Cron] Failed to fetch wallets:", fetchError);
      return NextResponse.json({
        success: false,
        error: "Failed to fetch wallets for update",
      }, { status: 500 });
    }

    if (!walletsToUpdate || walletsToUpdate.length === 0) {
      console.log("✅ [Cron] No user wallets need updating (all are up-to-date)");
      return NextResponse.json({
        success: true,
        message: "No user wallets need updating",
        data: {
          updated: 0,
          failed: 0,
          skipped: 0,
          duration: `${Date.now() - startTime}ms`,
        },
      });
    }

    console.log(`📊 [Cron] Found ${walletsToUpdate.length} user wallets to update (older than 72 hours)`);

    // Update each wallet
    const results = {
      updated: 0,
      failed: 0,
      skipped: 0,
      errors: [] as Array<{ address: string; error: string }>,
    };

    for (const wallet of walletsToUpdate) {
      try {
        const address = wallet.wallet_address;
        console.log(`🔄 [Cron] Updating user wallet ${address}...`);

        // Fetch fresh data from blockchain
        // This queries ONLY this specific wallet address, not all addresses in blocks
        const transactions = await queryRewardsTransactions(address);
        const aggregated = aggregateRewards(transactions);

        // Update database with new data
        const { error: updateError } = await supabase
          .from("wallet_rewards_history")
          .update({
            total_rewards_ucore: aggregated.total,
            total_claim_transactions: aggregated.count,
            first_reward_at: aggregated.firstReward,
            last_reward_at: aggregated.lastReward,
            last_updated_at: new Date().toISOString(),
            last_auto_update_at: new Date().toISOString(),
          })
          .eq("wallet_address", address);

        if (updateError) {
          console.error(`❌ [Cron] Failed to update ${address}:`, updateError);
          results.failed++;
          results.errors.push({
            address,
            error: updateError.message || String(updateError),
          });
        } else {
          console.log(`✅ [Cron] Updated ${address}: ${aggregated.count} txs, ${(parseFloat(aggregated.total) / 1_000_000).toFixed(6)} CORE`);
          results.updated++;
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error: any) {
        console.error(`❌ [Cron] Error updating ${wallet.wallet_address}:`, error);
        results.failed++;
        results.errors.push({
          address: wallet.wallet_address,
          error: error?.message || String(error),
        });
      }
    }

    const duration = Date.now() - startTime;
    console.log(`✅ [Cron] Auto-update complete: ${results.updated} updated, ${results.failed} failed in ${duration}ms`);

    return NextResponse.json({
      success: true,
      message: `Auto-update complete: ${results.updated} wallets updated, ${results.failed} failed`,
      data: {
        ...results,
        duration: `${duration}ms`,
      },
    });

  } catch (error: any) {
    console.error("❌ [Cron] Fatal error in auto-update:", error);
    return NextResponse.json({
      success: false,
      error: error?.message || "Internal server error",
    }, { status: 500 });
  }
}

