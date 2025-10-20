#!/bin/bash
# Incremental rewards query from last checkpoint
# File: query_incremental.sh
# Purpose: Query ONLY NEW rewards since last checkpoint
# Usage: ./query_incremental.sh <wallet_address>

WALLET="${1:-core1mgvlgvh2hfw5pgdqc79up3du69v2z3t8qz4kwg}"
RPC="https://full-node.mainnet-1.coreum.dev:26657"
RESULTS_FILE="rewards_results_${WALLET}.jsonl"
CHECKPOINT_FILE="rewards_checkpoint_${WALLET}.json"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔄 INCREMENTAL QUERY: New rewards since last update"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Wallet: $WALLET"
echo ""

# Check if checkpoint exists
if [ ! -f "$CHECKPOINT_FILE" ]; then
  echo "❌ No checkpoint found for this wallet"
  echo "   Please run query_full.sh first to create initial checkpoint"
  echo ""
  exit 1
fi

# Load last processed height from checkpoint
LAST_HEIGHT=$(jq -r '.last_block_height' "$CHECKPOINT_FILE")
echo "📅 Last processed: Block $LAST_HEIGHT"

# Get current blockchain height
CURRENT_HEIGHT=$(curl -s "$RPC/status" | jq -r '.result.sync_info.latest_block_height // "0"')
echo "   Current block: Block $CURRENT_HEIGHT"
echo ""

# Check if there are new blocks
if [ "$CURRENT_HEIGHT" -le "$LAST_HEIGHT" ]; then
  echo "✅ Already up to date (no new blocks since last query)"
  echo ""
  exit 0
fi

START_HEIGHT=$((LAST_HEIGHT + 1))
BLOCKS_TO_SCAN=$((CURRENT_HEIGHT - LAST_HEIGHT))
echo "📊 Scanning new blocks: $BLOCKS_TO_SCAN blocks ($START_HEIGHT → $CURRENT_HEIGHT)"
echo ""

# Query for new reward transactions
echo "📈 Counting new reward transactions..."
TOTAL_TXS=$(curl -s "$RPC/tx_search?query=\"withdraw_rewards.delegator='$WALLET'\"&per_page=1" | jq -r '.result.total_count // "0"')
TOTAL_PAGES=$(( ($TOTAL_TXS + 49) / 50 ))

echo "   Total reward claims (all time): $TOTAL_TXS"
echo ""

if [ "$TOTAL_TXS" -eq "0" ]; then
  echo "✅ No reward transactions found (wallet has never claimed rewards)"
  echo ""
  # Update checkpoint
  echo "{\"wallet\":\"$WALLET\",\"last_block_height\":$CURRENT_HEIGHT,\"updated_at\":\"$(date -u +%Y-%m-%dT%H:%M:%S.000Z)\"}" > "$CHECKPOINT_FILE"
  echo "{\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%S.000Z)\",\"mode\":\"incremental\",\"wallet\":\"$WALLET\",\"start_height\":$START_HEIGHT,\"end_height\":$CURRENT_HEIGHT,\"last_block_height\":$CURRENT_HEIGHT,\"new_rewards_ucore\":0,\"new_claim_transactions\":0}" >> "$RESULTS_FILE"
  exit 0
fi

# Fetch all transactions and filter by height range
TOTAL_AMOUNT=0
NEW_TXS=0
echo "🔄 Fetching and filtering transactions..."

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
  
  # Parse each transaction and filter by height
  PAGE_TOTAL=0
  PAGE_NEW_TXS=0
  FOUND_OLD_TX=false
  
  while read -r tx; do
    HASH=$(echo "$tx" | jq -r '.hash')
    HEIGHT=$(echo "$tx" | jq -r '.height')
    
    # Since we're ordering by desc, once we hit a block <= LAST_HEIGHT, we can stop
    if [ "$HEIGHT" -le "$LAST_HEIGHT" ]; then
      FOUND_OLD_TX=true
      break
    fi
    
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
    echo "{\"hash\":\"$HASH\",\"height\":\"$HEIGHT\",\"page\":$PAGE,\"amount\":$TX_TOTAL,\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"mode\":\"incremental\"}" >> "$RESULTS_FILE"
    
    PAGE_TOTAL=$((PAGE_TOTAL + TX_TOTAL))
    PAGE_NEW_TXS=$((PAGE_NEW_TXS + 1))
  done < <(echo "$RESPONSE" | jq -c '.result.txs[]')
  
  TOTAL_AMOUNT=$((TOTAL_AMOUNT + PAGE_TOTAL))
  NEW_TXS=$((NEW_TXS + PAGE_NEW_TXS))
  
  # If we found old transactions, we can stop querying
  if [ "$FOUND_OLD_TX" = true ]; then
    break
  fi
  
  sleep 1.5  # Rate limit - increased to avoid overwhelming RPC
done

echo ""
echo ""

# Save final results
FINAL_CORE=$(echo "scale=6; $TOTAL_AMOUNT / 1000000" | bc)

# Save summary to results file
echo "{\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%S.000Z)\",\"mode\":\"incremental\",\"wallet\":\"$WALLET\",\"start_height\":$START_HEIGHT,\"end_height\":$CURRENT_HEIGHT,\"last_block_height\":$CURRENT_HEIGHT,\"new_rewards_ucore\":$TOTAL_AMOUNT,\"new_claim_transactions\":$NEW_TXS}" >> "$RESULTS_FILE"

# Update checkpoint
echo "{\"wallet\":\"$WALLET\",\"last_block_height\":$CURRENT_HEIGHT,\"updated_at\":\"$(date -u +%Y-%m-%dT%H:%M:%S.000Z)\"}" > "$CHECKPOINT_FILE"

# Final summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ INCREMENTAL QUERY COMPLETE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "New Rewards: $FINAL_CORE CORE ($TOTAL_AMOUNT ucore)"
echo "New Claims: $NEW_TXS transactions"
echo "Blocks Scanned: $BLOCKS_TO_SCAN ($START_HEIGHT → $CURRENT_HEIGHT)"
echo ""
echo "📁 Results appended to: $RESULTS_FILE"
echo "📁 Checkpoint updated: $CHECKPOINT_FILE"
echo ""
