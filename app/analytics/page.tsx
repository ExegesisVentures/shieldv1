/**
 * Analytics Page - Coreum Blockchain Analytics Dashboard
 * File: app/analytics/page.tsx
 * 
 * Comprehensive analytics dashboard for Coreum blockchain metrics
 */

'use client';

import { useCoreum } from '@/hooks/useCoreum';
import { useBurnBalance } from '@/hooks/useBurnBalance';
import { StatsGrid } from '@/components/analytics/StatsGrid';
import { InflationTracker } from '@/components/analytics/InflationTracker';
import { BondingSimulator } from '@/components/analytics/BondingSimulator';

export default function AnalyticsPage() {
  const { stats, loading, error, refresh } = useCoreum();
  const { burnData, loading: burnLoading } = useBurnBalance();

  // Use actual burned amount from blockchain
  const totalBurned = burnData?.totalBurnedCORE || 0;

  // Parse stats for metrics
  const currentInflation = stats?.inflation ? parseFloat(stats.inflation) : 17.5;
  const currentAPR = stats?.currentAPR ? parseFloat(stats.currentAPR) : 26.04;
  const totalSupply = stats?.totalSupply ? parseFloat(stats.totalSupply) / 1_000_000 : 794_191_964;
  const bondedRatio = stats?.bondedRatio ? parseFloat(stats.bondedRatio) / 100 : 0.6723;
  const bondedRatioPercent = bondedRatio * 100;
  const totalBondedTokens = stats?.totalBonded ? parseFloat(stats.totalBonded) / 1_000_000 : totalSupply * bondedRatio;
  
  // Calculate daily inflation printed (annual inflation / 365)
  const dailyInflationPrinted = (totalSupply * (currentInflation / 100)) / 365;

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
        <div className="container mx-auto">
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 text-center">
            <h2 className="text-2xl font-bold text-red-400 mb-2">Error Loading Analytics</h2>
            <p className="text-gray-300">{error}</p>
            <button 
              onClick={refresh}
              className="mt-4 px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-16 px-4">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 pointer-events-none"></div>
        <div className="container mx-auto relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
              Coreum Analytics
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Real-time blockchain metrics, inflation tracking, and deflationary insights
            </p>
            <div className="flex items-center justify-center gap-4">
              <button 
                onClick={refresh}
                disabled={loading}
                className={`
                  px-8 py-3 rounded-lg font-semibold transition-all duration-300
                  ${loading 
                    ? 'bg-gray-600 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 shadow-lg shadow-cyan-500/30'
                  }
                  text-white
                `}
              >
                {loading ? 'Refreshing...' : 'Refresh Data'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="container mx-auto px-4">
        <StatsGrid 
          stats={stats} 
          loading={loading || burnLoading}
          totalBurned={totalBurned}
          dailyInflationPrinted={dailyInflationPrinted}
        />
      </section>

      {/* Inflation Tracker */}
      <section className="container mx-auto px-4">
        <InflationTracker
          dailyInflation={dailyInflationPrinted}
          currentInflation={currentInflation}
          bondedRatio={bondedRatio}
          totalSupply={totalSupply}
        />
      </section>

      {/* Bonding Acceleration Simulator */}
      <section className="container mx-auto">
        <BondingSimulator
          currentBondedRatio={bondedRatioPercent}
          currentInflation={currentInflation}
          totalSupply={totalSupply}
          totalBonded={totalBondedTokens}
        />
      </section>

      {/* Coming Soon Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-2xl p-8 border border-purple-500/20">
          <div className="text-center">
            <div className="inline-block bg-purple-500/20 text-purple-300 px-4 py-2 rounded-full text-sm font-bold mb-4">
              Coming Soon
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">
              More Analytics Features
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto mb-6">
              We're working on bringing you more detailed analytics including network adoption charts, 
              burn metrics, validator statistics, and deflationary milestones.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <span className="bg-purple-900/30 px-4 py-2 rounded-lg text-purple-300">
                📊 Adoption Charts
              </span>
              <span className="bg-purple-900/30 px-4 py-2 rounded-lg text-purple-300">
                🔥 Burn Metrics
              </span>
              <span className="bg-purple-900/30 px-4 py-2 rounded-lg text-purple-300">
                🎯 Milestone Tracker
              </span>
              <span className="bg-purple-900/30 px-4 py-2 rounded-lg text-purple-300">
                📈 Historical Data
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="container mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-slate-800/50 rounded-xl p-6 border border-white/5">
            <div className="text-3xl mb-3">🔒</div>
            <h3 className="text-lg font-bold text-white mb-2">Staking Path</h3>
            <p className="text-gray-400 text-sm">
              Earn {currentAPR.toFixed(2)}% APR + secure the network + 
              increase bonded ratio (numerator ↑)
            </p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-6 border border-white/5">
            <div className="text-3xl mb-3">🔥</div>
            <h3 className="text-lg font-bold text-white mb-2">Burning Path</h3>
            <p className="text-gray-400 text-sm">
              Reduce total supply permanently + 
              increase bonded ratio (denominator ↓) + help all stakers
            </p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-6 border border-white/5">
            <div className="text-3xl mb-3">🚀</div>
            <h3 className="text-lg font-bold text-white mb-2">Combined Effect</h3>
            <p className="text-gray-400 text-sm">
              Staking + Burning together = exponentially faster 
              deflation = healthier ecosystem for everyone!
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

