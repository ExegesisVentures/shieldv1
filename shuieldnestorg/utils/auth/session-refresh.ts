/**
 * Session Refresh Utilities
 * 
 * Handles session validation and cleanup when cache is cleared or session is stale
 */

import { createSupabaseClient } from "@/utils/supabase/client";

export interface SessionCheckResult {
  isValid: boolean;
  isStale: boolean;
  needsRefresh: boolean;
}

/**
 * Check if wallet connection is in progress
 */
export function isWalletConnectionInProgress(): boolean {
  return sessionStorage.getItem('walletConnectInProgress') === 'true';
}

/**
 * Clear wallet connection state
 */
export function clearWalletConnectionState(): void {
  sessionStorage.removeItem('walletConnectInProgress');
  sessionStorage.removeItem('walletAddress');
}

/**
 * Check if the current session is valid and fresh
 * This is useful after page refresh to detect if cache was cleared
 */
export async function checkSessionHealth(): Promise<SessionCheckResult> {
  try {
    const supabase = createSupabaseClient();
    
    // First check getSession (fast, cached)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return {
        isValid: false,
        isStale: false,
        needsRefresh: false
      };
    }
    
    // Check if session is close to expiring (within 5 minutes)
    const expiresAt = session.expires_at;
    if (expiresAt) {
      const expiresInMs = (expiresAt * 1000) - Date.now();
      const fiveMinutesInMs = 5 * 60 * 1000;
      
      if (expiresInMs < fiveMinutesInMs) {
        return {
          isValid: true,
          isStale: true,
          needsRefresh: true
        };
      }
    }
    
    // Session is valid and fresh
    return {
      isValid: true,
      isStale: false,
      needsRefresh: false
    };
    
  } catch (error) {
    console.error("Error checking session health:", error);
    return {
      isValid: false,
      isStale: false,
      needsRefresh: false
    };
  }
}

/**
 * Refresh the session if needed
 * Returns true if refresh was successful, false otherwise
 */
export async function refreshSessionIfNeeded(): Promise<boolean> {
  try {
    const health = await checkSessionHealth();
    
    if (!health.isValid) {
      console.log("⚠️ No valid session found");
      return false;
    }
    
    if (!health.needsRefresh) {
      console.log("✅ Session is fresh, no refresh needed");
      return true;
    }
    
    console.log("🔄 Session is stale, refreshing...");
    const supabase = createSupabaseClient();
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error || !data.session) {
      console.error("❌ Failed to refresh session:", error);
      return false;
    }
    
    console.log("✅ Session refreshed successfully");
    return true;
    
  } catch (error) {
    console.error("Error refreshing session:", error);
    return false;
  }
}

/**
 * Clear all local state when session is invalid
 * This is called when we detect a stale/invalid session after cache clear
 */
export function clearLocalState(): void {
  if (typeof window === 'undefined') return;
  
  console.log("🧹 Clearing local state...");
  
  // Clear all wallet-related localStorage
  const keysToRemove = [
    'anonymous_wallets',
    'visitor_addresses',
    'save_prompt_dismissed',
    'migration_prompt_dismissed',
  ];
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
  });
  
  // Clear all price cache entries
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('coreum_price_') || key.startsWith('coredex_') || key.startsWith('graz-')) {
      localStorage.removeItem(key);
    }
  });
  
  console.log("✅ Local state cleared");
}

/**
 * Initialize dashboard with proper session check
 * Returns session object if valid, null otherwise
 */
export async function initializeDashboardSession(): Promise<{ isAuthenticated: boolean; session: any | null }> {
  try {
    const supabase = createSupabaseClient();
    
    // Check session health first
    const health = await checkSessionHealth();
    
    if (!health.isValid) {
      // No valid session - user is anonymous
      console.log("📝 No valid session - running in anonymous mode");
      return { isAuthenticated: false, session: null };
    }
    
    // Refresh if stale
    if (health.needsRefresh) {
      const refreshed = await refreshSessionIfNeeded();
      if (!refreshed) {
        // Refresh failed - treat as anonymous
        console.log("⚠️ Session refresh failed - running in anonymous mode");
        clearLocalState();
        return { isAuthenticated: false, session: null };
      }
    }
    
    // Get fresh session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.log("📝 No session after check - running in anonymous mode");
      return { isAuthenticated: false, session: null };
    }
    
    console.log("✅ Valid session found - running in authenticated mode");
    return { isAuthenticated: true, session };
    
  } catch (error) {
    console.error("Error initializing dashboard session:", error);
    return { isAuthenticated: false, session: null };
  }
}

