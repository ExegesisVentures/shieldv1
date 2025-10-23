# Quick Start: Custodial Wallet Management

## 🎯 What You Can Do Now

Your admin section now has **complete custodial wallet management**!

---

## 🚀 Quick Setup (3 Steps)

### 1. Mark Your First Custodial Wallet

1. Go to `/admin`
2. Scroll to "User Management" section
3. Find your user (search by email)
4. Click "View Details"
5. Click "Mark Custodial" on any wallet
6. Confirm ✅

### 2. Verify It Worked

- Scroll back to "Custodial Wallets - Rewards History"
- You should see: "Custodial Wallets: 1" (or more)
- Total rewards will show (may be 0.00 if no rewards yet)

### 3. Refresh Rewards (Optional)

- If rewards show 0.00 but you know the wallet has rewards
- Click "🔄 Refresh Now" button
- Wait 1-2 minutes
- Rewards will update from blockchain

---

## 💡 Key Features

### ✅ Per-Wallet Control
- You decide which specific wallets are custodial
- Not all wallets for a user—just the ones you choose
- Easy toggle on/off anytime

### 🟣 Visual Indicators
- **Purple "Custodial" badge** = Wallet is marked custodial
- **Purple background** = In details modal
- **Count display** = "(2 custodial)" in user list

### 📊 Rewards Tracking
- **Auto-updates** every 3 days via cron
- **Manual refresh** anytime with "🔄 Refresh Now"
- **Per-wallet breakdown** in rewards section

---

## 🎨 Where to Find Things

### Custodial Wallets Section
- **Location:** Top of admin page (after Shield NFT settings)
- **Shows:** Total rewards, wallet count, per-wallet list
- **Button:** "🔄 Refresh Now" (only shows when wallets exist)

### User Management Section  
- **Location:** Below rewards section
- **Features:** Search, filter, view details
- **Custodial Control:** In "View Details" modal

### User Details Modal
- **Open:** Click "View Details" on any user
- **Custodial Buttons:** One per wallet (active wallets only)
- **Visual:** Purple badge + background for custodial wallets

---

## 🔧 Common Tasks

### Mark Multiple Wallets as Custodial
```
1. Open user details
2. Click "Mark Custodial" on first wallet → Confirm
3. Click "Mark Custodial" on second wallet → Confirm
4. Repeat as needed
5. Close modal
6. Rewards section updates automatically
```

### Find All Users with Custodial Wallets
```
1. User Management section
2. Look for purple "Custodial" badge in wallet previews
3. Or check count: "+X more (Y custodial)"
```

### Remove Custodial Status
```
1. Open user details
2. Find wallet with purple "Custodial" badge
3. Click "Unmark Custodial" → Confirm
4. Badge disappears
5. Rewards recalculate automatically
```

---

## 🐛 Troubleshooting

### "No users found"
**Fix:** Make sure you're logged in as admin (email in ADMIN_EMAILS env var)

### "No custodial wallets found"
**Fix:** Mark at least one wallet as custodial in User Management section

### Rewards show 0.00 CORE
**Try:**
1. Click "🔄 Refresh Now" to fetch from blockchain
2. Wait 1-2 minutes for refresh to complete
3. Wallet might genuinely have 0 rewards

### Toggle button doesn't work
**Check:**
- Wallet must not be deleted (deleted wallets can't be toggled)
- You must be logged in as admin
- Check browser console for errors

---

## 📝 Database Requirements

If you get errors about missing columns, run this SQL in Supabase:

```sql
-- Add missing columns (safe to run multiple times)
ALTER TABLE public.wallets 
ADD COLUMN IF NOT EXISTS is_custodial boolean DEFAULT false;

ALTER TABLE public.wallets 
ADD COLUMN IF NOT EXISTS custodian_note text;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_wallets_custodial 
ON public.wallets(is_custodial) 
WHERE is_custodial = true;
```

---

## 🎯 What's Next?

Now that custodial wallet management is working:

1. **Mark your wallets** - Decide which wallets are custodial
2. **Refresh rewards** - Get latest blockchain data
3. **Monitor regularly** - Check rewards section periodically
4. **Adjust as needed** - Toggle custodial status anytime

---

## 📚 More Details

See `ADMIN-CUSTODIAL-WALLET-FIX.md` for:
- Complete technical documentation
- API endpoint details
- Full testing checklist
- Troubleshooting guide
- Database schema

---

## ✨ Summary

You can now:
✅ Mark/unmark specific wallets as custodial  
✅ See custodial status throughout admin UI  
✅ Track rewards only for custodial wallets  
✅ Manually refresh rewards on demand  
✅ Manage at wallet level (not user level)  

Everything just works! 🎉

