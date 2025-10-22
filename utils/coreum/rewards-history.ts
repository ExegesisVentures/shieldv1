/**
 * Historical Rewards Tracking for Coreum Wallets
 * Queries blockchain for all withdraw_rewards transactions and caches results
 */

import { createClient } from "@supabase/supabase-js";

const COREUM_REST_ENDPOINT = process.env.NEXT_PUBLIC_COREUM_REST_ENDPOINT || "https://full-node.mainnet-1.coreum.dev:1317";
const COREUM_RPC_ENDPOINT = process.env.NEXT_PUBLIC_COREUM_RPC_ENDPOINT || "https://full-node.mainnet-1.coreum.dev:26657";
const MIN_REFRESH_INTERVAL = 72 * 60 * 60 * 1000; // 72 hours (3 days) - minimum time between manual refreshes (only for first-time calculation)
const STALENESS_THRESHOLD = 72 * 60 * 60 * 1000; // 72 hours (3 days) - show stale indicator after this
const AUTO_UPDATE_THRESHOLD = 72 * 60 * 60 * 1000; // 72 hours (3 days) - auto-update if older than this

// Supabase client with service role for database writes
const getServiceSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, supabaseServiceKey);
};

interface RewardTransaction {
  height: string;
  txhash: string;
  timestamp: string;
  amount: string; // in ucore
}

interface RewardsHistoryData {
  wallet_address: string;
  total_rewards_ucore: string;
  total_claim_transactions: number;
  first_reward_at: string | null;
  last_reward_at: string | null;
  last_updated_at: string;
}

/**
 * Query Coreum blockchain for all MsgWithdrawDelegatorReward transactions for an address
 * This includes direct claims and authz auto-compounding (MsgExec wrapping MsgWithdrawDelegatorReward)
 * 
 * IMPORTANT: This function queries ONLY for the specific wallet address provided.
 * It does NOT scan blocks or find random addresses - it queries using:
 * withdraw_rewards.delegator='<address>' which filters to ONLY this wallet's transactions.
 * 
 * This ensures we only track rewards for user wallets in our system, not random blockchain addresses.
 */
export async function queryRewardsTransactions(address: string): Promise<RewardTransaction[]> {
  const transactions: RewardTransaction[] = [];
  const seenTxHashes = new Set<string>(); // Deduplication
  let paginationKey: string | null = null;
  const maxPages = 100; // Safety limit
  let pageCount = 0;

  console.log(`🔍 [Rewards History] Querying blockchain for ${address}`);
  console.log(`🔍 [Rewards History] Looking for MsgWithdrawDelegatorReward transactions (including authz)`);
  console.log(`🔍 [Rewards History] ONLY querying for this specific address - not scanning blocks`);

  try {
    do {
      // Query transactions using RPC endpoint (REST API doesn't work for tx queries)
      // Query specifically for withdraw_rewards transactions for THIS ADDRESS ONLY
      // The query filter ensures we only get transactions where delegator = this address
      let page = pageCount + 1;
      let url = `${COREUM_RPC_ENDPOINT}/tx_search?query="withdraw_rewards.delegator='${address}'"&per_page=100&page=${page}&order_by="desc"`;

      console.log(`📡 [Rewards History] Fetching: ${url}`);
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`❌ [Rewards History] Failed to fetch transactions: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.error(`❌ [Rewards History] Error body:`, errorText.substring(0, 500));
        break;
      }

      const data = await response.json();
      const txs = data.result?.txs || [];
      const totalCount = parseInt(data.result?.total_count || '0');
      
      console.log(`📄 [Rewards History] Page ${pageCount + 1}: Found ${txs.length} transactions (total: ${totalCount})`);
      
      if (pageCount === 0 && txs.length === 0) {
        console.log(`ℹ️ [Rewards History] No coin_received transactions found`);
        console.log(`ℹ️ [Rewards History] This could mean no rewards claimed`);
      }

      // Parse each transaction, filtering for reward claims
      for (const tx of txs) {
        const parsed = parseRPCRewardTransaction(tx, address);
        if (parsed && !seenTxHashes.has(parsed.txhash)) {
          seenTxHashes.add(parsed.txhash);
          transactions.push(parsed);
          console.log(`  ✓ Found reward: ${(BigInt(parsed.amount) / BigInt(1_000_000)).toString()} CORE at ${parsed.timestamp}`);
        }
      }

      // Increment page count
      pageCount++;

      // Safety check
      if (pageCount >= maxPages) {
        console.warn(`⚠️ [Rewards History] Reached max pages (${maxPages}), stopping pagination`);
        break;
      }

      // Check if there are more pages
      const hasMore = pageCount * 100 < totalCount;
      if (!hasMore) break;

    } while (true);

    console.log(`✅ [Rewards History] Found ${transactions.length} total reward transactions for ${address}`);
    if (transactions.length > 0) {
      const totalRewards = transactions.reduce((sum, tx) => sum + BigInt(tx.amount), BigInt(0));
      console.log(`💰 [Rewards History] Total rewards: ${(totalRewards / BigInt(1_000_000)).toString()} CORE`);
    }
    return transactions;

  } catch (error) {
    console.error(`❌ [Rewards History] Error querying transactions:`, error);
    return transactions; // Return what we have so far
  }
}

/**
 * Parse RPC transaction response to extract reward amount and metadata
 * RPC format has different structure than REST API
 */
function parseRPCRewardTransaction(tx: any, walletAddress: string): RewardTransaction | null {
  try {
    // RPC response structure: tx.tx_result.events for events, tx.hash for hash, tx.height for height
    const txHash = tx.hash || '';
    const height = tx.height || '0';
    const timestamp = tx.tx_result?.log ? new Date().toISOString() : new Date().toISOString(); // RPC doesn't include timestamp, use current
    
    const events = tx.tx_result?.events || [];
    let totalAmount = BigInt(0);

    // We're querying withdraw_rewards transactions, so find coin_received for this wallet
    for (const event of events) {
      if (event.type === 'coin_received') {
        let receiver = '';
        let amount = '';
        
        for (const attr of event.attributes || []) {
          if (attr.key === 'receiver') {
            receiver = attr.value;
          } else if (attr.key === 'amount') {
            amount = attr.value;
          }
        }
        
        // Only count if receiver matches our wallet
        if (receiver === walletAddress && amount) {
          const match = amount.match(/(\d+)ucore/);
          if (match) {
            totalAmount += BigInt(match[1]);
            console.log(`    💰 coin_received: ${match[1]} ucore (${(BigInt(match[1]) / BigInt(1_000_000)).toString()} CORE)`);
          }
        }
      }
    }

    if (totalAmount > 0) {
      return {
        height,
        txhash: txHash,
        timestamp,
        amount: totalAmount.toString(),
      };
    }

    return null;
  } catch (error) {
    console.error(`❌ [Rewards History] Error parsing RPC transaction:`, error);
    return null;
  }
}

/**
 * Parse a transaction to extract reward amount and metadata
 * Looks for coin_received events from MsgWithdrawDelegatorReward transactions
 * (Kept for backwards compatibility, but RPC parsing is preferred)
 */
function parseRewardTransaction(tx: any, walletAddress: string): RewardTransaction | null {
  try {
    // Extract timestamp
    const timestamp = tx.timestamp || new Date().toISOString();
    
    // Get the transaction data
    const txBody = tx.tx?.body || tx.body;
    const txResponse = tx.tx_response || tx;
    
    // Check if this transaction contains MsgWithdrawDelegatorReward (direct or via MsgExec for authz)
    const messages = txBody?.messages || [];
    let isWithdrawReward = false;
    
    for (const msg of messages) {
      const msgType = msg['@type'] || msg.type;
      if (msgType === '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward') {
        isWithdrawReward = true;
        break;
      }
      // Check for authz MsgExec wrapping MsgWithdrawDelegatorReward
      if (msgType === '/cosmos.authz.v1beta1.MsgExec') {
        const innerMsgs = msg.msgs || [];
        for (const innerMsg of innerMsgs) {
          const innerType = innerMsg['@type'] || innerMsg.type;
          if (innerType === '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward') {
            isWithdrawReward = true;
            break;
          }
        }
      }
    }
    
    if (!isWithdrawReward) {
      return null; // Not a reward claim transaction
    }
    
    // Parse logs/events to find coin_received events for this wallet
    const logs = txResponse?.logs || txResponse.log || [];
    let totalAmount = BigInt(0);

    for (const log of logs) {
      const events = log.events || [];
      
      for (const event of events) {
        if (event.type === 'coin_received') {
          // Find receiver and amount attributes
          let receiver = '';
          let amount = '';
          
          for (const attr of event.attributes || []) {
            let key = attr.key;
            let value = attr.value;
            
            // Decode base64 if needed
            try {
              key = Buffer.from(key, 'base64').toString('utf-8');
            } catch {}
            try {
              value = Buffer.from(value, 'base64').toString('utf-8');
            } catch {}
            
            if (key === 'receiver') {
              receiver = value;
            } else if (key === 'amount') {
              amount = value;
            }
          }
          
          // Only count if receiver matches our wallet
          if (receiver === walletAddress && amount) {
            // Extract numeric amount from "1500000ucore" format
            const match = amount.match(/(\d+)ucore/);
            if (match) {
              totalAmount += BigInt(match[1]);
              console.log(`    💰 coin_received: ${match[1]} ucore (${(BigInt(match[1]) / BigInt(1_000_000)).toString()} CORE)`);
            }
          }
        }
      }
    }

    if (totalAmount > 0) {
      return {
        height: txResponse?.height || '0',
        txhash: txResponse?.txhash || '',
        timestamp,
        amount: totalAmount.toString(),
      };
    }

    return null; // No rewards found for this wallet in this transaction
  } catch (error) {
    console.error(`❌ [Rewards History] Error parsing transaction:`, error);
    return null;
  }
}

/**
 * Calculate total historical rewards for an address from transaction list
 */
export function aggregateRewards(transactions: RewardTransaction[]): {
  total: string;
  count: number;
  firstReward: string | null;
  lastReward: string | null;
} {
  let total = BigInt(0);
  let firstReward: string | null = null;
  let lastReward: string | null = null;

  // Sort by timestamp (oldest first)
  const sorted = [...transactions].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  for (const tx of sorted) {
    total += BigInt(tx.amount);
    
    if (!firstReward) {
      firstReward = tx.timestamp;
    }
    lastReward = tx.timestamp;
  }

  return {
    total: total.toString(),
    count: transactions.length,
    firstReward,
    lastReward,
  };
}

/**
 * Check if cached data is allowed to be refreshed (rate limiting - once per 24h)
 */
async function canRefresh(address: string): Promise<{ allowed: boolean; hoursUntilNextRefresh?: number }> {
  const supabase = getServiceSupabase();
  
  const { data, error } = await supabase
    .from('wallet_rewards_history')
    .select('last_updated_at')
    .eq('wallet_address', address)
    .maybeSingle();

  if (error || !data) {
    // No data exists, can refresh
    return { allowed: true };
  }

  const lastUpdated = new Date(data.last_updated_at).getTime();
  const now = Date.now();
  const age = now - lastUpdated;

  if (age < MIN_REFRESH_INTERVAL) {
    // Too soon to refresh
    const hoursRemaining = (MIN_REFRESH_INTERVAL - age) / (60 * 60 * 1000);
    return { 
      allowed: false, 
      hoursUntilNextRefresh: Math.ceil(hoursRemaining) 
    };
  }

  return { allowed: true };
}

/**
 * Check if cached data is stale (>72 hours / 3 days old)
 */
export async function isDataStale(address: string): Promise<{ isStale: boolean; hoursSinceUpdate?: number }> {
  const supabase = getServiceSupabase();
  
  const { data, error } = await supabase
    .from('wallet_rewards_history')
    .select('last_updated_at')
    .eq('wallet_address', address)
    .maybeSingle();

  if (error || !data) {
    // No data exists, not stale (it's new)
    return { isStale: false };
  }

  const lastUpdated = new Date(data.last_updated_at).getTime();
  const now = Date.now();
  const age = now - lastUpdated;

  if (age > STALENESS_THRESHOLD) {
    const hoursSinceUpdate = Math.floor(age / (60 * 60 * 1000));
    return { 
      isStale: true, 
      hoursSinceUpdate 
    };
  }

  return { isStale: false };
}

/**
 * Fetch historical rewards for an address (manual refresh only - no auto-refresh)
 * Returns cached data if available, or null if no data exists
 */
export async function getHistoricalRewards(
  address: string,
  forceRefresh: boolean = false
): Promise<RewardsHistoryData | null> {
  const supabase = getServiceSupabase();

  // If force refresh requested, check if allowed (rate limiting)
  if (forceRefresh) {
    const refreshCheck = await canRefresh(address);
    
    if (!refreshCheck.allowed) {
      console.warn(`⏰ [Rewards History] Refresh rate limited for ${address}. Try again in ${refreshCheck.hoursUntilNextRefresh} hours`);
      // Return cached data instead with rate limit info
      const { data } = await supabase
        .from('wallet_rewards_history')
        .select('*')
        .eq('wallet_address', address)
        .maybeSingle();
      
      // Attach rate limit info to the returned data
      if (data) {
        (data as any).rateLimited = true;
        (data as any).hoursUntilNextRefresh = refreshCheck.hoursUntilNextRefresh;
      }
      
      return data as RewardsHistoryData | null;
    }

    // Allowed to refresh - fetch from blockchain
    console.log(`🔄 [Rewards History] Manual refresh from blockchain for ${address}`);
    
    const transactions = await queryRewardsTransactions(address);
    const aggregated = aggregateRewards(transactions);

    const historyData: Partial<RewardsHistoryData> = {
      wallet_address: address,
      total_rewards_ucore: aggregated.total,
      total_claim_transactions: aggregated.count,
      first_reward_at: aggregated.firstReward,
      last_reward_at: aggregated.lastReward,
      last_updated_at: new Date().toISOString(),
    };

    // Upsert to database
    const { data: upsertedData, error: upsertError } = await supabase
      .from('wallet_rewards_history')
      .upsert(historyData, { onConflict: 'wallet_address' })
      .select()
      .single();

    if (upsertError) {
      console.error(`❌ [Rewards History] Failed to cache data:`, upsertError);
      return historyData as RewardsHistoryData;
    }

    console.log(`✅ [Rewards History] Cached updated data for ${address}`);
    return upsertedData as RewardsHistoryData;
  }

  // No force refresh - just return cached data
  const { data, error } = await supabase
    .from('wallet_rewards_history')
    .select('*')
    .eq('wallet_address', address)
    .maybeSingle();

  if (!error && data) {
    console.log(`✅ [Rewards History] Returning cached data for ${address}`);
    return data as RewardsHistoryData;
  }

  console.log(`ℹ️ [Rewards History] No cached data for ${address}`);
  return null;
}

/**
 * Refresh historical rewards for multiple addresses
 * Only refreshes wallets that actually need it (stale or missing data)
 */
export async function refreshMultipleWallets(addresses: string[]): Promise<{
  success: number;
  failed: number;
  results: Array<{ address: string; success: boolean; error?: string; hoursUntilNextRefresh?: number }>;
}> {
  const results = [];
  let success = 0;
  let failed = 0;

  for (const address of addresses) {
    try {
      // Check if this wallet actually needs refreshing
      const staleCheck = await isDataStale(address);
      const canRefreshCheck = await canRefresh(address);
      
      // Skip if data is fresh and can't refresh
      if (!staleCheck.isStale && !canRefreshCheck.allowed) {
        console.log(`⏭️ [Rewards History] Skipping ${address} - data is fresh`);
        results.push({ address, success: true });
        success++;
        continue;
      }
      
      console.log(`🔄 [Rewards History] Refreshing ${address} - stale: ${staleCheck.isStale}, canRefresh: ${canRefreshCheck.allowed}`);
      const data = await getHistoricalRewards(address, true);
      
      // Check if rate limited
      if (data && (data as any).rateLimited) {
        results.push({ 
          address, 
          success: false, 
          error: 'rate limited',
          hoursUntilNextRefresh: (data as any).hoursUntilNextRefresh 
        });
        failed++;
      } else {
        results.push({ address, success: true });
        success++;
      }
    } catch (error: any) {
      results.push({ 
        address, 
        success: false, 
        error: error?.message || String(error) 
      });
      failed++;
    }
  }

  return { success, failed, results };
}

/**
 * Get rewards for user's connected wallets (non-custodial)
 */
export async function getUserWalletsRewards(addresses: string[]): Promise<{
  total: string;
  walletCount: number;
  wallets: Array<{ 
    address: string; 
    rewards: string; 
    label?: string;
    isStale: boolean;
    hoursSinceUpdate?: number;
    lastUpdated?: string;
  }>;
  anyStale: boolean;
}> {
  const supabase = getServiceSupabase();

  // Get rewards history for these addresses
  const { data: rewardsData, error: rewardsError } = await supabase
    .from('wallet_rewards_history')
    .select('*')
    .in('wallet_address', addresses);

  if (rewardsError) {
    console.error('Failed to fetch rewards history:', rewardsError);
    return { total: '0', walletCount: 0, wallets: [], anyStale: false };
  }

  // Calculate total and check staleness
  let total = BigInt(0);
  let anyStale = false;
  
  const walletRewards = await Promise.all(
    addresses.map(async (address) => {
      const history = rewardsData?.find(r => r.wallet_address === address);
      const rewards = history?.total_rewards_ucore || '0';
      total += BigInt(rewards);
      
      // Check staleness
      const staleCheck = await isDataStale(address);
      if (staleCheck.isStale) {
        anyStale = true;
      }
      
      return {
        address,
        rewards,
        isStale: staleCheck.isStale,
        hoursSinceUpdate: staleCheck.hoursSinceUpdate,
        lastUpdated: history?.last_updated_at,
      };
    })
  );

  return {
    total: total.toString(),
    walletCount: addresses.length,
    wallets: walletRewards,
    anyStale,
  };
}

/**
 * Get total rewards across all custodial wallets
 */
export async function getTotalCustodialRewards(): Promise<{
  total: string;
  walletCount: number;
  wallets: Array<{ address: string; rewards: string; label?: string }>;
}> {
  const supabase = getServiceSupabase();

  // Get all custodial wallet addresses
  const { data: wallets, error: walletsError } = await supabase
    .from('wallets')
    .select('address, label')
    .eq('is_custodial', true);

  if (walletsError || !wallets) {
    console.error('Failed to fetch custodial wallets:', walletsError);
    return { total: '0', walletCount: 0, wallets: [] };
  }

  const addresses = wallets.map(w => w.address);

  // Get rewards history for these addresses
  const { data: rewardsData, error: rewardsError } = await supabase
    .from('wallet_rewards_history')
    .select('*')
    .in('wallet_address', addresses);

  if (rewardsError) {
    console.error('Failed to fetch rewards history:', rewardsError);
    return { total: '0', walletCount: 0, wallets: [] };
  }

  // Calculate total
  let total = BigInt(0);
  const walletRewards = wallets.map(wallet => {
    const history = rewardsData?.find(r => r.wallet_address === wallet.address);
    const rewards = history?.total_rewards_ucore || '0';
    total += BigInt(rewards);
    
    return {
      address: wallet.address,
      label: wallet.label,
      rewards,
    };
  });

  return {
    total: total.toString(),
    walletCount: wallets.length,
    wallets: walletRewards,
  };
}

