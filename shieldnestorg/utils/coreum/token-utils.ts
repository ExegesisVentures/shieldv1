/**
 * Token utility functions
 * Maps token symbols to denoms and provides token metadata
 */

// Common token denoms on Coreum
export const TOKEN_DENOMS: Record<string, string> = {
  'CORE': 'ucore',
  'USDC': 'ibc/F082B65C88E4B6D5EF1DB243CDA1D331D002759E938A0F5CD3FFDC5D53B3E349',
  'ATOM': 'ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2',
  'OSMO': 'ibc/47BD209179859CDE4A2806763D7189B6E6FE13A17880FE2B42DE1E6C1E329E23',
  'COZY': 'ucozy-core19w7yasdscfu09un47h8vf5rfjshwug2kgrplkwtfdrrgjzrld82sc7f494',
  'KONG': 'ukong-core1u4zkwwqlnzepghtr45zyfx5qwm9mehfrgj4wae',
  'MART': 'umart-core1e5zxd9z4mz0t60he3mdw3fc499nz9jgzk9xwfvmkf440gtmsrkaqwsh75a',
  'SAURON': 'usauron-core1q7w4fkhs55fg5tzgks0f6kp58jkj7u4u34evtl3lkdxqkhm3nv4qhh5tl0',
  'SARA': 'usara-core1r9gc0rnxnzpq33u82f44aufgdwvyxv4wyepyck98m9v2pxua6naqr8h03z',
  'SOLO': 'xrpl11278ecf9e-core1zhs909jp9yktml6qqx9f0ptcq2xnhhj99cja03j3lfcsp2pgm86studdrz',
  'ROLL': 'xrpl11f82115a5-core1zhs909jp9yktml6qqx9f0ptcq2xnhhj99cja03j3lfcsp2pgm86studdrz',
  'XRP': 'drop-core1zhs909jp9yktml6qqx9f0ptcq2xnhhj99cja03j3lfcsp2pgm86studdrz',
};

/**
 * Get token denom by symbol
 * @param symbol Token symbol (e.g., "CORE", "USDC")
 * @returns Token denom or null if not found
 */
export function getTokenDenomBySymbol(symbol: string): string | null {
  const upperSymbol = symbol.toUpperCase();
  return TOKEN_DENOMS[upperSymbol] || null;
}

/**
 * Get token symbol by denom
 * @param denom Token denom
 * @returns Token symbol or the denom if not found
 */
export function getTokenSymbolByDenom(denom: string): string {
  // Find symbol by denom
  for (const [symbol, tokenDenom] of Object.entries(TOKEN_DENOMS)) {
    if (tokenDenom === denom) {
      return symbol;
    }
  }
  
  // Fallback: Extract from denom
  if (denom === 'ucore') return 'CORE';
  if (denom.startsWith('ibc/')) return 'IBC';
  if (denom.startsWith('drop-')) return 'XRP';
  if (denom.startsWith('xrpl')) return 'XRPL';
  if (denom.includes('-core1')) {
    const parts = denom.split('-');
    return parts[0].substring(1).toUpperCase();
  }
  
  return denom.substring(0, 10).toUpperCase();
}

/**
 * Check if a token has a known denom
 * @param symbol Token symbol
 * @returns true if token denom is known
 */
export function isKnownToken(symbol: string): boolean {
  return getTokenDenomBySymbol(symbol) !== null;
}

