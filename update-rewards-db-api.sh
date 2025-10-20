#!/bin/bash
# Update Supabase database via API endpoint
# File: update-rewards-db-api.sh
# Purpose: Call the API endpoint to update wallet_rewards_history table
# Usage: ./update-rewards-db-api.sh <wallet_address> [mode]

WALLET="${1:-core1jcas459gnu857ylephjdjlea3rkr38m0asj6gw}"
MODE="${2:-full}"
API_URL="http://localhost:3001/api/admin/update-rewards-from-query"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🗄️  UPDATING SUPABASE DATABASE VIA API"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Wallet: $WALLET"
echo "Mode: $MODE"
echo "API URL: $API_URL"
echo ""

# Check if results file exists
RESULTS_FILE="rewards_results_${WALLET}.jsonl"
CHECKPOINT_FILE="rewards_checkpoint_${WALLET}.json"

if [ ! -f "$RESULTS_FILE" ]; then
  echo "❌ Results file not found: $RESULTS_FILE"
  echo "   Please run query_full.sh or query_incremental.sh first"
  exit 1
fi

if [ ! -f "$CHECKPOINT_FILE" ]; then
  echo "❌ Checkpoint file not found: $CHECKPOINT_FILE"
  echo "   Please run query_full.sh or query_incremental.sh first"
  exit 1
fi

echo "📊 Found query results files"
echo "   Results: $RESULTS_FILE"
echo "   Checkpoint: $CHECKPOINT_FILE"
echo ""

echo "🔄 Calling API endpoint..."

# Call the API endpoint
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{\"wallet\":\"$WALLET\",\"mode\":\"$MODE\"}")

# Check if curl was successful
if [ $? -ne 0 ]; then
  echo "❌ Failed to call API endpoint"
  echo "   Make sure the Next.js development server is running:"
  echo "   cd shuieldnestorg && npm run dev"
  exit 1
fi

# Parse the response
SUCCESS=$(echo "$RESPONSE" | jq -r '.success // false')
ERROR=$(echo "$RESPONSE" | jq -r '.error // null')

if [ "$SUCCESS" = "true" ]; then
  TOTAL_CORE=$(echo "$RESPONSE" | jq -r '.totalCore')
  TOTAL_TXS=$(echo "$RESPONSE" | jq -r '.totalTransactions')
  LAST_HEIGHT=$(echo "$RESPONSE" | jq -r '.lastBlockHeight')
  
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "✅ DATABASE UPDATE COMPLETE"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "Wallet: $WALLET"
  echo "Mode: $MODE"
  echo "Total Rewards: $TOTAL_CORE CORE"
  echo "Total Transactions: $TOTAL_TXS"
  echo "Last Block Height: $LAST_HEIGHT"
  echo ""
  echo "🎉 Database is now ready for incremental updates!"
else
  echo "❌ Database update failed"
  echo "Error: $ERROR"
  echo "Full response: $RESPONSE"
  exit 1
fi
