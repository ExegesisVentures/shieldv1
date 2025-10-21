# Simplified Authentication Flow

## Overview
ShieldNest now uses a **frictionless wallet connection** approach. Users can connect their wallet with just a chain approval (no signature required) to view their portfolio. Authentication is only required for token-gated features.

## User Flow

### 1. **Easy Wallet Connection (No Auth Required)**
- User clicks "Sign In" or "Connect Wallet"
- Approves Coreum chain in wallet extension (Keplr/Leap/Cosmostation)
- **No signature required!**
- Can immediately:
  - View portfolio
  - See wallet balances
  - Track NFT holdings
  - View liquidity pools
  - Access all public features

**Files:**
- `components/auth/SignInModal.tsx` - Simplified to 2 tabs (Wallet first, Email second)
- `hooks/useWalletConnect.ts` - Simple chain connection without signature

### 2. **Data Storage**

**Visitor (Not Signed Up):**
- Wallets stored in `localStorage` (browser only)
- Data persists until cleared
- Works across all public pages
- Header shows "X Wallets Connected" (not "Visitor Mode")

**Authenticated (Signed Up with Email):**
- Wallets stored in Supabase database
- Synced across devices
- Full account features

### 3. **Token-Gated Content (Requires Signature)**

Only these features require wallet signature verification:

#### **Shield NFT Pages**
- Buying Shield NFT
- Selling Shield NFT
- **Guard:** Check `ownership_verified` flag before allowing transactions
- **How:** Use `hooks/useVerifyWalletOwnership.ts` to request signature

#### **Member-Exclusive Pages**
- `/membership` - Private tier content
- `/pma` - PMA document signing
- **Guard:** Check Shield NFT ownership + wallet verification
- **How:** Use `utils/nft/shield.ts` to verify NFT ownership

## Implementation Details

### Wallet Connection (No Signature)

**File: `hooks/useWalletConnect.ts`**
```typescript
// For visitors: stores in localStorage with read_only: false
// For authenticated: stores in database with ownership_verified: false
```

Users can use these wallets for everything except token-gated actions.

### Signature Verification (When Needed)

**File: `hooks/useVerifyWalletOwnership.ts`**
```typescript
const { verifyOwnership, verifying } = useVerifyWalletOwnership();

// When user tries to access token-gated content:
const result = await verifyOwnership(
  walletAddress, 
  "keplr", 
  "shield_nft_verification"
);

if (result.success) {
  // Update wallet.ownership_verified = true
  // Allow access to token-gated feature
}
```

### API Endpoints

**Simple Connection (No Auth):**
- No API calls needed for visitors
- Uses wallet extension directly

**Signature Verification (Token-Gated):**
- `GET /api/auth/wallet/nonce?address=...` - Get nonce
- `POST /api/auth/wallet/verify-ownership` - Verify signature
  - Updates `wallets.ownership_verified = true`
  - Updates `wallets.verified_at = now()`

## UI Changes

### SignInModal (`components/auth/SignInModal.tsx`)
- **Before:** 3 confusing tabs (Email, Sign In, Track)
- **After:** 2 simple tabs (Connect Wallet, Email)
- Default tab: "Connect Wallet"
- Clear messaging: "Just approve the Coreum chain connection"

### Header Menu (`components/header-user-menu.tsx`)
- **Before:** "Visitor Mode" (confusing/negative)
- **After:** "X Wallets Connected" (positive/clear)
- Subtitle: "Sign up to save your data" (clear call-to-action)

### Wallet Cards (`components/wallet/ConnectedWallets.tsx`)
- Removed "Read-only" badge (all wallets are usable)
- Only show when wallet needs verification for specific actions

## Token-Gating Implementation (TODO)

### Pages That Need Guards

1. **`app/membership/page.tsx`** - Private tier content
   ```typescript
   // Check if user has Shield NFT + verified wallet
   // If not, show prompt to verify wallet ownership
   ```

2. **`app/pma/page.tsx`** - PMA document signing
   ```typescript
   // Require wallet signature before allowing PMA signing
   ```

3. **Future: DEX Trading** (v2)
   ```typescript
   // Require verified wallet before allowing trades
   ```

### Implementation Pattern

```typescript
// In token-gated page component:
const [walletVerified, setWalletVerified] = useState(false);
const { verifyOwnership, verifying } = useVerifyWalletOwnership();

// Check verification status
useEffect(() => {
  async function checkVerification() {
    const supabase = createSupabaseClient();
    const { data: wallet } = await supabase
      .from("wallets")
      .select("ownership_verified")
      .eq("address", currentAddress)
      .single();
    
    setWalletVerified(wallet?.ownership_verified || false);
  }
  checkVerification();
}, [currentAddress]);

// When user tries to access gated feature:
if (!walletVerified) {
  return (
    <div>
      <p>Verify wallet ownership to access this feature</p>
      <Button onClick={handleVerify}>Verify Wallet</Button>
    </div>
  );
}

const handleVerify = async () => {
  const result = await verifyOwnership(
    currentAddress,
    "keplr", // or detect from wallet
    "shield_nft_verification"
  );
  
  if (result.success) {
    setWalletVerified(true);
  }
};
```

## Benefits

✅ **Lower Friction** - Users can explore immediately with just chain approval
✅ **Clear UX** - No confusing "Visitor Mode" or "Read-only" labels  
✅ **Progressive Auth** - Only ask for signatures when actually needed
✅ **Better Conversion** - More users try the app → More likely to sign up
✅ **Security** - Still protected for sensitive actions (NFT, PMA)

## Migration Notes

If you already have visitor wallets with `read_only: true` in localStorage, they will work normally now. The flag is ignored and all connected wallets are usable for public features.

## Next Steps

- [ ] Add signature verification guards to `/membership` page
- [ ] Add signature verification guards to `/pma` page  
- [ ] Consider auto-detecting wallet extensions on page load
- [ ] Add "Connect Wallet" button on landing page for instant portfolio tracking
