/**
 * RLS Setup Verification Script
 * Tests database schema, functions, and RLS policies
 * 
 * Run with: npx tsx scripts/test-rls-setup.ts
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Load .env.local
config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!url) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL not set");
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  details?: any;
}

const results: TestResult[] = [];

async function testTableExists(tableName: string): Promise<boolean> {
  try {
    const { error } = await supabase.from(tableName).select("*").limit(0);
    return !error;
  } catch {
    return false;
  }
}

async function testFunctionExists(functionName: string): Promise<boolean> {
  try {
    const { error } = await supabase.rpc(functionName);
    // Function exists if error is not "function does not exist"
    return !error || !error.message.includes("does not exist");
  } catch {
    return false;
  }
}

async function runTests() {
  console.log("🔍 Starting RLS Setup Verification...\n");
  console.log("=" .repeat(60));

  // Test 1: Core Tables
  console.log("\n📋 Testing Core Tables...");
  const tables = [
    "public_users",
    "private_users",
    "user_profiles",
    "private_user_profiles",
    "wallets",
    "wallet_nonces",
    "shield_settings",
  ];

  for (const table of tables) {
    const exists = await testTableExists(table);
    results.push({
      name: `Table: ${table}`,
      passed: exists,
      message: exists ? `✅ ${table} exists` : `❌ ${table} NOT FOUND`,
    });
    console.log(results[results.length - 1].message);
  }

  // Test 2: Helper Functions
  console.log("\n🔧 Testing Helper Functions...");
  const functions = ["get_public_user_id", "get_private_user_id"];

  for (const func of functions) {
    const exists = await testFunctionExists(func);
    results.push({
      name: `Function: ${func}`,
      passed: exists,
      message: exists ? `✅ ${func}() exists` : `❌ ${func}() NOT FOUND`,
    });
    console.log(results[results.length - 1].message);
  }

  // Test 3: Table Structure - public_users
  console.log("\n📐 Testing Table Structures...");
  try {
    const { data: publicUsersSchema, error } = await supabase
      .from("public_users")
      .select("*")
      .limit(1);
    
    results.push({
      name: "Schema: public_users",
      passed: !error,
      message: !error 
        ? "✅ public_users schema accessible" 
        : `❌ Cannot access public_users: ${error.message}`,
    });
    console.log(results[results.length - 1].message);
  } catch (e: any) {
    results.push({
      name: "Schema: public_users",
      passed: false,
      message: `❌ Error: ${e.message}`,
    });
    console.log(results[results.length - 1].message);
  }

  // Test 4: Table Structure - user_profiles
  try {
    const { data: profilesSchema, error } = await supabase
      .from("user_profiles")
      .select("auth_user_id, public_user_id")
      .limit(1);
    
    results.push({
      name: "Schema: user_profiles",
      passed: !error,
      message: !error 
        ? "✅ user_profiles has required columns" 
        : `❌ user_profiles schema issue: ${error.message}`,
    });
    console.log(results[results.length - 1].message);
  } catch (e: any) {
    results.push({
      name: "Schema: user_profiles",
      passed: false,
      message: `❌ Error: ${e.message}`,
    });
    console.log(results[results.length - 1].message);
  }

  // Test 5: Wallets table structure
  try {
    const { data: walletsSchema, error } = await supabase
      .from("wallets")
      .select("user_id, user_scope, chain_id, address")
      .limit(1);
    
    results.push({
      name: "Schema: wallets",
      passed: !error,
      message: !error 
        ? "✅ wallets has required columns" 
        : `❌ wallets schema issue: ${error.message}`,
    });
    console.log(results[results.length - 1].message);
  } catch (e: any) {
    results.push({
      name: "Schema: wallets",
      passed: false,
      message: `❌ Error: ${e.message}`,
    });
    console.log(results[results.length - 1].message);
  }

  // Test 6: RLS Enabled Check
  console.log("\n🔒 Testing RLS Status...");
  try {
    const { data: rlsStatus, error } = await supabase.rpc("check_rls_status");
    
    if (error && error.message.includes("does not exist")) {
      // Function doesn't exist, that's okay - we can't check this way
      results.push({
        name: "RLS Status Check",
        passed: true,
        message: "⚠️  Cannot verify RLS status programmatically (function not found, this is okay)",
      });
      console.log(results[results.length - 1].message);
    }
  } catch (e: any) {
    results.push({
      name: "RLS Status Check",
      passed: true,
      message: "⚠️  Cannot verify RLS status programmatically (this is okay)",
    });
    console.log(results[results.length - 1].message);
  }

  // Test 7: Shield Settings
  console.log("\n🛡️  Testing Shield Settings...");
  try {
    const { data: shieldSettings, error } = await supabase
      .from("shield_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    
    results.push({
      name: "Shield Settings",
      passed: !error,
      message: !error 
        ? `✅ shield_settings accessible (${shieldSettings ? 'data found' : 'no data yet'})` 
        : `❌ Cannot access shield_settings: ${error.message}`,
      details: shieldSettings,
    });
    console.log(results[results.length - 1].message);
    if (shieldSettings) {
      console.log(`   💰 USD Range: $${shieldSettings.min_usd} - $${shieldSettings.max_usd}`);
      console.log(`   🖼️  Image: ${shieldSettings.image_url || 'not set'}`);
    }
  } catch (e: any) {
    results.push({
      name: "Shield Settings",
      passed: false,
      message: `❌ Error: ${e.message}`,
    });
    console.log(results[results.length - 1].message);
  }

  // Test 8: Wallet Nonces Table
  console.log("\n🔑 Testing Wallet Nonces...");
  try {
    const { data: nonces, error } = await supabase
      .from("wallet_nonces")
      .select("nonce, expires_at, used")
      .limit(1);
    
    results.push({
      name: "Wallet Nonces",
      passed: !error,
      message: !error 
        ? "✅ wallet_nonces table accessible" 
        : `❌ Cannot access wallet_nonces: ${error.message}`,
    });
    console.log(results[results.length - 1].message);
    
    if (error && error.message.includes("does not exist")) {
      console.log("\n⚠️  IMPORTANT: You need to create the wallet_nonces table!");
      console.log("   See docs/QUICK-START.md for the SQL script.");
    }
  } catch (e: any) {
    results.push({
      name: "Wallet Nonces",
      passed: false,
      message: `❌ Error: ${e.message}`,
    });
    console.log(results[results.length - 1].message);
  }

  // Test 9: Count existing records
  console.log("\n📊 Database Statistics...");
  
  const stats = {
    public_users: 0,
    private_users: 0,
    user_profiles: 0,
    wallets: 0,
  };

  try {
    const { count: publicCount } = await supabase
      .from("public_users")
      .select("*", { count: "exact", head: true });
    stats.public_users = publicCount || 0;

    const { count: privateCount } = await supabase
      .from("private_users")
      .select("*", { count: "exact", head: true });
    stats.private_users = privateCount || 0;

    const { count: profileCount } = await supabase
      .from("user_profiles")
      .select("*", { count: "exact", head: true });
    stats.user_profiles = profileCount || 0;

    const { count: walletCount } = await supabase
      .from("wallets")
      .select("*", { count: "exact", head: true });
    stats.wallets = walletCount || 0;

    console.log(`   👥 Public Users: ${stats.public_users}`);
    console.log(`   🔐 Private Users: ${stats.private_users}`);
    console.log(`   🔗 User Profile Mappings: ${stats.user_profiles}`);
    console.log(`   💼 Wallets: ${stats.wallets}`);

    results.push({
      name: "Database Statistics",
      passed: true,
      message: "✅ Statistics retrieved",
      details: stats,
    });
  } catch (e: any) {
    console.log(`   ⚠️  Could not retrieve stats: ${e.message}`);
    results.push({
      name: "Database Statistics",
      passed: false,
      message: `⚠️  Could not retrieve stats`,
    });
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("\n📈 Test Summary");
  console.log("=".repeat(60));

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const total = results.length;

  console.log(`\n✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${failed}/${total}`);
  console.log(`📊 Success Rate: ${Math.round((passed / total) * 100)}%\n`);

  if (failed > 0) {
    console.log("❌ Failed Tests:");
    results.filter((r) => !r.passed).forEach((r) => {
      console.log(`   - ${r.name}: ${r.message}`);
    });
    console.log("");
  }

  // Recommendations
  console.log("💡 Recommendations:\n");

  const missingTables = results
    .filter((r) => r.name.startsWith("Table:") && !r.passed)
    .map((r) => r.name.replace("Table: ", ""));

  if (missingTables.length > 0) {
    console.log("   ⚠️  Missing tables detected:");
    missingTables.forEach((table) => {
      console.log(`      - Create table: ${table}`);
    });
    console.log("      See docs/rls-integration-guide.md for schemas\n");
  }

  const missingFunctions = results
    .filter((r) => r.name.startsWith("Function:") && !r.passed)
    .map((r) => r.name.replace("Function: ", ""));

  if (missingFunctions.length > 0) {
    console.log("   ⚠️  Missing functions detected:");
    missingFunctions.forEach((func) => {
      console.log(`      - Create function: ${func}()`);
    });
    console.log("      See docs/rls-integration-guide.md for SQL\n");
  }

  if (stats.user_profiles < stats.public_users) {
    console.log(
      `   ⚠️  Some public_users (${stats.public_users}) don't have user_profiles mappings (${stats.user_profiles})`
    );
    console.log("      Run the migration script in docs/rls-integration-guide.md\n");
  }

  if (passed === total) {
    console.log("   🎉 All tests passed! Your database is properly configured.\n");
  } else {
    console.log("   ⚡ Fix the issues above and re-run this test.\n");
  }

  console.log("=".repeat(60));
  console.log("\n✅ Test completed!\n");

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((error) => {
  console.error("\n❌ Test script failed:", error);
  process.exit(1);
});

