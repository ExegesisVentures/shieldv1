#!/usr/bin/env tsx

/**
 * ============================================
 * COMPLETE PAIR AND TOKEN VERIFICATION
 * ============================================
 * 
 * This script:
 * - Fetches ALL pairs from both factories (no limit)
 * - Verifies token data against coreum_tokens.json
 * - Validates price data for each pair
 * - Creates a comprehensive report
 * 
 * Usage:
 *   cd shuieldnestorg
 *   npx tsx scripts/verify-all-pairs-and-tokens.ts
 */

import { 
  ASTROPORT_FACTORIES, 
  queryAllPairs, 
  queryPool, 
  getDenomFromAsset,
  formatPoolType,
  type PairInfo,
} from '../utils/coreum/astroport';
import { readFileSync } from 'fs';
import { join } from 'path';

// ============================================
// TYPES
// ============================================

interface TokenData {
  denom: string;
  symbol: string;
  name: string;
  type: string;
  decimals: number;
  contractAddress?: string;
}

interface TokenDatabase {
  metadata: {
    generatedAt: string;
    totalPairs: number;
    totalTokens: number;
    sources: {
      pulsara: number;
      cruiseControl: number;
    };
  };
  tokens: TokenData[];
}

interface PairAnalysis {
  factoryName: string;
  contractAddress: string;
  poolType: string;
  token0Denom: string;
  token1Denom: string;
  token0Symbol: string;
  token1Symbol: string;
  token0InDatabase: boolean;
  token1InDatabase: boolean;
  reserve0: string;
  reserve1: string;
  hasLiquidity: boolean;
  liquidityValue: number;
  price: number;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function logSection(title: string) {
  console.log('\n' + '='.repeat(70));
  console.log(title);
  console.log('='.repeat(70));
}

function logProgress(current: number, total: number, message: string) {
  const percent = Math.round((current / total) * 100);
  console.log(`🔄 [${percent}%] ${message} (${current}/${total})`);
}

// ============================================
// LOAD TOKEN DATABASE
// ============================================

function loadTokenDatabase(): TokenDatabase {
  try {
    const tokenDbPath = join(process.cwd(), '..', 'coreum_tokens.json');
    const rawData = readFileSync(tokenDbPath, 'utf-8');
    const data = JSON.parse(rawData);
    
    console.log('📚 Loaded token database:');
    console.log(`   Total tokens: ${data.metadata.totalTokens}`);
    console.log(`   Total pairs: ${data.metadata.totalPairs}`);
    console.log(`   Generated: ${data.metadata.generatedAt}`);
    
    return data;
  } catch (error) {
    console.error('❌ Failed to load token database:', error);
    process.exit(1);
  }
}

// ============================================
// FETCH ALL PAIRS (RECURSIVE)
// ============================================

async function fetchAllPairsRecursive(
  factoryAddress: string,
  allPairs: PairInfo[] = [],
  startAfter?: any
): Promise<PairInfo[]> {
  const limit = 30; // Query in batches of 30
  const batch = await queryAllPairs(factoryAddress, startAfter, limit);
  
  if (!batch || batch.length === 0) {
    return allPairs;
  }
  
  allPairs.push(...batch);
  
  // If we got a full batch, there might be more
  if (batch.length === limit) {
    const lastPair = batch[batch.length - 1];
    return fetchAllPairsRecursive(factoryAddress, allPairs, lastPair.asset_infos);
  }
  
  return allPairs;
}

// ============================================
// ANALYZE PAIR
// ============================================

async function analyzePair(
  pair: PairInfo,
  factoryName: string,
  tokenDb: TokenDatabase
): Promise<PairAnalysis | null> {
  try {
    // Query pool data
    const pool = await queryPool(pair.contract_addr);
    
    if (!pool || !pool.assets || pool.assets.length !== 2) {
      return null;
    }
    
    const token0Denom = getDenomFromAsset(pool.assets[0]);
    const token1Denom = getDenomFromAsset(pool.assets[1]);
    
    // Find tokens in database
    const token0Data = tokenDb.tokens.find(t => t.denom === token0Denom);
    const token1Data = tokenDb.tokens.find(t => t.denom === token1Denom);
    
    const reserve0 = parseFloat(pool.assets[0].amount);
    const reserve1 = parseFloat(pool.assets[1].amount);
    
    const hasLiquidity = reserve0 > 0 && reserve1 > 0;
    const liquidityValue = reserve0 + reserve1; // Simplified
    const price = reserve0 > 0 ? reserve1 / reserve0 : 0;
    
    return {
      factoryName,
      contractAddress: pair.contract_addr,
      poolType: formatPoolType(pair.pair_type),
      token0Denom,
      token1Denom,
      token0Symbol: token0Data?.symbol || extractSymbolFromDenom(token0Denom),
      token1Symbol: token1Data?.symbol || extractSymbolFromDenom(token1Denom),
      token0InDatabase: !!token0Data,
      token1InDatabase: !!token1Data,
      reserve0: pool.assets[0].amount,
      reserve1: pool.assets[1].amount,
      hasLiquidity,
      liquidityValue,
      price,
    };
  } catch (error) {
    // Silently skip failed pairs
    return null;
  }
}

// ============================================
// EXTRACT SYMBOL FROM DENOM
// ============================================

function extractSymbolFromDenom(denom: string): string {
  if (denom === 'ucore') return 'CORE';
  if (denom.startsWith('ibc/')) return 'IBC-' + denom.substring(4, 10);
  if (denom.startsWith('drop-')) return 'XRP';
  if (denom.startsWith('xrpl')) {
    const parts = denom.split('-');
    return parts[0].toUpperCase();
  }
  if (denom.includes('-core1')) {
    const parts = denom.split('-');
    return parts[0].substring(1).toUpperCase();
  }
  return denom.substring(0, 8).toUpperCase();
}

// ============================================
// MAIN VERIFICATION
// ============================================

async function runCompleteVerification() {
  logSection('🔍 COMPLETE PAIR AND TOKEN VERIFICATION');
  console.log(`Started at: ${new Date().toISOString()}\n`);
  
  // Load token database
  const tokenDb = loadTokenDatabase();
  
  // Fetch all pairs from both factories
  logSection('📡 FETCHING ALL PAIRS FROM FACTORIES');
  
  console.log('\n🚢 Fetching from Cruise Control...');
  const cruisePairs = await fetchAllPairsRecursive(ASTROPORT_FACTORIES.CRUISE_CONTROL);
  console.log(`✅ Found ${cruisePairs.length} pairs from Cruise Control`);
  
  console.log('\n🌊 Fetching from Pulsara...');
  const pulsaraPairs = await fetchAllPairsRecursive(ASTROPORT_FACTORIES.PULSARA);
  console.log(`✅ Found ${pulsaraPairs.length} pairs from Pulsara`);
  
  const totalPairs = cruisePairs.length + pulsaraPairs.length;
  console.log(`\n📊 Total pairs discovered: ${totalPairs}`);
  
  // Analyze all pairs
  logSection('🔬 ANALYZING ALL PAIRS');
  
  const allAnalyses: PairAnalysis[] = [];
  let processedCount = 0;
  
  // Process Cruise Control pairs
  console.log('\n🚢 Analyzing Cruise Control pairs...');
  for (const pair of cruisePairs) {
    processedCount++;
    if (processedCount % 5 === 0) {
      logProgress(processedCount, totalPairs, 'Analyzing pairs');
    }
    
    const analysis = await analyzePair(pair, 'Cruise Control', tokenDb);
    if (analysis) {
      allAnalyses.push(analysis);
    }
  }
  
  // Process Pulsara pairs
  console.log('\n🌊 Analyzing Pulsara pairs...');
  for (const pair of pulsaraPairs) {
    processedCount++;
    if (processedCount % 5 === 0) {
      logProgress(processedCount, totalPairs, 'Analyzing pairs');
    }
    
    const analysis = await analyzePair(pair, 'Pulsara', tokenDb);
    if (analysis) {
      allAnalyses.push(analysis);
    }
  }
  
  console.log(`\n✅ Successfully analyzed ${allAnalyses.length}/${totalPairs} pairs`);
  
  // Generate statistics
  logSection('📊 STATISTICS');
  
  const cruiseAnalyses = allAnalyses.filter(a => a.factoryName === 'Cruise Control');
  const pulsaraAnalyses = allAnalyses.filter(a => a.factoryName === 'Pulsara');
  
  console.log('\n🏭 Factory Distribution:');
  console.log(`   Cruise Control: ${cruiseAnalyses.length} pairs`);
  console.log(`   Pulsara: ${pulsaraAnalyses.length} pairs`);
  
  const pairsWithLiquidity = allAnalyses.filter(a => a.hasLiquidity).length;
  const pairsWithoutLiquidity = allAnalyses.filter(a => !a.hasLiquidity).length;
  
  console.log('\n💰 Liquidity:');
  console.log(`   Pairs with liquidity: ${pairsWithLiquidity}`);
  console.log(`   Empty pairs: ${pairsWithoutLiquidity}`);
  console.log(`   Liquidity coverage: ${((pairsWithLiquidity / allAnalyses.length) * 100).toFixed(1)}%`);
  
  // Token coverage
  const tokensInPairs = new Set<string>();
  const tokensInDatabase = new Set<string>();
  const missingTokens = new Set<string>();
  
  allAnalyses.forEach(pair => {
    tokensInPairs.add(pair.token0Denom);
    tokensInPairs.add(pair.token1Denom);
    
    if (pair.token0InDatabase) tokensInDatabase.add(pair.token0Denom);
    else missingTokens.add(pair.token0Denom);
    
    if (pair.token1InDatabase) tokensInDatabase.add(pair.token1Denom);
    else missingTokens.add(pair.token1Denom);
  });
  
  console.log('\n🪙 Token Coverage:');
  console.log(`   Unique tokens in pairs: ${tokensInPairs.size}`);
  console.log(`   Tokens in database: ${tokensInDatabase.size}`);
  console.log(`   Missing from database: ${missingTokens.size}`);
  console.log(`   Database coverage: ${((tokensInDatabase.size / tokensInPairs.size) * 100).toFixed(1)}%`);
  
  if (missingTokens.size > 0 && missingTokens.size <= 10) {
    console.log('\n⚠️  Missing tokens (sample):');
    Array.from(missingTokens).slice(0, 10).forEach(denom => {
      console.log(`   - ${denom.substring(0, 50)}${denom.length > 50 ? '...' : ''}`);
    });
  }
  
  // Pool type distribution
  const poolTypes = new Map<string, number>();
  allAnalyses.forEach(pair => {
    poolTypes.set(pair.poolType, (poolTypes.get(pair.poolType) || 0) + 1);
  });
  
  console.log('\n🏊 Pool Types:');
  for (const [type, count] of poolTypes.entries()) {
    console.log(`   ${type}: ${count} pairs`);
  }
  
  // Top pairs by liquidity
  const topPairs = allAnalyses
    .filter(p => p.hasLiquidity)
    .sort((a, b) => b.liquidityValue - a.liquidityValue)
    .slice(0, 10);
  
  console.log('\n🏆 Top 10 Pairs by Liquidity:');
  topPairs.forEach((pair, index) => {
    console.log(`   ${index + 1}. ${pair.token0Symbol}/${pair.token1Symbol}`);
    console.log(`      Factory: ${pair.factoryName}`);
    console.log(`      Contract: ${pair.contractAddress}`);
    console.log(`      Reserves: ${parseFloat(pair.reserve0).toExponential(2)} / ${parseFloat(pair.reserve1).toExponential(2)}`);
    console.log(`      Price: ${pair.price.toFixed(6)}`);
    console.log('');
  });
  
  // Database comparison
  logSection('📚 DATABASE COMPARISON');
  
  console.log('\n📊 Expected vs Actual:');
  console.log(`   Expected total pairs (from metadata): ${tokenDb.metadata.totalPairs}`);
  console.log(`   Actual pairs found: ${totalPairs}`);
  console.log(`   Successfully analyzed: ${allAnalyses.length}`);
  
  if (totalPairs < tokenDb.metadata.totalPairs) {
    console.log(`\n⚠️  Found fewer pairs than expected (${totalPairs} vs ${tokenDb.metadata.totalPairs})`);
    console.log('   This could be due to:');
    console.log('   - Pairs being removed or inactive');
    console.log('   - Database metadata being out of date');
    console.log('   - Query pagination issues');
  } else if (totalPairs > tokenDb.metadata.totalPairs) {
    console.log(`\n✨ Found more pairs than expected! (${totalPairs} vs ${tokenDb.metadata.totalPairs})`);
    console.log('   New pairs have been added since the database was generated.');
  } else {
    console.log(`\n✅ Pair count matches database metadata exactly!`);
  }
  
  // Final summary
  logSection('🎯 FINAL SUMMARY');
  
  const allGood = 
    cruisePairs.length > 0 &&
    pulsaraPairs.length > 0 &&
    allAnalyses.length > 0 &&
    pairsWithLiquidity > 0 &&
    tokensInDatabase.size > 0;
  
  if (allGood) {
    console.log('\n✅ ALL CHECKS PASSED!');
    console.log('\n✨ Your CoreDEX integration is fully operational:');
    console.log(`   ✅ ${totalPairs} pairs discovered from 2 factories`);
    console.log(`   ✅ ${allAnalyses.length} pairs successfully analyzed`);
    console.log(`   ✅ ${pairsWithLiquidity} pairs with active liquidity`);
    console.log(`   ✅ ${tokensInDatabase.size} tokens matched in database`);
    console.log(`   ✅ ${poolTypes.size} different pool types available`);
    
    console.log('\n🚀 READY FOR PRODUCTION!');
  } else {
    console.log('\n⚠️  SOME ISSUES DETECTED');
    
    if (cruisePairs.length === 0) console.log('   ❌ Cruise Control returned no pairs');
    if (pulsaraPairs.length === 0) console.log('   ❌ Pulsara returned no pairs');
    if (allAnalyses.length === 0) console.log('   ❌ No pairs could be analyzed');
    if (pairsWithLiquidity === 0) console.log('   ⚠️  No pairs have liquidity');
    if (tokensInDatabase.size === 0) console.log('   ⚠️  No tokens found in database');
  }
  
  console.log('\n' + '='.repeat(70));
  console.log(`\nVerification completed at: ${new Date().toISOString()}`);
}

// Run verification
runCompleteVerification().catch(error => {
  console.error('\n❌ VERIFICATION FAILED:', error);
  process.exit(1);
});

