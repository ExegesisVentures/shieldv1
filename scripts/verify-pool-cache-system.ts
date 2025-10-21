/**
 * Verification Script for Pool Caching System
 * 
 * This script tests:
 * 1. Database connection to active_pairs_with_tokens view
 * 2. Token metadata lookup
 * 3. Real-time price fetching from CoreDEX API
 * 4. Pool cache loading
 * 
 * Run: npx tsx scripts/verify-pool-cache-system.ts
 */

import { createClient } from '@supabase/supabase-js';
import { getTokenByDenom } from '../utils/coreum/token-database';
import { getTokenPrice } from '../utils/coreum/price-oracle';
import { getCachedPools } from '../utils/coreum/pool-cache';

// ============================================
// CONFIGURATION
// ============================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials');
  console.error('   Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================
// TEST FUNCTIONS
// ============================================

async function testDatabaseConnection() {
  console.log('\n=== Testing Database Connection ===\n');
  
  try {
    const { data, error } = await supabase
      .from('coreum_tokens')
      .select('count')
      .single();
    
    if (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection error:', error);
    return false;
  }
}

async function testActivePairsView() {
  console.log('\n=== Testing active_pairs_with_tokens View ===\n');
  
  try {
    const { data, error } = await supabase
      .from('active_pairs_with_tokens')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('❌ View query failed:', error.message);
      console.error('   The view may not exist. Run migration 20251010_view_active_pairs_with_tokens.sql');
      return false;
    }
    
    if (!data || data.length === 0) {
      console.warn('⚠️  View exists but has no data');
      console.warn('   Run: npx tsx scripts/import-trading-pairs-to-db.ts');
      return false;
    }
    
    console.log(`✅ active_pairs_with_tokens view found with ${data.length} sample rows`);
    console.log('\nSample row:');
    console.log(JSON.stringify(data[0], null, 2));
    
    return true;
  } catch (error) {
    console.error('❌ View query error:', error);
    return false;
  }
}

async function testTokenLookup() {
  console.log('\n=== Testing Token Database Lookup ===\n');
  
  const testDenoms = [
    'ucore',
    'drop-core1zhs909jp9yktml6qqx9f0ptcq2xnhhj99cja03j3lfcsp2pgm86studdrz', // XRP
    'xrpl11278ecf9e-core1zhs909jp9yktml6qqx9f0ptcq2xnhhj99cja03j3lfcsp2pgm86studdrz', // SOLO
  ];
  
  for (const denom of testDenoms) {
    try {
      const token = await getTokenByDenom(denom);
      
      if (token) {
        console.log(`✅ ${token.symbol}: ${token.decimals} decimals (${token.type})`);
      } else {
        console.log(`⚠️  ${denom.substring(0, 20)}...: Not found in database`);
      }
    } catch (error) {
      console.error(`❌ Error looking up ${denom}:`, error);
    }
  }
  
  return true;
}

async function testPriceFetching() {
  console.log('\n=== Testing Real-Time Price Fetching ===\n');
  
  const testSymbols = ['CORE', 'XRP', 'SOLO'];
  
  for (const symbol of testSymbols) {
    try {
      console.log(`Fetching price for ${symbol}...`);
      const priceData = await getTokenPrice(symbol);
      
      if (priceData) {
        console.log(`✅ ${symbol}: $${priceData.toFixed(6)}`);
      } else {
        console.log(`⚠️  ${symbol}: No price data available (may not be listed or has no liquidity)`);
      }
    } catch (error) {
      console.error(`❌ Error fetching price for ${symbol}:`, error);
    }
  }
  
  return true;
}

async function testPoolCacheLoading() {
  console.log('\n=== Testing Pool Cache Loading ===\n');
  
  try {
    console.log('Loading cached pools...');
    const startTime = Date.now();
    
    const pools = await getCachedPools();
    
    const loadTime = Date.now() - startTime;
    
    if (pools.length === 0) {
      console.warn('⚠️  No pools loaded from cache');
      console.warn('   Ensure database has trading pairs data');
      return false;
    }
    
    console.log(`✅ Loaded ${pools.length} pools in ${loadTime}ms`);
    
    const poolsWithPrices = pools.filter(p => p.price0 > 0 || p.price1 > 0);
    console.log(`💰 ${poolsWithPrices.length}/${pools.length} pools have real-time price data`);
    
    // Show sample pool
    console.log('\nSample pool:');
    const samplePool = pools[0];
    console.log({
      pair: `${samplePool.token0Symbol}/${samplePool.token1Symbol}`,
      dex: samplePool.dexName,
      price0: samplePool.price0,
      price1: samplePool.price1,
      change24h: samplePool.change24h,
    });
    
    return true;
  } catch (error) {
    console.error('❌ Error loading pool cache:', error);
    return false;
  }
}

async function testCoreDexAPI() {
  console.log('\n=== Testing CoreDEX API Endpoints ===\n');
  
  // Test tickers endpoint
  try {
    const baseUrl = process.env.NEXT_PUBLIC_COREDEX_URL || 'https://api.coredex.com';
    
    console.log(`Testing ${baseUrl}/api/tickers...`);
    const response = await fetch(`${baseUrl}/api/tickers`, {
      headers: {
        'Network': 'mainnet',
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.error(`❌ Tickers API returned ${response.status}`);
      return false;
    }
    
    const data = await response.json();
    const tickerCount = Object.keys(data.Tickers || {}).length;
    
    console.log(`✅ Tickers API working: ${tickerCount} tickers available`);
    
    // Show sample ticker
    const sampleTicker = Object.entries(data.Tickers || {})[0];
    if (sampleTicker) {
      const [symbol, ticker] = sampleTicker as [string, any];
      console.log(`\nSample ticker (${symbol}):`, {
        LastPrice: ticker.LastPrice,
        Volume: ticker.Volume,
        OpenPrice: ticker.OpenPrice,
      });
    }
    
    return true;
  } catch (error) {
    console.error('❌ CoreDEX API error:', error);
    return false;
  }
}

// ============================================
// MAIN TEST RUNNER
// ============================================

async function runAllTests() {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║   Pool Caching System Verification                  ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  
  const results = {
    database: await testDatabaseConnection(),
    view: await testActivePairsView(),
    tokenLookup: await testTokenLookup(),
    prices: await testPriceFetching(),
    poolCache: await testPoolCacheLoading(),
    api: await testCoreDexAPI(),
  };
  
  console.log('\n' + '='.repeat(60));
  console.log('TEST RESULTS SUMMARY');
  console.log('='.repeat(60));
  
  Object.entries(results).forEach(([test, passed]) => {
    const icon = passed ? '✅' : '❌';
    const status = passed ? 'PASS' : 'FAIL';
    console.log(`${icon} ${test.padEnd(20)} ${status}`);
  });
  
  const allPassed = Object.values(results).every(r => r);
  
  console.log('\n' + '='.repeat(60));
  if (allPassed) {
    console.log('✅ ALL TESTS PASSED');
    console.log('   The pool caching system is properly configured!');
  } else {
    console.log('❌ SOME TESTS FAILED');
    console.log('   Please fix the issues above before using the system.');
  }
  console.log('='.repeat(60) + '\n');
  
  process.exit(allPassed ? 0 : 1);
}

// Run tests
runAllTests().catch(error => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});

