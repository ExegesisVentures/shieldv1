/**
 * Add Missing Tokens to Database
 * 
 * This script adds all the missing tokens that are showing up as "Unknown"
 * in your console logs to the database.
 * 
 * Run: npx tsx scripts/add-missing-tokens-to-db.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Missing tokens from your console logs
const MISSING_TOKENS = [
  {
    denom: 'uawktuah-core1zgdprlr3hz5hhke9ght8mq723a8wlnzqwd60hm',
    symbol: 'AWKT',
    name: 'AWKT Token',
    type: 'cw20',
    decimals: 6,
    contract_address: 'core1zgdprlr3hz5hhke9ght8mq723a8wlnzqwd60hm',
  },
  {
    denom: 'ucat-core129pfw890e2e0c7p4uw04z88zjfudm2zydcd7zj4jj9lr492t4mws89skd6',
    symbol: 'CAT',
    name: 'CAT Token',
    type: 'cw20',
    decimals: 6,
    contract_address: 'core129pfw890e2e0c7p4uw04z88zjfudm2zydcd7zj4jj9lr492t4mws89skd6',
  },
  {
    denom: 'ucozy-core19w7yasdscfu09un47h8vf5rfjshwug2kgrplkwtfdrrgjzrld82sc7f494',
    symbol: 'COZY',
    name: 'Cozy Finance',
    type: 'cw20',
    decimals: 6,
    contract_address: 'core19w7yasdscfu09un47h8vf5rfjshwug2kgrplkwtfdrrgjzrld82sc7f494',
  },
  {
    denom: 'ukong-core1u4zkwwqlnzepghtr45zyfx5qwm9mehfrgj4wae',
    symbol: 'KONG',
    name: 'Kong Token',
    type: 'cw20',
    decimals: 6,
    contract_address: 'core1u4zkwwqlnzepghtr45zyfx5qwm9mehfrgj4wae',
  },
  {
    denom: 'ulp-core1gxt4jgrqnhvx8006j9xy70qj9r4ylf2w63pmcl7x3paxtzzp69lqnwne48',
    symbol: 'ULP',
    name: 'LP Token',
    type: 'cw20',
    decimals: 6,
    contract_address: 'core1gxt4jgrqnhvx8006j9xy70qj9r4ylf2w63pmcl7x3paxtzzp69lqnwne48',
  },
  {
    denom: 'umart-core1e5zxd9z4mz0t60he3mdw3fc499nz9jgzk9xwfvmkf440gtmsrkaqwsh75a',
    symbol: 'MART',
    name: 'Mart Token',
    type: 'cw20',
    decimals: 6,
    contract_address: 'core1e5zxd9z4mz0t60he3mdw3fc499nz9jgzk9xwfvmkf440gtmsrkaqwsh75a',
  },
  {
    denom: 'usara-core1r9gc0rnxnzpq33u82f44aufgdwvyxv4wyepyck98m9v2pxua6naqr8h03z',
    symbol: 'SARA',
    name: 'Sara Token',
    type: 'cw20',
    decimals: 6,
    contract_address: 'core1r9gc0rnxnzpq33u82f44aufgdwvyxv4wyepyck98m9v2pxua6naqr8h03z',
  },
];

async function addMissingTokens() {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║   Adding Missing Tokens to Database                 ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  let added = 0;
  let skipped = 0;
  let errors = 0;

  for (const token of MISSING_TOKENS) {
    try {
      // Check if token already exists
      const { data: existing } = await supabase
        .from('coreum_tokens')
        .select('denom')
        .eq('denom', token.denom)
        .single();

      if (existing) {
        console.log(`⏭️  ${token.symbol} - Already exists`);
        skipped++;
        continue;
      }

      // Insert token
      const { error } = await supabase
        .from('coreum_tokens')
        .insert({
          denom: token.denom,
          symbol: token.symbol,
          name: token.name,
          type: token.type,
          decimals: token.decimals,
          contract_address: token.contract_address,
          is_active: true,
        });

      if (error) {
        console.error(`❌ ${token.symbol} - Error:`, error.message);
        errors++;
      } else {
        console.log(`✅ ${token.symbol} - Added successfully`);
        added++;
      }
    } catch (error) {
      console.error(`❌ ${token.symbol} - Exception:`, error);
      errors++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Added: ${added}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`❌ Errors: ${errors}`);
  console.log('='.repeat(60) + '\n');

  if (added > 0) {
    console.log('✅ Tokens have been added to the database!');
    console.log('   The "Unknown token denom" warnings should now be gone.');
  }
}

addMissingTokens().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

