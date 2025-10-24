"use client";

import { useState, useEffect, useMemo } from "react";
import WalletConnectModal from "@/components/wallet/WalletConnectModal";
import PortfolioTotals from "@/components/portfolio/PortfolioTotals";
import CoreumBreakdown from "@/components/portfolio/CoreumBreakdown";
import TokenTable from "@/components/portfolio/TokenTable";
import NftHoldings from "@/components/portfolio/NftHoldings";
import { createSupabaseClient } from "@/utils/supabase/client";
import { getAllWallets, getWalletCount } from "@/utils/wallet/simplified-operations";
import { getMultiAddressBalances, EnrichedBalance, getTokenPrice, getTokenChange24h, loadTokenPricesInParallel, loadTokenPricesWithCacheStrategy } from "@/utils/coreum/rpc";
import { getShieldNftHolding, ShieldNftHolding, fetchShieldSettings, hasShieldNft, getShieldNftCount } from "@/utils/nft/shield";
import { preloadTokenImages } from "@/utils/coreum/token-images";
import { initializeDashboardSession, refreshSessionIfNeeded } from "@/utils/auth/session-refresh";
import { isTokenHidden } from "@/utils/hidden-tokens";
// import { detectAvailableWalletProvider, WalletProvider } from "@/utils/wallet/detection";

export default function SimplifiedDashboard() {
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [walletCount, setWalletCount] = useState(0);
  const [totalValue, setTotalValue] = useState(0);
  const [change24h, setChange24h] = useState(0);
  const [tokens, setTokens] = useState<EnrichedBalance[]>([]);
  const [wallets, setWallets] = useState<Array<{ address: string; label?: string }>>([]);
  const [tokensByAddress, setTokensByAddress] = useState<Record<string, EnrichedBalance[]>>({});
  const [shieldNft, setShieldNft] = useState<ShieldNftHolding | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [walletProvider, setWalletProvider] = useState<"keplr" | "leap" | "cosmostation" | undefined>(undefined);
  const [coreumPrice, setCoreumPrice] = useState<number | undefined>(undefined);
  const [coreumChange24h, setCoreumChange24h] = useState<number | undefined>(undefined);

  // Memoize wallet addresses to prevent unnecessary re-renders in child components
  const walletAddresses = useMemo(() => wallets.map(w => w.address), [wallets]);

  useEffect(() => {
    // Check auth state FIRST before loading data
    const initializeDashboard = async () => {
      // Use the session refresh utility to handle stale sessions
      const { isAuthenticated: authStatus } = await initializeDashboardSession();
      console.log("=== DASHBOARD INIT ===", "Authenticated:", authStatus);
      setIsAuthenticated(authStatus);
      
      // Load dashboard data after auth state is set
      loadDashboardData();
    };
    
    initializeDashboard();
    
    // Detect available wallet provider (temporarily disabled)
    setWalletProvider(undefined);
    
    // Preload common token images for better UX
    preloadTokenImages(['CORE', 'XRP', 'SOLO', 'ATOM', 'OSMO', 'COZY', 'KONG', 'MART', 'CAT', 'ROLL', 'SMART']);
    
    // Listen for wallet changes
    const handleWalletChange = () => {
      console.log("=== WALLET CHANGE EVENT TRIGGERED ===");
      loadDashboardData();
    };
    
    // Listen for authentication state changes
    const supabase = createSupabaseClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("=== AUTH STATE CHANGE ===", event, !!session);
      
      setIsAuthenticated(!!session);
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        loadDashboardData();
        // Show save prompt if user has wallets and just signed in
        checkForSavePrompt();
      } else if (event === 'SIGNED_OUT') {
        // Clear all state and reload as anonymous
        setWallets([]);
        setWalletCount(0);
        setTokens([]);
        setTotalValue(0);
        setChange24h(0);
        setShieldNft(null);
        loadDashboardData(); // Reload to switch to anonymous mode
      }
    });
    
    window.addEventListener('walletStorageChange', handleWalletChange);
    window.addEventListener('walletDatabaseChange', handleWalletChange);
    
    return () => {
      window.removeEventListener('walletStorageChange', handleWalletChange);
      window.removeEventListener('walletDatabaseChange', handleWalletChange);
      subscription.unsubscribe();
    };
  }, [refreshCounter]);

  const checkForSavePrompt = async () => {
    // Only show save prompt for NON-authenticated users with wallets
    const count = await getWalletCount();
    if (count > 0 && !isAuthenticated) {
      // Don't show if already dismissed
      const dismissed = localStorage.getItem('save_prompt_dismissed');
      if (!dismissed) {
        setShowSavePrompt(true);
      }
    }
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const supabase = createSupabaseClient();
      // Use getSession() instead of getUser() - it's faster and won't hang
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user || null;
      setIsAuthenticated(!!user);
      
      console.log("=== SIMPLIFIED DASHBOARD DATA LOADING ===");
      console.log("User authenticated:", !!user);
      
      // Get user profile if authenticated
      let profile = null;
      if (user) {
        const { data: profileData } = await supabase
          .from("user_profiles")
          .select("public_user_id")
          .eq("auth_user_id", user.id)
          .maybeSingle();
        profile = profileData;
      }
      
      // Get all wallets FIRST (works for both authenticated and anonymous users)
      const allWallets = await getAllWallets();
      const count = await getWalletCount();
      
      setWallets(allWallets);
      setWalletCount(count);

      // ONLY fetch prices and calculate NFT if user has wallets
      if (count > 0) {
        // Fetch Shield NFT settings and CORE price in parallel (ONLY when needed)
        const [shieldSettings, corePrice, coreChange] = await Promise.all([
          fetchShieldSettings(supabase),
          getTokenPrice("CORE"),
          getTokenChange24h("CORE")
        ]);

        // Get the number of Shield NFTs the user owns (from private_users table)
        let nftCount = 0;
        if (profile?.public_user_id) {
          nftCount = await getShieldNftCount(supabase, profile.public_user_id);
        }
        
        let nftHolding: ShieldNftHolding | null = null;
        if (nftCount > 0) {
          // Generate Shield NFT holding with correct count (only when user has wallets and owns NFT)
          nftHolding = getShieldNftHolding(corePrice, coreChange, shieldSettings, undefined, nftCount);
          setShieldNft(nftHolding);
        } else {
          // User doesn't own Shield NFT, don't show it
          setShieldNft(null);
        }
        // Fetch balances for all wallets (FAST - no prices yet)
        const addresses = allWallets.map(w => w.address);
        const { aggregated, totalValueUsd, byAddress } = await getMultiAddressBalances(addresses);
        
        // Show tokens immediately with balances (no prices)
        setTokens(aggregated);
        setTokensByAddress(byAddress);
        
        // Add NFT value to total (only if user owns it)
        const totalWithNft = nftCount > 0 ? (nftHolding?.valueUsd || 0) : 0;
        setTotalValue(totalWithNft);
        setChange24h(nftCount > 0 ? (nftHolding?.change24h || 0) : 0);
        
        // Load prices with cache strategy (instant cached prices + background fresh updates)
        console.log("🚀 [Portfolio] Starting optimized price loading...");
        loadTokenPricesWithCacheStrategy(aggregated).then((tokensWithPrices) => {
          console.log("✅ [Portfolio] Optimized price loading completed");
          
          // Update tokens with prices (cached prices show instantly, fresh prices update progressively)
          setTokens(tokensWithPrices);
          
          // Extract COREUM price from tokens
          const coreumToken = tokensWithPrices.find(t => t.symbol === 'CORE' || t.symbol === 'COREUM');
          if (coreumToken) {
            const balance = parseFloat(coreumToken.balanceFormatted.replace(/,/g, ''));
            if (balance > 0 && coreumToken.valueUsd > 0) {
              const price = coreumToken.valueUsd / balance;
              console.log('💰 [COREUM Price] $' + price.toFixed(4), '(24h:', coreumToken.change24h.toFixed(2) + '%)');
              setCoreumPrice(price);
              setCoreumChange24h(coreumToken.change24h);
            }
          }
          
          // Recalculate totals with actual prices (excluding hidden tokens)
          const totalValueWithPrices = tokensWithPrices.reduce((sum, token) => {
            // Check if token is hidden
            const denom = token.denom || token.symbol;
            if (isTokenHidden(denom)) {
              console.log(`👁️‍🗨️ Excluding hidden token from total value: ${token.symbol}`);
              return sum;
            }
            
            const value = isNaN(token.valueUsd) || !isFinite(token.valueUsd) ? 0 : token.valueUsd;
            if (isNaN(token.valueUsd) || !isFinite(token.valueUsd)) {
              console.warn(`⚠️ Invalid valueUsd for ${token.symbol}:`, token.valueUsd, 'balance:', token.balanceFormatted);
            }
            return sum + value;
          }, 0);
          const nftValue = nftHolding?.valueUsd || 0;
          const totalWithNftAndPrices = totalValueWithPrices + nftValue;
          console.log(`💰 [Total Value] Tokens: $${totalValueWithPrices.toFixed(2)}, NFT: $${nftValue.toFixed(2)}, Total: $${totalWithNftAndPrices.toFixed(2)}`);
          setTotalValue(isNaN(totalWithNftAndPrices) ? 0 : totalWithNftAndPrices);
          
          // Calculate weighted average 24h change (including NFT, excluding hidden tokens)
          if (totalWithNftAndPrices > 0) {
            const tokenWeightedChange = tokensWithPrices.reduce((acc, token) => {
              // Check if token is hidden
              const denom = token.denom || token.symbol;
              if (isTokenHidden(denom)) {
                return acc; // Skip hidden tokens
              }
              
              const weight = token.valueUsd / totalWithNftAndPrices;
              return acc + (token.change24h * weight);
            }, 0);
            const nftWeightedChange = nftHolding 
              ? (nftHolding.valueUsd / totalWithNftAndPrices) * nftHolding.change24h 
              : 0;
            setChange24h(tokenWeightedChange + nftWeightedChange);
          }
        }).catch((error) => {
          console.error("❌ [Portfolio] Optimized price loading failed:", error);
        });
      } else {
        setTokens([]);
        setTokensByAddress({});
        // With no wallets, hide Shield NFT and set totals to zero
        setShieldNft(null);
        setTotalValue(0);
        setChange24h(0);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectionSuccess = () => {
    console.log("=== CONNECTION SUCCESS CALLBACK ===");
    setRefreshCounter(prev => prev + 1);
    
    // Show save prompt after first wallet connection (if not authenticated)
    if (!isAuthenticated) {
      setTimeout(() => {
        const dismissed = localStorage.getItem('save_prompt_dismissed');
        if (!dismissed) {
          setShowSavePrompt(true);
        }
      }, 2000); // Show after 2 seconds
    }
  };

  const handleSavePromptDismiss = () => {
    setShowSavePrompt(false);
    localStorage.setItem('save_prompt_dismissed', 'true');
  };

  const handleSavePromptAccept = () => {
    setShowSavePrompt(false);
    // Redirect to sign up
    window.location.href = '/sign-up';
  };

  return (
    <main className="min-h-screen neo-gradient-bg p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3">
            Portfolio Dashboard
          </h1>
          <p className="text-lg text-gray-400">
            Track your Coreum assets across multiple wallets
          </p>
        </div>

        {/* Save Wallets Prompt for Anonymous Users */}
        {!isAuthenticated && walletCount > 0 && (
          <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-1">
                  Save Your Portfolio
                </h3>
                <p className="text-[#179b69] dark:text-[#25d695]">
                  You have {walletCount} wallet{walletCount !== 1 ? 's' : ''} connected. Create a free account to save your portfolio permanently.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSavePromptDismiss}
                  className="px-3 py-1 text-sm text-[#25d695] hover:text-purple-800 dark:text-[#25d695] dark:hover:text-purple-200"
                >
                  Maybe Later
                </button>
                <button
                  onClick={handleSavePromptAccept}
                  className="px-4 py-2 bg-[#25d695] hover:bg-[#179b69] text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Create Account
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Portfolio Totals */}
        <div className="mb-6">
          <PortfolioTotals
            totalValue={totalValue}
            change24h={change24h}
            walletCount={walletCount}
            walletAddresses={walletAddresses}
            loading={loading}
            isAuthenticated={isAuthenticated}
            onAddWallet={() => setShowConnectModal(true)}
            onRefresh={refreshCounter}
          />
        </div>

        {/* COREUM Balance Breakdown */}
        {walletCount > 0 && Object.keys(tokensByAddress).length > 0 && (
          <div className="mb-6">
            <CoreumBreakdown 
              tokens={wallets.map(w => {
                const walletTokens = tokensByAddress[w.address] || [];
                const coreumToken = walletTokens.find(t => t.symbol === 'CORE');
                return {
                  address: w.address,
                  label: w.label || `${w.address.slice(0, 10)}...`,
                  available: coreumToken?.available || "0",
                  staked: coreumToken?.staked || "0",
                  rewards: coreumToken?.rewards || "0",
                  unbonding: "0",
                };
              })}
              loading={loading}
              walletProvider={walletProvider}
              coreumPrice={coreumPrice}
              coreumChange24h={coreumChange24h}
            />
          </div>
        )}

        {/* Shield NFT Holdings */}
        {shieldNft && (
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-white mb-4">
              NFT Holdings
            </h2>
            <NftHoldings nfts={[shieldNft]} loading={loading} />
          </div>
        )}

        {/* Token Holdings (excluding CORE) */}
        <div className="neo-float-blue p-8">
          <h2 className="text-2xl font-semibold text-white mb-6">
            Token Holdings
          </h2>
          <TokenTable 
            tokens={tokens
              .filter(t => t.symbol !== 'CORE')
              .map(t => ({
                symbol: t.symbol,
                name: t.name,
                balance: t.balanceFormatted,
                valueUsd: t.valueUsd,
                change24h: t.change24h,
                logoUrl: t.logoUrl,
                denom: t.denom,
                contractAddress: t.denom, // Pass full denom as contract address
                available: t.available,
                staked: t.staked,
                rewards: t.rewards,
              }))}
            loading={loading}
          />
        </div>
      </div>

      {/* Wallet Connect Modal */}
      <WalletConnectModal
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        onSuccess={handleConnectionSuccess}
      />

      {/* Save Prompt Modal */}
      {showSavePrompt && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-[#1b1d23]">
            <h2 className="text-2xl font-bold mb-4 text-white">
              Save Your Wallets?
            </h2>
            <p className="text-gray-400 mb-6">
              You have {walletCount} wallet{walletCount !== 1 ? 's' : ''} connected. 
              Create a free account to save them permanently and access your portfolio from anywhere.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleSavePromptDismiss}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Maybe Later
              </button>
              <button
                onClick={handleSavePromptAccept}
                className="flex-1 px-4 py-2 bg-[#25d695] hover:bg-[#179b69] text-white rounded-lg font-medium transition-colors"
              >
                Create Account
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
