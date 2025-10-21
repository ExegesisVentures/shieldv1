# Update .env.local for Admin Access

## Add Admin Email Configuration

Add or update the following line in your `.env.local` file:

```bash
ADMIN_EMAILS=exegesisventures@protonmail.com,nestd@pm.me
```

## Full Admin Configuration (Optional)

You can also add admin wallets if needed:

```bash
# Admin emails (required)
ADMIN_EMAILS=exegesisventures@protonmail.com,nestd@pm.me

# Admin wallets (optional - for wallet-based admin access)
ADMIN_WALLET_ADDRESSES=core1e8ena8efanueweqxaf7ar88w4jn2p2c4wexeh4,core1eg7rdhf8mz8dhkxq6r2dtfkxkyds3330gkkfkj,core1fs0jp6896c5ephy5pxwrqagx2emwnswa55phyr
```

## After Updating

1. Save `.env.local`
2. Restart your development server:
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

3. Verify admin access:
   - Sign in as exegesisventures@protonmail.com or nestd@pm.me
   - Navigate to `/admin`
   - You should see the admin dashboard ✅

## Admin Wallets List

- **House of exegesis**:
  - `core1e8ena8efanueweqxaf7ar88w4jn2p2c4wexeh4`
  - `core1eg7rdhf8mz8dhkxq6r2dtfkxkyds3330gkkfkj`

- **me** (nestd@pm.me):
  - `core1fs0jp6896c5ephy5pxwrqagx2emwnswa55phyr`

## Testing Admin Access

```typescript
// In browser console after signing in
const response = await fetch('/api/admin/shield-settings');
console.log(response.status); // Should be 200 if admin, 403 if not
```

## Deploy to Vercel

Don't forget to update environment variables in Vercel as well:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add/Update `ADMIN_EMAILS`
3. Redeploy for changes to take effect

