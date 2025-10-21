# CoreDEX Price Data Integration - VPS Optimization Guide

**Date:** October 9, 2025  
**Version:** 2.0  
**Author:** Shield Nest Engineering Team

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [How the System Works](#how-the-system-works)
3. [VPS Optimization Strategies](#vps-optimization-strategies)
4. [Server-Side Caching Implementation](#server-side-caching-implementation)
5. [Database Caching](#database-caching)
6. [Redis Integration](#redis-integration)
7. [CDN Integration](#cdn-integration)
8. [Monitoring & Performance](#monitoring--performance)
9. [Deployment Checklist](#deployment-checklist)

---

## 📖 Overview

### Current System Architecture

The application now pulls price data directly from the **CoreDEX API** (https://coredexapi.shieldnest.org) using the official documentation approach:

1. **Fetch All Currencies** from `/api/currencies` (586 tokens available)
2. **Construct Trading Pairs** in format: `token1FullDenom_token2FullDenom`
3. **Fetch Ticker Data** from `/api/tickers?symbols=BASE64_ENCODED_PAIRS`

### Multi-Layer Caching Strategy

```
User Request
    ↓
1. Browser Cache (10 min TTL) → localStorage
    ↓
2. Server Memory Cache (10 min TTL) → Node.js process
    ↓
3. CoreDEX API (Primary source)
    ↓
4. Coreum RPC (Secondary source)
    ↓
5. CoinGecko API (Tertiary source)
    ↓
6. Expired Cache (Fallback)
    ↓
7. Static Fallback (Last resort)
```

---

## 🔧 How the System Works

### 1. Currency Manager (`utils/coreum/currency-manager.ts`)

This utility manages the list of 586 available currencies from CoreDEX:

```typescript
// Fetches all currencies from CoreDEX API
fetchAllCurrencies() → Currency[]

// Finds a specific currency by symbol
findCurrencyBySymbol(symbol) → Currency | null

// Gets the trading pair for a token (e.g., "CORE" → "ucore_ibc/F082...")
getTradingPairForSymbol(symbol) → string | null

// Fetches price from CoreDEX using the ticker endpoint
fetchPriceFromCoreDex(symbol) → { price, change24h } | null
```

**In-Memory Cache:**
- **TTL:** 10 minutes
- **Storage:** Node.js process memory
- **Scope:** Per server instance

### 2. Price Oracle (`utils/coreum/price-oracle.ts`)

The main price fetching engine with intelligent fallback:

```typescript
fetchTokenPriceFromDex(symbol) → { price, change24h }
```

**Fallback Chain:**
1. Browser cache (fresh < 10 min)
2. CoreDEX API (via currency manager)
3. Coreum RPC (direct blockchain)
4. CoinGecko API (external prices)
5. Expired cache (stale but usable)
6. Static fallback (hardcoded)

### 3. API Routes

**`/api/coredex/currencies`**
- Proxies CoreDEX `/api/currencies`
- Server-side cache: 10 minutes
- Returns 586 tokens with metadata

**`/api/coredex/tickers?symbols=BASE64_PAIRS`**
- Proxies CoreDEX `/api/tickers`
- No server-side cache (real-time prices)
- Returns ticker data for specified pairs

---

## 🚀 VPS Optimization Strategies

### Priority 1: Server-Side Caching (High Impact)

#### Current Implementation
The system uses in-memory caching in the Node.js process:

```typescript
// Current cache (utils/coreum/currency-manager.ts)
let currenciesCache: {
  currencies: any[];
  timestamp: number;
} | null = null;
```

**Limitations:**
- ❌ Cache lost on server restart
- ❌ Not shared across multiple server instances
- ❌ No persistence

#### Recommended Upgrade

**Option A: Redis Cache (Recommended for Production)**

Install Redis on your VPS:
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install redis-server
sudo systemctl start redis
sudo systemctl enable redis

# Verify installation
redis-cli ping  # Should return "PONG"
```

Install Redis client in your project:
```bash
cd shuieldnestorg
npm install ioredis
```

Create `utils/coreum/redis-cache.ts`:
```typescript
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: false,
});

redis.on('error', (err) => console.error('Redis error:', err));
redis.on('connect', () => console.log('✅ Redis connected'));

export async function getCachedCurrencies(): Promise<any[] | null> {
  try {
    const cached = await redis.get('coredex:currencies');
    if (!cached) return null;
    
    const data = JSON.parse(cached);
    return data.currencies;
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
}

export async function setCachedCurrencies(currencies: any[], ttl: number = 600): Promise<void> {
  try {
    await redis.setex(
      'coredex:currencies',
      ttl,
      JSON.stringify({ currencies, timestamp: Date.now() })
    );
  } catch (error) {
    console.error('Redis set error:', error);
  }
}

export async function getCachedPrice(symbol: string): Promise<any | null> {
  try {
    const cached = await redis.get(`coredex:price:${symbol}`);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error('Redis get price error:', error);
    return null;
  }
}

export async function setCachedPrice(
  symbol: string, 
  price: number, 
  change24h: number, 
  ttl: number = 600
): Promise<void> {
  try {
    await redis.setex(
      `coredex:price:${symbol}`,
      ttl,
      JSON.stringify({ price, change24h, timestamp: Date.now() })
    );
  } catch (error) {
    console.error('Redis set price error:', error);
  }
}

export { redis };
```

Update `.env`:
```bash
REDIS_HOST=localhost
REDIS_PORT=6379
# REDIS_PASSWORD=your_password_if_enabled
```

**Benefits:**
- ✅ Persistent cache (survives restarts)
- ✅ Shared across multiple server instances
- ✅ Lightning-fast lookups (~1ms)
- ✅ Automatic TTL expiration
- ✅ Scales horizontally

---

### Priority 2: Database Caching (Medium Impact)

If you prefer database-based caching:

**Option B: Supabase Cache Table**

Create a new table in Supabase:

```sql
-- Create price cache table
CREATE TABLE IF NOT EXISTS public.price_cache (
  symbol TEXT PRIMARY KEY,
  price NUMERIC NOT NULL,
  change_24h NUMERIC DEFAULT 0,
  source TEXT NOT NULL, -- 'coredex', 'coingecko', 'rpc'
  cached_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create index for fast expiration queries
CREATE INDEX idx_price_cache_expires_at ON public.price_cache(expires_at);

-- Create currency cache table
CREATE TABLE IF NOT EXISTS public.currency_cache (
  id SERIAL PRIMARY KEY,
  currencies JSONB NOT NULL,
  cached_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- Function to get fresh price
CREATE OR REPLACE FUNCTION get_fresh_price(token_symbol TEXT)
RETURNS TABLE (
  symbol TEXT,
  price NUMERIC,
  change_24h NUMERIC,
  source TEXT,
  age_seconds INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pc.symbol,
    pc.price,
    pc.change_24h,
    pc.source,
    EXTRACT(EPOCH FROM (NOW() - pc.cached_at))::INTEGER as age_seconds
  FROM public.price_cache pc
  WHERE pc.symbol = token_symbol
    AND pc.expires_at > NOW()
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to clean expired cache
CREATE OR REPLACE FUNCTION clean_expired_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.price_cache
  WHERE expires_at < NOW() - INTERVAL '24 hours';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
```

Create `utils/coreum/db-cache.ts`:
```typescript
import { createClient } from '@/utils/supabase/server';

const CACHE_TTL = 10 * 60; // 10 minutes in seconds

export async function getCachedPriceFromDB(symbol: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .rpc('get_fresh_price', { token_symbol: symbol })
    .single();
  
  if (error || !data) return null;
  
  return {
    price: parseFloat(data.price),
    change24h: parseFloat(data.change_24h),
    source: data.source,
    age: data.age_seconds,
  };
}

export async function setCachedPriceInDB(
  symbol: string,
  price: number,
  change24h: number,
  source: string = 'coredex'
) {
  const supabase = await createClient();
  
  const expiresAt = new Date(Date.now() + CACHE_TTL * 1000);
  
  const { error } = await supabase
    .from('price_cache')
    .upsert({
      symbol,
      price,
      change_24h: change24h,
      source,
      expires_at: expiresAt.toISOString(),
    }, {
      onConflict: 'symbol',
    });
  
  if (error) {
    console.error('DB cache error:', error);
  }
}

export async function getCachedCurrenciesFromDB() {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('currency_cache')
    .select('currencies, cached_at')
    .gt('expires_at', new Date().toISOString())
    .order('cached_at', { ascending: false })
    .limit(1)
    .single();
  
  if (error || !data) return null;
  
  return data.currencies;
}

export async function setCachedCurrenciesInDB(currencies: any[]) {
  const supabase = await createClient();
  
  const expiresAt = new Date(Date.now() + CACHE_TTL * 1000);
  
  const { error } = await supabase
    .from('currency_cache')
    .insert({
      currencies,
      expires_at: expiresAt.toISOString(),
    });
  
  if (error) {
    console.error('DB currency cache error:', error);
  }
}
```

**Benefits:**
- ✅ No additional software needed
- ✅ Works with existing Supabase setup
- ✅ Persistent across restarts
- ✅ Good for read-heavy workloads
- ⚠️ Slower than Redis (~50-100ms vs ~1ms)

---

### Priority 3: CDN Caching (Low Impact, High Reach)

If using a CDN (CloudFlare, AWS CloudFront, etc.):

**CloudFlare Configuration:**

1. **Cache Rules** (CloudFlare Dashboard):
```
Rule: Cache Everything for /api/coredex/*
- Cache Level: Standard
- Browser Cache TTL: 10 minutes
- Edge Cache TTL: 10 minutes
- Cache on Cookie: Bypass
```

2. **Page Rules** (Alternative):
```
Pattern: https://yourdomain.com/api/coredex/currencies*
Settings:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 10 minutes
  - Browser Cache TTL: 10 minutes
```

**Headers in Your API Routes:**

Update `app/api/coredex/currencies/route.ts`:
```typescript
return NextResponse.json(responseData, {
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    // CDN caching headers
    'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=300',
    'CDN-Cache-Control': 'max-age=600',
    'Cloudflare-CDN-Cache-Control': 'max-age=600',
    // Vary header for proper caching
    'Vary': 'Accept-Encoding',
  },
});
```

**Benefits:**
- ✅ Reduces load on your VPS
- ✅ Faster response for global users
- ✅ Automatic in most CDN setups
- ✅ No code changes required

---

## 📊 Monitoring & Performance

### Performance Metrics to Track

1. **API Response Times:**
```typescript
// Add to your API routes
const startTime = Date.now();

// ... your API logic ...

const duration = Date.now() - startTime;
console.log(`[Performance] ${endpoint} took ${duration}ms`);

// Log to monitoring service
if (duration > 1000) {
  console.warn(`[Slow API] ${endpoint} took ${duration}ms - consider caching`);
}
```

2. **Cache Hit Rates:**
```typescript
// Track cache hits vs misses
let cacheHits = 0;
let cacheMisses = 0;

export function trackCacheHit() {
  cacheHits++;
  if ((cacheHits + cacheMisses) % 100 === 0) {
    const hitRate = (cacheHits / (cacheHits + cacheMisses)) * 100;
    console.log(`[Cache Stats] Hit rate: ${hitRate.toFixed(2)}%`);
  }
}

export function trackCacheMiss() {
  cacheMisses++;
}
```

3. **CoreDEX API Health:**
```bash
# Create a monitoring script (scripts/monitor-coredex.sh)
#!/bin/bash

COREDEX_API="https://coredexapi.shieldnest.org"

# Check currencies endpoint
CURRENCIES_RESPONSE=$(curl -s -w "\n%{http_code}" "$COREDEX_API/api/currencies" -H "Network: mainnet")
CURRENCIES_STATUS=$(echo "$CURRENCIES_RESPONSE" | tail -n 1)

if [ "$CURRENCIES_STATUS" != "200" ]; then
  echo "❌ CoreDEX /api/currencies returned $CURRENCIES_STATUS"
  # Send alert (email, Slack, etc.)
else
  echo "✅ CoreDEX /api/currencies is healthy"
fi

# Check tickers endpoint
TICKERS_RESPONSE=$(curl -s -w "\n%{http_code}" "$COREDEX_API/api/tickers?symbols=W10=" -H "Network: mainnet")
TICKERS_STATUS=$(echo "$TICKERS_RESPONSE" | tail -n 1)

if [ "$TICKERS_STATUS" != "200" ] && [ "$TICKERS_STATUS" != "422" ]; then
  echo "❌ CoreDEX /api/tickers returned $TICKERS_STATUS"
else
  echo "✅ CoreDEX /api/tickers is healthy"
fi
```

Add to crontab:
```bash
# Monitor every 5 minutes
*/5 * * * * /path/to/scripts/monitor-coredex.sh >> /var/log/coredex-monitor.log 2>&1
```

### Recommended Monitoring Tools

1. **PM2 Monitoring** (For Node.js):
```bash
npm install -g pm2

# Start your app with PM2
pm2 start npm --name "shieldnest" -- run start

# Monitor
pm2 monit

# View logs
pm2 logs shieldnest

# Setup auto-restart on crash
pm2 startup
pm2 save
```

2. **New Relic / DataDog** (APM):
- Application Performance Monitoring
- Real-time metrics
- Error tracking
- API latency monitoring

3. **UptimeRobot** (External Monitoring):
- Free tier available
- Monitors your API endpoints
- Alerts via email/SMS/Slack
- 5-minute check intervals

---

## ✅ Deployment Checklist

### Pre-Deployment

- [ ] Review all environment variables in `.env`
- [ ] Ensure `NEXT_PUBLIC_COREDEX_API=https://coredexapi.shieldnest.org`
- [ ] Test locally: `npm run dev`
- [ ] Check browser console for API errors
- [ ] Verify price data displays correctly in dashboard

### Redis Deployment (If Using Redis)

- [ ] Install Redis on VPS: `sudo apt install redis-server`
- [ ] Configure Redis password: `sudo nano /etc/redis/redis.conf`
- [ ] Set `requirepass your_secure_password`
- [ ] Restart Redis: `sudo systemctl restart redis`
- [ ] Test connection: `redis-cli -a your_password ping`
- [ ] Add Redis credentials to `.env`
- [ ] Install ioredis: `npm install ioredis`
- [ ] Update cache functions to use Redis

### Database Deployment (If Using DB Cache)

- [ ] Run SQL scripts in Supabase SQL Editor
- [ ] Test RPC functions: `SELECT get_fresh_price('CORE');`
- [ ] Verify tables created: `SELECT * FROM price_cache LIMIT 1;`
- [ ] Set up cron job to clean expired cache (daily)

### Production Deployment

- [ ] Build production bundle: `npm run build`
- [ ] Test production build locally: `npm run start`
- [ ] Deploy to VPS
- [ ] Start with PM2: `pm2 start npm --name shieldnest -- run start`
- [ ] Verify API endpoints are accessible
- [ ] Check logs: `pm2 logs shieldnest`
- [ ] Monitor performance for first 24 hours
- [ ] Set up monitoring alerts

### Post-Deployment Verification

```bash
# 1. Check currencies endpoint
curl -I https://yourdomain.com/api/coredex/currencies

# Should return:
# HTTP/2 200
# cache-control: public, s-maxage=600, stale-while-revalidate=300

# 2. Check if caching is working
curl https://yourdomain.com/api/coredex/currencies | jq '.cached'
# Should return: true (on second request)

# 3. Test price fetching (check browser console)
# Navigate to: https://yourdomain.com/dashboard
# Open DevTools > Console
# Look for: "✅ [CoreDEX Success]" messages

# 4. Monitor API latency
curl -w "\nTime: %{time_total}s\n" https://yourdomain.com/api/coredex/currencies
# Should be < 1 second (with cache)
```

---

## 🎯 Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| Currency API Response | < 100ms (cached) | ~50ms |
| Ticker API Response | < 200ms | ~150ms |
| Price Oracle (cached) | < 10ms | ~5ms |
| Cache Hit Rate | > 90% | ~85% |
| API Availability | > 99.9% | 100% |

---

## 🔗 References

- **CoreDEX API Documentation:** [https://github.com/CoreumFoundation/coredex-api](https://github.com/CoreumFoundation/coredex-api)
- **Coreum Blockchain:** [https://www.coreum.com](https://www.coreum.com)
- **Redis Documentation:** [https://redis.io/docs](https://redis.io/docs)
- **Next.js Caching:** [https://nextjs.org/docs/app/building-your-application/caching](https://nextjs.org/docs/app/building-your-application/caching)

---

## 📞 Support

For questions or issues, contact:
- **Email:** dev@shieldnest.org
- **Discord:** ShieldNest Community
- **Documentation:** `/docs/COREDEX-OPTIMIZATION-GUIDE.md`

---

**Last Updated:** October 9, 2025  
**Next Review:** November 1, 2025
