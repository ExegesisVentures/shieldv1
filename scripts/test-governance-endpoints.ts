/**
 * ============================================
 * GOVERNANCE ENDPOINTS TEST SCRIPT
 * ============================================
 * 
 * Test all governance API endpoints to verify they work correctly
 * 
 * Usage:
 *   npx tsx scripts/test-governance-endpoints.ts
 * 
 * File: /scripts/test-governance-endpoints.ts
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_ADDRESS = process.env.TEST_ADDRESS || 'core1mgvlgvh2hfw5pgdqc79up3du69v2z3t8qz4kwg';

interface TestResult {
  name: string;
  endpoint: string;
  success: boolean;
  status?: number;
  data?: any;
  error?: string;
  duration?: number;
}

const results: TestResult[] = [];

/**
 * Test helper function
 */
async function testEndpoint(
  name: string,
  endpoint: string,
  expectedFields?: string[]
): Promise<TestResult> {
  const startTime = Date.now();
  const fullUrl = `${BASE_URL}${endpoint}`;
  
  console.log(`\n🧪 Testing: ${name}`);
  console.log(`   URL: ${fullUrl}`);
  
  try {
    const response = await fetch(fullUrl, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const duration = Date.now() - startTime;
    const data = await response.json();
    
    // Check if response has expected structure
    let success = response.ok && data.success !== false;
    
    // Validate expected fields if provided
    if (success && expectedFields && data.data) {
      for (const field of expectedFields) {
        if (!(field in data.data) && !Array.isArray(data.data)) {
          console.log(`   ⚠️  Missing expected field: ${field}`);
          success = false;
        }
      }
    }
    
    const result: TestResult = {
      name,
      endpoint,
      success,
      status: response.status,
      data: data,
      duration,
    };
    
    if (success) {
      console.log(`   ✅ PASSED (${duration}ms)`);
      if (data.count !== undefined) {
        console.log(`   📊 Count: ${data.count}`);
      }
    } else {
      console.log(`   ❌ FAILED (${duration}ms)`);
      console.log(`   Error: ${data.error || 'Unknown error'}`);
      result.error = data.error || 'Test failed';
    }
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`   ❌ FAILED (${duration}ms)`);
    console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    
    return {
      name,
      endpoint,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration,
    };
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     GOVERNANCE API ENDPOINTS TEST SUITE                ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log(`\n🌐 Base URL: ${BASE_URL}`);
  console.log(`👤 Test Address: ${TEST_ADDRESS}`);
  console.log('\n' + '═'.repeat(60));

  // Test 1: Get all proposals
  results.push(await testEndpoint(
    'Get All Proposals',
    '/api/governance/proposals',
    ['proposals']
  ));

  // Test 2: Get active proposals
  results.push(await testEndpoint(
    'Get Active Proposals',
    '/api/governance/proposals?active=true',
    []
  ));

  // Test 3: Get enriched proposals
  results.push(await testEndpoint(
    'Get Enriched Proposals',
    '/api/governance/proposals?enriched=true',
    []
  ));

  // Test 4: Get proposal statistics
  results.push(await testEndpoint(
    'Get Proposal Statistics',
    '/api/governance/proposals?stats=true',
    ['total', 'active', 'passed']
  ));

  // Test 5: Get single proposal (ID 1)
  results.push(await testEndpoint(
    'Get Single Proposal (ID: 1)',
    '/api/governance/proposals/1',
    ['proposal_id']
  ));

  // Test 6: Get single proposal enriched
  results.push(await testEndpoint(
    'Get Single Proposal Enriched (ID: 1)',
    '/api/governance/proposals/1?enriched=true',
    ['proposal_id']
  ));

  // Test 7: Get proposal tally
  results.push(await testEndpoint(
    'Get Proposal Tally (ID: 1)',
    '/api/governance/proposals/1/tally',
    ['yes', 'no', 'abstain']
  ));

  // Test 8: Get proposal votes
  results.push(await testEndpoint(
    'Get Proposal Votes (ID: 1)',
    '/api/governance/proposals/1/votes',
    []
  ));

  // Test 9: Get user voting history
  results.push(await testEndpoint(
    'Get User Voting History',
    `/api/governance/votes/${TEST_ADDRESS}`,
    ['votes']
  ));

  // Test 10: Get user vote on specific proposal
  results.push(await testEndpoint(
    'Get User Vote on Proposal (ID: 1)',
    `/api/governance/votes/${TEST_ADDRESS}?proposalId=1`,
    ['vote', 'hasVoted']
  ));

  // Test 11: Get user voting power
  results.push(await testEndpoint(
    'Get User Voting Power',
    `/api/governance/votes/${TEST_ADDRESS}?votingPower=true`,
    ['votingPower']
  ));

  // Test 12: Get proposal deposits
  results.push(await testEndpoint(
    'Get Proposal Deposits (ID: 1)',
    '/api/governance/deposits/1',
    []
  ));

  // Test 13: Get governance parameters
  results.push(await testEndpoint(
    'Get Governance Parameters',
    '/api/governance/params',
    ['voting_params', 'deposit_params', 'tally_params']
  ));

  // Print summary
  console.log('\n' + '═'.repeat(60));
  console.log('\n📊 TEST SUMMARY');
  console.log('═'.repeat(60));

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const total = results.length;
  const passRate = ((passed / total) * 100).toFixed(1);

  console.log(`\n✅ Passed: ${passed}/${total} (${passRate}%)`);
  console.log(`❌ Failed: ${failed}/${total}`);

  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results
      .filter(r => !r.success)
      .forEach(r => {
        console.log(`   - ${r.name}`);
        console.log(`     Endpoint: ${r.endpoint}`);
        console.log(`     Error: ${r.error || 'Unknown'}`);
      });
  }

  // Performance stats
  const avgDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0) / results.length;
  const maxDuration = Math.max(...results.map(r => r.duration || 0));
  const minDuration = Math.min(...results.map(r => r.duration || 0));

  console.log('\n⚡ Performance:');
  console.log(`   Average: ${avgDuration.toFixed(0)}ms`);
  console.log(`   Fastest: ${minDuration}ms`);
  console.log(`   Slowest: ${maxDuration}ms`);

  // Save results to file
  const fs = require('fs');
  const resultsFile = 'governance-test-results.json';
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
  console.log(`\n💾 Results saved to: ${resultsFile}`);

  console.log('\n' + '═'.repeat(60));
  
  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('\n❌ Test suite failed:', error);
  process.exit(1);
});


