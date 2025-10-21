import { Suspense } from "react";
import SwapInterface from "@/components/swap/SwapInterface";

/**
 * Swap Page
 * 
 * Token swap interface powered by Astroport
 * Automatically finds best prices across Cruise Control and Pulsara DEXs
 */

export default function SwapPage() {
  return (
    <div className="min-h-screen bg-[#0e0e0e] py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gradient-coreum mb-4">
            Token Swap
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Trade tokens at the best prices across multiple DEXs. Powered by Astroport, automatically comparing
            Cruise Control and Pulsara to get you the best rate.
          </p>
        </div>

        {/* Swap Interface - Wrapped in Suspense for useSearchParams() */}
        <Suspense fallback={
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          </div>
        }>
          <SwapInterface />
        </Suspense>

        {/* Features Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="card-coreum p-6">
            <div className="neo-icon-glow-yellow mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Best Prices</h3>
            <p className="text-sm text-gray-400">
              Automatically compares prices across multiple DEXs to find you the best rate for every swap.
            </p>
          </div>

          <div className="card-coreum p-6">
            <div className="neo-icon-glow-green mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Secure & Direct</h3>
            <p className="text-sm text-gray-400">
              All swaps are executed directly on-chain through battle-tested Astroport smart contracts.
            </p>
          </div>

          <div className="card-coreum p-6">
            <div className="neo-icon-glow-blue mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Low Slippage</h3>
            <p className="text-sm text-gray-400">
              Customizable slippage tolerance with real-time price impact calculations for optimal trading.
            </p>
          </div>
        </div>

        {/* Info Banner */}
        <div className="mt-12 max-w-4xl mx-auto p-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl border-2 border-purple-200 dark:border-purple-800">
          <h3 className="text-lg font-bold text-purple-900 dark:text-purple-100 mb-2">
            🚀 Multi-DEX Aggregation
          </h3>
          <p className="text-sm text-[#179b69] dark:text-[#25d695]">
            This swap interface is powered by Astroport, the leading DEX infrastructure on Coreum. Every time you
            request a quote, we query both Cruise Control and Pulsara DEXs to find you the absolute best price.
            You&apos;ll see exactly how much you&apos;re saving compared to other DEXs.
          </p>
        </div>
      </div>
    </div>
  );
}

