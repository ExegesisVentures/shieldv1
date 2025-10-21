"use client";

import { useState } from "react";
import { IoShieldCheckmark, IoOpenOutline, IoTrendingUp, IoTrendingDown, IoClose } from "react-icons/io5";
import { Card } from "@/components/ui/card";
import Image from "next/image";

interface NftHolding {
  symbol: string;
  name: string;
  balance: string;
  valueUsd: number;
  change24h: number;
  change30d?: number; // 30-day price change percentage
  logoUrl?: string;
  type: 'nft';
  nftId?: string;
}

interface NftHoldingsProps {
  nfts?: NftHolding[];
  loading?: boolean;
}

export default function NftHoldings({ nfts = [], loading = false }: NftHoldingsProps) {
  const [showModal, setShowModal] = useState(false);
  const [selectedNft, setSelectedNft] = useState<NftHolding | null>(null);

  const handleOpenModal = (nft: NftHolding) => {
    setSelectedNft(nft);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    // Small delay before clearing to allow animation to finish
    setTimeout(() => setSelectedNft(null), 200);
  };
  if (loading) {
    return (
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-b border-purple-200 dark:border-purple-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-purple-700 dark:text-purple-400 uppercase tracking-wider">
                  NFT
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-purple-700 dark:text-purple-400 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-purple-700 dark:text-purple-400 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-purple-700 dark:text-purple-400 uppercase tracking-wider">
                  24h
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                    <div className="space-y-2">
                      <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </td>
                <td className="px-6 py-4">
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </td>
                <td className="px-6 py-4">
                  <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    );
  }

  if (nfts.length === 0) {
    return null; // Don't show empty state for NFTs
  }

  return (
    <>
      <Card className="overflow-hidden border-2 border-purple-200 dark:border-purple-800">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-b border-purple-200 dark:border-purple-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-purple-700 dark:text-purple-400 uppercase tracking-wider">
                  NFT Asset
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-purple-700 dark:text-purple-400 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-purple-700 dark:text-purple-400 uppercase tracking-wider">
                  Estimated Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-purple-700 dark:text-purple-400 uppercase tracking-wider">
                  24h Change
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-purple-700 dark:text-purple-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-purple-100 dark:divide-purple-900/30">
            {nfts.map((nft) => {
              const isPositive = nft.change24h >= 0;
              
              return (
                <tr
                  key={nft.nftId || nft.symbol}
                  className="hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-colors cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenModal(nft);
                  }}
                >
                  {/* NFT Asset */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                        nft.logoUrl ? 'overflow-hidden bg-gradient-to-br from-purple-600 via-blue-600 to-purple-800 shadow-lg' : 'neo-icon-glow-purple'
                      }`}>
                        {nft.logoUrl ? (
                          <Image
                            src={nft.logoUrl}
                            alt={nft.name}
                            width={48}
                            height={48}
                            className="object-cover"
                          />
                        ) : (
                          <IoShieldCheckmark className="w-6 h-6" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          {nft.symbol}
                          <span className="text-xs bg-gradient-to-r from-purple-500 to-blue-500 text-white px-2 py-0.5 rounded-full">
                            NFT
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {nft.name}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Quantity */}
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                      {nft.balance}
                    </div>
                  </td>

                  {/* Value */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      ${nft.valueUsd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </td>

                  {/* 24h Change */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div
                      className={`flex items-center gap-1 text-sm font-medium ${
                        isPositive ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {isPositive ? (
                        <IoTrendingUp className="w-4 h-4" />
                      ) : (
                        <IoTrendingDown className="w-4 h-4" />
                      )}
                      {isPositive ? "+" : ""}
                      {nft.change24h.toFixed(2)}%
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 transition-colors opacity-50 cursor-not-allowed"
                      title="Explorer link coming soon"
                      disabled
                    >
                      <IoOpenOutline className="w-4 h-4 inline" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>

    {/* Info Modal - Outside Card to avoid z-index issues */}
    {showModal && selectedNft && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={handleCloseModal}
          onMouseLeave={(e) => e.stopPropagation()}
          onMouseEnter={(e) => e.stopPropagation()}
          style={{ pointerEvents: 'auto' }}
        >
          <div 
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden border-2 border-purple-200 dark:border-purple-800 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
            onMouseLeave={(e) => e.stopPropagation()}
            onMouseEnter={(e) => e.stopPropagation()}
            style={{ pointerEvents: 'auto' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-purple-800 p-6 relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCloseModal();
                }}
                className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors z-10 p-1 hover:bg-white/10 rounded-lg"
                aria-label="Close modal"
              >
                <IoClose className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <IoShieldCheckmark className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">ShieldNest NFT</h3>
                  <p className="text-purple-100 text-sm">Premium Membership</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                <div className="flex items-start gap-3">
                  <IoTrendingUp className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Growing Floor Value
                    </h4>
                    <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                      The floor value is continually growing, making these NFTs worth more and more every day!
                    </p>
                  </div>
                </div>
              </div>

              {/* 30-Day Price Change */}
              {selectedNft?.change30d !== undefined && (
                <div className={`rounded-xl p-4 border ${
                  selectedNft.change30d >= 0 
                    ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-700' 
                    : 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-red-200 dark:border-red-700'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {selectedNft.change30d >= 0 ? (
                        <IoTrendingUp className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0" />
                      ) : (
                        <IoTrendingDown className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0" />
                      )}
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                          30-Day Performance
                        </h4>
                        <p className={`text-xs ${
                          selectedNft.change30d >= 0 
                            ? 'text-green-700 dark:text-green-300' 
                            : 'text-red-700 dark:text-red-300'
                        }`}>
                          {selectedNft.change30d >= 0 ? 'Value increased' : 'Value decreased'}
                        </p>
                      </div>
                    </div>
                    <div className={`text-right px-4 py-2 rounded-lg ${
                      selectedNft.change30d >= 0 
                        ? 'bg-green-100 dark:bg-green-900/40' 
                        : 'bg-red-100 dark:bg-red-900/40'
                    }`}>
                      <div className={`text-2xl font-bold ${
                        selectedNft.change30d >= 0 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {selectedNft.change30d >= 0 ? '+' : ''}{selectedNft.change30d.toFixed(2)}%
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                        Last 30 days
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                  <span className="font-semibold text-purple-700 dark:text-purple-400">Coming Soon:</span> More detailed analytics, historical value tracking, and exclusive membership benefits will be available soon.
                </p>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCloseModal();
                }}
                className="w-full bg-gradient-to-r from-purple-600 via-blue-600 to-purple-800 hover:from-purple-700 hover:via-blue-700 hover:to-purple-900 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
