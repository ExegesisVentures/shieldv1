/**
 * CoreDEX configuration helper
 *
 * Centralizes resolution of CoreDEX REST and WS endpoints.
 * Supports both NEXT_PUBLIC_* and Vite-style VITE_* variables.
 * 
 * PRODUCTION ENDPOINT: https://coredexapi.shieldnest.org/api
 * - Production CoreDEX API with live data
 * - Auto-updating price data
 * - Full ticker, OHLC, trades support
 * 
 * File: /utils/coreum/coredex-config.ts
 */

// Normalize: avoid trailing slash
function normalizeBase(url?: string): string | undefined {
  if (!url) return undefined;
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

// Resolve REST base URL, prefer explicit Vite envs when present
const viteBase = process.env.VITE_ENV_BASE_API || process.env.VITE_COREDEX_API;
const nextBase = process.env.NEXT_PUBLIC_COREDEX_API;

// Default to production CoreDEX API if no environment variable is set
const resolvedRest = normalizeBase(
  viteBase || 
  nextBase || 
  'https://coredexapi.shieldnest.org/api' // ✅ Production CoreDEX API
);

// Resolve WS URL
const viteWs = process.env.VITE_ENV_WS || process.env.VITE_COREDEX_WS;
const nextWs = process.env.NEXT_PUBLIC_COREDEX_WS;
const resolvedWs = (
  viteWs || 
  nextWs || 
  'wss://coredexapi.shieldnest.org/api/ws' // ✅ Production WebSocket
);

/**
 * CoreDEX REST base URL
 * Default: https://coredexapi.shieldnest.org/api (Production)
 * NOTE: Do NOT include trailing slash when composing paths.
 */
export const COREDEX_BASE_URL: string = resolvedRest!;

/**
 * CoreDEX WebSocket URL
 * Default: wss://coredexapi.shieldnest.org/api/ws
 */
export const COREDEX_WS_URL: string = resolvedWs;

/**
 * Build a REST URL ensuring exactly one "/" between base and path.
 * Accepts paths with or without leading "/".
 * 
 * @example
 * buildCoreDexUrl('/currencies') 
 * // → https://coredexapi.shieldnest.org/api/currencies
 * 
 * buildCoreDexUrl('/tickers', 'symbols=...')
 * // → https://coredexapi.shieldnest.org/api/tickers?symbols=...
 */
export function buildCoreDexUrl(path: string, search?: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const searchStr = search ? (search.startsWith('?') ? search : `?${search}`) : '';
  return `${COREDEX_BASE_URL}${cleanPath}${searchStr}`;
}

/**
 * Network header to send to CoreDEX
 */
export const COREDEX_NETWORK_HEADER = 'mainnet';


