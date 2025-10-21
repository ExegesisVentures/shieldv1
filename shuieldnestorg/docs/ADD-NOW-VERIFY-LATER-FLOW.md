# Add Now, Verify Later - Wallet Connection Flow

## Overview

ShieldNest now uses a **frictionless wallet connection** approach: users can add ANY wallet address instantly without signatures, and only need to prove ownership when accessing features that require it.

---

## The Problem We Solved

### ❌ Old Flow (Bad UX)
```
User clicks "Connect Wallet"
  → Wallet popup opens immediately
  → User must approve signature
  → Wait for verification
  → Wallet added
  
Problem: Users lose focus, signatures are slow, friction kills conversion
```

### ✅ New Flow (Better UX)
```
User clicks "Connect Wallet"
  → Wallet added instantly ✅
  → Can view portfolio immediately
  → Signature ONLY required when needed (PMA signing, Private tier)
  
Benefit: Zero friction for basic features, prove ownership only when necessary
```

---

## User Journey

### 1. Visitor (Not Signed In)
- **Can do:** Add wallets, view portfolio, track tokens
- **Storage:** localStorage only
- **Verification:** None needed

### 2. Public User (Signed In)
- **Can do:** Save wallets permanently, access from any device
- **Storage:** Database (`wallets` table)
- **Verification:** None needed for basic tracking
- **Field:** `ownership_verified = false`

### 3. Private Member (Shield NFT Owner)
- **Can do:** Access exclusive features, sign PMA
- **Storage:** Database with enhanced privacy
- **Verification:** **REQUIRED** to prove ownership
- **Field:** `ownership_verified = true` (after signature)

---

## When Signature IS Required

Signature verification happens **ONLY** when user needs to prove ownership:

### 🔒 Signing the PMA Document
- User must prove they own the wallet holding the Shield NFT
- Flow: Click "Sign PMA" → Select verified wallet → Approve signature
- Action: Creates legal binding agreement

### 🔒 Verifying Shield NFT Ownership
- User must prove the Shield NFT in a wallet is actually theirs
- Flow: Access Private tier → Select wallet → Approve signature
- Action: Grants Private membership benefits

### 🔒 Any Transaction Requiring Proof
- Sending tokens, executing swaps (future), etc.
- The wallet extension itself handles these signatures
- Our app doesn't need additional verification

---

## Database Schema

### Updated `wallets` Table
```sql
CREATE TABLE public.wallets (
  id uuid PRIMARY KEY,
  public_user_id uuid NOT NULL,  -- Owner of this wallet entry
  address text NOT NULL,          -- Blockchain address
  label text,                     -- User-friendly name
  source text,                    -- 'keplr', 'leap', 'cosmostation', 'manual'
  ownership_verified boolean DEFAULT false,  -- 🆕 Has user proven ownership?
  verified_at timestamptz,        -- 🆕 When was ownership verified?
  created_at timestamptz,
  UNIQUE(public_user_id, address)
);

-- Index for fast lookups of verified wallets
CREATE INDEX idx_wallets_verified 
ON public.wallets(public_user_id, ownership_verified);
```

### Fields Explained

**`ownership_verified`** (boolean, default: `false`)
- `false` = User added address (read-only tracking)
- `true` = User cryptographically proved ownership via signature

**`verified_at`** (timestamptz, nullable)
- `NULL` = Not verified yet
- `timestamp` = When user signed to prove ownership

---

## Code Structure

### Files Changed

#### 1. **`hooks/useWalletConnect.ts`** - Simplified Connection
**File location:** `/hooks/useWalletConnect.ts`

**What changed:**
- ❌ Removed signature requirement for basic connection
- ✅ Just gets address and saves to database
- ✅ Sets `ownership_verified = false` by default

```typescript
// Before (Bad UX)
const result = await signFn(address, signDoc);
await verifySignature(result);

// After (Good UX)
await supabase.from("wallets").insert({
  public_user_id: userId,
  address,
  ownership_verified: false, // Not verified yet
});
```

#### 2. **`hooks/useVerifyWalletOwnership.ts`** - NEW Hook
**File location:** `/hooks/useVerifyWalletOwnership.ts`

**Purpose:** For when signature IS needed

**Usage:**
```typescript
import { useVerifyWalletOwnership } from "@/hooks/useVerifyWalletOwnership";

const { verifyOwnership, verifying } = useVerifyWalletOwnership();

// When user clicks "Sign PMA" or "Verify for Private Tier"
const result = await verifyOwnership(
  walletAddress,
  "keplr",
  "pma_signing" // or "shield_nft_verification"
);
```

#### 3. **`app/api/auth/wallet/verify-ownership/route.ts`** - NEW API
**File location:** `/app/api/auth/wallet/verify-ownership/route.ts`

**Purpose:** Verify signature and update `ownership_verified = true`

**Flow:**
1. Verify cryptographic signature
2. Check user is authenticated
3. Update wallet record: `ownership_verified = true`, `verified_at = NOW()`

#### 4. **Migration SQL**
**File location:** `../supabase/migrations/add_wallet_ownership_verified.sql`

**Run this in Supabase SQL Editor:**
```sql
-- Add new columns
ALTER TABLE public.wallets 
ADD COLUMN IF NOT EXISTS ownership_verified boolean DEFAULT false;

ALTER TABLE public.wallets 
ADD COLUMN IF NOT EXISTS verified_at timestamptz;

-- Create index
CREATE INDEX IF NOT EXISTS idx_wallets_verified 
ON public.wallets(public_user_id, ownership_verified);
```

---

## Flow Diagrams

### Basic Wallet Connection (No Signature)

```
┌─────────────────────────────────────────────────┐
│ USER CLICKS "CONNECT WALLET"                    │
├─────────────────────────────────────────────────┤
│ 1. Select wallet (Keplr/Leap/Cosmostation)     │
│ 2. Wallet extension opens (address selection)  │
│ 3. User approves chain connection              │
│ 4. Address saved to database                   │
│    ownership_verified: false                   │
│ 5. ✅ Done! Portfolio loads immediately         │
└─────────────────────────────────────────────────┘

Time: ~3 seconds
User friction: Minimal
```

### Ownership Verification (When Needed)

```
┌─────────────────────────────────────────────────┐
│ USER TRIES TO SIGN PMA OR ACCESS PRIVATE TIER  │
├─────────────────────────────────────────────────┤
│ 1. App checks: ownership_verified?             │
│    → If true: ✅ Proceed                        │
│    → If false: ⚠️ Show verification prompt      │
│                                                 │
│ 2. User clicks "Verify Wallet Ownership"       │
│ 3. Wallet popup: "Sign to prove you own this"  │
│ 4. User approves signature                     │
│ 5. API verifies signature                      │
│ 6. Database updated:                           │
│    ownership_verified: true                    │
│    verified_at: [timestamp]                    │
│ 7. ✅ Feature unlocked                          │
└─────────────────────────────────────────────────┘

Time: ~10 seconds
User friction: Only when necessary
```

---

## Implementation Checklist

### Database Migration
- [x] Add `ownership_verified` column to `wallets` table
- [x] Add `verified_at` column to `wallets` table
- [x] Create index on `(public_user_id, ownership_verified)`

### Code Updates
- [x] Update `useWalletConnect` to remove signature requirement
- [x] Create `useVerifyWalletOwnership` hook
- [x] Create `/api/auth/wallet/verify-ownership` endpoint
- [x] Update `utils/wallet/adr36.ts` to support custom messages
- [ ] Update membership page to show verification prompt when needed
- [ ] Add "Verify Ownership" button in wallet settings
- [ ] Show verified badge on verified wallets

### UI/UX Improvements (Future)
- [ ] Show tooltip: "This wallet is not verified. Verify to access Private tier."
- [ ] Add verification status badge in wallet list
- [ ] Show verification prompt contextually (when user tries to use feature)
- [ ] Add "Why do I need to verify?" explanation modal

---

## Benefits

### For Users
✅ **Instant connection** - No waiting for signatures  
✅ **Less friction** - Prove ownership only when needed  
✅ **Clear purpose** - Users understand WHY they're signing  
✅ **Better focus** - No surprise signature popups

### For Developers
✅ **Cleaner code** - Separation of concerns  
✅ **Better UX** - Higher conversion rates  
✅ **Flexibility** - Easy to add more verification use cases  
✅ **Security** - Proof of ownership when it matters

### For ShieldNest
✅ **Higher engagement** - Users don't drop off during connection  
✅ **Better conversion** - More users reach paid features  
✅ **Trust** - Clear communication about signatures  
✅ **Compliance** - Proper verification for legal agreements (PMA)

---

## Comparison to Other DEXs

### Most DEXs (Uniswap, Osmosis, etc.)
- ✅ Connect wallet (just address)
- ✅ Signature ONLY when executing transactions
- ✅ Zero friction for browsing

### ShieldNest (Now)
- ✅ Connect wallet (just address)
- ✅ Signature ONLY when:
  - Signing legal agreements (PMA)
  - Proving NFT ownership (Private tier)
  - Executing transactions (future DEX features)
- ✅ Same UX as top DEXs

### ShieldNest (Before - Bad)
- ❌ Signature required just to ADD a wallet
- ❌ Slow, confusing, high friction
- ❌ Users couldn't understand WHY they're signing

---

## Security Considerations

### Is It Safe to Allow Unverified Wallets?

**Yes, because:**

1. **Read-only tracking is harmless**
   - Users can add any address to track portfolios
   - No transactions can be executed without wallet extension approval

2. **Verification required for sensitive actions**
   - PMA signing requires proof of ownership
   - Private tier access requires proof of Shield NFT ownership
   - Any transaction requires wallet extension approval

3. **No impersonation risk**
   - Adding an address doesn't grant control
   - Verification happens at the RIGHT time (when actions are taken)

### Attack Scenarios (Covered)

**Scenario:** User adds someone else's address
- **Risk:** Low - They can only VIEW that address's portfolio
- **Mitigation:** When they try to use Private features, verification fails

**Scenario:** User claims to own Shield NFT they don't have
- **Risk:** None - Verification checks on-chain ownership
- **Mitigation:** `ownership_verified` check + on-chain NFT lookup

**Scenario:** User tries to sign PMA with unverified wallet
- **Risk:** None - API requires `ownership_verified = true`
- **Mitigation:** Verification prompt blocks action until signature

---

## Future Enhancements

### 1. Batch Verification
Allow users to verify multiple wallets at once

### 2. Verification Expiry
Re-verify ownership after X months (for high-security features)

### 3. Verification Levels
- Level 0: Unverified (read-only)
- Level 1: Signature verified
- Level 2: KYC verified (future compliance)

### 4. Verification Badges
Show visual indicators in UI:
- 🔓 Unverified (gray)
- ✅ Verified (green)
- 👑 Private Member (gold)

---

## Migration Path

### For Existing Users

**Users with old verified wallets:**
- Keep existing wallets
- Set `ownership_verified = true` for all existing wallets (they were verified under old flow)
- No action needed

**Users with localStorage wallets:**
- Migration prompt still works
- New wallets saved with `ownership_verified = false`
- Can verify later if needed

### Database Update
```sql
-- Mark all existing wallets as verified (they passed old flow)
UPDATE public.wallets 
SET ownership_verified = true, 
    verified_at = created_at
WHERE ownership_verified IS NULL;
```

---

## Support & Troubleshooting

### Common Issues

**Q: User can't access Private tier even after connecting wallet**
A: Check `ownership_verified` status. Prompt for verification if `false`.

**Q: Verification keeps failing**
A: Check wallet extension is unlocked, network is correct, and signature format matches ADR-36.

**Q: User doesn't understand why they need to verify**
A: Show contextual explanation: "Prove you own this wallet to unlock Private member benefits."

---

## Related Documentation

- `docs/AUTHENTICATION-WALLET-FLOW.md` - Overall auth architecture
- `docs/SHIELD-NFT-IMPLEMENTATION.md` - Shield NFT verification
- `docs/VISITOR-TO-PUBLIC-FLOW.md` - User tier transitions
- `utils/wallet/adr36.ts` - Signature verification logic

---

**Last Updated:** October 5, 2025  
**Version:** 1.0  
**Status:** ✅ Implemented
