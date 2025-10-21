# Admin Setup Guide

## Overview

ShieldNest has a role-based admin system that allows designated users to access the admin dashboard and manage Shield NFT settings.

## Admin Access Methods

Admin access can be granted through **three methods** (checked in order):

### 1. Email-Based Admin Access
Add admin emails to the configuration file.

### 2. Wallet-Based Admin Access  
Add admin wallet addresses to the configuration file.

### 3. Database Metadata (Advanced)
Set admin flags directly in Supabase user metadata.

---

## Setting Up Your First Admin

### Method 1: Add Your Wallet Address (Recommended)

**Step 1:** Get your Coreum wallet address
- Connect your wallet (Keplr, Leap, or Cosmostation)
- Your address will look like: `core1abc123def456...`

**Step 2:** Add your wallet to the admin list

**File:** `utils/admin.ts`

```typescript
const ADMIN_WALLET_ADDRESSES = [
  // Add your admin wallet addresses here (lowercase)
  "core1your_wallet_address_here",  // Replace with your actual address
];
```

**Step 3:** Restart your dev server
```bash
pkill -f "next dev"
pnpm dev
```

**Step 4:** Test admin access
1. Connect your wallet at http://localhost:3000
2. Sign in or create an account
3. Navigate to http://localhost:3000/admin
4. You should see the admin dashboard!

---

### Method 2: Add Your Email Address

**Step 1:** Add your email to the admin list

**File:** `utils/admin.ts`

```typescript
const ADMIN_EMAILS = [
  // Add your admin emails here (lowercase)
  "youremail@example.com",  // Replace with your actual email
];
```

**Step 2:** Restart your dev server
```bash
pkill -f "next dev"
pnpm dev
```

**Step 3:** Test admin access
1. Sign in with your email at http://localhost:3000/sign-in
2. Navigate to http://localhost:3000/admin
3. You should see the admin dashboard!

---

### Method 3: Database Metadata (Advanced)

For existing users, you can set admin flags directly in Supabase:

**Option A: User Metadata (any user can set this for themselves)**

```sql
-- In Supabase SQL Editor
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  raw_user_meta_data,
  '{is_admin}',
  'true'::jsonb
)
WHERE email = 'youremail@example.com';
```

**Option B: App Metadata (requires service role)**

```sql
-- In Supabase SQL Editor (requires service role key)
UPDATE auth.users
SET raw_app_meta_data = jsonb_set(
  raw_app_meta_data,
  '{role}',
  '"admin"'::jsonb
)
WHERE email = 'youremail@example.com';
```

---

## Admin Dashboard Features

Once you have admin access, you can:

### Shield NFT Settings
- **Image URL:** Set the placeholder image for Shield NFT
- **Min/Max USD Value:** Set the estimated value range
- **Preview:** See how settings will appear to members
- **Real-time Updates:** Changes take effect immediately

### Access Control
- View current admin configuration
- See admin count and status
- Access denied page for non-admins

---

## Security Best Practices

### ✅ DO:
- Use wallet-based admin for production
- Keep admin list small and monitored
- Use lowercase for all addresses/emails
- Restart server after changing admin list
- Test admin access in incognito/private browsing

### ❌ DON'T:
- Don't commit admin credentials to git (if using hardcoded values)
- Don't share admin access credentials
- Don't use easily guessable email addresses
- Don't bypass authentication checks
- Don't expose admin routes publicly without protection

---

## Checking Admin Status

### Method 1: Through the UI
Navigate to `/admin` - if you see the dashboard, you're an admin. If you see "Access Denied," you're not.

### Method 2: In Browser Console
```javascript
// On any page after signing in
const supabase = createSupabaseClient();

// Check your user data
const { data: { user } } = await supabase.auth.getUser();
console.log('User:', user);

// Check wallets
const { data: wallets } = await supabase.from('wallets').select('address');
console.log('Connected wallets:', wallets);
```

---

## Troubleshooting

### "Access Denied" even though I added my wallet

**Possible causes:**
1. **Wallet not connected to your account**
   - Go to `/wallets` and connect your wallet
   - Verify it shows in the wallets list

2. **Wallet address mismatch**
   - Check the address in `utils/admin.ts` matches exactly
   - Must be lowercase
   - No extra spaces or quotes

3. **Server not restarted**
   - Kill and restart: `pkill -f "next dev" && pnpm dev`

4. **Wallet not verified**
   - Make sure you completed the wallet verification flow
   - Check the `wallets` table in Supabase

### "Access Denied" even though I added my email

**Possible causes:**
1. **Email mismatch**
   - Check spelling and case (must be lowercase in admin.ts)
   - Verify you're signed in with that email

2. **Not signed in**
   - You must be authenticated to access admin pages
   - Sign in at `/sign-in`

3. **Server not restarted**
   - Kill and restart: `pkill -f "next dev" && pnpm dev`

### Admin page shows but saving fails

**Possible causes:**
1. **Database permissions**
   - Check RLS policies on `shield_settings` table
   - Verify authenticated users can update

2. **Missing table**
   - Create `shield_settings` table if it doesn't exist
   - See schema in docs/

3. **Network issues**
   - Check browser console for errors
   - Verify API route is accessible

---

## Adding Multiple Admins

You can have multiple admins through any combination of methods:

```typescript
// In utils/admin.ts

const ADMIN_WALLET_ADDRESSES = [
  "core1abc123def456...",  // Admin 1
  "core1xyz789abc012...",  // Admin 2
  "core1mno345pqr678...",  // Admin 3
];

const ADMIN_EMAILS = [
  "admin1@example.com",
  "admin2@example.com",
  "admin3@example.com",
];
```

---

## Production Deployment

### Option 1: Environment Variables (Recommended)

Instead of hardcoding admin addresses, use environment variables:

**File:** `utils/admin.ts` (updated)
```typescript
const ADMIN_WALLET_ADDRESSES = 
  (process.env.ADMIN_WALLET_ADDRESSES?.split(',') || [])
  .map(addr => addr.trim().toLowerCase());

const ADMIN_EMAILS = 
  (process.env.ADMIN_EMAILS?.split(',') || [])
  .map(email => email.trim().toLowerCase());
```

**File:** `.env.local` (or Vercel Environment Variables)
```bash
ADMIN_WALLET_ADDRESSES=core1abc123...,core1xyz789...
ADMIN_EMAILS=admin1@example.com,admin2@example.com
```

### Option 2: Database-Driven (Advanced)

Create an `admins` table in Supabase:

```sql
CREATE TABLE admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text UNIQUE,
  email text UNIQUE,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  is_active boolean DEFAULT true
);

-- Enable RLS
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can read
CREATE POLICY "Admins can read admin list"
ON admins FOR SELECT
TO authenticated
USING (
  -- Allow if current user is already in admin list
  EXISTS (
    SELECT 1 FROM admins
    WHERE (wallet_address IN (
      SELECT address FROM wallets WHERE user_id = auth.uid()
    ) OR email = auth.email())
    AND is_active = true
  )
);
```

Then update `utils/admin.ts` to query this table.

---

## API Protection

All admin API routes are automatically protected by the `isUserAdmin()` check:

**File:** `app/api/admin/shield-settings/route.ts`
```typescript
import { isUserAdmin } from "@/utils/admin";

export async function POST(req: Request) {
  const supabase = await createSupabaseClient();
  
  // Check admin status
  const adminStatus = await isUserAdmin(supabase);
  
  if (!adminStatus) {
    return NextResponse.json(
      uiError("FORBIDDEN", "Admin access required."),
      { status: 403 }
    );
  }
  
  // Admin-only logic here...
}
```

---

## Testing Your Setup

### Quick Test Script

Create `scripts/test-admin.ts`:

```typescript
import { createSupabaseClient } from "@/utils/supabase/server";
import { isUserAdmin } from "@/utils/admin";

async function testAdmin() {
  const supabase = createSupabaseClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  console.log("Current user:", user?.email);
  
  const isAdmin = await isUserAdmin(supabase);
  console.log("Is admin:", isAdmin);
  
  const { data: wallets } = await supabase.from('wallets').select('address');
  console.log("Connected wallets:", wallets);
}

testAdmin();
```

Run:
```bash
pnpm tsx scripts/test-admin.ts
```

---

## Next Steps

1. ✅ Add your wallet address or email to `utils/admin.ts`
2. ✅ Restart the dev server
3. ✅ Test access at http://localhost:3000/admin
4. ✅ Configure Shield NFT settings
5. ✅ Add additional admins as needed
6. ✅ Set up environment variables for production

---

## Related Documentation

- **Environment Setup:** `docs/ENVIRONMENT-SETUP.md`
- **RLS Integration:** `docs/rls-integration-guide.md`
- **API Routes:** `docs/QUICK-START.md`
- **User Profiles:** `docs/VISITOR-TO-PUBLIC-FLOW.md`

---

## Need Help?

If you're still having issues:
1. Check the server logs for errors
2. Verify your Supabase connection
3. Test with a simple email-based admin first
4. Review the `isUserAdmin()` function in `utils/admin.ts`
5. Check that your wallet is properly connected and verified
