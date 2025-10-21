#!/usr/bin/env tsx

/**
 * ============================================
 * IMPORT ALL TRADING PAIRS FROM ROOT FILE
 * ============================================
 * 
 * This script imports ALL 111 trading pairs from the complete
 * coreum_tokens.json file in the project root.
 * 
 * This ensures the aggregator has access to all available pairs.
 * 
 * File: /scripts/import-all-pairs-from-root.ts
 * 
 * Usage:
 *   cd shuieldnestorg
 *   npx tsx scripts/import-all-pairs-from-root.ts
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

interface RootTokenData {
  denom: string;
  symbol: string;
  name: string;
  type: 'native' | 'cw20' | 'xrpl' | 'ibc';
  contractAddress?: string;
  decimals: number;
}

interface RootPairData {
  id: string;
  source: string;
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  baseDenom: string;
  quoteDenom: string;
  poolContract: string;
  liquidityToken: string | null;
  decimals: [number, number];
  is_active?: boolean;
}

interface RootFileData {
  metadata: {
    generatedAt: string;
    source: string;
    totalPairs: number;
    totalTokens: number;
  };
  tokens: RootTokenData[];
  pairs?: RootPairData[];
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
// LOAD DATA FROM ROOT FILE
// ============================================

function loadCompleteDataFromRoot(): RootFileData {
  logStep('Loading complete data from root coreum_tokens.json...');
  
  try {
    const rootPath = join(process.cwd(), '..', 'coreum_tokens.json');
    const rawData = readFileSync(rootPath, 'utf-8');
    const data: RootFileData = JSON.parse(rawData);
    
    logSuccess(`Loaded ${data.tokens.length} tokens and ${data.pairs?.length || 0} pairs from root file`);
    logInfo(`Total pairs in metadata: ${data.metadata.totalPairs}`);
    
    return data;
  } catch (error) {
    logError(`Failed to load root file: ${error}`);
    throw error;
  }
}

// ============================================
// IMPORT TO DATABASE
// ============================================

async function importTokensToDatabase(tokens: RootTokenData[]) {
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
  }));
  
  // Import in batches of 50
  let imported = 0;
  for (let i = 0; i < tokensToInsert.length; i += 50) {
    const batch = tokensToInsert.slice(i, i + 50);
    const { error } = await supabase
      .from('coreum_tokens')
      .upsert(batch, { 
        onConflict: 'denom',
        ignoreDuplicates: false
      });
    
    if (error) {
      logError(`Failed to import token batch ${i}-${i + batch.length}: ${error.message}`);
    } else {
      imported += batch.length;
    }
  }
  
  logSuccess(`Successfully imported ${imported}/${tokensToInsert.length} tokens`);
  return imported;
}

async function importPairsToDatabase(pairs: RootPairData[]) {
  logStep('Importing trading pairs to database...');
  
  const supabase = createServerSupabaseClient();
  
  const pairsToInsert = pairs.map(pair => {
    // Normalize source name
    const source = pair.source.toLowerCase().replace(/\s+/g, '-');
    
    return {
      pair_id: pair.id,
      source: source,
      symbol: pair.symbol,
      base_asset: pair.baseAsset,
      quote_asset: pair.quoteAsset,
      base_denom: pair.baseDenom,
      quote_denom: pair.quoteDenom,
      pool_contract: pair.poolContract,
      liquidity_token: pair.liquidityToken,
      base_decimals: pair.decimals[0],
      quote_decimals: pair.decimals[1],
      is_active: pair.is_active !== false, // Default to true
    };
  });
  
  logInfo(`Prepared ${pairsToInsert.length} pair entries`);
  
  // Import in batches of 50
  let imported = 0;
  for (let i = 0; i < pairsToInsert.length; i += 50) {
    const batch = pairsToInsert.slice(i, i + 50);
    const { error } = await supabase
      .from('coreum_pairs')
      .upsert(batch, { 
        onConflict: 'pair_id',
        ignoreDuplicates: false
      });
    
    if (error) {
      logError(`Failed to import pair batch ${i}-${i + batch.length}: ${error.message}`);
    } else {
      imported += batch.length;
      logInfo(`Progress: ${imported}/${pairsToInsert.length} pairs imported`);
    }
  }
  
  logSuccess(`Successfully imported ${imported}/${pairsToInsert.length} trading pairs`);
  return imported;
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
    .eq('source', 'pulsara')
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
  logSection('🚀 IMPORT ALL TRADING PAIRS FROM ROOT FILE');
  console.log(`Started at: ${new Date().toISOString()}\n`);
  
  try {
    // 1. Load complete data from root file
    const data = loadCompleteDataFromRoot();
    
    if (!data.pairs || data.pairs.length === 0) {
      logError('No pairs found in root file!');
      process.exit(1);
    }
    
    // 2. Import tokens first (pairs depend on tokens)
    const tokensImported = await importTokensToDatabase(data.tokens);
    
    // 3. Import trading pairs
    const pairsImported = await importPairsToDatabase(data.pairs);
    
    // 4. Verify import
    const { tokenCount, pairCount } = await verifyImport();
    
    // 5. Generate report
    logSection('📊 IMPORT REPORT');
    
    console.log('\n✅ Import Summary:');
    console.log(`   Tokens imported: ${tokensImported}`);
    console.log(`   Pairs imported: ${pairsImported}`);
    console.log(`   Total active tokens in DB: ${tokenCount}`);
    console.log(`   Total active pairs in DB: ${pairCount}`);
    console.log(`   Expected pairs: ${data.metadata.totalPairs}`);
    
    if (pairCount && pairCount >= data.metadata.totalPairs * 0.9) {
      logSuccess('Import is complete! At least 90% of expected pairs are in the database.');
    } else {
      logError(`Warning: Only ${pairCount} pairs imported, expected ${data.metadata.totalPairs}`);
    }
    
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

