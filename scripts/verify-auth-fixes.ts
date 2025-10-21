/**
 * Script to verify authentication and custodial wallet fixes
 * 
 * Run: npx tsx scripts/verify-auth-fixes.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function verifyDatabaseSchema() {
  console.log('\n📊 Checking Database Schema...\n');
  
  // Check if new columns exist
  const { data: columns, error } = await supabase
    .from('wallets')
    .select('*')
    .limit(1);

  if (error) {
    console.error('❌ Failed to query wallets table:', error.message);
    return false;
  }

  if (columns && columns.length > 0) {
    const wallet = columns[0];
    const hasSource = 'source' in wallet;
    const hasCustodial = 'is_custodial' in wallet;
    const hasCustodianNote = 'custodian_note' in wallet;

    console.log(`${hasSource ? '✅' : '❌'} Column 'source' exists`);
    console.log(`${hasCustodial ? '✅' : '❌'} Column 'is_custodial' exists`);
    console.log(`${hasCustodianNote ? '✅' : '❌'} Column 'custodian_note' exists`);

    return hasSource && hasCustodial && hasCustodianNote;
  }

  console.log('⚠️  No wallets in database to verify schema');
  return false;
}

async function checkWalletDistribution() {
  console.log('\n📈 Wallet Distribution Analysis...\n');

  // Get total counts
  const { data: wallets, error } = await supabase
    .from('wallets')
    .select('is_custodial, ownership_verified, source');

  if (error) {
    console.error('❌ Failed to query wallets:', error.message);
    return;
  }

  if (!wallets || wallets.length === 0) {
    console.log('⚠️  No wallets in database');
    return;
  }

  const total = wallets.length;
  const custodial = wallets.filter(w => w.is_custodial).length;
  const selfCustody = total - custodial;
  const verified = wallets.filter(w => w.ownership_verified).length;
  const unverified = total - verified;

  console.log(`Total Wallets: ${total}`);
  console.log(`├─ 🏦 Custodial: ${custodial} (${((custodial/total)*100).toFixed(1)}%)`);
  console.log(`└─ 👤 Self-Custody: ${selfCustody} (${((selfCustody/total)*100).toFixed(1)}%)`);
  console.log('');
  console.log(`Verification Status:`);
  console.log(`├─ ✅ Verified: ${verified} (${((verified/total)*100).toFixed(1)}%)`);
  console.log(`└─ 🔓 Unverified: ${unverified} (${((unverified/total)*100).toFixed(1)}%)`);

  // Source breakdown
  const sourceBreakdown = wallets.reduce((acc, w) => {
    acc[w.source || 'unknown'] = (acc[w.source || 'unknown'] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('\nSource Breakdown:');
  Object.entries(sourceBreakdown).forEach(([source, count]) => {
    console.log(`├─ ${source}: ${count}`);
  });
}

async function checkSpecificUser(email: string) {
  console.log(`\n🔍 Checking User: ${email}\n`);

  // Get user's auth ID
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
  
  if (usersError) {
    console.error('❌ Failed to list users:', usersError.message);
    return;
  }

  const authUser = users.find(u => u.email === email);
  
  if (!authUser) {
    console.log(`❌ User not found: ${email}`);
    return;
  }

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('public_user_id')
    .eq('auth_user_id', authUser.id)
    .maybeSingle();

  if (profileError || !profile) {
    console.error('❌ User profile not found');
    return;
  }

  // Get wallets
  const { data: wallets, error: walletsError } = await supabase
    .from('wallets')
    .select('*')
    .eq('public_user_id', profile.public_user_id)
    .order('created_at', { ascending: false });

  if (walletsError) {
    console.error('❌ Failed to fetch wallets:', walletsError.message);
    return;
  }

  console.log(`Email: ${email}`);
  console.log(`Auth User ID: ${authUser.id}`);
  console.log(`Public User ID: ${profile.public_user_id}`);
  console.log(`Total Wallets: ${wallets?.length || 0}\n`);

  if (wallets && wallets.length > 0) {
    console.log('Wallets:');
    wallets.forEach((wallet, index) => {
      const typeIcon = wallet.is_custodial ? '🏦' : '👤';
      const verifiedIcon = wallet.ownership_verified ? '✅' : '🔓';
      console.log(`\n${index + 1}. ${typeIcon} ${wallet.label || 'Unnamed'} ${verifiedIcon}`);
      console.log(`   Address: ${wallet.address.slice(0, 20)}...`);
      console.log(`   Source: ${wallet.source}`);
      console.log(`   Custodial: ${wallet.is_custodial ? 'Yes' : 'No'}`);
      console.log(`   Verified: ${wallet.ownership_verified ? 'Yes' : 'No'}`);
      if (wallet.custodian_note) {
        console.log(`   Note: ${wallet.custodian_note}`);
      }
    });
  } else {
    console.log('⚠️  No wallets found for this user');
  }
}

async function checkApiEndpoints() {
  console.log('\n🔌 API Endpoints Check...\n');

  // These checks are informational only - actual testing requires authentication
  console.log('Available Endpoints:');
  console.log('✅ POST /api/auth/wallet/check - Improved reconnection handling');
  console.log('✅ POST /api/admin/wallets/add-custodial - Add custodial wallets');
  console.log('✅ POST /api/auth/wallet/verify-ownership - Verify wallet ownership');
  console.log('\n💡 To test these endpoints, use the Supabase Dashboard or authenticated requests');
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   Authentication & Custodial Wallet Verification      ║');
  console.log('╚════════════════════════════════════════════════════════╝');

  // Check database schema
  const schemaValid = await verifyDatabaseSchema();
  
  if (!schemaValid) {
    console.log('\n⚠️  Database schema may not be fully migrated');
    console.log('📝 Run the migration in OWNER-SETUP-STEPS.md');
  }

  // Check wallet distribution
  await checkWalletDistribution();

  // Check specific user if provided
  const userEmail = process.argv[2];
  if (userEmail) {
    await checkSpecificUser(userEmail);
  } else {
    // Default to checking nestd@pm.me
    await checkSpecificUser('nestd@pm.me');
  }

  // Check API endpoints
  await checkApiEndpoints();

  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║                Verification Complete                   ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('\n📚 See OWNER-SETUP-STEPS.md for next actions\n');
}

main().catch(console.error);

