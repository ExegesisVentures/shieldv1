#!/usr/bin/env tsx

/**
 * ============================================
 * TEST RATE CACHE REFRESH
 * ============================================
 * 
 * This script tests that the rate cache refresh
 * system works with the imported trading pairs.
 * 
 * File: /scripts/test-rate-cache-refresh.ts
 * 
 * Usage:
 *   cd shuieldnestorg
 *   npx tsx scripts/test-rate-cache-refresh.ts
 */

import { createClient } from '@supabase/supabase-js';
import { join } from 'path';
import { config } from 'dotenv';

// Load environment variables
config({ path: join(process.cwd(), '.env.local') });

// ============================================
// UTILITY FUNCTIONS
// ============================================

function logSection(title: string) {
  console.log('\n' + '='.repeat(70));
  console.log(title);
  console.log('='.repeat(70));
}

function logStep(message: string) {
  console.log(`\n📍 ${message}`);
}

function logSuccess(message: string) {
  console.log(`✅ ${message}`);
}

function logError(message: string) {
  console.log(`❌ ${message}`);
}

function logInfo(message: string) {
  console.log(`ℹ️  ${message}`);
}

// ============================================
// CREATE SUPABASE CLIENT
// ============================================

function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Missing Supabase credentials. Please ensure .env.local contains:\n' +
      '  NEXT_PUBLIC_SUPABASE_URL\n' +
      '  SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)'
    );
  }
  
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

// ============================================
// TEST FUNCTIONS
// ============================================

async function testDatabasePairs() {
  logStep('Testing database pairs...');
  
  const supabase = createServerSupabaseClient();
  
  const { data: pairs, count, error } = await supabase
    .from('coreum_pairs')
    .select('pair_id, symbol, base_denom, quote_denom, source', { count: 'exact' })
    .eq('is_active', true)
    .limit(10);
  
  if (error) {
    logError(`Failed to fetch pairs: ${error.message}`);
    return false;
  }
  
  logSuccess(`Found ${count} active trading pairs`);
  
  if (pairs && pairs.length > 0) {
    logInfo(`Sample pairs:`);
    pairs.slice(0, 5).forEach(p => {
      console.log(`   - ${p.symbol} (${p.source})`);
    });
  }
  
  return count && count > 0;
}

async function testVPSQuote() {
  logStep('Testing VPS quote endpoint...');
  
  const supabase = createServerSupabaseClient();
  
  // Get a sample pair
  const { data: pair } = await supabase
    .from('coreum_pairs')
    .select('*')
    .eq('is_active', true)
    .limit(1)
    .single();
  
  if (!pair) {
    logError('No pairs found to test');
    return false;
  }
  
  logInfo(`Testing with pair: ${pair.symbol}`);
  
  try {
    const vpsBase = process.env.NEXT_PUBLIC_COREDEX_API || 'http://168.231.127.180:8080/api';
    const quoteUrl = `${vpsBase}/quote?from=${encodeURIComponent(pair.base_denom)}&to=${encodeURIComponent(pair.quote_denom)}`;
    
    const response = await fetch(quoteUrl);
    
    if (!response.ok) {
      logError(`VPS quote failed: ${response.status}`);
      return false;
    }
    
    const data = await response.json();
    
    if (typeof data.rate === 'number') {
      logSuccess(`VPS returned rate: ${data.rate}`);
      if (data.path) {
        logInfo(`Path: ${JSON.stringify(data.path)}`);
      }
      return true;
    } else {
      logError(`Invalid rate data: ${JSON.stringify(data)}`);
      return false;
    }
  } catch (error) {
    logError(`VPS test failed: ${error}`);
    return false;
  }
}

async function testRateCacheTable() {
  logStep('Checking rate cache table...');
  
  const supabase = createServerSupabaseClient();
  
  const { count: beforeCount } = await supabase
    .from('rates_cache')
    .select('*', { count: 'exact', head: true });
  
  logInfo(`Cached rates before: ${beforeCount || 0}`);
  
  // Try to manually cache one rate
  const { data: pair } = await supabase
    .from('coreum_pairs')
    .select('*')
    .eq('is_active', true)
    .limit(1)
    .single();
  
  if (!pair) {
    logError('No pairs to test caching');
    return false;
  }
  
  try {
    const vpsBase = process.env.NEXT_PUBLIC_COREDEX_API || 'http://168.231.127.180:8080/api';
    const quoteUrl = `${vpsBase}/quote?from=${encodeURIComponent(pair.base_denom)}&to=${encodeURIComponent(pair.quote_denom)}`;
    
    const response = await fetch(quoteUrl);
    const data = await response.json();
    
    if (typeof data.rate === 'number') {
      const expiresAt = new Date(Date.now() + 60000).toISOString(); // 60 seconds
      
      const { error } = await supabase
        .from('rates_cache')
        .upsert({
          from_denom: pair.base_denom,
          to_denom: pair.quote_denom,
          rate: data.rate,
          source: 'VPS',
          path: data.path ? JSON.stringify(data.path) : null,
          liquidity: data.liquidity || null,
          expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'from_denom,to_denom' });
      
      if (error) {
        logError(`Failed to cache rate: ${error.message}`);
        return false;
      }
      
      logSuccess(`Successfully cached rate for ${pair.symbol}`);
      
      const { count: afterCount } = await supabase
        .from('rates_cache')
        .select('*', { count: 'exact', head: true });
      
      logInfo(`Cached rates after: ${afterCount || 0}`);
      
      return true;
    }
  } catch (error) {
    logError(`Cache test failed: ${error}`);
    return false;
  }
  
  return false;
}

async function summarizeSystem() {
  logStep('System summary...');
  
  const supabase = createServerSupabaseClient();
  
  const { count: pairCount } = await supabase
    .from('coreum_pairs')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);
  
  const { count: tokenCount } = await supabase
    .from('coreum_tokens')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);
  
  const { count: cacheCount } = await supabase
    .from('rates_cache')
    .select('*', { count: 'exact', head: true });
  
  console.log('\n📊 System Status:');
  console.log(`   Active Trading Pairs: ${pairCount || 0}`);
  console.log(`   Active Tokens: ${tokenCount || 0}`);
  console.log(`   Cached Rates: ${cacheCount || 0}`);
  
  return {
    pairs: pairCount || 0,
    tokens: tokenCount || 0,
    cached: cacheCount || 0
  };
}

// ============================================
// MAIN EXECUTION
// ============================================

async function main() {
  logSection('🧪 TEST RATE CACHE REFRESH SYSTEM');
  console.log(`Started at: ${new Date().toISOString()}\n`);
  
  try {
    const results = {
      databasePairs: false,
      vpsQuote: false,
      cacheTable: false,
    };
    
    // Test 1: Database has pairs
    results.databasePairs = await testDatabasePairs();
    
    // Test 2: VPS quote endpoint works
    if (results.databasePairs) {
      results.vpsQuote = await testVPSQuote();
    }
    
    // Test 3: Can cache rates
    if (results.vpsQuote) {
      results.cacheTable = await testRateCacheTable();
    }
    
    // Summary
    const summary = await summarizeSystem();
    
    logSection('📊 TEST RESULTS');
    
    console.log('\n✅ Test Results:');
    console.log(`   Database has pairs: ${results.databasePairs ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   VPS quote works: ${results.vpsQuote ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Rate caching works: ${results.cacheTable ? '✅ PASS' : '❌ FAIL'}`);
    
    const allPassed = results.databasePairs && results.vpsQuote && results.cacheTable;
    
    if (allPassed) {
      logSection('🎉 ALL TESTS PASSED');
      console.log('\n✅ Rate cache refresh system is working!');
      console.log('\n🚀 Ready for:');
      console.log('   1. Automated rate cache refresh (cron job)');
      console.log('   2. Production deployment');
      console.log('   3. Real-time price aggregation');
    } else {
      logSection('⚠️ SOME TESTS FAILED');
      console.log('\n❌ Please check the errors above and fix before proceeding.');
    }
    
    console.log(`\n⏰ Completed at: ${new Date().toISOString()}`);
    
    process.exit(allPassed ? 0 : 1);
    
  } catch (error) {
    logSection('❌ TEST FAILED');
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);

