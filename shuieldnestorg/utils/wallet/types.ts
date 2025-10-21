/**
 * Wallet Types
 * Common type definitions for wallet functionality
 */

export type WalletProvider = "keplr" | "leap" | "cosmostation";

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

export interface WalletData {
  id: string;
  address: string;
  label: string;
  read_only: boolean;
  is_primary: boolean;
  created_at: string;
}
