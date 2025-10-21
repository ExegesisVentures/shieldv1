# CoreDEX Testing and Monitoring Scripts

This directory contains comprehensive testing and monitoring scripts for the CoreDEX integration.

## Quick Reference

```bash
# Daily health check (30 seconds)
npx tsx scripts/quick-health-check.ts

# Comprehensive audit (1-2 minutes)
npx tsx scripts/comprehensive-coredex-audit.ts

# Full pair verification (1-2 minutes)
npx tsx scripts/verify-all-pairs-and-tokens.ts

# Factory verification (1 minute)
npx tsx scripts/verify-dex-factories.ts
```

---

## Available Scripts

### 1. `quick-health-check.ts` ⚡ NEW!

**Purpose:** Fast daily health check  
**Runtime:** ~30 seconds  
**Use Case:** Daily monitoring, CI/CD pipelines

**What it checks:**
- Factory connectivity
- Response times
- Basic pair discovery

**Output:**
- ✅ Healthy (exit code 0)
- ⚠️  Degraded (exit code 1)  
- ❌ Down (exit code 2)

**Example:**
```bash
npx tsx scripts/quick-health-check.ts
```

---

### 2. `comprehensive-coredex-audit.ts` 🔍 NEW!

**Purpose:** Complete system audit  
**Runtime:** ~1-2 minutes  
**Use Case:** Weekly audits, major updates

**What it checks:**
- Factory connectivity (both DEXs)
- Token discovery and categorization
- Liquidity analysis
- Price data availability
- Configuration validation
- Factory health status

**Sections:**
1. Factory Connectivity Audit
2. Token Discovery
3. Price & Liquidity Data
4. API Endpoints (info only)
5. Configuration Check

**Example:**
```bash
npx tsx scripts/comprehensive-coredex-audit.ts
```

---

### 3. `verify-all-pairs-and-tokens.ts` 📊 NEW!

**Purpose:** Complete pair and token verification  
**Runtime:** ~1-2 minutes  
**Use Case:** Token database validation

**What it checks:**
- ALL pairs from both factories (no limits)
- Token database coverage
- Liquidity for every pair
- Price calculations
- Top pairs by liquidity

**Output includes:**
- Factory distribution
- Liquidity statistics
- Token coverage percentage
- Pool type distribution
- Top 10 pairs by liquidity
- Database comparison

**Example:**
```bash
npx tsx scripts/verify-all-pairs-and-tokens.ts
```

---

### 4. `verify-dex-factories.ts`

**Purpose:** Quick factory verification  
**Runtime:** ~1 minute  
**Use Case:** Factory address validation

**What it checks:**
- Factory responsiveness
- Expected vs actual pair counts
- Sample pair validation

**Example:**
```bash
npx tsx scripts/verify-dex-factories.ts
```

---

### 5. `check-response-structure.ts`

**Purpose:** Raw API response inspection  
**Runtime:** ~10 seconds  
**Use Case:** Debugging, API changes

**What it checks:**
- Raw response structure from factories
- Response format validation
- Data structure analysis

**Example:**
```bash
npx tsx scripts/check-response-structure.ts
```

---

### 6. `test-api-routes.ts`

**Purpose:** API endpoint testing  
**Runtime:** ~30 seconds  
**Use Case:** API validation  
**Requirements:** Dev server must be running

**What it checks:**
- Nonce generation
- Shield settings endpoints
- Wallet verification
- Authentication flows

**Example:**
```bash
# Terminal 1
npm run dev

# Terminal 2
npx tsx scripts/test-api-routes.ts
```

---

## Recommended Testing Schedule

### Daily
```bash
npx tsx scripts/quick-health-check.ts
```

### Weekly
```bash
npx tsx scripts/comprehensive-coredex-audit.ts
```

### Monthly
```bash
npx tsx scripts/verify-all-pairs-and-tokens.ts
```

### After Major Updates
```bash
# Run all tests
npx tsx scripts/quick-health-check.ts
npx tsx scripts/verify-dex-factories.ts
npx tsx scripts/comprehensive-coredex-audit.ts
npx tsx scripts/verify-all-pairs-and-tokens.ts
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: CoreDEX Health Check

on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
  workflow_dispatch:

jobs:
  health-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: cd shuieldnestorg && npx tsx scripts/quick-health-check.ts
```

### Exit Codes

All scripts use standard exit codes:
- `0` - Success, all checks passed
- `1` - Warning, some issues detected
- `2` - Failure, critical issues
- `3` - Script error

---

## Understanding the Output

### Health Check Output

```bash
✅ All systems operational!        # Everything working
⚠️  System degraded                # Some factories down
❌ System down                      # All factories down
```

### Audit Output

```bash
✅ PASS: <message>    # Test passed
⚠️  WARN: <message>   # Non-critical issue
❌ FAIL: <message>    # Critical failure
ℹ️  INFO: <message>   # Informational
🔄 [X%] <message>     # Progress indicator
```

---

## Troubleshooting

### Script Fails to Run

```bash
# Install dependencies
npm install

# Update tsx
npm install -g tsx

# Check Node version (requires Node 18+)
node --version
```

### Factory Timeout Errors

The scripts have built-in timeout protection (10 seconds). If you see timeout errors:

1. Check network connectivity
2. Verify Coreum mainnet is accessible
3. Try again (temporary network issues)

### "No Pairs Found"

If a factory returns no pairs:

1. Check factory address is correct
2. Verify factory is deployed and active
3. Check if DEX is enabled in configuration

---

## Script Locations

All scripts are in: `shuieldnestorg/scripts/`

Related files:
- Integration code: `shuieldnestorg/utils/coreum/astroport.ts`
- Pool management: `shuieldnestorg/utils/coreum/liquidity-pools.ts`
- Token database: `coreum_tokens.json` (root directory)

---

## Latest Audit Results

**Date:** October 11, 2025

### Summary
- ✅ Both factories operational
- ✅ 79 pairs discovered
- ✅ 100% token coverage
- ✅ 97.5% liquidity coverage
- ✅ All prices available

### Detailed Reports
- Full Report: `COREDEX-AUDIT-REPORT.md` (root directory)
- Quick Summary: `COREDEX-AUDIT-SUMMARY.md` (root directory)

---

## Support

For issues or questions:
1. Check the audit reports in root directory
2. Review `docs/COREDEX-INTEGRATION.md`
3. Inspect test output for error messages
4. Check factory health status

---

**All tests passing! ✅ System is operational and ready for production!**

