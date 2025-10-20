# Supabase Directory Structure

This is the **main Supabase directory** for the ShieldNest project.

## 📁 Directory Structure

```
supabase/
├── config.toml                          # Main Supabase CLI configuration
├── migrations/                          # Database migrations (SQL files)
│   ├── 20251014_add_last_block_height.sql
│   ├── 20251014_user_rate_limits.sql
│   ├── 20251016_user_profile_function.sql
│   ├── 20251016_create_auto_user_profile_trigger.sql
│   └── 20251019_add_profile_image.sql
└── functions/                           # Edge Functions
    ├── get_best_rate/
    │   ├── index.ts
    │   └── supabase.toml
    ├── import_coredex_pairs/
    │   ├── index.ts
    │   └── supabase.toml
    └── refresh_rates_cache/
        ├── index.ts
        └── supabase.toml
```

## 🔧 Configuration Files

### Main Configuration
- **`config.toml`**: Main Supabase CLI configuration
  - Defines project structure
  - Configures local development settings
  - Specifies API ports and database settings
  - Contains Edge Function configurations

### Function Configurations
Each Edge Function has its own `supabase.toml` that defines:
- Function name
- JWT verification settings
- Other function-specific settings

## 📝 Migrations

All database migrations are stored in `migrations/` directory:
- Named with timestamp prefix: `YYYYMMDD_description.sql`
- Run in chronological order
- Can be applied via:
  1. Supabase CLI: `supabase db push` (from project root)
  2. Supabase Dashboard: Copy/paste SQL into SQL Editor

### Migration Order
1. `20251014_add_last_block_height.sql` - Adds block height tracking
2. `20251014_user_rate_limits.sql` - Creates rate limiting tables
3. `20251016_user_profile_function.sql` - User profile creation function
4. `20251016_create_auto_user_profile_trigger.sql` - Auto-profile trigger
5. `20251019_add_profile_image.sql` - Profile image support

## 🚀 Edge Functions

### get_best_rate
Returns cached exchange rates or fetches from VPS API.

**Endpoint**: `https://[PROJECT].supabase.co/functions/v1/get_best_rate`

**Request**:
```json
{
  "from_denom": "ucore",
  "to_denom": "ibc/...",
  "ttl_seconds": 300
}
```

### import_coredex_pairs
Imports trading pairs from CoreDEX API into the database.

**Endpoint**: `https://[PROJECT].supabase.co/functions/v1/import_coredex_pairs`

### refresh_rates_cache
Refreshes cached exchange rates for all active trading pairs.

**Endpoint**: `https://[PROJECT].supabase.co/functions/v1/refresh_rates_cache`

## 🎯 Usage

### Local Development

1. **Initialize Supabase** (if not already done):
   ```bash
   cd /Users/exe/Downloads/Cursor/shieldv1
   supabase init
   ```

2. **Start local Supabase**:
   ```bash
   supabase start
   ```

3. **Apply migrations**:
   ```bash
   supabase db push
   ```

4. **Deploy functions**:
   ```bash
   supabase functions deploy get_best_rate
   supabase functions deploy import_coredex_pairs
   supabase functions deploy refresh_rates_cache
   ```

### Production Deployment

1. **Link to remote project**:
   ```bash
   supabase link --project-ref [YOUR_PROJECT_ID]
   ```

2. **Push migrations**:
   ```bash
   supabase db push
   ```

3. **Deploy functions**:
   ```bash
   supabase functions deploy
   ```

## 📚 Related Documentation

- **Environment Setup**: `../shuieldnestorg/docs/ENVIRONMENT-SETUP.md`
- **Profile Picture Setup**: `../shuieldnestorg/docs/PROFILE-PICTURE-SETUP.md`
- **Authentication Flow**: `../shuieldnestorg/docs/AUTHENTICATION-WALLET-FLOW.md`

## ⚠️ Important Notes

1. **This is the ONLY Supabase directory** - Do not create migrations or functions elsewhere
2. **Migrations run in order** - Always use timestamp prefixes
3. **Test locally first** - Use `supabase start` for local testing before deploying
4. **Edge Functions use Deno** - Not Node.js (different import syntax)

## 🔐 Environment Variables Required

Ensure these are set in your `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## 📖 References

- [Supabase CLI Documentation](https://supabase.com/docs/guides/cli)
- [Edge Functions Guide](https://supabase.com/docs/guides/functions)
- [Database Migrations](https://supabase.com/docs/guides/cli/managing-environments)

