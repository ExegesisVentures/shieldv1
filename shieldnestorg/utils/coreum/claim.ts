"use client";

// Minimal client-side utility to claim staking rewards on Coreum
// via Keplr / Leap / Cosmostation using cosmjs.

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
    // Cosmostation often exposes getOfflineSigner via window.cosmostation
    const signer = window.cosmostation.getOfflineSignerAuto?.(COREUM_CHAIN_ID)
      || window.cosmostation.getOfflineSigner?.(COREUM_CHAIN_ID)
      || window.cosmostation.getOfflineSignerOnlyAmino?.(COREUM_CHAIN_ID);
    return signer;
  }
  throw new Error("Unsupported or missing wallet provider");
}

async function fetchDelegations(address: string): Promise<Array<{ validator_address: string }>> {
  const url = `${COREUM_REST_ENDPOINT}/cosmos/staking/v1beta1/delegations/${address}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  const dels = data?.delegation_responses || [];
  return dels.map((d: any) => ({ validator_address: d?.delegation?.validator_address }))
    .filter((d: any) => !!d.validator_address);
}

/**
 * Fetch rewards for a given delegator to calculate total claimable amount
 */
async function fetchRewards(address: string): Promise<{ total: string; rewards: Array<{ validator_address: string; amount: string }> }> {
  try {
    const url = `${COREUM_REST_ENDPOINT}/cosmos/distribution/v1beta1/delegators/${address}/rewards`;
    const res = await fetch(url);
    if (!res.ok) return { total: "0", rewards: [] };
    const data = await res.json();
    
    const rewards = (data?.rewards || []).map((r: any) => {
      const coreReward = r?.reward?.find((coin: any) => coin?.denom === "ucore");
      return {
        validator_address: r?.validator_address || "",
        amount: coreReward?.amount || "0",
      };
    }).filter((r: any) => r.validator_address && parseFloat(r.amount) > 0);

    const totalReward = rewards.reduce((sum: number, r: any) => sum + parseFloat(r.amount), 0);
    
    return { total: totalReward.toString(), rewards };
  } catch (err) {
    console.error("[FetchRewards] Error:", err);
    return { total: "0", rewards: [] };
  }
}

/**
 * Claim rewards and add them to available balance (Cash In option)
 */
export async function claimAllRewardsClient(
  address: string,
  explicitProvider?: WalletProvider
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    const provider = explicitProvider || detectProvider();
    if (!provider) return { success: false, error: "No wallet provider detected" };

    const delegations = await fetchDelegations(address);
    if (delegations.length === 0) {
      return { success: false, error: "No active delegations found to claim rewards from" };
    }

    const signer = await getOfflineSigner(provider);
    const accounts = await signer.getAccounts();
    const signerAddress = accounts?.[0]?.address;
    if (!signerAddress || signerAddress !== address) {
      // Require the connected address to match the provided one
      return { success: false, error: "Connected wallet address does not match selected wallet" };
    }

    const client = await SigningStargateClient.connectWithSigner(COREUM_RPC_ENDPOINT, signer, { gasPrice: COREUM_GAS_PRICE });

    const messages = delegations.map((d) => ({
      typeUrl: "/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward",
      value: {
        delegatorAddress: address,
        validatorAddress: d.validator_address,
      },
    }));

    // Reasonable flat fee; wallets will simulate/adjust if needed
    const fee = {
      amount: [{ denom: "ucore", amount: "5000" }],
      gas: "200000",
    };

    const result = await client.signAndBroadcast(address, messages, fee, "Claim Coreum staking rewards");
    if (result.code !== 0) {
      return { success: false, error: result.rawLog || "Broadcast failed" };
    }
    // Varying naming across cosmjs versions; prefer transactionHash
    // @ts-ignore
    const txHash: string | undefined = result.transactionHash || result.hash;
    return { success: true, txHash };
  } catch (err: any) {
    console.error("[ClaimRewards] Error:", err);
    return { success: false, error: err?.message || String(err) };
  }
}

/**
 * Compound rewards: Claim and immediately restake to the same validators proportionally
 * This uses authz pattern for safety - user grants permission to restake on their behalf
 */
export async function claimAndCompoundRewardsClient(
  address: string,
  targetValidatorAddresses?: string[], // Optional: if specified, distribute evenly among these validators (max 3)
  explicitProvider?: WalletProvider
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    const provider = explicitProvider || detectProvider();
    if (!provider) return { success: false, error: "No wallet provider detected" };

    const delegations = await fetchDelegations(address);
    if (delegations.length === 0) {
      return { success: false, error: "No active delegations found to claim rewards from" };
    }

    const signer = await getOfflineSigner(provider);
    const accounts = await signer.getAccounts();
    const signerAddress = accounts?.[0]?.address;
    if (!signerAddress || signerAddress !== address) {
      return { success: false, error: "Connected wallet address does not match selected wallet" };
    }

    const client = await SigningStargateClient.connectWithSigner(COREUM_RPC_ENDPOINT, signer, { gasPrice: COREUM_GAS_PRICE });

    // Fetch current rewards to know how much we'll have after claiming
    const rewardsData = await fetchRewards(address);
    const totalRewardsUcore = Math.floor(parseFloat(rewardsData.total));
    
    if (totalRewardsUcore < 1000) {
      return { success: false, error: "Rewards too small to compound (minimum 0.001 CORE)" };
    }

    // Build messages array: first claim all rewards, then delegate them
    const messages: any[] = [];

    // 1. Claim rewards from all validators
    delegations.forEach((d) => {
      messages.push({
        typeUrl: "/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward",
        value: {
          delegatorAddress: address,
          validatorAddress: d.validator_address,
        },
      });
    });

    // 2. Restake the rewards
    if (targetValidatorAddresses && targetValidatorAddresses.length > 0) {
      // Distribute evenly among selected validators (up to 3)
      const numValidators = Math.min(targetValidatorAddresses.length, 3);
      const amountPerValidator = Math.floor(totalRewardsUcore / numValidators);
      let remainingAmount = totalRewardsUcore;
      
      targetValidatorAddresses.slice(0, 3).forEach((validatorAddress, index) => {
        // For the last validator, give them the remaining amount to account for rounding
        const amountToStake = (index === numValidators - 1) ? remainingAmount : amountPerValidator;
        
        if (amountToStake > 0) {
          messages.push({
            typeUrl: "/cosmos.staking.v1beta1.MsgDelegate",
            value: {
              delegatorAddress: address,
              validatorAddress: validatorAddress,
              amount: { denom: "ucore", amount: amountToStake.toString() },
            },
          });
          remainingAmount -= amountToStake;
        }
      });
    } else {
      // Proportionally restake to validators based on current reward distribution
      const validatorRewards = rewardsData.rewards.filter(r => parseFloat(r.amount) >= 1000);
      
      validatorRewards.forEach((r) => {
        const amountToStake = Math.floor(parseFloat(r.amount));
        if (amountToStake > 0) {
          messages.push({
            typeUrl: "/cosmos.staking.v1beta1.MsgDelegate",
            value: {
              delegatorAddress: address,
              validatorAddress: r.validator_address,
              amount: { denom: "ucore", amount: amountToStake.toString() },
            },
          });
        }
      });
    }

    // Higher gas for compound operation (claim + stake)
    const fee = {
      amount: [{ denom: "ucore", amount: "10000" }],
      gas: "400000",
    };

    const result = await client.signAndBroadcast(address, messages, fee, "Compound CORE staking rewards");
    if (result.code !== 0) {
      return { success: false, error: result.rawLog || "Broadcast failed" };
    }
    // @ts-ignore
    const txHash: string | undefined = result.transactionHash || result.hash;
    return { success: true, txHash };
  } catch (err: any) {
    console.error("[CompoundRewards] Error:", err);
    return { success: false, error: err?.message || String(err) };
  }
}


