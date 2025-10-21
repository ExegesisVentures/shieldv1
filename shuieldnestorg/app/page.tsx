"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IoShieldCheckmark, IoWallet, IoStatsChart, IoLockClosed, IoArrowForward, IoSparkles, IoFlash } from "react-icons/io5";
// import { Button } from "@/components/ui/button";
import Link from "next/link";
import Footer from "@/components/layout/Footer";
import WalletConnectModal from "@/components/wallet/WalletConnectModal";

export default function Home() {
  const [showConnectModal, setShowConnectModal] = useState(false);
  const router = useRouter();

  const handleWalletSuccess = async () => {
    setShowConnectModal(false);
    
    // The wallet connection flow handles authentication automatically:
    // - If wallet is registered: User signs in with signature
    // - If wallet is new: Added to localStorage for anonymous use
    // Either way, redirect to dashboard
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#0e0e0e]">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 glass-coreum px-6 py-3 rounded-full mb-10 transition-all hover:scale-105">
              <IoShieldCheckmark className="w-5 h-5 text-[#25d695]" />
              <span className="text-sm font-semibold text-gray-300">
                Coreum Portfolio & Membership Platform
              </span>
            </div>
            
            {/* Main Heading */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-8 leading-tight text-white">
              Your Gateway to
              <br />
              <span className="text-gradient-coreum">
                Coreum Ecosystem
              </span>
            </h1>
            
            <p className="text-xl sm:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
              Track your Coreum portfolio, connect multiple wallets, and monitor your assets across the entire ecosystem.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <button
                className="btn-coreum-green px-8 py-4 text-lg flex items-center justify-center gap-2"
                onClick={() => setShowConnectModal(true)}
              >
                <IoWallet className="w-5 h-5" />
                Connect Wallet
              </button>
              <Link 
                href="/liquidity"
                className="glass-coreum px-8 py-4 text-lg font-semibold text-white flex items-center justify-center gap-2 hover:border-[#25d695]/50 transition-all"
              >
                Explore Liquidity Pools
                <IoArrowForward className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl font-bold text-gradient-coreum mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-gray-400">
              Professional portfolio management for Coreum blockchain
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Portfolio Tracking */}
            <div className="card-coreum p-10 group cursor-pointer">
              <div className="neo-icon-glow-green mb-6">
                <IoStatsChart className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                Portfolio Tracking
              </h3>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Track your Coreum assets across multiple wallets with real-time updates and detailed analytics.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-gray-300">
                  <div className="w-2 h-2 rounded-full bg-[#25d695] shadow-[0_0_4px_rgba(37,214,149,0.5)]"></div>
                  <span>Multi-wallet support</span>
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <div className="w-2 h-2 rounded-full bg-[#25d695] shadow-[0_0_4px_rgba(37,214,149,0.5)]"></div>
                  <span>Real-time balances</span>
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <div className="w-2 h-2 rounded-full bg-[#25d695] shadow-[0_0_4px_rgba(37,214,149,0.5)]"></div>
                  <span>Manual address tracking</span>
                </li>
              </ul>
            </div>

            {/* Wallet Connection */}
            <div className="card-coreum p-10 group cursor-pointer">
              <div className="neo-icon-glow-blue mb-6">
                <IoWallet className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                Easy Wallet Connection
              </h3>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Connect Keplr, Leap, or Cosmostation wallets in seconds. Or simply paste an address to track.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-gray-300">
                  <div className="w-2 h-2 rounded-full bg-[#25d695] shadow-[0_0_4px_rgba(37,214,149,0.5)]"></div>
                  <span>Keplr integration</span>
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <div className="w-2 h-2 rounded-full bg-[#25d695] shadow-[0_0_4px_rgba(37,214,149,0.5)]"></div>
                  <span>Leap integration</span>
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <div className="w-2 h-2 rounded-full bg-[#25d695] shadow-[0_0_4px_rgba(37,214,149,0.5)]"></div>
                  <span>Cosmostation support</span>
                </li>
              </ul>
            </div>

            {/* Liquidity Tracking */}
            <div className="card-coreum p-10 group cursor-pointer">
              <div className="neo-icon-glow-purple mb-6">
                <IoShieldCheckmark className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                Liquidity Pools
              </h3>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Monitor and track liquidity pool positions across the Coreum ecosystem.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-gray-300">
                  <div className="w-2 h-2 rounded-full bg-[#25d695] shadow-[0_0_4px_rgba(37,214,149,0.5)]"></div>
                  <span>Pool position tracking</span>
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <div className="w-2 h-2 rounded-full bg-[#25d695] shadow-[0_0_4px_rgba(37,214,149,0.5)]"></div>
                  <span>Yield analytics</span>
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <div className="w-2 h-2 rounded-full bg-[#25d695] shadow-[0_0_4px_rgba(37,214,149,0.5)]"></div>
                  <span>Performance insights</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card-coreum p-12 sm:p-16 text-center">
            <div className="neo-icon-glow-orange mb-8 inline-flex">
              <IoSparkles className="w-7 h-7" />
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-gradient-coreum mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              Connect your wallet or create an account to start tracking your Coreum portfolio today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/sign-up"
                className="btn-coreum-green px-8 py-4 text-lg flex items-center justify-center gap-2"
              >
                <IoFlash className="w-5 h-5" />
                Create Free Account
              </Link>
              <button
                className="glass-coreum px-8 py-4 text-lg font-semibold text-white flex items-center justify-center gap-2 hover:border-[#25d695]/50 transition-all"
                onClick={() => setShowConnectModal(true)}
              >
                <IoWallet className="w-5 h-5" />
                Connect Wallet
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Coming Soon Banner */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-coreum p-10 rounded-3xl text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#101216] rounded-full mb-6 border border-[#1b1d23]">
              <IoLockClosed className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">
              More Features Coming Soon
            </h3>
            <p className="text-gray-400 text-lg">
              DEX trading, liquidity pool management, and NFT marketplace integration are in development.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />

      {/* Wallet Connect Modal */}
      <WalletConnectModal
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        onSuccess={handleWalletSuccess}
      />
    </div>
  );
}
