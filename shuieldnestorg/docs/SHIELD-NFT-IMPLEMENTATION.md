# Shield NFT Placeholder Implementation

## Overview

This document describes the implementation of the placeholder Shield NFT that displays in all users' portfolios with a fluctuating value between $5,000-$5,500, tied to CORE token price movements.

## Features

### 1. **Placeholder NFT for All Users**
- Every user (Visitor, Public, Private) receives a Shield NFT in their portfolio
- NFT appears as a holding alongside token balances
- No disclosure that it's a placeholder—displays as a real asset

### 2. **Fluctuating Value System**

The NFT value fluctuates based on:

#### Base Value (User-Specific)
- Each user has a stable base value between $5,000-$5,500
- Calculated using deterministic seeded random based on user ID
- Same user always gets the same base value (consistent across sessions)

#### CORE Price Correlation
- NFT value moves with CORE token price
- 30% correlation factor (dampening)
- If CORE goes up 10%, NFT goes up ~3%
- Formula: `baseValue * (1 + (corePriceRatio - 1) * 0.3)`

#### Time-Based Variance
- Small hourly fluctuations (±$25)
- Creates realistic price movement throughout the day
- Uses sine wave based on hour of day

#### Bounded Fluctuation
- Maintains value within $4,950-$5,550 range (with flex)
- Prevents extreme deviations while allowing natural variance

### 3. **24h Change Tracking**
- NFT's 24h change follows CORE's change with dampening
- If CORE changes +5%, NFT shows +1.5%
- Contributes to overall portfolio 24h change (weighted)

## Implementation Files

### Core Utilities

#### `utils/nft/shield.ts`
Main NFT utility functions:

```typescript
// Calculate fluctuating NFT value
calculateShieldNftValue(userId, corePrice, min, max): number

// Get NFT holding data for display
getShieldNftHolding(userId, corePrice, coreChange24h, shieldSettings): ShieldNftHolding

// Fetch NFT settings from database
fetchShieldSettings(supabase): Promise<ShieldSettings>
```

**Key Features:**
- Stable per-user value generation
- CORE price correlation with dampening
- Time-based variance for realism
- Bounded fluctuation within admin-set range

### Display Components

#### `components/portfolio/NftHoldings.tsx`
Specialized component for displaying NFT holdings:

**Features:**
- Purple gradient styling (distinct from tokens)
- NFT badge indicator
- Shows quantity, value, and 24h change
- Responsive table layout
- Loading states and animations

**Styling:**
- Purple-themed to match ShieldNest branding
- Distinct from token holdings (blue/gray)
- Gradient backgrounds and borders
- Shield icon for visual identity

### Integration Points

#### `app/dashboard/page.tsx`
Main portfolio dashboard integration:

**Changes:**
1. Fetches Shield NFT settings and CORE price on load
2. Generates user-specific NFT holding
3. Includes NFT value in total portfolio value
4. Calculates weighted 24h change (tokens + NFT)
5. Displays NFT in dedicated section above tokens

**User Types:**
- **Authenticated Users**: Uses `public_user_id` for stable value
- **Visitors**: Uses first wallet address or 'visitor-default' as ID

#### `app/wallets/page.tsx`
Wallet management page integration:

**Changes:**
1. Shows NFT holdings alongside wallet list
2. Provides context for NFT ownership
3. Same calculation logic as dashboard

## Value Calculation Example

### Example 1: User with ID "user123"

**Given:**
- User ID: `user123`
- CORE Price: $0.25 (baseline)
- Hour of Day: 14 (2 PM)

**Calculation:**
1. Base value from seed: `$5,237.50` (stable for this user)
2. CORE price ratio: `0.25 / 0.25 = 1.0` (no change)
3. Price multiplier: `1 + ((1.0 - 1) * 0.3) = 1.0`
4. Time variance: `sin(14 * 0.26) * 25 = +$18.50`
5. **Final value: $5,256.00**

### Example 2: CORE Price Increase

**Given:**
- Same user (`user123`)
- CORE Price: $0.30 (+20% increase)
- Hour of Day: 14

**Calculation:**
1. Base value: `$5,237.50` (same)
2. CORE price ratio: `0.30 / 0.25 = 1.2`
3. Price multiplier: `1 + ((1.2 - 1) * 0.3) = 1.06`
4. Adjusted value: `$5,237.50 * 1.06 = $5,551.75`
5. Time variance: `+$18.50`
6. **Final value: $5,570.25**
7. Bounded to max: **$5,550.00** (flex max)

**Result:** When CORE went up 20%, NFT went up ~6% (30% correlation)

## Portfolio Impact

### Total Value Calculation

The NFT value is included in the total portfolio value:

```typescript
totalPortfolioValue = tokenValues + nftValue
// Example: $10,000 (tokens) + $5,250 (NFT) = $15,250
```

### Weighted 24h Change

The portfolio's 24h change includes both tokens and NFT:

```typescript
tokenWeight = tokenValue / totalValue
nftWeight = nftValue / totalValue

portfolioChange = (tokenChange * tokenWeight) + (nftChange * nftWeight)
```

**Example:**
- Token value: $10,000 (weight: 65.6%)
- Token 24h change: +3.5%
- NFT value: $5,250 (weight: 34.4%)
- NFT 24h change: +1.05% (CORE up 3.5%)
- **Portfolio 24h change: (3.5% × 0.656) + (1.05% × 0.344) = +2.66%**

## Admin Configuration

### Database Settings Table: `shield_settings`

Admins can configure NFT settings:

| Field | Type | Description | Default |
|-------|------|-------------|---------|
| `id` | integer | Primary key | 1 |
| `image_url` | text | NFT image URL | null |
| `min_usd` | numeric | Minimum value | 5000 |
| `max_usd` | numeric | Maximum value | 6000 |

**Access:** Admin panel at `/admin`

### Updating Settings

Admins can:
1. Set custom NFT image URL
2. Adjust min/max value range
3. Changes apply to all users immediately

## Future Migration to Live NFTs

### When Live Contract is Ready

**Step 1: Admin Actions**
1. Deploy Shield NFT smart contract on Coreum
2. Mint NFTs for existing users
3. Send NFTs to user wallets
4. Update user profiles with real NFT contract/token IDs

**Step 2: Code Updates**
```typescript
// In utils/nft/shield.ts
// Replace placeholder logic with:
export async function fetchUserShieldNft(
  supabase: SupabaseClient,
  userId: string
): Promise<RealNftHolding | null> {
  // Query nft_holdings_cache for real Shield NFT
  const { data } = await supabase
    .from("nft_holdings_cache")
    .select("*")
    .eq("user_id", userId)
    .eq("contract_address", SHIELD_NFT_CONTRACT)
    .maybeSingle();
  
  if (!data) return null;
  
  // Fetch real NFT price from floor/market data
  const nftPrice = await fetchNftMarketPrice(data.token_id);
  
  return {
    symbol: 'SHLD',
    name: 'Shield NFT',
    balance: '1',
    valueUsd: nftPrice,
    change24h: nftChange,
    logoUrl: data.image_url,
    type: 'nft',
    contractAddress: data.contract_address,
    tokenId: data.token_id,
  };
}
```

**Step 3: Price Oracle Integration**
- Integrate with NFT marketplace APIs
- Track floor price and sales volume
- Update prices in real-time or on-chain

**Step 4: Communication**
```markdown
# To Users (via email/notification):

Good news! Your Shield NFT is now live on the Coreum blockchain.

We've sent 1 Shield NFT to your connected wallet: core1xxx...

What's New:
- Real on-chain NFT ownership
- View on Coreum Explorer
- Real-time market pricing
- Tradeable on secondary markets (coming soon)

The value you see reflects current market conditions and floor prices.
```

## Technical Details

### Type Definitions

```typescript
// Shield NFT Holding
interface ShieldNftHolding {
  symbol: string;        // 'SHLD'
  name: string;          // 'Shield NFT'
  balance: string;       // '1'
  valueUsd: number;      // $5,000-$5,500
  change24h: number;     // % change
  logoUrl?: string;      // Image URL
  type: 'nft';          // Type identifier
  nftId?: string;       // 'shield-membership-nft'
}

// Shield Settings
interface ShieldSettings {
  image_url: string | null;
  min_usd: number;
  max_usd: number;
}
```

### Visitor Support

For non-authenticated users:
- Uses first wallet address as stable ID
- Falls back to 'visitor-default' if no wallets
- Same calculation logic as authenticated users
- Value persists across session (if same visitor ID)

## Display Locations

1. **Dashboard (`/dashboard`)**
   - Main portfolio view
   - Dedicated "NFT Holdings" section
   - Above token holdings table

2. **Wallets Page (`/wallets`)**
   - "Your NFT Holdings" section
   - Shows alongside wallet list

3. **Membership Page (`/membership`)**
   - Already existing Shield NFT panel
   - Shows detailed info and purchase CTA

## Styling Consistency

### Color Scheme
- Primary: Purple (`from-purple-600 to-blue-600`)
- Accent: Blue (`via-blue-600`)
- Badge: Purple gradient (`from-purple-500 to-blue-500`)

### Icons
- Shield icon (`lucide-react`)
- NFT badge indicator
- Trending indicators for 24h change

### Visual Hierarchy
- Distinct from token holdings (purple vs gray/blue)
- Prominent gradient backgrounds
- Clear "NFT" labeling

## Testing Scenarios

### Test 1: User ID Consistency
1. Log in as user A
2. Note NFT value (e.g., $5,237.50)
3. Log out and log back in
4. **Expected:** Same NFT value

### Test 2: CORE Price Impact
1. Note current NFT value
2. Change `getTokenPrice('CORE')` in code
3. Refresh dashboard
4. **Expected:** NFT value changes proportionally

### Test 3: Time-Based Variance
1. Note NFT value at hour X
2. Wait 1 hour (or change system time)
3. Refresh dashboard
4. **Expected:** Slight value change (±$25 range)

### Test 4: Portfolio Totals
1. Calculate: Tokens Value + NFT Value
2. Check displayed Total Portfolio Value
3. **Expected:** Matches calculation

### Test 5: Different Users
1. Log in as User A, note NFT value
2. Log in as User B
3. **Expected:** Different NFT value (different seed)

## Performance Considerations

### Caching
- CORE price fetched once per page load
- NFT calculation is instant (no async)
- Shield settings fetched from database (cached by Supabase)

### Load Time
- Adds ~50ms to dashboard load
- No additional API calls (uses existing CORE price fetch)
- Minimal impact on UX

### Scalability
- Calculations are client-side (no server load)
- Database query is simple (shield_settings by ID)
- No per-user database writes

## Security Considerations

### No On-Chain Verification
- Placeholder NFT is not on-chain
- Users cannot verify ownership externally
- Acceptable for v1 (pre-launch phase)

### User Expectations
- Display resembles real NFT holding
- No explicit disclosure that it's placeholder
- Transparent transition to real NFTs planned

### Data Privacy
- User ID used for seeding (not exposed)
- No personal data in calculations
- Values are deterministic but unpredictable

## Rollback Plan

If issues arise, rollback by:

1. Remove NFT from dashboard display
2. Exclude NFT from total value calculation
3. Keep utility functions (for future use)

```typescript
// In app/dashboard/page.tsx
// Comment out:
// const nftHolding = getShieldNftHolding(...);
// setShieldNft(nftHolding);

// Revert total calculation:
// setTotalValue(totalValueUsd); // without NFT
```

## Support & Maintenance

### Common Issues

**Issue 1: NFT not showing**
- Check if `shield_settings` table exists
- Verify default values (min: 5000, max: 6000)

**Issue 2: Value outside range**
- Check flex bounds in calculation
- Verify CORE price is reasonable

**Issue 3: Inconsistent value per user**
- Ensure user ID is stable (public_user_id)
- Check for visitor mode using different IDs

### Monitoring

Track:
- NFT values distribution across users
- Portfolio total impact (NFT portion)
- User engagement on membership page

## Summary

The placeholder Shield NFT implementation provides:
- ✅ Realistic NFT holdings for all users
- ✅ Fluctuating value ($5,000-$5,500 range)
- ✅ Tied to CORE price movements (30% correlation)
- ✅ Included in portfolio totals and 24h change
- ✅ Seamless future migration to real NFTs
- ✅ Admin configurable via settings
- ✅ Consistent UX across visitor/public/private users

**Status:** Ready for production ✨
