#!/bin/bash

# ============================================
# CREATE VPS CURATED ENDPOINT
# ============================================
# 
# This script creates the /api/tradepairs/curated endpoint
# on the VPS that serves trading pairs and tokens data
# for import into the database.
#
# This endpoint is consumed by the import_coredex_pairs
# Supabase Edge Function.
#
# Usage: bash create-vps-curated-endpoint.sh

set -e

VPS_IP="168.231.127.180"
VPS_USER="root"
VPS_PORT="22"
VPS_APP_DIR="/root/coredex-aggregator"

echo "============================================"
echo "🚀 CREATE VPS CURATED ENDPOINT"
echo "============================================"
echo ""
echo "VPS: ${VPS_IP}"
echo "App Directory: ${VPS_APP_DIR}"
echo ""

# Read trading pairs and tokens from local files
TRADING_PAIRS_FILE="shuieldnestorg/data/trading-pairs.json"
TOKENS_FILE="shuieldnestorg/data/tokens-list.json"

if [ ! -f "$TRADING_PAIRS_FILE" ]; then
    echo "❌ Error: Trading pairs file not found: $TRADING_PAIRS_FILE"
    exit 1
fi

if [ ! -f "$TOKENS_FILE" ]; then
    echo "❌ Error: Tokens file not found: $TOKENS_FILE"
    exit 1
fi

echo "📦 Found local data files:"
echo "   - Trading pairs: $TRADING_PAIRS_FILE"
echo "   - Tokens: $TOKENS_FILE"
echo ""

# Create the endpoint script for VPS
cat > /tmp/curated-endpoint-handler.js << 'EOFHANDLER'
/**
 * Curated Trading Pairs Endpoint
 * Returns trading pairs and tokens in database-ready format
 */

const fs = require('fs');
const path = require('path');

function handleCuratedEndpoint(req, res) {
  try {
    // Read trading pairs data
    const pairsPath = path.join(__dirname, 'data', 'trading-pairs.json');
    const tokensPath = path.join(__dirname, 'data', 'tokens-list.json');
    
    if (!fs.existsSync(pairsPath) || !fs.existsSync(tokensPath)) {
      return res.status(404).json({ 
        error: 'Curated data files not found. Please run setup first.' 
      });
    }
    
    const tradingPairsData = JSON.parse(fs.readFileSync(pairsPath, 'utf-8'));
    const tokensData = JSON.parse(fs.readFileSync(tokensPath, 'utf-8'));
    
    // Transform trading pairs to database format
    const pairs = tradingPairsData.pairs.flatMap(pair => {
      return pair.pools.map(pool => {
        const source = pool.dex.toLowerCase().replace(/\s+/g, '-');
        const pairId = `${source}-${pair.baseSymbol}-${pair.quoteSymbol}`.toLowerCase();
        
        return {
          pair_id: pairId,
          source: source,
          symbol: pair.displaySymbol,
          base_asset: pair.baseSymbol,
          quote_asset: pair.quoteSymbol,
          base_denom: pair.baseDenom,
          quote_denom: pair.quoteDenom,
          pool_contract: pool.contract,
          liquidity_token: null,
          base_decimals: 6,
          quote_decimals: 6,
        };
      });
    });
    
    // Transform tokens to database format
    const tokens = tokensData.tokens.map(token => ({
      denom: token.denom,
      symbol: token.symbol,
      name: token.name,
      type: token.type,
      contractAddress: token.contractAddress || null,
      decimals: token.decimals,
      is_active: true,
    }));
    
    res.json({
      success: true,
      pairs: pairs,
      tokens: tokens,
      metadata: {
        totalPairs: pairs.length,
        totalTokens: tokens.length,
        sources: ['pulsara-dex', 'cruise-control'],
        generated: new Date().toISOString(),
      }
    });
    
  } catch (error) {
    console.error('Error serving curated endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to serve curated data',
      message: error.message 
    });
  }
}

module.exports = { handleCuratedEndpoint };
EOFHANDLER

echo "📝 Created endpoint handler script"
echo ""

# Copy data files and handler to VPS
echo "📤 Uploading files to VPS..."

# Create data directory on VPS
ssh -p ${VPS_PORT} ${VPS_USER}@${VPS_IP} "mkdir -p ${VPS_APP_DIR}/data"

# Upload trading pairs
scp -P ${VPS_PORT} "$TRADING_PAIRS_FILE" ${VPS_USER}@${VPS_IP}:${VPS_APP_DIR}/data/

# Upload tokens
scp -P ${VPS_PORT} "$TOKENS_FILE" ${VPS_USER}@${VPS_IP}:${VPS_APP_DIR}/data/

# Upload handler
scp -P ${VPS_PORT} /tmp/curated-endpoint-handler.js ${VPS_USER}@${VPS_IP}:${VPS_APP_DIR}/

echo "✅ Files uploaded successfully"
echo ""

# Update server.js to include the curated endpoint
echo "🔧 Updating server.js on VPS..."

ssh -p ${VPS_PORT} ${VPS_USER}@${VPS_IP} << 'EOFSSH'
cd /root/coredex-aggregator

# Backup existing server.js
cp server.js server.js.backup

# Check if curated endpoint already exists
if grep -q "/api/tradepairs/curated" server.js; then
    echo "⚠️  Curated endpoint already exists in server.js"
else
    # Add the curated endpoint handler
    cat >> server.js << 'EOFSERVER'

// Import curated endpoint handler
const { handleCuratedEndpoint } = require('./curated-endpoint-handler');

// Curated trading pairs endpoint
app.get('/api/tradepairs/curated', (req, res) => {
  handleCuratedEndpoint(req, res);
});

EOFSERVER
    echo "✅ Added curated endpoint to server.js"
fi

# Restart the service
echo "🔄 Restarting CoreDEX API service..."
pm2 restart coredex-api || pm2 start server.js --name coredex-api

echo "✅ Service restarted"
EOFSSH

echo ""
echo "🧪 Testing the endpoint..."
sleep 2

# Test the endpoint
RESPONSE=$(curl -s "http://${VPS_IP}:8080/api/tradepairs/curated")

# Check if response contains expected data
if echo "$RESPONSE" | grep -q '"success":true'; then
    echo "✅ Endpoint is working!"
    
    # Extract counts
    PAIR_COUNT=$(echo "$RESPONSE" | grep -o '"totalPairs":[0-9]*' | grep -o '[0-9]*')
    TOKEN_COUNT=$(echo "$RESPONSE" | grep -o '"totalTokens":[0-9]*' | grep -o '[0-9]*')
    
    echo ""
    echo "📊 Endpoint Response:"
    echo "   Total Pairs: ${PAIR_COUNT}"
    echo "   Total Tokens: ${TOKEN_COUNT}"
else
    echo "⚠️  Warning: Endpoint may not be working correctly"
    echo "Response: $RESPONSE"
fi

echo ""
echo "============================================"
echo "🎉 SETUP COMPLETE"
echo "============================================"
echo ""
echo "✅ VPS curated endpoint is ready at:"
echo "   http://${VPS_IP}:8080/api/tradepairs/curated"
echo ""
echo "🚀 Next Steps:"
echo "   1. Run: npx tsx shuieldnestorg/scripts/import-trading-pairs-to-db.ts"
echo "   2. Or call the Supabase Edge Function: import_coredex_pairs"
echo "   3. Then refresh rates cache to populate prices"
echo ""

# Cleanup
rm -f /tmp/curated-endpoint-handler.js

exit 0

