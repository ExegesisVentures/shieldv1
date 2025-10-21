/**
 * Pre-flight Setup Check
 * Verifies environment variables and basic configuration
 * 
 * Run with: npx tsx scripts/check-setup.ts
 */

import { config } from "dotenv";

// Load .env.local
config({ path: ".env.local" });

console.log("🔍 Checking ShieldNest Setup...\n");
console.log("=" .repeat(60));

let hasErrors = false;

// Check 1: Environment Variables
console.log("\n📋 Checking Environment Variables...");

const requiredEnvVars = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
];

requiredEnvVars.forEach((varName) => {
  const value = process.env[varName];
  if (!value) {
    console.log(`❌ ${varName} is NOT set`);
    hasErrors = true;
  } else {
    console.log(`✅ ${varName} is set`);
    if (varName === "NEXT_PUBLIC_SUPABASE_URL") {
      console.log(`   URL: ${value}`);
    } else {
      console.log(`   Key: ${value.substring(0, 20)}...`);
    }
  }
});

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (serviceRoleKey) {
  console.log(`✅ SUPABASE_SERVICE_ROLE_KEY is set (optional but recommended for testing)`);
  console.log(`   Key: ${serviceRoleKey.substring(0, 20)}...`);
} else {
  console.log(`⚠️  SUPABASE_SERVICE_ROLE_KEY is NOT set (optional)`);
}

// Check 2: Files
console.log("\n📁 Checking Project Files...");

const fs = require("fs");
const path = require("path");

const requiredFiles = [
  "utils/supabase/user-profile.ts",
  "app/actions.ts",
  "app/api/auth/wallet/nonce/route.ts",
  "app/api/auth/wallet/verify/route.ts",
  "docs/rls-integration-guide.md",
];

requiredFiles.forEach((file) => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} NOT FOUND`);
    hasErrors = true;
  }
});

// Check 3: Dependencies
console.log("\n📦 Checking Dependencies...");

try {
  require("@supabase/supabase-js");
  console.log("✅ @supabase/supabase-js installed");
} catch {
  console.log("❌ @supabase/supabase-js NOT installed");
  hasErrors = true;
}

try {
  require("@supabase/ssr");
  console.log("✅ @supabase/ssr installed");
} catch {
  console.log("❌ @supabase/ssr NOT installed");
  hasErrors = true;
}

// Summary
console.log("\n" + "=".repeat(60));
console.log("\n📊 Summary\n");

if (hasErrors) {
  console.log("❌ Setup is INCOMPLETE\n");
  console.log("📝 Next Steps:");
  console.log("   1. Copy .env.local.template to .env.local");
  console.log("   2. Fill in your Supabase credentials");
  console.log("   3. Run: pnpm install");
  console.log("   4. Re-run this script\n");
  process.exit(1);
} else if (!serviceRoleKey) {
  console.log("⚠️  Setup is MOSTLY complete\n");
  console.log("📝 Optional:");
  console.log("   - Add SUPABASE_SERVICE_ROLE_KEY to .env.local for full testing");
  console.log("   - This allows testing with elevated permissions\n");
  console.log("✅ You can proceed with basic testing!\n");
  process.exit(0);
} else {
  console.log("✅ Setup is COMPLETE!\n");
  console.log("🚀 Next Steps:");
  console.log("   - Run: npx tsx scripts/test-rls-setup.ts");
  console.log("   - Run: pnpm dev (in another terminal)");
  console.log("   - Run: npx tsx scripts/test-api-routes.ts\n");
  process.exit(0);
}

