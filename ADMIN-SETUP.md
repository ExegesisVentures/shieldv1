# Admin Dashboard Setup Guide

## Overview

The admin dashboard is now fully functional with comprehensive user management capabilities. You can access it at `/admin` once you've configured your admin credentials.

## Setting Up Admin Access

Admin access is controlled by environment variables. You need to set up either **admin emails** or **admin wallet addresses** (or both) in your environment configuration.

### Environment Variables

Add these to your `.env.local` file (or your production environment variables):

```bash
# Admin Emails (comma-separated)
ADMIN_EMAILS=your-email@example.com,another-admin@example.com

# Admin Wallet Addresses (comma-separated Coreum addresses)
ADMIN_WALLET_ADDRESSES=core1xxx...,core1yyy...
```

### How Admin Authentication Works

The system checks for admin status in the following order:

1. **Email Match**: If the authenticated user's email is in `ADMIN_EMAILS`
2. **Wallet Match**: If any of the user's connected wallets is in `ADMIN_WALLET_ADDRESSES`
3. **Visitor Admin**: If a non-authenticated visitor has connected an admin wallet (view-only mode)

### Example Configuration

```bash
# For development/testing
ADMIN_EMAILS=admin@shieldnest.com,owner@shieldnest.com
ADMIN_WALLET_ADDRESSES=core1abc123...,core1def456...
```

## Admin Dashboard Features

### 1. Shield NFT Settings

Configure the placeholder Shield NFT settings:
- **Image URL**: Public URL for the Shield NFT image
- **Min/Max USD Value**: Display range for estimated value
- **Preview**: Live preview of how the NFT will appear

### 2. Custodial Wallets - Rewards Tracking

Monitor staking rewards for custodial wallets:
- **Total Rewards**: Lifetime rewards earned across all custodial wallets
- **Wallet Count**: Number of custodial wallets being tracked
- **Rewards by Wallet**: Detailed breakdown per wallet
- **Refresh**: Manually refresh rewards data from blockchain

### 3. User Management

**Search & Query Users:**
- Search by email or wallet address
- View all users with their wallet information
- See user creation dates and wallet counts

**User Actions:**
- **View Details**: See complete user profile with all wallets
- **Grant Shield Access**: Give users private member privileges (PMA + Shield NFT)
- **Revoke Shield Access**: Remove private member privileges
- **Delete User Wallets**: Soft delete (marks as deleted, retains data)

### 4. User Details Modal

Clicking "Details" on any user shows:
- Complete user information (ID, email, creation date)
- All associated wallets (active and deleted)
- Wallet details (address, label, status)
- Quick action buttons for management

## SQL Queries for Admin Reference

### Check Current Admin Users

Run this in your Supabase SQL editor to see all users with admin privileges:

```sql
SELECT 
  u.id AS user_id,
  u.email,
  COALESCE((u.raw_app_meta_data ->> 'role'), u.role) AS auth_role,
  (u.raw_app_meta_data ->> 'is_admin')::boolean AS is_admin_flag,
  (u.raw_user_meta_data ->> 'is_admin')::boolean AS is_admin_meta,
  (u.raw_app_meta_data ->> 'admin')::boolean AS admin_flag_alt,
  u.is_super_admin
FROM auth.users u
WHERE 
  COALESCE((u.raw_app_meta_data ->> 'is_admin')::boolean, false)
  OR COALESCE((u.raw_user_meta_data ->> 'is_admin')::boolean, false)
  OR COALESCE((u.raw_app_meta_data ->> 'admin')::boolean, false)
  OR lower(COALESCE((u.raw_app_meta_data ->> 'role'), u.role, '')) IN ('admin','owner','superadmin')
  OR u.is_super_admin = true
ORDER BY u.created_at DESC;
```

### Query All Users with Wallets

```sql
SELECT 
  u.id AS user_id,
  u.email,
  u.created_at AS user_created_at,
  w.id AS wallet_id,
  w.address,
  w.label,
  w.public_user_id,
  w.deleted_at,
  w.updated_at AS wallet_updated_at
FROM public.public_users u
LEFT JOIN public.wallets w ON w.public_user_id = u.id
ORDER BY u.created_at DESC, u.email ASC, w.created_at NULLS LAST;
```

### Check Shield Member Access

```sql
SELECT 
  pu.id,
  pu.email,
  up.has_signed_pma,
  up.has_shield_nft,
  up.pma_signed_at
FROM public.public_users pu
LEFT JOIN public.user_profiles up ON up.public_user_id = pu.id
WHERE up.has_signed_pma = true OR up.has_shield_nft = true;
```

## API Endpoints

The admin dashboard uses these API routes (all require admin authentication):

### User Management
- `GET /api/admin/users` - List all users (supports `?search=` parameter)
- `DELETE /api/admin/users` - Soft delete user wallets
- `GET /api/admin/users/shield-access?userId=` - Check Shield access status
- `POST /api/admin/users/shield-access` - Grant/revoke Shield access

### Shield Settings
- `GET /api/admin/shield-settings` - Get current settings
- `POST /api/admin/shield-settings` - Update settings

### Rewards
- `POST /api/admin/rewards/refresh` - Refresh rewards data

## Troubleshooting

### Admin Page Shows "Access Denied"

**Check:**
1. Your email is in `ADMIN_EMAILS` environment variable
2. Your connected wallet is in `ADMIN_WALLET_ADDRESSES` 
3. Environment variables are properly set (no extra spaces, correct format)
4. You've restarted your development server after changing env vars
5. In production, environment variables are set in your hosting platform

### Visitor Admin Mode (View-Only)

If you see a yellow warning "View-Only Mode", it means:
- You've connected an admin wallet
- But you're not authenticated (not signed in)
- You can view the admin page but cannot make changes
- **Solution**: Sign up or sign in with that wallet to get full admin access

### Users Not Loading

**Check:**
1. Database permissions (Supabase RLS policies)
2. Admin authentication is working
3. Browser console for error messages
4. Network tab for failed API requests

## Security Notes

- Admin access is server-side validated on all API routes
- Wallet addresses are case-insensitive
- Visitor admins can view but not modify
- All user deletion is "soft delete" (data retained)
- Admin actions are logged in browser console

## Quick Start Checklist

- [ ] Add your email to `ADMIN_EMAILS` in `.env.local`
- [ ] Add your wallet address to `ADMIN_WALLET_ADDRESSES` (optional)
- [ ] Restart your development server
- [ ] Navigate to `/admin`
- [ ] Verify you can see the admin dashboard
- [ ] Test user search functionality
- [ ] Configure Shield NFT settings

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify environment variables are set correctly
3. Ensure you're authenticated (signed in)
4. Check Supabase logs for database errors
5. Verify RLS policies allow admin operations

