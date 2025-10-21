/**
 * User profile mapping helpers for dual RLS system
 * Handles public_users <-> auth.users and private_users <-> auth.users mappings
 */

import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Get or create public user profile for authenticated user
 * This creates both the public_users record and the user_profiles mapping
 */
export async function ensurePublicUserProfile(supabase: SupabaseClient) {
  // Get current auth user
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
  if (authError || !authUser) {
    throw new Error("User not authenticated");
  }

  // Check if mapping already exists
  const { data: existingMapping } = await supabase
    .from("user_profiles")
    .select("public_user_id")
    .eq("auth_user_id", authUser.id)
    .maybeSingle();

  if (existingMapping?.public_user_id) {
    return existingMapping.public_user_id;
  }

  // Create public_users record
  // Note: Don't include updated_at - it's auto-managed by trigger
  const { data: publicUser, error: createError } = await supabase
    .from("public_users")
    .insert({
      email: authUser.email,
      created_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (createError) {
    throw new Error(`Failed to create public user: ${createError.message}`);
  }

  // Create mapping in user_profiles
  const { error: mappingError } = await supabase
    .from("user_profiles")
    .insert({
      auth_user_id: authUser.id,
      public_user_id: publicUser.id,
      created_at: new Date().toISOString(),
    });

  if (mappingError) {
    throw new Error(`Failed to create user profile mapping: ${mappingError.message}`);
  }

  return publicUser.id;
}

/**
 * Get or create private user profile for authenticated user
 * Requires existing public profile
 */
export async function ensurePrivateUserProfile(supabase: SupabaseClient) {
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
  if (authError || !authUser) {
    throw new Error("User not authenticated");
  }

  // Check if mapping already exists
  const { data: existingMapping } = await supabase
    .from("private_user_profiles")
    .select("private_user_id")
    .eq("auth_user_id", authUser.id)
    .maybeSingle();

  if (existingMapping?.private_user_id) {
    return existingMapping.private_user_id;
  }

  // Create private_users record
  const { data: privateUser, error: createError } = await supabase
    .from("private_users")
    .insert({
      pma_signed: false, // Will be updated when PMA is signed
      shield_nft_verified: false, // Will be updated when NFT is verified
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (createError) {
    throw new Error(`Failed to create private user: ${createError.message}`);
  }

  // Create mapping in private_user_profiles
  const { error: mappingError } = await supabase
    .from("private_user_profiles")
    .insert({
      auth_user_id: authUser.id,
      private_user_id: privateUser.id,
      created_at: new Date().toISOString(),
    });

  if (mappingError) {
    throw new Error(`Failed to create private user profile mapping: ${mappingError.message}`);
  }

  return privateUser.id;
}

/**
 * Get mapped public user ID for current authenticated user
 * Returns null if no mapping exists
 */
export async function getPublicUserId(supabase: SupabaseClient): Promise<string | null> {
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return null;

  const { data } = await supabase
    .from("user_profiles")
    .select("public_user_id")
    .eq("auth_user_id", authUser.id)
    .maybeSingle();

  return data?.public_user_id ?? null;
}

/**
 * Get mapped private user ID for current authenticated user
 * Returns null if no mapping exists
 */
export async function getPrivateUserId(supabase: SupabaseClient): Promise<string | null> {
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return null;

  const { data } = await supabase
    .from("private_user_profiles")
    .select("private_user_id")
    .eq("auth_user_id", authUser.id)
    .maybeSingle();

  return data?.private_user_id ?? null;
}

/**
 * Check if user has private membership
 */
export async function hasPrivateMembership(supabase: SupabaseClient): Promise<boolean> {
  const privateUserId = await getPrivateUserId(supabase);
  if (!privateUserId) return false;

  const { data } = await supabase
    .from("private_users")
    .select("pma_signed, shield_nft_verified")
    .eq("id", privateUserId)
    .maybeSingle();

  return !!(data?.pma_signed && data?.shield_nft_verified);
}

