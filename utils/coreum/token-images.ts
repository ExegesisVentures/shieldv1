/**
 * Token Image Utilities
 * Handles token logos with proper fallback handling
 * All images are served from local /public/tokens/ directory
 */

import { getTokenMetadata } from './token-registry';

export interface LpPairInfo {
  token0Symbol: string;
  token1Symbol: string;
  token0Logo: string;
  token1Logo: string;
}

/**
 * Detect if dark mode is active
 */
function isDarkMode(): boolean {
  if (typeof window === 'undefined') return false;
  return document.documentElement.classList.contains('dark');
}

/**
 * Get token logo URL with fallback and theme support
 * Always returns a valid path (defaults to default.svg if not found)
 */
export function getTokenLogoUrl(symbol: string, logoPath?: string): string {
  // If logo path is provided, use it
  if (logoPath) {
    return logoPath;
  }
  
  const darkMode = isDarkMode();
  
  // Map common symbols to their logo files (from /public/tokens/)
  const logoMap: Record<string, string> = {
    'CORE': '/tokens/core.svg',
    'COREUM': '/tokens/core.svg',
    'XRP': '/tokens/xrp.png',
    'UXRP': '/tokens/uxrp.png',
    'SOLO': darkMode ? '/tokens/solo_Dark.svg' : '/tokens/solo_Light.svg',
    'SARA': '/tokens/pulsara.svg',
    'ATOM': '/tokens/atom.png',
    'UATOM': '/tokens/uatom.png',
    'OSMO': '/tokens/osmo.png',
    'UOSMO': '/tokens/uosmo.png',
    'COZY': '/tokens/cozy.svg',
    'KONG': '/tokens/kong.svg',
    'MART': '/tokens/mart.svg',
    'CAT': '/tokens/cat.svg',
    'ROLL': '/tokens/roll.png',
    'SMART': '/tokens/smart.svg',
    'LP': '/tokens/lp.svg',
    'ULP': '/tokens/lp.svg',
    'AWKTUAH': '/tokens/default.svg',
    'AWKT': '/tokens/default.svg',
    'SHLD': darkMode ? '/tokens/shld_dark.svg' : '/tokens/shld_light.svg',
  };
  
  // Check if we have a logo for this symbol
  if (logoMap[symbol]) {
    return logoMap[symbol];
  }
  
  // Check for IBC tokens
  if (symbol.startsWith('IBC-')) {
    return '/tokens/ibc.svg';
  }
  
  // Default fallback
  return '/tokens/default.svg';
}

/**
 * Preload token images for better UX
 * Call this when dashboard loads to cache images
 */
export function preloadTokenImages(symbols: string[]): void {
  if (typeof window === 'undefined') return;
  
  symbols.forEach(symbol => {
    const logoUrl = getTokenLogoUrl(symbol);
    const img = new Image();
    img.src = logoUrl;
  });
}

/**
 * Check if a token is an LP token and get its pair information
 * Returns null if not an LP token or if pair data is not available
 */
export function getLpPairInfo(denom: string): LpPairInfo | null {
  const metadata = getTokenMetadata(denom);
  
  if (!metadata || !metadata.isLpToken || !metadata.lpPair) {
    return null;
  }
  
  return metadata.lpPair;
}

/**
 * Check if a token denom is an LP token
 */
export function isLpToken(denom: string): boolean {
  const metadata = getTokenMetadata(denom);
  return metadata?.isLpToken === true;
}

/**
 * Get all available token images
 * Useful for debugging and checking which logos we have
 */
export function getAvailableTokenLogos(): string[] {
  return [
    'core.svg',
    'xrp.png',
    'solo_Dark.svg',
    'solo_Light.svg',
    'pulsara.svg',
    'atom.png',
    'osmo.png',
    'cozy.svg',
    'kong.svg',
    'mart.svg',
    'cat.svg',
    'roll.png',
    'smart.svg',
    'lp.svg',
    'ibc.svg',
    'shld_dark.svg',
    'shld_light.svg',
    'default.svg',
  ];
}
