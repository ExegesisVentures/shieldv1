"use client";

import { useState, useEffect } from "react";
import { IoOpenOutline, IoTrendingUp, IoTrendingDown, IoCash, IoCopy, IoEyeOffOutline, IoSwapHorizontal, IoSend, IoFlame } from "react-icons/io5";
import { Card } from "@/components/ui/card";
import { formatTokenSymbol, formatTokenName, sortTokensWithCoreFirst } from "@/utils/token-display";
import { formatAddressSnippet } from "@/utils/address-utils";
import { getLpPairInfo } from "@/utils/coreum/token-images";
import DualTokenLogo from "@/components/ui/DualTokenLogo";
import ConfirmPopover from "@/components/ui/ConfirmPopover";
import { hideToken } from "@/utils/hidden-tokens";
import { AnimatedCurrency, AnimatedPercentage, AnimatedBalance } from "@/components/ui/AnimatedNumber";
import { useRouter } from "next/navigation";

interface Token {
  symbol: string;
  name: string;
  balance: string;
  valueUsd: number;
  change24h: number;
  logoUrl?: string;
  denom?: string;
  contractAddress?: string; // Contract address for bridged tokens
  // COREUM breakdown
  available?: string;
  staked?: string;
  rewards?: string;
  // Progressive loading
  priceLoaded?: boolean;
  // Optional per-wallet breakdown for non-CORE tokens
  breakdown?: Array<{ address: string; label?: string; balance: string; valueUsd: number }>;
}

interface TokenTableProps {
  tokens?: Token[];
  loading?: boolean;
}

export default function TokenTable({ tokens = [], loading = false }: TokenTableProps) {
  const router = useRouter();
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [showHideConfirm, setShowHideConfirm] = useState<{
    denom: string;
    symbol: string;
    logoUrl?: string;
    position: { x: number; y: number };
  } | null>(null);
  const [showSendModal, setShowSendModal] = useState<{
    token: Token;
  } | null>(null);

  const handleCopyContractAddress = async (fullAddress: string, tokenSymbol: string) => {
    try {
      await navigator.clipboard.writeText(fullAddress);
      setCopiedToken(tokenSymbol);
      setTimeout(() => setCopiedToken(null), 2000); // Hide after 2 seconds
    } catch (err) {
      console.error('Failed to copy contract address:', err);
    }
  };

  const handleHideTokenClick = (event: React.MouseEvent, denom: string, symbol: string, logoUrl?: string) => {
    event.preventDefault();
    event.stopPropagation();
    
    const rect = event.currentTarget.getBoundingClientRect();
    const position = {
      x: rect.left + rect.width / 2,
      y: rect.bottom,
    };

    console.log('🔍 Hide token clicked:', { denom, symbol, logoUrl, position });
    setShowHideConfirm({ denom, symbol, logoUrl, position });
  };

  const confirmHideToken = () => {
    if (!showHideConfirm) return;
    
    const { denom, symbol, logoUrl } = showHideConfirm;
    console.log('✅ Confirming hide for:', symbol, denom, logoUrl);
    
    hideToken(denom, symbol, logoUrl);
    setShowHideConfirm(null);
    
    console.log('📢 Token hidden, event should fire');
  };

  const cancelHideToken = () => {
    console.log('❌ Hide cancelled');
    setShowHideConfirm(null);
  };

  const handleSendToken = (token: Token) => {
    setShowSendModal({ token });
  };

  const handleSwapToken = (token: Token) => {
    // Navigate to swap page with pre-selected token
    const denom = token.denom || token.symbol;
    router.push(`/swap?token=${encodeURIComponent(denom)}`);
  };

  const handleBurnToken = (token: Token) => {
    // Burn functionality - coming soon in v2
    alert(`Burn functionality for ${token.symbol} is coming soon!`);
  };

  if (loading) {
    return (
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Asset
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Balance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  24h
                </th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3].map((i) => (
                <tr key={i} className="border-b border-gray-200 dark:border-gray-700">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                      <div className="space-y-2">
                        <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                        <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    );
  }

  if (tokens.length === 0) {
    return (
      <Card className="p-12 text-center">
        <div className="text-gray-400 mb-2">
          <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-2">No tokens found</p>
        <p className="text-sm text-gray-500 dark:text-gray-500">
          Connect a wallet with token balances to see them here
        </p>
      </Card>
    );
  }

  // Sort tokens with CORE first
  const sortedTokens = sortTokensWithCoreFirst(tokens);

  return (
    <>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-4 sm:px-6 py-4 text-left text-sm sm:text-base font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                Asset
              </th>
              <th className="px-4 sm:px-6 py-4 text-left text-sm sm:text-base font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                Balance
              </th>
              <th className="px-4 sm:px-6 py-4 text-left text-sm sm:text-base font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                Value
              </th>
              <th className="px-4 sm:px-6 py-4 text-left text-sm sm:text-base font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                24h Change
              </th>
              <th className="px-4 sm:px-6 py-4 text-right text-sm sm:text-base font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {sortedTokens.map((token) => {
              const isPositive = token.change24h >= 0;
              const isCoreToken = token.symbol === "CORE";
              const displaySymbol = formatTokenSymbol(token.symbol, token.denom || token.symbol);
              const displayName = formatTokenName(token.name, token.denom || token.name);
              const hasBreakdown = !isCoreToken && (token.breakdown?.length || 0) > 1;
              
              // Check if this is an LP token
              const lpPairInfo = token.denom ? getLpPairInfo(token.denom) : null;
              const isLpToken = lpPairInfo !== null;
              
              // Check if this is a bridged token (XRPL, XRP, or IBC tokens only)
              const isBridgedToken = token.denom && (
                token.denom.startsWith('xrpl') || 
                token.denom.startsWith('drop-') || 
                token.denom.startsWith('ibc/')
              );
              
              return (
                <tr
                  key={token.denom || token.symbol}
                  className={`group hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                    isCoreToken ? "bg-purple-50/30 dark:bg-purple-900/10" : ""
                  }`}
                >
                  {/* Asset */}
                  <td className="px-4 sm:px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center gap-3 sm:gap-4">
                      {/* Token Logo - Dual Logo for LP tokens */}
                      <div className="relative">
                        {isLpToken && lpPairInfo ? (
                          // LP Token: Show dual logos
                          <DualTokenLogo
                            token0Logo={lpPairInfo.token0Logo}
                            token1Logo={lpPairInfo.token1Logo}
                            token0Symbol={lpPairInfo.token0Symbol}
                            token1Symbol={lpPairInfo.token1Symbol}
                            size="md"
                          />
                        ) : token.logoUrl ? (
                          // Regular token with logo
                          <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden flex items-center justify-center shadow-sm ${
                            displaySymbol === 'ROLL' || displaySymbol === 'CORE' 
                              ? 'bg-transparent' 
                              : 'bg-white dark:bg-gray-800'
                          }`}>
                            <img
                              src={token.logoUrl}
                              alt={displaySymbol}
                              className={`w-full h-full ${
                                displaySymbol === 'ROLL' || displaySymbol === 'CORE' 
                                  ? 'object-contain scale-110' 
                                  : 'object-cover'
                              }`}
                              onLoad={() => console.log(`✅ Image loaded: ${displaySymbol} - ${token.logoUrl}`)}
                              onError={(e) => {
                                console.error(`❌ Image failed to load: ${displaySymbol} - ${token.logoUrl}`);
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                        ) : (
                          // Fallback for tokens without logos
                          <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center font-bold text-base sm:text-lg transition-all duration-300 ${
                            isCoreToken 
                              ? "neo-icon-glow-purple" 
                              : "bg-gradient-to-br from-gray-500 to-gray-600 text-white shadow-lg"
                          }`}>
                            {isCoreToken ? <IoCash className="w-6 h-6 sm:w-7 sm:h-7" /> : displaySymbol.charAt(0)}
                          </div>
                        )}
                        {/* Coreum logo overlay for bridged tokens only - outside the token container */}
                        {isBridgedToken && !isLpToken && (
                          <div className="absolute -bottom-1 -right-2 w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center z-0">
                            <img
                              src="/tokens/CoreumLogo (3).svg"
                              alt="Coreum"
                              className="w-4 h-4 sm:w-5 sm:h-5"
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col justify-center">
                        <div className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          {displaySymbol}
                          {isCoreToken && (
                            <span className="text-xs sm:text-sm bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded">
                              Native
                            </span>
                          )}
                          {!isCoreToken && token.denom && (
                            <button
                              onClick={() => handleCopyContractAddress(token.denom!, displaySymbol)}
                              className="relative p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                              title={`IoCopy ${displaySymbol} contract address`}
                            >
                              <IoCopy className="w-4 h-4 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300" />
                              {copiedToken === displaySymbol && (
                                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-[9999]">
                                  Address copied
                                </div>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Balance */}
                  <td className="px-4 sm:px-6 py-5">
                    {isCoreToken && (token.available || token.staked || token.rewards) ? (
                      <div className="space-y-1">
                        <div className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                          {token.balance}
                        </div>
                        {token.available && (
                          <div className="text-base sm:text-lg text-gray-600 dark:text-gray-400">
                            Available: {token.available}
                          </div>
                        )}
                        {token.staked && parseFloat(token.staked) > 0 && (
                          <div className="text-base sm:text-lg text-purple-600 dark:text-purple-400">
                            Staked: {token.staked}
                          </div>
                        )}
                        {token.rewards && parseFloat(token.rewards) > 0 && (
                          <div className="text-base sm:text-lg text-green-600 dark:text-green-400">
                            Rewards: {token.rewards}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-lg sm:text-xl font-medium text-gray-900 dark:text-white">
                        {token.balance}
                      </div>
                    )}

                    {/* Indented per-wallet breakdown (hover to reveal) */}
                    {hasBreakdown && token.breakdown && (
                      <div className="mt-2 hidden group-hover:block">
                        {token.breakdown.map((w, i) => (
                          <div key={i} className="flex items-center justify-between text-sm sm:text-base text-gray-600 dark:text-gray-400 ml-6 py-1">
                            <div className="flex items-center gap-2">
                              <span className="inline-block w-2 h-2 rounded-full bg-gray-400"></span>
                              <span className="font-medium">{w.label?.replace(' Wallet', '') || formatAddressSnippet(w.address, 4)}</span>
                              <span className="text-xs text-gray-400">{formatAddressSnippet(w.address, 4)}</span>
                              <button
                                onClick={() => handleCopyContractAddress(w.address, w.label || 'Wallet')}
                                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                                title={`Copy ${w.label || 'wallet'} address`}
                              >
                                <IoCopy className="w-3 h-3 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300" />
                              </button>
                            </div>
                            <div className="text-gray-700 dark:text-gray-300 font-semibold">{w.balance}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>

                  {/* Value */}
                  <td className="px-4 sm:px-6 py-5 whitespace-nowrap">
                    {token.priceLoaded === false ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-5 w-20 rounded"></div>
                        <div className="text-base text-gray-500 dark:text-gray-400">Loading...</div>
                      </div>
                    ) : (
                      <div className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                        <AnimatedCurrency value={token.valueUsd} decimals={2} />
                      </div>
                    )}
                  </td>

                  {/* 24h Change */}
                  <td className="px-4 sm:px-6 py-5 whitespace-nowrap">
                    {token.priceLoaded === false ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-5 w-16 rounded"></div>
                      </div>
                    ) : (
                      <div
                        className={`flex items-center gap-1 text-lg sm:text-xl font-semibold ${
                          isPositive ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {isPositive ? (
                          <IoTrendingUp className="w-6 h-6" />
                        ) : (
                          <IoTrendingDown className="w-6 h-6" />
                        )}
                        <AnimatedPercentage value={token.change24h} decimals={2} showPlusSign={true} />
                      </div>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 sm:px-6 py-5 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Send Button */}
                      <button
                        onClick={() => handleSendToken(token)}
                        className="p-2 rounded-lg text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                        title={`Send ${displaySymbol}`}
                      >
                        <IoSend className="w-5 h-5" />
                      </button>
                      
                      {/* Swap Button */}
                      <button
                        onClick={() => handleSwapToken(token)}
                        className="p-2 rounded-lg text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all"
                        title={`Swap ${displaySymbol}`}
                      >
                        <IoSwapHorizontal className="w-5 h-5" />
                      </button>
                      
                      {/* Burn Button - Coming Soon */}
                      <button
                        onClick={() => handleBurnToken(token)}
                        className="p-2 rounded-lg text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-50 cursor-not-allowed"
                        title={`Burn ${displaySymbol} (Coming Soon)`}
                        disabled
                      >
                        <IoFlame className="w-5 h-5" />
                      </button>
                      
                      {/* Hide Token Button - visible on hover */}
                      <button
                        onClick={(e) => handleHideTokenClick(e, token.denom || token.symbol, displaySymbol, token.logoUrl)}
                        className="p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-orange-50 dark:hover:bg-orange-900/20 text-gray-400 hover:text-orange-600 dark:hover:text-orange-400"
                        title={`Hide ${displaySymbol}`}
                      >
                        <IoEyeOffOutline className="w-5 h-5" />
                      </button>
                      
                      {/* Explorer Link */}
                      <a
                        href={`https://explorer.coreum.com/coreum/assets/${token.symbol}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all"
                        title="View on explorer"
                      >
                        <IoOpenOutline className="w-5 h-5" />
                      </a>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>

    {/* Hide Token Confirmation Popover */}
    {showHideConfirm && (
      <ConfirmPopover
        message={`Hide ${showHideConfirm.symbol}?`}
        subMessage="You can unhide it later from the Hidden Tokens list."
        onConfirm={confirmHideToken}
        onCancel={cancelHideToken}
        position={showHideConfirm.position}
        confirmText="Hide"
        cancelText="Cancel"
      />
    )}

    {/* Send Token Modal */}
    {showSendModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 border-2 border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              Send {formatTokenSymbol(showSendModal.token.symbol, showSendModal.token.denom || showSendModal.token.symbol)}
            </h3>
            <button
              onClick={() => setShowSendModal(null)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-xl p-4 mb-6">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Available Balance:</strong> {showSendModal.token.balance} {formatTokenSymbol(showSendModal.token.symbol, showSendModal.token.denom || showSendModal.token.symbol)}
            </p>
            {showSendModal.token.valueUsd > 0 && (
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                ≈ ${showSendModal.token.valueUsd.toFixed(2)} USD
              </p>
            )}
          </div>

          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Recipient Address
              </label>
              <input
                type="text"
                placeholder="core1..."
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Amount
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.000001"
                  placeholder="0.00"
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                >
                  MAX
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Memo (Optional)
              </label>
              <input
                type="text"
                placeholder="Add a note..."
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-700 rounded-xl p-4">
              <p className="text-sm text-yellow-900 dark:text-yellow-100">
                <strong>⚠️ Coming Soon:</strong> Send functionality will be available in the next update. For now, please use your wallet extension to send tokens.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowSendModal(null)}
                className="flex-1 px-6 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled
                className="flex-1 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send Tokens
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
  </>
  );
}

