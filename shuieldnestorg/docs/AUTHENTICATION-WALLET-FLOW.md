# Authentication & Wallet Connection Flow

## Clean Architecture Overview

This document describes the cleaned-up authentication and wallet connection flows after removing band-aid fixes and implementing the database trigger solution.

---

## User Profile Creation: The Right Way ✅

### Database Trigger (Automatic)
**File:** `../supabase/migrations/20251016_create_auto_user_profile_trigger.sql`

When a user signs up (via ANY method), PostgreSQL automatically:
1. Creates `public_users` record
2. Creates `user_profiles` mapping
3. All in the same database transaction

**Works for:**
- Email/password sign-up
- OAuth (Google, GitHub, etc.)
- Anonymous auth
- Wallet-bootstrap

### Server-Side Fallback (Safety Net)
**File:** `app/actions.ts`

- `signInAction` and `signUpAction` have fallback profile creation
- Uses `createServiceRoleClient()` to bypass RLS if needed
- Only runs if trigger somehow failed
- Logs errors but doesn't block authentication

**Purpose:** Safety net for edge cases, not primary mechanism

---

## Flow Diagrams

### 1. Visitor Flow (No Auth)

```
┌─────────────────────────────────────────────────────┐
│ VISITOR (No Account)                                │
├─────────────────────────────────────────────────────┤
│ 1. Lands on site                                    │
│ 2. Clicks "Connect Wallet" or "Add Wallet"          │
│    └─> Opens WalletConnectModal or SignInModal      │
│ 3. Connects wallet OR enters address manually       │
│    └─> Stored in localStorage ONLY                  │
│ 4. Can view portfolio (from localStorage)           │
│ 5. Sees upgrade nudges to create account            │
└─────────────────────────────────────────────────────┘

Storage: localStorage['visitor_addresses']
Persistence: Browser session only
Database: No records created
```

### 2. Sign-Up Flow (Email/Password)

```
┌─────────────────────────────────────────────────────┐
│ SIGN-UP (Creating Account)                          │
├─────────────────────────────────────────────────────┤
│ 1. User clicks "Sign Up"                            │
│ 2. Fills email + password → signUpAction()          │
│ 3. Supabase creates auth.users record               │
│ 4. ✨ DATABASE TRIGGER FIRES AUTOMATICALLY ✨       │
│    ├─> Creates public_users record                  │
│    └─> Creates user_profiles mapping                │
│ 5. (Fallback) Server action checks & creates if     │
│    trigger failed (uses service role client)        │
│ 6. User redirected to /dashboard                    │
│ 7. If visitor had wallets, migration prompt shows   │
└─────────────────────────────────────────────────────┘

Database:
- auth.users (by Supabase)
- public_users (by trigger)
- user_profiles (by trigger)
```

### 3. Sign-In Flow (Existing User)

```
┌─────────────────────────────────────────────────────┐
│ SIGN-IN (Existing Account)                          │
├─────────────────────────────────────────────────────┤
│ 1. User clicks "Sign In"                            │
│ 2. Fills email + password → signInAction()          │
│ 3. Supabase authenticates user                      │
│ 4. (Fallback) Server checks profile exists          │
│    └─> If not, creates via service role client      │
│ 5. User redirected to /dashboard                    │
│ 6. Dashboard loads profile + wallets from DB        │
│ 7. If visitor had wallets, migration prompt shows   │
└─────────────────────────────────────────────────────┘

Database:
- Reads from public_users + user_profiles
- Reads wallets from wallets table
```

### 4. Wallet Connection Flow (Authenticated)

```
┌─────────────────────────────────────────────────────┐
│ WALLET CONNECTION (Authenticated User)              │
├─────────────────────────────────────────────────────┤
│ 1. User clicks "Add Wallet" → opens modal           │
│ 2. Selects wallet (Keplr/Leap/Cosmostation)         │
│ 3. useWalletConnect.connectWallet() runs:           │
│    ├─> Get wallet address from extension            │
│    ├─> Get public_user_id from user_profiles        │
│    │   (Should ALWAYS exist from trigger)           │
│    ├─> Request nonce from API                       │
│    ├─> Sign message with wallet                     │
│    ├─> Verify signature via API                     │
│    └─> Save to wallets table                        │
│ 4. Modal closes, dashboard refreshes                │
│ 5. Wallet appears in "Your Wallets" list            │
└─────────────────────────────────────────────────────┘

Database:
- Reads user_profiles (for public_user_id)
- Creates wallet_nonces (temporary)
- Creates wallets record (permanent)
```

### 5. Manual Address Flow (Authenticated)

```
┌─────────────────────────────────────────────────────┐
│ MANUAL ADDRESS (Authenticated User)                 │
├─────────────────────────────────────────────────────┤
│ 1. User clicks "Enter Address Manually"             │
│ 2. Pastes Coreum address + optional label           │
│ 3. useWalletConnect.addManualAddress() runs:        │
│    ├─> Get public_user_id from user_profiles        │
│    │   (Should ALWAYS exist from trigger)           │
│    ├─> Validate address format                      │
│    ├─> Check for duplicates                         │
│    └─> Save to wallets table (read_only: true)      │
│ 4. Modal closes, dashboard refreshes                │
│ 5. Address appears in "Your Wallets" list           │
└─────────────────────────────────────────────────────┘

Database:
- Reads user_profiles (for public_user_id)
- Creates wallets record (read-only)
```

### 6. Visitor-to-Public Migration

```
┌─────────────────────────────────────────────────────┐
│ VISITOR MIGRATION (localStorage → Database)         │
├─────────────────────────────────────────────────────┤
│ 1. Visitor has wallets in localStorage              │
│ 2. Signs up or signs in                             │
│ 3. Dashboard detects:                               │
│    ├─> hasVisitorWallets() = true                   │
│    └─> !isMigrationCompleted() = true               │
│ 4. VisitorWalletMigrationPrompt shows               │
│ 5. User clicks "Import Wallets"                     │
│ 6. performVisitorMigration() runs:                  │
│    ├─> Read visitor_addresses from localStorage     │
│    ├─> For each wallet:                             │
│    │   ├─> Check if already exists in DB            │
│    │   ├─> Insert into wallets table                │
│    │   └─> Skip if duplicate                        │
│    ├─> Clear visitor_addresses                      │
│    └─> Mark migration completed                     │
│ 7. Dashboard refreshes with migrated wallets        │
└─────────────────────────────────────────────────────┘

Migration:
- From: localStorage['visitor_addresses']
- To: wallets table (linked to public_user_id)
```

---

## Error Handling

### Profile Not Found Errors

**When it happens:**
- Database trigger not installed
- User created before trigger was added
- Database error during sign-up

**What the app does:**
```
❌ Old (Band-Aid): Try to create profile from client
✅ New (Clean): Show clear error, suggest contacting support
```

**Error message:**
```
"User profile not found. Please contact support or try signing out and back in."
Hint: "Database trigger may not be configured. Check DATABASE-TRIGGER-SETUP.md"
```

**How to fix:**
1. Run the database trigger migration
2. Existing users will be backfilled automatically
3. New users will get profiles automatically

### Wallet Already Connected

**When it happens:**
- User tries to connect same wallet twice
- Wallet exists in visitor localStorage but not in DB

**What the app does:**
```typescript
// Check DATABASE, not localStorage
const { data: existingWallet } = await supabase
  .from("wallets")
  .select("id")
  .eq("address", address)
  .eq("user_scope", "public")
  .maybeSingle();

if (existingWallet) {
  return { error: "This wallet is already connected to your account" };
}
```

---

## Key Components

### 1. `useWalletConnect` Hook
**File:** `hooks/useWalletConnect.ts`

**What it does:**
- Detects visitor vs authenticated mode
- Visitor: stores in localStorage
- Authenticated: verifies signature, saves to DB
- **No longer** tries to create user profiles

**Key change:**
```typescript
// ❌ OLD: Try to create profile
if (!profile) {
  await fetch("/api/user/profile", { method: "POST" });
}

// ✅ NEW: Expect profile to exist, error if not
if (!profile?.public_user_id) {
  return { error: "Profile not found - trigger may not be configured" };
}
```

### 2. `SignInModal` Component
**File:** `components/auth/SignInModal.tsx`

**Features:**
- Tabbed interface (Email/Password vs Wallet)
- Unified sign-in experience
- Rendered via Portal (z-index fix)

### 3. Server Actions
**File:** `app/actions.ts`

**signInAction:**
- Authenticates user
- Fallback profile creation via service role client
- Redirects to dashboard

**signUpAction:**
- Creates auth user
- Fallback profile creation via service role client
- Redirects to dashboard

### 4. Dashboard
**File:** `app/dashboard/page.tsx`

**What it does:**
- Loads user profile (expects it to exist)
- Shows migration prompt if visitor wallets present
- Displays portfolio and connected wallets
- **No longer** tries to create profiles

---

## Files Removed (Band-Aid Fixes)

✅ **Deleted:**
- `app/api/user/profile/route.ts` - No longer needed

✅ **Simplified:**
- `hooks/useWalletConnect.ts` - Removed client-side profile creation
- `app/dashboard/page.tsx` - Removed manual profile creation
- `components/wallet/ConnectedWallets.tsx` - Removed manual profile creation

✅ **Kept (as fallback):**
- `app/actions.ts` - Server-side profile creation for safety
- `utils/supabase/user-profile.ts` - Helper functions still used by actions

---

## Testing Checklist

### Before Database Trigger
- [ ] Sign up → Check if profile exists in `public_users` and `user_profiles`
- [ ] Should FAIL (profile not created)

### After Database Trigger  
- [ ] Sign up → Check if profile exists immediately
- [ ] Should SUCCESS (trigger creates profile)

### Wallet Connection
- [ ] Sign in → Add Keplr wallet → Should work
- [ ] Sign in → Add manual address → Should work
- [ ] Try adding same wallet twice → Should show error

### Visitor Migration
- [ ] As visitor: Add 2 wallets
- [ ] Sign up
- [ ] Migration prompt appears
- [ ] Click "Import Wallets"
- [ ] Both wallets appear in dashboard

---

## Summary

### What's Different Now?

**Before (Band-Aid):**
- Application code tries to create profiles
- Multiple places doing the same thing
- Errors hidden or handled inconsistently
- RLS blocking profile creation

**After (Clean):**
- Database trigger creates profiles automatically
- Application code expects profiles to exist
- Clear errors if profile missing (configuration issue)
- Service role client used only in server actions as fallback

### Benefits

✅ **Simpler** - Less application code  
✅ **Reliable** - Database transaction guarantees  
✅ **Consistent** - One mechanism, not many  
✅ **Debuggable** - Clear error messages  
✅ **Scalable** - No RLS issues

---

**Last Updated:** After removing band-aid fixes and implementing database trigger

