#!/usr/bin/env tsx
/**
 * Assign specific wallet addresses to a user's profile by email.
 *
 * Usage:
 *   npx tsx scripts/assign-wallets-to-user.ts --email nestd@pm.me --addresses core1...,core1...
 *
 * Requires env:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

function parseArgs() {
  const args = process.argv.slice(2);
  const out: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const val = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : '';
      if (val) i++;
      out[key] = val;
    }
  }
  return out;
}

async function main() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('❌ Missing env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const { email, addresses } = parseArgs();
  if (!email) {
    console.error('❌ Missing --email <user_email>');
    process.exit(1);
  }

  const addressList = (addresses || '')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  console.log('🔧 Assigning wallets to user profile');
  console.log('   Email:', email);
  console.log('   Addresses:', addressList.length > 0 ? addressList.join(', ') : '(none provided)');

  // 1) Find auth user by email
  const { data: usersPage, error: usersError } = await supabase.auth.admin.listUsers();
  if (usersError) throw usersError;
  const authUser = usersPage.users.find(u => (u.email || '').toLowerCase() === email.toLowerCase());
  if (!authUser) {
    console.error('❌ Auth user not found for email:', email);
    process.exit(1);
  }
  console.log('✅ Auth user found:', authUser.id);

  // 2) Resolve or create mapping to public_user_id
  const { data: mapping } = await supabase
    .from('user_profiles')
    .select('public_user_id')
    .eq('auth_user_id', authUser.id)
    .maybeSingle();

  let publicUserId = mapping?.public_user_id as string | undefined;
  if (!publicUserId) {
    // Create public user if not exists
    const { data: created, error: createErr } = await supabase
      .from('public_users')
      .insert({ email, created_at: new Date().toISOString() })
      .select('id')
      .single();
    if (createErr && !String(createErr.message || '').includes('duplicate')) throw createErr;

    if (!created?.id) {
      // fetch existing by email
      const { data: existing } = await supabase
        .from('public_users')
        .select('id')
        .eq('email', email)
        .maybeSingle();
      publicUserId = existing?.id as string | undefined;
    } else {
      publicUserId = created.id;
    }

    if (!publicUserId) throw new Error('Failed to resolve public_user_id');

    const { error: mapErr } = await supabase
      .from('user_profiles')
      .insert({ auth_user_id: authUser.id, public_user_id: publicUserId, created_at: new Date().toISOString() });
    if (mapErr && !String(mapErr.message || '').includes('duplicate')) throw mapErr;
  }
  console.log('✅ public_user_id:', publicUserId);

  // 3) If no addresses provided, print guidance and exit
  if (addressList.length === 0) {
    console.log('\nℹ️ No addresses provided via --addresses. Nothing to assign.');
    console.log('   Example run:');
    console.log('   npx tsx scripts/assign-wallets-to-user.ts --email', email, '--addresses core1...,core1...');
    // Show existing wallets for context
    const { data: existingWallets } = await supabase
      .from('wallets')
      .select('id,address,label,public_user_id,is_custodial')
      .in('public_user_id', [publicUserId]);
    console.log('\nCurrent wallets for profile:', existingWallets?.length || 0);
    existingWallets?.forEach(w => console.log('  -', w.address, '|', w.label || ''));
    process.exit(0);
  }

  // 4) Assign each address to this profile (insert-or-update)
  let assigned = 0;
  for (const addr of addressList) {
    // Does a wallet record already exist?
    const { data: existing } = await supabase
      .from('wallets')
      .select('id, public_user_id')
      .eq('address', addr)
      .maybeSingle();

    if (existing?.public_user_id && existing.public_user_id !== publicUserId) {
      // Reassign
      const { error: updErr } = await supabase
        .from('wallets')
        .update({ public_user_id: publicUserId })
        .eq('id', existing.id);
      if (updErr) throw updErr;
      console.log('🔁 Re-assigned wallet to profile:', addr);
      assigned++;
      continue;
    }

    if (!existing) {
      // Insert new wallet record
      const { error: insErr } = await supabase
        .from('wallets')
        .insert({
          public_user_id: publicUserId,
          address: addr,
          label: 'Admin Wallet',
          source: 'admin',
          ownership_verified: true,
          verified_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        });
      if (insErr && !String(insErr.message || '').includes('duplicate')) throw insErr;
      console.log('➕ Inserted wallet for profile:', addr);
      assigned++;
    } else {
      console.log('✅ Wallet already belongs to profile:', addr);
    }
  }

  console.log(`\n✅ Done. Assigned/ensured ${assigned} wallet(s).`);
}

main().catch((e) => {
  console.error('❌ Error:', e);
  process.exit(1);
});


