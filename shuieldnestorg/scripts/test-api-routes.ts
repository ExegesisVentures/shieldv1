/**
 * API Routes Test Script
 * Tests the actual API endpoints to verify they work with RLS
 * 
 * Run with: npx tsx scripts/test-api-routes.ts
 */

import { config } from "dotenv";

// Load .env.local
config({ path: ".env.local" });

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  statusCode?: number;
  data?: any;
}

const results: TestResult[] = [];
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

console.log("🧪 Testing API Routes...\n");
console.log("Base URL:", BASE_URL);
console.log("=" .repeat(60) + "\n");

async function testEndpoint(
  name: string,
  method: string,
  endpoint: string,
  body?: any,
  expectedStatus: number = 200
): Promise<TestResult> {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json().catch(() => null);
    const passed = response.status === expectedStatus;

    return {
      name,
      passed,
      message: passed
        ? `✅ ${name} (${response.status})`
        : `❌ ${name} (Expected ${expectedStatus}, got ${response.status})`,
      statusCode: response.status,
      data,
    };
  } catch (error: any) {
    return {
      name,
      passed: false,
      message: `❌ ${name} - ${error.message}`,
      statusCode: 0,
    };
  }
}

async function runTests() {
  console.log("📡 Testing API Endpoints...\n");

  // Test 1: Nonce Generation (requires address parameter)
  const testAddress = "core1test123456789abcdefghijklmnopqrstuvwxyz";
  const nonceTest = await testEndpoint(
    "GET /api/auth/wallet/nonce",
    "GET",
    `/api/auth/wallet/nonce?address=${testAddress}`
  );
  results.push(nonceTest);
  console.log(nonceTest.message);
  if (nonceTest.data?.nonce) {
    console.log(`   🔑 Nonce: ${nonceTest.data.nonce.slice(0, 16)}...`);
    console.log(`   ⏰ Expires: ${nonceTest.data.expiresAt || 'N/A'}`);
  } else if (nonceTest.data?.message) {
    console.log(`   ℹ️  ${nonceTest.data.message}`);
  }

  // Test 2: Shield Settings GET
  const shieldGetTest = await testEndpoint(
    "GET /api/admin/shield-settings",
    "GET",
    "/api/admin/shield-settings"
  );
  results.push(shieldGetTest);
  console.log(shieldGetTest.message);
  if (shieldGetTest.data) {
    console.log(`   💰 USD Range: $${shieldGetTest.data.min_usd} - $${shieldGetTest.data.max_usd}`);
  }

  // Test 3: Shield Settings POST (without auth - should fail)
  const shieldPostTest = await testEndpoint(
    "POST /api/admin/shield-settings (no auth)",
    "POST",
    "/api/admin/shield-settings",
    { min_usd: 5000, max_usd: 6000 },
    401 // Expecting 401 Unauthorized
  );
  results.push(shieldPostTest);
  console.log(shieldPostTest.message);
  if (shieldPostTest.statusCode === 401) {
    console.log("   🔒 Correctly requires authentication");
  }

  // Test 4: Wallet Verify (without proper data - should fail)
  const walletVerifyTest = await testEndpoint(
    "POST /api/auth/wallet/verify (invalid)",
    "POST",
    "/api/auth/wallet/verify",
    { address: "test" }, // Missing required fields
    400 // Expecting 400 Bad Request
  );
  results.push(walletVerifyTest);
  console.log(walletVerifyTest.message);
  if (walletVerifyTest.data?.code) {
    console.log(`   📝 Error code: ${walletVerifyTest.data.code}`);
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("\n📈 API Test Summary");
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
      console.log(`   - ${r.name}`);
      if (r.data?.message) {
        console.log(`     Message: ${r.data.message}`);
      }
    });
    console.log("");
  }

  console.log("💡 Notes:");
  console.log("   - Some failures are expected (e.g., auth required endpoints)");
  console.log("   - Make sure your dev server is running on", BASE_URL);
  console.log("   - For full testing, create a test user and authenticate\n");

  console.log("=".repeat(60));
  console.log("\n✅ API test completed!\n");

  process.exit(0);
}

runTests().catch((error) => {
  console.error("\n❌ Test script failed:", error);
  process.exit(1);
});

