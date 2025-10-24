/**
 * Shield NFT utilities
 * Handles Shield NFT settings and placeholder value generation
 */

import { SupabaseClient } from "@supabase/supabase-js";

export type ShieldSettings = { 
  image_url: string | null; 
  min_usd: number; 
  max_usd: number 
};

/**
 * Fetch Shield NFT settings from database
 * Use with server-side or client-side Supabase client
 */
export async function fetchShieldSettings(supabase: SupabaseClient): Promise<ShieldSettings> {
  const { data } = await supabase
    .from("shield_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  
  return {
    image_url: data?.image_url ?? null,
    min_usd: Number(data?.min_usd ?? 5000),
    max_usd: Number(data?.max_usd ?? 6000),
  };
}

/**
 * Generate a stable placeholder USD value for a user
 * Uses deterministic seeded random based on userId
 * Returns the same value for the same userId consistently
 */
export function pickPlaceholderUsd(userId: string, min: number, max: number): number {
  // Stable-ish seeded pick per user
  const seed = [...userId].reduce((a, c) => a + c.charCodeAt(0), 0);
  const r = (Math.sin(seed) + 1) / 2; // 0..1
  return Math.round((min + r * (max - min)) * 100) / 100;
}

/**
 * Number of CORE tokens backing each Shield NFT
 * This is a constant that determines the NFT's value
 */
export const SHIELD_NFT_CORE_BACKING = 41666;

/**
 * Calculate Shield NFT value based on CORE token backing
 * 
 * The Shield NFT is backed by 41,666 CORE tokens.
 * Its value directly reflects the current CORE price.
 * 
 * @param corePrice - Current CORE token price in USD
 * @returns Calculated NFT value in USD
 */
export function calculateShieldNftValue(
  corePrice: number
): number {
  // Validate CORE price to prevent unrealistic calculations
  if (corePrice <= 0 || corePrice > 1000) {
    console.warn(`⚠️ [Shield NFT] Unrealistic CORE price detected: $${corePrice}. Using fallback calculation.`);
    // Use a reasonable fallback if price seems wrong
    corePrice = 0.12; // Fallback to $0.12
  }
  
  // NFT value = number of backing CORE tokens × CORE price
  const nftValue = SHIELD_NFT_CORE_BACKING * corePrice;
  
  console.log(`💰 [Shield NFT] Calculated value: ${SHIELD_NFT_CORE_BACKING} CORE × $${corePrice} = $${nftValue.toFixed(2)}`);
  
  return Math.round(nftValue * 100) / 100;
}

/**
 * Get Shield NFT holdings data for display in portfolio
 * Returns NFT as if it were a token holding
 */
export interface ShieldNftHolding {
  symbol: string;
  name: string;
  balance: string;
  valueUsd: number;
  change24h: number;
  change30d?: number; // 30-day price change percentage
  logoUrl?: string;
  type: 'nft';
  nftId?: string;
}

export function getShieldNftHolding(
  corePrice: number,
  coreChange24h: number,
  shieldSettings?: ShieldSettings,
  coreChange30d?: number,
  nftCount: number = 1
): ShieldNftHolding {
  // Calculate NFT value based on CORE backing
  const singleNftValue = calculateShieldNftValue(corePrice);
  
  // Total value = single NFT value × count
  const totalValue = singleNftValue * nftCount;
  
  // NFT 24h change follows CORE exactly (since it's backed by CORE)
  const nftChange24h = coreChange24h;
  
  // NFT 30d change follows CORE exactly (since it's backed by CORE)
  const nftChange30d = coreChange30d;
  
  return {
    symbol: 'SHLD',
    name: 'Shield NFT',
    balance: nftCount.toString(),
    valueUsd: totalValue,
    change24h: nftChange24h,
    change30d: nftChange30d,
    logoUrl: shieldSettings?.image_url || '/tokens/shld_dark.svg',
    type: 'nft',
    nftId: 'shield-membership-nft',
  };
}

/**
 * Check if user owns Shield NFT
 * Checks nft_holdings_cache for the configured Shield NFT
 * TODO: Define Shield NFT contract/token ID in settings
 */
export async function hasShieldNft(
  supabase: SupabaseClient, 
  userId: string, 
  userScope: "public" | "private"
): Promise<boolean> {
  const { data } = await supabase
    .from("nft_holdings_cache")
    .select("id")
    .eq("user_id", userId)
    .eq("user_scope", userScope)
    .eq("chain_id", "coreum-mainnet-1")
    // TODO: Add filter for specific Shield NFT contract/token_id
    .limit(1)
    .maybeSingle();

  return !!data;
}

/**
 * Get the number of ShieldNest Member NFTs the user owns
 * This is stored in the private_users table
 * 
 * @param supabase - Supabase client
 * @param publicUserId - User's public_user_id
 * @returns Number of Shield NFTs owned (0 if none)
 */
export async function getShieldNftCount(
  supabase: SupabaseClient,
  publicUserId: string
): Promise<number> {
  try {
    // Get the auth_user_id from user_profiles
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('auth_user_id')
      .eq('public_user_id', publicUserId)
      .maybeSingle();

    if (profileError || !profile) {
      console.warn(`⚠️ [Shield NFT] Could not find profile for public_user_id: ${publicUserId}`);
      return 0;
    }

    // Get the private_user_id from private_user_profiles
    const { data: privateProfile, error: privateProfileError } = await supabase
      .from('private_user_profiles')
      .select('private_user_id')
      .eq('auth_user_id', profile.auth_user_id)
      .maybeSingle();

    if (privateProfileError || !privateProfile) {
      console.log(`ℹ️ [Shield NFT] User has no private profile: ${publicUserId}`);
      return 0;
    }

    // Get the shieldnest_member_nft count from private_users
    const { data: privateUser, error: privateUserError } = await supabase
      .from('private_users')
      .select('shieldnest_member_nft')
      .eq('id', privateProfile.private_user_id)
      .maybeSingle();

    if (privateUserError || !privateUser) {
      console.warn(`⚠️ [Shield NFT] Could not find private_users record: ${privateProfile.private_user_id}`);
      return 0;
    }

    const nftCount = privateUser.shieldnest_member_nft || 0;
    console.log(`✅ [Shield NFT] User ${publicUserId} owns ${nftCount} Shield NFT(s)`);
    
    return nftCount;
  } catch (error) {
    console.error(`❌ [Shield NFT] Error fetching NFT count:`, error);
    return 0;
  }
}


