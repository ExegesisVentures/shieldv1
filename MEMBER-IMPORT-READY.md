# ShieldNest Member Import - Ready to Deploy

## ✅ What's Been Completed

### 1. **Database Migration Created**
- File: `supabase/migrations/20251022_add_nft_count_tracking.sql`
- Adds `shieldnest_member_nft` column to `private_users` table
- Creates index for efficient querying
- **Status**: Ready to apply

### 2. **Member Import Script Created**
- File: `scripts/import-members.ts`
- Imports all 28 members with email, passwords, wallets, and NFT counts
- Handles existing users gracefully (updates instead of failing)
- Skips members without email (5 users need wallet-only auth later)
- **Status**: Ready to run (after migration)

### 3. **Documentation Created**
- `APPLY-MIGRATION-INSTRUCTIONS.md` - How to apply the migration
- `MEMBER-IMPORT-SETUP.md` - Complete import guide
- **Status**: Ready for use

## 🚀 Next Steps (In Order)

### Step 1: Apply Database Migration ⚠️ REQUIRED FIRST

**Via Supabase Dashboard (Easiest):**

1. Open [Supabase Dashboard](https://app.supabase.com)
2. Go to **SQL Editor**
3. Click **New Query**
4. Paste this SQL:

```sql
ALTER TABLE public.private_users 
ADD COLUMN IF NOT EXISTS shieldnest_member_nft INTEGER DEFAULT 0;

COMMENT ON COLUMN public.private_users.shieldnest_member_nft IS 
  'Number of ShieldNest Member NFTs held by this private member. Used for membership tier tracking. Other NFT types will be tracked separately in the future.';

CREATE INDEX IF NOT EXISTS idx_private_users_shieldnest_nft 
ON public.private_users(shieldnest_member_nft) 
WHERE shieldnest_member_nft > 0;
```

5. Click **RUN**
6. Verify success ✅

### Step 2: Run Member Import

```bash
npx tsx scripts/import-members.ts
```

Expected result:
- ✅ 23 users imported (users with email)
- ⏭️ 5 users skipped (no email - need wallet-only auth)

### Step 3: Configure Admin Emails

Add to `.env.local`:

```bash
ADMIN_EMAILS=exegesisventures@protonmail.com,nestd@pm.me
```

Restart your dev server if running.

### Step 4: Notify Users

Send emails to all imported users with:
- Their login credentials
- Email verification link (from Supabase)
- Instructions to sign in

### Step 5: Users Complete Setup

Each user needs to:
1. ✅ Verify email (click link in inbox)
2. ✅ Sign in to ShieldNest
3. ✅ Authenticate wallets (sign message to prove ownership)
4. ✅ Change default password

## 📊 Import Summary

| Item | Count |
|------|-------|
| Total Members | 28 |
| With Email (will import) | 23 |
| Without Email (skipped) | 5 |
| Admin Users | 2 |
| NFT Holders | 24 |
| Total Wallets | 28 |

### NFT Distribution
- **5 NFTs**: 1 user (nestd@pm.me - admin)
- **3 NFTs**: 4 users (including House of exegesis - admin)
- **2 NFTs**: 6 users
- **1 NFT**: 14 users
- **0 NFTs**: 3 users

### Admin Users
1. **House of exegesis** (exegesisventures@protonmail.com) - 3 NFTs
2. **me** (nestd@pm.me) - 5 NFTs

### Skipped Users (No Email - Will Need Wallet-Only Auth)
1. adesh
2. brendo
3. John MAYBERG
4. michelle
5. randy

## 🔐 Default Credentials

- **Password for most users**: `1234567`
- **Password for nestd@pm.me**: `123456`

⚠️ Users should change these immediately after first login!

## ⚡ Quick Start Commands

```bash
# 1. Apply migration (via Supabase Dashboard - see above)

# 2. Run import
npx tsx scripts/import-members.ts

# 3. Verify import
npx tsx scripts/query-all-users.ts
```

## 🎯 What Happens After Import

1. **Auth Accounts Created**: Users can sign in with email/password
2. **Public Profiles Created**: Basic user data stored
3. **Private Profiles Created**: For NFT holders (24 users)
4. **Wallets Linked**: Associated with user accounts
5. **Email Verification Sent**: Supabase sends verification emails automatically

## 📝 Notes

- **Existing Users**: If vicnshane@icloud.com or rizelabs@pm.me already exist, they'll be updated
- **Duplicate Emails**: brianbecraft1717@icloud.com is used by 2 users - system handles this
- **Wallet Auth**: All wallets start as unverified - users must sign to authenticate
- **ShieldNest NFTs**: Tracked in `shieldnest_member_nft` column (future-proofs for other NFT types)

## ⚠️ Troubleshooting

**"Column shieldnest_member_nft not found"**
→ Run Step 1 (apply migration) first

**"User already exists"**
→ Normal - script updates existing users

**Import fails partway through**
→ Safe to re-run - script is idempotent

## 🔮 Future Features (Not Implemented Yet)

1. ✅ Wallet authentication UI with badges
2. ✅ Email verification flow
3. ✅ Password reset functionality
4. ⏳ Wallet-only authentication (for users without email)
5. ⏳ Other NFT type tracking

## 📞 Support

See `MEMBER-IMPORT-SETUP.md` for detailed troubleshooting and verification queries.

---

**Ready to proceed?** Start with Step 1 above! 🚀

