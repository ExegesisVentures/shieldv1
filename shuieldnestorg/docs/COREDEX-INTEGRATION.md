# CoreDEX API Integration Guide

## Overview

ShieldNest now integrates with the CoreDEX API to fetch real-time token prices from the Coreum DEX. This provides accurate, live pricing for all tokens in your portfolio.

## Setup CoreDEX API

### 1. Prerequisites

- Go 1.23+
- MySQL
- Docker (optional)

### 2. Database Setup

```sql
CREATE DATABASE friendly_dex;
CREATE USER 'testuser'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON friendly_dex.* TO 'testuser'@'localhost';
FLUSH PRIVILEGES;
```

### 3. Clone and Start CoreDEX API

```bash
# Clone the CoreDEX-API repository
git clone https://github.com/CoreumFoundation/CoreDEX-API.git
cd CoreDEX-API

# Start all components (except MySQL)
./bin/start.sh
```

### 4. Update Block Height (First Run)

On first start, update the state to current block:

```sql
UPDATE State SET Content = '{"Height":<current_block>}' WHERE StateType=1;
```

Then restart the data-aggregator.

### 5. Environment Configuration

Add to your `.env.local`:

```env
# CoreDEX API endpoint (REST base)
# Next.js style:
NEXT_PUBLIC_COREDEX_API=http://localhost:8080/api

# or Vite style:
VITE_ENV_BASE_API=http://localhost:8080/api
VITE_ENV_WS=ws://localhost:8080/api/ws
```

## API Endpoints

The CoreDEX API provides these endpoints:

### Ticker Data
```
GET /api/v1/ticker/{pair}
Example: /api/v1/ticker/CORE-USDC
```

**Response:**
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

### OHLC Data
```
GET /api/v1/ohlc/{pair}?interval=1d
```

### Trade History
```
GET /api/v1/trades/{pair}
```

## Integration in ShieldNest

### Price Oracle

The `utils/coreum/price-oracle.ts` file handles CoreDEX integration:

```typescript
// Fetches from CoreDEX API
const response = await fetch(`${COREDEX_API}/api/v1/ticker/${pair}`);

// Parses response
const price = parseFloat(data.price);
const change24h = parseFloat(data.change_24h);
```

### Trading Pairs

Currently mapped pairs:
- `CORE` → `CORE-USDC`
- `XRP` → `XRP-USDC`
- `SOLO` → `SOLO-USDC`
- `ATOM` → `ATOM-USDC`
- `OSMO` → `OSMO-USDC`

### Fallback System

If CoreDEX API is unavailable:
1. Tries CoreDEX API first
2. Falls back to market-based pricing
3. Logs which source was used

## Testing

### 1. Check CoreDEX API Status

```bash
curl http://localhost:8080/api/v1/ticker/CORE-USDC
```

### 2. Monitor Logs

Check browser console for:
```
[CoreDEX API] CORE (CORE-USDC): $0.12 (+2.5%)
```

Or fallback:
```
[Fallback Pricing] CORE: $0.12 (+2.5%)
```

### 3. Test Portfolio

1. Start CoreDEX API
2. Visit dashboard
3. Check portfolio values are pulling from live data

## Production Deployment

### Option 1: Docker Compose

```bash
# Edit mysql-init/init-databases.sql to set block height
./bin/start-docker-compose.sh
```

### Option 2: Kubernetes

Use provided Dockerfiles and Kubernetes deployment files.

### Option 3: Cloud Deployment

Deploy CoreDEX API on your cloud infrastructure and update the environment variable:

```env
NEXT_PUBLIC_COREDEX_API=https://your-coredx-api.com
```

## Troubleshooting

### Common Issues

1. **API Not Responding**
   - Check if CoreDEX API is running: `curl http://localhost:8080/health`
   - Verify MySQL connection
   - Check logs for errors

2. **No Price Data**
   - Ensure data-aggregator is running
   - Check if block height is current
   - Verify trading pairs exist

3. **CORS Errors**
   - CoreDEX API needs CORS headers for browser requests
   - Or use proxy in Next.js

### Debug Mode

Enable detailed logging:

```typescript
// In price-oracle.ts
console.log('CoreDEX API URL:', COREDEX_API);
console.log('Request URL:', `${COREDEX_API}/api/v1/ticker/${pair}`);
console.log('Response:', data);
```

## Performance

### Caching

- Prices cached for 30 seconds
- Reduces API calls
- Configurable TTL

### Rate Limiting

CoreDEX API can handle thousands of parallel requests, but:
- Use caching to reduce load
- Batch requests when possible
- Monitor API usage

## Security

### API Access

- CoreDEX API is read-only for pricing
- No API keys required for ticker data
- Transaction signing handled by wallet

### Network Security

- Use HTTPS in production
- Consider API gateway for rate limiting
- Monitor for unusual traffic patterns

## Future Enhancements

### WebSocket Integration

For real-time updates:

```javascript
const ws = new WebSocket('ws://localhost:8080/ws');
ws.send(JSON.stringify({
  type: 'subscribe',
  pairs: ['CORE-USDC', 'XRP-USDC']
}));
```

### Advanced Features

- Order book data
- Trade history
- Volume analysis
- Price alerts

## Support

### Documentation

- [CoreDEX API README](https://github.com/CoreumFoundation/CoreDEX-API)
- [Coreum DEX Documentation](https://docs.coreum.dev/docs/next/core-dex/)

### Community

- Coreum Discord
- GitHub Issues
- Developer Forums

## Summary

✅ **CoreDEX API Integration Complete**

- Real-time price fetching from Coreum DEX
- Fallback system for reliability
- Modular architecture for easy updates
- Production-ready with proper error handling

**Next Steps:**
1. Set up CoreDEX API locally
2. Update environment variables
3. Test with live data
4. Deploy to production
