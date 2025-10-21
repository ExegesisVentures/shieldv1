"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { IoTrophy, IoCash, IoRefresh, IoChevronDown, IoAlertCircle, IoHelpCircle, IoCopy, IoCheckmark, IoChevronUp } from "react-icons/io5";
import { ThreeArrowSpinner } from "@/components/ui/ThreeArrowSpinner";
import { Card } from "@/components/ui/card";
import CollapsibleWalletCard from "./CollapsibleWalletCard";
import RewardsProgressModal from "./RewardsProgressModal";
import TimerRefreshButton from "./TimerRefreshButton";
import { formatAddressSnippet } from "@/utils/address-utils";

interface PortfolioTotalsProps {
  totalValue?: number;
  change24h?: number;
  walletCount?: number;
  walletAddresses?: string[]; // User's connected wallet addresses
  loading?: boolean;
  isAuthenticated?: boolean; // NEW: Only show historical rewards if authenticated
  onAddWallet?: () => void;
  onRefresh?: number;
  onRefreshPrices?: () => void;
  refreshingPrices?: boolean;
}

export default function PortfolioTotals({
  totalValue = 0,
  change24h = 0,
  walletCount = 0,
  walletAddresses = [],
  loading = false,
  isAuthenticated = false,
  onAddWallet,
  onRefresh,
  onRefreshPrices,
  refreshingPrices = false,
}: PortfolioTotalsProps) {
  const [totalRewards, setTotalRewards] = useState<number>(0);
  const [walletRewards, setWalletRewards] = useState<Array<{
    address: string;
    rewards: string;
    isStale: boolean;
    hoursSinceUpdate?: number;
  }>>([]);
  const [rewardsLoading, setRewardsLoading] = useState(false);
  const [rewardsRefreshing, setRewardsRefreshing] = useState(false);
  const [isStale, setIsStale] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const rewardsCardRef = useRef<HTMLDivElement>(null);
  const [rateLimitMessage, setRateLimitMessage] = useState<string | null>(null);
  const [hoursUntilRefresh, setHoursUntilRefresh] = useState<number | null>(null);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [longRunningQuery, setLongRunningQuery] = useState(false);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [realTimeProgress, setRealTimeProgress] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState<string>("Initializing...");
  const [showProgressInMainBox, setShowProgressInMainBox] = useState<boolean>(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [currencyPrices, setCurrencyPrices] = useState<Record<string, number>>({});
  const totalValueCardRef = useRef<HTMLDivElement>(null);
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Top 10 most popular fiat currencies
  const currencies = [
    { symbol: 'USD', name: 'US Dollar', icon: '$' },
    { symbol: 'EUR', name: 'Euro', icon: '€' },
    { symbol: 'GBP', name: 'British Pound', icon: '£' },
    { symbol: 'JPY', name: 'Japanese Yen', icon: '¥' },
    { symbol: 'CAD', name: 'Canadian Dollar', icon: 'C$' },
    { symbol: 'AUD', name: 'Australian Dollar', icon: 'A$' },
    { symbol: 'CHF', name: 'Swiss Franc', icon: 'CHF' },
    { symbol: 'CNY', name: 'Chinese Yuan', icon: '¥' },
    { symbol: 'INR', name: 'Indian Rupee', icon: '₹' },
    { symbol: 'BRL', name: 'Brazilian Real', icon: 'R$' }
  ];

  const handleCopyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };

  // Fetch currency exchange rates from CoinGecko API
  const fetchCurrencyPrices = async () => {
    try {
      // CoinGecko supported currencies (fiat only for our use case)
      const supportedCurrencies = [
        'usd', 'eur', 'gbp', 'jpy', 'cad', 'aud', 'chf', 'cny', 'sek', 'nzd', 
        'mxn', 'sgd', 'hkd', 'nok', 'try', 'rub', 'inr', 'brl', 'zar', 'krw', 
        'pln', 'ils', 'dkk', 'twd', 'thb', 'myr', 'php', 'czk', 'huf', 'idr', 
        'clp', 'pkr', 'aed', 'sar', 'bhd', 'kwd', 'gel', 'mmk', 'vnd', 'lkr', 
        'bdt', 'xdr', 'xag', 'xau'
      ];
      
      // Use CoinGecko API to get USD rates for all supported currencies
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=usd-coin&vs_currencies=${supportedCurrencies.join(',')}`,
        {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
          }
        }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      const prices: Record<string, number> = { USD: 1 };
      
      // Map CoinGecko response to our currency symbols
      if (data['usd-coin']) {
        const rates = data['usd-coin'];
        
        // Convert CoinGecko format to our format
        const currencyMapping: Record<string, string> = {
          'EUR': 'eur',
          'GBP': 'gbp', 
          'JPY': 'jpy',
          'CAD': 'cad',
          'AUD': 'aud',
          'CHF': 'chf',
          'CNY': 'cny',
          'SEK': 'sek',
          'NZD': 'nzd',
          'MXN': 'mxn',
          'SGD': 'sgd',
          'HKD': 'hkd',
          'NOK': 'nok',
          'TRY': 'try',
          'RUB': 'rub',
          'INR': 'inr',
          'BRL': 'brl',
          'ZAR': 'zar',
          'KRW': 'krw',
          'PLN': 'pln',
          'ILS': 'ils',
          'DKK': 'dkk',
          'TWD': 'twd',
          'THB': 'thb',
          'MYR': 'myr',
          'PHP': 'php',
          'CZK': 'czk',
          'HUF': 'huf',
          'IDR': 'idr',
          'CLP': 'clp',
          'PKR': 'pkr',
          'AED': 'aed',
          'SAR': 'sar',
          'BHD': 'bhd',
          'KWD': 'kwd',
          'GEL': 'gel',
          'MMK': 'mmk',
          'VND': 'vnd',
          'LKR': 'lkr',
          'BDT': 'bdt'
        };
        
        Object.entries(currencyMapping).forEach(([symbol, coinGeckoKey]) => {
          if (rates[coinGeckoKey]) {
            prices[symbol] = rates[coinGeckoKey];
          }
        });
      }
      
      console.log('💱 Fetched currency rates from CoinGecko:', prices);
      setCurrencyPrices(prices);
      
    } catch (error) {
      console.error('Failed to fetch currency rates from CoinGecko:', error);
      
      // Enhanced fallback rates with more currencies
      const fallbackRates: Record<string, number> = {
        USD: 1,
        EUR: 0.857,
        GBP: 0.745,
        JPY: 150.39,
        CAD: 1.4,
        AUD: 1.52,
        CHF: 0.88,
        CNY: 7.24,
        SEK: 10.8,
        NZD: 1.61,
        MXN: 17.1,
        SGD: 1.35,
        HKD: 7.83,
        NOK: 10.8,
        TRY: 30.1,
        RUB: 92.5,
        INR: 83.1,
        BRL: 5.05,
        ZAR: 18.7,
        KRW: 1330.0,
        PLN: 4.0,
        ILS: 3.66,
        DKK: 6.9,
        TWD: 31.4,
        THB: 35.9,
        MYR: 4.7,
        PHP: 56.0,
        CZK: 22.7,
        HUF: 360.0,
        IDR: 15600.0,
        CLP: 920.0,
        PKR: 278.0,
        AED: 3.67,
        SAR: 3.75,
        BHD: 0.377,
        KWD: 0.307,
        GEL: 2.65,
        MMK: 2100.0,
        VND: 24300.0,
        LKR: 325.0,
        BDT: 110.0
      };
      
      console.log('💱 Using fallback currency rates:', fallbackRates);
      setCurrencyPrices(fallbackRates);
    }
  };

  // Convert total value to selected currency
  const getConvertedValue = () => {
    if (selectedCurrency === 'USD') return totalValue;
    const price = currencyPrices[selectedCurrency];
    if (!price) {
      console.warn(`Currency ${selectedCurrency} not supported, falling back to USD`);
      return totalValue;
    }
    return totalValue / price;
  };

  // Format value based on currency
  const formatValue = (value: number) => {
    const currency = currencies.find(c => c.symbol === selectedCurrency);
    
    // For JPY, show no decimal places (standard for Japanese Yen)
    if (selectedCurrency === 'JPY') {
      return `${currency?.icon || selectedCurrency} ${Math.round(value).toLocaleString("en-US")}`;
    }
    
    // For all other fiat currencies, show 2 decimal places
    return `${currency?.icon || selectedCurrency} ${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Fetch currency prices on mount
  useEffect(() => {
    fetchCurrencyPrices();
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (dropdownTimeoutRef.current) {
        clearTimeout(dropdownTimeoutRef.current);
      }
    };
  }, []);

  // Close currency dropdown on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (showCurrencyDropdown) {
        console.log("📜 Scroll detected, closing currency dropdown");
        setShowCurrencyDropdown(false);
      }
    };

    if (showCurrencyDropdown) {
      window.addEventListener('scroll', handleScroll, true); // Use capture phase to catch all scrolls
      return () => window.removeEventListener('scroll', handleScroll, true);
    }
  }, [showCurrencyDropdown]);

  // Close rewards dropdown on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (showDropdown) {
        console.log("📜 Scroll detected, closing rewards dropdown");
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      window.addEventListener('scroll', handleScroll, true); // Use capture phase to catch all scrolls
      return () => window.removeEventListener('scroll', handleScroll, true);
    }
  }, [showDropdown]);

  // Fetch rewards only when wallets are available AND user is authenticated
  useEffect(() => {
    if (isAuthenticated && walletAddresses.length > 0 && !rewardsLoading) {
      // Always fetch to get the latest data, but the API will be smart about what needs refreshing
      fetchUserRewards();
    }
  }, [walletAddresses, isAuthenticated]);

  // Polling function to check for completion when request times out
  const startPolling = () => {
    if (pollingInterval) return; // Already polling
    
    const startTime = Date.now();
    const estimatedDuration = 15 * 60 * 1000; // 15 minutes estimated
    
    const interval = setInterval(async () => {
      console.log("🔄 [Historical Rewards] Polling for completion...");
      
      // Calculate progress based on elapsed time
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / estimatedDuration) * 100, 95); // Cap at 95% until complete
      setRealTimeProgress(progress);
      
      // Update step based on progress
      if (progress < 20) {
        setCurrentStep("Connecting to blockchain");
      } else if (progress < 40) {
        setCurrentStep("Scanning transaction history");
      } else if (progress < 70) {
        setCurrentStep("Processing reward transactions");
      } else if (progress < 90) {
        setCurrentStep("Calculating totals");
      } else {
        setCurrentStep("Updating database");
      }
      
      // Progress tracking is now simplified - just show the message
      
      try {
        const addressesParam = walletAddresses.join(',');
        const response = await fetch(`/api/coreum/user-rewards?addresses=${addressesParam}`);
        const data = await response.json();
        
        if (data.success && data.data && data.refreshed) {
          console.log("✅ [Historical Rewards] Polling found completed data!");
          const rewardsCore = parseFloat(data.data.total) / 1_000_000;
          setTotalRewards(rewardsCore);
          setWalletRewards(data.data.wallets || []);
          setIsStale(data.data.anyStale || false);
          
          // Set to 100% and complete step
          setRealTimeProgress(100);
          setCurrentStep("Complete! Your balance has been updated.");
          
          // Stop polling and hide progress
          clearInterval(interval);
          setPollingInterval(null);
          setLongRunningQuery(false);
          setRewardsRefreshing(false);
          setShowProgressInMainBox(false);
          // Don't auto-close modal - let user close manually
        }
      } catch (error) {
        console.error("❌ [Historical Rewards] Polling error:", error);
      }
    }, 10000); // Poll every 10 seconds
    
    setPollingInterval(interval);
  };

  const stopPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  const fetchUserRewards = async (forceRefresh: boolean = false) => {
    if (walletAddresses.length === 0) {
      console.log('📊 [Historical Rewards] No wallet addresses to fetch');
      return;
    }
    
    if (forceRefresh) {
      console.log(`🔄 [Historical Rewards] Manual refresh requested for ${walletAddresses.length} wallet(s)`);
      setRewardsRefreshing(true);
      
      // Show progress modal for refresh operations (likely to be long-running)
      setShowProgressModal(true);
      setLongRunningQuery(true);
      setRealTimeProgress(0);
      setCurrentStep("Initializing...");
      setShowProgressInMainBox(false);
    } else {
      console.log(`📊 [Historical Rewards] Loading cached data for ${walletAddresses.length} wallet(s)`);
      setRewardsLoading(true);
    }
    
    setRateLimitMessage(null);
    
    try {
      const addressesParam = walletAddresses.join(',');
      const url = `/api/coreum/user-rewards?addresses=${addressesParam}${forceRefresh ? '&refresh=true' : ''}`;
      console.log(`📡 [Historical Rewards] Fetching from: ${url}`);
      
      // For refresh operations, use a longer timeout
      const controller = new AbortController();
      const timeoutId = forceRefresh ? 
        setTimeout(() => controller.abort(), 20 * 60 * 1000) : // 20 minutes for refresh
        setTimeout(() => controller.abort(), 30 * 1000); // 30 seconds for normal fetch
      
      const response = await fetch(url, { 
        signal: controller.signal,
        // Keep the connection alive for long-running requests
        headers: {
          'Connection': 'keep-alive',
        }
      });
      
      clearTimeout(timeoutId);
      const data = await response.json();
      
      console.log(`📥 [Historical Rewards] Response:`, data);
      
      if (data.success && data.data) {
        // Convert ucore to CORE
        const rewardsCore = parseFloat(data.data.total) / 1_000_000;
        console.log(`✅ [Historical Rewards] Total: ${rewardsCore.toFixed(2)} CORE across ${data.data.walletCount} wallet(s)`);
        
        setTotalRewards(rewardsCore);
        setWalletRewards(data.data.wallets || []);
        setIsStale(data.data.anyStale || false);
        
        if (data.data.anyStale) {
          console.log(`⚠️ [Historical Rewards] Some wallets have stale data (>36h old)`);
        }
        
        // If this was a refresh and we got data, update the progress to 100% but keep modal open
        if (forceRefresh && data.refreshed) {
          setRealTimeProgress(100);
          setCurrentStep("Complete! Your balance has been updated.");
          setShowProgressInMainBox(false);
          // Don't auto-close - let user close manually
        }
      }
      
      if (data.rateLimited) {
        console.warn(`⏰ [Historical Rewards] Rate limited:`, data.message);
        setRateLimitMessage(data.message || "Rate limited. Try again later.");
        setHoursUntilRefresh(data.hoursUntilNextRefresh || null);
        setShowProgressModal(false);
        setLongRunningQuery(false);
      } else {
        // Clear rate limit state if not rate limited
        setHoursUntilRefresh(null);
      }
    } catch (error) {
      console.error("❌ [Historical Rewards] Failed to fetch:", error);
      
      // If it's a timeout error and we're in a long-running query, start polling
      if (error instanceof Error && error.name === 'AbortError' && longRunningQuery) {
        console.log("⏰ [Historical Rewards] Request timed out, starting polling for completion...");
        startPolling();
        return;
      }
      
      setShowProgressModal(false);
      setLongRunningQuery(false);
    } finally {
      setRewardsLoading(false);
      // Only stop refreshing if we're not in a long-running query
      if (!longRunningQuery) {
        setRewardsRefreshing(false);
      }
    }
  };

  const handleRefreshRewards = () => {
    console.log('🖱️ [Historical Rewards] Refresh button clicked');
    fetchUserRewards(true);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} variant="glass" className="p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-36"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
      {/* Total Value */}
      <Card 
        ref={totalValueCardRef}
        variant="neo-purple" 
        className="pt-6 pb-8 px-8 group cursor-pointer relative z-0"
        onMouseEnter={() => {
          console.log('🖱️ Total Value card mouse enter');
          if (dropdownTimeoutRef.current) {
            clearTimeout(dropdownTimeoutRef.current);
            dropdownTimeoutRef.current = null;
          }
          setShowCurrencyDropdown(true);
        }}
        onMouseLeave={() => {
          console.log('🖱️ Total Value card mouse leave');
          dropdownTimeoutRef.current = setTimeout(() => {
            setShowCurrencyDropdown(false);
          }, 100); // Small delay to allow moving to dropdown
        }}
      >
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <p className="text-base md:text-lg font-medium text-gray-600 dark:text-gray-400">
              Total Value
            </p>
            {onRefreshPrices && (
              <button
                onClick={onRefreshPrices}
                disabled={refreshingPrices}
                className="p-1 hover:bg-white/20 rounded-full transition-colors disabled:opacity-50"
                title="Refresh prices"
              >
                {refreshingPrices ? (
                  <ThreeArrowSpinner 
                    size="sm" 
                    variant="default"
                    className="animate-spin"
                  />
                ) : (
                  <IoRefresh className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                )}
              </button>
            )}
            {showCurrencyDropdown ? (
              <IoChevronUp className="w-3 h-3 text-gray-600 dark:text-gray-400" />
            ) : (
              <IoChevronDown className="w-3 h-3 text-gray-600 dark:text-gray-400" />
            )}
          </div>
          <h3 className="text-4xl font-bold text-gray-900 dark:text-white">
            {formatValue(getConvertedValue())}
          </h3>
        </div>

        {/* Currency Dropdown */}
        {showCurrencyDropdown && createPortal(
          <div 
            className="fixed bg-white dark:bg-gray-800 rounded-xl shadow-2xl border-2 border-green-200 dark:border-green-700 p-4 z-[999998] animate-in slide-in-from-top-2 duration-200"
            style={{
              top: totalValueCardRef.current ? totalValueCardRef.current.getBoundingClientRect().bottom + 4 : '50%',
              left: totalValueCardRef.current ? totalValueCardRef.current.getBoundingClientRect().left : '50%',
              width: totalValueCardRef.current ? totalValueCardRef.current.getBoundingClientRect().width : '300px'
            }}
            onMouseEnter={() => {
              console.log('🖱️ Currency dropdown mouse enter');
              if (dropdownTimeoutRef.current) {
                clearTimeout(dropdownTimeoutRef.current);
                dropdownTimeoutRef.current = null;
              }
              setShowCurrencyDropdown(true);
            }}
            onMouseLeave={() => {
              console.log('🖱️ Currency dropdown mouse leave');
              dropdownTimeoutRef.current = setTimeout(() => {
                setShowCurrencyDropdown(false);
              }, 100);
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-gray-900 dark:text-white">Select Currency</p>
              <span className="text-xs text-gray-500 dark:text-gray-400">Hover to switch</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {currencies.map((currency) => {
                const isSupported = currencyPrices[currency.symbol] !== undefined;
                const isSelected = selectedCurrency === currency.symbol;
                
                return (
                  <button
                    key={currency.symbol}
                    onClick={() => isSupported && setSelectedCurrency(currency.symbol)}
                    disabled={!isSupported}
                    className={`p-3 rounded-lg text-left transition-colors ${
                      isSelected
                        ? 'bg-green-100 dark:bg-green-900/30 border-2 border-green-300 dark:border-green-600'
                        : isSupported
                        ? 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 border-2 border-transparent'
                        : 'bg-gray-100 dark:bg-gray-800/50 border-2 border-gray-200 dark:border-gray-600 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold">{currency.icon}</span>
                      <div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                          {currency.symbol}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {isSupported ? currency.name : 'Coming Soon'}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )}
      </Card>

      {/* Total Rewards Earned - Only for Authenticated Users */}
      {isAuthenticated ? (
        <Card 
          ref={rewardsCardRef}
          variant="neo-green" 
          className="pt-6 pb-8 px-8 group relative z-10"
          onMouseEnter={() => {
            console.log('🖱️ Mouse enter - walletCount:', walletCount, 'walletRewards.length:', walletRewards.length);
            if (walletCount > 1) {
              console.log('✅ Setting showDropdown to true');
              setShowDropdown(true);
            }
          }}
          onMouseLeave={() => {
            console.log('🖱️ Mouse leave - setting showDropdown to false');
            setShowDropdown(false);
          }}
        >
          <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <p className="text-base md:text-lg font-medium text-gray-600 dark:text-gray-400">
              Total Rewards Earned
            </p>
            
            {/* Timer-based refresh button */}
            <TimerRefreshButton
              hoursUntilRefresh={hoursUntilRefresh}
              isRefreshing={rewardsRefreshing}
              isStale={isStale}
              onRefresh={handleRefreshRewards}
              disabled={walletAddresses.length === 0}
            />
            
            {walletCount > 1 && (
              <IoChevronDown className={`w-3 h-3 text-gray-600 dark:text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
            )}
          </div>
          <div className="flex items-center justify-center gap-3">
            <img 
              src="/tokens/CoreumLogo (3).svg" 
              alt="CORE" 
              className="w-10 h-10"
            />
            {rewardsLoading ? (
              <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-10 w-32 rounded"></div>
            ) : (
              <h3 className="text-4xl font-bold" style={{ color: '#25D695' }}>
                {totalRewards.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            )}
          </div>
        </div>

        {/* Progress Display in Main Box */}
        {showProgressInMainBox && (
          <div className="mt-4 p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-lg md:text-xl text-blue-800 dark:text-blue-200 text-center font-medium leading-relaxed">
              <strong>We will show your balance here once complete.</strong>
            </p>
            <p className="text-base md:text-lg text-blue-700 dark:text-blue-300 text-center mt-2">
              Processing your historical rewards in the background...
            </p>
          </div>
        )}

        {/* Dropdown for multi-wallet breakdown */}
        {(() => {
          console.log('🔍 Dropdown render check:', { showDropdown, walletCount, walletRewardsLength: walletRewards.length });
          return showDropdown && walletCount > 1 && walletRewards.length > 0;
        })() && createPortal(
          <div 
            className="fixed bg-white dark:bg-gray-800 rounded-xl shadow-2xl border-2 border-green-200 dark:border-green-700 p-5 z-[999998] animate-in slide-in-from-top-2 duration-200 max-h-[70vh] overflow-y-auto"
            style={{
              top: rewardsCardRef.current ? rewardsCardRef.current.getBoundingClientRect().bottom + 8 : '50%',
              left: rewardsCardRef.current ? rewardsCardRef.current.getBoundingClientRect().left : '50%',
              minWidth: '400px',
              maxWidth: '600px'
            }}
            onMouseEnter={() => setShowDropdown(true)}
            onMouseLeave={() => setShowDropdown(false)}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-gray-900 dark:text-white">Per-Wallet Breakdown</p>
              <span className="text-xs text-gray-500 dark:text-gray-400">{walletRewards.length} wallet{walletRewards.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="space-y-3">
              {walletRewards.map((wallet) => (
                <div key={wallet.address} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex items-center gap-3 flex-1">
                    <img 
                      src="/tokens/CoreumLogo (3).svg" 
                      alt="CORE" 
                      className="w-8 h-8 rounded-lg"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white block">
                        {formatAddressSnippet(wallet.address)}
                      </span>
                      {wallet.isStale && (
                        <div className="flex items-center gap-1 mt-1">
                          <IoAlertCircle className="w-3 h-3 text-orange-500" />
                          <span className="text-xs text-orange-600 dark:text-orange-400">
                            Stale ({wallet.hoursSinceUpdate}h old)
                          </span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleCopyAddress(wallet.address)}
                      className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                      title="Copy address"
                    >
                      {copiedAddress === wallet.address ? (
                        <IoCheckmark className="w-4 h-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <IoCopy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      )}
                    </button>
                  </div>
                  <div className="text-right ml-3">
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">
                      {(parseFloat(wallet.rewards) / 1_000_000).toLocaleString("en-US", { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      })}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">CORE</div>
                  </div>
                </div>
              ))}
            </div>
          </div>,
          document.body
        )}
        </Card>
      ) : (
        /* Sign In Prompt for Anonymous Users */
        <Card 
          variant="neo-green" 
          className="pt-6 pb-8 px-8"
        >
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <p className="text-base md:text-lg font-medium text-gray-600 dark:text-gray-400">
                Historical Rewards
              </p>
            </div>
            <div className="flex flex-col items-center justify-center gap-3">
              <IoTrophy className="w-16 h-16 text-gray-300 dark:text-gray-600" />
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                Sign in to view your lifetime rewards history
              </p>
              <a
                href="/sign-in"
                className="mt-2 px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all"
              >
                Sign In to View
              </a>
            </div>
          </div>
        </Card>
      )}

      {/* Connected Wallets Column */}
      <CollapsibleWalletCard
        walletCount={walletCount}
        loading={loading}
        onAddWallet={onAddWallet || (() => {})}
        onRefresh={onRefresh}
      />
    </div>

    {/* Progress Modal for Long-Running Queries */}
    {showProgressModal && (
      <RewardsProgressModal
        isOpen={showProgressModal}
        onClose={() => {
          setShowProgressModal(false);
          // If we're still processing, show progress in main box
          if (longRunningQuery) {
            setShowProgressInMainBox(true);
          }
        }}
        walletAddress={walletAddresses[0] || ''}
        estimatedTime="5-15 minutes"
        realProgress={realTimeProgress}
        currentStep={currentStep}
      />
    )}
    </>
  );
}

