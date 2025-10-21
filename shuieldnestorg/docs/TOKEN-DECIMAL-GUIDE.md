# Token Decimal Guide

## Overview

Different tokens on Coreum use different decimal places. This guide explains how each token is formatted and displayed.

---

## Standard Tokens (6 Decimals)

Most tokens on Coreum use **6 decimals** (same as CORE):

| Token | Symbol | Decimals | Example Raw | Display |
|-------|--------|----------|-------------|---------|
| Coreum | CORE | 6 | 1000000 | 1.0 CORE |
| COZY | COZY | 6 | 1000000 | 1.0 COZY |
| KONG | KONG | 6 | 1000000 | 1.0 KONG |
| MART | MART | 6 | 1000000 | 1.0 MART |
| CAT | CAT | 6 | 1000000 | 1.0 CAT |
| ROLL | ROLL | 6 | 1000000 | 1.0 ROLL |
| SMART | SMART | 6 | 1000000 | 1.0 SMART |
| AWKT | AWKT | 6 | 1000000 | 1.0 AWKT |
| ULP | ULP | 6 | 1000000 | 1.0 ULP |
| ATOM | ATOM | 6 | 1000000 | 1.0 ATOM |
| OSMO | OSMO | 6 | 1000000 | 1.0 OSMO |

**Formula:** Display Amount = Raw Amount / 1,000,000

---

## XRP (6 Decimals - Drops Format)

**XRP uses "drops" as the base unit:**
- 1 XRP = 1,000,000 drops
- On Coreum, XRP is stored in drops format with 6 decimals

| Token | Symbol | Decimals | Example Raw | Display |
|-------|--------|----------|-------------|---------|
| Wrapped XRP | XRP | 6 | 1000000 | 1.0 XRP |
| | | | 52000000 | 52.0 XRP |

**Important Notes:**
- The denom starts with `drop-core1...` (not `xrp-core1...`)
- XRP on XRPL uses drops: 1 XRP = 1,000,000 drops
- On Coreum, this maps to 6 decimal places
- Always display as "XRP" not "drops"

**Denom:**
```
drop-core1zhs909jp9yktml6qqx9f0ptcq2xnhhj99cja03j3lfcsp2pgm86studdrz
```

---

## SOLO (15 Decimals - Special Case)

**SOLO (Sologenic) uses 15 decimals:**
- This is much larger than standard tokens
- 1 SOLO = 1,000,000,000,000,000 base units

| Token | Symbol | Decimals | Example Raw | Display |
|-------|--------|----------|-------------|---------|
| Sologenic | SOLO | 15 | 1000000000000000 | 1.0 SOLO |
| | | | 1575000000000000000 | 1575.0 SOLO |

**Important Notes:**
- SOLO comes from XRPL (XRP Ledger)
- Uses 15 decimal places (NOT 6 like most Coreum tokens)
- Make sure to use correct decimals when formatting
- If displayed incorrectly, will show tiny fractions instead of proper amounts

**Denom:**
```
solo-core1ks5y4szk8kav9z9rm9w2c8f88w6nyq2aznwc8x69mtgvmul5us3qtqqz3e
```

**Example Calculation:**
```typescript
// Raw amount from blockchain
const raw = "1575000000000000000";

// Using 15 decimals (CORRECT)
const displayAmount = raw / (10 ** 15);
// Result: 1575.0 SOLO ✅

// Using 6 decimals (WRONG)
const wrongAmount = raw / (10 ** 6);
// Result: 1575000000000.0 SOLO ❌ (way too high!)
```

---

## How It Works in Code

### Token Registry

**File:** `utils/coreum/token-registry.ts`

```typescript
export const TOKEN_REGISTRY: Record<string, TokenMetadata> = {
  // XRP - 6 decimals (drops)
  "drop-core1zhs909jp9yktml6qqx9f0ptcq2xnhhj99cja03j3lfcsp2pgm86studdrz": {
    symbol: "XRP",
    name: "Wrapped XRP",
    denom: "drop-core1zhs909jp9yktml6qqx9f0ptcq2xnhhj99cja03j3lfcsp2pgm86studdrz",
    decimals: 6, // Drops format
    logo: "/tokens/xrp.png",
  },

  // SOLO - 15 decimals
  "solo-core1ks5y4szk8kav9z9rm9w2c8f88w6nyq2aznwc8x69mtgvmul5us3qtqqz3e": {
    symbol: "SOLO",
    name: "Sologenic",
    denom: "solo-core1ks5y4szk8kav9z9rm9w2c8f88w6nyq2aznwc8x69mtgvmul5us3qtqqz3e",
    decimals: 15, // XRPL standard
    logo: "/tokens/solo.svg",
  },
};
```

### Formatting Function

**File:** `utils/coreum/rpc.ts`

```typescript
export function formatTokenAmount(amount: string, decimals: number = 6): string {
  const numAmount = BigInt(amount);
  const divisor = BigInt(10 ** decimals); // Uses correct decimals
  const integerPart = numAmount / divisor;
  const fractionalPart = numAmount % divisor;
  
  // Returns formatted string like "1575.0" or "52.5"
  return `${integerPart}.${fractionalStr}`;
}
```

### Enrichment Process

**File:** `utils/coreum/rpc.ts`

```typescript
export async function enrichBalances(balances: TokenBalance[]): Promise<EnrichedBalance[]> {
  for (const balance of balances) {
    // Get token info (includes correct decimals)
    const tokenInfo = getTokenInfo(balance.denom);
    
    // Format using the token's specific decimals
    const balanceFormatted = formatTokenAmount(
      balance.amount, 
      tokenInfo.decimals // Could be 6 or 15!
    );
    
    // Calculate USD value
    const price = await getTokenPrice(tokenInfo.symbol);
    const valueUsd = parseFloat(balanceFormatted) * price;
  }
}
```

---

## Debugging Token Display Issues

### Issue: Token shows wrong decimal places

**Example Problem:**
- Expected: 1575 SOLO
- Showing: 0.001575 SOLO

**Solution:**
1. Check token denom from blockchain logs
2. Verify denom exists in `token-registry.ts`
3. Confirm decimals field is correct (15 for SOLO, 6 for most others)
4. Restart dev server to reload registry

### Issue: Token not showing at all

**Solution:**
1. Check console for "ACTUAL DENOMS FROM BLOCKCHAIN" debug log
2. Copy the exact denom string
3. Add to `token-registry.ts` with correct decimals
4. Add token logo to `/public/tokens/`

### Issue: XRP showing as "DROP"

**Solution:**
- The denom starts with "drop-" but symbol should be "XRP"
- Check token registry uses `symbol: "XRP"`
- Logo should be `xrp.png` not `drop.png`

---

## Adding New Tokens

When adding a new token to the registry:

1. **Get the exact denom from blockchain:**
   ```
   Check console logs: "=== ACTUAL DENOMS FROM BLOCKCHAIN ==="
   ```

2. **Determine decimals:**
   - Most Coreum tokens: 6 decimals
   - IBC tokens (ATOM, OSMO): 6 decimals
   - XRPL tokens (SOLO): 15 decimals
   - XRP: 6 decimals (drops format)

3. **Add to registry:**
   ```typescript
   "exact-denom-from-blockchain": {
     symbol: "TOKEN",
     name: "Token Name",
     denom: "exact-denom-from-blockchain",
     decimals: 6, // or 15 for SOLO
     logo: "/tokens/token.svg",
   }
   ```

4. **Add token image:**
   ```bash
   # Place in /public/tokens/
   /public/tokens/token.svg  # or .png
   ```

5. **Restart server:**
   ```bash
   pkill -f "next dev"
   pnpm dev
   ```

---

## Reference: Decimal Conversion

| Decimals | Divisor | Example Raw | Display |
|----------|---------|-------------|---------|
| 6 | 1,000,000 | 1000000 | 1.0 |
| 6 | 1,000,000 | 52500000 | 52.5 |
| 15 | 1,000,000,000,000,000 | 1575000000000000000 | 1575.0 |
| 15 | 1,000,000,000,000,000 | 123456789012345678 | 123.4567 |

**Formula:**
```
Display = Raw / (10 ^ Decimals)
```

---

## Files to Check

When troubleshooting token display:

1. **Token Registry:** `utils/coreum/token-registry.ts`
   - Contains all token metadata
   - Defines decimals for each token

2. **RPC Client:** `utils/coreum/rpc.ts`
   - `formatTokenAmount()` - Converts raw to display
   - `getTokenInfo()` - Gets metadata by denom
   - `enrichBalances()` - Adds pricing and formatting

3. **Token Images:** `/public/tokens/`
   - Logo files for each token
   - xrp.png, solo.svg, etc.

4. **Price Mocks:** `utils/coreum/rpc.ts`
   - `getTokenPrice()` - Returns USD price
   - `getTokenChange24h()` - Returns 24h change %

---

## Summary

✅ **Most tokens:** 6 decimals (CORE, COZY, KONG, MART, etc.)  
✅ **XRP:** 6 decimals (drops format, display as "XRP")  
✅ **SOLO:** 15 decimals (XRPL standard)  

Make sure the `decimals` field in `token-registry.ts` matches the token's actual decimal places, or amounts will display incorrectly!
