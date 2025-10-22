# 🚀 Admin Dashboard - START HERE

## What's Done ✅

All code is complete and ready! Here's what was implemented:

1. **API Routes** - User management endpoints
2. **Admin Page UI** - Full user management interface
3. **Database Migration** - Shield member tracking (fixed SQL syntax)
4. **Documentation** - Complete guides

## What You Need to Do (5 minutes)

### 1️⃣ Create .env.local File

Create a file named `.env.local` in the root directory:

```bash
# Replace with YOUR actual credentials
ADMIN_EMAILS=your-email@example.com
ADMIN_WALLET_ADDRESSES=core1yourwalletaddress
```

**Format rules:**
- Comma-separated (NO spaces)
- Example: `ADMIN_EMAILS=admin@example.com,owner@example.com`
- You can use ONLY emails, ONLY wallets, or both

**Example .env.local:**
```bash
ADMIN_EMAILS=admin@shieldnest.com,owner@shieldnest.com
ADMIN_WALLET_ADDRESSES=core1jcas459gnu857ylephjdjlea3rkr38m0asj6gw
```

---

### 2️⃣ Run Database Migration

**Go to:** Supabase Dashboard → SQL Editor

**Copy & paste** the entire contents of:
```
supabase/migrations/20251021_add_shield_member_tracking.sql
```

**Click:** Run

**Expected:** Success message

---

### 3️⃣ Restart Server

```bash
npm run dev
```

---

### 4️⃣ Test It

**Visit:** http://localhost:3000/admin

**You should see:**
- ✅ Shield NFT Settings
- ✅ Rewards Tracking  
- ✅ **User Management** (NEW!)

**Try it:**
1. Search for a user
2. Click "Details"
3. Click "Grant Shield"

---

## Quick Verification

Run this to check your setup:
```bash
npx tsx scripts/verify-admin-setup.ts
```

---

## Help

- **Full checklist:** See `ADMIN-TODO-CHECKLIST.md`
- **Setup guide:** See `ADMIN-SETUP.md`
- **Quick guide:** See `ADMIN-QUICKSTART.md`

---

## Common Issues

### "Access Denied"
- Check `.env.local` exists and has your email/wallet
- Restart server after creating `.env.local`
- Sign in with the admin email

### Migration Error
- Make sure you copied the ENTIRE file
- The SQL syntax error is already fixed

---

**Status:** Code complete ✅ | Setup needed ⏳  
**Time needed:** 5 minutes  
**Next:** Follow steps 1-4 above 👆

