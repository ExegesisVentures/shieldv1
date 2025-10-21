#!/usr/bin/env tsx

/**
 * ============================================
 * COMPREHENSIVE COREDEX AUDIT SCRIPT
 * ============================================
 * 
 * This script performs a complete audit of:
 * - DEX factory connectivity (Pulsara & Cruise Control)
 * - Pair discovery and validation
 * - Token data accuracy
 * - Price data availability
 * - Pool liquidity and reserves
 * 
 * Usage:
 *   cd shuieldnestorg
 *   npx tsx scripts/comprehensive-coredex-audit.ts
 */

import { 
  ASTROPORT_FACTORIES, 
  queryAllPairs, 
  queryPool, 
  getDenomFromAsset,
  formatPoolType,
  DEX_CONFIG,
  getFactoryHealthStatus,
  resetFactoryHealth,
} from '../utils/coreum/astroport';
import { fetchLiquidityPools, searchPools } from '../utils/coreum/liquidity-pools';

// ============================================
// TYPES
// ============================================

interface AuditResult {
  section: string;
  status: 'pass' | 'warning' | 'fail';
  message: string;
  details?: any;
}

interface FactoryAudit {
  name: string;
  address: string;
  enabled: boolean;
  responsive: boolean;
  pairCount: number;
  validPairs: number;
  invalidPairs: number;
  samplePairs: any[];
}

interface TokenAudit {
  totalTokens: number;
  uniqueTokens: Set<string>;
  tokensByType: Map<string, number>;
  commonTokens: string[];
}

interface PriceAudit {
  totalPairs: number;
  pairsWithLiquidity: number;
  pairsWithoutLiquidity: number;
  totalLiquidity: number;
  avgLiquidity: number;
  topLiquidityPairs: any[];
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function logSection(title: string) {
  console.log('\n' + '='.repeat(60));
  console.log(title);
  console.log('='.repeat(60));
}

function logPass(message: string) {
  console.log(`✅ PASS: ${message}`);
}

function logWarning(message: string) {
  console.log(`⚠️  WARN: ${message}`);
}

function logFail(message: string) {
  console.log(`❌ FAIL: ${message}`);
}

function logInfo(message: string) {
  console.log(`ℹ️  INFO: ${message}`);
}

// ============================================
// AUDIT FUNCTIONS
// ============================================

/**
 * Audit 1: Factory Connectivity
 */
async function auditFactories(): Promise<FactoryAudit[]> {
  logSection('📡 AUDIT 1: DEX FACTORY CONNECTIVITY');
  
  const factories = [
    { name: 'Pulsara DEX', address: ASTROPORT_FACTORIES.PULSARA, enabled: DEX_CONFIG.PULSARA_ENABLED },
    { name: 'Cruise Control', address: ASTROPORT_FACTORIES.CRUISE_CONTROL, enabled: DEX_CONFIG.CRUISE_CONTROL_ENABLED },
  ];
  
  const results: FactoryAudit[] = [];
  
  for (const factory of factories) {
    console.log(`\n🔍 Testing ${factory.name}...`);
    console.log(`   Address: ${factory.address}`);
    console.log(`   Enabled: ${factory.enabled ? 'Yes' : 'No'}`);
    
    if (!factory.enabled) {
      logWarning(`${factory.name} is disabled in configuration`);
      results.push({
        ...factory,
        responsive: false,
        pairCount: 0,
        validPairs: 0,
        invalidPairs: 0,
        samplePairs: [],
      });
      continue;
    }
    
    try {
      // Query pairs with a reasonable limit
      const pairs = await queryAllPairs(factory.address, undefined, 10);
      
      if (!pairs || pairs.length === 0) {
        logWarning(`${factory.name} returned no pairs`);
        results.push({
          ...factory,
          responsive: true,
          pairCount: 0,
          validPairs: 0,
          invalidPairs: 0,
          samplePairs: [],
        });
        continue;
      }
      
      logPass(`${factory.name} is responsive - found ${pairs.length} pairs`);
      
      // Validate pairs
      let validPairs = 0;
      let invalidPairs = 0;
      const samplePairs = [];
      
      for (const pair of pairs.slice(0, 5)) {
        try {
          // Try to query the pool to validate it
          const pool = await queryPool(pair.contract_addr);
          
          if (pool && pool.assets && pool.assets.length === 2) {
            validPairs++;
            samplePairs.push({
              address: pair.contract_addr,
              type: formatPoolType(pair.pair_type),
              asset0: getDenomFromAsset(pool.assets[0]),
              asset1: getDenomFromAsset(pool.assets[1]),
              reserve0: pool.assets[0].amount,
              reserve1: pool.assets[1].amount,
            });
          } else {
            invalidPairs++;
          }
        } catch (error) {
          invalidPairs++;
        }
      }
      
      logInfo(`Valid pairs: ${validPairs}/${pairs.slice(0, 5).length} sampled`);
      if (invalidPairs > 0) {
        logWarning(`Invalid pairs found: ${invalidPairs}`);
      }
      
      results.push({
        ...factory,
        responsive: true,
        pairCount: pairs.length,
        validPairs,
        invalidPairs,
        samplePairs,
      });
      
    } catch (error) {
      logFail(`${factory.name} is not responsive: ${error instanceof Error ? error.message : 'Unknown error'}`);
      results.push({
        ...factory,
        responsive: false,
        pairCount: 0,
        validPairs: 0,
        invalidPairs: 0,
        samplePairs: [],
      });
    }
  }
  
  return results;
}

/**
 * Audit 2: Token Discovery
 */
async function auditTokens(factoryResults: FactoryAudit[]): Promise<TokenAudit> {
  logSection('🪙 AUDIT 2: TOKEN DISCOVERY');
  
  const uniqueTokens = new Set<string>();
  const tokensByType = new Map<string, number>();
  
  for (const factory of factoryResults) {
    if (!factory.responsive || factory.samplePairs.length === 0) continue;
    
    console.log(`\n📊 Analyzing tokens from ${factory.name}...`);
    
    for (const pair of factory.samplePairs) {
      // Add tokens to set
      uniqueTokens.add(pair.asset0);
      uniqueTokens.add(pair.asset1);
      
      // Categorize token types
      const categorizeToken = (denom: string) => {
        if (denom === 'ucore') return 'native';
        if (denom.startsWith('ibc/')) return 'ibc';
        if (denom.startsWith('drop-')) return 'xrpl-drop';
        if (denom.startsWith('xrpl')) return 'xrpl';
        if (denom.includes('-core1')) return 'factory';
        if (denom.startsWith('core1')) return 'cw20';
        return 'unknown';
      };
      
      const type0 = categorizeToken(pair.asset0);
      const type1 = categorizeToken(pair.asset1);
      
      tokensByType.set(type0, (tokensByType.get(type0) || 0) + 1);
      tokensByType.set(type1, (tokensByType.get(type1) || 0) + 1);
    }
  }
  
  logInfo(`Total unique tokens found: ${uniqueTokens.size}`);
  
  console.log('\n📈 Token breakdown by type:');
  for (const [type, count] of tokensByType.entries()) {
    console.log(`   ${type}: ${count}`);
  }
  
  // Find common tokens (appear in multiple pairs)
  const commonTokens = Array.from(uniqueTokens).filter(token => {
    let count = 0;
    for (const factory of factoryResults) {
      count += factory.samplePairs.filter(p => 
        p.asset0 === token || p.asset1 === token
      ).length;
    }
    return count > 1;
  });
  
  if (commonTokens.length > 0) {
    logInfo(`Common base tokens: ${commonTokens.slice(0, 5).join(', ')}`);
  }
  
  return {
    totalTokens: uniqueTokens.size,
    uniqueTokens,
    tokensByType,
    commonTokens,
  };
}

/**
 * Audit 3: Price & Liquidity Data
 */
async function auditPricesAndLiquidity(factoryResults: FactoryAudit[]): Promise<PriceAudit> {
  logSection('💰 AUDIT 3: PRICE & LIQUIDITY DATA');
  
  let totalPairs = 0;
  let pairsWithLiquidity = 0;
  let pairsWithoutLiquidity = 0;
  let totalLiquidity = 0;
  const liquidityData: any[] = [];
  
  for (const factory of factoryResults) {
    if (!factory.responsive || factory.samplePairs.length === 0) continue;
    
    console.log(`\n💵 Analyzing liquidity from ${factory.name}...`);
    
    for (const pair of factory.samplePairs) {
      totalPairs++;
      
      const reserve0 = parseFloat(pair.reserve0);
      const reserve1 = parseFloat(pair.reserve1);
      
      if (reserve0 > 0 && reserve1 > 0) {
        pairsWithLiquidity++;
        const pairLiquidity = reserve0 + reserve1; // Simplified - would need price data for accurate USD value
        totalLiquidity += pairLiquidity;
        
        liquidityData.push({
          factory: factory.name,
          address: pair.address,
          asset0: extractSymbol(pair.asset0),
          asset1: extractSymbol(pair.asset1),
          reserve0,
          reserve1,
          liquidity: pairLiquidity,
          price: reserve1 / reserve0, // Simplified price calculation
        });
      } else {
        pairsWithoutLiquidity++;
      }
    }
  }
  
  const avgLiquidity = totalPairs > 0 ? totalLiquidity / totalPairs : 0;
  
  logInfo(`Total pairs analyzed: ${totalPairs}`);
  logInfo(`Pairs with liquidity: ${pairsWithLiquidity}`);
  
  if (pairsWithoutLiquidity > 0) {
    logWarning(`Pairs without liquidity: ${pairsWithoutLiquidity}`);
  }
  
  logInfo(`Average liquidity: ${avgLiquidity.toExponential(2)}`);
  
  // Sort by liquidity and show top pairs
  const topPairs = liquidityData
    .sort((a, b) => b.liquidity - a.liquidity)
    .slice(0, 5);
  
  if (topPairs.length > 0) {
    console.log('\n🏆 Top 5 pools by liquidity:');
    topPairs.forEach((pair, index) => {
      console.log(`   ${index + 1}. ${pair.asset0}/${pair.asset1}`);
      console.log(`      Factory: ${pair.factory}`);
      console.log(`      Reserves: ${pair.reserve0.toExponential(2)} / ${pair.reserve1.toExponential(2)}`);
      console.log(`      Price: ${pair.price.toFixed(6)}`);
    });
  }
  
  return {
    totalPairs,
    pairsWithLiquidity,
    pairsWithoutLiquidity,
    totalLiquidity,
    avgLiquidity,
    topLiquidityPairs: topPairs,
  };
}

/**
 * Audit 4: API Endpoints
 */
async function auditAPIEndpoints(): Promise<void> {
  logSection('🌐 AUDIT 4: API ENDPOINTS');
  
  console.log('\nℹ️  Note: API endpoint testing requires dev server running');
  console.log('   Skipping endpoint tests in this audit');
  console.log('   Run `npm run dev` and use scripts/test-api-routes.ts for API testing');
}

/**
 * Audit 5: Configuration Check
 */
async function auditConfiguration(): Promise<void> {
  logSection('⚙️  AUDIT 5: CONFIGURATION CHECK');
  
  console.log('\n📋 DEX Configuration:');
  console.log(`   Cruise Control Enabled: ${DEX_CONFIG.CRUISE_CONTROL_ENABLED ? '✅' : '❌'}`);
  console.log(`   Pulsara Enabled: ${DEX_CONFIG.PULSARA_ENABLED ? '✅' : '❌'}`);
  console.log(`   Suppress Contract Errors: ${DEX_CONFIG.SUPPRESS_CONTRACT_ERRORS ? '✅' : '❌'}`);
  console.log(`   Contract Query Timeout: ${DEX_CONFIG.CONTRACT_QUERY_TIMEOUT}ms`);
  console.log(`   Factory Health Check: ${DEX_CONFIG.ENABLE_FACTORY_HEALTH_CHECK ? '✅' : '❌'}`);
  console.log(`   Factory Failure Threshold: ${DEX_CONFIG.FACTORY_FAILURE_THRESHOLD}`);
  
  // Check factory health
  const healthStatus = getFactoryHealthStatus();
  
  if (Object.keys(healthStatus).length > 0) {
    console.log('\n🏥 Factory Health Status:');
    for (const [address, health] of Object.entries(healthStatus)) {
      const name = address === ASTROPORT_FACTORIES.CRUISE_CONTROL ? 'Cruise Control' : 'Pulsara';
      console.log(`\n   ${name}:`);
      console.log(`   - Failures: ${health.failures}`);
      console.log(`   - Disabled: ${health.isDisabled ? '❌' : '✅'}`);
      console.log(`   - Last Failure: ${health.lastFailure}`);
      console.log(`   - Last Checked: ${health.lastChecked}`);
    }
  }
}

/**
 * Extract symbol from denom for display
 */
function extractSymbol(denom: string): string {
  if (denom === 'ucore') return 'CORE';
  if (denom.startsWith('ibc/')) return 'IBC-' + denom.substring(4, 10);
  if (denom.startsWith('drop-')) return 'XRP';
  if (denom.includes('-core1')) {
    const parts = denom.split('-');
    return parts[0].substring(1).toUpperCase();
  }
  return denom.substring(0, 10);
}

// ============================================
// MAIN AUDIT EXECUTION
// ============================================

async function runComprehensiveAudit() {
  console.log('🚀 COMPREHENSIVE COREDEX AUDIT');
  console.log('================================');
  console.log(`Started at: ${new Date().toISOString()}`);
  console.log('');
  
  try {
    // Reset factory health before audit
    resetFactoryHealth();
    
    // Run all audits
    const factoryResults = await auditFactories();
    const tokenAudit = await auditTokens(factoryResults);
    const priceAudit = await auditPricesAndLiquidity(factoryResults);
    await auditAPIEndpoints();
    await auditConfiguration();
    
    // ============================================
    // FINAL SUMMARY
    // ============================================
    
    logSection('📊 AUDIT SUMMARY');
    
    const totalFactories = factoryResults.length;
    const responsiveFactories = factoryResults.filter(f => f.responsive).length;
    const totalPairs = factoryResults.reduce((sum, f) => sum + f.pairCount, 0);
    const totalValidPairs = factoryResults.reduce((sum, f) => sum + f.validPairs, 0);
    
    console.log('\n🏭 Factories:');
    console.log(`   Total: ${totalFactories}`);
    console.log(`   Responsive: ${responsiveFactories}`);
    console.log(`   Status: ${responsiveFactories === totalFactories ? '✅ All working' : '⚠️  Some issues'}`);
    
    console.log('\n🔗 Pairs:');
    console.log(`   Total discovered: ${totalPairs}`);
    console.log(`   Valid pairs (sampled): ${totalValidPairs}`);
    
    console.log('\n🪙 Tokens:');
    console.log(`   Unique tokens: ${tokenAudit.totalTokens}`);
    console.log(`   Common base tokens: ${tokenAudit.commonTokens.length}`);
    
    console.log('\n💰 Liquidity:');
    console.log(`   Pairs with liquidity: ${priceAudit.pairsWithLiquidity}/${priceAudit.totalPairs}`);
    console.log(`   Average liquidity: ${priceAudit.avgLiquidity.toExponential(2)}`);
    
    // Overall status
    console.log('\n🎯 OVERALL STATUS:');
    
    if (responsiveFactories === 0) {
      logFail('CRITICAL: No DEX factories are responsive!');
      console.log('\n⚠️  ACTION REQUIRED:');
      console.log('   1. Check network connectivity');
      console.log('   2. Verify factory addresses are correct');
      console.log('   3. Check if Coreum mainnet is accessible');
    } else if (responsiveFactories < totalFactories) {
      logWarning('Some factories are not working properly');
      console.log('\n💡 RECOMMENDATIONS:');
      console.log('   1. Check factory addresses for non-responsive DEXs');
      console.log('   2. Verify DEX is deployed and operational');
      console.log('   3. Consider disabling non-working factories in config');
    } else if (priceAudit.pairsWithoutLiquidity > 0) {
      logWarning('Some pairs have no liquidity');
      console.log('\n💡 INFO:');
      console.log('   Empty pools are normal - they may be new or inactive');
    } else {
      logPass('ALL SYSTEMS OPERATIONAL!');
      console.log('\n🎉 CoreDEX Integration is working perfectly!');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`\nAudit completed at: ${new Date().toISOString()}`);
    
  } catch (error) {
    console.error('\n❌ AUDIT FAILED:', error);
    process.exit(1);
  }
}

// Run the audit
runComprehensiveAudit().catch(console.error);

