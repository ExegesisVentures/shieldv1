# Testing Guide: RLS Integration

## Setup Check Results

✅ **All code files are in place**  
✅ **All dependencies installed**  
❌ **Environment variables NOT configured**

---

## 🚀 Quick Setup

### Step 1: Create Environment File

Create a file named `.env.local` in your project root:

```bash
cd /Users/exe/Downloads/Cursor/shuieldnestorg
touch .env.local
```

### Step 2: Add Your Supabase Credentials

Open `.env.local` and add:

```env
# Get these from your Supabase project settings
# https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api

NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Optional: For admin/testing operations (keep this SECRET!)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Where to find these values:**

1. Go to your Supabase Dashboard
2. Select your project
3. Click **Settings** → **API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (optional but recommended)

---

## 🧪 Running Tests

### Test 1: Setup Check

Verify environment is configured:

```bash
npx tsx scripts/check-setup.ts
```

**Expected Output:**
```
✅ Setup is COMPLETE!
🚀 Next Steps:
   - Run: npx tsx scripts/test-rls-setup.ts
```

---

### Test 2: Database Schema & RLS

Test your Supabase database setup:

```bash
npx tsx scripts/test-rls-setup.ts
```

**What it checks:**
- ✅ All required tables exist
- ✅ Helper functions (get_public_user_id, get_private_user_id)
- ✅ Table schemas have correct columns
- ✅ Shield settings accessible
- ✅ Wallet nonces table exists
- 📊 Current database statistics

**Expected Output:**
```
📋 Testing Core Tables...
✅ public_users exists
✅ private_users exists
✅ user_profiles exists
✅ private_user_profiles exists
✅ wallets exists
✅ wallet_nonces exists
✅ shield_settings exists

🔧 Testing Helper Functions...
✅ get_public_user_id() exists
✅ get_private_user_id() exists

📈 Test Summary
✅ Passed: 15/15
📊 Success Rate: 100%

🎉 All tests passed! Your database is properly configured.
```

**If wallet_nonces is missing:**

The test will show:
```
❌ wallet_nonces NOT FOUND
⚠️  IMPORTANT: You need to create the wallet_nonces table!
```

Create it with this SQL (run in Supabase SQL Editor):

```sql
CREATE TABLE wallet_nonces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nonce text UNIQUE NOT NULL,
  address text,
  expires_at timestamptz NOT NULL,
  used boolean DEFAULT false,
  used_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE wallet_nonces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read nonces"
ON wallet_nonces FOR SELECT 
TO authenticated, anon 
USING (true);

CREATE POLICY "Anyone can create nonces"
ON wallet_nonces FOR INSERT 
TO authenticated, anon 
WITH CHECK (true);

CREATE POLICY "Anyone can update nonces"
ON wallet_nonces FOR UPDATE 
TO authenticated, anon 
USING (true);
```

---

### Test 3: API Routes

Test your API endpoints (requires dev server running):

**Terminal 1 - Start Dev Server:**
```bash
pnpm dev
```

**Terminal 2 - Run API Tests:**
```bash
npx tsx scripts/test-api-routes.ts
```

**What it tests:**
- ✅ GET /api/auth/wallet/nonce - Nonce generation
- ✅ GET /api/admin/shield-settings - Shield settings read
- ✅ POST /api/admin/shield-settings - Auth protection (should fail without auth)
- ✅ POST /api/auth/wallet/verify - Input validation

**Expected Output:**
```
📡 Testing API Endpoints...

✅ GET /api/auth/wallet/nonce (200)
   🔑 Nonce: 3f8b9c2a-1d5e...
   ⏰ Expires: 2025-10-03T10:25:00.000Z

✅ GET /api/admin/shield-settings (200)
   💰 USD Range: $5000 - $6000

✅ POST /api/admin/shield-settings (no auth) (401)
   🔒 Correctly requires authentication

✅ POST /api/auth/wallet/verify (invalid) (400)
   📝 Error code: BAD_REQUEST

📈 API Test Summary
✅ Passed: 4/4
📊 Success Rate: 100%
```

---

## 🔍 Manual Database Verification

### Check User Mappings

Run in Supabase SQL Editor:

```sql
-- Check if mappings exist for auth users
SELECT 
  au.email,
  au.created_at as auth_created,
  up.public_user_id,
  pu.id as public_id
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.auth_user_id
LEFT JOIN public_users pu ON up.public_user_id = pu.id
ORDER BY au.created_at DESC
LIMIT 10;
```

**Expected:** Every auth user should have a matching public_users record via user_profiles.

### Check RLS Policies

```sql
-- List all RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

**Expected:** Policies for public_users, private_users, user_profiles, private_user_profiles, wallets.

### Test Helper Functions

```sql
-- Test as authenticated user (run in Supabase Dashboard SQL Editor while logged in)
SELECT get_public_user_id() as my_public_user_id;
SELECT get_private_user_id() as my_private_user_id;
```

---

## 🎯 End-to-End User Flow Test

### 1. Sign Up Test

**Via UI:**
1. Visit: http://localhost:3000/sign-up
2. Enter email and password
3. Click "Sign Up"
4. Should redirect to `/protected`

**Verify in Database:**
```sql
SELECT 
  au.email,
  up.public_user_id,
  pu.id
FROM auth.users au
JOIN user_profiles up ON au.id = up.auth_user_id
JOIN public_users pu ON up.public_user_id = pu.id
WHERE au.email = 'your-test-email@example.com';
```

Should return one row with matching IDs.

---

### 2. Wallet Connection Test (Manual)

**Note:** Wallet UI components are not yet built. Test via API:

```bash
# 1. Get a nonce
curl http://localhost:3000/api/auth/wallet/nonce

# Response: {"nonce":"...","expiresAt":"..."}

# 2. Sign message with wallet (manual step - use your wallet)
# Message to sign:
# Sign in to ShieldNest
# Address: core1...
# Nonce: <nonce from step 1>
# Issued: <timestamp>

# 3. Verify (replace with actual values)
curl -X POST http://localhost:3000/api/auth/wallet/verify \
  -H "Content-Type: application/json" \
  -d '{
    "address": "core1abc...",
    "signature": "...",
    "publicKey": "...",
    "nonce": "...",
    "email": "test@example.com"
  }'
```

---

## ❓ Troubleshooting

### Issue: "Table does not exist"

**Solution:** Create the missing table. See `docs/rls-integration-guide.md` for schemas.

---

### Issue: "Function does not exist"

**Solution:** Create the helper functions:

```sql
CREATE OR REPLACE FUNCTION get_public_user_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result_id uuid;
BEGIN
  SELECT public_user_id INTO result_id
  FROM user_profiles
  WHERE auth_user_id = auth.uid();
  RETURN result_id;
END;
$$;

GRANT EXECUTE ON FUNCTION get_public_user_id() TO authenticated;
```

Repeat for `get_private_user_id()` (see docs/rls-integration-guide.md).

---

### Issue: "new row violates row-level security policy"

**Causes:**
1. User not authenticated
2. user_profiles mapping doesn't exist
3. RLS policies not set up correctly

**Solution:**
1. Verify user is logged in: `SELECT auth.uid();` should return UUID
2. Check mapping exists:
   ```sql
   SELECT * FROM user_profiles WHERE auth_user_id = auth.uid();
   ```
3. Review RLS policies in `docs/rls-integration-guide.md`

---

### Issue: "Cannot read property of null"

**Cause:** `get_public_user_id()` returns null

**Solution:** Create the user_profiles mapping:
```sql
INSERT INTO user_profiles (auth_user_id, public_user_id, created_at)
VALUES (
  auth.uid(),
  '<existing-public-user-id>',
  NOW()
);
```

Or sign in again - the code now auto-creates mappings on login.

---

## 📊 Test Results Summary

After running all tests, you should have:

✅ **Setup Check:** All environment variables configured  
✅ **Database Test:** All tables and functions exist  
✅ **API Test:** All endpoints respond correctly  
✅ **Manual Verification:** User mappings working  
✅ **RLS Policies:** Active and enforcing ownership  

---

## 🎉 Next Steps

Once all tests pass:

1. **Build Wallet UI** - Create components for wallet connection
2. **Implement ADR-36 Verification** - Add crypto signature verification
3. **Add Admin Checks** - Protect shield-settings endpoint
4. **Build PMA Flow** - Private membership upgrade
5. **Add Shield NFT Verification** - Check NFT ownership
6. **Create Dashboard** - Portfolio display

See `docs/developer-notes.md` for feature roadmap.

---

## 📚 Related Documentation

- **Full Integration Guide:** `docs/rls-integration-guide.md`
- **Changelog:** `docs/CHANGELOG-RLS-INTEGRATION.md`
- **Quick Start:** `docs/QUICK-START.md`
- **Project Rules:** `.cursorrules`

---

## 🆘 Need Help?

1. Check the troubleshooting section above
2. Review `docs/rls-integration-guide.md`
3. Verify your Supabase dashboard settings
4. Check browser console for client-side errors
5. Check terminal for server-side errors

---

**Last Updated:** October 3, 2025  
**Test Scripts Version:** 1.0

