# Admin Dashboard - Quick Start Guide

## ⚡ Get Started in 3 Minutes

### Step 1: Set Admin Credentials (1 min)

Add these lines to your `.env.local` file:

```bash
# Replace with YOUR email/wallet addresses
ADMIN_EMAILS=your-email@example.com
ADMIN_WALLET_ADDRESSES=core1your-wallet-address
```

**Example:**
```bash
ADMIN_EMAILS=admin@shieldnest.com,owner@shieldnest.com
ADMIN_WALLET_ADDRESSES=core1jcas459gnu857ylephjdjlea3rkr38m0asj6gw
```

### Step 2: Run Database Migration (1 min)

**Option A: Supabase CLI (if installed)**
```bash
supabase db push
```

**Option B: Supabase Dashboard**
1. Go to Supabase Dashboard → SQL Editor
2. Open file: `supabase/migrations/20251021_add_shield_member_tracking.sql`
3. Copy entire contents
4. Paste into SQL Editor
5. Click "Run"

### Step 3: Restart Server (30 seconds)

```bash
# Stop your server (Ctrl+C)
# Start it again
npm run dev
```

### Step 4: Access Admin Dashboard (30 seconds)

Open in browser: `http://localhost:3000/admin`

You should see:
✅ Shield NFT Settings  
✅ Rewards Tracking  
✅ **User Management** (NEW!)  

---

## 🎯 Quick Actions

### Search for a User
1. Go to `/admin`
2. Scroll to "User Management"
3. Type email or wallet address in search bar
4. Click "Search"

### Grant Shield Member Access
1. Find user in list
2. Click "Grant Shield" button
3. Confirm

### View User Details
1. Click "Details" on any user
2. See all wallets and info
3. Perform actions from modal

---

## 🔍 Verify It's Working

### Test 1: Access Admin Page
```
Navigate to: /admin
Expected: See full admin dashboard (not "Access Denied")
```

### Test 2: Search Users
```
1. Type any text in search bar
2. Click "Search"
Expected: See filtered user list
```

### Test 3: Check Database
Run in Supabase SQL Editor:
```sql
-- Should return 3 rows
SELECT column_name 
FROM information_schema.columns
WHERE table_name = 'user_profiles' 
  AND column_name IN ('has_signed_pma', 'has_shield_nft', 'pma_signed_at');
```

---

## 🚨 Troubleshooting

### "Access Denied" Error
```bash
# Check environment variables
cat .env.local | grep ADMIN

# Make sure they're set correctly (no spaces, comma-separated)
# Restart server after changing
```

### Users Not Showing
```
1. Open browser console (F12)
2. Look for errors
3. Check Network tab for failed API calls
4. Verify you're signed in with admin email
```

### Migration Failed
```sql
-- Check if columns exist
SELECT column_name 
FROM information_schema.columns
WHERE table_name = 'user_profiles';

-- If missing, run migration again manually
```

---

## 📝 Example: Complete First-Time Setup

```bash
# 1. Edit .env.local
echo "ADMIN_EMAILS=admin@example.com" >> .env.local
echo "ADMIN_WALLET_ADDRESSES=core1abc..." >> .env.local

# 2. Run migration (if using Supabase CLI)
supabase db push

# 3. Restart dev server
npm run dev

# 4. Open browser
open http://localhost:3000/admin
```

---

## ✅ Success Checklist

After setup, you should be able to:

- [ ] Access `/admin` page without "Access Denied"
- [ ] See "User Management" section
- [ ] Search for users by email
- [ ] Search for users by wallet address
- [ ] Click "Details" to view user info
- [ ] Click "Grant Shield" to give access
- [ ] See user's wallets in detail view

---

## 📚 Need More Help?

- **Full Setup Guide:** See `ADMIN-SETUP.md`
- **Implementation Details:** See `ADMIN-IMPLEMENTATION-COMPLETE.md`
- **SQL Queries:** Both docs have useful examples

---

**Estimated Time:** 3 minutes  
**Difficulty:** Easy  
**Status:** Ready to use!

