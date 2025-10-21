# Price Oracle Architecture

## Overview

ShieldNest now uses a simplified price oracle system that fetches real-time token prices exclusively from the CoreDEX API (coredexapi.shieldnest.org). This ensures all portfolio values reflect true market prices with a single, reliable source.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Portfolio Display                     │
│                  (Dashboard, Wallets)                    │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
                ┌─────────────────┐
                │  utils/coreum/  │
                │     rpc.ts      │
                │  (Balance Calc) │
                └────────┬────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │  utils/coreum/       │
              │  price-oracle.ts     │
              │  (Price Fetching)    │
              └──────────┬───────────┘
                         │
                         │
                         ▼
                ┌─────────────────┐
                │   CoreDEX API   │
                │ (coredexapi.    │
                │  shieldnest.org)│
                └─────────────────┘
```

## Components

### 1. Price Oracle (`utils/coreum/price-oracle.ts`)

**Purpose:** Centralized price fetching with caching

**Key Features:**
- Fetches from CoreDEX API (coredexapi.shieldnest.org)
- 10-minute price caching
- Fallback pricing if CoreDEX API unavailable
- Simplified single-source design

**Functions:**
```typescript
// Fetch single token price
getTokenPrice(symbol: string): Promise<number>

// Fetch 24h change
getTokenChange24h(symbol: string): Promise<number>

// Fetch multiple tokens efficiently
fetchMultipleTokenPrices(symbols: string[]): Promise<Record<...>>

// Clear cache (for testing/forced refresh)
clearPriceCache(): void
```

**Cache Strategy:**
- Prices cached for 10 minutes
- Reduces API calls and improves performance
- Automatic cache invalidation

### 2. RPC Client (`utils/coreum/rpc.ts`)

**Purpose:** Blockchain interaction and balance enrichment

**Responsibilities:**
- Fetch raw balances from Coreum REST API
- Fetch staking/rewards data
- Enrich balances with pricing from oracle
- Aggregate multi-wallet balances

**Flow:**
```typescript
1. fetchBalances(address) → Raw balance data
2. enrichBalances(balances) → Add token metadata
3. getTokenPrice() → Fetch from oracle
4. Calculate valueUsd = balance × price
```

### 3. Shield NFT (`utils/nft/shield.ts`)

**Purpose:** Calculate NFT value based on CORE backing

**Backing Model:**
- Each Shield NFT is backed by **41,666 CORE tokens**
- NFT value = 41,666 × CORE price
- No user-specific variance (same value for all users)
- 24h change follows CORE exactly

**Calculation:**
```typescript
const SHIELD_NFT_CORE_BACKING = 41666;

function calculateShieldNftValue(corePrice: number): number {
  return SHIELD_NFT_CORE_BACKING * corePrice;
}
```

**Example:**
- CORE price: $0.12
- NFT value: 41,666 × $0.12 = **$5,000**

If CORE rises to $0.15:
- NFT value: 41,666 × $0.15 = **$6,250**

## Token Price Sources

### Current Implementation (Fallback Mode)

While Coreum DEX API integration is being finalized, prices use fallback values based on current market data:

| Token | Price | Source | Notes |
|-------|-------|--------|-------|
| CORE | $0.12 | Market | Native token |
| XRP | $0.52 | XRP Ledger DEX | Bridged |
| SOLO | $0.12 | XRP Ledger DEX | Bridged |
| ATOM | $7.50 | IBC | Cosmos Hub |
| OSMO | $0.45 | IBC | Osmosis |
| Others | Various | Coreum DEX | Native tokens |

### Future: Full DEX Integration

When Coreum DEX API is fully available:

**Endpoint Pattern:**
```
GET https://api.coreum.dex/v1/ticker/{pair}
Example: /v1/ticker/CORE-USDC
```

**Response Format:**
```json
{
  "pair": "CORE-USDC",
  "price": 0.12,
  "volume_24h": 150000,
  "high_24h": 0.13,
  "low_24h": 0.11,
  "change_24h": 2.5
}
```

**WebSocket (Real-time):**
```
wss://api.coreum.dex/ws
Subscribe: { "type": "subscribe", "pairs": ["CORE-USDC"] }
Updates: Real-time price changes pushed to client
```

## Modularity

The system is designed to easily switch price sources:

### Adding a New Price Source

1. **Create new function in `price-oracle.ts`:**
```typescript
async function fetchFromNewSource(symbol: string) {
  const response = await fetch(`https://new-api.com/price/${symbol}`);
  const data = await response.json();
  return { price: data.price, change24h: data.change };
}
```

2. **Update `fetchTokenPriceFromDex`:**
```typescript
export async function fetchTokenPriceFromDex(symbol: string) {
  try {
    // Try primary source
    return await fetchFromCoreumDex(symbol);
  } catch (error) {
    // Fallback to secondary source
    return await fetchFromNewSource(symbol);
  }
}
```

3. **No changes needed elsewhere** - modularity preserved!

### Switching Price Sources

To switch from fallback to live DEX:

```typescript
// In price-oracle.ts, replace:
const result = await fetchTokenPriceFallback(symbol);

// With:
const result = await fetchFromCoreumDexAPI(symbol);
```

**That's it!** The entire app updates automatically.

## Performance Optimizations

### 1. Price Caching
- 30-second TTL reduces API calls
- Cache stored in memory (Map)
- Automatic invalidation

### 2. Batch Fetching
```typescript
// Instead of:
for (const token of tokens) {
  await getTokenPrice(token.symbol); // Slow!
}

// Use:
await fetchMultipleTokenPrices(symbols); // Fast!
```

### 3. Lazy Loading
- Prices fetched only when needed
- Not fetched for tokens with zero balance

### 4. Parallel Requests
```typescript
// Fetch balances and prices in parallel
const [balances, prices] = await Promise.all([
  fetchBalances(address),
  fetchMultipleTokenPrices(['CORE', 'XRP', 'SOLO'])
]);
```

## Error Handling

### Graceful Degradation

If DEX API fails:
1. Check price cache
2. Fall back to backup pricing
3. Log error for monitoring
4. Never show $0 (confusing for users)

### Retry Strategy

```typescript
async function fetchWithRetry(fn, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await delay(Math.pow(2, i) * 1000); // Exponential backoff
    }
  }
}
```

## Testing

### Manual Price Update

```typescript
// In browser console:
import { clearPriceCache } from '@/utils/coreum/price-oracle';
clearPriceCache();
// Refresh page - prices will refetch
```

### Simulate Price Changes

For testing UI with different prices:

```typescript
// In price-oracle.ts fallback:
const testPrices = {
  "CORE": 0.25, // Simulate 2x price increase
  ...
};
```

## Monitoring

### Key Metrics to Track

1. **API Response Time**
   - Should be < 500ms per request
   - Monitor for slowdowns

2. **Cache Hit Rate**
   - Target: > 80% cache hits
   - Low rate indicates too short TTL

3. **Error Rate**
   - Should be < 1%
   - Alert if > 5%

4. **Price Accuracy**
   - Compare with known DEX prices
   - Alert if deviation > 5%

### Logging

The oracle logs all price fetches:
```
[Price Oracle] CORE: $0.12 (+2.5%)
[Price Oracle] XRP: $0.52 (+1.8%)
```

Check browser console for real-time logs.

## Migration Path

### Phase 1: Fallback Mode (Current)
✅ Modular architecture in place
✅ Fallback pricing active
✅ Ready for DEX API integration

### Phase 2: Hybrid Mode
- Primary: Coreum DEX API
- Fallback: Current pricing
- Gradual rollout

### Phase 3: Full DEX Integration
- All prices from Coreum DEX
- WebSocket for real-time updates
- Remove fallback (keep for emergency)

### Phase 4: Multi-Source Aggregation
- Coreum DEX (primary)
- XRP Ledger DEX (for bridged tokens)
- IBC price oracles (for IBC tokens)
- Weighted average if multiple sources

## Security Considerations

### Rate Limiting

Respect API rate limits:
- Coreum DEX: TBD requests/minute
- Implement request queuing if needed

### API Key Management

If DEX requires API keys:
```env
NEXT_PUBLIC_COREUM_DEX_API_KEY=<key>
```

Store in environment variables, never in code.

### Price Manipulation

DEX prices can be manipulated:
- Use volume-weighted average
- Set max deviation alerts
- Cross-check with multiple sources

### Caching Security

Price cache is in-memory:
- Cleared on server restart
- Not persisted to disk
- No sensitive data stored

## FAQ

### Q: Why 41,666 CORE for NFT backing?

A: This gives an NFT value of ~$5,000 at current CORE prices ($0.12), which aligns with the target membership value.

### Q: Can admins change the NFT backing amount?

A: Yes, update `SHIELD_NFT_CORE_BACKING` constant in `utils/nft/shield.ts`.

### Q: What happens if DEX API is down?

A: Fallback pricing automatically activates. Users see prices with slight delay but no errors.

### Q: How often do prices update?

A: Every 30 seconds (cache TTL). Can be adjusted if needed.

### Q: Can we use CoinGecko instead?

A: Yes! Just update `fetchTokenPriceFromDex()` to call CoinGecko API. The modularity supports any source.

## Summary

✅ **Modular** - Easy to switch price sources  
✅ **Cached** - 30-second TTL for performance  
✅ **Reliable** - Fallback pricing if API fails  
✅ **Accurate** - Real-time prices from DEX  
✅ **Efficient** - Batch fetching, parallel requests  
✅ **Shield NFT** - Backed by 41,666 CORE tokens  

**Status:** Production-ready with fallback pricing. DEX API integration ready to deploy when available.
