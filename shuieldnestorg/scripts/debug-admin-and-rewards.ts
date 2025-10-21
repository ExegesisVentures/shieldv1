/**
 * Debug script for Admin Access and Rewards Issues
 * Run with: npx tsx scripts/debug-admin-and-rewards.ts
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing environment variables!");
  console.error("Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const ADMIN_EMAIL = "nestd@pm.me";
const ADMIN_WALLETS = [
  "core1mgvlgvh2hfw5pgdqc79up3du69v2z3t8qz4kwg",
  "core1jcas459gnu857ylephjdjlea3rkr38m0asj6gw",
  "core1ltltw0jya4hq39myd9798qqvu6jzy6zxalxhqu",
];

async function main() {
  console.log("🔍 ADMIN & REWARDS DIAGNOSTIC TOOL\n");
  console.log("=" .repeat(60));

  // 1. Check if user exists
  console.log("\n📧 Step 1: Checking Auth User...");
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
  
  if (usersError) {
    console.error("❌ Error fetching users:", usersError.message);
    return;
  }

  const adminUser = users.find(u => u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase());
  
  if (!adminUser) {
    console.error(`❌ User ${ADMIN_EMAIL} not found in auth.users`);
    console.log("\nTo fix: Create user in Supabase Dashboard → Authentication → Users");
    return;
  }
  
  console.log(`✅ Found user: ${adminUser.email}`);
  console.log(`   Auth ID: ${adminUser.id}`);

  // 2. Check user profile mapping
  console.log("\n👤 Step 2: Checking User Profile Mapping...");
  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("public_user_id")
    .eq("auth_user_id", adminUser.id)
    .maybeSingle();

  if (profileError || !profile) {
    console.error("❌ No user profile found!");
    console.log("\nTo fix: Run this SQL in Supabase:");
    console.log(`
INSERT INTO public.public_users (email, created_at)
VALUES ('${ADMIN_EMAIL}', NOW())
RETURNING id;

-- Then create mapping (replace <public_user_id> with the ID above):
INSERT INTO public.user_profiles (auth_user_id, public_user_id, created_at)
VALUES ('${adminUser.id}', '<public_user_id>', NOW());
    `);
    return;
  }

  console.log(`✅ User profile found`);
  console.log(`   Public User ID: ${profile.public_user_id}`);

  // 3. Check wallets
  console.log("\n💼 Step 3: Checking Wallets...");
  const { data: wallets, error: walletsError } = await supabase
    .from("wallets")
    .select("id, address, label, is_custodial, source, ownership_verified")
    .eq("public_user_id", profile.public_user_id);

  if (walletsError) {
    console.error("❌ Error fetching wallets:", walletsError.message);
    return;
  }

  if (!wallets || wallets.length === 0) {
    console.error("❌ No wallets found for this user!");
    console.log("\nTo fix: Add wallets via the app or run this SQL:");
    ADMIN_WALLETS.forEach((addr, i) => {
      console.log(`
INSERT INTO public.wallets (public_user_id, address, label, source, is_custodial)
VALUES ('${profile.public_user_id}', '${addr}', 'Admin Wallet ${i + 1}', 'admin', true);
      `);
    });
    return;
  }

  console.log(`✅ Found ${wallets.length} wallet(s):`);
  wallets.forEach((w, i) => {
    const isAdmin = ADMIN_WALLETS.includes(w.address.toLowerCase());
    const isCustodial = w.is_custodial ? "✅ Custodial" : "❌ Not Custodial";
    console.log(`   ${i + 1}. ${w.address.slice(0, 20)}...`);
    console.log(`      Label: ${w.label || "No label"}`);
    console.log(`      ${isCustodial}`);
    console.log(`      ${isAdmin ? "✅ IS ADMIN WALLET" : "❌ Not in admin list"}`);
  });

  // 4. Check if migration was run
  console.log("\n📊 Step 4: Checking Rewards History Table...");
  const { data: tableCheck, error: tableError } = await supabase
    .from("wallet_rewards_history")
    .select("count")
    .limit(1);

  if (tableError) {
    console.error("❌ wallet_rewards_history table does NOT exist!");
    console.log("\nTo fix: Run the migration in Supabase SQL Editor:");
    console.log("   File: ../supabase/migrations/20251013_wallet_rewards_history.sql");
    return;
  }

  console.log("✅ wallet_rewards_history table exists");

  // 5. Check existing rewards data
  console.log("\n💰 Step 5: Checking Rewards Data...");
  const walletAddresses = wallets.map(w => w.address);
  const { data: rewardsData, error: rewardsError } = await supabase
    .from("wallet_rewards_history")
    .select("*")
    .in("wallet_address", walletAddresses);

  if (rewardsError) {
    console.error("❌ Error fetching rewards data:", rewardsError.message);
  } else if (!rewardsData || rewardsData.length === 0) {
    console.log("⚠️  No rewards data cached yet");
    console.log("\nTo populate: Use the 'Refresh All' button in /admin");
    console.log("Or manually query blockchain for each wallet");
  } else {
    console.log(`✅ Found rewards data for ${rewardsData.length} wallet(s):`);
    rewardsData.forEach(r => {
      const rewardsCore = parseFloat(r.total_rewards_ucore) / 1_000_000;
      console.log(`   ${r.wallet_address.slice(0, 20)}...`);
      console.log(`      Total: ${rewardsCore.toFixed(2)} CORE`);
      console.log(`      Transactions: ${r.total_claim_transactions}`);
      console.log(`      Last Updated: ${new Date(r.last_updated_at).toLocaleString()}`);
    });
  }

  // 6. Check custodial wallets
  console.log("\n🏦 Step 6: Checking Custodial Wallets in Database...");
  const { data: custodialWallets, error: custodialError } = await supabase
    .from("wallets")
    .select("address, label, public_user_id")
    .eq("is_custodial", true);

  if (custodialError) {
    console.error("❌ Error fetching custodial wallets:", custodialError.message);
  } else if (!custodialWallets || custodialWallets.length === 0) {
    console.log("⚠️  NO CUSTODIAL WALLETS FOUND!");
    console.log("\nThis is why rewards show 0.00 CORE");
    console.log("\nTo fix: Mark your wallets as custodial:");
    console.log(`
UPDATE public.wallets
SET is_custodial = true,
    source = 'admin'
WHERE public_user_id = '${profile.public_user_id}';
    `);
  } else {
    console.log(`✅ Found ${custodialWallets.length} custodial wallet(s)`);
    custodialWallets.forEach((w, i) => {
      console.log(`   ${i + 1}. ${w.address.slice(0, 20)}... (${w.label || "No label"})`);
    });
  }

  // 7. Summary
  console.log("\n" + "=".repeat(60));
  console.log("📋 SUMMARY & RECOMMENDATIONS\n");

  const hasProfile = !!profile;
  const hasWallets = wallets && wallets.length > 0;
  const hasAdminWallets = wallets?.some(w => ADMIN_WALLETS.includes(w.address.toLowerCase()));
  const hasCustodialWallets = custodialWallets && custodialWallets.length > 0;
  const hasRewardsTable = !tableError;
  
  if (!hasProfile) {
    console.log("❌ CRITICAL: Create user profile mapping first");
  } else if (!hasWallets) {
    console.log("❌ CRITICAL: Add wallets to your account");
  } else if (!hasAdminWallets) {
    console.log("⚠️  WARNING: None of your wallets are in the admin list");
    console.log("   Admin access via email should still work: nestd@pm.me");
  } else if (!hasCustodialWallets) {
    console.log("⚠️  WARNING: No custodial wallets found");
    console.log("   This is why Total Rewards shows 0.00 CORE");
    console.log("   FIX: Mark your wallets as custodial (see SQL above)");
  } else if (!hasRewardsTable) {
    console.log("❌ CRITICAL: Run the rewards history migration");
  } else {
    console.log("✅ Everything looks good!");
    console.log("\nYou should be able to:");
    console.log("   1. Access /admin page");
    console.log("   2. See rewards (after clicking 'Refresh All' in admin)");
    console.log("\nIf still having issues:");
    console.log("   - Clear browser cache and hard refresh");
    console.log("   - Check browser console for errors (F12)");
    console.log("   - Check Network tab for failed API calls");
  }

  console.log("\n" + "=".repeat(60));
}

main().catch(console.error);

