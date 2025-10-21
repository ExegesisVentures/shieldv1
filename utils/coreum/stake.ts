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
const COREUM_RPC_ENDPOINT = process.env.NEXT_PUBLIC_COREUM_RPC || "https://full-node.mainnet-1.coreum.dev:26657";
const COREUM_REST_ENDPOINT = process.env.NEXT_PUBLIC_COREUM_REST || "https://full-node.mainnet-1.coreum.dev:1317";
const COREUM_GAS_PRICE = GasPrice.fromString("0.05ucore");

export type WalletProvider = "keplr" | "leap" | "cosmostation";

export interface StakingValidator {
  operator_address: string;
  status?: string;
  tokens?: string;
  description?: { moniker?: string };
  delegator_shares?: string;
  commission?: {
    commission_rates?: {
      rate?: string;
      max_rate?: string;
      max_change_rate?: string;
    };
  };
}

function detectProvider(): WalletProvider | null {
  if (typeof window === "undefined") return null;
  if (window.keplr) return "keplr";
  if (window.leap) return "leap";
  if (window.cosmostation) return "cosmostation";
  return null;
}

async function getOfflineSigner(provider: WalletProvider) {
  if (provider === "keplr" && window.keplr) {
    await window.keplr.enable(COREUM_CHAIN_ID);
    if (window.keplr.getOfflineSignerAuto) return window.keplr.getOfflineSignerAuto(COREUM_CHAIN_ID);
    return window.keplr.getOfflineSigner?.(COREUM_CHAIN_ID) || window.keplr.getOfflineSignerOnlyAmino?.(COREUM_CHAIN_ID);
  }
  if (provider === "leap" && window.leap) {
    await window.leap.enable(COREUM_CHAIN_ID);
    if (window.leap.getOfflineSignerAuto) return window.leap.getOfflineSignerAuto(COREUM_CHAIN_ID);
    return window.leap.getOfflineSigner?.(COREUM_CHAIN_ID) || window.leap.getOfflineSignerOnlyAmino?.(COREUM_CHAIN_ID);
  }
  if (provider === "cosmostation" && window.cosmostation) {
    await window.cosmostation.enable(COREUM_CHAIN_ID);
    const signer = window.cosmostation.getOfflineSignerAuto?.(COREUM_CHAIN_ID)
      || window.cosmostation.getOfflineSigner?.(COREUM_CHAIN_ID)
      || window.cosmostation.getOfflineSignerOnlyAmino?.(COREUM_CHAIN_ID);
    return signer;
  }
  throw new Error("Unsupported or missing wallet provider");
}

export async function fetchValidators(): Promise<StakingValidator[]> {
  const url = `${COREUM_REST_ENDPOINT}/cosmos/staking/v1beta1/validators?status=BOND_STATUS_BONDED`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  const validators = (data?.validators || []) as any[];
  return validators.map((v) => ({
    operator_address: v?.operator_address,
    status: v?.status,
    tokens: v?.tokens,
    description: v?.description,
    delegator_shares: v?.delegator_shares,
    commission: v?.commission,
  })).filter(v => !!v.operator_address);
}

/**
 * Delegate CORE to a validator. Amount is in CORE (human units), converted to ucore.
 */
export async function delegateTokensClient(
  delegatorAddress: string,
  amountCore: string,
  validatorAddress: string,
  explicitProvider?: WalletProvider
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    const provider = explicitProvider || detectProvider();
    if (!provider) return { success: false, error: "No wallet provider detected" };

    const signer = await getOfflineSigner(provider);
    const accounts = await signer.getAccounts();
    const signerAddress = accounts?.[0]?.address;
    if (!signerAddress || signerAddress !== delegatorAddress) {
      return { success: false, error: "Connected wallet address does not match selected wallet" };
    }

    const client = await SigningStargateClient.connectWithSigner(COREUM_RPC_ENDPOINT, signer, { gasPrice: COREUM_GAS_PRICE });

    // Convert CORE -> ucore (6 decimals)
    const amountUcore = BigInt(Math.floor(Number(amountCore) * 1e6)).toString();

    const msg = {
      typeUrl: "/cosmos.staking.v1beta1.MsgDelegate",
      value: {
        delegatorAddress,
        validatorAddress,
        amount: { denom: "ucore", amount: amountUcore },
      },
    };

    const fee = {
      amount: [{ denom: "ucore", amount: "6000" }],
      gas: "250000",
    };

    const result = await client.signAndBroadcast(delegatorAddress, [msg], fee, "Delegate COREUM");
    if (result.code !== 0) {
      return { success: false, error: result.rawLog || "Broadcast failed" };
    }
    // @ts-ignore cosmjs versions
    const txHash: string | undefined = result.transactionHash || result.hash;
    return { success: true, txHash };
  } catch (err: any) {
    console.error("[Stake] Error:", err);
    return { success: false, error: err?.message || String(err) };
  }
}

/**
 * Undelegate (unstake) CORE from a validator. Amount is in CORE (human units), converted to ucore.
 */
export async function undelegateTokensClient(
  delegatorAddress: string,
  amountCore: string,
  validatorAddress: string,
  explicitProvider?: WalletProvider
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    const provider = explicitProvider || detectProvider();
    if (!provider) return { success: false, error: "No wallet provider detected" };

    const signer = await getOfflineSigner(provider);
    const accounts = await signer.getAccounts();
    const signerAddress = accounts?.[0]?.address;
    if (!signerAddress || signerAddress !== delegatorAddress) {
      return { success: false, error: "Connected wallet address does not match selected wallet" };
    }

    const client = await SigningStargateClient.connectWithSigner(COREUM_RPC_ENDPOINT, signer, { gasPrice: COREUM_GAS_PRICE });

    // Convert CORE -> ucore (6 decimals)
    const amountUcore = BigInt(Math.floor(Number(amountCore) * 1e6)).toString();

    const msg = {
      typeUrl: "/cosmos.staking.v1beta1.MsgUndelegate",
      value: {
        delegatorAddress,
        validatorAddress,
        amount: { denom: "ucore", amount: amountUcore },
      },
    };

    const fee = {
      amount: [{ denom: "ucore", amount: "6000" }],
      gas: "250000",
    };

    const result = await client.signAndBroadcast(delegatorAddress, [msg], fee, "Undelegate COREUM");
    if (result.code !== 0) {
      return { success: false, error: result.rawLog || "Broadcast failed" };
    }
    // @ts-ignore cosmjs versions
    const txHash: string | undefined = result.transactionHash || result.hash;
    return { success: true, txHash };
  } catch (err: any) {
    console.error("[Unstake] Error:", err);
    return { success: false, error: err?.message || String(err) };
  }
}

/**
 * Redelegate CORE from one validator to another. Amount is in CORE (human units), converted to ucore.
 */
export async function redelegateTokensClient(
  delegatorAddress: string,
  amountCore: string,
  srcValidatorAddress: string,
  dstValidatorAddress: string,
  explicitProvider?: WalletProvider
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    const provider = explicitProvider || detectProvider();
    if (!provider) return { success: false, error: "No wallet provider detected" };

    const signer = await getOfflineSigner(provider);
    const accounts = await signer.getAccounts();
    const signerAddress = accounts?.[0]?.address;
    if (!signerAddress || signerAddress !== delegatorAddress) {
      return { success: false, error: "Connected wallet address does not match selected wallet" };
    }

    const client = await SigningStargateClient.connectWithSigner(COREUM_RPC_ENDPOINT, signer, { gasPrice: COREUM_GAS_PRICE });

    // Convert CORE -> ucore (6 decimals)
    const amountUcore = BigInt(Math.floor(Number(amountCore) * 1e6)).toString();

    const msg = {
      typeUrl: "/cosmos.staking.v1beta1.MsgBeginRedelegate",
      value: {
        delegatorAddress,
        validatorSrcAddress: srcValidatorAddress,
        validatorDstAddress: dstValidatorAddress,
        amount: { denom: "ucore", amount: amountUcore },
      },
    };

    const fee = {
      amount: [{ denom: "ucore", amount: "6000" }],
      gas: "250000",
    };

    const result = await client.signAndBroadcast(delegatorAddress, [msg], fee, "Redelegate COREUM");
    if (result.code !== 0) {
      return { success: false, error: result.rawLog || "Broadcast failed" };
    }
    // @ts-ignore cosmjs versions
    const txHash: string | undefined = result.transactionHash || result.hash;
    return { success: true, txHash };
  } catch (err: any) {
    console.error("[Redelegate] Error:", err);
    return { success: false, error: err?.message || String(err) };
  }
}

/**
 * Fetch user's current delegations to know which validators they're staked with
 */
export async function fetchDelegations(delegatorAddress: string): Promise<Array<{validator: string; amount: string}>> {
  try {
    const url = `${COREUM_REST_ENDPOINT}/cosmos/staking/v1beta1/delegations/${delegatorAddress}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    const delegations = (data?.delegation_responses || []) as any[];
    return delegations.map((d) => ({
      validator: d?.delegation?.validator_address || "",
      amount: d?.balance?.amount || "0",
    })).filter(d => d.validator && parseFloat(d.amount) > 0);
  } catch (err) {
    console.error("[Delegations] Error:", err);
    return [];
  }
}
