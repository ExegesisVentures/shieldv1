/**
 * Apply NFT Count Migration
 * Adds nft_count column to private_users table
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

// Create Supabase client with service role
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  console.log('🔧 Applying NFT count migration...\n');

  const migrationSQL = `
-- Add NFT count tracking to private_users table
ALTER TABLE public.private_users 
ADD COLUMN IF NOT EXISTS nft_count INTEGER DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN public.private_users.nft_count IS 
  'Number of Shield NFTs held by this private member. Used for membership tier tracking.';

-- Create index for efficient querying by NFT count
CREATE INDEX IF NOT EXISTS idx_private_users_nft_count 
ON public.private_users(nft_count) 
WHERE nft_count > 0;
`;

  try {
    // Execute the migration SQL
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      // Try direct approach if RPC doesn't work
      console.log('⚠️  RPC approach failed, trying direct SQL execution...\n');
      
      // Execute each statement separately
      const statements = [
        `ALTER TABLE public.private_users ADD COLUMN IF NOT EXISTS nft_count INTEGER DEFAULT 0`,
        `COMMENT ON COLUMN public.private_users.nft_count IS 'Number of Shield NFTs held by this private member. Used for membership tier tracking.'`,
        `CREATE INDEX IF NOT EXISTS idx_private_users_nft_count ON public.private_users(nft_count) WHERE nft_count > 0`
      ];

      for (const stmt of statements) {
        const { error: stmtError } = await supabase.rpc('exec_sql', { sql: stmt });
        if (stmtError) {
          console.error(`❌ Error executing statement:`, stmtError);
          throw stmtError;
        }
      }
    }

    console.log('✅ Migration applied successfully!\n');

    // Verify the column was added
    const { data, error: verifyError } = await supabase
      .from('private_users')
      .select('nft_count')
      .limit(0);

    if (verifyError) {
      console.error('⚠️  Could not verify column (this might be OK):', verifyError.message);
    } else {
      console.log('✅ Verified: nft_count column exists\n');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.log('\n📝 Please apply the migration manually via Supabase Dashboard:');
    console.log('   See APPLY-MIGRATION-INSTRUCTIONS.md for details\n');
    process.exit(1);
  }
}

applyMigration();

