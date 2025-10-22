/**
 * ============================================
 * COREUM TOKEN SEND UTILITY
 * ============================================
 * 
 * Utility functions for sending tokens on Coreum network
 * Supports both native CORE and other tokens
 * 
 * File: /utils/coreum/send-tokens.ts
 */

"use client";

import { SigningStargateClient, GasPrice } from "@cosmjs/stargate";

declare global {
  interface Window {
    keplr?: any;
    leap?: any;
    cosmostation?: any;
  }
}

const COREUM_CHAIN_ID = process.env.NEXT_PUBLIC_COREUM_CHAIN_ID || "coreum-mainnet-1";
export const COREUM_RPC_ENDPOINT = process.env.NEXT_PUBLIC_COREUM_RPC || "https://full-node.mainnet-1.coreum.dev:26657";
export const COREUM_GAS_PRICE = GasPrice.fromString("0.0625ucore");

export type WalletProvider = "keplr" | "leap" | "cosmostation";

function detectProvider(): WalletProvider | null {
  if (typeof window === "undefined") return null;
  if (window.keplr) return "keplr";
  if (window.leap) return "leap";
  if (window.cosmostation) return "cosmostation";
  return null;
}

async function getOfflineSigner(provider: WalletProvider) {
  if (provider === "keplr") {
    await window.keplr?.enable(COREUM_CHAIN_ID);
    return window.keplr?.getOfflineSigner(COREUM_CHAIN_ID);
  }
  if (provider === "leap") {
    await window.leap?.enable(COREUM_CHAIN_ID);
    return window.leap?.getOfflineSigner(COREUM_CHAIN_ID);
  }
  if (provider === "cosmostation") {
    await window.cosmostation?.providers?.keplr?.enable(COREUM_CHAIN_ID);
    return window.cosmostation?.providers?.keplr?.getOfflineSigner(COREUM_CHAIN_ID);
  }
  throw new Error(`Unknown provider: ${provider}`);
}

interface SendTokensParams {
  fromAddress: string;
  toAddress: string;
  amount: string; // Amount in human units (e.g., "100" for 100 CORE)
  denom: string; // Token denomination (e.g., "ucore" for CORE)
  decimals?: number; // Token decimals (default 6)
  memo?: string;
  explicitProvider?: WalletProvider;
}

interface SendTokensResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

/**
 * Send tokens from one address to another on Coreum
 * 
 * @param params SendTokensParams
 * @returns SendTokensResult with success status and transaction hash or error
 */
export async function sendTokens(params: SendTokensParams): Promise<SendTokensResult> {
  const {
    fromAddress,
    toAddress,
    amount,
    denom,
    decimals = 6,
    memo = "",
    explicitProvider
  } = params;

  try {
    // Validate inputs
    if (!fromAddress || !toAddress || !amount || !denom) {
      return { success: false, error: "Missing required parameters" };
    }

    if (!toAddress.startsWith("core1")) {
      return { success: false, error: "Invalid recipient address. Must start with 'core1'" };
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return { success: false, error: "Invalid amount. Please enter a positive number." };
    }
    
    // Validate amount doesn't use scientific notation in string form
    if (amount.toLowerCase().includes('e')) {
      return { success: false, error: "Invalid amount format. Please use standard decimal notation." };
    }

    // Get wallet provider
    const provider = explicitProvider || detectProvider();
    if (!provider) {
      return { success: false, error: "No wallet provider detected. Please connect your wallet." };
    }

    // Get signer
    const signer = await getOfflineSigner(provider);
    const accounts = await signer.getAccounts();
    const signerAddress = accounts?.[0]?.address;

    if (!signerAddress || signerAddress !== fromAddress) {
      return { 
        success: false, 
        error: "Connected wallet address does not match sender address. Please switch to the correct wallet." 
      };
    }

    // Connect to Coreum
    const client = await SigningStargateClient.connectWithSigner(
      COREUM_RPC_ENDPOINT,
      signer,
      { gasPrice: COREUM_GAS_PRICE }
    );

    // Convert amount to base units (e.g., CORE -> ucore)
    // Use parseTokenAmount to avoid scientific notation issues
    const baseAmount = parseTokenAmount(amount, decimals);
    
    if (baseAmount === "0") {
      return { success: false, error: "Amount is too small or invalid." };
    }

    console.log('[SendTokens] Converting amount:', {
      humanAmount: amount,
      decimals,
      baseAmount,
      denom
    });

    // Create send message
    const msg = {
      typeUrl: "/cosmos.bank.v1beta1.MsgSend",
      value: {
        fromAddress,
        toAddress,
        amount: [{ denom, amount: baseAmount }],
      },
    };

    // Estimate gas
    const fee = {
      amount: [{ denom: "ucore", amount: "5000" }],
      gas: "200000",
    };

    // Send transaction
    const result = await client.signAndBroadcast(
      fromAddress,
      [msg],
      fee,
      memo
    );

    if (result.code !== 0) {
      return { 
        success: false, 
        error: result.rawLog || "Transaction failed" 
      };
    }

    // @ts-ignore cosmjs versions
    const txHash: string | undefined = result.transactionHash || result.hash;
    
    return { 
      success: true, 
      txHash 
    };

  } catch (err: any) {
    console.error("[SendTokens] Error:", err);
    return { 
      success: false, 
      error: err?.message || String(err) 
    };
  }
}

/**
 * Get token balance for a specific denom
 * Useful for validation before sending
 */
export async function getTokenBalance(
  address: string,
  denom: string
): Promise<{ balance: string; error?: string }> {
  try {
    const response = await fetch(
      `${COREUM_RPC_ENDPOINT.replace(':26657', ':1317')}/cosmos/bank/v1beta1/balances/${address}/${denom}`
    );
    
    if (!response.ok) {
      return { balance: "0", error: "Failed to fetch balance" };
    }

    const data = await response.json();
    const balance = data.balance?.amount || "0";
    
    return { balance };
  } catch (err) {
    console.error("[GetTokenBalance] Error:", err);
    return { balance: "0", error: String(err) };
  }
}

/**
 * Validate Coreum address format
 */
export function isValidCoreumAddress(address: string): boolean {
  // Coreum addresses start with "core1" and are bech32 encoded
  return /^core1[a-z0-9]{38}$/.test(address);
}

/**
 * Format amount for display
 */
export function formatTokenAmount(amount: string, decimals: number = 6): string {
  const num = parseFloat(amount) / Math.pow(10, decimals);
  return num.toLocaleString('en-US', { 
    minimumFractionDigits: 0, 
    maximumFractionDigits: decimals 
  });
}

/**
 * Parse human-readable amount to base units
 * CRITICAL: Uses string manipulation to avoid scientific notation for large numbers
 * This fixes the "math/big: cannot unmarshal 1e+22" error
 */
export function parseTokenAmount(amount: string, decimals: number = 6): string {
  const num = parseFloat(amount);
  if (isNaN(num) || num <= 0) return "0";
  
  // Convert to string and handle scientific notation manually
  // This ensures we never pass scientific notation to BigInt
  const amountStr = amount.toString();
  
  // Check if the input already has a decimal point
  const parts = amountStr.split('.');
  const integerPart = parts[0] || '0';
  const decimalPart = parts[1] || '';
  
  // Pad or truncate decimal part to match required decimals
  let paddedDecimal = decimalPart.padEnd(decimals, '0').slice(0, decimals);
  
  // Combine integer and decimal parts
  const fullNumberStr = integerPart + paddedDecimal;
  
  // Remove leading zeros but keep at least one digit
  const trimmed = fullNumberStr.replace(/^0+/, '') || '0';
  
  // Validate the result can be converted to BigInt
  try {
    return BigInt(trimmed).toString();
  } catch (err) {
    console.error('[parseTokenAmount] Failed to convert to BigInt:', trimmed, err);
    return "0";
  }
}

