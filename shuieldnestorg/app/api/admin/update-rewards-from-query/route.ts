import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Use service role for database writes
const getServiceSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, supabaseServiceKey);
};

export async function POST(request: NextRequest) {
  try {
    const { wallet, mode = 'full' } = await request.json();

    if (!wallet) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }

    const resultsFile = join(process.cwd(), '..', `rewards_results_${wallet}.jsonl`);
    const checkpointFile = join(process.cwd(), '..', `rewards_checkpoint_${wallet}.json`);

    console.log('🗄️ Updating Supabase database for wallet:', wallet);
    console.log('Mode:', mode);

    // Load results file
    const resultsContent = readFileSync(resultsFile, 'utf8');
    const lines = resultsContent.trim().split('\n');
    
    // Find the summary line for the correct mode
    let summaryLine = '';
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      if (line.includes('"mode"')) {
        const parsed = JSON.parse(line);
        if (parsed.mode === mode) {
          summaryLine = line;
          break;
        }
      }
    }
    
    if (!summaryLine) {
      return NextResponse.json({ error: `No ${mode} mode results found in results file` }, { status: 400 });
    }
    
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

    const supabase = getServiceSupabase();

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
        return NextResponse.json({ error: 'Database update failed', details: error }, { status: 500 });
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
        return NextResponse.json({ error: 'Failed to fetch existing record', details: fetchError }, { status: 500 });
      }

      if (!existing) {
        console.error('❌ No existing record found for incremental update');
        return NextResponse.json({ error: 'No existing record found. Please run full query first.' }, { status: 400 });
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
        return NextResponse.json({ error: 'Database update failed', details: updateError }, { status: 500 });
      }

      console.log('✅ Incremental rewards update completed successfully');
      console.log(`   Previous total: ${existing.total_rewards_ucore} ucore`);
      console.log(`   New rewards: ${totalRewards} ucore`);
      console.log(`   Updated total: ${newTotalRewards} ucore`);
    }

    const totalCore = (parseInt(totalRewards) / 1000000).toFixed(6);

    return NextResponse.json({
      success: true,
      wallet,
      mode,
      totalRewards,
      totalCore,
      totalTransactions: totalTxs,
      lastBlockHeight,
      message: 'Database updated successfully'
    });

  } catch (error) {
    console.error('❌ Error updating database:', error);
    return NextResponse.json({ 
      error: 'Failed to update database', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
