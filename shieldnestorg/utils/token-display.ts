/**
 * Token display utilities
 * Helpers for formatting token symbols and names in the UI
 */

/**
 * Shorten a token symbol/denom for display
 * For contract addresses or long denoms, show first 3-4 characters
 */
export function formatTokenSymbol(symbol: string, denom: string): string {
  // If it's CORE, return as-is
  if (symbol === "CORE" || symbol === "COREUM") {
    return "CORE";
  }
  
  // If symbol looks like an address (starts with ibc/ or factory/ or is very long)
  if (denom.startsWith("ibc/") || denom.startsWith("factory/") || symbol.length > 10) {
    // Extract first 4 characters after prefix
    if (denom.startsWith("ibc/")) {
      return `IBC-${denom.substring(4, 8).toUpperCase()}`;
    }
    if (denom.startsWith("factory/")) {
      const parts = denom.split("/");
      const tokenName = parts[parts.length - 1];
      return tokenName.substring(0, 4).toUpperCase();
    }
    // For other long symbols, just use first 4 chars
    return symbol.substring(0, 4).toUpperCase();
  }
  
  return symbol.toUpperCase();
}

/**
 * Format token name for display
 * Remove redundant address info
 */
export function formatTokenName(name: string, denom: string): string {
  // If name is same as denom (duplicate), make it cleaner
  if (name === denom) {
    if (denom.startsWith("ibc/")) {
      return "IBC Token";
    }
    if (denom.startsWith("factory/")) {
      return "Factory Token";
    }
    return "Unknown Token";
  }
  
  // If name is very long (address-like), truncate
  if (name.length > 30) {
    return `${name.substring(0, 20)}...`;
  }
  
  return name;
}

/**
 * Sort tokens to put COREUM first
 */
export function sortTokensWithCoreFirst<T extends { symbol: string }>(tokens: T[]): T[] {
  return [...tokens].sort((a, b) => {
    // CORE always first
    if (a.symbol === "CORE") return -1;
    if (b.symbol === "CORE") return 1;
    
    // Then sort by symbol alphabetically
    return a.symbol.localeCompare(b.symbol);
  });
}

