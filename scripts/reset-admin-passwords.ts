/**
 * Reset Admin User Passwords
 * Use this to reset passwords for admin users
 */

import { createClient } from '@supabase/supabase-js';

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

const ADMIN_USERS = [
  {
    email: 'exegesisventures@protonmail.com',
    newPassword: '1234567',
    name: 'House of exegesis'
  },
  {
    email: 'nestd@pm.me',
    newPassword: '123456',
    name: 'me'
  }
];

async function resetPassword(email: string, newPassword: string, name: string) {
  console.log(`\n🔐 Resetting password for: ${name} (${email})`);

  try {
    // Get user by email
    const { data: users } = await supabase.auth.admin.listUsers();
    const user = users?.users.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (!user) {
      console.error(`   ❌ User not found: ${email}`);
      return;
    }

    // Update user password and confirm email
    const { data, error } = await supabase.auth.admin.updateUserById(
      user.id,
      {
        password: newPassword,
        email_confirm: true, // Auto-confirm email
      }
    );

    if (error) {
      console.error(`   ❌ Error: ${error.message}`);
      return;
    }

    console.log(`   ✅ Password reset successful`);
    console.log(`   ✅ Email confirmed`);
    console.log(`   📧 Can now login with: ${email}`);
    console.log(`   🔑 Password: ${newPassword}`);

  } catch (error) {
    console.error(`   ❌ Error:`, error);
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║           Reset Admin Passwords                                 ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');

  for (const user of ADMIN_USERS) {
    await resetPassword(user.email, user.newPassword, user.name);
  }

  console.log('\n✅ Done! Both admin users can now login.\n');
}

main();

