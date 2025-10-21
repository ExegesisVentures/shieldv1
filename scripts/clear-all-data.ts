/**
 * Complete Data Cleanup Script
 * Clears all cached data from localStorage, sessionStorage, and provides database cleanup options
 * 
 * Run this script in your browser console to completely reset all application data
 */

export function clearAllApplicationData() {
  console.log("🧹 Starting complete data cleanup...");
  
  // 1. Clear price cache (coreum_price_* keys)
  console.log("1️⃣ Clearing price cache...");
  const priceCacheKeys = Object.keys(localStorage).filter(key => key.startsWith('coreum_price_'));
  priceCacheKeys.forEach(key => {
    localStorage.removeItem(key);
    console.log(`   Removed: ${key}`);
  });
  console.log(`   ✅ Cleared ${priceCacheKeys.length} price cache entries`);
  
  // 2. Clear anonymous wallets
  console.log("2️⃣ Clearing anonymous wallets...");
  const anonymousKeys = ['anonymous_wallets', 'visitor_addresses'];
  anonymousKeys.forEach(key => {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
      console.log(`   Removed: ${key}`);
    }
  });
  
  // 3. Clear wallet store
  console.log("3️⃣ Clearing wallet store...");
  const walletStoreKeys = ['wallet-store', 'graz-internal', 'graz-reconnect-session', 'graz-session'];
  walletStoreKeys.forEach(key => {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
      console.log(`   Removed localStorage: ${key}`);
    }
    if (sessionStorage.getItem(key)) {
      sessionStorage.removeItem(key);
      console.log(`   Removed sessionStorage: ${key}`);
    }
  });
  
  // 4. Clear authentication data
  console.log("4️⃣ Clearing authentication data...");
  const authKeys = ['userModule', 'sentryReplaySession'];
  authKeys.forEach(key => {
    if (sessionStorage.getItem(key)) {
      sessionStorage.removeItem(key);
      console.log(`   Removed: ${key}`);
    }
  });
  
  // 5. Clear PostHog data
  console.log("5️⃣ Clearing analytics data...");
  const analyticsKeys = Object.keys(localStorage).filter(key => key.includes('posthog') || key.includes('ph_'));
  analyticsKeys.forEach(key => {
    localStorage.removeItem(key);
    console.log(`   Removed: ${key}`);
  });
  
  const analyticsSessionKeys = Object.keys(sessionStorage).filter(key => key.includes('posthog') || key.includes('ph_'));
  analyticsSessionKeys.forEach(key => {
    sessionStorage.removeItem(key);
    console.log(`   Removed: ${key}`);
  });
  
  // 6. Clear any other application-specific keys
  console.log("6️⃣ Clearing other application data...");
  const appKeys = Object.keys(localStorage).filter(key => 
    key.includes('coreum') || 
    key.includes('shield') || 
    key.includes('cruise') ||
    key.includes('wallet')
  );
  appKeys.forEach(key => {
    localStorage.removeItem(key);
    console.log(`   Removed: ${key}`);
  });
  
  console.log("✅ Complete data cleanup finished!");
  console.log("🔄 Please refresh the page and try connecting your wallet again.");
  
  return {
    priceCacheCleared: priceCacheKeys.length,
    anonymousWalletsCleared: anonymousKeys.length,
    walletStoreCleared: walletStoreKeys.length,
    authDataCleared: authKeys.length,
    analyticsCleared: analyticsKeys.length + analyticsSessionKeys.length,
    otherAppDataCleared: appKeys.length
  };
}

/**
 * Check what data still exists after cleanup
 */
export function checkRemainingData() {
  console.log("🔍 Checking remaining data...");
  
  const remaining = {
    localStorage: Object.keys(localStorage).filter(key => 
      key.includes('coreum') || 
      key.includes('shield') || 
      key.includes('cruise') ||
      key.includes('wallet') ||
      key.includes('posthog') ||
      key.includes('ph_') ||
      key.includes('graz') ||
      key.includes('keplr')
    ),
    sessionStorage: Object.keys(sessionStorage).filter(key => 
      key.includes('coreum') || 
      key.includes('shield') || 
      key.includes('cruise') ||
      key.includes('wallet') ||
      key.includes('posthog') ||
      key.includes('ph_') ||
      key.includes('graz') ||
      key.includes('keplr')
    )
  };
  
  console.log("Remaining localStorage keys:", remaining.localStorage);
  console.log("Remaining sessionStorage keys:", remaining.sessionStorage);
  
  return remaining;
}

/**
 * Clear Keplr extension data (requires manual steps)
 */
export function getKeplrCleanupInstructions() {
  console.log(`
🔧 Keplr Extension Cleanup Instructions:

1. Open Keplr Extension
2. Go to Settings (gear icon)
3. Click "Advanced" tab
4. Click "Reset Wallet" or "Clear All Data"
5. Or manually disconnect from Coreum:
   - Go to "Manage Chain Visibility"
   - Find "Coreum" and click the X to remove
   - Re-add Coreum chain if needed

Alternative: Disable and re-enable the Keplr extension
  `);
}

// Make functions available globally for console use
if (typeof window !== 'undefined') {
  (window as any).clearAllApplicationData = clearAllApplicationData;
  (window as any).checkRemainingData = checkRemainingData;
  (window as any).getKeplrCleanupInstructions = getKeplrCleanupInstructions;
  
  console.log(`
🛠️  Data Cleanup Tools Available:

Run these commands in your browser console:

1. clearAllApplicationData() - Clear all app data
2. checkRemainingData() - Check what data remains
3. getKeplrCleanupInstructions() - Get Keplr cleanup steps

Then refresh the page and try connecting your wallet again.
  `);
}
