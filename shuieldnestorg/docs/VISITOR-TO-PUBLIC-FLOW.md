# Visitor to Public User Flow

## Overview

ShieldNest has three user tiers. This document explains how visitors are nudged to upgrade to Public Users at strategic moments.

---

## User Tiers

### 🔓 Visitor (Guest)
- **Storage**: localStorage only
- **Auth**: None
- **Features**: 
  - Connect wallets (Keplr/Leap/Cosmostation/Manual)
  - View portfolio balances
  - Track tokens and values
  - Access public features
- **Limitations**:
  - Data lost when clearing browser storage
  - Cannot access from other devices
  - No persistent history

### 🔒 Public User
- **Storage**: Database (Supabase)
- **Auth**: Email/password OR wallet-bootstrap (no email required)
- **Features**:
  - All Visitor features
  - Data persists permanently
  - Access from any device
  - Wallet signature verification
  - Account settings
- **Requirements**: Just connect a wallet OR provide email (user's choice)

### 👑 Private Member
- **Storage**: Database + enhanced privacy
- **Auth**: Public User + Shield NFT ownership + PMA signature
- **Features**:
  - All Public User features
  - Exclusive member content
  - Governance participation
  - Premium features
  - Priority support
- **Requirements**: Buy Shield NFT (~$5k-6k) + sign PMA

---

## Visitor Wallet Connection Flow

### Before (WRONG ❌)
```
Visitor connects wallet
  → Create anonymous auth user
  → Create public_users profile in DB
  → Store wallet in DB
  → ERROR: Missing updated_at column
```

### After (CORRECT ✅)
```
Visitor connects wallet
  → Check auth.getUser()
  → No user found? Store in localStorage ONLY
  → Success! No database, no auth
```

### Authenticated User Flow
```
Public User connects wallet
  → Check auth.getUser()
  → User found? Full verification flow
  → Request nonce from API
  → Sign with wallet
  → Verify signature
  → Store in database
```

---

## Smart Upgrade Triggers

Visitors are prompted to create a Public User account at strategic moments:

### 1. Multiple Wallets (Priority 1)
- **Trigger**: User connects 3+ wallets
- **Message**: "Managing Multiple Wallets? Save your portfolio permanently with a free account"
- **Why**: User is invested enough to track multiple addresses
- **CTA**: "Create Account (No Email Required)"

### 2. Extended Session (Priority 2)
- **Trigger**: User active for 5+ minutes
- **Message**: "Still Exploring? Create an account to save your progress and data"
- **Why**: Engaged user spending significant time
- **CTA**: "Save My Portfolio"

### 3. Return Visit (Priority 3)
- **Trigger**: User returns 2+ times
- **Message**: "Welcome Back! Save your wallets so you don't have to re-add them"
- **Why**: Repeat visitor showing loyalty
- **CTA**: "Create Free Account"

### 4. Significant Portfolio (Priority 4)
- **Trigger**: Portfolio value ≥ $100
- **Message**: "Significant Portfolio Detected. Protect your data with a permanent account"
- **Why**: User has valuable assets worth protecting
- **CTA**: "Secure My Portfolio"

---

## Upgrade Rules Implementation

### Location
- `utils/visitor-upgrade-rules.ts` - Core logic
- `components/nudges/SmartUpgradePrompt.tsx` - UI component
- `app/dashboard/page.tsx` - Integration

### Key Functions

```typescript
// Check which rule should trigger
const rule = checkUpgradeTriggers();

// Dismiss a specific prompt
dismissUpgradePrompt('multiple_wallets');

// Update portfolio value for trigger
updatePortfolioValue(totalValueUsd);
```

### localStorage Keys
- `visitor_addresses` - Array of wallet objects
- `visitor_session_start` - Timestamp of first visit
- `visit_count` - Number of visits
- `portfolio_value_usd` - Total portfolio value
- `upgrade_dismissed` - Object of dismissed prompts

---

## Benefits of This Approach

### ✅ Visitor-Friendly
- No friction to start
- Explore freely without signup
- No annoying exit-intent popups

### ✅ Smart Conversion
- Prompt at meaningful moments
- User sees value before committing
- Multiple natural upgrade opportunities

### ✅ No Database Overhead
- Visitors don't hit the database
- Scales better (fewer DB calls)
- No auth user clutter

### ✅ Clear User Tiers
- Clean separation of concerns
- Each tier has clear requirements
- Easy to maintain and extend

---

## Future Enhancements

### Potential Additional Triggers
- First feature access attempt (liquidity, trading)
- Watchlist creation
- Custom alert setup
- Export data request

### Wallet-Bootstrap Simplification
When visitor upgrades, we could offer:
1. **Email + Password** (traditional)
2. **Wallet-Only** (no email, just sign with wallet)
   - Create anonymous auth user at THIS point
   - Link wallet with signature
   - Optional: Add email later in settings

---

## Migration Path

If visitor wants to upgrade:

1. **Click upgrade CTA** → `/sign-up`
2. **Choose method**:
   - Email/password signup
   - OR wallet-bootstrap (connect wallet to create account)
3. **Import localStorage data**:
   - Read `visitor_addresses`
   - Prompt: "Import your existing wallets?"
   - Copy to database
   - Clear localStorage

This ensures seamless transition without data loss.

---

## Testing

### Visitor Flow
1. Open in incognito
2. Connect 3 wallets
3. Wait 30 seconds
4. See "Multiple Wallets" prompt
5. Check localStorage for data

### Public User Flow
1. Sign up with email
2. Connect wallet
3. Should ask for signature
4. Verify in database

### Dismiss Logic
1. Click "Maybe later"
2. Reload page
3. Should NOT see same prompt
4. Check `upgrade_dismissed` in localStorage

---

## Technical Notes

- Triggers checked every 30 seconds
- Only highest priority trigger shows at once
- Dismissed prompts won't re-trigger
- Portfolio value updates on every balance fetch
- Visit count increments on page load

---

**Let's get this fucking ball rolling! 🚀**

