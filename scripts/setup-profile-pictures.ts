/**
 * Setup Script for Profile Pictures Feature
 * 
 * This script sets up the Supabase Storage bucket and policies
 * for the profile pictures feature.
 * 
 * Run: npx tsx scripts/setup-profile-pictures.ts
 * 
 * File: shuieldnestorg/scripts/setup-profile-pictures.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nPlease set these in your .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupProfilePictures() {
  console.log('🚀 Setting up Profile Pictures feature...\n');

  // Step 1: Create Storage Bucket
  console.log('📦 Step 1: Creating storage bucket...');
  try {
    const { data: buckets, error: listError } = await supabase
      .storage
      .listBuckets();

    if (listError) {
      console.error('❌ Error listing buckets:', listError.message);
      return;
    }

    const bucketExists = buckets?.some(b => b.name === 'profile-pictures');

    if (bucketExists) {
      console.log('✅ Bucket "profile-pictures" already exists');
    } else {
      const { data, error } = await supabase
        .storage
        .createBucket('profile-pictures', {
          public: false,
          fileSizeLimit: 5242880, // 5MB
          allowedMimeTypes: [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'image/webp'
          ]
        });

      if (error) {
        console.error('❌ Error creating bucket:', error.message);
        return;
      }

      console.log('✅ Created bucket "profile-pictures"');
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return;
  }

  // Step 2: Add profile_image_url column to public_users
  console.log('\n📝 Step 2: Adding profile_image_url column to public_users...');
  try {
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.public_users 
        ADD COLUMN IF NOT EXISTS profile_image_url text;
        
        COMMENT ON COLUMN public.public_users.profile_image_url IS 
          'URL to user profile picture stored in Supabase Storage (profile-pictures bucket)';
      `
    });

    if (error) {
      // Try alternative approach using direct query
      const { error: altError } = await supabase
        .from('public_users')
        .select('profile_image_url')
        .limit(1);

      if (altError && altError.message.includes('does not exist')) {
        console.log('⚠️  Column does not exist. Please run the migration manually:');
        console.log('   ../supabase/migrations/20251019_add_profile_image.sql');
      } else {
        console.log('✅ Column "profile_image_url" already exists or migration needed');
      }
    } else {
      console.log('✅ Column "profile_image_url" added successfully');
    }
  } catch (error) {
    console.log('⚠️  Could not verify column. Please run migration manually.');
  }

  // Step 3: Instructions for Storage Policies
  console.log('\n🔐 Step 3: Storage Policies Setup');
  console.log('   Storage policies must be set up manually in Supabase Dashboard.');
  console.log('   Follow these steps:\n');
  console.log('   1. Go to: https://supabase.com/dashboard/project/[your-project]/storage/policies');
  console.log('   2. Click on "profile-pictures" bucket');
  console.log('   3. Add the following policies:\n');
  
  console.log('   📤 INSERT Policy: "Users can upload their own profile pictures"');
  console.log('      Target: authenticated');
  console.log('      Definition:');
  console.log('      (bucket_id = \'profile-pictures\'::text)');
  console.log('      AND ((storage.foldername(name))[1] = (auth.uid())::text)\n');

  console.log('   👁️  SELECT Policy: "Users can view their own profile pictures"');
  console.log('      Target: authenticated');
  console.log('      Definition:');
  console.log('      (bucket_id = \'profile-pictures\'::text)');
  console.log('      AND ((storage.foldername(name))[1] = (auth.uid())::text)\n');

  console.log('   ✏️  UPDATE Policy: "Users can update their own profile pictures"');
  console.log('      Target: authenticated');
  console.log('      Definition:');
  console.log('      (bucket_id = \'profile-pictures\'::text)');
  console.log('      AND ((storage.foldername(name))[1] = (auth.uid())::text)\n');

  console.log('   🗑️  DELETE Policy: "Users can delete their own profile pictures"');
  console.log('      Target: authenticated');
  console.log('      Definition:');
  console.log('      (bucket_id = \'profile-pictures\'::text)');
  console.log('      AND ((storage.foldername(name))[1] = (auth.uid())::text)\n');

  // Step 4: Verify RLS on public_users
  console.log('🔒 Step 4: Verifying RLS on public_users table...');
  try {
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        -- Check if update policy exists for public_users
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'public_users' 
            AND policyname = 'Users can update their own profile'
          ) THEN
            -- Create policy using the get_public_user_id() function
            EXECUTE 'CREATE POLICY "Users can update their own profile"
              ON public.public_users
              FOR UPDATE
              TO authenticated
              USING (id = get_public_user_id())
              WITH CHECK (id = get_public_user_id())';
            RAISE NOTICE 'Created RLS policy for updating public_users';
          ELSE
            RAISE NOTICE 'RLS policy already exists for public_users';
          END IF;
        END $$;
      `
    });

    if (error) {
      console.log('⚠️  Could not verify RLS. Please check manually in Supabase Dashboard.');
    } else {
      console.log('✅ RLS policies verified');
    }
  } catch (error) {
    console.log('⚠️  Could not verify RLS. Please check manually.');
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('✅ Setup Complete!\n');
  console.log('Next Steps:');
  console.log('1. Set up storage policies manually (see instructions above)');
  console.log('2. Run the migration: ../supabase/migrations/20251019_add_profile_image.sql');
  console.log('3. Test the feature at: http://localhost:3000/settings');
  console.log('\nFor detailed instructions, see:');
  console.log('   docs/PROFILE-PICTURE-SETUP.md');
  console.log('='.repeat(60) + '\n');
}

// Run the setup
setupProfilePictures().catch(error => {
  console.error('❌ Setup failed:', error);
  process.exit(1);
});

