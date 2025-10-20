#!/usr/bin/env tsx

/**
 * Update Supabase database with rewards query results
 * File: update-rewards-db.ts
 * Purpose: Take blockchain query results and update wallet_rewards_history table
 * Usage: npx tsx update-rewards-db.ts <wallet_address> [mode]
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

// Load environment variables
config({ path: 'shuieldnestorg/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateRewardsHistory() {
  const wallet = process.argv[2];
  const mode = process.argv[3] || 'full';
  const resultsFile = `rewards_results_${wallet}.jsonl`;
  const checkpointFile = `rewards_checkpoint_${wallet}.json`;

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🗄️  UPDATING SUPABASE DATABASE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Wallet: ${wallet}`);
  console.log(`Mode: ${mode}`);
  console.log('');

  try {
    // Load results file
    const resultsContent = readFileSync(resultsFile, 'utf8');
    const lines = resultsContent.trim().split('\n');
    const summaryLine = lines[lines.length - 1];
    const summary = JSON.parse(summaryLine);

    // Load checkpoint file
    const checkpointContent = readFileSync(checkpointFile, 'utf8');
    const checkpoint = JSON.parse(checkpointContent);

    const totalRewards = summary.total_rewards_ucore || summary.new_rewards_ucore || '0';
    const totalTxs = summary.total_claim_transactions || summary.new_claim_transactions || 0;
    const lastBlockHeight = summary.last_block_height;
    const updatedAt = checkpoint.updated_at;

    console.log('📊 Query Results:');
    console.log(`   Total Rewards: ${totalRewards} ucore`);
    console.log(`   Total Transactions: ${totalTxs}`);
    console.log(`   Last Block Height: ${lastBlockHeight}`);
    console.log(`   Updated At: ${updatedAt}`);
    console.log('');

    if (mode === 'full') {
      // Full mode: Insert or update complete record
      const { data, error } = await supabase
        .from('wallet_rewards_history')
        .upsert({
          wallet_address: wallet,
          total_rewards_ucore: totalRewards,
          total_claim_transactions: totalTxs,
          last_block_height: lastBlockHeight,
          last_updated_at: updatedAt,
          first_reward_at: updatedAt,
          last_reward_at: updatedAt
        }, {
          onConflict: 'wallet_address'
        });

      if (error) {
        console.error('❌ Database error:', error);
        process.exit(1);
      }

      console.log('✅ Full rewards history updated successfully');
      
    } else if (mode === 'incremental') {
      // Incremental mode: Update existing record
      const { data: existing, error: fetchError } = await supabase
        .from('wallet_rewards_history')
        .select('*')
        .eq('wallet_address', wallet)
        .single();

      if (fetchError) {
        console.error('❌ Failed to fetch existing record:', fetchError);
        process.exit(1);
      }

      if (!existing) {
        console.error('❌ No existing record found for incremental update');
        console.error('   Please run full query first');
        process.exit(1);
      }

      const newTotalRewards = (BigInt(existing.total_rewards_ucore) + BigInt(totalRewards)).toString();
      const newTotalTxs = existing.total_claim_transactions + totalTxs;

      const { error: updateError } = await supabase
        .from('wallet_rewards_history')
        .update({
          total_rewards_ucore: newTotalRewards,
          total_claim_transactions: newTotalTxs,
          last_block_height: lastBlockHeight,
          last_updated_at: updatedAt,
          last_reward_at: updatedAt
        })
        .eq('wallet_address', wallet);

      if (updateError) {
        console.error('❌ Database update error:', updateError);
        process.exit(1);
      }

      console.log('✅ Incremental rewards update completed successfully');
      console.log(`   Previous total: ${existing.total_rewards_ucore} ucore`);
      console.log(`   New rewards: ${totalRewards} ucore`);
      console.log(`   Updated total: ${newTotalRewards} ucore`);
    }

    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ DATABASE UPDATE COMPLETE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Wallet: ${wallet}`);
    console.log(`Mode: ${mode}`);
    console.log(`Total Rewards: ${(parseInt(totalRewards) / 1000000).toFixed(6)} CORE`);
    console.log(`Total Transactions: ${totalTxs}`);
    console.log(`Last Block Height: ${lastBlockHeight}`);
    console.log('');
    console.log('🎉 Database is now ready for incremental updates!');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateRewardsHistory();
