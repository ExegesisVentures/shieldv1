/**
 * Restake Calculator Page
 * File: app/restake-calculator/page.tsx
 * 
 * Interactive calculator to compare staking vs burning impacts
 * with advanced compound interest calculations
 */

'use client';

import { useCoreum } from '@/hooks/useCoreum';
import { RestakeCalculator } from '@/components/analytics/RestakeCalculator';

export default function RestakeCalculatorPage() {
  const { stats, loading, error, refresh } = useCoreum();

  // Parse stats for metrics
  const currentInflation = stats?.inflation ? parseFloat(stats.inflation) : 17.5;
  const totalSupply = stats?.totalSupply ? parseFloat(stats.totalSupply) / 1_000_000 : 794_191_964;
  const bondedRatio = stats?.bondedRatio ? parseFloat(stats.bondedRatio) / 100 : 0.6723;

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
        <div className="container mx-auto">
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 text-center">
            <h2 className="text-2xl font-bold text-red-400 mb-2">Error Loading Calculator</h2>
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
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-orange-500/10 pointer-events-none"></div>
        <div className="container mx-auto relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-orange-500">
              Restake Calculator
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Compare staking vs burning impact with compound interest calculations
            </p>
            <div className="flex items-center justify-center gap-4">
              <button 
                onClick={refresh}
                disabled={loading}
                className={`
                  px-8 py-3 rounded-lg font-semibold transition-all duration-300
                  ${loading 
                    ? 'bg-gray-600 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-green-500 to-orange-500 hover:from-green-600 hover:to-orange-600 shadow-lg shadow-green-500/30'
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

      {/* Calculator */}
      <RestakeCalculator
        currentInflation={currentInflation}
        bondedRatio={bondedRatio}
        totalSupply={totalSupply}
      />

      {/* Educational Section */}
      <section className="container mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-gradient-to-br from-green-900/20 to-transparent p-8 rounded-2xl border border-green-500/20">
            <h3 className="text-2xl font-bold text-green-400 mb-4">🎓 Understanding Compound Staking</h3>
            <p className="text-gray-300 leading-relaxed">
              When you enable restaking, your rewards are automatically compounded at your chosen frequency.
              This means your rewards earn rewards, creating exponential growth over time.
              The more frequently you compound, the higher your effective APR becomes!
            </p>
            <div className="mt-6 p-4 bg-black/30 rounded-lg">
              <div className="text-sm text-gray-400 mb-2">Example:</div>
              <div className="text-green-400 font-mono text-sm">
                26% APR compounded daily = 29.68% effective APR
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-900/20 to-transparent p-8 rounded-2xl border border-orange-500/20">
            <h3 className="text-2xl font-bold text-orange-400 mb-4">🔥 Understanding Token Burning</h3>
            <p className="text-gray-300 leading-relaxed">
              Burning permanently removes tokens from circulation, reducing total supply forever.
              This increases the bonded ratio (same bonded tokens ÷ less total supply), which helps
              ALL stakers earn more. It's a permanent deflationary action that benefits the entire ecosystem!
            </p>
            <div className="mt-6 p-4 bg-black/30 rounded-lg">
              <div className="text-sm text-gray-400 mb-2">Key Benefit:</div>
              <div className="text-orange-400 font-mono text-sm">
                Permanent supply reduction = Long-term value increase
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Formula Section */}
      <section className="container mx-auto px-4 pb-16">
        <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 p-8 rounded-2xl border border-purple-500/20">
          <h3 className="text-2xl font-bold text-purple-400 mb-6 text-center">📐 The Math Behind It</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-black/30 p-6 rounded-lg">
              <h4 className="text-lg font-bold text-cyan-400 mb-3">Compound Interest Formula</h4>
              <code className="text-sm text-gray-300 block font-mono mb-4">
                Final Value = P × (1 + r/n)^(n×t)
              </code>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• P = Principal amount</li>
                <li>• r = Annual interest rate (decimal)</li>
                <li>• n = Compounding periods per year</li>
                <li>• t = Time in years</li>
              </ul>
            </div>

            <div className="bg-black/30 p-6 rounded-lg">
              <h4 className="text-lg font-bold text-cyan-400 mb-3">Real APR Calculation</h4>
              <code className="text-sm text-gray-300 block font-mono mb-4">
                Real APR = Nominal APR - Inflation Rate
              </code>
              <p className="text-sm text-gray-400">
                This shows your actual purchasing power gain. As inflation decreases through
                burning and higher bonding, your real APR increases!
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

