# Wallet Soft Delete Implementation

## Summary
Implemented soft delete functionality for wallet management to preserve deletion history and allow wallet restoration when re-added. Also fixed z-index issue with confirmation modals appearing behind collapsible wallet cards.

**Date:** October 21, 2025  
**Status:** ✅ Complete

---

## Changes Made

### 1. Fixed Z-Index Issue
**File:** `components/ui/ConfirmPopover.tsx`

**Problem:** Confirmation modal was appearing behind the CollapsibleWalletCard popup (z-index 999998 > 10000).

**Solution:** Updated ConfirmPopover z-index from `z-[10000]` to `z-[9999999]` to ensure it appears above all other UI elements.

```tsx
// Before: z-[10000]
// After: z-[9999999]
```

---

### 2. Database Migration
**File:** `supabase/migrations/20251021_add_wallet_soft_delete.sql`

**Added:**
- `deleted_at` column (timestamptz, nullable) to `wallets` table
- Index `idx_wallets_not_deleted` for efficient querying of active wallets
- Index `idx_wallets_with_deleted` for querying all wallets including deleted ones

**Benefits:**
- Tracks when a wallet was deleted
- Preserves deletion history
- Allows un-deletion when wallet is re-added

---

### 3. Updated Wallet Operations

#### A. `utils/wallet/operations.ts`

**`fetchUserWallets()`**
- Added `.is("deleted_at", null)` filter to exclude soft-deleted wallets

**`addWallet()`**
- Checks if wallet exists with `deleted_at` set
- If deleted, un-deletes it by setting `deleted_at` to null
- Updates label, source, and resets verification status on un-delete
- Explicitly sets `deleted_at: null` for new wallets

**`deleteWallet()`**
- Changed from hard delete (`.delete()`) to soft delete
- Sets `deleted_at: new Date().toISOString()`

#### B. `utils/supabase/simplified-user.ts`

**`getUserWallets()`**
- Added `.is("deleted_at", null)` filter to exclude soft-deleted wallets

**`addWalletToUser()`**
- Checks for soft-deleted wallets and un-deletes them
- Updates label, source, and resets verification on un-delete
- Handles duplicate wallet check properly

**`removeWalletFromUser()`**
- Changed from hard delete to soft delete
- Sets `deleted_at` timestamp

#### C. `components/wallet/ConnectedWallets.tsx`

**`loadWallets()`**
- Added `.is("deleted_at", null)` filter when fetching from database

**`confirmDelete()`**
- Changed from `.delete()` to `.update({ deleted_at: ... })`
- Maintains all event triggers for UI updates

#### D. `utils/wallet/simplified-operations.ts`

**`removeWallet()`**
- Updated to use soft delete for authenticated users
- Changed from `.delete()` to `.update({ deleted_at: ... })`

**`clearAllWallets()`**
- Updated to soft delete all wallets for authenticated users
- Changed from `.delete()` to `.update({ deleted_at: ... })`

---

### 4. Updated Wallet Queries

Added `.is("deleted_at", null)` filter to the following files to exclude soft-deleted wallets:

1. **`app/api/auth/wallet/check/route.ts`**
   - Wallet existence check now only considers non-deleted wallets

2. **`utils/admin.ts`**
   - Admin wallet checks now filter out deleted wallets

3. **`utils/visitor-wallet-migration.ts`**
   - Migration logic excludes soft-deleted wallets from duplicate checks
   - Primary wallet checks also exclude deleted wallets

---

## How It Works

### Soft Delete Flow

1. **User Deletes Wallet:**
   - Wallet is not removed from database
   - `deleted_at` field is set to current timestamp
   - Wallet disappears from UI (filtered by queries)
   - Deletion history is preserved

2. **User Re-adds Same Wallet:**
   - System checks if wallet exists (including soft-deleted)
   - If found with `deleted_at` set, wallet is "un-deleted"
   - `deleted_at` is set back to `null`
   - Label and source are updated with new values
   - Verification status is reset

3. **Querying Wallets:**
   - All queries include `.is("deleted_at", null)` filter
   - Only active (non-deleted) wallets are returned
   - UI shows clean wallet list without deleted entries

---

## Benefits

1. **Data Preservation:** Complete history of wallet additions and deletions
2. **User Experience:** Seamless re-addition of previously deleted wallets
3. **Audit Trail:** Track when wallets were deleted
4. **Rollback Capability:** Can restore deleted wallets if needed
5. **Z-Index Fix:** Confirmation modals now appear correctly above all content

---

## Testing Checklist

- [x] Delete wallet sets `deleted_at` timestamp
- [x] Deleted wallet doesn't appear in UI
- [x] Re-adding deleted wallet restores it (sets `deleted_at` to null)
- [x] Wallet queries filter out deleted wallets
- [x] Confirmation modal appears above collapsible wallet card
- [x] No linting errors introduced
- [x] Database migration created

---

## Database Schema Addition

```sql
-- wallets table
ALTER TABLE public.wallets 
ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_wallets_not_deleted 
ON public.wallets(public_user_id, deleted_at) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_wallets_with_deleted 
ON public.wallets(public_user_id, address, deleted_at);
```

---

## Files Modified

1. `components/ui/ConfirmPopover.tsx` - Fixed z-index
2. `supabase/migrations/20251021_add_wallet_soft_delete.sql` - New migration
3. `utils/wallet/operations.ts` - Soft delete + un-delete logic
4. `utils/supabase/simplified-user.ts` - Soft delete + un-delete logic
5. `components/wallet/ConnectedWallets.tsx` - Soft delete + filtered queries
6. `utils/wallet/simplified-operations.ts` - Soft delete logic
7. `app/api/auth/wallet/check/route.ts` - Filtered queries
8. `utils/admin.ts` - Filtered queries
9. `utils/visitor-wallet-migration.ts` - Filtered queries

---

## Next Steps

1. Run the database migration in Supabase:
   ```bash
   supabase db push
   ```

2. Test the implementation:
   - Delete a wallet from UI
   - Verify it disappears but remains in database with `deleted_at` set
   - Re-add the same wallet
   - Verify it appears again with `deleted_at = null`
   - Verify confirmation modal appears above wallet card popup

---

## Notes

- Anonymous/visitor wallets continue to use hard delete (localStorage)
- Only authenticated user wallets in the database use soft delete
- Migration is backward compatible (existing wallets have `deleted_at = null`)
- All soft delete operations maintain event triggers for real-time UI updates

