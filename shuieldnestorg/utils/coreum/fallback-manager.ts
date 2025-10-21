/**
 * DYNAMIC STATIC FALLBACK MANAGER
 * Utility functions to monitor and manage the dynamic static fallback system
 * 
 * This system automatically saves the last valid price as the new static fallback
 * ensuring that fallback prices are always recent and accurate.
 */

import { clearStaticFallbacks } from './price-oracle';

/**
 * Get all saved static fallbacks with metadata
 */
export function getAllStaticFallbacks(): Record<string, {
  price: number;
  change24h: number;
  timestamp: number;
  source: string;
  age: string;
}> {
  if (typeof window === 'undefined') return {};
  
  try {
    const stored = localStorage.getItem('shieldnest_static_fallback_prices');
    const fallbacks = stored ? JSON.parse(stored) : {};
    
    // Add age information
    const fallbacksWithAge = Object.entries(fallbacks).reduce((acc, [symbol, data]: [string, any]) => {
      const ageMs = Date.now() - data.timestamp;
      const ageHours = Math.floor(ageMs / (1000 * 60 * 60));
      const ageDays = Math.floor(ageHours / 24);
      
      let ageString = '';
      if (ageDays > 0) {
        ageString = `${ageDays}d ${ageHours % 24}h ago`;
      } else if (ageHours > 0) {
        ageString = `${ageHours}h ago`;
      } else {
        const ageMinutes = Math.floor(ageMs / (1000 * 60));
        ageString = `${ageMinutes}m ago`;
      }
      
      acc[symbol] = {
        ...data,
        age: ageString
      };
      
      return acc;
    }, {} as any);
    
    return fallbacksWithAge;
  } catch (error) {
    console.warn('⚠️ [Fallback Manager] Failed to get fallbacks:', error);
    return {};
  }
}

/**
 * Get statistics about saved static fallbacks
 */
export function getFallbackStats(): {
  totalTokens: number;
  recentTokens: number; // Updated in last 24 hours
  staleTokens: number; // Not updated in last 7 days
  averageAge: string;
} {
  const fallbacks = getAllStaticFallbacks();
  const tokens = Object.values(fallbacks);
  
  if (tokens.length === 0) {
    return {
      totalTokens: 0,
      recentTokens: 0,
      staleTokens: 0,
      averageAge: 'N/A'
    };
  }
  
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  
  const recentTokens = tokens.filter(t => (now - t.timestamp) < oneDayMs).length;
  const staleTokens = tokens.filter(t => (now - t.timestamp) > sevenDaysMs).length;
  
  const averageAgeMs = tokens.reduce((sum, t) => sum + (now - t.timestamp), 0) / tokens.length;
  const averageAgeHours = Math.floor(averageAgeMs / (1000 * 60 * 60));
  const averageAgeDays = Math.floor(averageAgeHours / 24);
  
  let averageAge = '';
  if (averageAgeDays > 0) {
    averageAge = `${averageAgeDays}d ${averageAgeHours % 24}h`;
  } else {
    averageAge = `${averageAgeHours}h`;
  }
  
  return {
    totalTokens: tokens.length,
    recentTokens,
    staleTokens,
    averageAge
  };
}

/**
 * Clear all static fallbacks (useful for debugging)
 */
export function clearAllFallbacks(): void {
  clearStaticFallbacks();
  console.log('🧹 [Fallback Manager] All static fallbacks cleared');
}

/**
 * Export fallbacks to JSON (for backup/debugging)
 */
export function exportFallbacks(): string {
  const fallbacks = getAllStaticFallbacks();
  return JSON.stringify(fallbacks, null, 2);
}

/**
 * Import fallbacks from JSON (for restore/debugging)
 */
export function importFallbacks(jsonData: string): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const fallbacks = JSON.parse(jsonData);
    localStorage.setItem('shieldnest_static_fallback_prices', JSON.stringify(fallbacks));
    console.log('📥 [Fallback Manager] Fallbacks imported successfully');
    return true;
  } catch (error) {
    console.error('❌ [Fallback Manager] Import failed:', error);
    return false;
  }
}

/**
 * Debug function to log all fallbacks to console
 */
export function debugFallbacks(): void {
  const fallbacks = getAllStaticFallbacks();
  const stats = getFallbackStats();
  
  console.group('🔍 [Fallback Manager] Debug Info');
  console.log('📊 Stats:', stats);
  console.log('💾 Fallbacks:', fallbacks);
  console.groupEnd();
}

// Make functions available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).ShieldNestFallbacks = {
    getAll: getAllStaticFallbacks,
    getStats: getFallbackStats,
    clear: clearAllFallbacks,
    export: exportFallbacks,
    import: importFallbacks,
    debug: debugFallbacks,
    // Test function to verify price is correct
    testCorePrice: () => {
      const { getCachedPrice } = require('./price-cache');
      const { getStaticFallbackPrice } = require('./price-oracle');
      
      const cached = getCachedPrice('CORE', true);
      const fallback = getStaticFallbackPrice('CORE');
      
      console.group('🧪 [Price Test] CORE Token');
      console.log('💾 Cached Price:', cached ? `$${cached.price.toFixed(6)} (${cached.change24h >= 0 ? '+' : ''}${cached.change24h.toFixed(2)}%)` : 'None');
      console.log('📌 Static Fallback:', `$${fallback.price.toFixed(6)} (${fallback.change24h >= 0 ? '+' : ''}${fallback.change24h.toFixed(2)}%)`);
      console.log('✅ Expected: Should show $0.090931 (real price) not $0.15 (hardcoded)');
      console.groupEnd();
      
      return { cached, fallback };
    }
  };
  
  console.log('🛠️ [Fallback Manager] Debug functions available at window.ShieldNestFallbacks');
  console.log('🧪 [Test] Run window.ShieldNestFallbacks.testCorePrice() to verify CORE price is correct');
}
