/**
 * Wallet CRUD Operations
 * Handles wallet management with Supabase
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { uiError, UiError } from "@/utils/errors";

export interface Wallet {
  id: string;
  public_user_id: string; // Fixed: was user_id
  address: string;
  label: string;
  source: string;
  ownership_verified?: boolean; // Track if ownership was verified
  verified_at?: string; // When verification happened
  is_custodial?: boolean; // Is this a custodial wallet (managed by ShieldNest)?
  custodian_note?: string; // Admin notes for custodial wallets
  created_at: string;
}

/**
 * Fetch all wallets for the current user
 */
export async function fetchUserWallets(
  supabase: SupabaseClient,
  publicUserId: string
): Promise<Wallet[]> {
  const { data, error} = await supabase
    .from("wallets")
    .select("*")
    .eq("public_user_id", publicUserId) // Fixed: was user_id
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching wallets:", error);
    return [];
  }

  return data || [];
}

/**
 * Add a new wallet
 */
export async function addWallet(
  supabase: SupabaseClient,
  publicUserId: string,
  address: string,
  label: string,
  source: string = "manual"
): Promise<{ success: boolean; wallet?: Wallet; error?: UiError }> {
  // Check if wallet already exists for this user
  const { data: existing } = await supabase
    .from("wallets")
    .select("id")
    .eq("public_user_id", publicUserId) // Fixed: was user_id
    .eq("address", address.toLowerCase())
    .maybeSingle();

  if (existing) {
    return {
      success: false,
      error: uiError("WALLET_EXISTS", "This wallet is already connected to your account."),
    };
  }

  // Insert new wallet (no signature verification by default)
  const { data, error } = await supabase
    .from("wallets")
    .insert({
      public_user_id: publicUserId, // Fixed: was user_id
      address: address.toLowerCase(),
      label,
      source,
      ownership_verified: false, // Not verified by default
      verified_at: null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error adding wallet:", error);
    return {
      success: false,
      error: uiError("WALLET_ADD_FAILED", "Failed to add wallet.", error.message),
    };
  }

  return { success: true, wallet: data };
}

/**
 * Update wallet label
 */
export async function updateWalletLabel(
  supabase: SupabaseClient,
  walletId: string,
  newLabel: string
): Promise<{ success: boolean; error?: UiError }> {
  const { error } = await supabase
    .from("wallets")
    .update({ label: newLabel })
    .eq("id", walletId);

  if (error) {
    console.error("Error updating wallet label:", error);
    return {
      success: false,
      error: uiError("WALLET_UPDATE_FAILED", "Failed to update wallet label.", error.message),
    };
  }

  return { success: true };
}

/**
 * Delete a wallet
 */
export async function deleteWallet(
  supabase: SupabaseClient,
  walletId: string
): Promise<{ success: boolean; error?: UiError }> {
  const { error } = await supabase
    .from("wallets")
    .delete()
    .eq("id", walletId);

  if (error) {
    console.error("Error deleting wallet:", error);
    return {
      success: false,
      error: uiError("WALLET_DELETE_FAILED", "Failed to delete wallet.", error.message),
    };
  }

  return { success: true };
}

/**
 * Set a wallet as primary
 * NOTE: The 'is_primary' field is not in the current schema.
 * The first wallet added is considered primary by default.
 * This function is kept for backward compatibility but does nothing.
 */
export async function setPrimaryWallet(
  supabase: SupabaseClient,
  publicUserId: string,
  walletId: string
): Promise<{ success: boolean; error?: UiError }> {
  console.log("setPrimaryWallet called but is_primary field not in schema - no-op");
  // The simplified wallet schema doesn't include is_primary field
  // The first wallet in the list is considered the primary wallet
  return { success: true };
}

