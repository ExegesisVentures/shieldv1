// COMPREHENSIVE Data Cleanup Script - Run this in your browser console
// This will clear ALL cached data that's causing instant loading

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
console.log(`📊 Cleared:`);
console.log(`   - ${priceCacheKeys.length} price cache entries`);
console.log(`   - ${walletKeys.length} wallet data keys`);
console.log(`   - ${analyticsKeys.length} analytics keys`);
console.log(`   - ${visitorKeys.length} visitor tracking keys`);
console.log(`   - ${testKeys.length} test flag keys`);
console.log(`   - ${staticKeys.length} static fallback keys`);
console.log(`   - ${appKeys.length} additional app keys`);
console.log(`   - ${appSessionKeys.length} additional session keys`);

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
  console.log("🎉 ALL DATA CLEARED! Now refresh the page and try connecting your wallet again.");
} else {
  console.log("⚠️  Some data remains. You may need to manually clear these keys or reset your browser.");
}
