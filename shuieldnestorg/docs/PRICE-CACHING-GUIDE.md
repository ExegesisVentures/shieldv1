# Price Caching & Token Images Guide

## Overview

ShieldNest uses a **browser-based caching system** to minimize API calls to CoreDEX and provide a smooth user experience. All token images are served locally from the `/public/tokens/` directory.

## Price Caching Strategy

### Three-Layer Caching System

1. **Browser localStorage** (Primary, Persistent)
   - Caches prices for 10 minutes
   - Persists across browser sessions
   - Automatically expires and refreshes
   - Key format: `coreum_price_{SYMBOL}`

2. **CoreDEX API** (Real-time, When Available)
   - Fetches live prices from CoreDEX mainnet
   - Only called when cache is empty or expired
   - Gracefully handles API unavailability

3. **Fallback Prices** (Last Resort)
   - Static prices for tokens without live data
   - Ensures app never breaks due to missing data
   - Updated periodically by development team

### How It Works

```typescript
// Example: Getting token price
const price = await getTokenPrice("CORE");
// 1. Checks localStorage cache first (instant)
// 2. If expired, fetches from CoreDEX API
// 3. If API fails, uses fallback price
// 4. Caches result for next 10 minutes
```

### Cache Benefits

- ⚡ **Instant loading** - cached prices load immediately
- 💾 **Persistent** - survives page refreshes
- 🚀 **Minimal API calls** - reduces load on CoreDEX
- 🔄 **Auto-refresh** - updates every 10 minutes
- 🛡️ **Graceful fallback** - never breaks user experience

## Token Images

### Local Image Storage

All token logos are stored locally in `/public/tokens/`:

```
/public/tokens/
  ├── core.svg          # CORE token
  ├── xrp.png           # XRP token
  ├── solo.svg          # SOLO token
  ├── atom.png          # ATOM (Cosmos)
  ├── osmo.png          # OSMO (Osmosis)
  ├── cat.svg           # CAT token
  ├── cozy.svg          # COZY token
  ├── kong.svg          # KONG token
  ├── mart.svg          # MART token
  ├── roll.svg          # ROLL token
  ├── smart.svg         # SMART token
  ├── lp.svg            # LP tokens
  ├── ibc.svg           # Generic IBC token
  └── default.svg       # Fallback for unknown tokens
```

### Image Fallback System

The token image utility (`utils/coreum/token-images.ts`) provides:

1. **Primary lookup** - Uses token registry logo path
2. **Symbol mapping** - Falls back to common symbol → file mapping
3. **Type detection** - IBC tokens get generic IBC logo
4. **Default fallback** - Unknown tokens get default.svg

### Adding New Token Images

1. Add the image file to `/public/tokens/`
   - Use SVG for best quality (or PNG for photos)
   - Name format: `{symbol-lowercase}.svg` or `.png`

2. Update token registry (`utils/coreum/token-registry.ts`):
   ```typescript
   "token-denom-here": {
     symbol: "TKN",
     name: "Token Name",
     denom: "token-denom-here",
     decimals: 6,
     logo: "/tokens/tkn.svg", // ← Add this line
     description: "Token description",
   }
   ```

3. (Optional) Add to image utility (`utils/coreum/token-images.ts`):
   ```typescript
   const logoMap: Record<string, string> = {
     // ...
     'TKN': '/tokens/tkn.svg', // ← Add fallback mapping
   };
   ```

## API Usage Patterns

### Dashboard Load

```
User opens dashboard
  ↓
Check localStorage cache
  ↓ (if cache expired or empty)
Fetch from CoreDEX API (1 call per unique token)
  ↓
Cache result for 10 minutes
  ↓
Display to user
```

### Subsequent Visits

```
User returns within 10 minutes
  ↓
Load from localStorage cache (instant)
  ↓
No API calls needed ✅
```

### Manual Refresh

```typescript
// Clear cache and force fresh data
import { clearPriceCache } from '@/utils/coreum/price-oracle';

clearPriceCache(); // Clears localStorage
// Next price fetch will hit API
```

## Error Handling

### No Errors Thrown to Users

The price oracle **never throws errors** to the UI. Instead:

1. **API unavailable** → Use fallback prices
2. **Invalid response** → Use fallback prices  
3. **Network timeout** → Use fallback prices
4. **Unknown token** → Use fallback price of $0

All errors are logged to console for debugging but don't break the UI.

### Fallback Price Updates

Fallback prices are located in:
```typescript
// utils/coreum/price-oracle.ts
function getFallbackPrice(symbol: string) {
  const fallbackPrices: Record<string, { price: number; change24h: number }> = {
    "CORE": { price: 0.12, change24h: 2.5 },
    "XRP": { price: 0.52, change24h: 1.8 },
    // ... update these periodically
  };
}
```

To update fallback prices:
1. Check CoinGecko or similar for current market prices
2. Update the `fallbackPrices` object
3. Deploy updated code

## Performance Optimization

### Image Preloading (Coming Soon)

```typescript
// Preload token images when dashboard loads
import { preloadTokenImages } from '@/utils/coreum/token-images';

useEffect(() => {
  const symbols = ['CORE', 'XRP', 'SOLO', 'ATOM'];
  preloadTokenImages(symbols); // Cache images in browser
}, []);
```

### Cache Statistics

```typescript
import { getCacheStats } from '@/utils/coreum/price-cache';

const stats = getCacheStats();
console.log(`Cached: ${stats.cached}, Fresh: ${stats.fresh}, Expired: ${stats.expired}`);
```

## Future Enhancements

### Planned Features

1. **Supabase Edge Functions** - Server-side price caching
2. **WebSocket Support** - Real-time price updates via CoreDEX WebSocket
3. **Historical Data** - OHLC charts using CoreDEX `/api/ohlc` endpoint
4. **Bulk Fetching** - Fetch all token prices in single API call
5. **Service Worker** - Offline price caching

### Edge Function Architecture (Future)

```
User requests price
  ↓
Supabase Edge Function (edge cache)
  ↓ (if cache expired)
CoreDEX API
  ↓
Cache at edge (global CDN)
  ↓
Return to user
```

This will provide:
- 🌍 **Global caching** - prices cached at edge locations worldwide
- ⚡ **Sub-10ms response** - serve from edge cache
- 🔒 **API key protection** - CoreDEX API key stays server-side
- 📊 **Centralized updates** - all users get same cached data

## Troubleshooting

### Prices Not Updating

```typescript
// Force cache clear
import { clearPriceCache } from '@/utils/coreum/price-oracle';
clearPriceCache();
```

### Images Not Loading

1. Check console for 404 errors
2. Verify file exists in `/public/tokens/`
3. Check token registry has correct path
4. Clear browser cache (Cmd+Shift+R / Ctrl+Shift+R)

### Fallback Prices Always Used

1. Check CoreDEX API is running: `echo $NEXT_PUBLIC_COREDEX_API` or `echo $VITE_ENV_BASE_API`
2. Check network tab for API calls
3. Verify trading pairs exist in `pairMap` (price-oracle.ts)
4. Check browser console for API errors

## Configuration

### Environment Variables

```env
# CoreDEX API endpoint (mainnet)
# Next.js style:
NEXT_PUBLIC_COREDEX_API=https://coredexapi.shieldnest.org/api

# or Vite style:
VITE_ENV_BASE_API=https://coredexapi.shieldnest.org/api
VITE_ENV_WS=wss://coredexapi.shieldnest.org/api/ws

# Coreum RPC endpoints
NEXT_PUBLIC_COREUM_RPC=https://full-node.mainnet-1.coreum.dev:26657
NEXT_PUBLIC_COREUM_REST=https://full-node.mainnet-1.coreum.dev:1317
```

### Cache TTL

To change cache duration, edit:
```typescript
// utils/coreum/price-cache.ts
const CACHE_TTL = 600000; // 10 minutes (in milliseconds)
```

**Recommended TTL:** 5-15 minutes
- Too short: excessive API calls
- Too long: stale prices

## Summary

✅ **Browser-based caching** - 10-minute TTL in localStorage  
✅ **Graceful fallback** - never breaks due to API issues  
✅ **Local images** - all tokens served from `/public/tokens/`  
✅ **No errors to users** - silent fallback handling  
✅ **Minimal API load** - only fetch when cache expires  

This architecture ensures ShieldNest provides a smooth, fast user experience while minimizing load on external APIs.
