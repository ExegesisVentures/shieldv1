# Rewards System Update Summary

## Overview
Successfully updated the historical rewards system from a 48-hour manual refresh cycle to a 3-day (72-hour) automatic update system with one-time user calculation.

---

## Key Changes

### 1. **User Experience Changes** ✨

#### Before:
- Manual refresh button visible to all users
- 24-hour rate limit between refreshes
- Users had to manually click refresh periodically
- Data could get stale between manual refreshes

#### After:
- **First-time users**: See a "Calculate Rewards" button (one-time only)
- **Existing users**: Button disappears after initial calculation
- **Auto-updates**: System updates every 3 days automatically
- **Help icon**: Shows tooltip explaining auto-update system

---

### 2. **Admin Panel Changes** 🛡️

#### Before:
- "Refresh All" button required manual admin action
- Admin had to periodically refresh custodial wallet rewards

#### After:
- "Refresh All" button **removed**
- Auto-updates every 3 days for all wallets
- Admin panel simply displays current data
- Green checkmark indicator: "✓ Auto-updates every 3 days for all user wallets"

---

### 3. **Technical Changes** ⚙️

#### File: `vercel.json`
```diff
- "schedule": "0 0 */2 * *"  // Every 2 days
+ "schedule": "0 0 */3 * *"  // Every 3 days at midnight
```

#### File: `app/api/cron/auto-update-rewards/route.ts`
```diff
- const AUTO_UPDATE_THRESHOLD = 48 * 60 * 60 * 1000; // 48 hours
+ const AUTO_UPDATE_THRESHOLD = 72 * 60 * 60 * 1000; // 72 hours (3 days)
```

#### File: `utils/coreum/rewards-history.ts`
```diff
- const MIN_REFRESH_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
- const STALENESS_THRESHOLD = 36 * 60 * 60 * 1000; // 36 hours
- const AUTO_UPDATE_THRESHOLD = 48 * 60 * 60 * 1000; // 48 hours
+ const MIN_REFRESH_INTERVAL = 72 * 60 * 60 * 1000; // 72 hours (3 days)
+ const STALENESS_THRESHOLD = 72 * 60 * 60 * 1000; // 72 hours (3 days)
+ const AUTO_UPDATE_THRESHOLD = 72 * 60 * 60 * 1000; // 72 hours (3 days)
```

#### File: `components/portfolio/PortfolioTotals.tsx`
- Added `hasRewardsData` state to track if user has calculated rewards
- Replaced `TimerRefreshButton` with conditional "Calculate Rewards" button
- Added help icon tooltip for users who have already calculated
- Button only appears if no rewards data exists

#### File: `app/admin/page.tsx`
- Removed `refreshingRewards` state variable
- Removed `handleRefreshRewards()` function
- Removed "Refresh All" button from UI
- Added auto-update indicator text

---

## User Flow

### New User Journey:
1. **Signs up** and creates profile
2. **Connects wallet** (or signs up with wallet)
3. **Sees dashboard** with "Calculate Rewards" button
4. **Clicks button once** to calculate historical rewards (5-15 minutes)
5. **System shows progress** modal with real-time updates
6. **After calculation**: Button disappears, total rewards displayed
7. **From now on**: Auto-updates every 3 days automatically

### Existing User Experience:
1. No action required
2. Rewards continue to auto-update every 3 days
3. No manual refresh button visible
4. Help icon explains auto-update system

---

## Admin Flow

### Before:
1. Admin logs in
2. Views custodial wallet rewards
3. Clicks "Refresh All" to update data
4. Waits for refresh to complete
5. Repeats periodically

### After:
1. Admin logs in
2. Views custodial wallet rewards
3. Data is automatically current (max 3 days old)
4. No manual action needed
5. Green indicator confirms auto-updates are active

---

## Benefits

✅ **Better UX**: Users only interact with system once
✅ **Less Confusion**: No rate limiting messages for existing users
✅ **Automatic**: System handles updates in background
✅ **Admin Simplicity**: No manual maintenance required
✅ **Resource Efficient**: Updates only when needed (>3 days old)
✅ **Scalable**: Works for any number of users/wallets

---

## How It Works (Technical)

### Auto-Update Cron Job:
1. **Runs every 3 days** via Vercel Cron (`0 0 */3 * *`)
2. **Fetches all active user wallets** from `wallets` table
3. **Checks `wallet_rewards_history`** for wallets >72 hours old
4. **Queries blockchain** for each stale wallet address
5. **Updates database** with new reward totals
6. **Sets `last_auto_update_at`** timestamp
7. **Continues** until all wallets are updated

### First-Time Calculation:
1. User clicks "Calculate Rewards"
2. Frontend calls `/api/coreum/user-rewards?refresh=true`
3. Backend queries blockchain for wallet address(es)
4. Aggregates all historical reward transactions
5. Stores in `wallet_rewards_history` table
6. Returns total to frontend
7. Frontend hides button, shows total

### Subsequent Updates:
- Cron job handles all future updates
- No user interaction required
- Data stays current (max 3 days old)

---

## Files Modified

1. ✅ `vercel.json` - Updated cron schedule to 3 days
2. ✅ `app/api/cron/auto-update-rewards/route.ts` - Updated threshold to 72h
3. ✅ `utils/coreum/rewards-history.ts` - Updated all constants to 72h
4. ✅ `components/portfolio/PortfolioTotals.tsx` - Changed to "Calculate Rewards" button
5. ✅ `app/admin/page.tsx` - Removed "Refresh All" button
6. ✅ `docs/AUTO-REWARDS-UPDATE.md` - Updated documentation

---

## Testing Checklist

### User Testing:
- [ ] New user sees "Calculate Rewards" button
- [ ] Button triggers blockchain query
- [ ] Progress modal displays correctly
- [ ] Total rewards appear after calculation
- [ ] Button disappears after calculation
- [ ] Help icon shows auto-update tooltip
- [ ] Existing users don't see calculation button

### Admin Testing:
- [ ] Admin panel loads rewards data
- [ ] No "Refresh All" button visible
- [ ] Green auto-update indicator displays
- [ ] Totals show correctly
- [ ] Per-wallet breakdown displays

### Cron Testing:
- [ ] Cron job can be triggered manually (via Vercel dashboard)
- [ ] Job updates wallets >72 hours old
- [ ] Job skips wallets <72 hours old
- [ ] `last_auto_update_at` timestamp updates
- [ ] Logs show success/failure counts

---

## Rollback Plan

If issues arise, you can rollback by:

1. **Quick rollback** - Revert the 5 modified files:
   ```bash
   git revert <commit-hash>
   git push
   ```

2. **Disable cron only** - Edit `vercel.json`:
   ```json
   "crons": []
   ```

3. **Re-enable manual refresh** - Restore old `PortfolioTotals.tsx` and `app/admin/page.tsx`

---

## Environment Variables

No new environment variables required. Existing variables continue to work:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CRON_SECRET` (for cron job authentication)

---

## Database Schema

No schema changes required. Using existing tables:
- `wallets` - User wallet addresses
- `wallet_rewards_history` - Cached reward totals
- `last_auto_update_at` - Timestamp for auto-updates (already exists)

---

## Deployment Notes

1. Changes are **backward compatible**
2. No migration scripts needed
3. Deploy as normal Next.js app
4. Cron job will start automatically on Vercel
5. Existing user data remains intact

---

## Success Metrics

Track these metrics to measure success:

📊 **User Metrics:**
- % of users who calculate rewards (target: >90%)
- Time from signup to first calculation (target: <1 hour)
- Users confused by system (target: <5%)

📊 **System Metrics:**
- Cron job success rate (target: >99%)
- Average query time per wallet (target: <5 minutes)
- Database storage growth (monitor)

📊 **Admin Metrics:**
- Time saved on manual refreshes (estimate: 30 min/week)
- Admin complaints about stale data (target: 0)

---

## Documentation Updates

Updated the following docs:
- ✅ `docs/AUTO-REWARDS-UPDATE.md` - Full system documentation
- ✅ `REWARDS-SYSTEM-UPDATE-SUMMARY.md` - This summary (new file)

---

## Support & Troubleshooting

### User Issues:
- **"I don't see Calculate Rewards button"** → Check if already calculated (data exists)
- **"Button stuck on Calculating..."** → Check progress modal, may take 5-15 min
- **"My rewards aren't updating"** → Check cron job logs in Vercel

### Admin Issues:
- **"Rewards seem stale"** → Check cron job execution logs
- **"Cron job failing"** → Check `CRON_SECRET` and API endpoint logs
- **"Missing wallet data"** → Verify wallet exists in `wallets` table

---

## Future Enhancements

Potential improvements for v2:

- [ ] Email notifications when rewards update
- [ ] User-configurable update frequency (1 day, 3 days, 7 days)
- [ ] Dashboard showing last update time
- [ ] Manual "Update Now" option (rate limited to 3 days)
- [ ] Retry logic for failed cron updates
- [ ] Metrics dashboard for admin

---

## Conclusion

✅ **All changes implemented successfully**
✅ **No linter errors**
✅ **Backward compatible**
✅ **Documentation updated**
✅ **Ready for deployment**

The rewards system now operates with minimal user interaction and zero admin maintenance, while keeping data current within a 3-day window.

