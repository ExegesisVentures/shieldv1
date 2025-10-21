# Environment Setup Guide

## Overview

ShieldNest requires several environment variables to function properly. This guide will help you set up your local development environment and understand what each variable does.

## Quick Start

1. **Copy the template:**
   ```bash
   cp env.template .env.local
   ```

2. **Get your Supabase credentials:**
   - Go to [Supabase Dashboard](https://app.supabase.com)
   - Select your project
   - Navigate to Settings → API
   - Copy your credentials

3. **Get your Update.dev key:**
   - Go to [Update.dev Dashboard](https://update.dev/dashboard)
   - Copy your publishable key

4. **Fill in `.env.local` with your actual values**

5. **Restart your dev server:**
   ```bash
   pnpm dev
   ```

---

## Required Environment Variables

### NEXT_PUBLIC_SUPABASE_URL
- **Required:** ✅ Yes
- **Used in:** All Supabase client files (client.ts, server.ts, middleware.ts)
- **Format:** `https://YOUR_PROJECT.supabase.co`
- **Where to find:** Supabase Dashboard → Settings → API → Project URL
- **Purpose:** Connects your app to your Supabase project

**Files using this variable:**
- `utils/supabase/client.ts` (line 5)
- `utils/supabase/server.ts` (line 8)
- `utils/supabase/middleware.ts` (line 10)
- `utils/supabase/service-role.ts` (line 14)

---

### NEXT_PUBLIC_SUPABASE_ANON_KEY
- **Required:** ✅ Yes
- **Used in:** All Supabase client files
- **Format:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (JWT token)
- **Where to find:** Supabase Dashboard → Settings → API → Project API keys → `anon` `public`
- **Purpose:** Public key for client-side Supabase operations (respects RLS policies)
- **Safe to expose:** Yes, this key is designed to be used in browser code

**Files using this variable:**
- `utils/supabase/client.ts` (line 6)
- `utils/supabase/server.ts` (line 9)
- `utils/supabase/middleware.ts` (line 11)

---

### SUPABASE_SERVICE_ROLE_KEY
- **Required:** ✅ Yes (for admin operations)
- **Used in:** Service role client for admin operations
- **Format:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (JWT token)
- **Where to find:** Supabase Dashboard → Settings → API → Project API keys → `service_role` `secret`
- **Purpose:** Server-side key that bypasses Row Level Security (RLS)
- **⚠️ NEVER expose:** This key has full database access. Keep it server-side only!

**Files using this variable:**
- `utils/supabase/service-role.ts` (line 15)
- `app/actions.ts` (used for creating user profiles)

**Use cases:**
- Creating user profiles on signup
- Admin operations that need to bypass RLS
- System-level database operations

---

### NEXT_PUBLIC_UPDATE_PUBLISHABLE_KEY
- **Required:** ✅ Yes (for billing features)
- **Used in:** Update.dev integration
- **Format:** `pk_update_...`
- **Where to find:** [Update.dev Dashboard](https://update.dev/dashboard)
- **Purpose:** Enables subscription and billing features via Update.dev

**Files using this variable:**
- `utils/update/client.ts` (line 5)
- `utils/update/server.ts` (line 5)

---

## Optional Environment Variables

### NEXT_PUBLIC_COREUM_RPC
- **Required:** ❌ No (has default)
- **Default:** `https://full-node.mainnet-1.coreum.dev:26657`
- **Purpose:** Coreum blockchain RPC endpoint
- **When to set:** Only if you want to use testnet or a custom node

**Files using this variable:**
- `utils/coreum/rpc.ts` (line 8)

---

### NEXT_PUBLIC_COREUM_REST
- **Required:** ❌ No (has default)
- **Default:** `https://full-node.mainnet-1.coreum.dev:1317`
- **Purpose:** Coreum blockchain REST endpoint
- **When to set:** Only if you want to use testnet or a custom node

**Files using this variable:**
- `utils/coreum/rpc.ts` (line 9)

---

### NEXT_PUBLIC_SITE_URL
- **Required:** ❌ No
- **Default:** `http://localhost:3000` (in local dev)
- **Purpose:** Used for absolute URLs in auth redirects
- **When to set:** If you're running on a different port or domain

**Files using this variable:**
- `scripts/test-api-routes.ts` (line 22)

---

### ADMIN_WALLET_ADDRESSES
- **Required:** ✅ Yes (for admin features)
- **Format:** Comma-separated list of Coreum wallet addresses
- **Example:** `core1xxx,core1yyy,core1zzz`
- **Purpose:** Defines which wallet addresses have admin access
- **Security:** Keep this secure - admins have elevated privileges

**Files using this variable:**
- `utils/admin.ts` - Admin authentication checks

---

### ADMIN_EMAILS
- **Required:** ✅ Yes (for admin features)
- **Format:** Comma-separated list of email addresses
- **Example:** `admin1@example.com,admin2@example.com`
- **Purpose:** Defines which email addresses have admin access (fallback)
- **Security:** Keep this secure - admins have elevated privileges

**Files using this variable:**
- `utils/admin.ts` - Admin authentication checks

---

### VERCEL_URL
- **Required:** ❌ No
- **Auto-set:** Yes (by Vercel in production)
- **Purpose:** Used for generating absolute URLs in deployed environments
- **When to set:** Never manually - Vercel sets this automatically

**Files using this variable:**
- `app/layout.ts` (line 9)
- `app/actions.ts` (line 41)

---

## Environment Files

### .env.local (Local Development)
- **Purpose:** Your personal local environment variables
- **Committed to git:** ❌ No (in .gitignore)
- **Create from:** `cp env.template .env.local`

### env.template (Template)
- **Purpose:** Template with placeholder values
- **Committed to git:** ✅ Yes
- **Purpose:** Reference for required variables

---

## Troubleshooting

### Error: "Your project's URL and Key are required to create a Supabase client!"

**Cause:** Missing `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Solution:**
1. Check that `.env.local` exists in your project root
2. Verify the variables are spelled correctly (case-sensitive!)
3. Make sure there are no quotes around the values
4. Restart your dev server after adding environment variables

---

### Error: "Missing Supabase environment variables"

**Cause:** Missing `SUPABASE_SERVICE_ROLE_KEY`

**Solution:**
1. Add your service role key to `.env.local`
2. Get it from: Supabase Dashboard → Settings → API → `service_role` key
3. ⚠️ **Warning:** Keep this key secret! Never commit it to git.

---

### Server shows 500 errors

**Cause:** Environment variables not loaded or missing

**Solution:**
1. Ensure `.env.local` is in the project root (same level as `package.json`)
2. Restart your dev server: `Ctrl+C` then `pnpm dev`
3. Check that all **Required** variables are filled in
4. Use `echo $NEXT_PUBLIC_SUPABASE_URL` to verify (won't work for non-NEXT_PUBLIC vars in terminal)

---

### Variables not updating after changes

**Cause:** Next.js caches environment variables on startup

**Solution:**
1. Stop your dev server (`Ctrl+C`)
2. Clear Next.js cache: `rm -rf .next`
3. Restart: `pnpm dev`

---

## Security Best Practices

### ✅ DO:
- Keep `.env.local` in your `.gitignore`
- Use `NEXT_PUBLIC_` prefix for client-side variables
- Store service role key securely (e.g., 1Password, Vercel env vars)
- Use different Supabase projects for development and production
- Rotate keys if accidentally exposed

### ❌ DON'T:
- Never commit `.env.local` to git
- Never expose `SUPABASE_SERVICE_ROLE_KEY` in client code
- Never share environment files via Slack/email
- Never use production keys in development
- Never hardcode sensitive values in source code

---

## Vercel Deployment

When deploying to Vercel, you'll need to add these environment variables in the Vercel Dashboard:

1. Go to your project on [Vercel](https://vercel.com)
2. Navigate to Settings → Environment Variables
3. Add each required variable for:
   - **Production** (main branch)
   - **Preview** (pull requests)
   - **Development** (optional, for `vercel dev`)

4. After adding variables, **redeploy** your application

**Note:** According to `senior-developer.md` lesson #11, Vercel doesn't automatically reload environment variables - you must manually redeploy!

---

## Database Setup

After setting up your environment variables, make sure your Supabase database is properly configured:

### Required Tables
Run the migrations in `../supabase/migrations/`:
- `public_users`
- `private_users`
- `user_profiles`
- `private_user_profiles`
- `wallets`
- `wallet_nonces`
- `shield_settings`

### Required Functions
```sql
get_public_user_id() RETURNS uuid
get_private_user_id() RETURNS uuid
```

### Enable RLS
All tables must have Row Level Security (RLS) enabled. See `docs/rls-integration-guide.md` for details.

---

## Testing Your Setup

Run the setup checker script:
```bash
pnpm tsx scripts/check-setup.ts
```

This will verify:
- ✅ All required environment variables are set
- ✅ Supabase connection works
- ✅ Database tables exist
- ✅ RLS policies are configured
- ✅ Functions are created

---

## Additional Resources

- **Quick Start:** `docs/QUICK-START.md`
- **RLS Integration:** `docs/rls-integration-guide.md`
- **Testing Guide:** `docs/TESTING-GUIDE.md`
- **Developer Notes:** `docs/developer-notes.md`
- **Senior Developer Lessons:** `senior-developer.md` (especially lesson #11)

---

## Need Help?

If you're still having issues:
1. Check the [Supabase Documentation](https://supabase.com/docs)
2. Review `senior-developer.md` for common pitfalls
3. Check the terminal output for specific error messages
4. Verify your Supabase project is active and properly configured
