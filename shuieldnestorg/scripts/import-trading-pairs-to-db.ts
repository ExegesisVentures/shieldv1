#!/usr/bin/env tsx

/**
 * ============================================
 * IMPORT TRADING PAIRS TO DATABASE
 * ============================================
 * 
 * This script imports trading pairs from the local JSON file
 * into the coreum_pairs and coreum_tokens database tables.
 * 
 * This ensures the aggregator and rate refresh system can
 * access all 74 trading pairs.
 * 
 * File: /scripts/import-trading-pairs-to-db.ts
 * 
 * Usage:
 *   cd shuieldnestorg
 *   npx tsx scripts/import-trading-pairs-to-db.ts
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';

// Load environment variables
config({ path: join(process.cwd(), '.env.local') });

// ============================================
// TYPES
// ============================================

interface TokenInfo {
  symbol: string;
  name: string;
  denom: string;
  contractAddress?: string;
  type: 'native' | 'cw20' | 'xrpl' | 'ibc';
  decimals: number;
  logo?: string;
  description?: string;
}

interface TradingPair {
  symbol: string;
  displaySymbol: string;
  baseDenom: string;
  quoteDenom: string;
  baseSymbol: string;
  quoteSymbol: string;
  apiSymbol: string;
  pools: Array<{
    dex: string;
    contract: string;
  }>;
  popular?: boolean;
}

interface TokensData {
  metadata: {
    generated: string;
    description: string;
    totalTokens: number;
  };
  tokens: TokenInfo[];
}

interface TradingPairsData {
  metadata: {
    generated: string;
    description: string;
    totalPairs: number;
    sources: string[];
  };
  pairs: TradingPair[];
}

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

function logWarning(message: string) {
  console.log(`⚠️  ${message}`);
}

function logError(message: string) {
  console.log(`❌ ${message}`);
}

function logInfo(message: string) {
  console.log(`ℹ️  ${message}`);
}

// ============================================
// LOAD DATA FROM JSON FILES
// ============================================

function loadTokensFromJSON(): TokenInfo[] {
  logStep('Loading tokens from tokens-list.json...');
  
  try {
    const tokensPath = join(process.cwd(), 'data', 'tokens-list.json');
    const rawData = readFileSync(tokensPath, 'utf-8');
    const data: TokensData = JSON.parse(rawData);
    
    logSuccess(`Loaded ${data.tokens.length} tokens from JSON`);
    return data.tokens;
  } catch (error) {
    logError(`Failed to load tokens: ${error}`);
    throw error;
  }
}

function loadTradingPairsFromJSON(): TradingPair[] {
  logStep('Loading trading pairs from trading-pairs.json...');
  
  try {
    const pairsPath = join(process.cwd(), 'data', 'trading-pairs.json');
    const rawData = readFileSync(pairsPath, 'utf-8');
    const data: TradingPairsData = JSON.parse(rawData);
    
    logSuccess(`Loaded ${data.pairs.length} trading pairs from JSON`);
    return data.pairs;
  } catch (error) {
    logError(`Failed to load trading pairs: ${error}`);
    throw error;
  }
}

// ============================================
// IMPORT TO DATABASE
// ============================================

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

async function importTokensToDatabase(tokens: TokenInfo[]) {
  logStep('Importing tokens to database...');
  
  const supabase = createServerSupabaseClient();
  
  const tokensToInsert = tokens.map(token => ({
    denom: token.denom,
    symbol: token.symbol,
    name: token.name,
    type: token.type,
    contract_address: token.contractAddress || null,
    decimals: token.decimals,
    is_active: true,
    // Note: logo and description fields might not exist in the schema
  }));
  
  const { data, error } = await supabase
    .from('coreum_tokens')
    .upsert(tokensToInsert, { 
      onConflict: 'denom',
      ignoreDuplicates: false // Update existing records
    });
  
  if (error) {
    logError(`Failed to import tokens: ${error.message}`);
    throw error;
  }
  
  logSuccess(`Successfully imported ${tokensToInsert.length} tokens`);
  return tokensToInsert.length;
}

async function importTradingPairsToDatabase(tradingPairs: TradingPair[]) {
  logStep('Importing trading pairs to database...');
  
  const supabase = createServerSupabaseClient();
  
  // First, get existing pairs to avoid duplicates
  const { data: existingPairs } = await supabase
    .from('coreum_pairs')
    .select('pair_id, base_denom, quote_denom, pool_contract');
  
  const existingPairIds = new Set((existingPairs || []).map(p => p.pair_id));
  
  const pairsToInsert = tradingPairs.flatMap((pair, index) => {
    // Create entries for each pool (DEX) in the pair
    return pair.pools.map((pool, poolIndex) => {
      const source = pool.dex.toLowerCase().replace(/\s+/g, '-');
      const pairId = `${source}-${pair.baseSymbol}-${pair.quoteSymbol}`.toLowerCase();
      
      return {
        pair_id: pairId,
        source: source,
        symbol: pair.displaySymbol,
        base_asset: pair.baseSymbol,
        quote_asset: pair.quoteSymbol,
        base_denom: pair.baseDenom,
        quote_denom: pair.quoteDenom,
        pool_contract: pool.contract,
        liquidity_token: null, // Can be populated later if needed
        base_decimals: 6, // Default for most Coreum tokens
        quote_decimals: 6, // Default for most Coreum tokens
        is_active: true,
      };
    });
  });
  
  logInfo(`Prepared ${pairsToInsert.length} pair entries (including multiple DEXs)`);
  
  const { data, error } = await supabase
    .from('coreum_pairs')
    .upsert(pairsToInsert, { 
      onConflict: 'pair_id',
      ignoreDuplicates: false // Update existing records
    });
  
  if (error) {
    logError(`Failed to import trading pairs: ${error.message}`);
    throw error;
  }
  
  logSuccess(`Successfully imported ${pairsToInsert.length} trading pair entries`);
  return pairsToInsert.length;
}

// ============================================
// VERIFY IMPORT
// ============================================

async function verifyImport() {
  logStep('Verifying import...');
  
  const supabase = createServerSupabaseClient();
  
  // Count tokens
  const { count: tokenCount, error: tokenError } = await supabase
    .from('coreum_tokens')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);
  
  if (tokenError) {
    logError(`Failed to verify tokens: ${tokenError.message}`);
  } else {
    logSuccess(`Database now contains ${tokenCount} active tokens`);
  }
  
  // Count pairs
  const { count: pairCount, error: pairError } = await supabase
    .from('coreum_pairs')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);
  
  if (pairError) {
    logError(`Failed to verify pairs: ${pairError.message}`);
  } else {
    logSuccess(`Database now contains ${pairCount} active trading pairs`);
  }
  
  // Get sample pairs by source
  const { data: pulsaraPairs } = await supabase
    .from('coreum_pairs')
    .select('symbol')
    .eq('source', 'pulsara-dex')
    .limit(5);
  
  const { data: cruisePairs } = await supabase
    .from('coreum_pairs')
    .select('symbol')
    .eq('source', 'cruise-control')
    .limit(5);
  
  if (pulsaraPairs && pulsaraPairs.length > 0) {
    logInfo(`Sample Pulsara pairs: ${pulsaraPairs.map(p => p.symbol).join(', ')}`);
  }
  
  if (cruisePairs && cruisePairs.length > 0) {
    logInfo(`Sample Cruise Control pairs: ${cruisePairs.map(p => p.symbol).join(', ')}`);
  }
  
  return { tokenCount, pairCount };
}

// ============================================
// MAIN EXECUTION
// ============================================

async function main() {
  logSection('🚀 IMPORT TRADING PAIRS TO DATABASE');
  console.log(`Started at: ${new Date().toISOString()}\n`);
  
  try {
    // 1. Load data from JSON files
    const tokens = loadTokensFromJSON();
    const tradingPairs = loadTradingPairsFromJSON();
    
    logInfo(`Loaded ${tokens.length} tokens and ${tradingPairs.length} trading pairs from JSON files`);
    
    // 2. Import tokens first (pairs depend on tokens)
    const tokensImported = await importTokensToDatabase(tokens);
    
    // 3. Import trading pairs
    const pairsImported = await importTradingPairsToDatabase(tradingPairs);
    
    // 4. Verify import
    const { tokenCount, pairCount } = await verifyImport();
    
    // 5. Generate report
    logSection('📊 IMPORT REPORT');
    
    console.log('\n✅ Import Summary:');
    console.log(`   Tokens imported: ${tokensImported}`);
    console.log(`   Pairs imported: ${pairsImported}`);
    console.log(`   Total active tokens in DB: ${tokenCount}`);
    console.log(`   Total active pairs in DB: ${pairCount}`);
    
    logSection('🎉 IMPORT COMPLETE');
    
    console.log('\n✅ All trading pairs are now in the database!');
    console.log('\n🚀 Next Steps:');
    console.log('   1. Run refresh_rates_cache to populate rates');
    console.log('   2. Test price aggregation with: npm run dev');
    console.log('   3. Check dashboard to see all pairs working');
    console.log('   4. Verify swap interface has access to all pairs');
    
    console.log(`\n⏰ Completed at: ${new Date().toISOString()}`);
    
  } catch (error) {
    logSection('❌ IMPORT FAILED');
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);

