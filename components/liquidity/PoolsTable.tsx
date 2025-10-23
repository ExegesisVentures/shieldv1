"use client";

import { useState, useEffect, useMemo } from "react";
import { IoTrendingUp, IoWater, IoLockClosed, IoRefresh, IoSearch, IoChevronBack, IoChevronForward } from "react-icons/io5";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchLiquidityPools, type LiquidityPool } from "@/utils/coreum/liquidity-pools";
import { AnimatedCurrency } from "@/components/ui/AnimatedNumber";
import ComingSoonModal from "@/components/modals/ComingSoonModal";

interface PoolsTableProps {
  pools?: LiquidityPool[];
  loading?: boolean;
}

export default function PoolsTable({ pools: propPools = [], loading = false }: PoolsTableProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [apiPools, setApiPools] = useState<LiquidityPool[]>([]);
  const [isLoadingPools, setIsLoadingPools] = useState(false);
  const [totalPools, setTotalPools] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false); // Track if we've loaded once
  const [isBackgroundRefreshing, setIsBackgroundRefreshing] = useState(false);
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);
  const [comingSoonFeature, setComingSoonFeature] = useState<"add" | "trade">("add");

  // Mock data for fallback
  const mockPools: LiquidityPool[] = [
    {
      id: "1",
      contractAddress: "core1mockcontract1",
      factoryAddress: "core1mockfactory",
      dexName: "Cruise Control",
      token0: "ucore",
      token1: "ibc/F082B65C88E4B6D5EF1DB243CDA1D331D002759E938A0F5CD3FFDC5D53B3E349",
      token0Symbol: "CORE",
      token1Symbol: "USDC",
      tvl: 1250000,
      apy: 45.8,
      volume24h: 125000,
      fees24h: 375,
      liquidity: 1250000,
      reserve0: "10000000",
      reserve1: "1200000",
      price0: 0.12,
      price1: 1.0,
      change24h: 2.5,
      poolType: 'xyk',
      feeTier: 0.3,
      createdAt: '2024-01-15T10:00:00Z',
      lastUpdated: '2024-10-13T08:00:00Z',
    },
    {
      id: "2",
      contractAddress: "core1mockcontract2",
      factoryAddress: "core1mockfactory",
      dexName: "Cruise Control",
      token0: "ucore",
      token1: "ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2",
      token0Symbol: "CORE",
      token1Symbol: "ATOM",
      tvl: 850000,
      apy: 38.2,
      volume24h: 95000,
      fees24h: 285,
      liquidity: 850000,
      reserve0: "7000000",
      reserve1: "100000",
      price0: 0.12,
      price1: 8.5,
      change24h: -1.2,
      poolType: 'xyk',
      feeTier: 0.3,
      createdAt: '2024-01-20T14:30:00Z',
      lastUpdated: '2024-10-13T08:00:00Z',
    },
    {
      id: "3",
      contractAddress: "core1mockcontract3",
      factoryAddress: "core1mockfactory",
      dexName: "Pulsara",
      token0: "drop-core1zhs909jp9yktml6qqx9f0ptcq2xnhhj99cja03j3lfcsp2pgm86studdrz",
      token1: "ibc/F082B65C88E4B6D5EF1DB243CDA1D331D002759E938A0F5CD3FFDC5D53B3E349",
      token0Symbol: "XRP",
      token1Symbol: "USDC",
      tvl: 2100000,
      apy: 12.5,
      volume24h: 450000,
      fees24h: 1350,
      liquidity: 2100000,
      reserve0: "4000000",
      reserve1: "2100000",
      price0: 0.52,
      price1: 1.0,
      change24h: 0.8,
      poolType: 'xyk',
      feeTier: 0.3,
      createdAt: '2024-02-01T09:15:00Z',
      lastUpdated: '2024-10-13T08:00:00Z',
    },
    {
      id: "4",
      contractAddress: "core1mockcontract4",
      factoryAddress: "core1mockfactory",
      dexName: "Cruise Control",
      token0: "solo-token",
      token1: "ucore",
      token0Symbol: "SOLO",
      token1Symbol: "CORE",
      tvl: 320000,
      apy: 28.7,
      volume24h: 67000,
      fees24h: 201,
      liquidity: 320000,
      reserve0: "6400000",
      reserve1: "2666667",
      price0: 0.05,
      price1: 0.12,
      change24h: 5.2,
      poolType: 'xyk',
      feeTier: 0.3,
      createdAt: '2024-02-10T16:45:00Z',
      lastUpdated: '2024-10-13T08:00:00Z',
    },
    {
      id: "5",
      contractAddress: "core1mockcontract5",
      factoryAddress: "core1mockfactory",
      dexName: "Pulsara",
      token0: "ibc/F082B65C88E4B6D5EF1DB243CDA1D331D002759E938A0F5CD3FFDC5D53B3E349",
      token1: "ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2",
      token0Symbol: "USDC",
      token1Symbol: "ATOM",
      tvl: 1800000,
      apy: 15.3,
      volume24h: 280000,
      fees24h: 840,
      liquidity: 1800000,
      reserve0: "1800000",
      reserve1: "211765",
      price0: 1.0,
      price1: 8.5,
      change24h: -0.5,
      poolType: 'xyk',
      feeTier: 0.3,
      createdAt: '2024-02-15T11:20:00Z',
      lastUpdated: '2024-10-13T08:00:00Z',
    },
    {
      id: "6",
      contractAddress: "core1mockcontract6",
      factoryAddress: "core1mockfactory",
      dexName: "Cruise Control",
      token0: "ucore",
      token1: "osmo-token",
      token0Symbol: "CORE",
      token1Symbol: "OSMO",
      tvl: 750000,
      apy: 22.1,
      volume24h: 120000,
      fees24h: 360,
      liquidity: 750000,
      reserve0: "6250000",
      reserve1: "882353",
      price0: 0.12,
      price1: 0.85,
      change24h: 1.8,
      poolType: 'xyk',
      feeTier: 0.3,
      createdAt: '2024-02-20T13:10:00Z',
      lastUpdated: '2024-10-13T08:00:00Z',
    },
  ];

  // Load pools from API (with cache support)
  const loadPools = async (
    page: number = 1, 
    limit: number = itemsPerPage, 
    search: string = searchQuery,
    useCache: boolean = true
  ) => {
    // Prevent duplicate fetches
    if (isLoadingPools) {
      console.log('⏭️  [PoolsTable] Skipping duplicate fetch request');
      return;
    }

    setIsLoadingPools(true);
    try {
      const response = await fetchLiquidityPools(page, limit, search, useCache);
      setApiPools(response.pools);
      setTotalPools(response.total);
      setHasMore(response.hasMore);
      setCurrentPage(page);
      setHasLoadedOnce(true);
    } catch (error) {
      console.error('Failed to load pools:', error);
      // Fallback to mock data only if we haven't loaded anything yet
      if (!hasLoadedOnce) {
        setApiPools(mockPools);
        setTotalPools(mockPools.length);
        setHasMore(false);
        setCurrentPage(1);
      }
    } finally {
      setIsLoadingPools(false);
    }
  };

  // Background refresh (doesn't show loading state)
  const backgroundRefresh = async () => {
    if (isBackgroundRefreshing || isLoadingPools) {
      console.log('⏭️  [PoolsTable] Skipping background refresh - already refreshing');
      return;
    }

    setIsBackgroundRefreshing(true);
    try {
      console.log('🔄 [PoolsTable] Background refresh started');
      const response = await fetchLiquidityPools(currentPage, itemsPerPage, searchQuery, false);
      setApiPools(response.pools);
      setTotalPools(response.total);
      setHasMore(response.hasMore);
      console.log('✅ [PoolsTable] Background refresh complete');
    } catch (error) {
      console.error('❌ [PoolsTable] Background refresh failed:', error);
    } finally {
      setIsBackgroundRefreshing(false);
    }
  };

  // Use prop pools if provided, otherwise use API/mock pools
  const allPools = propPools.length > 0 ? propPools : apiPools;

  // Filter pools based on search query
  const filteredPools = useMemo(() => {
    if (!searchQuery.trim()) return allPools;
    
    const query = searchQuery.toLowerCase();
    return allPools.filter(pool => 
      pool.token0Symbol.toLowerCase().includes(query) ||
      pool.token1Symbol.toLowerCase().includes(query) ||
      `${pool.token0Symbol}/${pool.token1Symbol}`.toLowerCase().includes(query)
    );
  }, [allPools, searchQuery]);

  // Paginate filtered pools
  const paginatedPools = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredPools.slice(startIndex, endIndex);
  }, [filteredPools, currentPage, itemsPerPage]);

  // Calculate pagination info
  const totalPages = Math.ceil(filteredPools.length / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, filteredPools.length);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Force fresh data (no cache)
    await loadPools(currentPage, itemsPerPage, searchQuery, false);
    setLastUpdated(new Date());
    setIsRefreshing(false);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleItemsPerPageChange = (value: string) => {
    const newItemsPerPage = parseInt(value);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleAddClick = () => {
    setComingSoonFeature("add");
    setShowComingSoonModal(true);
  };

  const handleTradeClick = () => {
    setComingSoonFeature("trade");
    setShowComingSoonModal(true);
  };

  // Set client flag to prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load pools on component mount (only once)
  useEffect(() => {
    if (!isClient) return;
    
    if (propPools.length === 0 && !hasLoadedOnce) {
      // Initial load with cache
      loadPools(1, itemsPerPage, searchQuery, true);
      setLastUpdated(new Date());
      
      // Start background refresh after 2 seconds
      const refreshTimer = setTimeout(() => {
        backgroundRefresh();
      }, 2000);
      
      return () => clearTimeout(refreshTimer);
    } else if (propPools.length > 0) {
      // If prop pools are provided, use them and set up pagination
      setApiPools(propPools);
      setTotalPools(propPools.length);
      setHasMore(false);
      setHasLoadedOnce(true);
      setLastUpdated(new Date());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient]);

  // Reload pools when items per page changes (only if already loaded)
  useEffect(() => {
    if (propPools.length === 0 && hasLoadedOnce && !isLoadingPools) {
      loadPools(1, itemsPerPage, searchQuery, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsPerPage]);

  if (loading || isLoadingPools) {
    return (
      <Card className="overflow-hidden">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="p-6 bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-900/50 border-2 border-gray-200 dark:border-gray-700">
                {/* Header skeleton */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex -space-x-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-200 to-blue-200 dark:from-purple-800 dark:to-blue-800 animate-pulse"></div>
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-200 to-emerald-200 dark:from-green-800 dark:to-emerald-800 animate-pulse"></div>
                  </div>
                  <div className="flex-1">
                    <div className="h-6 w-28 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse mb-2"></div>
                    <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  </div>
                </div>
                
                {/* APY highlight skeleton */}
                <div className="mb-5 p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800">
                  <div className="flex justify-between items-center">
                    <div className="h-4 w-20 bg-green-200 dark:bg-green-800 rounded animate-pulse"></div>
                    <div className="h-8 w-24 bg-green-200 dark:bg-green-800 rounded-lg animate-pulse"></div>
                  </div>
                </div>
                
                {/* Stats skeleton */}
                <div className="space-y-3 mb-5">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="flex justify-between items-center p-2">
                      <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      <div className="h-5 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
                
                {/* Actions skeleton */}
                <div className="flex gap-3 pt-4 border-t-2 border-gray-200 dark:border-gray-700">
                  <div className="h-10 flex-1 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                  <div className="h-10 flex-1 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      {/* Header with search and controls */}
      <div className="px-6 py-4 border-b border-gray-700 bg-gradient-to-r from-gray-800 to-gray-900">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-2">
              Liquidity Pools
            </h3>
            {isClient && lastUpdated && (
              <p className="text-sm text-gray-400">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            {/* Search Input */}
            <div className="relative">
              <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search pools..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 w-64 h-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-purple-500"
              />
            </div>
            
            {/* Items per page dropdown */}
            <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
              <SelectTrigger className="w-20 h-10 bg-gray-800 border-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Refresh Button */}
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing || isBackgroundRefreshing}
              size="sm"
              variant="outline"
              className="relative h-10 border-gray-700 hover:bg-gray-800"
            >
              <IoRefresh className={`w-4 h-4 mr-2 ${isRefreshing || isBackgroundRefreshing ? 'animate-spin' : ''}`} />
              {isBackgroundRefreshing ? 'Updating...' : 'Refresh'}
              {isBackgroundRefreshing && !isRefreshing && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
              )}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Results info */}
      <div className="px-6 py-3 bg-gradient-to-r from-gray-800/50 to-gray-900/50 border-b border-gray-700">
        <div className="flex items-center justify-between text-sm font-medium text-gray-300">
          <span className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 text-white text-xs font-bold shadow-lg">
              {filteredPools.length}
            </span>
            Showing {startItem}-{endItem} of {filteredPools.length} pools
            {searchQuery && ` matching "${searchQuery}"`}
          </span>
          {totalPages > 1 && (
            <span className="text-purple-400 font-semibold">
              Page {currentPage} of {totalPages}
            </span>
          )}
        </div>
      </div>
      
      {/* Pools Grid */}
      <div className="p-6">
        {paginatedPools.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedPools.map((pool) => (
              <Card
                key={pool.id}
                className="group relative overflow-hidden bg-gradient-to-br from-gray-800 via-gray-800 to-gray-900 border-2 border-gray-700 hover:border-purple-500 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/30 hover:-translate-y-1"
              >
                {/* Animated gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-blue-500/0 to-emerald-500/0 group-hover:from-purple-500/10 group-hover:via-blue-500/10 group-hover:to-emerald-500/10 transition-all duration-500 pointer-events-none" />
                
                {/* High APY Badge */}
                {pool.apy >= 30 && (
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1 z-10">
                    <IoTrendingUp className="w-3.5 h-3.5" />
                    Hot
                  </div>
                )}

                <div className="relative p-6">
                  {/* Pool Header */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="relative flex -space-x-3">
                      {/* 3D Token Icons with reduced glow */}
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full blur-md opacity-40" />
                        <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 via-purple-600 to-blue-600 flex items-center justify-center text-white font-bold text-base shadow-xl ring-2 ring-gray-900 group-hover:scale-110 transition-transform duration-300">
                          {pool.token0Symbol.charAt(0)}
                        </div>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-teal-600 rounded-full blur-md opacity-40" />
                        <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-base shadow-xl ring-2 ring-gray-900 group-hover:scale-110 transition-transform duration-300">
                          {pool.token1Symbol.charAt(0)}
                        </div>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-xl text-white group-hover:text-purple-400 transition-colors">
                        {pool.token0Symbol}/{pool.token1Symbol}
                      </div>
                      <div className="text-xs text-gray-400 flex items-center gap-1.5 mt-1">
                        <IoWater className="w-3.5 h-3.5" />
                        {pool.poolType} Pool
                      </div>
                    </div>
                  </div>

                  {/* APY Highlight */}
                  <div className="mb-5 p-4 rounded-xl bg-gradient-to-r from-green-900/40 to-emerald-900/40 border border-green-500/30">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-green-300">Annual APY</span>
                      <div className="flex items-center gap-2">
                        <IoTrendingUp className="w-5 h-5 text-green-400" />
                        <span className="text-2xl font-bold text-green-400">
                          {pool.apy.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Pool Stats */}
                  <div className="space-y-3 mb-5">
                    {/* TVL */}
                    <div className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-800/50 transition-colors">
                      <span className="text-sm font-medium text-gray-400">Total Value Locked</span>
                      <span className="text-base font-bold text-white">
                        <AnimatedCurrency value={pool.tvl} decimals={0} />
                      </span>
                    </div>

                    {/* 24h Volume */}
                    <div className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-800/50 transition-colors">
                      <span className="text-sm font-medium text-gray-400">24h Volume</span>
                      <span className="text-base font-semibold text-purple-400">
                        <AnimatedCurrency value={pool.volume24h} decimals={0} />
                      </span>
                    </div>

                    {/* 24h Fees */}
                    <div className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-800/50 transition-colors">
                      <span className="text-sm font-medium text-gray-400">24h Fees Earned</span>
                      <span className="text-base font-semibold text-blue-400">
                        <AnimatedCurrency value={pool.fees24h} decimals={0} />
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t-2 border-gray-700">
                    <Button
                      size="sm"
                      onClick={handleAddClick}
                      className="flex-1 h-11 font-semibold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                    >
                      <IoLockClosed className="w-4 h-4 mr-2" />
                      Add
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleTradeClick}
                      className="flex-1 h-11 font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                    >
                      <IoLockClosed className="w-4 h-4 mr-2" />
                      Trade
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <div className="text-gray-500 dark:text-gray-400">
              {searchQuery ? (
                <>
                  <IoSearch className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg font-medium">No pools found matching &quot;{searchQuery}&quot;</p>
                  <p className="text-sm mt-1">Try adjusting your search terms</p>
                </>
              ) : (
                <>
                  <IoWater className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg font-medium">No liquidity pools available</p>
                  <p className="text-sm mt-1">Check back later for new pools</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-700 bg-gradient-to-r from-gray-800 to-gray-900">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400 font-medium">
              Showing {startItem}-{endItem} of {filteredPools.length} pools
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="border-gray-700 hover:bg-gray-800"
              >
                <IoChevronBack className="w-4 h-4" />
                Previous
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-9 h-9 p-0 ${
                        currentPage === pageNum
                          ? "bg-gradient-to-r from-purple-600 to-blue-600"
                          : "border-gray-700 hover:bg-gray-800"
                      }`}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="border-gray-700 hover:bg-gray-800"
              >
                Next
                <IoChevronForward className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Coming Soon Modal */}
      <ComingSoonModal
        isOpen={showComingSoonModal}
        onClose={() => setShowComingSoonModal(false)}
        feature={comingSoonFeature}
      />
    </Card>
  );
}