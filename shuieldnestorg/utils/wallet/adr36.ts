import { SupabaseClient } from "@supabase/supabase-js";

export const ADR36_PREFIX = "Sign in to ShieldNest";

export function makeNonce() { 
  return crypto.randomUUID(); 
}

export function makeSignDoc(address: string, nonce: string, customMessage?: string) {
  const prefix = customMessage || ADR36_PREFIX;
  return `${prefix}\nAddress: ${address}\nNonce: ${nonce}\nIssued: ${new Date().toISOString()}`;
}

/**
 * Verify and consume a nonce using atomic database function
 * Returns true if nonce is valid, unused, and not expired
 * Uses the consume_nonce() PostgreSQL function for atomic operation
 */
export async function verifyAndConsumeNonce(
  supabase: SupabaseClient,
  nonce: string,
  address: string
): Promise<{ valid: boolean; error?: string }> {
  // Call the atomic consume_nonce function
  // This handles all validation (exists, not used, not expired, address match) atomically
  const { data, error } = await supabase.rpc("consume_nonce", {
    p_nonce: nonce,
    p_address: address.toLowerCase(), // Normalize to lowercase for case-insensitive match
  });

  if (error) {
    console.error("Nonce consumption error:", error);
    return { valid: false, error: "Failed to verify nonce" };
  }

  // The function returns boolean: true if successfully consumed, false otherwise
  if (data === true) {
    return { valid: true };
  }

  // If false, nonce was invalid, expired, used, or address mismatch
  return { valid: false, error: "Invalid, expired, or already used nonce" };
}

