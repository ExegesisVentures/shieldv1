const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateRewardsHistory() {
  const wallet = process.argv[2];
  const mode = process.argv[3];
  const totalRewards = process.argv[4];
  const totalTxs = process.argv[5];
  const lastBlockHeight = process.argv[6];
  const updatedAt = process.argv[7];

  try {
    if (mode === 'full') {
      // Full mode: Insert or update complete record
      const { data, error } = await supabase
        .from('wallet_rewards_history')
        .upsert({
          wallet_address: wallet,
          total_rewards_ucore: totalRewards,
          total_claim_transactions: parseInt(totalTxs),
          last_block_height: parseInt(lastBlockHeight),
          last_updated_at: updatedAt,
          first_reward_at: updatedAt, // Will be updated if this is truly first
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
      const newTotalTxs = existing.total_claim_transactions + parseInt(totalTxs);

      const { error: updateError } = await supabase
        .from('wallet_rewards_history')
        .update({
          total_rewards_ucore: newTotalRewards,
          total_claim_transactions: newTotalTxs,
          last_block_height: parseInt(lastBlockHeight),
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

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

updateRewardsHistory();
