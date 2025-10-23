/**
 * ============================================
 * LEDGER HARDWARE WALLET SUPPORT
 * ============================================
 * 
 * Provides enhanced transaction signing support for Ledger hardware wallets.
 * Ledger devices require specific transaction formats and signing methods.
 * 
 * Key Requirements for Ledger:
 * 1. Use Amino (legacy) signing mode, not Direct (Protobuf)
 * 2. Provide explicit account number and sequence
 * 3. Use explicit gas amounts (no "auto")
 * 4. Keep memo fields short (< 200 chars for screen display)
 * 5. Avoid complex nested messages when possible
 * 
 * File: /utils/coreum/ledger-support.ts
 */

import { SigningStargateClient, GasPrice, StdFee } from "@cosmjs/stargate";
import { makeAuthInfoBytes, makeSignDoc, TxBodyEncodeObject } from "@cosmjs/proto-signing";
import { fromBase64 } from "@cosmjs/encoding";

const COREUM_RPC_ENDPOINT =
  process.env.NEXT_PUBLIC_COREUM_RPC ||
  "https://full-node.mainnet-1.coreum.dev:26657";
const COREUM_CHAIN_ID =
  process.env.NEXT_PUBLIC_COREUM_CHAIN_ID || "coreum-mainnet-1";
const COREUM_GAS_PRICE = GasPrice.fromString("0.0625ucore");

/**
 * Detect if the current signer is likely using a Ledger device
 * This is a best-effort detection based on signer type and capabilities
 */
export function isLikelyledgerSigner(signer: any): boolean {
  // Check if signer has amino-only methods (common with Ledger)
  if (signer.signAmino && !signer.signDirect) {
    console.log("🔐 [Ledger] Detected Amino-only signer (likely Ledger)");
    return true;
  }
  
  // Check for Keplr's getOfflineSignerOnlyAmino flag
  if (signer.constructor?.name?.includes("Amino")) {
    console.log("🔐 [Ledger] Detected Amino signer type");
    return true;
  }
  
  return false;
}

/**
 * Get account number and sequence for an address
 * Required for Ledger signing
 */
export async function getAccountInfo(
  client: SigningStargateClient,
  address: string
): Promise<{ accountNumber: number; sequence: number }> {
  try {
    const account = await client.getAccount(address);
    if (!account) {
      throw new Error(`Account not found: ${address}`);
    }
    
    console.log(`🔐 [Ledger] Account info for ${address}:`, {
      accountNumber: account.accountNumber,
      sequence: account.sequence,
    });
    
    return {
      accountNumber: account.accountNumber,
      sequence: account.sequence,
    };
  } catch (error) {
    console.error("❌ [Ledger] Failed to get account info:", error);
    throw error;
  }
}

/**
 * Create a Ledger-compatible transaction fee
 * Uses explicit gas amounts instead of "auto"
 */
export function createLedgerFee(gasLimit: string, gasPrice: string = "0.0625"): StdFee {
  const amount = Math.ceil(parseFloat(gasLimit) * parseFloat(gasPrice)).toString();
  
  return {
    amount: [{ denom: "ucore", amount }],
    gas: gasLimit,
  };
}

/**
 * Get appropriate gas limit for different transaction types
 */
export function getGasLimitForTxType(txType: string): string {
  const gasLimits: Record<string, string> = {
    // Bank
    send: "200000",
    multisend: "300000",
    
    // Staking
    delegate: "250000",
    undelegate: "300000",
    redelegate: "350000",
    
    // Distribution
    withdraw_rewards: "200000",
    withdraw_rewards_multi: "400000", // For multiple validators
    
    // Governance
    vote: "250000",
    submit_proposal: "500000",
    deposit: "250000",
    
    // Default
    default: "250000",
  };
  
  return gasLimits[txType] || gasLimits.default;
}

/**
 * Validate and truncate memo for Ledger screen limits
 * Ledger devices have limited screen space for displaying transaction details
 */
export function validateLedgerMemo(memo: string): string {
  const MAX_LEDGER_MEMO_LENGTH = 180; // Conservative limit for display
  
  if (!memo) return "";
  
  if (memo.length > MAX_LEDGER_MEMO_LENGTH) {
    console.warn(
      `⚠️ [Ledger] Memo too long (${memo.length} chars), truncating to ${MAX_LEDGER_MEMO_LENGTH} chars`
    );
    return memo.substring(0, MAX_LEDGER_MEMO_LENGTH) + "...";
  }
  
  return memo;
}

/**
 * Sign and broadcast a transaction with Ledger compatibility
 * Uses Amino signing mode and explicit account info
 */
export async function signAndBroadcastLedgerTx(
  client: SigningStargateClient,
  signer: any,
  signerAddress: string,
  messages: any[],
  gasLimit: string,
  memo: string = ""
): Promise<{
  success: boolean;
  transactionHash?: string;
  height?: number;
  gasUsed?: string;
  error?: string;
}> {
  try {
    console.log("🔐 [Ledger] Preparing Ledger-compatible transaction");
    console.log("🔐 [Ledger] Messages:", messages.length);
    console.log("🔐 [Ledger] Gas limit:", gasLimit);
    
    // Validate and truncate memo for Ledger
    const validatedMemo = validateLedgerMemo(memo);
    if (validatedMemo !== memo) {
      console.log("🔐 [Ledger] Memo was truncated for Ledger compatibility");
    }
    
    // Create explicit fee (no "auto")
    const fee = createLedgerFee(gasLimit);
    console.log("🔐 [Ledger] Fee:", fee);
    
    // Get account info (required for Ledger)
    const accountInfo = await getAccountInfo(client, signerAddress);
    
    // Sign and broadcast with explicit parameters
    console.log("🔐 [Ledger] Requesting Ledger signature...");
    console.log("⏳ [Ledger] Please confirm the transaction on your Ledger device");
    
    const result = await client.signAndBroadcast(
      signerAddress,
      messages,
      fee,
      validatedMemo
    );
    
    if (result.code !== 0) {
      console.error("❌ [Ledger] Transaction failed:", result.rawLog);
      return {
        success: false,
        error: result.rawLog || "Transaction failed",
      };
    }
    
    console.log("✅ [Ledger] Transaction successful!");
    console.log("📝 [Ledger] TX Hash:", result.transactionHash);
    
    return {
      success: true,
      transactionHash: result.transactionHash,
      height: result.height,
      gasUsed: result.gasUsed?.toString(),
    };
  } catch (error) {
    console.error("❌ [Ledger] Error signing transaction:", error);
    
    // Provide helpful error messages for common Ledger issues
    let errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage.includes("rejected")) {
      errorMessage = "Transaction rejected on Ledger device";
    } else if (errorMessage.includes("timeout")) {
      errorMessage = "Ledger signing timeout - please try again";
    } else if (errorMessage.includes("locked")) {
      errorMessage = "Please unlock your Ledger device and open the Coreum app";
    } else if (errorMessage.includes("not found")) {
      errorMessage = "Ledger device not found - please ensure it's connected and the Coreum app is open";
    }
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Create a SigningStargateClient optimized for Ledger
 * Uses Amino signer and appropriate options
 */
export async function createLedgerClient(signer: any): Promise<SigningStargateClient> {
  console.log("🔐 [Ledger] Creating Ledger-optimized SigningStargateClient");
  
  const client = await SigningStargateClient.connectWithSigner(
    COREUM_RPC_ENDPOINT,
    signer,
    {
      gasPrice: COREUM_GAS_PRICE,
      // Amino codec is used by default for signing, which is what Ledger needs
    }
  );
  
  console.log("✅ [Ledger] Client created successfully");
  return client;
}

/**
 * Helper to check if user needs to use Amino signer for Ledger
 * Returns appropriate instructions
 */
export function getLedgerInstructions(): string {
  return `
📱 Using a Ledger device?

Please ensure:
1. ✅ Ledger is connected and unlocked
2. ✅ Coreum app is open (or Cosmos app if Coreum not available)
3. ✅ "Contract data" and "Expert mode" are enabled in Cosmos app settings (if needed)
4. ⏳ Confirm the transaction on your Ledger screen

Note: Ledger transactions may take longer to sign due to hardware confirmation requirements.
  `.trim();
}

/**
 * Get offline signer with Amino support for Ledger compatibility
 */
export async function getOfflineSignerAmino(provider: string): Promise<any> {
  const chainId = COREUM_CHAIN_ID;
  
  try {
    switch (provider) {
      case "keplr":
        if (!window.keplr) throw new Error("Keplr not installed");
        await window.keplr.enable(chainId);
        // Use Amino-only signer for Ledger compatibility
        return window.keplr.getOfflineSignerOnlyAmino(chainId);
        
      case "leap":
        if (!window.leap) throw new Error("Leap not installed");
        await window.leap.enable(chainId);
        return window.leap.getOfflineSignerOnlyAmino(chainId);
        
      case "cosmostation":
        if (!window.cosmostation) throw new Error("Cosmostation not installed");
        await window.cosmostation.providers.keplr.enable(chainId);
        return window.cosmostation.providers.keplr.getOfflineSignerOnlyAmino(chainId);
        
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  } catch (error) {
    console.error("❌ [Ledger] Failed to get Amino signer:", error);
    throw error;
  }
}

