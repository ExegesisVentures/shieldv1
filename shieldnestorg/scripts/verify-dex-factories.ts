#!/usr/bin/env tsx

/**
 * ============================================
 * DEX FACTORIES VERIFICATION SCRIPT
 * ============================================
 * 
 * This script verifies that both Pulsara and Cruise Control
 * factory addresses are working correctly.
 * 
 * Usage:
 *   cd shuieldnestorg
 *   npx tsx scripts/verify-dex-factories.ts
 */

import { ASTROPORT_FACTORIES, queryAllPairs } from '../utils/coreum/astroport';

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
// VERIFICATION FUNCTIONS
// ============================================

async function verifyFactory(factoryName: string, factoryAddress: string): Promise<{
  success: boolean;
  pairCount: number;
  error?: string;
}> {
  try {
    logInfo(`Testing ${factoryName} factory: ${factoryAddress}`);
    
    // Query pairs from factory
    const pairs = await queryAllPairs(factoryAddress, undefined, 10); // Get first 10 pairs
    
    if (pairs === null) {
      return {
        success: false,
        pairCount: 0,
        error: 'Factory returned null (likely not working)'
      };
    }
    
    if (!Array.isArray(pairs)) {
      return {
        success: false,
        pairCount: 0,
        error: 'Factory returned invalid data format'
      };
    }
    
    logSuccess(`${factoryName} factory working: ${pairs.length} pairs found`);
    
    // Log first few pairs for verification
    if (pairs.length > 0) {
      logInfo(`Sample pairs from ${factoryName}:`);
      pairs.slice(0, 3).forEach((pair, index) => {
        logInfo(`  ${index + 1}. ${pair.contract_addr} (${pair.asset_infos?.length || 0} assets)`);
      });
    }
    
    return {
      success: true,
      pairCount: pairs.length
    };
    
  } catch (error) {
    logError(`${factoryName} factory failed:`, error);
    return {
      success: false,
      pairCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function verifyAllFactories(): Promise<void> {
  console.log('🚀 DEX FACTORIES VERIFICATION');
  console.log('==============================');
  console.log('');
  
  const factories = [
    {
      name: 'Pulsara DEX',
      address: ASTROPORT_FACTORIES.PULSARA,
      expectedPairs: 64
    },
    {
      name: 'Cruise Control DEX',
      address: ASTROPORT_FACTORIES.CRUISE_CONTROL,
      expectedPairs: 47
    }
  ];
  
  const results = [];
  
  for (let i = 0; i < factories.length; i++) {
    const factory = factories[i];
    logProgress(i + 1, factories.length, `Verifying ${factory.name}`);
    
    const result = await verifyFactory(factory.name, factory.address);
    results.push({
      ...factory,
      ...result
    });
    
    console.log(''); // Add spacing
  }
  
  // Summary
  console.log('📊 VERIFICATION SUMMARY');
  console.log('=======================');
  console.log('');
  
  let totalPairs = 0;
  let workingFactories = 0;
  
  results.forEach((result, index) => {
    const status = result.success ? '✅ WORKING' : '❌ FAILED';
    const pairInfo = result.success ? `${result.pairCount} pairs` : 'No pairs';
    const expectedInfo = result.success ? `(expected: ${result.expectedPairs})` : '';
    
    console.log(`${index + 1}. ${result.name}: ${status}`);
    console.log(`   Factory: ${result.address}`);
    console.log(`   Pairs: ${pairInfo} ${expectedInfo}`);
    
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    
    if (result.success) {
      totalPairs += result.pairCount;
      workingFactories++;
    }
    
    console.log('');
  });
  
  // Overall status
  console.log('🎯 OVERALL STATUS');
  console.log('=================');
  console.log(`Working Factories: ${workingFactories}/${factories.length}`);
  console.log(`Total Pairs Available: ${totalPairs}`);
  console.log(`Expected Total: ${factories.reduce((sum, f) => sum + f.expectedPairs, 0)}`);
  
  if (workingFactories === factories.length) {
    console.log('');
    console.log('🎉 ALL FACTORIES WORKING!');
    console.log('Your DEX integration is ready for production.');
  } else {
    console.log('');
    console.log('⚠️  SOME FACTORIES FAILED');
    console.log('Check the errors above and verify factory addresses.');
  }
  
  console.log('');
  console.log('Next steps:');
  console.log('1. If all factories work, your system is ready');
  console.log('2. If some fail, check factory addresses and network connectivity');
  console.log('3. Run the import script to load all pairs into database');
  console.log('4. Test the live price APIs');
}

// ============================================
// MAIN EXECUTION
// ============================================

async function main() {
  try {
    await verifyAllFactories();
  } catch (error) {
    logError('Verification failed:', error);
    process.exit(1);
  }
}

// Run the verification
main().catch(console.error);
