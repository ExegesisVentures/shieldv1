#!/bin/bash
# Full rewards query from wallet inception
# File: query_full.sh
# Purpose: Query ALL rewards from wallet's first transaction to present
# Usage: ./query_full.sh <wallet_address>

WALLET="${1:-core1mgvlgvh2hfw5pgdqc79up3du69v2z3t8qz4kwg}"
RPC="https://full-node.mainnet-1.coreum.dev:26657"
RESULTS_FILE="rewards_results_${WALLET}.jsonl"
CHECKPOINT_FILE="rewards_checkpoint_${WALLET}.json"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 FULL QUERY: All rewards from wallet inception"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Wallet: $WALLET"
echo ""

# Get wallet's first transaction height
echo "📊 Finding wallet's first transaction..."
FIRST_HEIGHT=$(curl -s "$RPC/tx_search?query=\"message.sender='$WALLET'\"&per_page=1&order_by=\"asc\"" | jq -r '.result.txs[0].height // "1"')

# Get current blockchain height
CURRENT_HEIGHT=$(curl -s "$RPC/status" | jq -r '.result.sync_info.latest_block_height // "0"')

echo "   First transaction: Block $FIRST_HEIGHT"
echo "   Current block: Block $CURRENT_HEIGHT"
echo ""

# Get total count of reward transactions
echo "📈 Counting total reward transactions..."
TOTAL_TXS=$(curl -s "$RPC/tx_search?query=\"withdraw_rewards.delegator='$WALLET'\"&per_page=1" | jq -r '.result.total_count // "0"')
TOTAL_PAGES=$(( ($TOTAL_TXS + 49) / 50 ))

echo "   Total reward claims: $TOTAL_TXS"
echo "   Pages to fetch: $TOTAL_PAGES"
echo ""

if [ "$TOTAL_TXS" -eq "0" ]; then
  echo "⚠️  No reward transactions found for this wallet"
  echo ""
  echo "{\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%S.000Z)\",\"mode\":\"full\",\"wallet\":\"$WALLET\",\"start_height\":$FIRST_HEIGHT,\"end_height\":$CURRENT_HEIGHT,\"last_block_height\":$CURRENT_HEIGHT,\"total_rewards_ucore\":0,\"total_claim_transactions\":0}" > "$RESULTS_FILE"
  echo "{\"wallet\":\"$WALLET\",\"last_block_height\":$CURRENT_HEIGHT,\"updated_at\":\"$(date -u +%Y-%m-%dT%H:%M:%S.000Z)\"}" > "$CHECKPOINT_FILE"
  exit 0
fi

# Clear previous results
> "$RESULTS_FILE"

# Query all pages
TOTAL_AMOUNT=0
echo "🔄 Fetching transactions..."
for ((PAGE=1; PAGE<=$TOTAL_PAGES; PAGE++)); do
  echo -ne "   Progress: Page $PAGE/$TOTAL_PAGES ($((PAGE * 100 / TOTAL_PAGES))%)...\r"
  
  # Retry logic for failed requests
  MAX_RETRIES=3
  RETRY_COUNT=0
  SUCCESS=false
  
  while [ $RETRY_COUNT -lt $MAX_RETRIES ] && [ "$SUCCESS" = false ]; do
    RESPONSE=$(curl -s --max-time 30 "$RPC/tx_search?query=\"withdraw_rewards.delegator='$WALLET'\"&per_page=50&page=$PAGE&order_by=\"desc\"")
    
    # Check for valid JSON response
    if echo "$RESPONSE" | jq -e '.result.txs' > /dev/null 2>&1; then
      SUCCESS=true
    else
      RETRY_COUNT=$((RETRY_COUNT + 1))
      if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
        echo ""
        echo "   ⚠️  Error on page $PAGE, retrying ($RETRY_COUNT/$MAX_RETRIES)..."
        sleep 3
      fi
    fi
  done
  
  # If all retries failed, exit
  if [ "$SUCCESS" = false ]; then
    echo ""
    echo "❌ Failed to fetch page $PAGE after $MAX_RETRIES attempts"
    echo "Response: $(echo "$RESPONSE" | head -c 200)"
    exit 1
  fi
  
  # Parse each transaction
  PAGE_TOTAL=0
  while read -r tx; do
    HASH=$(echo "$tx" | jq -r '.hash')
    HEIGHT=$(echo "$tx" | jq -r '.height')
    
    # Extract reward amounts ONLY for this specific delegator
    # Each withdraw_rewards event has a "delegator" attribute - we must filter by it
    AMOUNTS=""
    while read -r event; do
      # Check if this event has our wallet as the delegator
      DELEGATOR=$(echo "$event" | jq -r '.attributes[] | select(.key == "delegator") | .value')
      if [ "$DELEGATOR" = "$WALLET" ]; then
        # Extract amounts only from events matching our wallet
        EVENT_AMOUNTS=$(echo "$event" | jq -r '.attributes[] | select(.key == "amount") | .value' | grep -o '[0-9]*ucore' | sed 's/ucore//')
        AMOUNTS="$AMOUNTS $EVENT_AMOUNTS"
      fi
    done < <(echo "$tx" | jq -c '.tx_result.events[] | select(.type == "withdraw_rewards")')
    
    TX_TOTAL=0
    for amount in $AMOUNTS; do
      TX_TOTAL=$((TX_TOTAL + amount))
    done
    
    # Save transaction detail
    echo "{\"hash\":\"$HASH\",\"height\":\"$HEIGHT\",\"page\":$PAGE,\"amount\":$TX_TOTAL,\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" >> "$RESULTS_FILE"
    
    PAGE_TOTAL=$((PAGE_TOTAL + TX_TOTAL))
  done < <(echo "$RESPONSE" | jq -c '.result.txs[]')
  
  TOTAL_AMOUNT=$((TOTAL_AMOUNT + PAGE_TOTAL))
  
  sleep 1.5  # Rate limit - increased to avoid overwhelming RPC
done

echo ""
echo ""

# Save final results
FINAL_CORE=$(echo "scale=6; $TOTAL_AMOUNT / 1000000" | bc)

# Save summary to results file
echo "{\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%S.000Z)\",\"mode\":\"full\",\"wallet\":\"$WALLET\",\"start_height\":$FIRST_HEIGHT,\"end_height\":$CURRENT_HEIGHT,\"last_block_height\":$CURRENT_HEIGHT,\"total_rewards_ucore\":$TOTAL_AMOUNT,\"total_claim_transactions\":$TOTAL_TXS}" >> "$RESULTS_FILE"

# Save checkpoint
echo "{\"wallet\":\"$WALLET\",\"last_block_height\":$CURRENT_HEIGHT,\"updated_at\":\"$(date -u +%Y-%m-%dT%H:%M:%S.000Z)\"}" > "$CHECKPOINT_FILE"

# Final summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ FULL QUERY COMPLETE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Total Rewards: $FINAL_CORE CORE ($TOTAL_AMOUNT ucore)"
echo "Total Claims: $TOTAL_TXS transactions"
echo "Height Range: $FIRST_HEIGHT → $CURRENT_HEIGHT"
echo ""
echo "📁 Results saved to: $RESULTS_FILE"
echo "📁 Checkpoint saved to: $CHECKPOINT_FILE"
echo ""