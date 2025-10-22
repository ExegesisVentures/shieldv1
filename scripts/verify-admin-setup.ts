#!/usr/bin/env tsx
/**
 * Verify Admin Setup Script
 * Run this to check if your admin dashboard setup is complete
 * 
 * Usage: npx tsx scripts/verify-admin-setup.ts
 */

import * as fs from 'fs';
import * as path from 'path';

console.log('\n🔍 Admin Dashboard Setup Verification\n');
console.log('='.repeat(50));

let allGood = true;

// Check 1: .env.local exists
console.log('\n✓ Checking .env.local file...');
const envLocalPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  console.log('  ✅ .env.local exists');
  
  // Check contents
  const envContent = fs.readFileSync(envLocalPath, 'utf-8');
  
  if (envContent.includes('ADMIN_EMAILS=') && !envContent.includes('ADMIN_EMAILS=your-email')) {
    console.log('  ✅ ADMIN_EMAILS configured');
  } else {
    console.log('  ⚠️  ADMIN_EMAILS not configured (or still has placeholder)');
    allGood = false;
  }
  
  if (envContent.includes('ADMIN_WALLET_ADDRESSES=') && !envContent.includes('ADMIN_WALLET_ADDRESSES=core1yourwalletaddress')) {
    console.log('  ✅ ADMIN_WALLET_ADDRESSES configured');
  } else {
    console.log('  ⚠️  ADMIN_WALLET_ADDRESSES not configured (or still has placeholder)');
    console.log('     (This is optional if you set ADMIN_EMAILS)');
  }
} else {
  console.log('  ❌ .env.local does NOT exist');
  console.log('     Create it by copying .env.local.template');
  allGood = false;
}

// Check 2: Migration file exists
console.log('\n✓ Checking migration file...');
const migrationPath = path.join(process.cwd(), 'supabase/migrations/20251021_add_shield_member_tracking.sql');
if (fs.existsSync(migrationPath)) {
  console.log('  ✅ Migration file exists');
  
  const migrationContent = fs.readFileSync(migrationPath, 'utf-8');
  
  if (migrationContent.includes('has_signed_pma')) {
    console.log('  ✅ Migration contains Shield member tracking');
  }
  
  if (migrationContent.includes('CREATE POLICY IF NOT EXISTS')) {
    console.log('  ⚠️  Migration still has syntax error (IF NOT EXISTS on CREATE POLICY)');
    console.log('     This was supposed to be fixed - check the file!');
    allGood = false;
  } else {
    console.log('  ✅ Migration syntax looks good (no IF NOT EXISTS on policies)');
  }
} else {
  console.log('  ❌ Migration file does NOT exist');
  allGood = false;
}

// Check 3: API routes exist
console.log('\n✓ Checking API routes...');
const apiUsersPath = path.join(process.cwd(), 'app/api/admin/users/route.ts');
const apiShieldAccessPath = path.join(process.cwd(), 'app/api/admin/users/shield-access/route.ts');

if (fs.existsSync(apiUsersPath)) {
  console.log('  ✅ /app/api/admin/users/route.ts exists');
} else {
  console.log('  ❌ /app/api/admin/users/route.ts missing');
  allGood = false;
}

if (fs.existsSync(apiShieldAccessPath)) {
  console.log('  ✅ /app/api/admin/users/shield-access/route.ts exists');
} else {
  console.log('  ❌ /app/api/admin/users/shield-access/route.ts missing');
  allGood = false;
}

// Check 4: Admin page updated
console.log('\n✓ Checking admin page...');
const adminPagePath = path.join(process.cwd(), 'app/admin/page.tsx');
if (fs.existsSync(adminPagePath)) {
  const adminPageContent = fs.readFileSync(adminPagePath, 'utf-8');
  
  if (adminPageContent.includes('User Management') || adminPageContent.includes('loadUsers')) {
    console.log('  ✅ Admin page has user management UI');
  } else {
    console.log('  ⚠️  Admin page might not have user management UI');
    allGood = false;
  }
} else {
  console.log('  ❌ Admin page missing');
  allGood = false;
}

// Check 5: Environment variables loaded (runtime check)
console.log('\n✓ Checking environment variables (runtime)...');
if (process.env.ADMIN_EMAILS) {
  console.log(`  ✅ ADMIN_EMAILS loaded: ${process.env.ADMIN_EMAILS.split(',').length} email(s)`);
} else {
  console.log('  ⚠️  ADMIN_EMAILS not loaded in runtime');
  console.log('     (This is expected if server is not running)');
}

if (process.env.ADMIN_WALLET_ADDRESSES) {
  console.log(`  ✅ ADMIN_WALLET_ADDRESSES loaded: ${process.env.ADMIN_WALLET_ADDRESSES.split(',').length} wallet(s)`);
} else {
  console.log('  ⚠️  ADMIN_WALLET_ADDRESSES not loaded in runtime');
  console.log('     (This is optional if ADMIN_EMAILS is set)');
}

// Summary
console.log('\n' + '='.repeat(50));
if (allGood) {
  console.log('✅ All checks passed!');
  console.log('\n📋 Next steps:');
  console.log('   1. Run the migration in Supabase dashboard');
  console.log('   2. Restart your dev server: npm run dev');
  console.log('   3. Visit: http://localhost:3000/admin');
} else {
  console.log('⚠️  Some issues found - please fix them');
  console.log('\n📋 To fix:');
  console.log('   1. Create/update .env.local with your admin credentials');
  console.log('   2. Make sure migration file has correct syntax');
  console.log('   3. Check ADMIN-TODO-CHECKLIST.md for details');
}
console.log('='.repeat(50) + '\n');

