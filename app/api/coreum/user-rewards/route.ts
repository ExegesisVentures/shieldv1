import { NextRequest, NextResponse } from 'next/server';
import { getUserWalletsRewards, refreshMultipleWallets } from '@/utils/coreum/rewards-history';
import { createClient } from '@supabase/supabase-js';
import { exec } from 'child_process';
import { promisify } from 'util';
import { join } from 'path';
import { isValidCoreumAddress } from '@/utils/address-utils';

const execAsync = promisify(exec);

// Security and rate limiting constants
const MAX_WALLETS_PER_REQUEST = 5;
const MAX_REQUESTS_PER_HOUR = 10;
const MAX_REQUESTS_PER_DAY = 50;
const BLOCKCHAIN_QUERY_TIMEOUT = 300000; // 5 minutes

// Get service role client for database operations
const getServiceSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, supabaseServiceKey);
};

// Security: Check if user is authenticated and get their ID
async function getAuthenticatedUser(request: NextRequest) {
  const supabase = getServiceSupabase();
  
  // Get auth token from request headers
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return null;
    }
    return user;
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}

// Security: Rate limiting per user
async function checkRateLimit(userId: string, action: 'request' | 'refresh'): Promise<{
  allowed: boolean;
  resetTime?: number;
  remaining?: number;
}> {
  const supabase = getServiceSupabase();
  const now = Date.now();
  const hourAgo = now - (60 * 60 * 1000);
  const dayAgo = now - (24 * 60 * 60 * 1000);
  
  try {
    // Check hourly limit
    const { data: hourlyRequests } = await supabase
      .from('user_rate_limits')
      .select('count')
      .eq('user_id', userId)
      .eq('action', action)
      .gte('created_at', new Date(hourAgo).toISOString());
    
    const hourlyCount = hourlyRequests?.reduce((sum, req) => sum + req.count, 0) || 0;
    const hourlyLimit = action === 'refresh' ? 3 : MAX_REQUESTS_PER_HOUR;
    
    if (hourlyCount >= hourlyLimit) {
      return { 
        allowed: false, 
        resetTime: hourAgo + (60 * 60 * 1000),
        remaining: 0
      };
    }
    
    // Check daily limit
    const { data: dailyRequests } = await supabase
      .from('user_rate_limits')
      .select('count')
      .eq('user_id', userId)
      .eq('action', action)
      .gte('created_at', new Date(dayAgo).toISOString());
    
    const dailyCount = dailyRequests?.reduce((sum, req) => sum + req.count, 0) || 0;
    const dailyLimit = action === 'refresh' ? 10 : MAX_REQUESTS_PER_DAY;
    
    if (dailyCount >= dailyLimit) {
      return { 
        allowed: false, 
        resetTime: dayAgo + (24 * 60 * 60 * 1000),
        remaining: 0
      };
    }
    
    // Record this request
    await supabase
      .from('user_rate_limits')
      .insert({
        user_id: userId,
        action,
        count: 1,
        created_at: new Date().toISOString()
      });
    
    return { 
      allowed: true, 
      remaining: Math.min(hourlyLimit - hourlyCount - 1, dailyLimit - dailyCount - 1)
    };
    
  } catch (error) {
    console.error('Rate limit check error:', error);
    // Fail open - allow request if rate limiting fails
    return { allowed: true };
  }
}

// Security: Validate wallet addresses
function validateWalletAddresses(addresses: string[]): { valid: string[]; invalid: string[] } {
  const valid: string[] = [];
  const invalid: string[] = [];
  
  for (const address of addresses) {
    if (isValidCoreumAddress(address)) {
      valid.push(address);
    } else {
      invalid.push(address);
    }
  }
  
  return { valid, invalid };
}

// Enhanced blockchain query with our scripts
async function queryWalletRewardsFromBlockchain(address: string, mode: 'full' | 'incremental' = 'full'): Promise<{
  success: boolean;
  error?: string;
  totalRewards?: string;
  totalTransactions?: number;
}> {
  try {
    const scriptDir = join(process.cwd(), '..');
    const scriptName = mode === 'full' ? 'query_full.sh' : 'query_incremental.sh';
    const scriptPath = join(scriptDir, scriptName);
    
    console.log(`🔄 [Blockchain Query] Running ${scriptName} for ${address}`);
    
    // Run the blockchain query script with timeout
    const { stdout, stderr } = await execAsync(
      `cd "${scriptDir}" && timeout ${BLOCKCHAIN_QUERY_TIMEOUT / 1000} ./${scriptName} "${address}"`,
      { 
        timeout: BLOCKCHAIN_QUERY_TIMEOUT,
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      }
    );
    
    if (stderr && !stderr.includes('✅')) {
      console.error(`❌ [Blockchain Query] Script error for ${address}:`, stderr);
      return { success: false, error: `Script execution failed: ${stderr}` };
    }
    
    // Update database with results
    console.log(`🗄️ [Blockchain Query] Updating database for ${address}`);
    const { stdout: updateStdout, stderr: updateStderr } = await execAsync(
      `cd "${scriptDir}" && ./update-rewards-db-api.sh "${address}" "${mode}"`,
      { timeout: 30000 } // 30 second timeout for DB update
    );
    
    if (updateStderr && !updateStderr.includes('✅')) {
      console.error(`❌ [Database Update] Error for ${address}:`, updateStderr);
      return { success: false, error: `Database update failed: ${updateStderr}` };
    }
    
    console.log(`✅ [Blockchain Query] Successfully processed ${address}`);
    return { success: true };
    
  } catch (error: any) {
    console.error(`❌ [Blockchain Query] Error for ${address}:`, error);
    
    if (error.code === 'TIMEOUT') {
      return { success: false, error: 'Query timeout - wallet may have too many transactions' };
    }
    
    return { success: false, error: error.message || 'Unknown error occurred' };
  }
}

// Multi-wallet workflow: Handle new vs existing wallets
async function processMultiWalletRefresh(addresses: string[], userId?: string): Promise<{
  success: number;
  failed: number;
  results: Array<{ address: string; success: boolean; error?: string; mode?: string }>;
}> {
  const supabase = getServiceSupabase();
  const results: Array<{ address: string; success: boolean; error?: string; mode?: string }> = [];
  
  // Check which wallets already have data in database
  const { data: existingWallets } = await supabase
    .from('wallet_rewards_history')
    .select('wallet_address, last_updated_at')
    .in('wallet_address', addresses);
  
  const existingAddresses = new Set(existingWallets?.map(w => w.wallet_address) || []);
  
  console.log(`📊 [Multi-Wallet] Processing ${addresses.length} wallets:`);
  console.log(`   Existing: ${existingAddresses.size}`);
  console.log(`   New: ${addresses.length - existingAddresses.size}`);
  
  // Process each wallet
  for (const address of addresses) {
    try {
      const hasExistingData = existingAddresses.has(address);
      const mode = hasExistingData ? 'incremental' : 'full';
      
      console.log(`🔄 [Multi-Wallet] Processing ${address} (${mode} mode) - hasExistingData: ${hasExistingData}`);
      
      const result = await queryWalletRewardsFromBlockchain(address, mode);
      
      results.push({
        address,
        success: result.success,
        error: result.error,
        mode
      });
      
      if (result.success) {
        console.log(`✅ [Multi-Wallet] ${address} processed successfully`);
      } else {
        console.error(`❌ [Multi-Wallet] ${address} failed:`, result.error);
      }
      
    } catch (error: any) {
      console.error(`❌ [Multi-Wallet] Unexpected error for ${address}:`, error);
      results.push({
        address,
        success: false,
        error: error.message || 'Unexpected error'
      });
    }
  }
  
  const success = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  return { success, failed, results };
}

/**
 * GET /api/coreum/user-rewards
 * Enhanced with blockchain query integration and security measures
 */
export async function GET(request: NextRequest) {
  try {
    // Security: Check authentication (optional for basic functionality)
    const user = await getAuthenticatedUser(request);
    const isAuthenticated = !!user;
    
    const searchParams = request.nextUrl.searchParams;
    const addressesParam = searchParams.get('addresses');
    const refresh = searchParams.get('refresh') === 'true';

    if (!addressesParam) {
      return NextResponse.json({
        success: false,
        error: 'Missing addresses parameter'
      }, { status: 400 });
    }

    const addresses = addressesParam.split(',').filter(Boolean);

    // Security: Validate wallet addresses
    const { valid: validAddresses, invalid: invalidAddresses } = validateWalletAddresses(addresses);
    
    if (invalidAddresses.length > 0) {
      return NextResponse.json({
        success: false,
        error: `Invalid wallet addresses: ${invalidAddresses.join(', ')}`
      }, { status: 400 });
    }

    if (validAddresses.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No valid addresses provided'
      }, { status: 400 });
    }

    // Security: Limit number of wallets per request
    if (validAddresses.length > MAX_WALLETS_PER_REQUEST) {
      return NextResponse.json({
        success: false,
        error: `Too many wallets. Maximum ${MAX_WALLETS_PER_REQUEST} wallets per request.`
      }, { status: 400 });
    }

    // Security: Rate limiting (only for authenticated users)
    let rateLimit: { allowed: boolean; remaining?: number; resetTime?: number } = { allowed: true };
    if (isAuthenticated) {
      const rateLimitAction = refresh ? 'refresh' : 'request';
      rateLimit = await checkRateLimit(user.id, rateLimitAction);
      
      if (!rateLimit.allowed) {
        const resetTime = new Date(rateLimit.resetTime!);
        return NextResponse.json({
          success: false,
          error: 'Rate limit exceeded',
          rateLimited: true,
          resetTime: resetTime.toISOString(),
          message: `Too many requests. Try again after ${resetTime.toLocaleString()}.`
        }, { status: 429 });
      }
    }

    // If refresh requested, use our enhanced blockchain query system
    if (refresh) {
      if (isAuthenticated) {
        console.log(`🔄 [User Rewards API] Enhanced refresh for ${validAddresses.length} wallet(s) by user ${user.id}:`);
        validAddresses.forEach((addr, i) => console.log(`  ${i + 1}. ${addr}`));
        
        const refreshResult = await processMultiWalletRefresh(validAddresses, user.id);
        
        console.log(`📊 [User Rewards API] Enhanced refresh results:`, {
          success: refreshResult.success,
          failed: refreshResult.failed,
          details: refreshResult.results
        });
        
        // Check if any failed
        if (refreshResult.failed > 0) {
          const failedWallets = refreshResult.results.filter(r => !r.success);
          console.warn(`⚠️ [User Rewards API] ${refreshResult.failed} wallet(s) failed to refresh`);
          
          // Still return cached data for successful wallets
          const data = await getUserWalletsRewards(validAddresses);
          return NextResponse.json({
            success: true,
            data,
            refreshed: true,
            partialFailure: true,
            failedWallets: failedWallets.map(f => ({ address: f.address, error: f.error })),
            message: `${refreshResult.success} wallet(s) refreshed successfully, ${refreshResult.failed} failed.`
          });
        }
        
        console.log(`✅ [User Rewards API] Enhanced refresh complete: ${refreshResult.success} success, ${refreshResult.failed} failed`);
      } else {
        // For unauthenticated users, use the original refresh system
        console.log(`🔄 [User Rewards API] Standard refresh for ${validAddresses.length} wallet(s) (unauthenticated):`);
        validAddresses.forEach((addr, i) => console.log(`  ${i + 1}. ${addr}`));
        
        const refreshResult = await refreshMultipleWallets(validAddresses);
        
        console.log(`📊 [User Rewards API] Standard refresh results:`, {
          success: refreshResult.success,
          failed: refreshResult.failed,
          details: refreshResult.results
        });
        
        // Check if any failed due to rate limiting
        const rateLimitedResults = refreshResult.results.filter(r => 
          !r.success && r.error?.includes('rate limited')
        );
        
        if (rateLimitedResults.length > 0) {
          console.warn(`⏰ [User Rewards API] Some wallets rate limited`);
          
          // Find the maximum hours until next refresh across all wallets
          const maxHours = Math.max(...rateLimitedResults.map(r => r.hoursUntilNextRefresh || 0));
          
          // Still return the cached data, but indicate rate limiting
          const data = await getUserWalletsRewards(validAddresses);
          return NextResponse.json({
            success: true,
            data,
            refreshed: true,
            rateLimited: true,
            hoursUntilNextRefresh: maxHours,
            message: `Rate limited. You can refresh again in ${maxHours} hour${maxHours !== 1 ? 's' : ''}.`
          });
        }
        
        console.log(`✅ [User Rewards API] Standard refresh complete: ${refreshResult.success} success, ${refreshResult.failed} failed`);
      }
    }

    // Fetch rewards data (from cache or after refresh)
    const data = await getUserWalletsRewards(validAddresses);
    
    // Check if we have any wallets with no data (new wallets)
    const walletsWithNoData = data.wallets.filter(w => w.rewards === '0' && !w.lastUpdated);
    
    if (walletsWithNoData.length > 0 && !refresh) {
      console.log(`🆕 [User Rewards API] Detected ${walletsWithNoData.length} new wallet(s) with no data, auto-refreshing...`);
      
      if (isAuthenticated) {
        // Auto-refresh new wallets for authenticated users
        const newWalletAddresses = walletsWithNoData.map(w => w.address);
        const autoRefreshResult = await processMultiWalletRefresh(newWalletAddresses, user.id);
        
        console.log(`🔄 [User Rewards API] Auto-refresh results:`, {
          success: autoRefreshResult.success,
          failed: autoRefreshResult.failed,
          details: autoRefreshResult.results
        });
        
        // Fetch updated data after auto-refresh
        const updatedData = await getUserWalletsRewards(validAddresses);
        return NextResponse.json({
          success: true,
          data: updatedData,
          refreshed: true,
          autoRefreshed: true,
          rateLimitRemaining: rateLimit.remaining,
          authenticated: isAuthenticated
        });
      } else {
        // For unauthenticated users, just return the data as-is
        console.log(`ℹ️ [User Rewards API] New wallets detected but user not authenticated, returning cached data`);
      }
    }

    return NextResponse.json({
      success: true,
      data,
      refreshed: refresh,
      rateLimitRemaining: rateLimit.remaining,
      authenticated: isAuthenticated
    });

  } catch (error: any) {
    console.error('[User Rewards API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error?.message || 'Failed to fetch user rewards'
    }, { status: 500 });
  }
}