# Admin Custodial Wallet Management - Complete Fix

## Date: October 23, 2025

## Problem Report

The admin section had three critical issues:

1. **User Management Not Showing Users**: Admin page showed "No users in the system yet" even when users existed
2. **Rewards History Empty**: Showed 0.00 CORE and 0 Custodial Wallets
3. **No Custodial Wallet Management**: No way to mark/unmark specific wallets as custodial

### User Requirements

- Need ability to toggle individual wallets as custodial (not all wallets for a user)
- Custodial status should be per-wallet, not per-user
- Rewards should only calculate for wallets explicitly marked as custodial
- Easy management interface to add/remove custodial status

---

## Solutions Implemented

### 1. Fixed API to Include Custodial Field

**File: `/app/api/admin/users/route.ts`**

**What Changed:**
- Updated wallet query to include `is_custodial` and `custodian_note` fields
- This ensures the admin page receives custodial status for all wallets

```typescript
// Before:
.select('id, address, label, deleted_at, created_at, updated_at, public_user_id')

// After:
.select('id, address, label, deleted_at, created_at, updated_at, public_user_id, is_custodial, custodian_note')
```

**Location:** Line 105

---

### 2. Created Toggle Custodial API Endpoint

**File: `/app/api/admin/wallets/toggle-custodial/route.ts` (NEW)**

**Purpose:** Allow admins to mark/unmark individual wallets as custodial

**Features:**
- Admin authentication required
- Takes `walletId`, `isCustodial` (boolean), and optional `custodianNote`
- Updates wallet's `is_custodial` status
- When marking as custodial, adds/updates `custodian_note`
- When unmarking, clears the `custodian_note`

**API Endpoint:**
```
POST /api/admin/wallets/toggle-custodial
Body: {
  walletId: string,
  isCustodial: boolean,
  custodianNote?: string
}
```

**Example Usage:**
```javascript
// Mark wallet as custodial
fetch('/api/admin/wallets/toggle-custodial', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    walletId: 'wallet-uuid',
    isCustodial: true,
    custodianNote: 'Admin marked as custodial'
  })
})
```

---

### 3. Updated Admin Page UI

**File: `/app/admin/page.tsx`**

#### Changes Made:

##### A. Updated Interface Definition (Lines 26-36)
```typescript
interface UserWallet {
  id: string;
  address: string;
  label: string | null;
  public_user_id: string;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  is_custodial: boolean | null;      // NEW
  custodian_note: string | null;      // NEW
}
```

##### B. Added Toggle Function (Lines 320-363)
```typescript
async function handleToggleCustodial(
  walletId: string, 
  currentStatus: boolean | null, 
  custodianNote?: string
) {
  // Confirms with admin
  // Calls API to toggle status
  // Refreshes users and rewards data
  // Updates selected user in modal if open
}
```

##### C. Enhanced Rewards Section (Lines 614-723)

**New Features:**
- Shows helpful message when no custodial wallets exist
- "Go to User Management" button when empty
- Manual "🔄 Refresh Now" button for on-demand updates
- Better loading states

**Empty State:**
```
No custodial wallets found
Mark wallets as custodial in the User Management section to track their rewards here.
[Go to User Management Button]
```

##### D. Updated User List View (Lines 816-839)

**Custodial Indicators:**
- Shows "Custodial" badge on first wallet if marked
- Shows count of custodial wallets in "more wallets" text
- Example: "+4 more wallets (2 custodial)"

```jsx
{user.wallets[0].is_custodial && (
  <span className="ml-2 px-2 py-0.5 text-xs bg-purple-500 text-white rounded-full">
    Custodial
  </span>
)}
```

##### E. Enhanced User Details Modal (Lines 1002-1064)

**Per-Wallet Management:**
- Each wallet shows custodial status badge
- "Mark Custodial" / "Unmark Custodial" button per wallet
- Purple background for custodial wallets
- Shows custodian note if present
- Disabled wallets cannot be toggled

```jsx
{!wallet.deleted_at && (
  <Button
    onClick={() => handleToggleCustodial(
      wallet.id, 
      wallet.is_custodial, 
      wallet.custodian_note || undefined
    )}
    className={wallet.is_custodial ? "text-red-600" : "bg-purple-500"}
  >
    {wallet.is_custodial ? "Unmark Custodial" : "Mark Custodial"}
  </Button>
)}
```

##### F. Added Refresh Rewards Function (Lines 192-218)

**Manual Refresh Capability:**
- Calls `/api/admin/rewards/refresh` to update all custodial wallet rewards
- Confirms before starting (may take time)
- Shows success/failure count
- Automatically reloads rewards data after completion

---

## Database Schema

### Wallets Table Columns

The following columns must exist in the `wallets` table:

```sql
CREATE TABLE wallets (
  id uuid PRIMARY KEY,
  public_user_id uuid NOT NULL,
  address text NOT NULL,
  label text,
  source text DEFAULT 'manual',
  ownership_verified boolean DEFAULT false,
  verified_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz,                    -- For soft deletes
  is_custodial boolean DEFAULT false,        -- KEY FIELD
  custodian_note text,                       -- Optional admin notes
  UNIQUE(public_user_id, address)
);
```

### If Columns Don't Exist

Run this migration:

```sql
-- Add is_custodial column if it doesn't exist
ALTER TABLE public.wallets 
ADD COLUMN IF NOT EXISTS is_custodial boolean DEFAULT false;

-- Add custodian_note column if it doesn't exist
ALTER TABLE public.wallets 
ADD COLUMN IF NOT EXISTS custodian_note text;

-- Create index for faster custodial queries
CREATE INDEX IF NOT EXISTS idx_wallets_custodial 
ON public.wallets(is_custodial) 
WHERE is_custodial = true;
```

---

## How to Use

### Step 1: Access Admin Dashboard
Navigate to `/admin` and log in with admin credentials.

### Step 2: Find User
Use the User Management section to search for users:
- Search by email or wallet address
- Filter by role (All Users, Admins, Private Members, Public Users, Visitors)

### Step 3: View User Details
Click "View Details" on any user to open the modal.

### Step 4: Mark Wallets as Custodial
In the user details modal:
1. Find the wallet you want to mark as custodial
2. Click "Mark Custodial" button
3. Confirm the action
4. Wallet will show purple "Custodial" badge

### Step 5: Verify Rewards
- Rewards section at top will automatically update
- Shows total rewards across all custodial wallets
- Lists each custodial wallet with individual rewards
- Can manually refresh with "🔄 Refresh Now" button

### Step 6: Unmark if Needed
To remove custodial status:
1. Open user details again
2. Click "Unmark Custodial" on the wallet
3. Confirm
4. Rewards will recalculate automatically

---

## Color Coding

### Purple = Custodial
- Purple badges indicate custodial status
- Purple background in wallet cards (user details modal)
- Purple count in user list view

### Visual Indicators:
- 🟣 **Custodial Badge**: Small purple pill on wallet cards
- 🟪 **Purple Background**: Wallet cards in details modal
- 🔢 **Count**: "(2 custodial)" text in user list

---

## API Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/users` | GET | Fetch all users with wallets |
| `/api/admin/wallets/toggle-custodial` | POST | Toggle custodial status |
| `/api/coreum/rewards-history?custodial=true` | GET | Get total custodial rewards |
| `/api/admin/rewards/refresh` | POST | Manually refresh rewards |

---

## Files Modified

1. **`/app/api/admin/users/route.ts`** - Added custodial fields to wallet query
2. **`/app/admin/page.tsx`** - Complete UI overhaul with custodial management
3. **`/app/api/admin/wallets/toggle-custodial/route.ts`** - NEW API endpoint

---

## Testing Checklist

### ✅ User Management
- [x] Admin page loads without errors
- [x] Users appear in the list
- [x] Search by email works
- [x] Search by wallet address works
- [x] Filter by role works
- [x] Pagination works
- [x] "View Details" opens modal

### ✅ Custodial Wallet Management
- [x] Can mark wallet as custodial
- [x] Can unmark wallet as custodial
- [x] Custodial badge appears on marked wallets
- [x] Custodial note is stored
- [x] Purple background shows for custodial wallets
- [x] Count shows in user list ("2 custodial")
- [x] Cannot toggle deleted wallets

### ✅ Rewards Section
- [x] Shows "No custodial wallets" when none exist
- [x] Shows total rewards when custodial wallets exist
- [x] Shows wallet count
- [x] Lists each custodial wallet with rewards
- [x] "Refresh Now" button works
- [x] Manual refresh updates data

### ✅ API Functionality
- [x] Toggle endpoint requires admin auth
- [x] Toggle endpoint validates input
- [x] Toggle endpoint updates database
- [x] Rewards API filters by is_custodial=true
- [x] User API includes custodial fields

---

## Important Notes

### Per-Wallet, Not Per-User
- Custodial status is at the **wallet level**, not user level
- A user can have both custodial and non-custodial wallets
- Only explicitly marked wallets count toward custodial rewards

### Rewards Auto-Update
- Rewards auto-update every 3 days via cron job
- Manual refresh available for on-demand updates
- Refresh may take a few minutes for many wallets

### Soft Deletes
- Deleted wallets cannot be marked/unmarked as custodial
- Existing custodial status is preserved on soft delete
- Deleted wallets do NOT count toward rewards

---

## Troubleshooting

### Users Not Showing
**Symptom:** "No users in the system yet"

**Solutions:**
1. Check if logged in as admin (email in `ADMIN_EMAILS` env var)
2. Check if admin wallet connected (address in `ADMIN_WALLET_ADDRESSES`)
3. Check browser console for API errors
4. Verify Supabase auth is working

### Rewards Show 0.00 CORE
**Symptom:** Rewards section shows 0 even with custodial wallets

**Solutions:**
1. Mark at least one wallet as custodial
2. Click "🔄 Refresh Now" to manually fetch rewards
3. Check if rewards exist in blockchain (might genuinely be 0)
4. Verify `wallet_rewards_history` table has data
5. Check wallet addresses are correct (lowercase)

### Toggle Button Not Working
**Symptom:** "Mark Custodial" button does nothing

**Solutions:**
1. Check browser console for errors
2. Verify admin authentication
3. Verify wallet exists in database
4. Check if `is_custodial` column exists in database

---

## Future Enhancements

Potential improvements for v2:

1. **Bulk Operations**: Select multiple wallets to mark as custodial at once
2. **Custodial Categories**: Different types of custodial (e.g., "Company", "Partner", "Legacy")
3. **Rewards Alerts**: Notify when custodial wallet receives rewards
4. **Export**: Download custodial wallet report as CSV
5. **History**: Track when wallets were marked/unmarked

---

## Summary

This fix provides a **complete custodial wallet management system** that:

✅ Allows admins to mark/unmark individual wallets as custodial  
✅ Shows custodial status throughout the admin interface  
✅ Calculates rewards only for custodial wallets  
✅ Provides manual refresh capability  
✅ Gives clear visual indicators (purple badges)  
✅ Works at the wallet level, not user level  

The admin now has full control over which specific wallets are tracked as custodial, with an intuitive UI and clear feedback.

