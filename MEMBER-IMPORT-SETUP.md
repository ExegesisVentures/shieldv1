# Member Import Setup Guide

## 📋 Overview

This guide walks you through importing all 28 ShieldNest members into the database.

## ✅ Current Status

- ✅ Import script created (`scripts/import-members.ts`)
- ✅ Migration file created (`supabase/migrations/20251022_add_nft_count_tracking.sql`)
- ⏳ **ACTION REQUIRED**: Apply database migration
- ⏳ **Then**: Run import script

## 🔧 Step 1: Apply Database Migration

**Option A: Supabase Dashboard (Easiest)**

1. Open your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Paste this SQL:

```sql
ALTER TABLE public.private_users 
ADD COLUMN IF NOT EXISTS shieldnest_member_nft INTEGER DEFAULT 0;

COMMENT ON COLUMN public.private_users.shieldnest_member_nft IS 
  'Number of ShieldNest Member NFTs held by this private member. Used for membership tier tracking. Other NFT types will be tracked separately in the future.';

CREATE INDEX IF NOT EXISTS idx_private_users_shieldnest_nft 
ON public.private_users(shieldnest_member_nft) 
WHERE shieldnest_member_nft > 0;
```

6. Click **RUN** (or `Cmd/Ctrl + Enter`)
7. Verify you see "Success. No rows returned"

##  🚀 Step 2: Run Member Import

```bash
npm run import-members
# or
npx tsx scripts/import-members.ts
```

## 📊 What Gets Imported

### Members with Email (23 users)
- Creates auth account with password
- Creates public_user profile  
- Creates private_user profile (if NFT count > 0)
- Links wallets to account
- Sets NFT count and membership status

### Members without Email (5 users)
- **Skipped for now** - will need wallet-only authentication
- Names: adesh, brendo, John MAYBERG, michelle, randy

### Admin Users (2)
- **House of exegesis** (exegesisventures@protonmail.com)
- **me** (nestd@pm.me)

## 📧 Step 3: Configure Admin Emails

Add to your `.env.local`:

```bash
ADMIN_EMAILS=exegesisventures@protonmail.com,nestd@pm.me
```

Or update existing ADMIN_EMAILS to include these.

## 🔐 Step 4: Users Verify Emails

Each imported user needs to:

1. Check their email inbox
2. Click verification link from Supabase
3. Confirm their email address
4. Sign in with their password (default: `1234567` or `123456`)

## 🔑 Step 5: Users Authenticate Wallets

After email verification, users should:

1. Sign in to ShieldNest
2. Go to Wallets page
3. Click **"Authenticate"** button next to each wallet
4. Sign the verification message in their wallet
5. Wallet shows ✅ badge when authenticated

## 📋 Import Summary

| Category | Count |
|----------|-------|
| Total Members | 28 |
| With Email | 23 |
| Without Email (skipped) | 5 |
| Admin Users | 2 |
| NFT Holders | 24 |
| Total Wallets | 28 |

### NFT Distribution
- 5 NFTs: 1 user (nestd@pm.me)
- 3 NFTs: 4 users
- 2 NFTs: 6 users
- 1 NFT: 14 users
- 0 NFTs: 3 users

## ⚠️ Important Notes

1. **Default Passwords**: All users have password `1234567` (or `123456` for nestd@pm.me)
   - Users should change these after first login
   
2. **Email Verification**: Required before full access
   
3. **Wallet Authentication**: Required to prove wallet ownership
   
4. **Duplicate Emails**: 
   - `brianbecraft1717@icloud.com` used by both "brian b" and "brian m"
   - System creates separate accounts for each

5. **Missing Wallets**:
   - willie - wallet to be added later
   - allen wicked keidel - wallet to be added later

6. **ShieldNest Member NFTs**: Column name is `shieldnest_member_nft` (allows tracking other NFT types in future)

## 🔍 Verification

After import, check database:

```sql
-- Count imported users
SELECT COUNT(*) FROM auth.users;

-- Check NFT members
SELECT COUNT(*) FROM private_users WHERE shieldnest_member_nft > 0;

-- List all members with NFT counts
SELECT 
  au.email,
  pu.shieldnest_member_nft,
  pu.shield_nft_verified,
  pu.pma_signed
FROM auth.users au
JOIN user_profiles up ON au.id = up.auth_user_id
LEFT JOIN private_user_profiles pup ON au.id = pup.auth_user_id
LEFT JOIN private_users pu ON pup.private_user_id = pu.id
ORDER BY pu.shieldnest_member_nft DESC NULLS LAST;
```

## 🆘 Troubleshooting

### "Column shieldnest_member_nft not found"
- Migration not applied
- Run Step 1 again

### "User already exists"
- Script handles this gracefully
- Updates existing user data instead

### "Email verification not sent"
- Check Supabase email settings
- Verify SMTP configuration

## 📝 Next Steps

1. ✅ Apply migration (Step 1)
2. ✅ Run import (Step 2)  
3. ✅ Configure admin emails (Step 3)
4. 📧 Notify users to verify emails
5. 🔑 Users authenticate wallets
6. 🎉 All members ready!

