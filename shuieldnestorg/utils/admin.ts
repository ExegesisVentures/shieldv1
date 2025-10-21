/**
 * Admin Role Utilities
 * Check if a user has admin privileges
 */

import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Admin wallet addresses (Coreum mainnet addresses)
 * Loaded from environment variable: ADMIN_WALLET_ADDRESSES
 * Format: Comma-separated list of wallet addresses
 * Example: core1xxx,core1yyy,core1zzz
 */
const ADMIN_WALLET_ADDRESSES: string[] = (
  process.env.ADMIN_WALLET_ADDRESSES || ""
)
  .split(",")
  .map(addr => addr.trim().toLowerCase())
  .filter(Boolean);

/**
 * Admin email addresses
 * Loaded from environment variable: ADMIN_EMAILS
 * Format: Comma-separated list of email addresses
 * Example: admin1@example.com,admin2@example.com
 */
const ADMIN_EMAILS: string[] = (
  process.env.ADMIN_EMAILS || ""
)
  .split(",")
  .map(email => email.trim().toLowerCase())
  .filter(Boolean);

/**
 * Check if current authenticated user is an admin
 * Checks both wallet addresses and email addresses
 */
export async function isUserAdmin(supabase: SupabaseClient): Promise<boolean> {
  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return false;
    }

    // Check if user's email is in admin list
    if (user.email && ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      return true;
    }

    // Check user metadata for admin flag (set manually in Supabase)
    if (user.user_metadata?.is_admin === true) {
      return true;
    }

    // Check app metadata for admin role (set via RLS or service role)
    if (user.app_metadata?.role === "admin") {
      return true;
    }

    // Check if any of user's connected wallets are admin wallets
    // First get the user's public_user_id
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("public_user_id")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (profile?.public_user_id) {
      const { data: wallets } = await supabase
        .from("wallets")
        .select("address")
        .eq("public_user_id", profile.public_user_id);

      if (wallets && wallets.length > 0) {
        const userWalletAddresses = wallets.map(w => w.address.toLowerCase());
        const hasAdminWallet = userWalletAddresses.some(addr => 
          ADMIN_WALLET_ADDRESSES.includes(addr)
        );
        
        if (hasAdminWallet) {
          return true;
        }
      }
    }

    return false;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}

/**
 * Get admin configuration (for display purposes)
 */
export function getAdminConfig() {
  return {
    hasWalletAdmins: ADMIN_WALLET_ADDRESSES.length > 0,
    hasEmailAdmins: ADMIN_EMAILS.length > 0,
    walletCount: ADMIN_WALLET_ADDRESSES.length,
    emailCount: ADMIN_EMAILS.length,
  };
}

/**
 * Manually add an admin wallet address to the list
 * This should only be called from server-side admin tools
 */
export function addAdminWallet(address: string): boolean {
  const lowerAddress = address.toLowerCase();
  if (!ADMIN_WALLET_ADDRESSES.includes(lowerAddress)) {
    ADMIN_WALLET_ADDRESSES.push(lowerAddress);
    return true;
  }
  return false;
}

/**
 * Check if a specific wallet address is an admin wallet
 */
export function isAdminWallet(address: string): boolean {
  return ADMIN_WALLET_ADDRESSES.includes(address.toLowerCase());
}

/**
 * Check if a specific email is an admin email
 */
export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.includes(email.toLowerCase());
}
