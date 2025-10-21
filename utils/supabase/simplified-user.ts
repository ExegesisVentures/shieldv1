/**
 * Simplified User Management
 * 
 * Replaces the complex user-profile.ts with simple user operations
 * for the new simplified authentication system
 */

import { SupabaseClient } from "@supabase/supabase-js";

export interface PublicUser {
  id: string; // public.public_users.id
  email?: string;
  first_name?: string;
  last_name?: string;
  created_at: string;
  updated_at?: string;
}

export interface Wallet {
  id: string;
  public_user_id?: string;
  address: string;
  label?: string;
  source: string;
  created_at: string;
  updated_at?: string;
}


/**
 * Get or create user profile for authenticated user
 * Only called when user wants to save their data
 */
export async function ensureUserProfile(supabase: SupabaseClient): Promise<string> {
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
  if (authError || !authUser) {
    throw new Error("User not authenticated");
  }

  // Check mapping in user_profiles -> public_user_id
  const { data: existingMap } = await supabase
    .from("user_profiles")
    .select("public_user_id")
    .eq("auth_user_id", authUser.id)
    .maybeSingle();

  if (existingMap?.public_user_id) {
    return existingMap.public_user_id;
  }

  // Create public user and mapping if missing (idempotent)
  const { data: createdPublicUser, error: createPublicErr } = await supabase
    .from("public_users")
    .insert({
      email: authUser.email,
      created_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (createPublicErr && !String(createPublicErr.message || '').includes('duplicate')) {
    throw new Error(`Failed to create public user: ${createPublicErr.message}`);
  }

  // If conflict, fetch existing
  const publicUserId = createdPublicUser?.id || (
    await supabase.from("public_users").select("id").eq("email", authUser.email).maybeSingle()
  ).data?.id;

  if (!publicUserId) {
    throw new Error("Failed to resolve public user id");
  }

  const { error: mapErr } = await supabase
    .from("user_profiles")
    .insert({ auth_user_id: authUser.id, public_user_id: publicUserId, created_at: new Date().toISOString() });

  if (mapErr && !String(mapErr.message || '').includes('duplicate')) {
    throw new Error(`Failed to map user profile: ${mapErr.message}`);
  }

  return publicUserId;
}

/**
 * Get user ID for current authenticated user
 * Returns null if not authenticated or no profile exists
 */
export async function getUserId(supabase: SupabaseClient): Promise<string | null> {
  try {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      console.log("getUserId: No authenticated user found");
      return null;
    }

    console.log("getUserId: Looking for profile mapping for user:", authUser.id);
    const { data, error } = await supabase
      .from("user_profiles")
      .select("public_user_id")
      .eq("auth_user_id", authUser.id)
      .maybeSingle();

    if (error) {
      console.error("getUserId: Error fetching user profile:", error);
      return null;
    }

    if (!data?.public_user_id) {
      console.log("getUserId: No profile mapping found for user:", authUser.id);
      return null;
    }

    console.log("getUserId: Found public_user_id:", data.public_user_id);
    return data.public_user_id;
  } catch (error) {
    console.warn("Failed to get user from Supabase:", error);
    return null;
  }
}

/**
 * Get user profile for current authenticated user
 */
export async function getUserProfile(supabase: SupabaseClient): Promise<PublicUser | null> {
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return null;

  const { data: mapping } = await supabase
    .from("user_profiles")
    .select("public_user_id")
    .eq("auth_user_id", authUser.id)
    .maybeSingle();

  if (!mapping?.public_user_id) return null;

  const { data } = await supabase
    .from("public_users")
    .select("*")
    .eq("id", mapping.public_user_id)
    .maybeSingle();

  return data as any;
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  supabase: SupabaseClient,
  updates: Partial<Pick<PublicUser, 'first_name' | 'last_name' | 'email'>>
): Promise<void> {
  const userId = await getUserId(supabase);
  if (!userId) throw new Error("User not found");

  const { error } = await supabase
    .from("public_users")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    throw new Error(`Failed to update profile: ${error.message}`);
  }
}

/**
 * Delete user profile and all associated data
 */
export async function deleteUserProfile(supabase: SupabaseClient): Promise<void> {
  const userId = await getUserId(supabase);
  if (!userId) throw new Error("User not found");

  // Delete user (wallets will be cascade deleted)
  const { error } = await supabase
    .from("public_users")
    .delete()
    .eq("id", userId);

  if (error) {
    throw new Error(`Failed to delete profile: ${error.message}`);
  }
}

/**
 * Add wallet to user account (or un-delete if previously deleted)
 */
export async function addWalletToUser(
  supabase: SupabaseClient,
  address: string,
  label?: string,
  source: string = 'manual'
): Promise<Wallet> {
  const userId = await getUserId(supabase);
  if (!userId) throw new Error("User not found");

  // Check if wallet already exists (including soft-deleted)
  const { data: existing } = await supabase
    .from("wallets")
    .select("id, deleted_at")
    .eq("public_user_id", userId)
    .eq("address", address.toLowerCase())
    .maybeSingle();

  if (existing) {
    // If wallet exists but is deleted, un-delete it
    if (existing.deleted_at) {
      const { data: wallet, error } = await supabase
        .from("wallets")
        .update({
          deleted_at: null,
          label, // Update label on un-delete
          source, // Update source on un-delete
          ownership_verified: false, // Reset verification status
          verified_at: null,
        })
        .eq("id", existing.id)
        .select("*")
        .single();

      if (error) {
        throw new Error(`Failed to restore wallet: ${error.message}`);
      }

      return wallet;
    }

    // Wallet exists and is not deleted - this is a duplicate
    throw new Error("Wallet already exists for this user");
  }

  // Insert new wallet
  const { data: wallet, error } = await supabase
    .from("wallets")
    .insert({
      public_user_id: userId,
      address: address.toLowerCase(),
      label,
      source,
      created_at: new Date().toISOString(),
      ownership_verified: false,
      verified_at: null,
      deleted_at: null,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to add wallet: ${error.message}`);
  }

  return wallet;
}

/**
 * Get user's wallets (excludes soft-deleted wallets)
 */
export async function getUserWallets(supabase: SupabaseClient): Promise<Wallet[]> {
  const userId = await getUserId(supabase);
  if (!userId) {
    console.log("getUserWallets: No userId found, returning empty array");
    return [];
  }

  console.log("getUserWallets: Fetching wallets for userId:", userId);
  const { data: wallets, error } = await supabase
    .from("wallets")
    .select("*")
    .eq("public_user_id", userId)
    .is("deleted_at", null) // Only fetch non-deleted wallets
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getUserWallets: Error fetching wallets:", error);
    throw new Error(`Failed to fetch wallets: ${error.message}`);
  }

  console.log("getUserWallets: Found wallets:", wallets?.length || 0, wallets);
  return wallets || [];
}

/**
 * Remove wallet from user account (soft delete - sets deleted_at timestamp)
 */
export async function removeWalletFromUser(
  supabase: SupabaseClient,
  walletId: string
): Promise<void> {
  const userId = await getUserId(supabase);
  if (!userId) throw new Error("User not found");

  const { error } = await supabase
    .from("wallets")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", walletId)
    .eq("public_user_id", userId);

  if (error) {
    throw new Error(`Failed to remove wallet: ${error.message}`);
  }
}

