#!/usr/bin/env tsx

/**
 * ============================================
 * COREUM TOKENS AND PAIRS IMPORT SCRIPT
 * ============================================
 * 
 * This script imports the comprehensive Coreum token and pairs data
 * from coreum_tokens.json into the database for optimal performance.
 * 
 * Usage:
 *   cd shuieldnestorg
 *   npx tsx scripts/import-coreum-tokens.ts
 */

import { createSupabaseClient } from '../utils/supabase/client';
import fs from 'fs';
import path from 'path';

interface TokenData {
  denom: string;
  symbol: string;
  name: string;
  type: 'native' | 'cw20' | 'ibc' | 'xrpl';
  contractAddress?: string;
  decimals: number;
}

interface PairData {
  id: string;
  source: string;
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  baseDenom: string;
  quoteDenom: string;
  poolContract: string;
  liquidityToken?: string;
  decimals: [number, number];
}

interface CoreumTokensData {
  metadata: {
    generatedAt: string;
    source: string;
    totalPairs: number;
    totalTokens: number;
    sources: {
      pulsara: number;
      cruiseControl: number;
      cosm: number;
      coreumSupply: number;
    };
  };
  tokens: TokenData[];
  pairs: PairData[];
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function logInfo(message: string) {
  console.log(`ℹ️  ${message}`);
}

function logSuccess(message: string) {
  console.log(`✅ ${message}`);
}

function logError(message: string, error?: any) {
  console.error(`❌ ${message}`, error ? error : '');
}

function logProgress(current: number, total: number, item: string) {
  const percentage = Math.round((current / total) * 100);
  console.log(`🔄 [${percentage}%] ${item} (${current}/${total})`);
}

// ============================================
// DATABASE OPERATIONS
// ============================================

async function clearExistingData(supabase: any) {
  logInfo('Clearing existing token and pair data...');
  
  try {
    // Delete in correct order due to foreign key constraints
    const { error: pricesError } = await supabase
      .from('coreum_prices')
      .delete()
      .neq('id', 0); // Delete all rows
    
    if (pricesError) {
      logError('Error clearing prices:', pricesError);
    } else {
      logSuccess('Cleared existing price data');
    }

    const { error: pairsError } = await supabase
      .from('coreum_pairs')
      .delete()
      .neq('id', 0); // Delete all rows
    
    if (pairsError) {
      logError('Error clearing pairs:', pairsError);
    } else {
      logSuccess('Cleared existing pair data');
    }

    const { error: tokensError } = await supabase
      .from('coreum_tokens')
      .delete()
      .neq('id', 0); // Delete all rows
    
    if (tokensError) {
      logError('Error clearing tokens:', tokensError);
    } else {
      logSuccess('Cleared existing token data');
    }
  } catch (error) {
    logError('Error clearing existing data:', error);
    throw error;
  }
}

async function importTokens(supabase: any, tokens: TokenData[]) {
  logInfo(`Importing ${tokens.length} tokens...`);
  
  const tokenInserts = tokens.map(token => ({
    denom: token.denom,
    symbol: token.symbol,
    name: token.name,
    type: token.type,
    contract_address: token.contractAddress || null,
    decimals: token.decimals,
    is_active: true
  }));

  try {
    const { data, error } = await supabase
      .from('coreum_tokens')
      .insert(tokenInserts)
      .select();

    if (error) {
      logError('Error importing tokens:', error);
      throw error;
    }

    logSuccess(`Successfully imported ${data.length} tokens`);
    return data;
  } catch (error) {
    logError('Error importing tokens:', error);
    throw error;
  }
}

async function importPairs(supabase: any, pairs: PairData[]) {
  logInfo(`Importing ${pairs.length} pairs...`);
  
  const pairInserts = pairs.map(pair => ({
    pair_id: pair.id,
    source: pair.source,
    symbol: pair.symbol,
    base_asset: pair.baseAsset,
    quote_asset: pair.quoteAsset,
    base_denom: pair.baseDenom,
    quote_denom: pair.quoteDenom,
    pool_contract: pair.poolContract,
    liquidity_token: pair.liquidityToken || null,
    base_decimals: pair.decimals[0],
    quote_decimals: pair.decimals[1],
    is_active: true
  }));

  try {
    // Import in batches to avoid timeout
    const batchSize = 50;
    let imported = 0;
    
    for (let i = 0; i < pairInserts.length; i += batchSize) {
      const batch = pairInserts.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('coreum_pairs')
        .insert(batch)
        .select();

      if (error) {
        logError(`Error importing pair batch ${Math.floor(i / batchSize) + 1}:`, error);
        throw error;
      }

      imported += data.length;
      logProgress(imported, pairInserts.length, 'Importing pairs');
    }

    logSuccess(`Successfully imported ${imported} pairs`);
    return imported;
  } catch (error) {
    logError('Error importing pairs:', error);
    throw error;
  }
}

async function verifyImport(supabase: any) {
  logInfo('Verifying import...');
  
  try {
    // Count tokens
    const { count: tokenCount, error: tokenError } = await supabase
      .from('coreum_tokens')
      .select('*', { count: 'exact', head: true });

    if (tokenError) {
      logError('Error counting tokens:', tokenError);
    } else {
      logSuccess(`Verified: ${tokenCount} tokens in database`);
    }

    // Count pairs
    const { count: pairCount, error: pairError } = await supabase
      .from('coreum_pairs')
      .select('*', { count: 'exact', head: true });

    if (pairError) {
      logError('Error counting pairs:', pairError);
    } else {
      logSuccess(`Verified: ${pairCount} pairs in database`);
    }

    // Test a few queries
    const { data: sampleTokens, error: sampleError } = await supabase
      .from('coreum_tokens')
      .select('denom, symbol, type')
      .limit(5);

    if (sampleError) {
      logError('Error fetching sample tokens:', sampleError);
    } else {
      logSuccess('Sample tokens query successful');
      console.log('Sample tokens:', sampleTokens);
    }

    // Test pairs query
    const { data: samplePairs, error: samplePairsError } = await supabase
      .from('coreum_pairs')
      .select('pair_id, source, symbol')
      .limit(5);

    if (samplePairsError) {
      logError('Error fetching sample pairs:', samplePairsError);
    } else {
      logSuccess('Sample pairs query successful');
      console.log('Sample pairs:', samplePairs);
    }

  } catch (error) {
    logError('Error during verification:', error);
  }
}

// ============================================
// MAIN IMPORT FUNCTION
// ============================================

async function importCoreumTokens() {
  console.log('🚀 COREUM TOKENS AND PAIRS IMPORT');
  console.log('==================================');
  
  try {
    // Load the JSON data
    const jsonPath = path.join(__dirname, '../../coreum_tokens.json');
    logInfo(`Loading data from: ${jsonPath}`);
    
    if (!fs.existsSync(jsonPath)) {
      throw new Error(`File not found: ${jsonPath}`);
    }

    const jsonData = fs.readFileSync(jsonPath, 'utf8');
    const data: CoreumTokensData = JSON.parse(jsonData);
    
    logInfo(`Loaded data: ${data.tokens.length} tokens, ${data.pairs.length} pairs`);
    console.log('Metadata:', data.metadata);

    // Initialize Supabase client
    const supabase = createSupabaseClient();
    
    // Clear existing data
    await clearExistingData(supabase);
    
    // Import tokens
    await importTokens(supabase, data.tokens);
    
    // Import pairs
    await importPairs(supabase, data.pairs);
    
    // Verify import
    await verifyImport(supabase);
    
    console.log('');
    console.log('🎉 IMPORT COMPLETED SUCCESSFULLY!');
    console.log('================================');
    console.log(`✅ ${data.tokens.length} tokens imported`);
    console.log(`✅ ${data.pairs.length} pairs imported`);
    console.log('');
    console.log('Your Coreum token database is now ready for optimal performance!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Update your CoreDEX API to use the database');
    console.log('2. Create token lookup utilities');
    console.log('3. Implement price caching');
    
  } catch (error) {
    logError('Import failed:', error);
    process.exit(1);
  }
}

// Run the import
importCoreumTokens().catch(console.error);
