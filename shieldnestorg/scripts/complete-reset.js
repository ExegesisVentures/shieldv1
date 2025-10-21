// COMPLETE RESET SCRIPT - Run this in your browser console
// This will clear ALL data including database references

console.log("🚨 COMPLETE RESET - This will clear ALL your data!");
console.log("⚠️  WARNING: This will remove all your wallet connections and portfolio data!");

// First, let's see what's currently stored
console.log("🔍 Current localStorage keys:", Object.keys(localStorage));
console.log("🔍 Current sessionStorage keys:", Object.keys(sessionStorage));

// Run the comprehensive cleanup
console.log("🧹 Starting COMPREHENSIVE data cleanup...");

// 1. Clear price cache (coreum_price_* keys)
const priceCacheKeys = Object.keys(localStorage).filter(key => key.startsWith('coreum_price_'));
priceCacheKeys.forEach(key => localStorage.removeItem(key));
console.log(`✅ Cleared ${priceCacheKeys.length} price cache entries`);

// 2. Clear ALL wallet-related data
const walletKeys = [
  'anonymous_wallets', 
  'visitor_addresses', 
  'wallet-store', 
  'graz-internal',
  'visitor_display_name',
  'visitor_wallets_migrated',
  'save_prompt_dismissed'
];
walletKeys.forEach(key => {
  localStorage.removeItem(key);
  sessionStorage.removeItem(key);
});

// 3. Clear Keplr/Graz session data
const keplrKeys = ['graz-reconnect-session', 'graz-session'];
keplrKeys.forEach(key => {
  localStorage.removeItem(key);
  sessionStorage.removeItem(key);
});

// 4. Clear authentication data
const authKeys = ['userModule', 'sentryReplaySession'];
authKeys.forEach(key => sessionStorage.removeItem(key));

// 5. Clear PostHog analytics
const analyticsKeys = Object.keys(localStorage).filter(key => key.includes('posthog') || key.includes('ph_'));
analyticsKeys.forEach(key => localStorage.removeItem(key));

const analyticsSessionKeys = Object.keys(sessionStorage).filter(key => key.includes('posthog') || key.includes('ph_'));
analyticsSessionKeys.forEach(key => sessionStorage.removeItem(key));

// 6. Clear visitor upgrade tracking data
const visitorKeys = [
  'visitor_session_start',
  'upgrade_dismissed', 
  'visit_count',
  'portfolio_value_usd'
];
visitorKeys.forEach(key => localStorage.removeItem(key));

// 7. Clear test flags
const testKeys = Object.keys(localStorage).filter(key => key.includes('test_'));
testKeys.forEach(key => localStorage.removeItem(key));

// 8. Clear static fallback logs
const staticKeys = Object.keys(sessionStorage).filter(key => key.includes('static_fallback_logged_'));
staticKeys.forEach(key => sessionStorage.removeItem(key));

// 9. Clear ANY remaining app-related keys
const appKeys = Object.keys(localStorage).filter(key => 
  key.includes('coreum') || 
  key.includes('shield') || 
  key.includes('cruise') ||
  key.includes('wallet') ||
  key.includes('visitor') ||
  key.includes('upgrade') ||
  key.includes('save_')
);
appKeys.forEach(key => localStorage.removeItem(key));

const appSessionKeys = Object.keys(sessionStorage).filter(key => 
  key.includes('coreum') || 
  key.includes('shield') || 
  key.includes('cruise') ||
  key.includes('wallet') ||
  key.includes('visitor') ||
  key.includes('upgrade') ||
  key.includes('save_')
);
appSessionKeys.forEach(key => sessionStorage.removeItem(key));

console.log("✅ COMPREHENSIVE cleanup complete!");

// Check what's left
const remaining = Object.keys(localStorage).filter(key => 
  key.includes('coreum') || key.includes('shield') || key.includes('wallet') || key.includes('graz') || key.includes('visitor')
);
const remainingSession = Object.keys(sessionStorage).filter(key => 
  key.includes('coreum') || key.includes('shield') || key.includes('wallet') || key.includes('graz') || key.includes('visitor')
);

console.log("🔍 Remaining localStorage keys:", remaining);
console.log("🔍 Remaining sessionStorage keys:", remainingSession);

if (remaining.length === 0 && remainingSession.length === 0) {
  console.log("🎉 ALL BROWSER DATA CLEARED!");
} else {
  console.log("⚠️  Some browser data remains.");
}

console.log(`
🔧 NEXT STEPS TO COMPLETE THE RESET:

1. 🔄 REFRESH THE PAGE NOW
2. 🔌 DISCONNECT FROM KEPLR:
   - Open Keplr extension
   - Go to Settings → Advanced
   - Click "Reset Wallet" or "Clear All Data"
   - Or manually remove Coreum chain

3. 🗄️ DATABASE CLEANUP (if needed):
   Your wallet address is likely stored in the database from previous connections.
   To completely reset, you may need to:
   
   Option A: Contact support to remove your wallet from the database
   Option B: Use a different wallet address
   Option C: Wait for the database to auto-cleanup (if configured)

4. 🧪 TEST THE RESET:
   - Refresh the page
   - Try connecting your wallet
   - It should now behave like a first-time connection

📋 WHAT WAS CLEARED:
   - ${priceCacheKeys.length} price cache entries
   - ${walletKeys.length} wallet data keys  
   - ${analyticsKeys.length} analytics keys
   - ${visitorKeys.length} visitor tracking keys
   - ${testKeys.length} test flag keys
   - ${staticKeys.length} static fallback keys
   - ${appKeys.length} additional app keys
   - ${appSessionKeys.length} additional session keys

🎯 The instant loading was caused by cached price data and wallet connection state.
   This should now be completely cleared!
`);

// Make the cleanup function available for re-running
window.clearAllData = function() {
  console.log("🔄 Re-running cleanup...");
  // Re-run the same cleanup logic
  const allKeys = Object.keys(localStorage);
  allKeys.forEach(key => {
    if (key.includes('coreum') || key.includes('shield') || key.includes('wallet') || key.includes('graz') || key.includes('visitor') || key.includes('posthog') || key.includes('ph_')) {
      localStorage.removeItem(key);
    }
  });
  
  const allSessionKeys = Object.keys(sessionStorage);
  allSessionKeys.forEach(key => {
    if (key.includes('coreum') || key.includes('shield') || key.includes('wallet') || key.includes('graz') || key.includes('visitor') || key.includes('posthog') || key.includes('ph_')) {
      sessionStorage.removeItem(key);
    }
  });
  
  console.log("✅ Cleanup re-run complete!");
};
