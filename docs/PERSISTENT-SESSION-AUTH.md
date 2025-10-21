# Persistent Session Authentication

## Overview

This document explains how our **Smart Session Management** system solves critical UX issues with wallet authentication, particularly for hardware wallet users.

## Problems Solved

### 1. **Hardware Wallet Users Were Locked Out**
**Before**: If a user had a Ledger connected to Keplr at home, they couldn't sign in from mobile or another computer without the physical device.

**After**: Users sign in once with their hardware wallet, then can reconnect wallets anytime without needing the device again.

### 2. **Repetitive Authentication**
**Before**: Every visit required signing a message, even if you just signed in 5 minutes ago.

**After**: Like traditional web apps, you stay logged in via session cookies. No signature required on return visits.

### 3. **Guest Mode Limitations**
**Before**: "Continue as Guest" only showed that ONE wallet's balance.

**After**: Authenticated users can connect multiple wallets without signing each one individually.

---

## How It Works

### The Smart 2-Step Authentication Check

When a user clicks "Connect Wallet", we now perform **TWO checks** instead of one:

#### **STEP 1: Check for Existing Session**
```
Is user already logged in? (Check session cookie)
  ├─ YES → Is this wallet in their account?
  │   ├─ YES → ✅ Auto-reconnect (no signature needed!)
  │   └─ NO → Add to their account (no signature needed!)
  └─ NO → Go to STEP 2
```

#### **STEP 2: Check Wallet Registration**
```
Is wallet registered to ANY account?
  ├─ YES → Show "Account Found" modal
  │   ├─ User clicks "Sign In" → Request signature → Authenticate
  │   └─ User clicks "Guest" → Add to localStorage only
  └─ NO → Add to localStorage as guest wallet
```

---

## Real-World User Flows

### Scenario 1: **Hardware Wallet User - First Time**
1. User has Ledger + Keplr at home computer
2. Connects wallet → Wallet registered → Modal shows "Account Found"
3. Clicks "Sign In" → Ledger required for signature
4. ✅ **Authenticated with session cookie**
5. Session persists (default: 7 days)

### Scenario 2: **Hardware Wallet User - Return Visit (Mobile)**
1. User is at coffee shop on laptop (no Ledger)
2. Session cookie still valid → Already authenticated
3. Connects Keplr wallet
4. ✅ **Auto-reconnects WITHOUT signature!**
5. Full portfolio loads instantly

### Scenario 3: **Regular User - Daily Use**
1. User signed in yesterday
2. Returns to site today
3. Session still valid → Already authenticated  
4. Connects wallet
5. ✅ **No signature popup! Instant reconnect**

### Scenario 4: **New User - First Time**
1. Never used the app before
2. Connects wallet → Not registered
3. ✅ **Guest mode activated immediately**
4. Later decides to create account → Sign up with email
5. Wallet automatically migrated to account

### Scenario 5: **Multi-Wallet User**
1. Already signed in with Wallet A
2. Wants to add Wallet B from Ledger
3. Connects Wallet B
4. ✅ **Added to account WITHOUT signature!**
5. No need to pull out Ledger for each wallet

---

## Technical Implementation

### File: `hooks/useSimplifiedWalletConnect.ts`

**Key Changes:**

1. **Import Supabase Client**
   ```typescript
   import { createSupabaseClient } from "@/utils/supabase/client";
   ```

2. **Session Check in `connectKeplr()`** (Lines 278-339)
   ```typescript
   // STEP 1: Check for existing session
   const supabase = createSupabaseClient();
   const { data: { user: currentUser } } = await supabase.auth.getUser();
   
   if (currentUser) {
     // User is authenticated!
     // Check if wallet belongs to this user
     // If yes → auto-reconnect
     // If no → auto-add to their account
     return { success: true, wallet: { address, label: "Keplr" } };
   }
   
   // STEP 2: No session → check wallet registration
   // (existing flow)
   ```

3. **No Signature Required for Authenticated Users**
   - If user has valid session, wallet connects instantly
   - New wallets added to account without signature
   - Hardware wallet only needed for initial sign-in

---

## Session Management

### Session Duration
- Default: **7 days** (Supabase default)
- Configurable in Supabase dashboard
- Recommendation: 7-30 days for good UX

### Session Security
- Stored as HTTP-only cookies (secure)
- Auto-refreshed by Supabase middleware
- Invalidated on explicit sign-out

### When Signature IS Required
1. **First time sign-in** (wallet not in account yet)
2. **Session expired** (after 7 days by default)
3. **User explicitly signed out**
4. **Different browser/device** (if session not synced)

### When Signature IS NOT Required
1. ✅ **Return visits** (session still valid)
2. ✅ **Adding new wallets** (already authenticated)
3. ✅ **Reconnecting wallets** (already in account)
4. ✅ **Multiple devices** (if session synced via Supabase)

---

## Benefits Summary

| Aspect | Before | After |
|--------|--------|-------|
| **Hardware Wallet** | Required every time | Required once only |
| **Return Visits** | Sign every time | Auto-login |
| **Multiple Wallets** | Sign for each | Add all instantly |
| **Guest Mode** | One wallet only | Can upgrade anytime |
| **Mobile Access** | Blocked w/o device | Works everywhere |
| **User Friction** | High 😤 | Low 😊 |

---

## Comparison to Other dApps

### What Other dApps Do
- **Osmosis, Keplr Dashboard**: Use Graz library with persistent connection
- **Pulsar**: Local storage + session persistence  
- **CosmosKit**: Automatic reconnection without signature

### What We Do Now
- ✅ Session-based authentication (like traditional web apps)
- ✅ Persistent login (like Osmosis, Keplr Dashboard)
- ✅ Hardware wallet friendly (sign once, use everywhere)
- ✅ Flexible guest mode (for quick portfolio views)

---

## Migration Path

### Existing Users
- **No action required**
- Next time they sign in → Session created
- Future visits → No signature needed

### Guest Users
- Can continue using guest mode
- Can upgrade to account anytime
- Wallets automatically migrated

---

## Future Enhancements

### Potential Additions:
1. **Email/Password Sign-In** (alternative to wallet signature)
2. **Social Sign-In** (Google, GitHub, etc.)
3. **"Remember Me" Toggle** (30-day vs 7-day sessions)
4. **Session Management UI** (view/revoke active sessions)
5. **Hardware Wallet Badge** (show which wallets need device for transactions)

---

## Developer Notes

### Testing the Flow

**Test 1: Session Persistence**
```bash
1. Sign in with wallet → Close browser
2. Reopen within 7 days
3. Connect wallet → Should auto-reconnect
```

**Test 2: Hardware Wallet Scenario**
```bash
1. Sign in with Ledger wallet → Session created
2. Clear Graz/Keplr local storage (simulate different device)
3. Connect wallet → Should auto-reconnect (no Ledger needed)
```

**Test 3: Multi-Wallet**
```bash
1. Sign in with Wallet A
2. Connect Wallet B (different address)
3. Should add instantly without signature
```

### Console Logs to Watch

**Scenario: Authenticated user reconnecting wallet**
```
🔐 [Keplr] Checking for existing authenticated session...
✅ [Keplr] User already authenticated: user@email.com
🔍 [Keplr] Checking if this wallet belongs to current user...
🎉 [Keplr] Wallet already in authenticated user's account! No signature needed.
✅ [Keplr] connectWallet result: { success: true, wallet: {...} }
```

**Scenario: First-time user**
```
🔐 [Keplr] Checking for existing authenticated session...
👤 [Keplr] No authenticated session found, checking wallet registration...
🔍 [Keplr] Checking if wallet is registered to an account...
🎯 [Keplr] Wallet registered to account! Showing modal...
```

---

## Conclusion

This **Smart Session Management** system brings our wallet authentication in line with modern dApp standards while solving critical UX issues for hardware wallet users. Users now enjoy persistent login like traditional web apps, but with the security of wallet-based authentication.

The key insight: **Authenticate the user once, then trust the session for wallet operations.** This is exactly how Osmosis, Keplr Dashboard, and other major Cosmos dApps handle it.

---

**File**: `shuieldnestorg/docs/PERSISTENT-SESSION-AUTH.md`  
**Last Updated**: October 19, 2025  
**Related Files**:
- `hooks/useSimplifiedWalletConnect.ts` (Lines 278-339)
- `app/api/auth/wallet/sign-in/route.ts`
- `utils/supabase/middleware.ts`

