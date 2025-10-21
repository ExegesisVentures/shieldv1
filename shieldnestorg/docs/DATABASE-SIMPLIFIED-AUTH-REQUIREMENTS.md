# Database Requirements for Simplified Auth

## Overview
This document explains what database configuration is needed to support the simplified "connect now, verify later" authentication flow.

## Required Schema

### 1. Wallets Table

**File: `DATABASE-SETUP-AUTHORITATIVE.sql` lines 40-51**

```sql
CREATE TABLE IF NOT EXISTS public.wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_user_id uuid NOT NULL REFERENCES public.public_users(id) ON DELETE CASCADE,
  address text NOT NULL,
  label text,
  source text DEFAULT 'manual',                    -- 🔑 Track wallet provider
  ownership_verified boolean DEFAULT false,        -- 🔑 Key for simplified auth
  verified_at timestamptz,                         -- 🔑 When verification happened
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(public_user_id, address)
);
```

### Key Columns for Simplified Auth

#### `ownership_verified` (boolean, default: `false`)
- **`false`** = User connected wallet without signature (default)
- **`true`** = User proved ownership via cryptographic signature
- **Purpose:** Gate token-gated content (Shield NFT, PMA, etc.)

#### `verified_at` (timestamptz, nullable)
- **`NULL`** = Not verified yet
- **`timestamp`** = When user signed to prove ownership
- **Purpose:** Audit trail

#### `source` (text, default: `'manual'`)
- Values: `'keplr'`, `'leap'`, `'cosmostation'`, `'manual'`
- **Purpose:** Track which wallet extension was used

### 2. Required Indexes

**File: `DATABASE-SETUP-AUTHORITATIVE.sql` lines 97-99**

```sql
CREATE INDEX IF NOT EXISTS idx_wallets_public_user ON public.wallets(public_user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_address ON public.wallets(address);
CREATE INDEX IF NOT EXISTS idx_wallets_verified ON public.wallets(public_user_id, ownership_verified);
```

The `idx_wallets_verified` index is critical for fast queries like:
```sql
-- Find all verified wallets for a user
SELECT * FROM wallets 
WHERE public_user_id = $1 
  AND ownership_verified = true;
```

### 3. RLS Policies

**File: `DATABASE-SETUP-AUTHORITATIVE.sql` lines 189-218**

#### Policy 1: Users can view their own wallets
```sql
CREATE POLICY "Users can view their own wallets"
  ON public.wallets FOR SELECT
  TO authenticated
  USING (
    public_user_id IN (
      SELECT public_user_id 
      FROM public.user_profiles 
      WHERE auth_user_id = auth.uid()
    )
  );
```

#### Policy 2: Users can manage their own wallets
```sql
CREATE POLICY "Users can manage their own wallets"
  ON public.wallets FOR ALL
  TO authenticated
  USING (
    public_user_id IN (
      SELECT public_user_id 
      FROM public.user_profiles 
      WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    public_user_id IN (
      SELECT public_user_id 
      FROM public.user_profiles 
      WHERE auth_user_id = auth.uid()
    )
  );
```

**Why `FOR ALL`?**
- Covers INSERT, UPDATE, DELETE in one policy
- Users can:
  - **INSERT** wallets with `ownership_verified = false` (connect without signature)
  - **UPDATE** wallets to set `ownership_verified = true` (verify later)
  - **DELETE** wallets they no longer want

### 4. Wallet Nonces Table

**File: `DATABASE-SETUP-AUTHORITATIVE.sql` lines 73-81**

```sql
CREATE TABLE IF NOT EXISTS public.wallet_nonces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nonce text UNIQUE NOT NULL,
  address text,
  expires_at timestamptz NOT NULL,
  used boolean DEFAULT false,
  used_at timestamptz,
  created_at timestamptz DEFAULT now()
);
```

**Purpose:** Generate one-time nonces for signature verification when users need to prove ownership.

**Policies:** Allow public access (both authenticated and anonymous users can create/read nonces)

## How It Works

### Phase 1: Initial Connection (No Signature)

**User Action:** Connects wallet with Keplr/Leap/Cosmostation

**Code:** `hooks/useWalletConnect.ts` lines 140-148
```typescript
await supabase.from("wallets").insert({
  public_user_id: profile.public_user_id,
  address,
  label: `${walletProvider} Wallet`,
  source: walletProvider,
  ownership_verified: false,  // ✅ Not verified yet
  verified_at: null,
});
```

**Database State:**
```
| address        | ownership_verified | verified_at | source  |
|----------------|-------------------|-------------|---------|
| core1abc...xyz | false             | NULL        | keplr   |
```

**User Can:**
- ✅ View portfolio
- ✅ See balances
- ✅ Track NFTs
- ✅ Access all public features

**User Cannot:**
- ❌ Buy/sell Shield NFT (needs verification)
- ❌ Sign PMA document (needs verification)
- ❌ Access Private tier (needs verification)

### Phase 2: Verification (When Needed)

**User Action:** Tries to access token-gated content → prompted to verify

**Code:** `hooks/useVerifyWalletOwnership.ts` lines 82-92
```typescript
// Request signature from wallet
const signatureResult = await signFn(address, signDoc);

// Verify signature with API
await fetch("/api/auth/wallet/verify-ownership", {
  method: "POST",
  body: JSON.stringify({ address, signature, nonce, purpose })
});

// API updates database:
// UPDATE wallets 
// SET ownership_verified = true, verified_at = NOW()
// WHERE address = $1
```

**Database State After Verification:**
```
| address        | ownership_verified | verified_at         | source  |
|----------------|-------------------|---------------------|---------|
| core1abc...xyz | true              | 2025-10-05 14:32:10 | keplr   |
```

**User Can Now:**
- ✅ All previous features
- ✅ Buy/sell Shield NFT
- ✅ Sign PMA document
- ✅ Access Private tier content

## Verification Script

Run this to verify your database is correctly configured:

**File:** `VERIFY-SIMPLIFIED-AUTH-DATABASE.sql`

```bash
# In Supabase SQL Editor:
# 1. Copy contents of VERIFY-SIMPLIFIED-AUTH-DATABASE.sql
# 2. Paste and run
# 3. Check output for ✅ or ❌ indicators
```

## Migration from Old Schema

If your database was set up before this flow, ensure:

1. **Add missing columns:**
```sql
ALTER TABLE public.wallets 
ADD COLUMN IF NOT EXISTS ownership_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS verified_at timestamptz,
ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual';
```

2. **Add verification index:**
```sql
CREATE INDEX IF NOT EXISTS idx_wallets_verified 
ON public.wallets(public_user_id, ownership_verified);
```

3. **Update existing wallets:**
```sql
-- Mark all existing wallets as unverified
UPDATE public.wallets 
SET ownership_verified = false,
    verified_at = NULL
WHERE ownership_verified IS NULL;
```

## Summary

✅ **Schema:** wallets table has `ownership_verified`, `verified_at`, `source`  
✅ **Defaults:** New wallets default to `ownership_verified = false`  
✅ **Policies:** Users can INSERT unverified wallets, UPDATE to verify later  
✅ **Indexes:** Fast lookups for verified/unverified wallet queries  
✅ **Nonces:** Support for cryptographic signature verification  

Your database is ready for the simplified "connect now, verify later" flow! 🚀
