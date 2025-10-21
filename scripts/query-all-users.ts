/**
 * Query All Users Script
 * Retrieves all users with their emails, roles, and Shield NFT status
 */

import { createClient } from '@supabase/supabase-js';

// Load environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL:', !!SUPABASE_URL);
  console.error('   - SUPABASE_SERVICE_ROLE_KEY:', !!SUPABASE_SERVICE_ROLE_KEY);
  process.exit(1);
}

// Create Supabase client with service role
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Admin configuration
const ADMIN_WALLET_ADDRESSES: string[] = (
  process.env.ADMIN_WALLET_ADDRESSES || ""
)
  .split(",")
  .map(addr => addr.trim().toLowerCase())
  .filter(Boolean);

const ADMIN_EMAILS: string[] = (
  process.env.ADMIN_EMAILS || ""
)
  .split(",")
  .map(email => email.trim().toLowerCase())
  .filter(Boolean);

interface UserData {
  auth_user_id: string;
  email: string | null;
  email_confirmed: boolean;
  public_user_id: string | null;
  private_user_id: string | null;
  shield_nft_verified: boolean;
  pma_signed: boolean;
  role: string;
  wallet_addresses: string[];
  created_at: string;
}

async function checkAdminStatus(
  email: string | null,
  userMetadata: any,
  appMetadata: any,
  walletAddresses: string[]
): Promise<string> {
  // Check email
  if (email && ADMIN_EMAILS.includes(email.toLowerCase())) {
    return 'Admin (Email)';
  }

  // Check user metadata
  if (userMetadata?.is_admin === true) {
    return 'Admin (Metadata)';
  }

  // Check app metadata
  if (appMetadata?.role === 'admin') {
    return 'Admin (App)';
  }

  // Check wallet addresses
  const hasAdminWallet = walletAddresses.some(addr => 
    ADMIN_WALLET_ADDRESSES.includes(addr.toLowerCase())
  );
  if (hasAdminWallet) {
    return 'Admin (Wallet)';
  }

  // Check membership level
  return 'User';
}

async function determineRole(user: any, publicUserId: string | null, privateUserId: string | null, shieldNftVerified: boolean, pmaSigned: boolean): Promise<string> {
  const walletAddresses: string[] = [];

  // Get user's wallet addresses
  if (publicUserId) {
    const { data: wallets } = await supabase
      .from('wallets')
      .select('address')
      .eq('public_user_id', publicUserId)
      .is('deleted_at', null);
    
    if (wallets) {
      walletAddresses.push(...wallets.map(w => w.address));
    }
  }

  // Check admin status first
  const adminStatus = await checkAdminStatus(
    user.email,
    user.raw_user_meta_data,
    user.raw_app_meta_data,
    walletAddresses
  );

  if (adminStatus.startsWith('Admin')) {
    return adminStatus;
  }

  // Check membership level
  if (privateUserId && shieldNftVerified && pmaSigned) {
    return 'Private Member';
  }

  if (publicUserId) {
    return 'Public User';
  }

  return 'Visitor';
}

async function getAllUsers(): Promise<UserData[]> {
  console.log('📊 Querying all users from database...\n');

  // Get all auth users
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

  if (authError) {
    console.error('❌ Error fetching auth users:', authError);
    throw authError;
  }

  console.log(`Found ${authUsers.users.length} users in auth.users\n`);

  const userData: UserData[] = [];

  for (const user of authUsers.users) {
    // Get user profile mapping
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('public_user_id')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    // Get private user profile mapping
    const { data: privateProfile } = await supabase
      .from('private_user_profiles')
      .select('private_user_id')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    // Get private user details if exists
    let shieldNftVerified = false;
    let pmaSigned = false;

    if (privateProfile?.private_user_id) {
      const { data: privateUser } = await supabase
        .from('private_users')
        .select('shield_nft_verified, pma_signed')
        .eq('id', privateProfile.private_user_id)
        .maybeSingle();

      if (privateUser) {
        shieldNftVerified = privateUser.shield_nft_verified || false;
        pmaSigned = privateUser.pma_signed || false;
      }
    }

    // Get wallet addresses
    const walletAddresses: string[] = [];
    if (userProfile?.public_user_id) {
      const { data: wallets } = await supabase
        .from('wallets')
        .select('address')
        .eq('public_user_id', userProfile.public_user_id)
        .is('deleted_at', null);
      
      if (wallets) {
        walletAddresses.push(...wallets.map(w => w.address));
      }
    }

    // Determine role
    const role = await determineRole(
      user,
      userProfile?.public_user_id || null,
      privateProfile?.private_user_id || null,
      shieldNftVerified,
      pmaSigned
    );

    userData.push({
      auth_user_id: user.id,
      email: user.email || null,
      email_confirmed: user.email_confirmed_at ? true : false,
      public_user_id: userProfile?.public_user_id || null,
      private_user_id: privateProfile?.private_user_id || null,
      shield_nft_verified: shieldNftVerified,
      pma_signed: pmaSigned,
      role,
      wallet_addresses: walletAddresses,
      created_at: user.created_at
    });
  }

  return userData;
}

function formatTableRow(
  index: number,
  email: string,
  role: string,
  shieldNft: boolean,
  emailConfirmed: boolean,
  walletCount: number
): string {
  const emailDisplay = email || '(no email)';
  const nftStatus = shieldNft ? '✅ Yes' : '❌ No';
  const confirmedStatus = emailConfirmed ? '✅' : '⏳';
  
  return `${String(index).padEnd(4)} | ${emailDisplay.padEnd(35)} | ${role.padEnd(20)} | ${nftStatus.padEnd(8)} | ${confirmedStatus.padEnd(4)} | ${String(walletCount).padEnd(8)}`;
}

async function main() {
  try {
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║           ShieldNest User Database Query                       ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    const users = await getAllUsers();

    console.log('\n╔════════════════════════════════════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                                           USER TABLE                                                        ║');
    console.log('╠════════════════════════════════════════════════════════════════════════════════════════════════════════════╣');
    console.log(`${' #  '.padEnd(4)} | ${'Email'.padEnd(35)} | ${'Role'.padEnd(20)} | ${'Shield NFT'.padEnd(8)} | ${'Conf'.padEnd(4)} | ${'Wallets'.padEnd(8)}`);
    console.log('─────┼─────────────────────────────────────┼──────────────────────┼──────────┼──────┼──────────');

    users.forEach((user, index) => {
      console.log(formatTableRow(
        index + 1,
        user.email || '',
        user.role,
        user.shield_nft_verified,
        user.email_confirmed,
        user.wallet_addresses.length
      ));
    });

    console.log('╚════════════════════════════════════════════════════════════════════════════════════════════════════════════╝\n');

    // Summary statistics
    const totalUsers = users.length;
    const emailUsers = users.filter(u => u.email).length;
    const confirmedUsers = users.filter(u => u.email_confirmed).length;
    const shieldNftUsers = users.filter(u => u.shield_nft_verified).length;
    const adminUsers = users.filter(u => u.role.startsWith('Admin')).length;
    const privateMembers = users.filter(u => u.role === 'Private Member').length;
    const publicUsers = users.filter(u => u.role === 'Public User').length;

    console.log('📊 SUMMARY STATISTICS:');
    console.log('─────────────────────────────────────');
    console.log(`Total Users:              ${totalUsers}`);
    console.log(`Users with Email:         ${emailUsers}`);
    console.log(`Email Confirmed:          ${confirmedUsers}`);
    console.log(`Shield NFT Holders:       ${shieldNftUsers}`);
    console.log(`Admins:                   ${adminUsers}`);
    console.log(`Private Members:          ${privateMembers}`);
    console.log(`Public Users:             ${publicUsers}`);
    console.log('─────────────────────────────────────\n');

    // Detailed user information
    console.log('\n📋 DETAILED USER INFORMATION:\n');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email || '(no email)'}`);
      console.log(`   Role:              ${user.role}`);
      console.log(`   Email Confirmed:   ${user.email_confirmed ? '✅ Yes' : '⏳ Pending'}`);
      console.log(`   Shield NFT:        ${user.shield_nft_verified ? '✅ Verified' : '❌ Not verified'}`);
      console.log(`   PMA Signed:        ${user.pma_signed ? '✅ Yes' : '❌ No'}`);
      console.log(`   Public User ID:    ${user.public_user_id || 'N/A'}`);
      console.log(`   Private User ID:   ${user.private_user_id || 'N/A'}`);
      console.log(`   Wallet Count:      ${user.wallet_addresses.length}`);
      if (user.wallet_addresses.length > 0) {
        console.log(`   Wallets:`);
        user.wallet_addresses.forEach(addr => {
          const isAdmin = ADMIN_WALLET_ADDRESSES.includes(addr.toLowerCase());
          console.log(`     - ${addr} ${isAdmin ? '(ADMIN)' : ''}`);
        });
      }
      console.log(`   Created:           ${new Date(user.created_at).toLocaleDateString()}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();

