#!/bin/bash
# Update Supabase database with rewards query results
# File: update-rewards-db.sh
# Purpose: Take blockchain query results and update wallet_rewards_history table
# Usage: ./update-rewards-db.sh <wallet_address> [mode]
#   mode: "full" (default) or "incremental"

WALLET="${1:-core1jcas459gnu857ylephjdjlea3rkr38m0asj6gw}"
MODE="${2:-full}"
RESULTS_FILE="rewards_results_${WALLET}.jsonl"
CHECKPOINT_FILE="rewards_checkpoint_${WALLET}.json"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🗄️  UPDATING SUPABASE DATABASE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Wallet: $WALLET"
echo "Mode: $MODE"
echo ""

# Check if results file exists
if [ ! -f "$RESULTS_FILE" ]; then
  echo "❌ Results file not found: $RESULTS_FILE"
  echo "   Please run query_full.sh or query_incremental.sh first"
  exit 1
fi

# Check if checkpoint file exists
if [ ! -f "$CHECKPOINT_FILE" ]; then
  echo "❌ Checkpoint file not found: $CHECKPOINT_FILE"
  echo "   Please run query_full.sh or query_incremental.sh first"
  exit 1
fi

# Load environment variables
if [ -f "shuieldnestorg/.env.local" ]; then
  source shuieldnestorg/.env.local
elif [ -f ".env.local" ]; then
  source .env.local
else
  echo "❌ Environment file not found"
  echo "   Please ensure .env.local exists with Supabase credentials"
  exit 1
fi

# Check required environment variables
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "❌ Missing Supabase environment variables"
  echo "   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY"
  exit 1
fi

echo "📊 Loading query results..."

# Extract summary data from results file
SUMMARY_LINE=$(tail -1 "$RESULTS_FILE")
TOTAL_REWARDS=$(echo "$SUMMARY_LINE" | jq -r '.total_rewards_ucore // .new_rewards_ucore // 0')
TOTAL_TXS=$(echo "$SUMMARY_LINE" | jq -r '.total_claim_transactions // .new_claim_transactions // 0')
LAST_BLOCK_HEIGHT=$(echo "$SUMMARY_LINE" | jq -r '.last_block_height')
START_HEIGHT=$(echo "$SUMMARY_LINE" | jq -r '.start_height // 1')
END_HEIGHT=$(echo "$SUMMARY_LINE" | jq -r '.end_height')

# Load checkpoint data
LAST_HEIGHT=$(jq -r '.last_block_height' "$CHECKPOINT_FILE")
UPDATED_AT=$(jq -r '.updated_at' "$CHECKPOINT_FILE")

echo "   Total Rewards: $TOTAL_REWARDS ucore"
echo "   Total Transactions: $TOTAL_TXS"
echo "   Last Block Height: $LAST_BLOCK_HEIGHT"
echo "   Updated At: $UPDATED_AT"
echo ""

# Create Node.js script to update Supabase in the project directory
cat > shuieldnestorg/update_supabase.js << 'EOF'
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
EOF

echo "🔄 Updating Supabase database..."

# Run the Node.js script from the project directory
cd shuieldnestorg
node update_supabase.js "$WALLET" "$MODE" "$TOTAL_REWARDS" "$TOTAL_TXS" "$LAST_BLOCK_HEIGHT" "$UPDATED_AT"

if [ $? -eq 0 ]; then
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "✅ DATABASE UPDATE COMPLETE"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "Wallet: $WALLET"
  echo "Mode: $MODE"
  echo "Total Rewards: $(echo "scale=6; $TOTAL_REWARDS / 1000000" | bc) CORE"
  echo "Total Transactions: $TOTAL_TXS"
  echo "Last Block Height: $LAST_BLOCK_HEIGHT"
  echo ""
  echo "🎉 Database is now ready for incremental updates!"
else
  echo ""
  echo "❌ Database update failed"
  exit 1
fi

# Clean up temporary file
rm -f update_supabase.js
