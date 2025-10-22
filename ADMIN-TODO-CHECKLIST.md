# Admin Dashboard - Setup Checklist

## ✅ Already Completed

- [x] Created `/app/api/admin/users/route.ts` - User query & delete API
- [x] Created `/app/api/admin/users/shield-access/route.ts` - Shield access API  
- [x] Updated `/app/admin/page.tsx` - Added user management UI
- [x] Created migration file with Shield member tracking
- [x] Fixed migration SQL syntax error (removed IF NOT EXISTS from CREATE POLICY)
- [x] Created documentation (ADMIN-SETUP.md, ADMIN-QUICKSTART.md, etc.)

---

## 🚨 STILL TODO - Do These Now!

### Step 1: Create .env.local File ⏱️ 1 minute

Create a file called `.env.local` in the root directory with your admin credentials:

```bash
# Add your actual email addresses
ADMIN_EMAILS=your-email@example.com

# Add your actual Coreum wallet addresses  
ADMIN_WALLET_ADDRESSES=core1yourwalletaddress
```

**Example:**
```bash
ADMIN_EMAILS=admin@shieldnest.com,owner@shieldnest.com
ADMIN_WALLET_ADDRESSES=core1jcas459gnu857ylephjdjlea3rkr38m0asj6gw
```

**Notes:**
- Use comma-separated (NO spaces around commas)
- You can use ONLY emails, ONLY wallets, or both
- This file is already in .gitignore (won't be pushed to git)

---

### Step 2: Run Database Migration ⏱️ 2 minutes

**Option A: Using Supabase CLI (if installed)**
```bash
supabase db push
```

**Option B: Using Supabase Dashboard**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to SQL Editor
4. Copy the ENTIRE contents of:
   `supabase/migrations/20251021_add_shield_member_tracking.sql`
5. Paste into SQL Editor
6. Click "Run"

**Expected Result:**
- Success message
- No errors

**Verify it worked:**
```sql
-- Run this query in SQL Editor:
SELECT column_name 
FROM information_schema.columns
WHERE table_name = 'user_profiles' 
  AND column_name IN ('has_signed_pma', 'has_shield_nft', 'pma_signed_at');
```
Should return 3 rows.

---

### Step 3: Restart Your Development Server ⏱️ 30 seconds

```bash
# Stop current server (Ctrl+C)
# Then restart:
npm run dev
```

**Why?** Environment variables only load on server start.

---

### Step 4: Test Admin Page ⏱️ 2 minutes

**4a. Access the page:**
```
Navigate to: http://localhost:3000/admin
```

**Expected:**
- ✅ You see the admin dashboard (NOT "Access Denied")
- ✅ Shield NFT Settings section
- ✅ Rewards Tracking section  
- ✅ **User Management section** (NEW!)

**If you see "Access Denied":**
- Check your .env.local file exists
- Verify your email/wallet is correct
- Make sure you restarted the server
- Try signing in with the admin email

---

**4b. Test User Search:**
1. Scroll to "User Management" section
2. Type anything in the search box
3. Click "Search"

**Expected:**
- ✅ Loading spinner appears
- ✅ Users list shows (or "No users found")

---

**4c. Test User Details:**
1. Click "Details" on any user
2. Modal should appear with user info

**Expected:**
- ✅ See user email, ID, creation date
- ✅ See all wallets (if any)
- ✅ See action buttons

---

### Step 5: Grant Shield Access to Test User ⏱️ 1 minute

1. Find a user in the list (or search for one)
2. Click "Grant Shield" button
3. Confirm in dialog
4. Wait for success message

**Expected:**
- ✅ Green success message appears
- ✅ User list refreshes

**Verify in database:**
```sql
SELECT 
  pu.email,
  up.has_signed_pma,
  up.has_shield_nft,
  up.pma_signed_at
FROM public.public_users pu
JOIN public.user_profiles up ON up.public_user_id = pu.id
WHERE up.has_signed_pma = true;
```

---

## 📋 Quick Verification Checklist

Run through this list:

- [ ] `.env.local` file created with admin credentials
- [ ] Migration ran successfully in Supabase
- [ ] Server restarted
- [ ] Can access `/admin` page (not Access Denied)
- [ ] See "User Management" section
- [ ] Search bar works
- [ ] Can click "Details" on a user
- [ ] Modal opens with user info
- [ ] Can grant Shield access
- [ ] Success message appears

---

## 🆘 Troubleshooting

### "Access Denied" at /admin

**Check:**
```bash
# Does .env.local exist?
ls -la .env.local

# What's in it?
cat .env.local

# Is it formatted correctly?
# Should be: ADMIN_EMAILS=email@example.com (no spaces)
```

**Fix:**
1. Make sure .env.local exists in project root
2. Check spelling: `ADMIN_EMAILS` (not ADMIN_EMAIL)
3. No spaces around `=` or `,`
4. Restart server after changes

---

### Migration Error

**If you see policy errors:**
The fixed version (Step 1 above) should work. If still failing:

```sql
-- Manually drop and recreate policies:
DROP POLICY IF EXISTS "Users can read own shield access" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own shield access" ON public.user_profiles;

-- Then run the rest of the migration
```

---

### "No users found"

**Check:**
1. Do you have users in your database?
2. Run this query:
```sql
SELECT COUNT(*) FROM public.public_users;
```

3. If 0, create a test user by signing up
4. Refresh admin page

---

## 🎯 Current Status

**Code:** ✅ Complete  
**Migration:** ⚠️ Need to run  
**Environment:** ⚠️ Need to configure  
**Testing:** ⏳ Pending  

---

## ⏭️ After Setup Complete

Once everything works, you can:

1. **Search users** by email or wallet
2. **Grant Shield access** with one click
3. **Revoke Shield access** easily
4. **View user details** including all wallets
5. **Soft delete** user wallets if needed

All without writing SQL queries! (But you still can if you want to)

---

**Total Estimated Time:** 5-7 minutes  
**Difficulty:** Easy  
**Ready to go!** Just follow Steps 1-5 above. 🚀

