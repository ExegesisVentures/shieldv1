/**
 * Import ShieldNest Members Script
 * Imports all members with their emails, passwords, wallets, and NFT holdings
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

interface MemberData {
  name: string;
  email?: string;
  password: string;
  shieldnest_member_nft: number;
  wallets: string[];
  is_admin?: boolean;
}

// Member data from the provided list
const MEMBERS: MemberData[] = [
  {
    name: 'adesh',
    email: undefined, // No email provided
    password: '1234567',
    shieldnest_member_nft: 1,
    wallets: ['core14j3cydchuqhp2exczsfegst5p5936fd62eful6']
  },
  {
    name: 'bill',
    email: 'ideaman68@gmail.com',
    password: '1234567',
    shieldnest_member_nft: 1,
    wallets: ['core13jr97uj7nffkrjnpd4whx6xkakhqtmhugfyeny']
  },
  {
    name: 'brendo',
    email: undefined, // No email provided
    password: '1234567',
    shieldnest_member_nft: 1,
    wallets: ['core1nfl2rqgdgnnvsve750hg0jumkhy5aeskjlgu7a']
  },
  {
    name: 'brian b',
    email: 'brianbecraft1717@icloud.com',
    password: '1234567',
    shieldnest_member_nft: 2,
    wallets: ['core1k2nkrpk7822296d2vf9pg66xkz66egp7hsjxmw']
  },
  {
    name: 'brian m',
    email: 'brianbecraft1717@icloud.com',
    password: '1234567',
    shieldnest_member_nft: 3,
    wallets: ['core1exhafgs40qszdzdphlrzu29r7zpnykkmrh3s5f']
  },
  {
    name: 'CASSIE',
    email: 'cassy.slee@gmail.com',
    password: '1234567',
    shieldnest_member_nft: 2,
    wallets: ['core1zcrd42ggyk2jq7m2qlp7dvl35qjumy4vh4ns94']
  },
  {
    name: 'House of exegesis',
    email: 'exegesisventures@protonmail.com',
    password: '1234567',
    shieldnest_member_nft: 3,
    wallets: [
      'core1e8ena8efanueweqxaf7ar88w4jn2p2c4wexeh4',
      'core1eg7rdhf8mz8dhkxq6r2dtfkxkyds3330gkkfkj'
    ],
    is_admin: true
  },
  {
    name: 'issanah',
    email: 'a.sawiniuk@gmail.com',
    password: '1234567',
    shieldnest_member_nft: 2,
    wallets: ['core1a2j0skj4y22seqxsu8f2ldz8u7zpszsrsh8l4e']
  },
  {
    name: 'Jim H',
    email: 'visionary@protonmail.com',
    password: '1234567',
    shieldnest_member_nft: 1,
    wallets: ['core1dgkf286wm4a6kcxa4jl57l2mdvmgepwam9urww']
  },
  {
    name: 'john G',
    email: 'jgenelli85@yahoo.com',
    password: '1234567',
    shieldnest_member_nft: 0,
    wallets: ['core1nl7q8add76lan03drd7l485knvgacw6shykk75']
  },
  {
    name: 'John MAYBERG',
    email: undefined, // No email provided
    password: '1234567',
    shieldnest_member_nft: 0,
    wallets: ['core1l8xz2c7fvsg8l8kh403sj0hwe6v8g2dgc005gu']
  },
  {
    name: 'Josh Aloha is Love Joshua Sojot',
    email: 'info@alohaislove.org',
    password: '1234567',
    shieldnest_member_nft: 0,
    wallets: ['core1h0wnttdkhsancdxz83nyta88llvkkydcjl49f4']
  },
  {
    name: 'kaio',
    email: 'kaio.cardoza@gmail.com',
    password: '1234567',
    shieldnest_member_nft: 1,
    wallets: ['core1zeraw0kcqutnvzre6x88lx8ptf885x3p9khkza']
  },
  {
    name: 'kaycee',
    email: 'kayceeflinn@gmail.com',
    password: '1234567',
    shieldnest_member_nft: 1,
    wallets: ['core1wez9xwgstvveelskv2khj4ja9ml2cs5y995cuk']
  },
  {
    name: 'kristen',
    email: 'Kristen.Anne.Romero@gmail.com',
    password: '1234567',
    shieldnest_member_nft: 1,
    wallets: ['core15zap266k36r0llhmf6hs6gas6uvl86lep9qrj9']
  },
  {
    name: 'levi',
    email: 'levifd@gmail.com',
    password: '1234567',
    shieldnest_member_nft: 1,
    wallets: ['core14dqsuhj4sqz4r4mh5yc5rlp00jj8ype7tzanes']
  },
  {
    name: 'mackensie',
    email: 'mackenzie23@ymail.com',
    password: '1234567',
    shieldnest_member_nft: 3,
    wallets: ['core1a652ykypdwxz7kw4gfkudegcgculrdpxps4vq7']
  },
  {
    name: 'Marco',
    email: 'marco5500sw@gmail.com',
    password: '1234567',
    shieldnest_member_nft: 1,
    wallets: ['core1zfdh9jslt8ldzwnvw8pkldyx6l9vxkhv9m4meu']
  },
  {
    name: 'me',
    email: 'nestd@pm.me',
    password: '123456',
    shieldnest_member_nft: 5,
    wallets: ['core1fs0jp6896c5ephy5pxwrqagx2emwnswa55phyr'],
    is_admin: true
  },
  {
    name: 'melony',
    email: 'melmcgrath13@gmail.com',
    password: '1234567',
    shieldnest_member_nft: 1,
    wallets: ['core1e5hdnk9msjvmyguulaufyclqjwx26pnwv2vmxc']
  },
  {
    name: 'michelle',
    email: undefined, // No email provided
    password: '1234567',
    shieldnest_member_nft: 2,
    wallets: ['core13f8l57fspmleexeuhsg4j7t5h009ysfcyhg0v3']
  },
  {
    name: 'MIKE MOM',
    email: 'mike_da_haole@yahoo.com',
    password: '1234567',
    shieldnest_member_nft: 1,
    wallets: ['core12kgnwf5jjylrz3j522fhrt08xe47gsez7le56j']
  },
  {
    name: 'phil quaken',
    email: 'qwaken17@gmail.com',
    password: '1234567',
    shieldnest_member_nft: 1,
    wallets: ['core19e7p4qh7fts5x5hfy44j3xj8fygf8sxy0pd862']
  },
  {
    name: 'randy',
    email: undefined, // No email provided
    password: '1234567',
    shieldnest_member_nft: 3,
    wallets: ['core1sp2kym0waqmuvc8ejcwlu7v669j258ndfdkg4q']
  },
  {
    name: 'staunch',
    email: 'staunchngdev@gmail.com',
    password: '1234567',
    shieldnest_member_nft: 2,
    wallets: ['core1yqcecfndklx5wj6m7escy5hd6hra0s0tmqdhpa']
  },
  {
    name: 'stevie alters',
    email: 'steviealters@yahoo.com',
    password: '1234567',
    shieldnest_member_nft: 0,
    wallets: ['core19lps98np0ntal2fvhm86hrhh3kkxytl3u590sz']
  },
  {
    name: 'tom',
    email: 'ecmauitom@gmail.com',
    password: '1234567',
    shieldnest_member_nft: 2,
    wallets: ['core1s3sedw3e5l94vaq0wue4j03j4lgp6jfuhaxkz6']
  },
  {
    name: 'vicki',
    email: 'vicnshane@sbcglobal.net',
    password: '1234567',
    shieldnest_member_nft: 2,
    wallets: ['core1wpnv2ygglxsg6lp0n7uxka9g263pawtx7p8ql9']
  }
  // willie - wallet to be added later (skipped)
  // allen wicked keidel - wallet to be added later (skipped)
];

interface ImportResult {
  success: boolean;
  member: MemberData;
  auth_user_id?: string;
  public_user_id?: string;
  private_user_id?: string;
  error?: string;
  skipped?: boolean;
  reason?: string;
}

async function checkExistingUser(email?: string, walletAddress?: string): Promise<{
  exists: boolean;
  auth_user_id?: string;
  public_user_id?: string;
}> {
  if (email) {
    // Check if user exists by email
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const existingUser = authUsers?.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (existingUser) {
      // Get public_user_id
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('public_user_id')
        .eq('auth_user_id', existingUser.id)
        .maybeSingle();
      
      return {
        exists: true,
        auth_user_id: existingUser.id,
        public_user_id: profile?.public_user_id
      };
    }
  }

  if (walletAddress) {
    // Check if wallet already exists
    const { data: wallet } = await supabase
      .from('wallets')
      .select('public_user_id')
      .eq('address', walletAddress.toLowerCase())
      .maybeSingle();
    
    if (wallet) {
      return {
        exists: true,
        public_user_id: wallet.public_user_id
      };
    }
  }

  return { exists: false };
}

async function importMember(member: MemberData): Promise<ImportResult> {
  console.log(`\n📝 Importing: ${member.name}`);
  console.log(`   Email: ${member.email || '(no email)'}`);
  console.log(`   ShieldNest NFTs: ${member.shieldnest_member_nft}`);
  console.log(`   Wallets: ${member.wallets.length}`);
  console.log(`   Admin: ${member.is_admin ? 'Yes' : 'No'}`);

  try {
    // Check if user already exists
    const existing = await checkExistingUser(member.email, member.wallets[0]);
    
    if (existing.exists) {
      console.log(`   ⚠️  User already exists, updating instead...`);
      
      // Update existing user's NFT count and wallets
      if (existing.public_user_id) {
        // Create or update private_users record
        const { data: privateProfile } = await supabase
          .from('private_user_profiles')
          .select('private_user_id')
          .eq('auth_user_id', existing.auth_user_id!)
          .maybeSingle();

        let privateUserId = privateProfile?.private_user_id;

        if (!privateUserId && member.shieldnest_member_nft > 0) {
          // Create private_users record
          const { data: newPrivateUser } = await supabase
            .from('private_users')
            .insert({
              pma_signed: true,
              shield_nft_verified: true,
              shieldnest_member_nft: member.shieldnest_member_nft,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select('id')
            .single();

          if (newPrivateUser) {
            privateUserId = newPrivateUser.id;

            // Create mapping
            await supabase
              .from('private_user_profiles')
              .insert({
                auth_user_id: existing.auth_user_id!,
                private_user_id: privateUserId,
                created_at: new Date().toISOString()
              });
          }
        } else if (privateUserId) {
          // Update existing private user
          await supabase
            .from('private_users')
            .update({
              pma_signed: true,
              shield_nft_verified: true,
              shieldnest_member_nft: member.shieldnest_member_nft,
              updated_at: new Date().toISOString()
            })
            .eq('id', privateUserId);
        }

        // Add wallets that don't exist yet
        for (const walletAddress of member.wallets) {
          const { data: existingWallet } = await supabase
            .from('wallets')
            .select('id')
            .eq('public_user_id', existing.public_user_id)
            .eq('address', walletAddress.toLowerCase())
            .maybeSingle();

          if (!existingWallet) {
            await supabase
              .from('wallets')
              .insert({
                public_user_id: existing.public_user_id,
                address: walletAddress.toLowerCase(),
                label: `${member.name}'s wallet`,
                source: 'admin',
                ownership_verified: false, // Will need to verify
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });
            console.log(`   ✓ Added wallet: ${walletAddress.substring(0, 20)}...`);
          } else {
            console.log(`   ⏭️  Wallet already exists: ${walletAddress.substring(0, 20)}...`);
          }
        }
      }

      return {
        success: true,
        member,
        auth_user_id: existing.auth_user_id,
        public_user_id: existing.public_user_id,
        skipped: false,
        reason: 'Updated existing user'
      };
    }

    // For members without email, skip import for now
    if (!member.email) {
      console.log(`   ⏭️  Skipping: No email provided (will need wallet-only auth)`);
      return {
        success: false,
        member,
        skipped: true,
        reason: 'No email provided'
      };
    }

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: member.email,
      password: member.password,
      email_confirm: false, // User needs to verify email
      user_metadata: {
        name: member.name,
        is_admin: member.is_admin || false
      }
    });

    if (authError) {
      throw new Error(`Failed to create auth user: ${authError.message}`);
    }

    console.log(`   ✓ Created auth user`);

    // 2. Create public_users record
    const { data: publicUser, error: publicUserError } = await supabase
      .from('public_users')
      .insert({
        email: member.email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (publicUserError) {
      throw new Error(`Failed to create public user: ${publicUserError.message}`);
    }

    console.log(`   ✓ Created public_users record`);

    // 3. Create user_profiles mapping
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        auth_user_id: authData.user.id,
        public_user_id: publicUser.id,
        created_at: new Date().toISOString()
      });

    if (profileError) {
      throw new Error(`Failed to create user profile mapping: ${profileError.message}`);
    }

    console.log(`   ✓ Created user_profiles mapping`);

    let privateUserId: string | undefined;

    // 4. Create private_users record (if they have NFTs)
    if (member.shieldnest_member_nft > 0) {
      const { data: privateUser, error: privateUserError } = await supabase
        .from('private_users')
        .insert({
          pma_signed: true, // Assuming existing members have signed
          shield_nft_verified: true, // Assuming they're verified
          shieldnest_member_nft: member.shieldnest_member_nft,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (privateUserError) {
        throw new Error(`Failed to create private user: ${privateUserError.message}`);
      }

      privateUserId = privateUser.id;
      console.log(`   ✓ Created private_users record (${member.shieldnest_member_nft} ShieldNest NFTs)`);

      // 5. Create private_user_profiles mapping
      const { error: privateProfileError } = await supabase
        .from('private_user_profiles')
        .insert({
          auth_user_id: authData.user.id,
          private_user_id: privateUser.id,
          created_at: new Date().toISOString()
        });

      if (privateProfileError) {
        throw new Error(`Failed to create private user profile mapping: ${privateProfileError.message}`);
      }

      console.log(`   ✓ Created private_user_profiles mapping`);
    }

    // 6. Add wallets
    for (const walletAddress of member.wallets) {
      const { error: walletError } = await supabase
        .from('wallets')
        .insert({
          public_user_id: publicUser.id,
          address: walletAddress.toLowerCase(),
          label: `${member.name}'s wallet`,
          source: 'admin',
          ownership_verified: false, // Will need to verify via signature
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (walletError) {
        console.error(`   ⚠️  Failed to add wallet ${walletAddress}: ${walletError.message}`);
      } else {
        console.log(`   ✓ Added wallet: ${walletAddress.substring(0, 20)}...`);
      }
    }

    console.log(`   ✅ Successfully imported ${member.name}`);

    return {
      success: true,
      member,
      auth_user_id: authData.user.id,
      public_user_id: publicUser.id,
      private_user_id: privateUserId
    };

  } catch (error) {
    console.error(`   ❌ Error importing ${member.name}:`, error);
    return {
      success: false,
      member,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function main() {
  try {
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║           ShieldNest Member Import Script                      ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    console.log(`📊 Total members to import: ${MEMBERS.length}\n`);

    const results: ImportResult[] = [];

    for (const member of MEMBERS) {
      const result = await importMember(member);
      results.push(result);
    }

    // Summary
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║                      IMPORT SUMMARY                             ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success && !r.skipped);
    const skipped = results.filter(r => r.skipped);

    console.log(`✅ Successfully imported:  ${successful.length}`);
    console.log(`❌ Failed:                 ${failed.length}`);
    console.log(`⏭️  Skipped (no email):    ${skipped.length}`);
    console.log(`📧 Total with email:       ${MEMBERS.filter(m => m.email).length}`);
    console.log(`🔑 Total admin users:      ${MEMBERS.filter(m => m.is_admin).length}`);
    console.log(`🏆 NFT holders:            ${MEMBERS.filter(m => m.shieldnest_member_nft > 0).length}`);
    console.log('');

    if (failed.length > 0) {
      console.log('❌ Failed imports:');
      failed.forEach(r => {
        console.log(`   - ${r.member.name}: ${r.error}`);
      });
      console.log('');
    }

    if (skipped.length > 0) {
      console.log('⏭️  Skipped (no email - will need wallet-only auth):');
      skipped.forEach(r => {
        console.log(`   - ${r.member.name}`);
      });
      console.log('');
    }

    console.log('🎉 Import complete!\n');
    console.log('📧 Next steps:');
    console.log('   1. Users should verify their email addresses');
    console.log('   2. Users should authenticate their wallets via signature');
    console.log('   3. Update .env.local ADMIN_EMAILS for admin users\n');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

main();

