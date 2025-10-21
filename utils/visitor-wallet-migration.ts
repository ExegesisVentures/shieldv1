/**
 * Visitor Wallet Migration Utility
 * 
 * Handles migrating wallets from localStorage (visitor mode) to database (public user mode)
 * when a visitor signs up or logs in.
 */

import { SupabaseClient } from "@supabase/supabase-js";

interface VisitorWallet {
  address: string;
  label?: string;
  chain_id?: string;
  read_only?: boolean;
  is_primary?: boolean;
  added_at?: string;
  provider?: string;
}

interface MigrationResult {
  success: boolean;
  migratedCount: number;
  skippedCount: number;
  errors: string[];
}

/**
 * Check if user has visitor wallets in localStorage
 */
export function hasVisitorWallets(): boolean {
  if (typeof window === 'undefined') return false;
  
  const visitorAddresses = localStorage.getItem('visitor_addresses');
  if (!visitorAddresses) return false;
  
  try {
    const wallets = JSON.parse(visitorAddresses);
    return Array.isArray(wallets) && wallets.length > 0;
  } catch {
    return false;
  }
}

/**
 * Get visitor wallets from localStorage
 */
export function getVisitorWallets(): VisitorWallet[] {
  if (typeof window === 'undefined') return [];
  
  const visitorAddresses = localStorage.getItem('visitor_addresses');
  if (!visitorAddresses) return [];
  
  try {
    const wallets = JSON.parse(visitorAddresses);
    return Array.isArray(wallets) ? wallets : [];
  } catch {
    return [];
  }
}

/**
 * Migrate visitor wallets to database for authenticated user
 */
export async function migrateVisitorWallets(
  supabase: SupabaseClient,
  publicUserId: string
): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: true,
    migratedCount: 0,
    skippedCount: 0,
    errors: [],
  };

  const visitorWallets = getVisitorWallets();
  
  if (visitorWallets.length === 0) {
    return result;
  }

  // Get existing wallets in database to avoid duplicates (excluding soft-deleted)
  const { data: existingWallets } = await supabase
    .from("wallets")
    .select("address")
    .eq("public_user_id", publicUserId) // Fixed: was user_id
    .is("deleted_at", null); // Only check non-deleted wallets

  const existingAddresses = new Set(
    (existingWallets || []).map((w) => w.address.toLowerCase())
  );

  // Check if user has any wallets (to determine primary)
  let hasPrimaryWallet = false;
  if (existingWallets && existingWallets.length > 0) {
    const { data: primaryCheck } = await supabase
      .from("wallets")
      .select("id")
      .eq("public_user_id", publicUserId) // Fixed: was user_id
      .eq("is_primary", true)
      .is("deleted_at", null) // Only check non-deleted wallets
      .maybeSingle();
    
    hasPrimaryWallet = !!primaryCheck;
  }

  // Migrate each wallet
  for (let i = 0; i < visitorWallets.length; i++) {
    const wallet = visitorWallets[i];
    
    // Skip if already exists
    if (existingAddresses.has(wallet.address.toLowerCase())) {
      result.skippedCount++;
      continue;
    }

    try {
      // First wallet becomes primary if no primary exists
      const isPrimary = !hasPrimaryWallet && i === 0;
      if (isPrimary) hasPrimaryWallet = true;

      const { error } = await supabase.from("wallets").insert({
        public_user_id: publicUserId, // Fixed: was user_id
        address: wallet.address,
        label: wallet.label || "Migrated Wallet",
        source: wallet.provider || "manual",
        ownership_verified: false, // Migrated wallets are not verified by default
        verified_at: null,
        created_at: wallet.added_at || new Date().toISOString(),
      });

      if (error) {
        result.errors.push(`Failed to migrate ${wallet.address}: ${error.message}`);
        result.success = false;
      } else {
        result.migratedCount++;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      result.errors.push(`Failed to migrate ${wallet.address}: ${message}`);
      result.success = false;
    }
  }

  return result;
}

/**
 * Clear visitor wallets from localStorage after successful migration
 */
export function clearVisitorWallets(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('visitor_addresses');
  
  // Trigger storage event to update UI
  window.dispatchEvent(new Event('storage'));
}

/**
 * Mark migration as completed (so we don't prompt again)
 */
export function markMigrationCompleted(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem('visitor_wallets_migrated', 'true');
}

/**
 * Check if migration was already completed
 */
export function isMigrationCompleted(): boolean {
  if (typeof window === 'undefined') return false;
  
  return localStorage.getItem('visitor_wallets_migrated') === 'true';
}

/**
 * Full migration flow with completion tracking
 */
export async function performVisitorMigration(
  supabase: SupabaseClient,
  publicUserId: string
): Promise<MigrationResult> {
  const result = await migrateVisitorWallets(supabase, publicUserId);
  
  if (result.success || result.migratedCount > 0) {
    clearVisitorWallets();
    markMigrationCompleted();
  }
  
  return result;
}

