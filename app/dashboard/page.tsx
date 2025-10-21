"use client";

import { useState, useEffect } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import WalletConnectModal from "@/components/wallet/WalletConnectModal";
import WalletMigrationModal from "@/components/modals/WalletMigrationModal";
import AutoConnectWallet from "@/components/auth/AutoConnectWallet";
import PortfolioTotals from "@/components/portfolio/PortfolioTotals";
import CoreumBreakdown from "@/components/portfolio/CoreumBreakdown";
import TokenTable from "@/components/portfolio/TokenTable";
import NftHoldings from "@/components/portfolio/NftHoldings";
import HiddenTokensList from "@/components/portfolio/HiddenTokensList";
import { createSupabaseClient } from "@/utils/supabase/client";
import { getAllWallets, getWalletCount } from "@/utils/wallet/simplified-operations";
import { getMultiAddressBalances, EnrichedBalance, getTokenPrice, getTokenChange24h, loadTokenPricesInParallel, refreshTokenPrices, loadTokenPricesWithCacheStrategy } from "@/utils/coreum/rpc";
import { getShieldNftHolding, ShieldNftHolding, ShieldSettings, fetchShieldSettings, hasShieldNft } from "@/utils/nft/shield";
import { preloadTokenImages } from "@/utils/coreum/token-images";
import { initializeDashboardSession, refreshSessionIfNeeded } from "@/utils/auth/session-refresh";
// import { detectAvailableWalletProvider, WalletProvider } from "@/utils/wallet/detection";
import { migrateWalletsToAccount } from "@/utils/wallet/simplified-operations";
import { getHiddenTokens, isTokenHidden } from "@/utils/hidden-tokens";
import { IoEyeOffOutline } from "react-icons/io5";
// Import fallback manager for debugging
import "@/utils/coreum/fallback-manager";

function DashboardContent() {
  const [showConnectModal, setShowConnectModal] = useState(false);
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
  const [hasRegisteredWallet, setHasRegisteredWallet] = useState(false);
  const [showMigrationPrompt, setShowMigrationPrompt] = useState(false);
  const [refreshingPrices, setRefreshingPrices] = useState(false);
  const [walletProvider, setWalletProvider] = useState<"keplr" | "leap" | "cosmostation" | undefined>(undefined);
  const [coreumPrice, setCoreumPrice] = useState<number | undefined>(undefined);
  const [coreumChange24h, setCoreumChange24h] = useState<number | undefined>(undefined);
  const [showHiddenTokens, setShowHiddenTokens] = useState(false);
  const [hiddenTokenCount, setHiddenTokenCount] = useState(0);
  const [hiddenTokenDenoms, setHiddenTokenDenoms] = useState<Set<string>>(new Set());

  // Compute wallet addresses - simple array map, no memoization
  const walletAddresses = wallets.map(w => w.address);

  // Helper function to build token breakdown - inline, no hooks
  const buildTokenBreakdown = (token: EnrichedBalance) => {
    const breakdown: Array<{ address: string; label?: string; balance: string; valueUsd: number }> = [];
    const tokenKey = token.denom || token.symbol;
    
    for (const [addr, walletTokens] of Object.entries(tokensByAddress)) {
      const wt = walletTokens.find(x => (x.denom || x.symbol) === tokenKey);
      if (wt && parseFloat(wt.balance || '0') > 0) {
        const walletMeta = wallets.find(w => w.address === addr);
        breakdown.push({
          address: addr,
          label: walletMeta?.label,
          balance: wt.balanceFormatted,
          valueUsd: wt.valueUsd,
        });
      }
    }
    return breakdown;
  };
  
  // Filter visible tokens - computed directly every render (it's fast!)
  const visibleTokens = tokens
    .filter(t => t.symbol !== 'CORE')
    .filter(t => !hiddenTokenDenoms.has(t.denom || t.symbol))
    .map(t => ({
      symbol: t.symbol,
      name: t.name,
      balance: t.balanceFormatted,
      valueUsd: t.valueUsd,
      change24h: t.change24h,
      logoUrl: t.logoUrl,
      denom: t.denom,
      contractAddress: t.denom,
      available: t.available,
      staked: t.staked,
      rewards: t.rewards,
      breakdown: buildTokenBreakdown(t),
    }));
  
  // Update hidden tokens state when they change
  useEffect(() => {
    const updateHiddenTokensState = () => {
      const hiddenList = getHiddenTokens();
      const newDenoms = hiddenList.map(ht => ht.denom);
      
      // Only update if the denoms actually changed (compare by value, not reference)
      setHiddenTokenDenoms(prevDenoms => {
        const prevArray = Array.from(prevDenoms).sort();
        const newArray = [...newDenoms].sort();
        
        // Deep equality check
        const hasChanged = prevArray.length !== newArray.length || 
                          prevArray.some((val, idx) => val !== newArray[idx]);
        
        if (hasChanged) {
          return new Set(newDenoms);
        } else {
          return prevDenoms; // Keep same reference if values unchanged
        }
      });
      
      setHiddenTokenCount(hiddenList.length);
    };
    
    // Initialize on mount
    updateHiddenTokensState();
    
    // Update when event fires
    window.addEventListener('hiddenTokensChanged', updateHiddenTokensState);
    return () => window.removeEventListener('hiddenTokensChanged', updateHiddenTokensState);
  }, []);

  useEffect(() => {
    console.log('🚀 Dashboard mounted, loading data...');
    
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
    
    // Listen for wallet changes with debouncing
    let walletChangeTimeout: NodeJS.Timeout;
    const handleWalletChange = () => {
      console.log("=== WALLET CHANGE EVENT TRIGGERED ===");
      // Debounce wallet changes to prevent excessive API calls
      clearTimeout(walletChangeTimeout);
      walletChangeTimeout = setTimeout(() => {
        // Soft reload: keep UI visible, only refresh data where needed
        loadDashboardData({ soft: true });
      }, 500); // 500ms debounce
    };
    
    // Listen for authentication state changes
    const supabase = createSupabaseClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("=== AUTH STATE CHANGE ===", event, !!session);
      setIsAuthenticated(!!session);
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Check if we just reloaded from sign-in to prevent infinite loop
        const justReloaded = sessionStorage.getItem('justSignedIn');
        
        if (justReloaded) {
          console.log("✅ [Dashboard] Already reloaded after sign-in, skipping reload");
          sessionStorage.removeItem('justSignedIn');
          
          // Just reload the data normally without page reload
          console.log("🔄 [Dashboard] Loading dashboard data after reload...");
          loadDashboardData({ soft: true });
          // Don't call checkForSavePrompt() here - user is already signed in!
          return;
        }
        
        console.log("✅ [Dashboard] User signed in, triggering one-time reload...");
        
        // Set flag to prevent reload loop
        sessionStorage.setItem('justSignedIn', 'true');
        
        // Dispatch event
        window.dispatchEvent(new CustomEvent('walletDatabaseChange', {
          detail: { action: 'signed-in' }
        }));
        
        // Reload page to get fresh data
        setTimeout(() => {
          console.log("🔄 [Dashboard] Reloading page after sign-in...");
          window.location.reload();
        }, 300);
      } else if (event === 'SIGNED_OUT') {
        // Clear all state and reload as anonymous
        console.log("🧹 Clearing dashboard state after sign out");
        setWallets([]);
        setWalletCount(0);
        setTokens([]);
        setTokensByAddress({});
        setTotalValue(0);
        setChange24h(0);
        setShieldNft(null);
        loadDashboardData();
      }
    });
    
    window.addEventListener('walletStorageChange', handleWalletChange);
    window.addEventListener('walletDatabaseChange', handleWalletChange);
    
    return () => {
      window.removeEventListener('walletStorageChange', handleWalletChange);
      window.removeEventListener('walletDatabaseChange', handleWalletChange);
      subscription.unsubscribe();
    };
  }, []); // Empty deps - only run once on mount

  const checkForSavePrompt = async () => {
    // NEVER show save prompt for authenticated users
    const supabase = createSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      console.log("🔒 [Save Prompt] User is authenticated, skipping prompt");
      return;
    }
    
    // Only show save prompt for NON-authenticated users with wallets
    const count = await getWalletCount();
    if (count > 0) {
      // Don't show if user chose "View This Wallet Only" or already dismissed
      const viewOnly = sessionStorage.getItem('viewWalletOnly');
      const dismissed = localStorage.getItem('save_prompt_dismissed');
      
      if (!viewOnly && !dismissed) {
        // Check if any wallet is registered to an account
        const wallets = await getAllWallets();
        let hasRegisteredWallet = false;
        
        for (const wallet of wallets) {
          try {
            const checkRes = await fetch("/api/auth/wallet/check", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ address: wallet.address }),
            });
            
            if (checkRes.ok) {
              const checkData = await checkRes.json();
              if (checkData?.exists) {
                hasRegisteredWallet = true;
                break;
              }
            }
          } catch (error) {
            console.error("Error checking wallet:", error);
          }
        }
        
        setShowSavePrompt(true);
        setHasRegisteredWallet(hasRegisteredWallet);
      }
    }
  };

  const checkForMigration = async () => {
    // Check if authenticated user has wallets in localStorage but not in database
    if (!isAuthenticated) return;

    const anonymousWallets = localStorage.getItem('anonymous_wallets');
    if (!anonymousWallets) return;

    const parsedWallets = JSON.parse(anonymousWallets);
    if (parsedWallets.length === 0) return;

    // Check if user already has wallets in database
    const dbWalletCount = await getWalletCount();
    
    // If user has localStorage wallets but no/few database wallets, show migration prompt
    if (parsedWallets.length > dbWalletCount) {
      const migrationDismissed = localStorage.getItem('migration_prompt_dismissed');
      if (!migrationDismissed) {
        setShowMigrationPrompt(true);
      }
    }
  };

  const loadDashboardData = async (opts?: { soft?: boolean; skipAuthCheck?: boolean; userId?: string }) => {
    const isSoft = !!opts?.soft;
    const skipAuthCheck = !!opts?.skipAuthCheck;
    if (!isSoft) setLoading(true);
    if (isSoft) setRefreshingPrices(true);
    try {
      const supabase = createSupabaseClient();
      
      let user = null;
      
      // If userId is provided, skip auth check (called from onAuthStateChange)
      if (skipAuthCheck && opts?.userId) {
        console.log("🔄 [Dashboard] Skipping auth check, using provided userId:", opts.userId);
        user = { id: opts.userId } as any;
        setIsAuthenticated(true);
      } else {
        // OPTIMIZED: Use timeout for auth check to prevent hanging
        const authPromise = supabase.auth.getSession();
        const authTimeout = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Auth timeout')), 3000)
        );
        
        try {
          const result = await Promise.race([authPromise, authTimeout]);
          user = result.data.session?.user || null;
        } catch (error) {
          console.warn('⚠️ [Dashboard] Auth check timeout, continuing as anonymous');
          user = null;
        }
        setIsAuthenticated(!!user);
      }
      
      // Get user profile if authenticated
      let profile = null;
      if (user && !skipAuthCheck) {
        // Only fetch profile if not skipping auth check (avoids hanging in onAuthStateChange)
        console.log("🔄 [Dashboard] Fetching user profile for:", user.id);
        try {
          const { data: profileData, error: profileError } = await supabase
            .from("user_profiles")
            .select("public_user_id")
            .eq("auth_user_id", user.id)
            .maybeSingle();
          
          if (profileError) {
            console.error("❌ [Dashboard] Profile fetch error:", profileError);
          } else {
            console.log("✅ [Dashboard] Profile fetched:", profileData);
            profile = profileData;
          }
        } catch (error) {
          console.error("❌ [Dashboard] Profile fetch exception:", error);
        }
      } else if (user && skipAuthCheck) {
        console.log("⏭️ [Dashboard] Skipping profile fetch (called from onAuthStateChange)");
      }
      
      // Get all wallets FIRST (works for both authenticated and anonymous users)
      console.log("🔄 [Dashboard] Fetching wallets...");
      const allWallets = await getAllWallets(skipAuthCheck && user ? user.id : undefined);
      console.log("📊 [Dashboard] getAllWallets returned:", allWallets.length, "wallets");
      const count = await getWalletCount();
      console.log("📊 [Dashboard] getWalletCount returned:", count);
      
      setWallets(allWallets);
      setWalletCount(count);

      // ONLY fetch prices and calculate NFT if user has wallets
      if (count > 0) {
        // OPTIMIZED: Use dynamic static fallback prices (last known valid prices)
        const { getStaticFallbackPrice } = await import('@/utils/coreum/price-oracle');
        const { price: staticCorePrice, change24h: staticCoreChange } = getStaticFallbackPrice("CORE");
        
        // Check if user actually owns Shield NFT before showing it (only for authenticated users)
        let userOwnsShieldNft = false;
        if (profile?.public_user_id) {
          userOwnsShieldNft = await hasShieldNft(supabase, profile.public_user_id, "public");
        }
        
        let nftHolding: ShieldNftHolding | null = null;
        if (userOwnsShieldNft) {
          // Show Shield NFT immediately with static price
          nftHolding = getShieldNftHolding(staticCorePrice, staticCoreChange, undefined, 8.5);
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
        const totalWithNft = userOwnsShieldNft ? (nftHolding?.valueUsd || 0) : 0;
        setTotalValue(totalWithNft);
        setChange24h(userOwnsShieldNft ? (nftHolding?.change24h || 0) : 0);
        
        // BACKGROUND: Fetch real prices without blocking UI
        setTimeout(async () => {
          try {
            console.log("🔄 [Background] Fetching real prices...");
            const results = await Promise.allSettled([
              fetchShieldSettings(supabase),
              getTokenPrice("CORE"),
              getTokenChange24h("CORE")
            ]);
            
            const shieldSettings: ShieldSettings | undefined = results[0].status === 'fulfilled' ? results[0].value : undefined;
            const corePrice: number = results[1].status === 'fulfilled' ? results[1].value : staticCorePrice;
            const coreChange: number = results[2].status === 'fulfilled' ? results[2].value : staticCoreChange;

            // Update Shield NFT with real prices (only if user owns it)
            let realNftHolding: ShieldNftHolding | null = null;
            if (userOwnsShieldNft) {
              const coreChange30d = 8.5; // Placeholder: +8.5% over 30 days
              realNftHolding = getShieldNftHolding(corePrice, coreChange, shieldSettings, coreChange30d);
              setShieldNft(realNftHolding);
            }
            
            // Update COREUM price display immediately
            console.log(`💰 [Dashboard] Updating COREUM price display: $${corePrice.toFixed(6)} (${coreChange >= 0 ? '+' : ''}${coreChange.toFixed(2)}%)`);
            setCoreumPrice(corePrice);
            setCoreumChange24h(coreChange);
            
            // Load token prices in background (non-blocking)
            loadTokenPricesWithCacheStrategy(aggregated).then((tokensWithPrices) => {
              console.log("✅ [Background] Price loading completed");
              
              // Update tokens with prices
              setTokens(tokensWithPrices);
              
              // Recalculate totals with actual prices (excluding hidden tokens)
              const totalValueWithPrices = tokensWithPrices.reduce((sum, token) => {
                // Check if token is hidden
                const denom = token.denom || token.symbol;
                if (isTokenHidden(denom)) {
                  console.log(`👁️‍🗨️ Excluding hidden token from total value: ${token.symbol}`);
                  return sum;
                }
                
                const value = isNaN(token.valueUsd) || !isFinite(token.valueUsd) ? 0 : token.valueUsd;
                return sum + value;
              }, 0);
              const totalWithNftAndPrices = totalValueWithPrices + (realNftHolding?.valueUsd || 0);
              setTotalValue(isNaN(totalWithNftAndPrices) ? 0 : totalWithNftAndPrices);
              
              // Calculate weighted average 24h change (including NFT only if owned, excluding hidden tokens)
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
                const nftWeightedChange = realNftHolding ? (realNftHolding.valueUsd / totalWithNftAndPrices) * realNftHolding.change24h : 0;
                setChange24h(tokenWeightedChange + nftWeightedChange);
              }
            }).catch((error) => {
              console.error("❌ [Background] Price loading failed:", error);
            });
          } catch (error) {
            console.error("❌ [Background] Failed to fetch real prices:", error);
          }
        }, 100); // Start background loading after 100ms
      } else {
        setTokens([]);
        setTokensByAddress({});
        // With no wallets, hide Shield NFT and set totals to zero
        setShieldNft(null);
        setTotalValue(0);
        setChange24h(0);
      }
    } catch (error) {
      console.error("❌ [Dashboard] CRITICAL ERROR loading dashboard data:", error);
      console.error("❌ [Dashboard] Error stack:", error instanceof Error ? error.stack : 'No stack trace');
      // Show error state but don't crash
      if (!isSoft) setLoading(false);
      if (isSoft) setRefreshingPrices(false);
    } finally {
      console.log("✅ [Dashboard] loadDashboardData FINISHED");
      if (!isSoft) setLoading(false);
      if (isSoft) setRefreshingPrices(false);
      
      // Check if migration is needed after loading
      if (!isSoft) {
        await checkForMigration();
      }
    }
  };

  const handleConnectionSuccess = () => {
    console.log("=== CONNECTION SUCCESS CALLBACK ===");
    // Soft refresh instead of full-page loading
    loadDashboardData({ soft: true });
    
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

  const handleRefreshPrices = async () => {
    if (refreshingPrices || tokens.length === 0) return;
    
    setRefreshingPrices(true);
    try {
      console.log("🔄 [Portfolio] Manual price refresh triggered");
      const refreshedTokens = await refreshTokenPrices(tokens);
      
      // Update tokens with refreshed prices
      setTokens(refreshedTokens);
      
      // Recalculate totals with refreshed prices (with NaN validation, excluding hidden tokens)
      const totalValueWithPrices = refreshedTokens.reduce((sum, token) => {
        // Check if token is hidden
        const denom = token.denom || token.symbol;
        if (isTokenHidden(denom)) {
          console.log(`👁️‍🗨️ [Refresh] Excluding hidden token from total value: ${token.symbol}`);
          return sum;
        }
        
        const value = isNaN(token.valueUsd) || !isFinite(token.valueUsd) ? 0 : token.valueUsd;
        if (isNaN(token.valueUsd) || !isFinite(token.valueUsd)) {
          console.warn(`⚠️ [Refresh] Invalid valueUsd for ${token.symbol}:`, token.valueUsd, 'balance:', token.balanceFormatted);
        }
        return sum + value;
      }, 0);
      const totalWithNftAndPrices = totalValueWithPrices + (shieldNft?.valueUsd || 0);
      console.log(`💰 [Total Value - Refresh] Tokens: $${totalValueWithPrices.toFixed(2)}, NFT: $${(shieldNft?.valueUsd || 0).toFixed(2)}, Total: $${totalWithNftAndPrices.toFixed(2)}`);
      setTotalValue(isNaN(totalWithNftAndPrices) ? 0 : totalWithNftAndPrices);
      
      // Calculate weighted average 24h change (including NFT, excluding hidden tokens)
      if (totalWithNftAndPrices > 0 && shieldNft) {
        const tokenWeightedChange = refreshedTokens.reduce((acc, token) => {
          // Check if token is hidden
          const denom = token.denom || token.symbol;
          if (isTokenHidden(denom)) {
            return acc; // Skip hidden tokens
          }
          
          const value = isNaN(token.valueUsd) || !isFinite(token.valueUsd) ? 0 : token.valueUsd;
          const weight = value / totalWithNftAndPrices;
          return acc + (token.change24h * weight);
        }, 0);
        const nftWeightedChange = (shieldNft.valueUsd / totalWithNftAndPrices) * shieldNft.change24h;
        setChange24h(tokenWeightedChange + nftWeightedChange);
      }
    } catch (error) {
      console.error("❌ [Portfolio] Price refresh failed:", error);
    } finally {
      setRefreshingPrices(false);
    }
  };

  const handleSavePromptAccept = () => {
    setShowSavePrompt(false);
    // Redirect to sign-in if wallet is registered, otherwise sign-up
    if (hasRegisteredWallet) {
      window.location.href = '/sign-in';
    } else {
      window.location.href = '/sign-up';
    }
  };

  return (
    <main className="min-h-screen neo-gradient-bg p-4 sm:p-6 lg:p-8">
      {/* Auto-connect Keplr wallet after sign-up/sign-in */}
      <AutoConnectWallet />
      
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 
            className="text-4xl sm:text-5xl font-bold mb-3 relative"
            style={{
              textShadow: '0 4px 8px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.3), 0 8px 16px rgba(37,214,149,0.2), 0 -2px 4px rgba(255,255,255,0.1)',
              transform: 'perspective(1000px) translateZ(0)',
              transformStyle: 'preserve-3d'
            }}
          >
            <span 
              className="portfolio-dashboard-animated inline-block bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent"
              style={{
                filter: 'drop-shadow(0 0 20px rgba(37,214,149,0.3))'
              }}
            >
              {"Portfolio Dashboard".split("").map((char, index) => (
                <span
                  key={index}
                  className="portfolio-dashboard-letter"
                  style={{
                    animationDelay: `${index * 0.05}s`,
                    display: char === " " ? "inline" : "inline-block",
                  }}
                >
                  {char === " " ? "\u00A0" : char}
                </span>
              ))}
            </span>
          </h1>
          <p className="text-lg text-gray-400">
            Track your Coreum assets across multiple wallets
          </p>
        </div>

        {/* Save Wallets Prompt for Anonymous Users */}
        {!isAuthenticated && walletCount > 0 && showSavePrompt && (
          <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-1">
                  {hasRegisteredWallet ? "Sign In for Full Access" : "Save Your Portfolio"}
                </h3>
                <p className="text-[#179b69] dark:text-[#25d695]">
                  {hasRegisteredWallet 
                    ? "This wallet is registered to an account. Sign in to access all your features and saved data."
                    : `You have ${walletCount} wallet${walletCount !== 1 ? 's' : ''} connected. Create a free account to save your portfolio permanently.`
                  }
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
                  {hasRegisteredWallet ? "Sign In" : "Create Account"}
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
            loading={false}
            isAuthenticated={isAuthenticated}
            onAddWallet={() => setShowConnectModal(true)}
            onRefresh={hiddenTokenCount}
            onRefreshPrices={handleRefreshPrices}
            refreshingPrices={refreshingPrices}
          />
        </div>

        {/* COREUM Balance Breakdown (render even while data is loading; show zeros until ready) */}
        {walletCount > 0 && (
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
              loading={false}
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
        <div className="card-coreum p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gradient-coreum">
              Token Holdings
            </h2>
            {hiddenTokenCount > 0 && (
              <button
                onClick={() => setShowHiddenTokens(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors group"
                title="View hidden tokens"
              >
                <IoEyeOffOutline className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100">
                  Hidden Tokens ({hiddenTokenCount})
                </span>
              </button>
            )}
          </div>
          <TokenTable 
            tokens={visibleTokens}
            loading={false}
          />
        </div>
      </div>

      {/* Wallet Connect Modal */}
      <WalletConnectModal
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        onSuccess={handleConnectionSuccess}
      />

      {/* Wallet Migration Modal */}
      <WalletMigrationModal
        isOpen={showMigrationPrompt}
        walletCount={walletCount}
        onSuccess={() => {
          setShowMigrationPrompt(false);
          loadDashboardData();
        }}
        onDismiss={() => setShowMigrationPrompt(false)}
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
                className="flex-1 btn-coreum-green"
              >
                Create Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Tokens List Modal */}
      <HiddenTokensList 
        isOpen={showHiddenTokens}
        onClose={() => setShowHiddenTokens(false)}
      />
    </main>
  );
}

export default function Dashboard() {
  return (
    <ErrorBoundary>
      <DashboardContent />
    </ErrorBoundary>
  );
}