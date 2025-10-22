# Quick Commands Reference

## Import & Query Users

### Import All Members
```bash
npm run import-members
```
Imports all 28 members with their wallets and NFT data.

### Query All Users
```bash
npm run query-users
```
Shows a table of all users with their emails, roles, NFT status, and wallets.

### Reset Admin Passwords
```bash
npm run reset-admin
```
Resets passwords and confirms emails for both admin users.

## Admin Credentials

**House of exegesis**
- Email: `exegesisventures@protonmail.com`
- Password: `1234567`
- Role: Admin
- NFTs: 3
- Wallets: 2

**me**
- Email: `nestd@pm.me`
- Password: `123456`
- Role: Admin
- NFTs: 5
- Wallets: 1

## Environment Setup

If scripts fail with "Missing environment variables", make sure `.env.local` exists with:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Admin Access

After logging in with admin credentials, you can access:
- `/admin` - Admin dashboard
- `/admin/shield-settings` - Configure Shield NFT settings

Make sure `ADMIN_EMAILS` is set in `.env.local`:
```bash
ADMIN_EMAILS=exegesisventures@protonmail.com,nestd@pm.me
```

## Status

✅ **Both admin accounts are working and can login now!**
- Emails confirmed
- Passwords reset
- Wallets linked
- Admin role assigned

You can sign in and access the admin dashboard immediately.

