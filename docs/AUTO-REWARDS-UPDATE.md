# Auto-Update Rewards System

## Overview
The ShieldNest app now includes an automatic 48-hour update system for historical reward tracking. This ensures user wallet reward data stays current without requiring manual refreshes.

## How It Works

### 1. User Wallets Only
- **IMPORTANT**: The system ONLY queries and updates wallets that belong to users in our application
- Wallets are fetched from the `wallets` table (must have a user profile)
- Only active wallets are updated (where `deleted_at IS NULL`)
- This prevents querying random blockchain addresses

### 2. Blockchain Queries Are Address-Specific
- The blockchain query uses: `withdraw_rewards.delegator='<address>'`
- This means we query for ONLY that specific wallet address
- We do NOT scan blocks or find random addresses
- Each query returns ONLY transactions where that wallet claimed rewards

### 3. 48-Hour Auto-Update Schedule
- Cron job runs every 48 hours via Vercel Cron
- Checks `wallet_rewards_history` table for wallets older than 48 hours
- Only updates wallets that need updating (saves API calls)
- Updates are tracked via `last_auto_update_at` timestamp

## Database Schema

### New Column: `last_auto_update_at`
```sql
ALTER TABLE wallet_rewards_history 
ADD COLUMN last_auto_update_at timestamptz DEFAULT NULL;
```

- `last_updated_at` - Tracks ALL updates (manual + auto)
- `last_auto_update_at` - Tracks ONLY automatic updates
- This separation allows us to distinguish user-triggered vs system-triggered updates

## Components

### 1. Database Migration
- **File**: `supabase/migrations/20251021_add_auto_update_tracking.sql`
- Adds `last_auto_update_at` column to `wallet_rewards_history`
- Creates index for efficient querying

### 2. Cron API Endpoint
- **File**: `app/api/cron/auto-update-rewards/route.ts`
- **URL**: `/api/cron/auto-update-rewards`
- **Method**: GET
- **Security**: Protected by `CRON_SECRET` environment variable
- **Schedule**: Every 48 hours

#### Process Flow:
1. Verify cron secret authentication
2. Fetch all active user wallets from `wallets` table
3. Find wallets in `wallet_rewards_history` that need updating (>48 hours old)
4. For each wallet:
   - Query blockchain for that specific address
   - Aggregate reward transactions
   - Update database with new totals
   - Set `last_auto_update_at` timestamp
5. Return summary of updates

### 3. Vercel Cron Configuration
- **File**: `vercel.json`
- Cron schedule: `0 */48 * * *` (every 48 hours)

```json
{
  "crons": [
    {
      "path": "/api/cron/auto-update-rewards",
      "schedule": "0 */48 * * *"
    }
  ]
}
```

### 4. Updated Utility Functions
- **File**: `utils/coreum/rewards-history.ts`
- Added `AUTO_UPDATE_THRESHOLD` constant (48 hours)
- Enhanced documentation explaining address-specific queries

## Security

### Cron Secret
Set the `CRON_SECRET` environment variable in Vercel:
```bash
CRON_SECRET=your-secure-random-string
```

The cron endpoint requires this secret in the Authorization header:
```
Authorization: Bearer your-secure-random-string
```

### User Wallet Filtering
- Only wallets in the `wallets` table are updated
- Must have an associated user profile
- Only active wallets (not soft-deleted)

## Manual Refresh Still Available
Users can still manually refresh their rewards:
- 24-hour rate limit for manual refreshes
- 48-hour auto-update ensures data doesn't get too stale
- Balance between fresh data and API rate limiting

## Benefits

1. **User Experience**: Reward data is always reasonably current (max 48 hours old)
2. **No User Action Required**: Updates happen automatically in the background
3. **Resource Efficient**: Only updates wallets that need it (not all wallets every time)
4. **Accurate Data**: Only queries for user wallets, not random blockchain addresses
5. **Scalable**: Works efficiently even with many users/wallets

## Monitoring

Check cron job logs in Vercel dashboard:
- Navigate to your project
- Go to "Deployments" → "Functions"
- Find `/api/cron/auto-update-rewards`
- View execution logs

Logs include:
- Number of user wallets found
- Number of wallets updated
- Any errors or failures
- Execution duration

## Testing

### Test Locally
```bash
# Set environment variables
export CRON_SECRET=your-test-secret
export NEXT_PUBLIC_SUPABASE_URL=your-url
export SUPABASE_SERVICE_ROLE_KEY=your-key

# Run the cron endpoint
curl -X GET http://localhost:3000/api/cron/auto-update-rewards \
  -H "Authorization: Bearer your-test-secret"
```

### Test in Production
After deployment, you can manually trigger via Vercel dashboard or using curl:
```bash
curl -X GET https://your-domain.com/api/cron/auto-update-rewards \
  -H "Authorization: Bearer your-cron-secret"
```

## Rollback Plan

If you need to disable auto-updates:

1. **Quick Disable**: Remove the cron from `vercel.json` and redeploy
2. **Keep Migration**: The `last_auto_update_at` column is harmless if unused
3. **Revert Migration**: If needed, run:
   ```sql
   ALTER TABLE wallet_rewards_history DROP COLUMN last_auto_update_at;
   ```

## Future Enhancements

- [ ] Add email notifications for large reward updates
- [ ] Dashboard to view auto-update history
- [ ] Configurable update frequency per user
- [ ] Retry logic for failed updates
- [ ] Metrics/analytics on update success rates

