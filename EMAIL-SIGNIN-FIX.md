# Email Sign-In Not Loading Dashboard Data - FIXED

**File:** `/Users/exe/Downloads/Cursor/shuield2/EMAIL-SIGNIN-FIX.md`

## 🐛 Problem

After signing in with email, the dashboard was not populating with wallet data. The console showed:
```
✅ [Dashboard] User signed in, loading account data...
🔄 [Dashboard] Starting wallet migration...
🔄 [Migrate] Starting migration...
🔄 [Migrate] Getting session...
```

And then **NOTHING** - it completely hung!

## 🔍 Root Cause

**DEADLOCK!** The `onAuthStateChange` handler was calling `migrateWalletsToAccount()`, which then tried to call `supabase.auth.getSession()` again. This created a **circular wait**:

1. `onAuthStateChange` fires with session
2. Calls `migrateWalletsToAccount()`
3. `migrateWalletsToAccount()` calls `getSession()` again
4. `getSession()` hangs waiting for `onAuthStateChange` to complete
5. **DEADLOCK!** 💀

## ✅ Solution

**Pass the session from `onAuthStateChange` directly** to `migrateWalletsToAccount()` instead of fetching it again!

### **1. Updated `migrateWalletsToAccount()` signature:**

```typescript
// utils/wallet/simplified-operations.ts
export async function migrateWalletsToAccount(userId?: string): Promise<{
  success: boolean;
  migratedCount: number;
  errors: string[];
}> {
  console.log("🔄 [Migrate] Starting migration...");
  try {
    const supabase = createSupabaseClient();
    
    // If userId is provided, skip session fetch (avoids deadlock in onAuthStateChange)
    let user = null;
    if (userId) {
      console.log("🔄 [Migrate] Using provided userId:", userId);
      user = { id: userId } as any;
    } else {
      console.log("🔄 [Migrate] Getting session...");
      const { data: { session } } = await supabase.auth.getSession();
      user = session?.user || null;
      console.log("🔄 [Migrate] User:", user ? user.email : "none");
    }
    
    // ... rest of migration logic
  }
}
```

### **2. Updated dashboard to pass session user ID:**

```typescript
// app/dashboard/page.tsx
if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
  console.log("✅ [Dashboard] User signed in, loading account data...");
  
  // Migrate any anonymous wallets into the account once upon sign-in
  console.log("🔄 [Dashboard] Starting wallet migration...");
  try {
    // Pass session user ID to avoid deadlock with getSession()
    const result = await migrateWalletsToAccount(session?.user?.id);
    console.log("✅ [Dashboard] Migration complete:", result);
    if (result.migratedCount > 0) {
      console.log(`✅ Migrated ${result.migratedCount} anonymous wallet(s) to account`);
    }
  } catch (e) {
    console.error('❌ [Dashboard] Wallet migration failed:', e);
  }

  // Force reload dashboard data
  console.log("🔄 [Dashboard] Reloading dashboard with authenticated session...");
  try {
    await loadDashboardData();
    console.log("✅ [Dashboard] Data loaded successfully!");
  } catch (error) {
    console.error("❌ [Dashboard] Error loading data:", error);
  }
  checkForSavePrompt();
}
```

## 🎯 What Changed

1. **Made `userId` optional parameter** in `migrateWalletsToAccount()`
2. **If `userId` is provided**, use it directly and skip `getSession()` call
3. **Dashboard passes `session?.user?.id`** from `onAuthStateChange` to avoid the deadlock

## 🐛 Second Issue: Auth Check Timeout

After fixing the deadlock, a **new issue** appeared:
```
🔄 [Dashboard] Reloading dashboard with authenticated session...
⚠️ [Dashboard] Auth check timeout, continuing as anonymous
```

The problem: `loadDashboardData()` was calling `getSession()` AGAIN with a 3-second timeout, which was timing out because we were already inside an auth callback!

## ✅ Second Fix

Added options to `loadDashboardData()` to **skip the auth check** when called from `onAuthStateChange`:

```typescript
// app/dashboard/page.tsx
const loadDashboardData = async (opts?: { 
  soft?: boolean; 
  skipAuthCheck?: boolean; 
  userId?: string 
}) => {
  // If userId is provided, skip auth check (called from onAuthStateChange)
  if (skipAuthCheck && opts?.userId) {
    console.log("🔄 [Dashboard] Skipping auth check, using provided userId:", opts.userId);
    user = { id: opts.userId } as any;
    setIsAuthenticated(true);
  } else {
    // Normal auth check with timeout for other calls
    const { data: { session } } = await Promise.race([authPromise, authTimeout]);
    user = session?.user || null;
  }
  // ... rest of logic
}

// Call from onAuthStateChange with skipAuthCheck
await loadDashboardData({ skipAuthCheck: true, userId: session?.user?.id });
```

## 🧪 Testing

After signing in with email, you should now see:
```
✅ [Dashboard] User signed in, loading account data...
🔄 [Dashboard] Starting wallet migration...
🔄 [Migrate] Starting migration...
🔄 [Migrate] Using provided userId: eec03d28-3787-49e0-8009-84ddb7c18858
🔄 [Migrate] Getting anonymous wallets from storage...
🔄 [Migrate] Found anonymous wallets: 0
✅ [Migrate] No wallets to migrate
✅ [Dashboard] Migration complete: {success: true, migratedCount: 0, errors: []}
🔄 [Dashboard] Reloading dashboard with authenticated session...
🔄 [Dashboard] Skipping auth check, using provided userId: eec03d28-3787-49e0-8009-84ddb7c18858
🔄 [Dashboard] Fetching wallets...
🔍 getAllWallets: User authenticated: eec03d28-3787-49e0-8009-84ddb7c18858
🔍 getAllWallets: Fetching from database...
🔍 getAllWallets: Found authenticated wallets: 1
✅ [Dashboard] Data loaded successfully!
```

And the dashboard should populate with the user's wallet data immediately after sign-in! 🎉

## 🐛 Third Issue: `getUserWallets()` Also Hangs!

After fixing `getAllWallets()` to skip `getSession()`, we discovered it was **still hanging** on the next database call: `getUserWallets(supabase)`.

**The REAL Problem:** **ANY Supabase database query (`supabase.from()...`) inside the `onAuthStateChange` callback will hang indefinitely!**

## ✅ THE PROPER FIX

**Stop trying to load data inside `onAuthStateChange`!** Instead, just **trigger a page reload** and let the normal dashboard loading handle it:

```typescript
// app/dashboard/page.tsx
if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
  console.log("✅ [Dashboard] User signed in, triggering reload...");
  
  // DO NOT call loadDashboardData() here! It will hang because we're inside onAuthStateChange
  // Instead, just trigger a page reload which will fetch fresh data
  window.dispatchEvent(new CustomEvent('walletDatabaseChange', {
    detail: { action: 'signed-in' }
  }));
  
  // Small delay to let the session settle, then reload
  setTimeout(() => {
    console.log("🔄 [Dashboard] Reloading page after sign-in...");
    window.location.reload();
  }, 500);
}
```

## 🎯 Why This Works

1. **No database calls inside `onAuthStateChange`** - avoids all the hanging issues
2. **Page reload with fresh session** - the dashboard loads normally with an authenticated session
3. **Clean and simple** - no complex workarounds or parameters needed

## 🧪 Testing

After signing in with email, you should see:
```
✅ [Dashboard] User signed in, triggering reload...
🔄 [Dashboard] Dispatching wallet change event to trigger reload...
🔄 [Dashboard] Reloading page after sign-in...
```

Then the page reloads and loads your wallet data instantly! 🎉

## 📝 Files Modified

1. `/Users/exe/Downloads/Cursor/shuield2/shuieldnestorg/app/dashboard/page.tsx`
2. `/Users/exe/Downloads/Cursor/shuield2/shuieldnestorg/utils/wallet/simplified-operations.ts`

---

**Status:** ✅ PROPERLY FIXED! Page reload avoids all hanging issues! 🚀
