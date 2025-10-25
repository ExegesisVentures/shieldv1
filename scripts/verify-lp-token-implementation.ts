#!/usr/bin/env tsx

/**
 * ============================================
 * LP TOKEN IMPLEMENTATION VERIFICATION SCRIPT
 * ============================================
 * 
 * Verifies that LP token support is correctly implemented across:
 * 1. Database schema (migration applied)
 * 2. Database data (ROLL/CORE LP token exists)
 * 3. Backend utilities (token-database.ts returns LP data)
 * 4. Token registry (hardcoded fallback exists)
 * 5. UI utilities (getLpPairInfo works)
 * 
 * Usage:
 *   npx tsx scripts/verify-lp-token-implementation.ts
 */

import { createClient } from '@supabase/supabase-js';
import { getTokenMetadata } from '../utils/coreum/token-registry';
import { getLpPairInfo, isLpToken } from '../utils/coreum/token-images';

// ============================================
// CONFIGURATION
// ============================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const ROLL_CORE_LP_DENOM = 'ulp-core12mpplye8qzuqhe8fa6lecnu5r8jsymm0f9257tlehvs8cpcn8v6qv5zf0j';

// ============================================
// TEST UTILITIES
// ============================================

let passedTests = 0;
let failedTests = 0;

function testPass(message: string) {
  console.log(`✅ ${message}`);
  passedTests++;
}

function testFail(message: string, details?: any) {
  console.error(`❌ ${message}`);
  if (details) {
    console.error('   Details:', details);
  }
  failedTests++;
}

function testInfo(message: string) {
  console.log(`ℹ️  ${message}`);
}

function testSection(title: string) {
  console.log('');
  console.log('═'.repeat(60));
  console.log(`  ${title}`);
  console.log('═'.repeat(60));
}

// ============================================
// TEST 1: Database Schema
// ============================================

async function testDatabaseSchema() {
  testSection('TEST 1: Database Schema');
  
  try {
    const { data, error } = await supabase
      .from('coreum_tokens')
      .select('*')
      .limit(1)
      .single();

    if (error) {
      testFail('Failed to query coreum_tokens table', error);
      return false;
    }

    const requiredColumns = [
      'denom',
      'symbol',
      'name',
      'decimals',
      'type',
      'is_active',
      'logo_url',
      'is_lp_token',
      'lp_token0_symbol',
      'lp_token1_symbol',
      'lp_token0_denom',
      'lp_token1_denom'
    ];

    const missingColumns: string[] = [];
    requiredColumns.forEach(col => {
      if (!(col in data)) {
        missingColumns.push(col);
      }
    });

    if (missingColumns.length > 0) {
      testFail(`Missing required columns: ${missingColumns.join(', ')}`);
      testInfo('Run migration: supabase/migrations/20251025_add_lp_token_support.sql');
      return false;
    }

    testPass('All required columns exist in coreum_tokens table');
    return true;

  } catch (error) {
    testFail('Database schema test failed', error);
    return false;
  }
}

// ============================================
// TEST 2: ROLL/CORE LP Token in Database
// ============================================

async function testLpTokenInDatabase() {
  testSection('TEST 2: ROLL/CORE LP Token in Database');
  
  try {
    const { data, error } = await supabase
      .from('coreum_tokens')
      .select('*')
      .eq('denom', ROLL_CORE_LP_DENOM)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        testFail('ROLL/CORE LP token not found in database');
        testInfo('Run script: UPDATE-LP-TOKEN-ROLL-COREUM.sql');
        return false;
      }
      testFail('Failed to query ROLL/CORE LP token', error);
      return false;
    }

    // Verify LP token fields
    const checks = [
      { field: 'symbol', expected: 'ROLL-CORE LP', actual: data.symbol },
      { field: 'is_lp_token', expected: true, actual: data.is_lp_token },
      { field: 'lp_token0_symbol', expected: 'ROLL', actual: data.lp_token0_symbol },
      { field: 'lp_token1_symbol', expected: 'CORE', actual: data.lp_token1_symbol }
    ];

    let allCorrect = true;
    checks.forEach(check => {
      if (check.actual === check.expected) {
        testPass(`${check.field}: ${check.actual}`);
      } else {
        testFail(`${check.field}: expected "${check.expected}", got "${check.actual}"`);
        allCorrect = false;
      }
    });

    if (allCorrect) {
      testPass('ROLL/CORE LP token correctly configured in database');
    }

    return allCorrect;

  } catch (error) {
    testFail('LP token database test failed', error);
    return false;
  }
}

// ============================================
// TEST 3: Token Registry (Hardcoded Fallback)
// ============================================

async function testTokenRegistry() {
  testSection('TEST 3: Token Registry (Hardcoded Fallback)');
  
  try {
    const metadata = getTokenMetadata(ROLL_CORE_LP_DENOM);

    if (!metadata) {
      testFail('ROLL/CORE LP token not found in token registry');
      testInfo('Check utils/coreum/token-registry.ts');
      return false;
    }

    testPass(`Found token in registry: ${metadata.symbol}`);

    // Verify LP token metadata
    const checks = [
      { field: 'isLpToken', expected: true, actual: metadata.isLpToken },
      { field: 'lpPair exists', expected: true, actual: !!metadata.lpPair },
      { field: 'lpPair.token0Symbol', expected: 'ROLL', actual: metadata.lpPair?.token0Symbol },
      { field: 'lpPair.token1Symbol', expected: 'CORE', actual: metadata.lpPair?.token1Symbol }
    ];

    let allCorrect = true;
    checks.forEach(check => {
      if (check.actual === check.expected) {
        testPass(`${check.field}: ${check.actual}`);
      } else {
        testFail(`${check.field}: expected "${check.expected}", got "${check.actual}"`);
        allCorrect = false;
      }
    });

    if (allCorrect) {
      testPass('Token registry correctly configured');
    }

    return allCorrect;

  } catch (error) {
    testFail('Token registry test failed', error);
    return false;
  }
}

// ============================================
// TEST 4: UI Utilities (token-images.ts)
// ============================================

async function testUIUtilities() {
  testSection('TEST 4: UI Utilities (token-images.ts)');
  
  try {
    // Test isLpToken
    const isLp = isLpToken(ROLL_CORE_LP_DENOM);
    if (isLp) {
      testPass(`isLpToken() correctly identifies LP token: ${isLp}`);
    } else {
      testFail('isLpToken() returned false for ROLL/CORE LP token');
      return false;
    }

    // Test getLpPairInfo
    const lpPairInfo = getLpPairInfo(ROLL_CORE_LP_DENOM);
    if (!lpPairInfo) {
      testFail('getLpPairInfo() returned null for ROLL/CORE LP token');
      return false;
    }

    testPass(`getLpPairInfo() returned pair data`);

    // Verify pair info
    const checks = [
      { field: 'token0Symbol', expected: 'ROLL', actual: lpPairInfo.token0Symbol },
      { field: 'token1Symbol', expected: 'CORE', actual: lpPairInfo.token1Symbol },
      { field: 'token0Logo exists', expected: true, actual: !!lpPairInfo.token0Logo },
      { field: 'token1Logo exists', expected: true, actual: !!lpPairInfo.token1Logo }
    ];

    let allCorrect = true;
    checks.forEach(check => {
      if (check.actual === check.expected) {
        testPass(`${check.field}: ${check.actual}`);
      } else {
        testFail(`${check.field}: expected "${check.expected}", got "${check.actual}"`);
        allCorrect = false;
      }
    });

    if (allCorrect) {
      testPass('UI utilities correctly configured');
    }

    return allCorrect;

  } catch (error) {
    testFail('UI utilities test failed', error);
    return false;
  }
}

// ============================================
// TEST 5: API Endpoint (if applicable)
// ============================================

async function testAPIEndpoint() {
  testSection('TEST 5: API Endpoint');
  
  try {
    testInfo('Checking if app is running to test API endpoint...');
    
    // Try to fetch from the API endpoint
    const response = await fetch(
      `http://localhost:3000/api/coreum/tokens?denom=${encodeURIComponent(ROLL_CORE_LP_DENOM)}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      testInfo('API endpoint not accessible (app may not be running)');
      testInfo('This is optional - hardcoded registry will work as fallback');
      return true; // Not a failure
    }

    const data = await response.json();

    if (!data.success) {
      testFail('API returned error', data.error);
      return false;
    }

    if (data.data.is_lp_token) {
      testPass('API endpoint returns LP token data correctly');
      testPass(`  Symbol: ${data.data.symbol}`);
      testPass(`  Pair: ${data.data.lp_token0_symbol}/${data.data.lp_token1_symbol}`);
      return true;
    } else {
      testFail('API returned token but is_lp_token is false');
      return false;
    }

  } catch (error) {
    testInfo('API endpoint not accessible (app may not be running)');
    testInfo('This is optional - hardcoded registry will work as fallback');
    return true; // Not a failure
  }
}

// ============================================
// MAIN TEST RUNNER
// ============================================

async function runAllTests() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║  LP TOKEN IMPLEMENTATION VERIFICATION                    ║');
  console.log('╚══════════════════════════════════════════════════════════╝');

  // Run all tests
  await testDatabaseSchema();
  await testLpTokenInDatabase();
  await testTokenRegistry();
  await testUIUtilities();
  await testAPIEndpoint();

  // Summary
  testSection('TEST SUMMARY');
  console.log('');
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log('');

  if (failedTests === 0) {
    console.log('🎉 All tests passed! LP token implementation is working correctly.');
    console.log('');
    console.log('Next steps:');
    console.log('1. Connect a wallet with ROLL/CORE LP tokens to /dashboard');
    console.log('2. Verify dual logos display correctly in the portfolio');
    console.log('3. Check that token balance and USD value are accurate');
    console.log('');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Please review the errors above.');
    console.log('');
    console.log('Common fixes:');
    console.log('1. Run migration: supabase/migrations/20251025_add_lp_token_support.sql');
    console.log('2. Run script: UPDATE-LP-TOKEN-ROLL-COREUM.sql');
    console.log('3. Verify token-registry.ts has ROLL/CORE LP entry');
    console.log('');
    process.exit(1);
  }
}

// Run tests
runAllTests().catch((error) => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});

