/**
 * Coreum Token Registry
 * Comprehensive metadata for all supported tokens on Coreum
 */

export interface TokenMetadata {
  symbol: string;
  name: string;
  denom: string;
  decimals: number;
  logo?: string;
  description?: string;
  contractAddress?: string; // Contract address for bridged tokens
  isLpToken?: boolean; // Whether this is a liquidity pool token
  lpPair?: {
    token0Symbol: string;
    token1Symbol: string;
    token0Logo: string;
    token1Logo: string;
  }; // For LP tokens: the constituent token pair
}

/**
 * Complete token registry for Coreum Mainnet
 * 
 * IMPORTANT DECIMAL NOTES:
 * - XRP uses 6 decimals (drops: 1 XRP = 1,000,000 drops)
 * - SOLO uses 15 decimals (1 SOLO = 1,000,000,000,000,000 base units)
 * - Most Coreum tokens use 6 decimals
 */
export const TOKEN_REGISTRY: Record<string, TokenMetadata> = {
  // Native COREUM
  "ucore": {
    symbol: "CORE",
    name: "Coreum",
    denom: "ucore",
    decimals: 6,
    logo: "/tokens/core.svg",
    description: "Native token of the Coreum blockchain",
  },

  // XRP (Wrapped) - Uses drops (6 decimals)
  // On Coreum, XRP is represented in drops where 1 XRP = 1,000,000 drops
  "drop-core1zhs909jp9yktml6qqx9f0ptcq2xnhhj99cja03j3lfcsp2pgm86studdrz": {
    symbol: "XRP",
    name: "Wrapped XRP",
    denom: "drop-core1zhs909jp9yktml6qqx9f0ptcq2xnhhj99cja03j3lfcsp2pgm86studdrz",
    decimals: 6, // XRP drops: 1 XRP = 1,000,000 drops
    logo: "/tokens/xrp.png",
    description: "Wrapped XRP on Coreum (measured in drops)",
    contractAddress: "core1zhs909jp9yktml6qqx9f0ptcq2xnhhj99cja03j3lfcsp2pgm86studdrz",
  },

  // Alternate XRP denom (if exists)
  "xrp-core1l44nkr00gudzx9y9kpq0d2k68zn7q6ya4f4v6y7pq8n5tj0vyxfqvh4agl": {
    symbol: "XRP",
    name: "Wrapped XRP",
    denom: "xrp-core1l44nkr00gudzx9y9kpq0d2k68zn7q6ya4f4v6y7pq8n5tj0vyxfqvh4agl",
    decimals: 6,
    logo: "/tokens/xrp.png",
    description: "Wrapped XRP on Coreum",
    contractAddress: "core1l44nkr00gudzx9y9kpq0d2k68zn7q6ya4f4v6y7pq8n5tj0vyxfqvh4agl",
  },

  // SOLO Token - XRPL token with 15 decimals
  // Base unit is extremely small, display amount will be much larger
  "xrpl11278ecf9e-core1zhs909jp9yktml6qqx9f0ptcq2xnhhj99cja03j3lfcsp2pgm86studdrz": {
    symbol: "SOLO",
    name: "Sologenic",
    denom: "xrpl11278ecf9e-core1zhs909jp9yktml6qqx9f0ptcq2xnhhj99cja03j3lfcsp2pgm86studdrz",
    decimals: 15, // SOLO uses 15 decimals (1575000000000000000 = 1575 SOLO)
    logo: "/tokens/solo_Dark.svg", // Theme-aware: switches to solo_Light.svg in light mode
    description: "Sologenic SOLO token from XRPL",
    contractAddress: "core1zhs909jp9yktml6qqx9f0ptcq2xnhhj99cja03j3lfcsp2pgm86studdrz",
  },

  // ROLL Token (Bridged from XRPL) - 15 decimals like SOLO
  "xrpl11f82115a5-core1zhs909jp9yktml6qqx9f0ptcq2xnhhj99cja03j3lfcsp2pgm86studdrz": {
    symbol: "ROLL",
    name: "ROLL",
    denom: "xrpl11f82115a5-core1zhs909jp9yktml6qqx9f0ptcq2xnhhj99cja03j3lfcsp2pgm86studdrz",
    decimals: 15, // ROLL uses 15 decimals (bridged from XRP Ledger)
    logo: "/tokens/roll.svg",
    description: "ROLL token bridged from XRP Ledger",
    contractAddress: "core1zhs909jp9yktml6qqx9f0ptcq2xnhhj99cja03j3lfcsp2pgm86studdrz",
  },

  // AWKT Token
  "awkt-core1p54uvh2faq4j7mmlcp2pufz5jh03e5xjm7tm5uw5mkyhljfsmays0a5l9z": {
    symbol: "AWKT",
    name: "Awoken Token",
    denom: "awkt-core1p54uvh2faq4j7mmlcp2pufz5jh03e5xjm7tm5uw5mkyhljfsmays0a5l9z",
    decimals: 6,
    logo: "/tokens/default.svg", // Using default until AWKT logo is added
    description: "Awoken ecosystem token",
  },

  // COZY Token
  "cozy-core1wpnq5fxy9fqf6h2dqmr3sm8y2wjgf7y6yehzehw2mrc33qzp9cjs0t4a5v": {
    symbol: "COZY",
    name: "Cozy Token",
    denom: "cozy-core1wpnq5fxy9fqf6h2dqmr3sm8y2wjgf7y6yehzehw2mrc33qzp9cjs0t4a5v",
    decimals: 6,
    logo: "/tokens/cozy.svg",
    description: "Cozy DeFi ecosystem token",
  },

  // KONG Token
  "kong-core193djf6hx35gwchrhq5vmxl0mwssmrvr3ytcgk9d59w2sd7kkrpfqfzxmmu": {
    symbol: "KONG",
    name: "Kong Token",
    denom: "kong-core193djf6hx35gwchrhq5vmxl0mwssmrvr3ytcgk9d59w2sd7kkrpfqfzxmmu",
    decimals: 6,
    logo: "/tokens/kong.svg",
    description: "Kong gaming and metaverse token",
  },

  // MART Token
  "mart-core1x47xjfj4rzl43pphzwj54nlx5ryzrcj87k2z90u8cz8z33s7mckqtjms32": {
    symbol: "MART",
    name: "Market Token",
    denom: "mart-core1x47xjfj4rzl43pphzwj54nlx5ryzrcj87k2z90u8cz8z33s7mckqtjms32",
    decimals: 6,
    logo: "/tokens/mart.svg",
    description: "Marketplace and trading token",
  },

  // CAT Token
  "cat-core1vz7v0t8f5lzfan0x9nhqpwl35ypqg3vht5wk7uwv34kfkqzae03qy7dkj9": {
    symbol: "CAT",
    name: "Cat Token",
    denom: "cat-core1vz7v0t8f5lzfan0x9nhqpwl35ypqg3vht5wk7uwv34kfkqzae03qy7dkj9",
    decimals: 6,
    logo: "/tokens/cat.svg",
    description: "Cat meme token",
  },

  // ROLL Token
  "roll-core1h8s8c39fvk3qx88h3sfp4r2clvkg0xvr9z2s0p0q5t8g90k5f5rqqx4f3v": {
    symbol: "ROLL",
    name: "Roll Token",
    denom: "roll-core1h8s8c39fvk3qx88h3sfp4r2clvkg0xvr9z2s0p0q5t8g90k5f5rqqx4f3v",
    decimals: 6,
    logo: "/tokens/roll.svg",
    description: "Roll token",
  },

  // SMART Token
  "smart-core1xqz7hks9nmw4vt0r7c5j5h6tqgf7l6ym0xz8r9s0t1u2v3w4x5y6z7a8b9": {
    symbol: "SMART",
    name: "Smart Token",
    denom: "smart-core1xqz7hks9nmw4vt0r7c5j5h6tqgf7l6ym0xz8r9s0t1u2v3w4x5y6z7a8b9",
    decimals: 6,
    logo: "/tokens/smart.svg",
    description: "Smart contract token",
  },

  // SARA Token (Pulsara DEX native token)
  "usara-core1r9gc0rnxnzpq33u82f44aufgdwvyxv4wyepyck98m9v2pxua6naqr8h03z": {
    symbol: "SARA",
    name: "Pulsara Token",
    denom: "usara-core1r9gc0rnxnzpq33u82f44aufgdwvyxv4wyepyck98m9v2pxua6naqr8h03z",
    decimals: 6,
    logo: "/tokens/pulsara.svg",
    description: "Pulsara DEX native token",
    contractAddress: "core1r9gc0rnxnzpq33u82f44aufgdwvyxv4wyepyck98m9v2pxua6naqr8h03z",
  },

  // ULP Token (Universal Liquidity Pool / DEX LP Token)
  "ulp-core1qhfqvv5hsnmxv3yt2j3wapsgzvr4ex4vlvvxuqe": {
    symbol: "ULP",
    name: "Universal LP Token",
    denom: "ulp-core1qhfqvv5hsnmxv3yt2j3wapsgzvr4ex4vlvvxuqe",
    decimals: 6,
    logo: "/tokens/lp.svg",
    description: "Universal Liquidity Pool token for Coreum DEX",
  },

  // ROLL/COREUM LP Token
  "ulp-core12mpplye8qzuqhe8fa6lecnu5r8jsymm0f9257tlehvs8cpcn8v6qv5zf0j": {
    symbol: "ROLL-CORE LP",
    name: "ROLL/COREUM LP Token",
    denom: "ulp-core12mpplye8qzuqhe8fa6lecnu5r8jsymm0f9257tlehvs8cpcn8v6qv5zf0j",
    decimals: 6,
    logo: "/tokens/lp.svg", // Fallback, will use dual logos in UI
    description: "Liquidity Pool token for ROLL/COREUM pair",
    isLpToken: true,
    lpPair: {
      token0Symbol: "ROLL",
      token1Symbol: "CORE",
      token0Logo: "/tokens/roll.png",
      token1Logo: "/tokens/core.svg",
    },
  },

  // IBC Tokens (Cosmos ecosystem)
  // ATOM
  "ibc/C4CFF46FD6DE35CA4CF4CE031E643C8FDC9BA4B99AE598E9B0ED98FE3A2319F9": {
    symbol: "ATOM",
    name: "Cosmos Hub",
    denom: "ibc/C4CFF46FD6DE35CA4CF4CE031E643C8FDC9BA4B99AE598E9B0ED98FE3A2319F9",
    decimals: 6,
    logo: "/tokens/atom.png",
    description: "Cosmos Hub native token via IBC",
  },

  // OSMO
  "ibc/47BD209179859CDE4A2806763D7189B6E6FE13A17880FE2B42DE1E6C1E329E23": {
    symbol: "OSMO",
    name: "Osmosis",
    denom: "ibc/47BD209179859CDE4A2806763D7189B6E6FE13A17880FE2B42DE1E6C1E329E23",
    decimals: 6,
    logo: "/tokens/osmo.png",
    description: "Osmosis native token via IBC",
  },
};

/**
 * Get token metadata by denom
 */
export function getTokenMetadata(denom: string): TokenMetadata | null {
  const result = TOKEN_REGISTRY[denom] || null;
  if (result) {
    console.log(`Found metadata for ${denom}:`, {
      symbol: result.symbol,
      contractAddress: result.contractAddress
    });
  } else {
    console.log(`No metadata found for denom: ${denom}`);
  }
  return result;
}

/**
 * Get token metadata by symbol
 */
export function getTokenMetadataBySymbol(symbol: string): TokenMetadata | null {
  const allTokens = Object.values(TOKEN_REGISTRY);
  return allTokens.find(token => token.symbol === symbol) || null;
}

/**
 * Get all registered tokens
 */
export function getAllTokens(): TokenMetadata[] {
  return Object.values(TOKEN_REGISTRY);
}

/**
 * Search tokens by symbol or name
 */
export function searchTokens(query: string): TokenMetadata[] {
  const lowerQuery = query.toLowerCase();
  return getAllTokens().filter(
    token =>
      token.symbol.toLowerCase().includes(lowerQuery) ||
      token.name.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Check if a token is registered
 */
export function isRegisteredToken(denom: string): boolean {
  return denom in TOKEN_REGISTRY;
}