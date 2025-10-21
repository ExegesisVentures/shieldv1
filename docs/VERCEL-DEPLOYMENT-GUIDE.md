# Vercel Deployment Guide

## Environment Variables Setup

When deploying ShieldNest to Vercel, you **must** configure the following environment variables in your Vercel project settings:

### Required Variables

Navigate to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

#### 1. Supabase Configuration (CRITICAL)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Where to get these:**
- Go to [Supabase Dashboard](https://app.supabase.com)
- Select your project → Settings → API
- Copy the URL and keys

**Impact if missing:**
- ❌ User authentication won't work
- ❌ Wallet connections won't persist
- ❌ Portfolio data won't save
- ⚠️ App will run in "anonymous mode" only

#### 2. Admin Configuration

```bash
ADMIN_WALLET_ADDRESSES=core1xxx,core1yyy,core1zzz
ADMIN_EMAILS=admin@example.com
```

**Impact if missing:**
- ❌ Admin dashboard won't work
- ❌ Shield NFT settings can't be updated

#### 3. Site URL (Auto-set by Vercel)

```bash
NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app
```

**Note:** Vercel automatically sets this via `VERCEL_URL`. Only override if you have a custom domain.

#### 4. Chat API (Optional)

```bash
NEXT_PUBLIC_CHAT_API_URL=https://chat.shieldnest.org
```

**Impact if missing:**
- ⚠️ Chat will attempt to use default endpoint
- May show connection errors if endpoint is unreachable

### Optional Variables

#### CoreDEX API (Has Production Defaults)

```bash
NEXT_PUBLIC_COREDEX_API=https://coredexapi.shieldnest.org/api
NEXT_PUBLIC_COREDEX_WS=wss://coredexapi.shieldnest.org/api/ws
```

**Default:** Production CoreDEX endpoint is used if not set

#### CoinGecko API Key

```bash
NEXT_PUBLIC_COINGECKO_API_KEY=CG-your-api-key
```

**Impact if missing:**
- ⚠️ Falls back to last cached prices
- ⚠️ Price updates may be slower

---

## Deployment Checklist

### Before Deploying

- [ ] All required environment variables are set in Vercel
- [ ] Supabase project is running and accessible
- [ ] Database migrations have been applied
- [ ] Test environment variables in Preview deployment first

### After Deploying

1. **Test Authentication**
   - Sign up with email
   - Verify magic link works
   - Test wallet connection

2. **Verify Supabase Connection**
   - Check browser console for "placeholder.supabase.co" errors
   - Should see real Supabase URL in network requests

3. **Test Core Features**
   - Portfolio displays correctly
   - Token prices load
   - Wallet connections persist after refresh

4. **Check Admin Access**
   - Admin users can access `/admin` route
   - Shield NFT settings are editable

---

## Troubleshooting

### Issue: "Supabase environment variables are not configured"

**Symptoms:**
```
Supabase environment variables are not configured. Using placeholder values.
placeholder.supabase.co/rest/v1/... Failed to load resource
```

**Fix:**
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Redeploy the application
4. Clear browser cache and reload

### Issue: "Mixed Content Error" for Chat API

**Symptoms:**
```
Mixed Content: The page at 'https://...' was loaded over HTTPS, 
but requested an insecure resource 'http://...'
```

**Fix:**
- Set `NEXT_PUBLIC_CHAT_API_URL` to use HTTPS endpoint
- Or disable chat feature until HTTPS endpoint is available

### Issue: Fallback Prices ($0.15 for CORE)

**This is actually NORMAL behavior!**

The price system works in stages:
1. **Initial Load:** Shows static fallback ($0.15 for CORE)
2. **Background Fetch:** Fetches real prices from CoreDEX API
3. **Update:** Updates to real price ($0.089938 for CORE)
4. **Cache:** Saves to localStorage for next visit

**Expected logs:**
```
📌 [Initial Fallback] CORE: $0.150000 (first visit)
✅ [Batch Prices] CORE: $0.089938
💾 [Fallback Updated] CORE: $0.089938 (-1.04%)
```

**Only a problem if:**
- Price stays at $0.15 after 5+ seconds
- See network errors when fetching prices
- CoreDEX API is unreachable

---

## Testing Environment Variables Locally

Create a `.env.local` file:

```bash
cp env.template .env.local
```

Then fill in your values. **Never commit `.env.local` to git!**

---

## Security Notes

- ✅ `NEXT_PUBLIC_*` variables are safe to expose in browser
- ❌ **NEVER** expose `SUPABASE_SERVICE_ROLE_KEY` in client code
- ❌ **NEVER** commit `.env.local` to version control
- ✅ Use Vercel's encrypted environment variables for production

---

## Quick Setup Commands

### 1. Set Variables via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
```

### 2. Deploy

```bash
# Deploy to production
vercel --prod

# Or push to main branch (auto-deploy)
git push origin main
```

---

## Support

If you're still having issues:
1. Check the [Supabase Dashboard](https://app.supabase.com) for connection issues
2. Review Vercel deployment logs
3. Check browser console for detailed error messages

