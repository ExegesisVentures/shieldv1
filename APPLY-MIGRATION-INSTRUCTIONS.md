# Apply Database Migration Instructions

## ⚠️ IMPORTANT: Run This Migration First

Before importing members, you need to add the `shieldnest_member_nft` column to the `private_users` table.

## Option 1: Via Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the following SQL:

```sql
-- Add ShieldNest Member NFT tracking to private_users table
ALTER TABLE public.private_users 
ADD COLUMN IF NOT EXISTS shieldnest_member_nft INTEGER DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN public.private_users.shieldnest_member_nft IS 
  'Number of ShieldNest Member NFTs held by this private member. Used for membership tier tracking. Other NFT types will be tracked separately in the future.';

-- Create index for efficient querying by ShieldNest Member NFT count
CREATE INDEX IF NOT EXISTS idx_private_users_shieldnest_nft 
ON public.private_users(shieldnest_member_nft) 
WHERE shieldnest_member_nft > 0;
```

5. Click **Run** or press `Cmd+Enter`
6. Verify success message

## Option 2: Via SQL File

The migration file is located at:
`supabase/migrations/20251022_add_nft_count_tracking.sql`

You can apply it using Supabase CLI (if configured):
```bash
supabase db push
```

## After Migration

Once the migration is complete, run the import script:

```bash
npm run import-members
# or
npx tsx scripts/import-members.ts
```

## Verification

To verify the column was added successfully:

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'private_users' 
  AND column_name = 'shieldnest_member_nft';
```

Expected result: Should return 1 row showing the `shieldnest_member_nft` column.

