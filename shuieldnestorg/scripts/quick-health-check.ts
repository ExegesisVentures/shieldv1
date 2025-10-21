#!/usr/bin/env tsx

/**
 * Quick Health Check for CoreDEX Integration
 * 
 * Runs a fast health check on the CoreDEX integration
 * Perfect for daily monitoring or CI/CD pipelines
 * 
 * Usage: npx tsx scripts/quick-health-check.ts
 */

import { 
  ASTROPORT_FACTORIES, 
  queryAllPairs, 
  DEX_CONFIG,
} from '../utils/coreum/astroport';

interface HealthCheckResult {
  timestamp: string;
  status: 'healthy' | 'degraded' | 'down';
  factories: {
    name: string;
    status: 'up' | 'down';
    pairCount: number;
    responseTime: number;
  }[];
  summary: {
    totalFactories: number;
    workingFactories: number;
    totalPairs: number;
  };
}

async function checkFactory(
  name: string, 
  address: string
): Promise<{ status: 'up' | 'down'; pairCount: number; responseTime: number }> {
  const startTime = Date.now();
  
  try {
    const pairs = await queryAllPairs(address, undefined, 5);
    const responseTime = Date.now() - startTime;
    
    if (pairs && pairs.length > 0) {
      return { status: 'up', pairCount: pairs.length, responseTime };
    } else {
      return { status: 'down', pairCount: 0, responseTime };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return { status: 'down', pairCount: 0, responseTime };
  }
}

async function runHealthCheck(): Promise<HealthCheckResult> {
  const factories = [
    { name: 'Pulsara DEX', address: ASTROPORT_FACTORIES.PULSARA },
    { name: 'Cruise Control', address: ASTROPORT_FACTORIES.CRUISE_CONTROL },
  ];
  
  const results = await Promise.all(
    factories.map(f => checkFactory(f.name, f.address))
  );
  
  const factoryResults = factories.map((f, i) => ({
    name: f.name,
    ...results[i],
  }));
  
  const workingFactories = factoryResults.filter(f => f.status === 'up').length;
  const totalPairs = factoryResults.reduce((sum, f) => sum + f.pairCount, 0);
  
  let status: 'healthy' | 'degraded' | 'down';
  if (workingFactories === factories.length) {
    status = 'healthy';
  } else if (workingFactories > 0) {
    status = 'degraded';
  } else {
    status = 'down';
  }
  
  return {
    timestamp: new Date().toISOString(),
    status,
    factories: factoryResults,
    summary: {
      totalFactories: factories.length,
      workingFactories,
      totalPairs,
    },
  };
}

async function main() {
  console.log('🏥 CoreDEX Health Check');
  console.log('=====================');
  console.log('');
  
  const result = await runHealthCheck();
  
  // Display results
  console.log(`⏰ Timestamp: ${result.timestamp}`);
  console.log(`📊 Status: ${result.status.toUpperCase()}`);
  console.log('');
  
  console.log('🏭 Factories:');
  result.factories.forEach(factory => {
    const statusIcon = factory.status === 'up' ? '✅' : '❌';
    console.log(`   ${statusIcon} ${factory.name}`);
    console.log(`      Pairs: ${factory.pairCount} (sampled)`);
    console.log(`      Response: ${factory.responseTime}ms`);
  });
  
  console.log('');
  console.log('📈 Summary:');
  console.log(`   Working Factories: ${result.summary.workingFactories}/${result.summary.totalFactories}`);
  console.log(`   Total Pairs: ${result.summary.totalPairs}+`);
  
  console.log('');
  
  // Exit code based on status
  if (result.status === 'healthy') {
    console.log('✅ All systems operational!');
    process.exit(0);
  } else if (result.status === 'degraded') {
    console.log('⚠️  System degraded - some factories are down');
    process.exit(1);
  } else {
    console.log('❌ System down - all factories unreachable');
    process.exit(2);
  }
}

main().catch(error => {
  console.error('❌ Health check failed:', error);
  process.exit(3);
});

