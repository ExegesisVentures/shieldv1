/**
 * Test Script for Send Token Number Parsing
 * 
 * This script tests the parseTokenAmount function to ensure it handles
 * large numbers correctly without scientific notation.
 * 
 * Run: node test-send-numbers.js
 */

/**
 * Parse human-readable amount to base units
 * CRITICAL: Uses string manipulation to avoid scientific notation for large numbers
 */
function parseTokenAmount(amount, decimals = 6) {
  const num = parseFloat(amount);
  if (isNaN(num) || num <= 0) return "0";
  
  // Convert to string and handle scientific notation manually
  const amountStr = amount.toString();
  
  // Check if the input already has a decimal point
  const parts = amountStr.split('.');
  const integerPart = parts[0] || '0';
  const decimalPart = parts[1] || '';
  
  // Pad or truncate decimal part to match required decimals
  let paddedDecimal = decimalPart.padEnd(decimals, '0').slice(0, decimals);
  
  // Combine integer and decimal parts
  const fullNumberStr = integerPart + paddedDecimal;
  
  // Remove leading zeros but keep at least one digit
  const trimmed = fullNumberStr.replace(/^0+/, '') || '0';
  
  // Validate the result can be converted to BigInt
  try {
    return BigInt(trimmed).toString();
  } catch (err) {
    console.error('[parseTokenAmount] Failed to convert to BigInt:', trimmed, err);
    return "0";
  }
}

// Test cases
console.log('╔═══════════════════════════════════════════════════════════════════╗');
console.log('║              SEND TOKEN NUMBER PARSING TEST                       ║');
console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

const testCases = [
  // CORE Token (6 decimals)
  { amount: "1", decimals: 6, expected: "1000000", description: "1 CORE" },
  { amount: "0.1", decimals: 6, expected: "100000", description: "0.1 CORE" },
  { amount: "0.000001", decimals: 6, expected: "1", description: "0.000001 CORE (minimum)" },
  { amount: "1000", decimals: 6, expected: "1000000000", description: "1000 CORE" },
  
  // ROLL Token (15 decimals) - The critical test!
  { amount: "1", decimals: 15, expected: "1000000000000000", description: "1 ROLL" },
  { amount: "1000000", decimals: 15, expected: "1000000000000000000000", description: "1M ROLL (large!)" },
  { amount: "0.000000000000001", decimals: 15, expected: "1", description: "Minimum ROLL" },
  
  // Edge cases
  { amount: "123.456789", decimals: 6, expected: "123456789", description: "Decimal CORE" },
  { amount: "999999.999999", decimals: 6, expected: "999999999999", description: "Large CORE" },
  { amount: "0.123456789012345", decimals: 15, expected: "123456789012345", description: "Decimal ROLL" },
  
  // Very large numbers that would cause scientific notation
  { amount: "10000000", decimals: 15, expected: "10000000000000000000000", description: "10M ROLL (HUGE!)" },
];

let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
  const result = parseTokenAmount(test.amount, test.decimals);
  const success = result === test.expected;
  
  if (success) {
    console.log(`✅ Test ${index + 1}: ${test.description}`);
    console.log(`   Amount: ${test.amount} (${test.decimals} decimals)`);
    console.log(`   Result: ${result}`);
    console.log(`   ✓ Matches expected value\n`);
    passed++;
  } else {
    console.log(`❌ Test ${index + 1}: ${test.description}`);
    console.log(`   Amount: ${test.amount} (${test.decimals} decimals)`);
    console.log(`   Expected: ${test.expected}`);
    console.log(`   Got:      ${result}`);
    console.log(`   ✗ MISMATCH!\n`);
    failed++;
  }
});

console.log('═══════════════════════════════════════════════════════════════════');
console.log(`                      TEST SUMMARY`);
console.log('═══════════════════════════════════════════════════════════════════');
console.log(`Total Tests: ${testCases.length}`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log('═══════════════════════════════════════════════════════════════════\n');

if (failed === 0) {
  console.log('🎉 ALL TESTS PASSED! Scientific notation bug is FIXED! 🎉\n');
  console.log('The send function can now handle:');
  console.log('  ✓ Small amounts (0.000001)');
  console.log('  ✓ Large amounts (10,000,000)');
  console.log('  ✓ 6 decimal tokens (CORE, XRP, etc.)');
  console.log('  ✓ 15 decimal tokens (ROLL, SOLO)');
  console.log('  ✓ NO scientific notation errors!\n');
  process.exit(0);
} else {
  console.log('⚠️  SOME TESTS FAILED - Please review the code! ⚠️\n');
  process.exit(1);
}

