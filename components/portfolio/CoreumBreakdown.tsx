"use client";

import { IoCash, IoTrendingUp, IoGift, IoTime, IoCopy, IoDownload, IoSend } from "react-icons/io5";
import { Card } from "@/components/ui/card";
import { formatAddressSnippet, copyToClipboard, showToast } from "@/utils/address-utils";
import { useCallback, useEffect, useState } from "react";
import { claimAllRewardsClient, claimAndCompoundRewardsClient, type WalletProvider } from "@/utils/coreum/claim";
import { delegateTokensClient, undelegateTokensClient, redelegateTokensClient, fetchValidators, fetchDelegations, type StakingValidator } from "@/utils/coreum/stake";
import { AnimatedCurrency, AnimatedPercentage, AnimatedBalance } from "@/components/ui/AnimatedNumber";
import { ThreeArrowSpinner } from "@/components/ui/ThreeArrowSpinner";
import { sendTokens, isValidCoreumAddress } from "@/utils/coreum/send-tokens";
import { getTokenInfo } from "@/utils/coreum/rpc";

interface CoreumToken {
  address: string;
  label: string;
  available: string;
  staked: string;
  rewards: string;
  unbonding?: string;
}

interface CoreumBreakdownProps {
  tokens: CoreumToken[];
  loading?: boolean;
  walletProvider?: "keplr" | "leap" | "cosmostation" | undefined;
  coreumPrice?: number;
  coreumChange24h?: number;
}

// Helper function to get validator avatar URL from Coreum explorer or generate placeholder
const getValidatorAvatar = (validator: StakingValidator): string => {
  const moniker = validator.description?.moniker || "";
  
  // Note: identity property is not available in the current StakingValidator interface
  
  // Try common validator logo URLs
  const monikerLower = moniker.toLowerCase();
  const commonLogos: { [key: string]: string } = {
    'roll': 'https://raw.githubusercontent.com/cosmos/chain-registry/master/coreum/images/roll.png',
    'blackhox': 'https://raw.githubusercontent.com/cosmos/chain-registry/master/coreum/images/blackhox.png',
    'core values': 'https://raw.githubusercontent.com/cosmos/chain-registry/master/coreum/images/core-values.png',
    'siamcoreum': 'https://raw.githubusercontent.com/cosmos/chain-registry/master/coreum/images/siamcoreum.png',
    'bumbalu': 'https://raw.githubusercontent.com/cosmos/chain-registry/master/coreum/images/bumbalu.png',
    'core marshalls': 'https://raw.githubusercontent.com/cosmos/chain-registry/master/coreum/images/core-marshalls.png',
    'solonation': 'https://raw.githubusercontent.com/cosmos/chain-registry/master/coreum/images/solonation.png',
    'macy and foster': 'https://raw.githubusercontent.com/cosmos/chain-registry/master/coreum/images/macy-foster.png',
  };
  
  for (const [key, logoUrl] of Object.entries(commonLogos)) {
    if (monikerLower.includes(key)) {
      return logoUrl;
    }
  }
  
  // Fallback to generated avatar with validator-specific styling
  const colors = {
    'roll': '9333ea', // Purple for Roll
    'blackhox': 'f97316', // Orange for Blackhox
    'core values': 'dc2626', // Red for CORE Values
    'siamcoreum': '2563eb', // Blue for SiamCoreum
    'bumbalu': '8b5cf6', // Purple for Bumbalu
    'core marshalls': 'f59e0b', // Amber for CORE MARSHALLS
    'solonation': '10b981', // Emerald for SoloNation
    'macy': 'ec4899', // Pink for Macy and Foster
  };
  
  let bgColor = 'random';
  
  for (const [key, color] of Object.entries(colors)) {
    if (monikerLower.includes(key)) {
      bgColor = color;
      break;
    }
  }
  
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(moniker)}&size=128&background=${bgColor}&color=fff&bold=true`;
};

export default function CoreumBreakdown({ tokens, loading, walletProvider, coreumPrice, coreumChange24h }: CoreumBreakdownProps) {
  const [claiming, setClaiming] = useState<string | null>(null);
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [claimSelectedWallet, setClaimSelectedWallet] = useState<string>("");
  const [claimMode, setClaimMode] = useState<"compound" | "cashin">("cashin"); // Compound or Cash In
  const [claimTargetValidators, setClaimTargetValidators] = useState<string[]>([]); // For compound: up to 3 validators to restake to
  const [displayTokens, setDisplayTokens] = useState<CoreumToken[]>(tokens);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [validatorSearch, setValidatorSearch] = useState<string>(""); // Search for validators
  const [showProportionalPopup, setShowProportionalPopup] = useState(false); // Show proportional distribution explanation popup

  // Staking modal state
  const [stakeOpen, setStakeOpen] = useState(false);
  const [staking, setStaking] = useState(false);
  const [stakeAmount, setStakeAmount] = useState<string>("");
  const [stakeSelectedWallet, setStakeSelectedWallet] = useState<string>(""); // Which wallet to stake from
  const [validators, setValidators] = useState<StakingValidator[]>([]);
  const [selectedValidator, setSelectedValidator] = useState<string>("");
  const [showAllValidators, setShowAllValidators] = useState(false);
  const [showAdvancedConfirm, setShowAdvancedConfirm] = useState(false);

  // Unstake modal state
  const [unstakeOpen, setUnstakeOpen] = useState(false);
  const [unstaking, setUnstaking] = useState(false);
  const [unstakeAmount, setUnstakeAmount] = useState<string>("");
  const [unstakeValidator, setUnstakeValidator] = useState<string>("");
  const [unstakeSelectedWallet, setUnstakeSelectedWallet] = useState<string>(""); // Which wallet to unstake from
  const [userDelegations, setUserDelegations] = useState<Array<{validator: string; amount: string}>>([]);

  // Redelegate modal state
  const [redelegateOpen, setRedelegateOpen] = useState(false);
  const [redelegating, setRedelegating] = useState(false);
  const [redelegateAmount, setRedelegateAmount] = useState<string>("");
  const [redelegateSelectedWallet, setRedelegateSelectedWallet] = useState<string>(""); // Which wallet to redelegate from
  
  // Send modal state
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendRecipient, setSendRecipient] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [sendMemo, setSendMemo] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendAmountMode, setSendAmountMode] = useState<"token" | "usd">("token"); // Toggle between token amount or USD amount
  const [redelegateSrcValidator, setRedelegateSrcValidator] = useState<string>("");
  const [redelegateDstValidator, setRedelegateDstValidator] = useState<string>("");

  // NOTE: we intentionally avoid early returns before hooks; render loading skeleton later

  // Keep local copy in sync when parent updates
  useEffect(() => {
    setDisplayTokens(tokens);
  }, [tokens]);

  // Calculate totals across all wallets (from local display state)
  const totals = displayTokens.reduce(
    (acc, token) => ({
      available: acc.available + parseFloat(token.available || "0"),
      staked: acc.staked + parseFloat(token.staked || "0"),
      rewards: acc.rewards + parseFloat(token.rewards || "0"),
      unbonding: acc.unbonding + parseFloat(token.unbonding || "0"),
    }),
    { available: 0, staked: 0, rewards: 0, unbonding: 0 }
  );

  const hasMultipleWallets = displayTokens.length > 1;

  // Format amount for display (no decimals, with M for millions)
  const formatAmount = (amount: number) => {
    if (amount >= 1000000) {
      // For millions, show as X.XXXM
      const millions = amount / 1000000;
      return `${millions.toFixed(3)}M`;
    }
    // For smaller amounts, show whole number with commas
    return Math.floor(amount).toLocaleString("en-US");
  };

  // Format full amount with all decimals for hover tooltip
  const formatFullAmount = (amount: number) => {
    return amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 6 });
  };

  // Get primary wallet (first wallet or single wallet)
  const primaryWallet = displayTokens.length > 0 ? displayTokens[0] : null;

  // Handle copy address functionality
  const handleIoCopyAddress = async (address: string, walletLabel: string) => {
    const success = await copyToClipboard(address);
    if (success) {
      showToast(`${walletLabel} address copied!`);
    } else {
      showToast('Failed to copy address', 'error');
    }
  };

  // Simple boolean checks - no need for useMemo
  const canClaim = primaryWallet && (parseFloat(primaryWallet.rewards || "0") > 0);
  const canStake = primaryWallet && (totals.available > 0);
  const canUnstake = primaryWallet && (totals.staked > 0);
  const canRedelegate = primaryWallet && (totals.unbonding > 0 || totals.staked > 0);

  const openClaimRewards = () => {
    if (!primaryWallet) return;
    setClaimSelectedWallet(primaryWallet.address);
    if (hasMultipleWallets) {
      setClaimModalOpen(true);
    } else {
      handleClaimRewards(primaryWallet.address);
    }
  };

  const handleClaimRewards = useCallback(async (walletAddress?: string) => {
    const targetAddress = walletAddress || claimSelectedWallet;
    const targetWallet = displayTokens.find(t => t.address === targetAddress);
    if (!targetWallet) return;
    
    const provider = (walletProvider as WalletProvider | undefined) || undefined;
    setClaiming(targetAddress);
    setClaimModalOpen(false);
    
    try {
      let res;
      
      if (claimMode === "compound") {
        // Compound: claim and restake
        // Pass validators array (empty = proportional, or specific validators)
        res = await claimAndCompoundRewardsClient(targetAddress, claimTargetValidators, provider);
        
        if (res.success) {
          // Optimistically update: move rewards -> staked, set rewards to 0
          setDisplayTokens(prev => prev.map(t => {
            if (t.address === targetAddress) {
              const rewardsNum = parseFloat(t.rewards || "0");
              const stakedNum = parseFloat(t.staked || "0");
              return {
                ...t,
                staked: (stakedNum + rewardsNum).toString(),
                rewards: "0"
              };
            }
            return t;
          }));
          showToast("🎉 Rewards compounded and restaked!", "success");
        } else {
          showToast(res.error || "Failed to compound rewards", "error");
        }
      } else {
        // Cash in: claim to available balance
        res = await claimAllRewardsClient(targetAddress, provider);
        
        if (res.success) {
          // Optimistically update local state: move rewards -> available, set rewards to 0
          setDisplayTokens(prev => prev.map(t => {
            if (t.address === targetAddress) {
              const rewardsNum = parseFloat(t.rewards || "0");
              const availableNum = parseFloat(t.available || "0");
              return {
                ...t,
                available: (availableNum + rewardsNum).toString(),
                rewards: "0"
              };
            }
            return t;
          }));
          showToast("💰 Rewards claimed to available balance!", "success");
        } else {
          showToast(res.error || "Failed to claim rewards", "error");
        }
      }
    } catch (e: any) {
      showToast(e?.message || "Failed to claim rewards", "error");
    } finally {
      setClaiming(null);
    }
  }, [claimSelectedWallet, claimMode, claimTargetValidators, displayTokens, walletProvider]);

  // Load validators when opening the stake modal or claim modal (for compound option)
  useEffect(() => {
    if ((!stakeOpen && !claimModalOpen && !redelegateOpen) || !primaryWallet) return;
    let active = true;
    (async () => {
      try {
        const list = await fetchValidators();
        if (!active) return;
        setValidators(list);
        // Prefer a validator containing "roll" in moniker; else first bonded
        const preferred = list.find(v => (v.description?.moniker || "").toLowerCase().includes("roll")) || list[0];
        if (preferred && stakeOpen) setSelectedValidator(preferred.operator_address);
      } catch (e) {
        // noop; show later when interacting
      }
    })();
    return () => { active = false };
  }, [stakeOpen, claimModalOpen, redelegateOpen, claimMode, primaryWallet]);

  // Reset search when modals are closed
  useEffect(() => {
    if (!stakeOpen && !claimModalOpen && !redelegateOpen) {
      setValidatorSearch("");
    }
  }, [stakeOpen, claimModalOpen, redelegateOpen]);

  const openStake = () => {
    if (!primaryWallet) return;
    setStakeSelectedWallet(primaryWallet.address); // Default to primary wallet
    // prefill amount with max available from primary wallet only
    const maxAvail = Math.max(0, parseFloat(primaryWallet.available || "0"));
    setStakeAmount(maxAvail.toString());
    setShowAllValidators(false);
    setStakeOpen(true);
  };

  const submitStake = async () => {
    const selectedWallet = displayTokens.find(t => t.address === stakeSelectedWallet);
    if (!selectedWallet) return;
    
    const amount = parseFloat(stakeAmount || "0");
    const walletAvailable = parseFloat(selectedWallet.available || "0");
    if (!selectedValidator) {
      showToast("Select a validator", "error");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      showToast("Enter a valid amount", "error");
      return;
    }
    if (amount > walletAvailable) {
      showToast("Amount exceeds available", "error");
      return;
    }
    setStaking(true);
    try {
      const provider = (walletProvider as WalletProvider | undefined) || undefined;
      const res = await delegateTokensClient(selectedWallet.address, amount.toString(), selectedValidator, provider);
      if (res.success) {
        // Optimistically update local state: move available -> staked
        setDisplayTokens(prev => prev.map(t => {
          if (t.address === selectedWallet.address) {
            const availableNum = parseFloat(t.available || "0");
            const stakedNum = parseFloat(t.staked || "0");
            const amt = Math.min(amount, availableNum);
            return {
              ...t,
              available: (availableNum - amt).toString(),
              staked: (stakedNum + amt).toString(),
            };
          }
          return t;
        }));
        showToast("Staked successfully", "success");
        setStakeOpen(false);
      } else {
        showToast(res.error || "Stake failed", "error");
      }
    } catch (e: any) {
      showToast(e?.message || "Stake failed", "error");
    } finally {
      setStaking(false);
    }
  };

  // Load delegations when opening unstake or redelegate modal
  useEffect(() => {
    if ((!unstakeOpen && !redelegateOpen) || !primaryWallet) return;
    let active = true;
    
    let targetWallet = primaryWallet;
    if (unstakeOpen && unstakeSelectedWallet) {
      targetWallet = displayTokens.find(t => t.address === unstakeSelectedWallet) || primaryWallet;
    } else if (redelegateOpen && redelegateSelectedWallet) {
      targetWallet = displayTokens.find(t => t.address === redelegateSelectedWallet) || primaryWallet;
    }
    
    (async () => {
      try {
        const delegs = await fetchDelegations(targetWallet.address);
        if (!active) return;
        setUserDelegations(delegs);
        if (delegs.length > 0) {
          // Set default to first delegation
          if (unstakeOpen) setUnstakeValidator(delegs[0].validator);
          if (redelegateOpen) setRedelegateSrcValidator(delegs[0].validator);
        }
      } catch (e) {
        // noop
      }
    })();
    return () => { active = false };
  }, [unstakeOpen, redelegateOpen, primaryWallet, unstakeSelectedWallet, redelegateSelectedWallet, displayTokens]);

  const openUnstake = () => {
    if (!primaryWallet) return;
    setUnstakeAmount("");
    setUnstakeSelectedWallet(primaryWallet.address); // Default to primary wallet
    setUnstakeOpen(true);
  };

  const submitUnstake = async () => {
    const selectedWallet = displayTokens.find(t => t.address === unstakeSelectedWallet);
    if (!selectedWallet) return;
    
    const amount = parseFloat(unstakeAmount || "0");
    if (!unstakeValidator) {
      showToast("Select a validator", "error");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      showToast("Enter a valid amount", "error");
      return;
    }
    setUnstaking(true);
    try {
      const provider = (walletProvider as WalletProvider | undefined) || undefined;
      const res = await undelegateTokensClient(selectedWallet.address, amount.toString(), unstakeValidator, provider);
      if (res.success) {
        // Optimistically update local state: move staked -> unbonding
        setDisplayTokens(prev => prev.map(t => {
          if (t.address === selectedWallet.address) {
            const stakedNum = parseFloat(t.staked || "0");
            const unbondingNum = parseFloat(t.unbonding || "0");
            const amt = Math.min(amount, stakedNum);
            return {
              ...t,
              staked: (stakedNum - amt).toString(),
              unbonding: (unbondingNum + amt).toString(),
            };
          }
          return t;
        }));
        showToast("Unstake initiated (7 days unbonding)", "success");
        setUnstakeOpen(false);
      } else {
        showToast(res.error || "Unstake failed", "error");
      }
    } catch (e: any) {
      showToast(e?.message || "Unstake failed", "error");
    } finally {
      setUnstaking(false);
    }
  };

  const openRedelegate = () => {
    if (!primaryWallet) return;
    setRedelegateSelectedWallet(primaryWallet.address); // Default to primary wallet
    setRedelegateAmount("");
    setRedelegateOpen(true);
  };

  const submitRedelegate = async () => {
    const selectedWallet = displayTokens.find(t => t.address === redelegateSelectedWallet);
    if (!selectedWallet) return;
    
    const amount = parseFloat(redelegateAmount || "0");
    if (!redelegateSrcValidator || !redelegateDstValidator) {
      showToast("Select both validators", "error");
      return;
    }
    if (redelegateSrcValidator === redelegateDstValidator) {
      showToast("Source and destination validators must be different", "error");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      showToast("Enter a valid amount", "error");
      return;
    }
    setRedelegating(true);
    try {
      const provider = (walletProvider as WalletProvider | undefined) || undefined;
      const res = await redelegateTokensClient(selectedWallet.address, amount.toString(), redelegateSrcValidator, redelegateDstValidator, provider);
      if (res.success) {
        showToast("Redelegation successful! No unbonding period needed.", "success");
        setRedelegateOpen(false);
      } else {
        showToast(res.error || "Redelegate failed", "error");
      }
    } catch (e: any) {
      showToast(e?.message || "Redelegate failed", "error");
    } finally {
      setRedelegating(false);
    }
  };
  
  // Send handlers
  const handleSendCore = () => {
    setShowSendModal(true);
    setSendRecipient("");
    setSendAmount("");
    setSendMemo("");
    setSendError(null);
    setSendAmountMode("token"); // Default to token mode
  };
  
  const handleCloseSendModal = () => {
    setShowSendModal(false);
    setSendRecipient("");
    setSendAmount("");
    setSendMemo("");
    setSendError(null);
    setSending(false);
  };
  
  const handleMaxAmount = () => {
    const availableBalance = totals.available;
    
    if (sendAmountMode === "usd" && coreumPrice) {
      // Convert to USD
      const usdValue = availableBalance * coreumPrice;
      setSendAmount(usdValue.toFixed(2));
    } else {
      setSendAmount(availableBalance.toString());
    }
  };
  
  const toggleAmountMode = () => {
    const currentAmount = parseFloat(sendAmount);
    if (!isNaN(currentAmount) && currentAmount > 0 && coreumPrice) {
      // Convert the amount when toggling
      if (sendAmountMode === "token") {
        // Convert token to USD
        const usdValue = currentAmount * coreumPrice;
        setSendAmount(usdValue.toFixed(2));
      } else {
        // Convert USD to token
        const tokenAmount = currentAmount / coreumPrice;
        setSendAmount(tokenAmount.toString());
      }
    }
    
    setSendAmountMode(prev => prev === "token" ? "usd" : "token");
  };
  
  const handleSendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setSendError(null);
    
    // Validation
    if (!sendRecipient.trim()) {
      setSendError("Please enter a recipient address");
      return;
    }
    
    if (!isValidCoreumAddress(sendRecipient.trim())) {
      setSendError("Invalid Coreum address. Address must start with 'core1'");
      return;
    }
    
    if (!sendAmount || parseFloat(sendAmount) <= 0) {
      setSendError("Please enter a valid amount");
      return;
    }
    
    // Convert USD to token amount if in USD mode
    let tokenAmountToSend = sendAmount;
    if (sendAmountMode === "usd") {
      if (!coreumPrice || coreumPrice <= 0) {
        setSendError("Unable to determine CORE price. Please switch to token amount mode.");
        return;
      }
      
      const usdAmount = parseFloat(sendAmount);
      const tokenAmount = usdAmount / coreumPrice;
      tokenAmountToSend = tokenAmount.toString();
    }
    
    const amountNum = parseFloat(tokenAmountToSend);
    const balanceNum = totals.available;
    
    if (amountNum > balanceNum) {
      setSendError(`Insufficient balance. You have ${totals.available.toFixed(6)} CORE available`);
      return;
    }
    
    setSending(true);
    
    try {
      // Get the primary wallet address
      const fromAddress = primaryWallet?.address || "";
      
      if (!fromAddress) {
        setSendError("No wallet connected. Please connect your wallet first.");
        setSending(false);
        return;
      }
      
      const provider = walletProvider as "keplr" | "leap" | "cosmostation" | undefined;
      if (!provider) {
        setSendError("No wallet provider detected.");
        setSending(false);
        return;
      }
      
      // Get token info for CORE
      const tokenInfo = getTokenInfo("ucore");
      const decimals = tokenInfo.decimals || 6;
      
      console.log('[CoreumBreakdown] Sending CORE:', {
        fromAddress,
        toAddress: sendRecipient.trim(),
        amount: sendAmount,
        denom: "ucore",
        decimals,
      });
      
      const result = await sendTokens({
        fromAddress,
        toAddress: sendRecipient.trim(),
        amount: tokenAmountToSend,
        denom: "ucore",
        decimals,
        memo: sendMemo.trim(),
        explicitProvider: provider
      });
      
      if (result.success) {
        showToast(`✅ Successfully sent ${sendAmount} CORE!`, 'success');
        if (result.txHash) {
          console.log('[CoreumBreakdown] Transaction hash:', result.txHash);
          showToast(`Transaction: ${result.txHash.substring(0, 10)}...`, 'success');
        }
        handleCloseSendModal();
        
        // Trigger a page reload after a short delay to refresh balances
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setSendError(result.error || "Failed to send tokens");
        showToast(`❌ ${result.error || "Failed to send tokens"}`, 'error');
      }
    } catch (error: any) {
      console.error('[CoreumBreakdown] Send error:', error);
      const errorMsg = error?.message || String(error);
      setSendError(errorMsg);
      showToast(`❌ ${errorMsg}`, 'error');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 relative z-10 ring-1 ring-white/5 dark:ring-white/10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <img 
            src="/tokens/CoreumLogo (4).svg" 
            alt="Coreum Logo" 
            className="h-12 w-auto"
          />
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white leading-none" style={{ fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '0.05em' }}>
            Balance
          </h2>
        </div>
        <div className="flex items-center gap-3">
          {coreumPrice !== undefined ? (
            <>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                <AnimatedCurrency value={coreumPrice} decimals={4} symbol="$" />
              </span>
              {coreumChange24h !== undefined && (
                <span className={`text-base font-semibold ${coreumChange24h >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  <AnimatedPercentage value={coreumChange24h} decimals={2} showPlusSign={true} />
                </span>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2">
              <div className="animate-pulse h-8 w-24 bg-gray-300 dark:bg-gray-600 rounded"></div>
              <div className="animate-pulse h-6 w-16 bg-gray-300 dark:bg-gray-600 rounded"></div>
            </div>
          )}
        </div>
      </div>


      {/* Action Row aligned with summary cards: Buy above Available, Stake/Redelegate above Staked, Claim above Rewards, Unstake above Unbonding */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
        {/* Buy & Swap above Available (col 1) */}
        <div className="col-start-1 flex flex-row gap-2">
          <a
            href="/swap"
            className="relative flex-1 flex items-center justify-center gap-1 px-3 py-3.5 border-2 border-blue-500 hover:border-blue-400 bg-gradient-to-br from-blue-500/25 via-blue-600/15 to-blue-700/10 hover:from-blue-500/35 hover:via-blue-600/25 hover:to-blue-700/15 text-blue-700 dark:text-blue-200 rounded-xl backdrop-blur-sm transition-all duration-300 text-sm font-extrabold shadow-lg hover:shadow-[0_10px_30px_rgba(77,156,255,0.5),0_5px_10px_rgba(0,0,0,0.4),inset_0_2px_4px_rgba(255,255,255,0.25),inset_0_-4px_15px_rgba(0,0,0,0.3)] hover:scale-[1.08] hover:-translate-y-1.5 active:scale-100 active:translate-y-0 overflow-hidden"
            style={{
              boxShadow: '0 4px 12px rgba(77, 156, 255, 0.35), 0 2px 4px rgba(0, 0, 0, 0.25), inset 0 1px 3px rgba(255, 255, 255, 0.2), inset 0 -2px 8px rgba(0, 0, 0, 0.15)',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
            }}
          >
            <span className="relative z-10">Buy</span>
            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-blue-400/10 to-blue-300/20 opacity-0 hover:opacity-100 transition-opacity duration-300" />
          </a>
          <a
            href="/swap"
            className="relative flex-1 flex items-center justify-center gap-1 px-3 py-3.5 border-2 border-blue-400 hover:border-blue-300 bg-gradient-to-br from-blue-400/25 via-blue-500/15 to-blue-600/10 hover:from-blue-400/35 hover:via-blue-500/25 hover:to-blue-600/15 text-blue-600 dark:text-blue-200 rounded-xl backdrop-blur-sm transition-all duration-300 text-sm font-extrabold shadow-lg hover:shadow-[0_10px_30px_rgba(77,156,255,0.5),0_5px_10px_rgba(0,0,0,0.4),inset_0_2px_4px_rgba(255,255,255,0.25),inset_0_-4px_15px_rgba(0,0,0,0.3)] hover:scale-[1.08] hover:-translate-y-1.5 active:scale-100 active:translate-y-0 overflow-hidden"
            style={{
              boxShadow: '0 4px 12px rgba(77, 156, 255, 0.3), 0 2px 4px rgba(0, 0, 0, 0.25), inset 0 1px 3px rgba(255, 255, 255, 0.2), inset 0 -2px 8px rgba(0, 0, 0, 0.15)',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
            }}
          >
            <span className="relative z-10">Swap</span>
            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-blue-400/10 to-blue-300/20 opacity-0 hover:opacity-100 transition-opacity duration-300" />
          </a>
        </div>
        {/* Stake & Redelegate above Staked (col 2) */}
        <div className="col-start-2 md:col-start-2 flex flex-row gap-2">
          {canStake && (
            <button
              onClick={openStake}
              className="relative flex-1 flex items-center justify-center gap-1 px-3 py-3.5 border-2 border-purple-500 hover:border-purple-400 bg-gradient-to-br from-purple-500/25 via-purple-600/15 to-purple-700/10 hover:from-purple-500/35 hover:via-purple-600/25 hover:to-purple-700/15 text-purple-700 dark:text-purple-200 rounded-xl backdrop-blur-sm transition-all duration-300 text-sm font-extrabold shadow-lg hover:shadow-[0_10px_30px_rgba(168,85,247,0.5),0_5px_10px_rgba(0,0,0,0.4),inset_0_2px_4px_rgba(255,255,255,0.25),inset_0_-4px_15px_rgba(0,0,0,0.3)] hover:scale-[1.08] hover:-translate-y-1.5 active:scale-100 active:translate-y-0 overflow-hidden"
              style={{
                boxShadow: '0 4px 12px rgba(168, 85, 247, 0.35), 0 2px 4px rgba(0, 0, 0, 0.25), inset 0 1px 3px rgba(255, 255, 255, 0.2), inset 0 -2px 8px rgba(0, 0, 0, 0.15)',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
              }}
            >
              <span className="relative z-10">Stake</span>
              <div className="absolute inset-0 bg-gradient-to-t from-transparent via-purple-400/10 to-purple-300/20 opacity-0 hover:opacity-100 transition-opacity duration-300" />
            </button>
          )}
          {canRedelegate && (
            <button
              onClick={openRedelegate}
              className="relative flex-1 flex items-center justify-center gap-1 px-3 py-3.5 border-2 border-purple-400 hover:border-purple-300 bg-gradient-to-br from-purple-400/25 via-purple-500/15 to-purple-600/10 hover:from-purple-400/35 hover:via-purple-500/25 hover:to-purple-600/15 text-purple-600 dark:text-purple-200 rounded-xl backdrop-blur-sm transition-all duration-300 text-sm font-extrabold shadow-lg hover:shadow-[0_10px_30px_rgba(168,85,247,0.5),0_5px_10px_rgba(0,0,0,0.4),inset_0_2px_4px_rgba(255,255,255,0.25),inset_0_-4px_15px_rgba(0,0,0,0.3)] hover:scale-[1.08] hover:-translate-y-1.5 active:scale-100 active:translate-y-0 overflow-hidden"
              style={{
                boxShadow: '0 4px 12px rgba(168, 85, 247, 0.3), 0 2px 4px rgba(0, 0, 0, 0.25), inset 0 1px 3px rgba(255, 255, 255, 0.2), inset 0 -2px 8px rgba(0, 0, 0, 0.15)',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
              }}
            >
              <span className="relative z-10">Redelegate</span>
              <div className="absolute inset-0 bg-gradient-to-t from-transparent via-purple-400/10 to-purple-300/20 opacity-0 hover:opacity-100 transition-opacity duration-300" />
            </button>
          )}
        </div>
        {/* Claim & Restake above Rewards (col 3 on md+, fallback to col 2 on small) */}
        <div className="col-start-2 md:col-start-3 flex flex-row gap-2">
          {canClaim && (
            <>
              <button
                onClick={openClaimRewards}
                disabled={!!claiming}
                className="relative flex-1 flex items-center justify-center gap-1 px-3 py-3.5 border-2 border-green-500 hover:border-green-400 bg-gradient-to-br from-green-500/25 via-green-600/15 to-green-700/10 hover:from-green-500/35 hover:via-green-600/25 hover:to-green-700/15 text-green-700 dark:text-green-200 rounded-xl backdrop-blur-sm transition-all duration-300 text-sm font-extrabold shadow-lg hover:shadow-[0_10px_30px_rgba(37,214,149,0.5),0_5px_10px_rgba(0,0,0,0.4),inset_0_2px_4px_rgba(255,255,255,0.25),inset_0_-4px_15px_rgba(0,0,0,0.3)] hover:scale-[1.08] hover:-translate-y-1.5 active:scale-100 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:translate-y-0 overflow-hidden"
                style={{
                  boxShadow: '0 4px 12px rgba(37, 214, 149, 0.35), 0 2px 4px rgba(0, 0, 0, 0.25), inset 0 1px 3px rgba(255, 255, 255, 0.2), inset 0 -2px 8px rgba(0, 0, 0, 0.15)',
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
                }}
              >
                <span className="relative z-10">{claiming ? 'Claiming...' : 'Claim'}</span>
                <div className="absolute inset-0 bg-gradient-to-t from-transparent via-green-400/10 to-green-300/20 opacity-0 hover:opacity-100 transition-opacity duration-300" />
              </button>
              <button
                onClick={() => {
                  setClaimMode("compound");
                  openClaimRewards();
                }}
                disabled={!!claiming}
                className="relative flex-1 flex items-center justify-center gap-1 px-3 py-3.5 border-2 border-green-400 hover:border-green-300 bg-gradient-to-br from-green-400/25 via-green-500/15 to-green-600/10 hover:from-green-400/35 hover:via-green-500/25 hover:to-green-600/15 text-green-600 dark:text-green-200 rounded-xl backdrop-blur-sm transition-all duration-300 text-sm font-extrabold shadow-lg hover:shadow-[0_10px_30px_rgba(37,214,149,0.5),0_5px_10px_rgba(0,0,0,0.4),inset_0_2px_4px_rgba(255,255,255,0.25),inset_0_-4px_15px_rgba(0,0,0,0.3)] hover:scale-[1.08] hover:-translate-y-1.5 active:scale-100 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:translate-y-0 overflow-hidden"
                style={{
                  boxShadow: '0 4px 12px rgba(37, 214, 149, 0.3), 0 2px 4px rgba(0, 0, 0, 0.25), inset 0 1px 3px rgba(255, 255, 255, 0.2), inset 0 -2px 8px rgba(0, 0, 0, 0.15)',
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
                }}
              >
                <span className="relative z-10">Restake</span>
                <div className="absolute inset-0 bg-gradient-to-t from-transparent via-green-400/10 to-green-300/20 opacity-0 hover:opacity-100 transition-opacity duration-300" />
              </button>
            </>
          )}
        </div>
        {/* Unstake & Send above Unbonding (col 4) */}
        <div className="col-start-1 md:col-start-4 flex flex-row gap-2">
          {canUnstake && (
            <button
              onClick={openUnstake}
              className="relative flex-1 flex items-center justify-center gap-1 px-3 py-3.5 border-2 border-orange-500 hover:border-orange-400 bg-gradient-to-br from-orange-500/25 via-orange-600/15 to-orange-700/10 hover:from-orange-500/35 hover:via-orange-600/25 hover:to-orange-700/15 text-orange-700 dark:text-orange-200 rounded-xl backdrop-blur-sm transition-all duration-300 text-sm font-extrabold shadow-lg hover:shadow-[0_10px_30px_rgba(255,140,66,0.5),0_5px_10px_rgba(0,0,0,0.4),inset_0_2px_4px_rgba(255,255,255,0.25),inset_0_-4px_15px_rgba(0,0,0,0.3)] hover:scale-[1.08] hover:-translate-y-1.5 active:scale-100 active:translate-y-0 overflow-hidden"
              style={{
                boxShadow: '0 4px 12px rgba(255, 140, 66, 0.35), 0 2px 4px rgba(0, 0, 0, 0.25), inset 0 1px 3px rgba(255, 255, 255, 0.2), inset 0 -2px 8px rgba(0, 0, 0, 0.15)',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
              }}
            >
              <span className="relative z-10">Unstake</span>
              <div className="absolute inset-0 bg-gradient-to-t from-transparent via-orange-400/10 to-orange-300/20 opacity-0 hover:opacity-100 transition-opacity duration-300" />
            </button>
          )}
          <button
            onClick={handleSendCore}
            className="relative flex-1 flex items-center justify-center gap-1 px-3 py-3.5 border-2 border-orange-400 hover:border-orange-300 bg-gradient-to-br from-orange-400/25 via-orange-500/15 to-orange-600/10 hover:from-orange-400/35 hover:via-orange-500/25 hover:to-orange-600/15 text-orange-600 dark:text-orange-200 rounded-xl backdrop-blur-sm transition-all duration-300 text-sm font-extrabold shadow-lg hover:shadow-[0_10px_30px_rgba(255,140,66,0.5),0_5px_10px_rgba(0,0,0,0.4),inset_0_2px_4px_rgba(255,255,255,0.25),inset_0_-4px_15px_rgba(0,0,0,0.3)] hover:scale-[1.08] hover:-translate-y-1.5 active:scale-100 active:translate-y-0 overflow-hidden"
            style={{
              boxShadow: '0 4px 12px rgba(255, 140, 66, 0.3), 0 2px 4px rgba(0, 0, 0, 0.25), inset 0 1px 3px rgba(255, 255, 255, 0.2), inset 0 -2px 8px rgba(0, 0, 0, 0.15)',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
            }}
          >
            <span className="relative z-10">Send</span>
            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-orange-400/10 to-orange-300/20 opacity-0 hover:opacity-100 transition-opacity duration-300" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Available */}
        <div className="relative group/tooltip">
          {/* Blue Gradient Background on Hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/30 via-blue-500/20 to-blue-600/30 rounded-2xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-500 blur-xl -z-10" />
          <Card className="group p-6 sm:p-7 transition-all duration-300 bg-gradient-to-br from-blue-500/5 to-blue-600/10 dark:from-blue-500/10 dark:to-blue-600/5 backdrop-blur border-2 border-blue-200/40 dark:border-blue-500/30 hover:border-blue-400 dark:hover:border-blue-400 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4),0_0_0_1px_rgba(77,156,255,0.3),0_0_40px_rgba(77,156,255,0.4),inset_0_0_30px_rgba(77,156,255,0.05)] hover:-translate-y-0.5 hover:scale-[1.01] cursor-pointer">
            <div className="flex items-center gap-3 mb-4">
              <div className="neo-icon-glow-blue neo-transition">
                <IoCash className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
              <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                Available
              </p>
            </div>
            <p className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white break-words">
              {formatAmount(totals.available)}
            </p>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 mt-2 font-semibold">COREUM</p>
          </Card>
          {/* Hover Tooltip */}
          <div className="absolute top-full left-0 right-0 mt-2 px-4 py-3 bg-gradient-to-br from-blue-500/5 to-blue-600/10 dark:from-blue-500/10 dark:to-blue-600/5 backdrop-blur border-2 border-blue-200/40 dark:border-blue-500/30 text-gray-900 dark:text-white text-sm rounded-2xl opacity-0 group-hover/tooltip:opacity-100 transition-all duration-300 pointer-events-none z-50 shadow-xl text-center">
            Available: {formatFullAmount(totals.available)} COREUM
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 -mb-1 border-4 border-transparent border-b-blue-200/40 dark:border-b-blue-500/30"></div>
          </div>
        </div>

        {/* Staked */}
        <div className="relative group/tooltip">
          {/* Purple Gradient Background on Hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-400/30 via-purple-500/20 to-purple-600/30 rounded-2xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-500 blur-xl -z-10" />
          <Card className="group p-6 sm:p-7 transition-all duration-300 bg-gradient-to-br from-purple-500/5 to-purple-600/10 dark:from-purple-500/10 dark:to-purple-600/5 backdrop-blur border-2 border-purple-200/40 dark:border-purple-500/30 hover:border-purple-400 dark:hover:border-purple-400 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4),0_0_0_1px_rgba(168,85,247,0.3),0_0_40px_rgba(168,85,247,0.4),inset_0_0_30px_rgba(168,85,247,0.05)] hover:-translate-y-0.5 hover:scale-[1.01] cursor-pointer">
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
                style={{
                  boxShadow: '0 4px 20px rgba(168,85,247,0.4), 0 2px 8px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -4px 12px rgba(0,0,0,0.4)',
                  transformStyle: 'preserve-3d'
                }}
              >
                <IoTrendingUp className="w-7 h-7 sm:w-8 sm:h-8 text-white drop-shadow-lg" />
              </div>
              <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                Staked
              </p>
            </div>
            <p className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white break-words">
              {formatAmount(totals.staked)}
            </p>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 mt-2 font-semibold">COREUM</p>
          </Card>
          {/* Hover Tooltip */}
          <div className="absolute top-full left-0 right-0 mt-2 px-4 py-3 bg-gradient-to-br from-purple-500/5 to-purple-600/10 dark:from-purple-500/10 dark:to-purple-600/5 backdrop-blur border-2 border-purple-200/40 dark:border-purple-500/30 text-gray-900 dark:text-white text-sm rounded-2xl opacity-0 group-hover/tooltip:opacity-100 transition-all duration-300 pointer-events-none z-50 shadow-xl text-center">
            Staked: {formatFullAmount(totals.staked)} COREUM
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 -mb-1 border-4 border-transparent border-b-purple-200/40 dark:border-b-purple-500/30"></div>
          </div>
        </div>

        {/* Rewards */}
        <div className="relative group/tooltip">
          {/* Green Gradient Background on Hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-400/30 via-green-500/20 to-green-600/30 rounded-2xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-500 blur-xl -z-10" />
          <Card className="group p-6 sm:p-7 transition-all duration-300 bg-gradient-to-br from-green-500/5 to-green-600/10 dark:from-green-500/10 dark:to-green-600/5 backdrop-blur border-2 border-green-200/40 dark:border-green-500/30 hover:border-green-400 dark:hover:border-green-400 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4),0_0_0_1px_rgba(37,214,149,0.3),0_0_40px_rgba(37,214,149,0.4),inset_0_0_30px_rgba(37,214,149,0.05)] hover:-translate-y-0.5 hover:scale-[1.01] cursor-pointer">
            <div className="flex items-center gap-3 mb-4">
              <div className="neo-icon-glow-green neo-transition">
                <IoGift className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
              <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                Rewards
              </p>
            </div>
            <p className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white break-words">
              {formatAmount(totals.rewards)}
            </p>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 mt-2 font-semibold">COREUM</p>
          </Card>
          {/* Hover Tooltip */}
          <div className="absolute top-full left-0 right-0 mt-2 px-4 py-3 bg-gradient-to-br from-green-500/5 to-green-600/10 dark:from-green-500/10 dark:to-green-600/5 backdrop-blur border-2 border-green-200/40 dark:border-green-500/30 text-gray-900 dark:text-white text-sm rounded-2xl opacity-0 group-hover/tooltip:opacity-100 transition-all duration-300 pointer-events-none z-50 shadow-xl text-center">
            Rewards: {formatFullAmount(totals.rewards)} COREUM
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 -mb-1 border-4 border-transparent border-b-green-200/40 dark:border-b-green-500/30"></div>
          </div>
        </div>

        {/* Unbonding */}
        <div className="relative group/tooltip">
          {/* Orange Gradient Background on Hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-400/30 via-orange-500/20 to-orange-600/30 rounded-2xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-500 blur-xl -z-10" />
          <Card className="group p-6 sm:p-7 transition-all duration-300 bg-gradient-to-br from-orange-500/5 to-orange-600/10 dark:from-orange-500/10 dark:to-orange-600/5 backdrop-blur border-2 border-orange-200/40 dark:border-orange-500/30 hover:border-orange-400 dark:hover:border-orange-400 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,140,66,0.3),0_0_40px_rgba(255,140,66,0.4),inset_0_0_30px_rgba(255,140,66,0.05)] hover:-translate-y-0.5 hover:scale-[1.01] cursor-pointer">
            <div className="flex items-center gap-3 mb-4">
              <div className="neo-icon-glow-orange neo-transition">
                <IoTime className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
              <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                Unbonding
              </p>
            </div>
            <p className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white break-words">
              {formatAmount(totals.unbonding)}
            </p>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 mt-2 font-semibold">COREUM</p>
          </Card>
          {/* Hover Tooltip */}
          <div className="absolute top-full left-0 right-0 mt-2 px-4 py-3 bg-gradient-to-br from-orange-500/5 to-orange-600/10 dark:from-orange-500/10 dark:to-orange-600/5 backdrop-blur border-2 border-orange-200/40 dark:border-orange-500/30 text-gray-900 dark:text-white text-sm rounded-2xl opacity-0 group-hover/tooltip:opacity-100 transition-all duration-300 pointer-events-none z-50 shadow-xl text-center">
            Unbonding: {formatFullAmount(totals.unbonding)} COREUM
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 -mb-1 border-4 border-transparent border-b-orange-200/40 dark:border-b-orange-500/30"></div>
          </div>
        </div>
      </div>

      {/* Per-Wallet Breakdown (if multiple wallets) */}
      {hasMultipleWallets && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div 
            className="flex items-center justify-end gap-2 cursor-pointer group p-2 -mx-2 rounded-lg transition-colors"
            onClick={() => setShowBreakdown(!showBreakdown)}
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Per Wallet Breakdown
            </h3>
            <ThreeArrowSpinner 
              size="sm" 
              variant="warning"
              className="w-6 h-6"
            />
          </div>
          
          <div 
            className={`relative space-y-3 transition-all duration-300 overflow-hidden ${
              showBreakdown ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
            }`}
            onClick={() => setShowBreakdown(false)}
          >
            
            {displayTokens.map((token, index) => (
              <div
                key={index}
                className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl cursor-pointer"
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {token.label}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                      {formatAddressSnippet(token.address, 4)}
                    </span>
                    <button
                      onClick={() => handleIoCopyAddress(token.address, token.label)}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                      title={`IoCopy ${token.label} address`}
                    >
                      <IoCopy className="w-3 h-3 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Available</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {formatAmount(parseFloat(token.available || "0"))}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Staked</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {formatAmount(parseFloat(token.staked || "0"))}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Rewards</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {formatAmount(parseFloat(token.rewards || "0"))}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Unbonding</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {formatAmount(parseFloat(token.unbonding || "0"))}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stake Modal */}
      {stakeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !staking && setStakeOpen(false)}></div>
          <div className="relative z-10 w-full max-w-4xl rounded-2xl bg-white dark:bg-gray-900 shadow-2xl ring-2 ring-blue-500/20 border border-blue-200/30 dark:border-blue-400/10 p-6 sm:p-8 md:p-10 transition-transform duration-300 max-h-[90vh] overflow-y-auto">
            <div className="rounded-xl mb-6 p-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white">
              <h3 className="text-2xl sm:text-3xl font-semibold mb-2">Power Up the Network! 🚀</h3>
              <p className="text-base sm:text-lg opacity-90">Help preserve decentralization by staking with validators that keep the truth alive. Earn rewards while boosting network security!</p>
            </div>
            
            <div className="space-y-6">
              {/* Wallet Selector */}
              {hasMultipleWallets && (
                <div>
                  <label className="block text-base sm:text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">Select Wallet</label>
                  <select
                    value={stakeSelectedWallet}
                    onChange={(e) => setStakeSelectedWallet(e.target.value)}
                    className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-4 py-3 text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    {displayTokens.map(token => (
                      <option key={token.address} value={token.address}>
                        {token.label} ({formatAddressSnippet(token.address, 4)}) - {formatAmount(parseFloat(token.available || "0"))} CORE available
                      </option>
                    ))}
                  </select>
                  <div className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
                    Switching wallet will prompt Keplr to connect to the selected wallet
                  </div>
                </div>
              )}

              <div>
                <label className="block text-base sm:text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">Amount</label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-4 py-3 text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
                <div className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
                  Available: {formatAmount(parseFloat(displayTokens.find(t => t.address === stakeSelectedWallet)?.available || "0"))} CORE
                </div>
              </div>

              <div>
                <label className="block text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white mb-4">
                  Select Validator
                </label>
                
                {/* Search Bar */}
                <div className="relative mb-6">
                  <input
                    type="text"
                    value={validatorSearch}
                    onChange={(e) => setValidatorSearch(e.target.value)}
                    placeholder="Search validator..."
                    className="w-full rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-5 py-4 pl-12 text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>

                <div className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-4">
                  Popular Validators
                </div>

                {/* Validators List */}
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {(() => {
                    const allValidators = showAllValidators 
                      ? validators 
                      : validators.filter(v => (v.description?.moniker || "").toLowerCase().includes("roll"));
                    
                    const searchFiltered = validatorSearch
                      ? allValidators.filter(v => 
                          (v.description?.moniker || "").toLowerCase().includes(validatorSearch.toLowerCase()) ||
                          v.operator_address.toLowerCase().includes(validatorSearch.toLowerCase())
                        )
                      : allValidators;
                    
                    const totalVotingPower = validators.reduce((sum, v) => sum + parseFloat(v.tokens || "0"), 0);
                    
                    return searchFiltered
                      .sort((a, b) => {
                        const aIsRoll = (a.description?.moniker || "").toLowerCase().includes("roll");
                        const bIsRoll = (b.description?.moniker || "").toLowerCase().includes("roll");
                        if (aIsRoll && !bIsRoll) return -1;
                        if (!aIsRoll && bIsRoll) return 1;
                        const aTokens = parseFloat(a.tokens || "0");
                        const bTokens = parseFloat(b.tokens || "0");
                        return aTokens - bTokens;
                      })
                      .map(v => {
                        const isRoll = (v.description?.moniker || "").toLowerCase().includes("roll");
                        const validatorTokens = parseFloat(v.tokens || "0");
                        const votingPowerPercent = totalVotingPower > 0 ? (validatorTokens / totalVotingPower * 100) : 0;
                        const isSelected = v.operator_address === selectedValidator;
                        const avatarUrl = getValidatorAvatar(v);
                        
                        return (
                          <div
                            key={v.operator_address}
                            onClick={() => setSelectedValidator(v.operator_address)}
                            className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all ${
                              isSelected 
                                ? 'bg-purple-100 dark:bg-purple-900/30 ring-2 ring-purple-500' 
                                : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750'
                            }`}
                          >
                            {/* Avatar */}
                            <div className="relative flex-shrink-0">
                              <img
                                src={avatarUrl}
                                alt={v.description?.moniker || "Validator"}
                                className="w-14 h-14 rounded-full ring-2 ring-gray-200 dark:ring-gray-700"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(v.description?.moniker || "V")}&size=128&background=6366f1&color=fff&bold=true`;
                                }}
                              />
                              {isRoll && (
                                <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-xs">
                                  ⭐
                                </div>
                              )}
                            </div>
                            
                            {/* Validator Info */}
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-lg sm:text-xl text-gray-900 dark:text-white truncate">
                                {v.description?.moniker || v.operator_address.slice(0, 20)}
                              </div>
                              <div className="text-base sm:text-lg text-orange-600 dark:text-orange-400 font-medium">
                                {votingPowerPercent.toFixed(2)}% voting power
                              </div>
                            </div>
                            
                            {/* Selection Indicator */}
                            {isSelected && (
                              <div className="flex-shrink-0">
                                <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      });
                  })()}
                </div>
                
                {!showAllValidators && validators.some(v => !(v.description?.moniker || "").toLowerCase().includes("roll")) && (
                  <button
                    type="button"
                    onClick={() => setShowAdvancedConfirm(true)}
                    className="mt-4 w-full text-base sm:text-lg text-purple-600 dark:text-purple-400 underline underline-offset-2 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
                  >
                    🔓 Show All Validators (Help Decentralize!)
                  </button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  disabled={staking}
                  onClick={() => setStakeOpen(false)}
                  className="w-full sm:w-auto px-6 py-3 text-base sm:text-lg rounded-lg border-2 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submitStake}
                  disabled={staking}
                  className="w-full sm:w-auto px-6 py-3 text-base sm:text-lg rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white disabled:opacity-60 font-medium"
                >
                  {staking ? 'Staking…' : '🚀 Stake & Power Up!'}
                </button>
              </div>
            </div>

            {showAdvancedConfirm && (
              <div className="absolute inset-0 z-20 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/20 rounded-2xl"></div>
                <div className="relative z-10 w-full max-w-lg rounded-xl bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-lg p-6">
                  <h4 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3">Power Up Decentralization! 💪</h4>
                  <p className="text-base sm:text-lg text-gray-700 dark:text-gray-300 mb-4">
                    This will show all validators. We <span className="font-bold text-purple-600 dark:text-purple-400">highly recommend Roll</span> because all proceeds go back into building this infrastructure for the community (no grant dependency!).
                  </p>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                    💡 But hey - if you want to help smaller validators gain voting power and keep the network truly decentralized, that's awesome too!
                  </p>
                  <div className="mt-6 flex flex-col sm:flex-row items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowAdvancedConfirm(false)}
                      className="w-full sm:w-auto px-5 py-2.5 text-base rounded-lg border-2 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowAllValidators(true); setShowAdvancedConfirm(false); }}
                      className="w-full sm:w-auto px-5 py-2.5 text-base rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium"
                    >
                      Show All
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Unstake Modal */}
      {unstakeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !unstaking && setUnstakeOpen(false)}></div>
          <div className="relative z-10 w-full max-w-3xl rounded-2xl bg-white dark:bg-gray-900 shadow-2xl ring-2 ring-purple-500/20 border border-purple-200/30 dark:border-purple-400/10 p-6 sm:p-8 md:p-10 transition-transform duration-300 max-h-[90vh] overflow-y-auto">
            <div className="rounded-xl mb-6 p-6 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white">
              <h3 className="text-2xl sm:text-3xl font-semibold mb-2">Unstake COREUM</h3>
              <p className="text-base sm:text-lg opacity-90">Unstaking initiates a 7-day unbonding period. Consider redelegating instead for instant switching!</p>
            </div>
            
            <div className="space-y-6">
              {/* Wallet Selector */}
              {hasMultipleWallets && (
                <div>
                  <label className="block text-base sm:text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">Select Wallet</label>
                  <select
                    value={unstakeSelectedWallet}
                    onChange={(e) => setUnstakeSelectedWallet(e.target.value)}
                    className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-4 py-3 text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    {displayTokens.map(token => (
                      <option key={token.address} value={token.address}>
                        {token.label} ({formatAddressSnippet(token.address, 4)}) - {formatAmount(parseFloat(token.staked || "0"))} CORE staked
                      </option>
                    ))}
                  </select>
                  <div className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
                    Switching wallet will prompt Keplr to connect to the selected wallet
                  </div>
                </div>
              )}

              <div>
                <label className="block text-base sm:text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">Amount</label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={unstakeAmount}
                  onChange={(e) => setUnstakeAmount(e.target.value)}
                  className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-4 py-3 text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="0.00"
                />
                <div className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
                  Staked: {formatAmount(parseFloat(displayTokens.find(t => t.address === unstakeSelectedWallet)?.staked || "0"))} CORE
                </div>
              </div>

              <div>
                <label className="block text-base sm:text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">Select Validator to Unstake From</label>
                <select
                  value={unstakeValidator}
                  onChange={(e) => setUnstakeValidator(e.target.value)}
                  className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-4 py-3 text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  {userDelegations.map(d => {
                    const validator = validators.find(v => v.operator_address === d.validator);
                    const amount = parseFloat(d.amount) / 1e6;
                    const validatorName = validator?.description?.moniker || "Unknown Validator";
                    return (
                      <option key={d.validator} value={d.validator}>
                        {validatorName} - {amount.toLocaleString('en-US', { maximumFractionDigits: 2 })} CORE
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  disabled={unstaking}
                  onClick={() => setUnstakeOpen(false)}
                  className="w-full sm:w-auto px-6 py-3 text-base sm:text-lg rounded-lg border-2 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submitUnstake}
                  disabled={unstaking}
                  className="w-full sm:w-auto px-6 py-3 text-base sm:text-lg rounded-lg bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-60 font-medium"
                >
                  {unstaking ? 'Unstaking…' : 'Confirm Unstake'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Redelegate Modal */}
      {redelegateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !redelegating && setRedelegateOpen(false)}></div>
          <div className="relative z-10 w-full max-w-4xl rounded-2xl bg-white dark:bg-gray-900 shadow-2xl ring-2 ring-orange-500/20 border border-orange-200/30 dark:border-orange-400/10 p-6 sm:p-8 md:p-10 transition-transform duration-300 max-h-[90vh] overflow-y-auto">
            <div className="rounded-xl mb-6 p-6 bg-gradient-to-r from-orange-600 via-red-600 to-orange-600 text-white">
              <h3 className="text-2xl sm:text-3xl font-semibold mb-2">Switch Validators Instantly! ⚡</h3>
              <p className="text-base sm:text-lg opacity-90">
                Help increase decentralization! Switch to Roll or power up validators with lower voting power - no unbonding period needed!
              </p>
            </div>
            
            <div className="space-y-6">
              {/* Wallet Selector */}
              {hasMultipleWallets && (
                <div>
                  <label className="block text-base sm:text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">Select Wallet</label>
                  <select
                    value={redelegateSelectedWallet}
                    onChange={(e) => setRedelegateSelectedWallet(e.target.value)}
                    className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-4 py-3 text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    {displayTokens.map(token => (
                      <option key={token.address} value={token.address}>
                        {token.label} ({formatAddressSnippet(token.address, 4)}) - {formatAmount(parseFloat(token.staked || "0"))} CORE staked
                      </option>
                    ))}
                  </select>
                  <div className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
                    Switching wallet will prompt Keplr to connect to the selected wallet
                  </div>
                </div>
              )}

              <div>
                <label className="block text-base sm:text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">Amount</label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={redelegateAmount}
                  onChange={(e) => setRedelegateAmount(e.target.value)}
                  className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-4 py-3 text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-base sm:text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">From Validator</label>
                <select
                  value={redelegateSrcValidator}
                  onChange={(e) => setRedelegateSrcValidator(e.target.value)}
                  className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-4 py-3 text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  {userDelegations.map(d => {
                    const validator = validators.find(v => v.operator_address === d.validator);
                    const amount = parseFloat(d.amount) / 1e6;
                    const validatorName = validator?.description?.moniker || "Unknown Validator";
                    return (
                      <option key={d.validator} value={d.validator}>
                        {validatorName} - {amount.toLocaleString('en-US', { maximumFractionDigits: 2 })} CORE
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white mb-4">
                  Select Validator (Power Them Up! 💪)
                </label>
                
                {/* Search Bar */}
                <div className="relative mb-6">
                  <input
                    type="text"
                    value={validatorSearch}
                    onChange={(e) => setValidatorSearch(e.target.value)}
                    placeholder="Search validator..."
                    className="w-full rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-5 py-4 pl-12 text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>

                <div className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-4">
                  🎯 Help preserve decentralization - choose Roll or validators with lower voting power!
                </div>

                {/* Validators List */}
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {(() => {
                    const availableValidators = validators.filter(v => v.operator_address !== redelegateSrcValidator);
                    const searchFiltered = validatorSearch
                      ? availableValidators.filter(v => 
                          (v.description?.moniker || "").toLowerCase().includes(validatorSearch.toLowerCase()) ||
                          v.operator_address.toLowerCase().includes(validatorSearch.toLowerCase())
                        )
                      : availableValidators;
                    
                    const totalVotingPower = validators.reduce((sum, v) => sum + parseFloat(v.tokens || "0"), 0);
                    
                    return searchFiltered
                      .sort((a, b) => {
                        const aIsRoll = (a.description?.moniker || "").toLowerCase().includes("roll");
                        const bIsRoll = (b.description?.moniker || "").toLowerCase().includes("roll");
                        if (aIsRoll && !bIsRoll) return -1;
                        if (!aIsRoll && bIsRoll) return 1;
                        const aTokens = parseFloat(a.tokens || "0");
                        const bTokens = parseFloat(b.tokens || "0");
                        return aTokens - bTokens;
                      })
                      .slice(0, 20) // Show top 20
                      .map(v => {
                        const isRoll = (v.description?.moniker || "").toLowerCase().includes("roll");
                        const validatorTokens = parseFloat(v.tokens || "0");
                        const votingPowerPercent = totalVotingPower > 0 ? (validatorTokens / totalVotingPower * 100) : 0;
                        const isSelected = v.operator_address === redelegateDstValidator;
                        const avatarUrl = getValidatorAvatar(v);
                        
                        return (
                          <div
                            key={v.operator_address}
                            onClick={() => setRedelegateDstValidator(v.operator_address)}
                            className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all ${
                              isSelected 
                                ? 'bg-orange-100 dark:bg-orange-900/30 ring-2 ring-orange-500' 
                                : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750'
                            }`}
                          >
                            {/* Avatar */}
                            <div className="relative flex-shrink-0">
                              <img
                                src={avatarUrl}
                                alt={v.description?.moniker || "Validator"}
                                className="w-14 h-14 rounded-full ring-2 ring-gray-200 dark:ring-gray-700"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(v.description?.moniker || "V")}&size=128&background=ea580c&color=fff&bold=true`;
                                }}
                              />
                              {isRoll && (
                                <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-xs">
                                  ⭐
                                </div>
                              )}
                            </div>
                            
                            {/* Validator Info */}
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-lg sm:text-xl text-gray-900 dark:text-white truncate">
                                {v.description?.moniker || v.operator_address.slice(0, 20)}
                              </div>
                              <div className="text-base sm:text-lg text-orange-600 dark:text-orange-400 font-medium">
                                {votingPowerPercent.toFixed(2)}% voting power
                              </div>
                              {!isRoll && votingPowerPercent < 5 && (
                                <div className="text-sm text-green-600 dark:text-green-400 mt-1 font-semibold">
                                  🚀 Help them grow!
                                </div>
                              )}
                            </div>
                            
                            {/* Selection Indicator */}
                            {isSelected && (
                              <div className="flex-shrink-0">
                                <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      });
                  })()}
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-700 rounded-lg p-4 text-base sm:text-lg">
                <p className="text-green-800 dark:text-green-200 font-semibold mb-2">✨ Instant Switch - No Wait!</p>
                <p className="text-green-700 dark:text-green-300 text-sm sm:text-base">
                  Redelegation happens immediately with no unbonding period. Keep earning rewards while helping decentralize the network!
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  disabled={redelegating}
                  onClick={() => setRedelegateOpen(false)}
                  className="w-full sm:w-auto px-6 py-3 text-base sm:text-lg rounded-lg border-2 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submitRedelegate}
                  disabled={redelegating}
                  className="w-full sm:w-auto px-6 py-3 text-base sm:text-lg rounded-lg bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white disabled:opacity-60 font-medium"
                >
                  {redelegating ? 'Redelegating…' : '⚡ Redelegate & Power Up!'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Claim Rewards Modal */}
      {claimModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setClaimModalOpen(false)}></div>
          <div className="relative z-10 w-full max-w-4xl rounded-2xl bg-white dark:bg-gray-900 shadow-2xl ring-2 ring-green-500/20 border border-green-200/30 dark:border-green-400/10 p-6 sm:p-8 md:p-10 transition-transform duration-300 max-h-[90vh] overflow-y-auto">
            <div className="rounded-xl mb-6 p-6 bg-gradient-to-r from-green-600 via-emerald-600 to-green-600 text-white">
              <h3 className="text-2xl sm:text-3xl font-semibold mb-2">Claim Rewards 🎁</h3>
              <p className="text-base sm:text-lg opacity-90">Choose how to claim your staking rewards</p>
            </div>
            
            <div className="space-y-6">
              {/* Compound vs Cash In Toggle */}
              <div>
                <label className="block text-base sm:text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Claim Method
                </label>
                <div className="flex rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 p-1">
                  <button
                    type="button"
                    onClick={() => setClaimMode("compound")}
                    className={`flex-1 rounded-lg px-6 py-3 text-base sm:text-lg font-medium transition-all ${
                      claimMode === "compound"
                        ? "bg-white dark:bg-gray-950 text-purple-600 dark:text-purple-400 shadow-md"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                    }`}
                  >
                    Compound
                  </button>
                  <button
                    type="button"
                    onClick={() => setClaimMode("cashin")}
                    className={`flex-1 rounded-lg px-6 py-3 text-base sm:text-lg font-medium transition-all ${
                      claimMode === "cashin"
                        ? "bg-white dark:bg-gray-950 text-green-600 dark:text-green-400 shadow-md"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                    }`}
                  >
                    Cash in
                  </button>
                </div>
                <div className="mt-3 text-sm sm:text-base text-gray-600 dark:text-gray-400">
                  {claimMode === "compound" ? (
                    <span className="flex items-start gap-2">
                      <span className="text-lg">🔄</span>
                      <span><strong>Compound:</strong> Claim and immediately restake rewards to grow your stake automatically. Uses authz for secure compounding.</span>
                    </span>
                  ) : (
                    <span className="flex items-start gap-2">
                      <span className="text-lg">💰</span>
                      <span><strong>Cash in:</strong> Claim rewards to your available balance for spending or manual staking.</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Wallet Selector */}
              <div>
                <label className="block text-base sm:text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">Select Wallet</label>
                <select
                  value={claimSelectedWallet}
                  onChange={(e) => setClaimSelectedWallet(e.target.value)}
                  className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-4 py-3 text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  {displayTokens.map(token => {
                    const rewards = parseFloat(token.rewards || "0");
                    return (
                      <option key={token.address} value={token.address}>
                        {token.label} ({formatAddressSnippet(token.address, 4)}) - {formatAmount(rewards)} CORE rewards
                      </option>
                    );
                  })}
                </select>
                <div className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
                  Switching wallet will prompt Keplr to connect to the selected wallet
                </div>
              </div>

              {/* Validator Selection for Compound Mode */}
              {claimMode === "compound" && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white">
                      Select Validators (Optional)
                    </label>
                    {claimTargetValidators.length > 0 && (
                      <div className="text-sm sm:text-base font-medium text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-3 py-1 rounded-full shadow-lg">
                        {claimTargetValidators.length} of 3 selected
                      </div>
                    )}
                  </div>
                  
                  {/* Search Bar */}
                  <div className="relative mb-6">
                    <input
                      type="text"
                      value={validatorSearch}
                      onChange={(e) => setValidatorSearch(e.target.value)}
                      placeholder="Search validator..."
                      className="w-full rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-5 py-4 pl-12 text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 shadow-lg hover:shadow-xl transition-all duration-300"
                    />
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>

                  <div className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-4">
                    Leave unselected for proportional distribution, or choose up to 3 validators (we recommend Roll ⭐)
                  </div>

                  {/* Proportional Distribution Popup */}
                  {showProportionalPopup && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
                      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Proportional Distribution</h3>
                          <button
                            onClick={() => setShowProportionalPopup(false)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        <div className="space-y-3 text-gray-600 dark:text-gray-400">
                          <p>When you select proportional distribution, your rewards will be automatically distributed across all your current validators based on how much you've staked with each one.</p>
                          <p>This helps maintain your current staking distribution and supports decentralization by not concentrating power in any single validator.</p>
                        </div>
                        <button
                          onClick={() => setShowProportionalPopup(false)}
                          className="w-full mt-6 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                        >
                          Got it!
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Proportional Option */}
                  <div
                    onClick={() => setClaimTargetValidators([])}
                    className={`relative flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all mb-2 shadow-lg hover:shadow-xl ${
                      claimTargetValidators.length === 0
                        ? 'bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 ring-2 ring-purple-500 shadow-purple-200 dark:shadow-purple-900/50' 
                        : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750'
                    }`}
                  >
                    {/* Glowing effect for proportional distribution */}
                    {claimTargetValidators.length === 0 && (
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-400/20 to-indigo-400/20 animate-pulse"></div>
                    )}
                    <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 shadow-lg">
                      %
                    </div>
                    <div className="relative flex-1 min-w-0">
                      <div className="font-semibold text-lg sm:text-xl text-gray-900 dark:text-white">
                        Proportional Distribution
                      </div>
                      <div className="text-base sm:text-lg text-purple-600 dark:text-purple-400 font-medium">
                        Distribute across current validators
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowProportionalPopup(true);
                        }}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1"
                      >
                        Learn more
                      </button>
                    </div>
                    {claimTargetValidators.length === 0 && (
                      <div className="relative flex-shrink-0">
                        <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center shadow-lg">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Validators List */}
                  <div className="space-y-2 max-h-[400px] overflow-y-auto overflow-x-visible p-1">
                    {(() => {
                      const searchFiltered = validatorSearch
                        ? validators.filter(v => 
                            (v.description?.moniker || "").toLowerCase().includes(validatorSearch.toLowerCase()) ||
                            v.operator_address.toLowerCase().includes(validatorSearch.toLowerCase())
                          )
                        : validators;
                      
                      const totalVotingPower = validators.reduce((sum, v) => sum + parseFloat(v.tokens || "0"), 0);
                      
                      return searchFiltered
                        .sort((a, b) => {
                          const aIsRoll = (a.description?.moniker || "").toLowerCase().includes("roll");
                          const bIsRoll = (b.description?.moniker || "").toLowerCase().includes("roll");
                          if (aIsRoll && !bIsRoll) return -1;
                          if (!aIsRoll && bIsRoll) return 1;
                          const aTokens = parseFloat(a.tokens || "0");
                          const bTokens = parseFloat(b.tokens || "0");
                          return aTokens - bTokens;
                        })
                        .map(v => {
                          const isRoll = (v.description?.moniker || "").toLowerCase().includes("roll");
                          const validatorTokens = parseFloat(v.tokens || "0");
                          const votingPowerPercent = totalVotingPower > 0 ? (validatorTokens / totalVotingPower * 100) : 0;
                          const isSelected = claimTargetValidators.includes(v.operator_address);
                          const canSelect = claimTargetValidators.length < 3 || isSelected;
                          const avatarUrl = getValidatorAvatar(v);
                          const isHighVotingPower = votingPowerPercent > 5; // Top validators (red)
                          const isMediumVotingPower = votingPowerPercent > 1.5; // Medium validators (yellow)
                          
                          return (
                            <div
                              key={v.operator_address}
                              onClick={() => {
                                if (isSelected) {
                                  // Unselect
                                  setClaimTargetValidators(prev => prev.filter(addr => addr !== v.operator_address));
                                } else if (canSelect) {
                                  // Select (if under limit)
                                  setClaimTargetValidators(prev => [...prev, v.operator_address]);
                                }
                              }}
                              className={`relative flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all shadow-lg hover:shadow-xl ${
                                isSelected 
                                  ? 'bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 ring-2 ring-purple-500 shadow-purple-200 dark:shadow-purple-900/50' 
                                  : canSelect
                                    ? 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750'
                                    : 'bg-gray-50 dark:bg-gray-800 opacity-50 cursor-not-allowed'
                              } ${
                                isHighVotingPower ? 'ring-2 ring-red-500 bg-red-50/50 dark:bg-red-900/20 border-2 border-red-500' : 
                                isMediumVotingPower ? 'ring-2 ring-yellow-500 bg-yellow-50/50 dark:bg-yellow-900/20 border-2 border-yellow-500' : ''
                              }`}
                            >
                              {/* Gold sparkles for Roll Validation */}
                              {isRoll && (
                                <div className="absolute top-1 right-1 w-4 h-4 z-10">
                                  <div className="absolute w-1 h-1 bg-yellow-400 rounded-full animate-ping"></div>
                                  <div className="absolute w-1 h-1 bg-yellow-400 rounded-full animate-ping" style={{animationDelay: '0.5s'}}></div>
                                  <div className="absolute w-1 h-1 bg-yellow-400 rounded-full animate-ping" style={{animationDelay: '1s'}}></div>
                                </div>
                              )}
                              
                              {/* High voting power warning */}
                              {isHighVotingPower && (
                                <div className="absolute top-2 left-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg z-10">
                                  !
                                </div>
                              )}
                              {/* Medium voting power warning */}
                              {isMediumVotingPower && (
                                <div className="absolute top-2 left-2 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg z-10">
                                  !
                                </div>
                              )}
                              {/* Avatar */}
                              <div className="relative flex-shrink-0">
                                <img
                                  src={avatarUrl}
                                  alt={v.description?.moniker || "Validator"}
                                  className={`w-14 h-14 rounded-full ring-2 shadow-lg ${
                                    isRoll ? 'ring-yellow-400 shadow-yellow-200 dark:shadow-yellow-900/50' : 
                                    isHighVotingPower ? 'ring-red-500 shadow-red-200 dark:shadow-red-900/50' :
                                    isMediumVotingPower ? 'ring-yellow-500 shadow-yellow-200 dark:shadow-yellow-900/50' :
                                    'ring-gray-200 dark:ring-gray-700'
                                  }`}
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(v.description?.moniker || "V")}&size=128&background=9333ea&color=fff&bold=true`;
                                  }}
                                />
                                {isRoll && (
                                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center text-xs shadow-lg">
                                    ⭐
                                  </div>
                                )}
                              </div>
                              
                              {/* Validator Info */}
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-lg sm:text-xl text-gray-900 dark:text-white truncate">
                                  {v.description?.moniker || v.operator_address.slice(0, 20)}
                                  {isRoll && <span className="ml-2 text-yellow-500">⭐</span>}
                                </div>
                                <div className={`text-base sm:text-lg font-medium ${
                                  isHighVotingPower ? 'text-red-600 dark:text-red-400' : 
                                  isMediumVotingPower ? 'text-yellow-600 dark:text-yellow-400' : 
                                  'text-orange-600 dark:text-orange-400'
                                }`}>
                                  {votingPowerPercent.toFixed(2)}% voting power
                                  {isHighVotingPower && (
                                    <span className="ml-2 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2 py-1 rounded-full">
                                      High power
                                    </span>
                                  )}
                                  {isMediumVotingPower && (
                                    <span className="ml-2 text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 px-2 py-1 rounded-full">
                                      Medium power
                                    </span>
                                  )}
                                </div>
                                {isHighVotingPower && (
                                  <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                                    Consider smaller validators for decentralization
                                  </div>
                                )}
                                {isMediumVotingPower && (
                                  <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                                    Consider smaller validators for decentralization
                                  </div>
                                )}
                              </div>
                              
                              {/* Selection Indicator */}
                              {isSelected ? (
                                <div className="flex-shrink-0">
                                  <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                </div>
                              ) : !canSelect ? (
                                <div className="flex-shrink-0 text-xs text-gray-400">
                                  Max 3
                                </div>
                              ) : null}
                            </div>
                          );
                        });
                    })()}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setClaimModalOpen(false)}
                  className="w-full sm:w-auto px-6 py-3 text-base sm:text-lg rounded-lg border-2 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleClaimRewards()}
                  className={`w-full sm:w-auto px-6 py-3 text-base sm:text-lg rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 ${
                    claimMode === "compound"
                      ? "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
                      : "bg-green-600 hover:bg-green-700 text-white"
                  }`}
                >
                  {claimMode === "compound" ? "🔄 Compound Rewards" : "💰 Cash In Rewards"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Send CORE Modal */}
      {showSendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 border-2 border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                Send CORE
              </h3>
              <button
                onClick={handleCloseSendModal}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                disabled={sending}
              >
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-xl p-4 mb-6">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>Available Balance:</strong> {totals.available.toFixed(6)} CORE
              </p>
              {coreumPrice && (
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  ≈ ${(totals.available * coreumPrice).toFixed(2)} USD
                </p>
              )}
            </div>

            <form onSubmit={handleSendSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Recipient Address
                </label>
                <input
                  type="text"
                  value={sendRecipient}
                  onChange={(e) => setSendRecipient(e.target.value)}
                  placeholder="core1..."
                  disabled={sending}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Amount
                  </label>
                  <button
                    type="button"
                    onClick={toggleAmountMode}
                    disabled={sending}
                    className="flex items-center gap-2 px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-xs font-medium text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>{sendAmountMode === "token" ? "💰 Token" : "💵 USD"}</span>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={sendAmount}
                    onChange={(e) => setSendAmount(e.target.value)}
                    placeholder={sendAmountMode === "token" ? "0.00" : "$0.00"}
                    disabled={sending}
                    className="w-full px-4 py-3 pr-20 rounded-lg border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={handleMaxAmount}
                    disabled={sending}
                    className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    MAX
                  </button>
                </div>
                {sendAmountMode === "usd" && coreumPrice && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    ≈ {sendAmount && parseFloat(sendAmount) > 0 
                      ? (parseFloat(sendAmount) / coreumPrice).toFixed(6)
                      : "0"} CORE
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Memo (Optional)
                </label>
                <input
                  type="text"
                  value={sendMemo}
                  onChange={(e) => setSendMemo(e.target.value)}
                  placeholder="Add a note..."
                  disabled={sending}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {sendError && (
                <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-700 rounded-xl p-4">
                  <p className="text-sm text-red-900 dark:text-red-100">
                    <strong>❌ Error:</strong> {sendError}
                  </p>
                </div>
              )}

              <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-xl p-4">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>💡 Tip:</strong> Make sure the recipient address is correct. Transactions are irreversible!
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseSendModal}
                  disabled={sending}
                  className="flex-1 px-6 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending || !sendRecipient || !sendAmount}
                  className="flex-1 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {sending ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </>
                  ) : (
                    'Send CORE'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
