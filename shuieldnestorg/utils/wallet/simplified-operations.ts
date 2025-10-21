/**
 * Simplified Wallet Operations
 * 
 * Replaces complex wallet operations with simple wallet management
 * for the new simplified authentication system
 */

import { createSupabaseClient } from "@/utils/supabase/client";
import { 
  getUserId, 
  addWalletToUser, 
  getUserWallets,
  type Wallet
} from "@/utils/supabase/simplified-user";

export interface WalletConnectionResult {
  success: boolean;
  wallet?: {
    address: string;
    label?: string;
  };
  error?: {
    code: string;
    message: string;
    hint?: string;
  };
  showingModal?: boolean; // Indicates AccountFoundModal is being shown
}

/**
 * Get anonymous wallets from localStorage
 */
function getAnonymousWalletsFromStorage(): Array<{ address: string; label?: string; source?: string }> {
  if (typeof window === 'undefined') return [];

  // Primary key
  const stored = localStorage.getItem('anonymous_wallets');
  // Backward-compat: older code used 'visitor_addresses'
  const legacy = localStorage.getItem('visitor_addresses');

  let wallets: Array<{ address: string; label?: string; source?: string }> = [];
  try {
    wallets = stored ? JSON.parse(stored) : [];
  } catch {
    wallets = [];
  }

  if (wallets.length === 0 && legacy) {
    try {
      const legacyParsed = JSON.parse(legacy);
      // Normalize legacy structure if needed
      wallets = (legacyParsed || []).map((w: any) => ({
        address: (w.address || '').toLowerCase(),
        label: w.label,
        source: w.provider || w.source || 'legacy',
      }));
    } catch {
      // ignore
    }
  }

  return wallets;
}

/**
 * Save anonymous wallets to localStorage
 */
function saveAnonymousWalletsToStorage(wallets: Array<{ address: string; label?: string; source?: string }>) {
  if (typeof window === 'undefined') return;
  const serialized = JSON.stringify(wallets);
  // Write to both keys to keep legacy code paths in sync
  localStorage.setItem('anonymous_wallets', serialized);
  localStorage.setItem('visitor_addresses', serialized);
}

/**
 * Connect a wallet (either authenticated or anonymous)
 */
export async function connectWallet(
  address: string,
  label?: string,
  source: string = 'manual'
): Promise<WalletConnectionResult> {
  try {
    // Normalize address to lowercase to match DB storage format
    const normalizedAddress = address.trim().toLowerCase();
    const supabase = createSupabaseClient();
    
    // Use getSession() instead of getUser() - it's cached and won't hang
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user || null;
    
    console.log("connectWallet: User authentication status:", !!user, user?.id);
    
    if (user) {
      // AUTHENTICATED USER - ensure profile exists then add to database
      console.log("connectWallet: Processing as AUTHENTICATED user");
      try {
        // Lazily ensure mapping to public_user_id exists
        const { ensureUserProfile } = await import("@/utils/supabase/simplified-user");
        await ensureUserProfile(supabase);

        const userId = await getUserId(supabase);
        console.log("connectWallet: Retrieved userId:", userId);
        
        if (userId) {
          console.log("connectWallet: Adding wallet to database for user:", userId);
          const wallet = await addWalletToUser(supabase, normalizedAddress, label, source);
          console.log("connectWallet: Successfully added wallet to database:", wallet);

          // Trigger wallet database change event
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('walletDatabaseChange', {
              detail: { address: normalizedAddress, label, source }
            }));
          }

          return {
            success: true,
            wallet: { address: normalizedAddress, label }
          };
        } else {
          console.error("connectWallet: No userId found - profile may not exist");
          throw new Error("User profile not found");
        }
      } catch (error) {
        console.error("connectWallet: Failed to add wallet to database:", error);
        // If wallet already exists, that's okay
        if (error instanceof Error && (error.message.includes('duplicate') || error.message.includes('already exists'))) {
          return {
            success: true,
            wallet: { address: normalizedAddress, label }
          };
        }
        throw error;
      }
    }
    
    console.log("connectWallet: Processing as ANONYMOUS user (no auth)");
    console.log("connectWallet: Normalized address:", normalizedAddress);
    console.log("connectWallet: Label:", label);
    console.log("connectWallet: Source:", source);

    // ANONYMOUS USER - add to localStorage
    const anonymousWallets = getAnonymousWalletsFromStorage();
    console.log("connectWallet: Current anonymous wallets:", anonymousWallets);
    
    // Check if wallet already exists
    const existingWallet = anonymousWallets.find(w => w.address === normalizedAddress);
    if (existingWallet) {
      console.log("connectWallet: Wallet already exists:", existingWallet);
      return {
        success: true,
        wallet: { address: normalizedAddress, label }
      };
    }
    
    // Add new wallet
    console.log("connectWallet: Adding new wallet to array...");
    anonymousWallets.push({ address: normalizedAddress, label, source });
    console.log("connectWallet: Wallets after adding:", anonymousWallets);
    
    console.log("connectWallet: Saving to localStorage...");
    saveAnonymousWalletsToStorage(anonymousWallets);
    
    // Verify it was saved
    const savedWallets = getAnonymousWalletsFromStorage();
    console.log("connectWallet: Verification - wallets in localStorage:", savedWallets);
    
    console.log("Successfully added wallet to localStorage:", { address: normalizedAddress, label, source });
    console.log("Total wallets in localStorage:", anonymousWallets.length);

    // Trigger wallet storage change event for anonymous users
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('walletStorageChange', {
        detail: { address: normalizedAddress, label, source }
      }));
    }

    return {
      success: true,
      wallet: { address: normalizedAddress, label }
    };

  } catch (error) {
    console.error("Error connecting wallet:", error);
    return {
      success: false,
      error: {
        code: 'CONNECTION_FAILED',
        message: error instanceof Error ? error.message : 'Failed to connect wallet',
        hint: 'Please try again or contact support if the issue persists'
      }
    };
  }
}

/**
 * Get all wallets for current user (authenticated or anonymous)
 */
export async function getAllWallets(userId?: string): Promise<Array<{ address: string; label?: string }>> {
  try {
    const supabase = createSupabaseClient();
    
    let user = null;
    if (userId) {
      // If userId is provided, skip getSession() (called from onAuthStateChange)
      console.log("🔍 getAllWallets: Using provided userId:", userId);
      user = { id: userId } as any;
    } else {
      // Use getSession() instead of getUser() - it's cached and won't hang
      const { data: { session } } = await supabase.auth.getSession();
      user = session?.user || null;
    }

    if (user) {
      // AUTHENTICATED USER - get from database
      console.log("🔍 getAllWallets: User authenticated, fetching from database...");
      const userWallets = await getUserWallets(supabase);
      console.log("✅ getAllWallets: Found database wallets:", userWallets.length, userWallets.map(w => w.address.substring(0, 10) + '...'));
      return userWallets.map(w => ({
        address: w.address,
        label: w.label
      }));
    }

    // ANONYMOUS USER - get from localStorage
    const anonymousWallets = getAnonymousWalletsFromStorage();
    console.log("👤 getAllWallets: Anonymous mode, found localStorage wallets:", anonymousWallets.length);
    return anonymousWallets.map(w => ({
      address: w.address,
      label: w.label
    }));

  } catch (error) {
    console.error("❌ getAllWallets: Error fetching wallets:", error);
    return [];
  }
}

/**
 * Remove a wallet
 */
export async function removeWallet(address: string): Promise<WalletConnectionResult> {
  try {
    const supabase = createSupabaseClient();
    
    // Use getSession() instead of getUser()
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user || null;

    if (user) {
      // AUTHENTICATED USER - remove from database
      const userWallets = await getUserWallets(supabase);
      const wallet = userWallets.find(w => w.address === address);
      
      if (wallet) {
        await supabase
          .from("wallets")
          .delete()
          .eq("id", wallet.id);

        // Trigger wallet database change event
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('walletDatabaseChange', {
            detail: { action: 'removed', address }
          }));
        }
      }
    } else {
      // ANONYMOUS USER - remove from localStorage (both keys)
      const anonymousWallets = getAnonymousWalletsFromStorage();
      const filteredWallets = anonymousWallets.filter(w => w.address !== address);
      saveAnonymousWalletsToStorage(filteredWallets);

      // Trigger wallet storage change event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('walletStorageChange', {
          detail: { action: 'removed', address }
        }));
      }
    }

    return {
      success: true,
      wallet: { address }
    };

  } catch (error) {
    console.error("Error removing wallet:", error);
    return {
      success: false,
      error: {
        code: 'REMOVAL_FAILED',
        message: error instanceof Error ? error.message : 'Failed to remove wallet',
        hint: 'Please try again or contact support if the issue persists'
      }
    };
  }
}

/**
 * Clear all wallets
 */
export async function clearAllWallets(): Promise<WalletConnectionResult> {
  try {
    const supabase = createSupabaseClient();
    
    // Use getSession() instead of getUser()
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user || null;

    if (user) {
      // AUTHENTICATED USER - clear database wallets
      const userId = await getUserId(supabase);
      if (userId) {
        await supabase
          .from("wallets")
          .delete()
          .eq("public_user_id", userId);

        // Trigger wallet database change event
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('walletDatabaseChange', {
            detail: { action: 'cleared' }
          }));
        }
      }
    } else {
      // ANONYMOUS USER - clear localStorage (both keys)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('anonymous_wallets');
        localStorage.removeItem('visitor_addresses');

        // Trigger wallet storage change event
        window.dispatchEvent(new CustomEvent('walletStorageChange', {
          detail: { action: 'cleared' }
        }));
      }
    }

    return { success: true };

  } catch (error) {
    console.error("Error clearing wallets:", error);
    return {
      success: false,
      error: {
        code: 'CLEAR_FAILED',
        message: error instanceof Error ? error.message : 'Failed to clear wallets',
        hint: 'Please try again or contact support if the issue persists'
      }
    };
  }
}

/**
 * Get wallet count for current user
 */
export async function getWalletCount(): Promise<number> {
  const wallets = await getAllWallets();
  console.log("getWalletCount: Returning count:", wallets.length, "for wallets:", wallets);
  return wallets.length;
}

/**
 * Check if user has any wallets
 */
export async function hasWallets(): Promise<boolean> {
  const count = await getWalletCount();
  return count > 0;
}

/**
 * Clear all wallet data from localStorage
 * Useful for debugging or when user wants to start fresh
 */
export function clearAllWalletData(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('anonymous_wallets');
  localStorage.removeItem('visitor_addresses');
  
  // Trigger events to update UI
  window.dispatchEvent(new CustomEvent('walletStorageChange', {
    detail: { action: 'cleared' }
  }));
  
  console.log("Cleared all wallet data from localStorage");
}

/**
 * Migrate anonymous wallets to user account
 * Called when anonymous user creates an account
 */
export async function migrateWalletsToAccount(userId?: string): Promise<{
  success: boolean;
  migratedCount: number;
  errors: string[];
}> {
  console.log("🔄 [Migrate] Starting migration...");
  try {
    const supabase = createSupabaseClient();
    
    // If userId is provided, skip session fetch (avoids deadlock in onAuthStateChange)
    let user = null;
    if (userId) {
      console.log("🔄 [Migrate] Using provided userId:", userId);
      user = { id: userId } as any;
    } else {
      console.log("🔄 [Migrate] Getting session...");
      const { data: { session } } = await supabase.auth.getSession();
      user = session?.user || null;
      console.log("🔄 [Migrate] User:", user ? user.email : "none");
    }
    
    if (!user) {
      console.log("❌ [Migrate] No user authenticated");
      return {
        success: false,
        migratedCount: 0,
        errors: ['User not authenticated']
      };
    }

    console.log("🔄 [Migrate] Getting anonymous wallets from storage...");
    const anonymousWallets = getAnonymousWalletsFromStorage();
    console.log("🔄 [Migrate] Found anonymous wallets:", anonymousWallets.length);
    const result = { migratedCount: 0, errors: [] as string[] };
    
    if (anonymousWallets.length === 0) {
      console.log("✅ [Migrate] No wallets to migrate");
      return {
        success: true,
        migratedCount: 0,
        errors: []
      };
    }

    // Get existing user wallets to avoid duplicates
    console.log("🔄 [Migrate] Getting existing user wallets...");
    const existingWallets = await getUserWallets(supabase);
    console.log("🔄 [Migrate] Found existing wallets:", existingWallets.length);
    const existingAddresses = new Set(existingWallets.map(w => w.address.toLowerCase()));

    // Migrate each wallet
    for (const wallet of anonymousWallets) {
      if (existingAddresses.has(wallet.address.toLowerCase())) {
        continue; // Skip duplicates
      }

      try {
        await addWalletToUser(supabase, wallet.address, wallet.label, wallet.source || 'migrated');
        result.migratedCount++;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(`Failed to migrate ${wallet.address}: ${message}`);
      }
    }

    // Clear anonymous wallets after successful migration
    if (result.migratedCount > 0 && typeof window !== 'undefined') {
      localStorage.removeItem('anonymous_wallets');
      
      // Trigger events to update UI
      window.dispatchEvent(new CustomEvent('walletDatabaseChange', {
        detail: { action: 'migrated', count: result.migratedCount }
      }));
    }

    return {
      success: result.errors.length === 0,
      migratedCount: result.migratedCount,
      errors: result.errors
    };

  } catch (error) {
    console.error("Error migrating wallets:", error);
    return {
      success: false,
      migratedCount: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
}
