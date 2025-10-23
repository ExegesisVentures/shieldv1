/**
 * BondingSimulator Component
 * File: components/analytics/BondingSimulator.tsx
 * 
 * Interactive simulator showing how increased bonding accelerates inflation reduction
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoSpeedometer, IoTrendingUp, IoFlash, IoInformationCircle, IoRocket } from 'react-icons/io5';
import {
  createInflationComparison,
  tokensNeededForRatio,
  calculateInflationTimeline,
  calculateScenario,
} from '@/utils/inflationMechanics';
import { formatLargeNumber } from '@/utils/formatters';
import { BondingCurveTable } from '@/components/analytics/BondingCurveTable';

interface BondingSimulatorProps {
  currentBondedRatio: number; // as percentage (e.g., 67)
  currentInflation: number; // as percentage (e.g., 18)
  totalSupply: number; // total CORE supply
  totalBonded: number; // total bonded CORE
}

export const BondingSimulator = ({
  currentBondedRatio,
  currentInflation,
  totalSupply,
  totalBonded,
}: BondingSimulatorProps) => {
  // Interactive slider for bonded ratio
  const [simulatedRatio, setSimulatedRatio] = useState(currentBondedRatio);
  const [showDetails, setShowDetails] = useState(false);

  // Reset simulated ratio when actual ratio changes
  useEffect(() => {
    setSimulatedRatio(currentBondedRatio);
  }, [currentBondedRatio]);

  // Calculate scenarios
  const comparison = useMemo(
    () => createInflationComparison(currentBondedRatio, totalSupply, currentInflation),
    [currentBondedRatio, totalSupply, currentInflation]
  );

  // Calculate current simulated scenario
  const simulatedScenario = useMemo(
    () => calculateScenario(simulatedRatio, totalSupply, currentInflation),
    [simulatedRatio, totalSupply, currentInflation]
  );

  // Calculate tokens needed for simulated ratio
  const tokensNeeded = useMemo(
    () => tokensNeededForRatio(currentBondedRatio, simulatedRatio, totalSupply, totalBonded),
    [currentBondedRatio, simulatedRatio, totalSupply, totalBonded]
  );

  // Calculate timeline to reduce inflation to 15%
  const timeline15 = useMemo(
    () => calculateInflationTimeline(currentInflation, 15, simulatedRatio, totalSupply),
    [currentInflation, simulatedRatio, totalSupply]
  );

  // Calculate timeline to reduce inflation to 7%
  const timeline7 = useMemo(
    () => calculateInflationTimeline(currentInflation, 7, simulatedRatio, totalSupply),
    [currentInflation, simulatedRatio, totalSupply]
  );

  // Calculate speedup compared to current ratio
  const speedupMultiplier =
    comparison.current.deflationSpeed > 0
      ? simulatedScenario.deflationSpeed / comparison.current.deflationSpeed
      : simulatedScenario.deflationSpeed;

  const isAboveGoal = simulatedRatio >= 67;
  const isSignificantImprovement = simulatedRatio > currentBondedRatio + 2;

  return (
    <section className="my-16 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 rounded-3xl p-8 md:p-12 border border-gray-700/50 dark:border-gray-800/50 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl">
                  <IoSpeedometer className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white">
                  Bonding Acceleration Simulator
                </h2>
              </div>
              <p className="text-gray-400 text-lg max-w-3xl">
                See how increasing the bonded ratio accelerates inflation reduction. 
                The higher the bonded ratio above 67%, the faster inflation decreases per block.
              </p>
            </div>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
            >
              <IoInformationCircle className="w-6 h-6 text-gray-400 hover:text-cyan-400" />
            </button>
          </div>

          {/* Details Panel */}
          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-8 p-6 bg-gray-800/50 dark:bg-gray-900/50 rounded-xl border border-gray-700/50"
              >
                <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                  <IoInformationCircle className="text-cyan-400" />
                  How It Works
                </h3>
                <div className="space-y-2 text-gray-300">
                  <p>
                    • <strong>Goal Bonded Ratio:</strong> 67% - This is Coreum's target. Above this, inflation decreases automatically.
                  </p>
                  <p>
                    • <strong>Inflation Reduction Rate:</strong> The higher above 67%, the faster inflation drops per block.
                  </p>
                  <p>
                    • <strong>Exponential Effect:</strong> At 75%+ bonded ratio, deflation happens dramatically faster (55x+ speed).
                  </p>
                  <p>
                    • <strong>Every Stake Matters:</strong> Even small increases in bonding ratio compound over time.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Current Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-800/50 dark:bg-gray-900/50 rounded-xl p-6 border border-gray-700/50">
              <div className="text-gray-400 text-sm mb-2">Current Bonded Ratio</div>
              <div className="text-3xl font-bold text-white">{currentBondedRatio.toFixed(2)}%</div>
              <div className="text-gray-500 text-sm mt-1">
                {formatLargeNumber(totalBonded)} CORE bonded
              </div>
            </div>
            <div className="bg-gray-800/50 dark:bg-gray-900/50 rounded-xl p-6 border border-gray-700/50">
              <div className="text-gray-400 text-sm mb-2">Current Inflation</div>
              <div className="text-3xl font-bold text-white">{currentInflation.toFixed(2)}%</div>
              <div className="text-gray-500 text-sm mt-1">Annual rate</div>
            </div>
            <div className="bg-gray-800/50 dark:bg-gray-900/50 rounded-xl p-6 border border-gray-700/50">
              <div className="text-gray-400 text-sm mb-2">Daily Inflation</div>
              <div className="text-3xl font-bold text-white">
                {formatLargeNumber(comparison.current.inflationPerDay)}
              </div>
              <div className="text-gray-500 text-sm mt-1">CORE minted per day</div>
            </div>
          </div>

          {/* Interactive Slider */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <label className="text-xl font-bold text-white">
                Simulate Bonded Ratio: {simulatedRatio.toFixed(1)}%
              </label>
              {simulatedRatio !== currentBondedRatio && (
                <button
                  onClick={() => setSimulatedRatio(currentBondedRatio)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-sm transition-colors"
                >
                  Reset
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type="range"
                min="50"
                max="85"
                step="0.1"
                value={simulatedRatio}
                onChange={(e) => setSimulatedRatio(parseFloat(e.target.value))}
                className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                style={{
                  background: `linear-gradient(to right, 
                    ${simulatedRatio < 67 ? '#ef4444' : '#06b6d4'} 0%, 
                    ${simulatedRatio < 67 ? '#ef4444' : '#06b6d4'} ${((simulatedRatio - 50) / 35) * 100}%, 
                    #374151 ${((simulatedRatio - 50) / 35) * 100}%, 
                    #374151 100%)`,
                }}
              />
              {/* Goal marker */}
              <div
                className="absolute top-0 w-1 h-3 bg-yellow-500"
                style={{ left: `${((67 - 50) / 35) * 100}%`, transform: 'translateX(-50%)' }}
              />
              <div className="flex justify-between mt-2 text-sm text-gray-400">
                <span>50%</span>
                <span className="text-yellow-500 font-semibold">67% Goal</span>
                <span>85%</span>
              </div>
            </div>
            {!isAboveGoal && (
              <div className="mt-4 p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
                <p className="text-red-400 text-sm">
                  ⚠️ Below 67% bonded ratio, inflation will <strong>increase</strong> instead of decrease!
                </p>
              </div>
            )}
          </div>

          {/* Simulated Scenario Results */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Inflation Reduction Speed */}
            <motion.div
              key={simulatedRatio}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-gradient-to-br from-cyan-900/30 to-blue-900/30 dark:from-cyan-950/30 dark:to-blue-950/30 rounded-xl p-6 border border-cyan-500/30"
            >
              <div className="flex items-center gap-3 mb-4">
                <IoFlash className="w-6 h-6 text-cyan-400" />
                <h3 className="text-xl font-bold text-white">Deflation Speed</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="text-gray-400 text-sm mb-1">Inflation Reduction Per Day</div>
                  <div className="text-3xl font-bold text-cyan-400">
                    {isAboveGoal ? `${(simulatedScenario.deflationSpeed * 0.01).toFixed(4)}%` : '0%'}
                  </div>
                </div>
                {isAboveGoal && (
                  <>
                    <div>
                      <div className="text-gray-400 text-sm mb-1">Speed Multiplier</div>
                      <div className="text-2xl font-bold text-white">
                        {speedupMultiplier.toFixed(2)}x faster
                      </div>
                      <div className="text-gray-500 text-sm mt-1">
                        vs. current {currentBondedRatio.toFixed(1)}% bonded ratio
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-sm mb-1">Time to Drop 0.1% Inflation</div>
                      <div className="text-2xl font-bold text-white">
                        {simulatedScenario.timeToNextInflationDrop !== Infinity
                          ? `${Math.ceil(simulatedScenario.timeToNextInflationDrop)} days`
                          : 'N/A'}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>

            {/* Tokens Needed */}
            <motion.div
              key={`tokens-${simulatedRatio}`}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 dark:from-purple-950/30 dark:to-pink-950/30 rounded-xl p-6 border border-purple-500/30"
            >
              <div className="flex items-center gap-3 mb-4">
                <IoTrendingUp className="w-6 h-6 text-purple-400" />
                <h3 className="text-xl font-bold text-white">Tokens Required</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="text-gray-400 text-sm mb-1">Additional Tokens to Stake</div>
                  <div className="text-3xl font-bold text-purple-400">
                    {tokensNeeded.tokensToStake > 0
                      ? formatLargeNumber(tokensNeeded.tokensToStake)
                      : '0'}
                  </div>
                  <div className="text-gray-500 text-sm mt-1">
                    {tokensNeeded.percentageIncrease.toFixed(2)}% of total supply
                  </div>
                </div>
                {simulatedRatio > currentBondedRatio && (
                  <div>
                    <div className="text-gray-400 text-sm mb-1">New Total Bonded</div>
                    <div className="text-2xl font-bold text-white">
                      {formatLargeNumber(tokensNeeded.newTotalBonded)}
                    </div>
                    <div className="text-gray-500 text-sm mt-1">
                      +{((tokensNeeded.newTotalBonded / totalBonded - 1) * 100).toFixed(2)}% increase
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Timeline Projections */}
          {isAboveGoal && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800/50 dark:bg-gray-900/50 rounded-xl p-6 border border-gray-700/50"
            >
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <IoRocket className="text-yellow-400" />
                Inflation Reduction Timeline
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-gray-400 text-sm mb-2">Time to Reach 15% Inflation</div>
                  <div className="text-4xl font-bold text-green-400">
                    {timeline15.daysToTarget !== Infinity
                      ? `${Math.ceil(timeline15.daysToTarget)} days`
                      : 'N/A'}
                  </div>
                  {timeline15.daysToTarget !== Infinity && (
                    <div className="text-gray-500 text-sm mt-1">
                      ({(timeline15.daysToTarget / 365).toFixed(1)} years)
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-gray-400 text-sm mb-2">Time to Reach 7% Inflation (Floor)</div>
                  <div className="text-4xl font-bold text-blue-400">
                    {timeline7.daysToTarget !== Infinity
                      ? `${Math.ceil(timeline7.daysToTarget)} days`
                      : 'N/A'}
                  </div>
                  {timeline7.daysToTarget !== Infinity && (
                    <div className="text-gray-500 text-sm mt-1">
                      ({(timeline7.daysToTarget / 365).toFixed(1)} years)
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Comparison Table */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8"
          >
            <h3 className="text-2xl font-bold text-white mb-4">Quick Comparison</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">Scenario</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">Bonded Ratio</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">APR</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">Deflation Speed</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">Days to -0.1%</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-800 bg-gray-800/30">
                    <td className="py-4 px-4 text-white font-semibold">Current</td>
                    <td className="py-4 px-4 text-white">{comparison.current.bondedRatio.toFixed(2)}%</td>
                    <td className="py-4 px-4 text-white">{comparison.current.apr.toFixed(2)}%</td>
                    <td className="py-4 px-4 text-white">{comparison.current.deflationSpeed.toFixed(2)}x</td>
                    <td className="py-4 px-4 text-white">
                      {comparison.current.timeToNextInflationDrop !== Infinity
                        ? `${Math.ceil(comparison.current.timeToNextInflationDrop)} days`
                        : 'N/A'}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-800 bg-cyan-900/10">
                    <td className="py-4 px-4 text-cyan-400 font-semibold">70% Bonded</td>
                    <td className="py-4 px-4 text-white">{comparison.scenario70.bondedRatio.toFixed(2)}%</td>
                    <td className="py-4 px-4 text-white">{comparison.scenario70.apr.toFixed(2)}%</td>
                    <td className="py-4 px-4 text-cyan-400 font-bold">
                      {comparison.scenario70.deflationSpeed.toFixed(2)}x
                      <span className="text-sm ml-2">
                        (+{((comparison.speedup70 - 1) * 100).toFixed(0)}%)
                      </span>
                    </td>
                    <td className="py-4 px-4 text-white">
                      {comparison.scenario70.timeToNextInflationDrop !== Infinity
                        ? `${Math.ceil(comparison.scenario70.timeToNextInflationDrop)} days`
                        : 'N/A'}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-800 bg-purple-900/10">
                    <td className="py-4 px-4 text-purple-400 font-semibold">75% Bonded</td>
                    <td className="py-4 px-4 text-white">{comparison.scenario75.bondedRatio.toFixed(2)}%</td>
                    <td className="py-4 px-4 text-white">{comparison.scenario75.apr.toFixed(2)}%</td>
                    <td className="py-4 px-4 text-purple-400 font-bold">
                      {comparison.scenario75.deflationSpeed.toFixed(2)}x
                      <span className="text-sm ml-2">
                        (+{((comparison.speedup75 - 1) * 100).toFixed(0)}%)
                      </span>
                    </td>
                    <td className="py-4 px-4 text-white">
                      {comparison.scenario75.timeToNextInflationDrop !== Infinity
                        ? `${Math.ceil(comparison.scenario75.timeToNextInflationDrop)} days`
                        : 'N/A'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Key Insight */}
          {isSignificantImprovement && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-8 p-6 bg-gradient-to-r from-green-900/30 to-cyan-900/30 border border-green-500/50 rounded-xl"
            >
              <div className="flex items-start gap-4">
                <IoRocket className="w-8 h-8 text-green-400 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="text-xl font-bold text-white mb-2">🎯 Significant Impact!</h4>
                  <p className="text-gray-300">
                    At {simulatedRatio.toFixed(1)}% bonded ratio, inflation reduces{' '}
                    <strong className="text-green-400">{speedupMultiplier.toFixed(2)}x faster</strong> than current levels.
                    This means the network reaches deflationary targets significantly quicker, benefiting all CORE holders!
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Detailed Bonding Curve Table */}
          <BondingCurveTable
            currentInflation={currentInflation}
            currentBondedRatio={currentBondedRatio}
            targetInflation={15}
          />
        </motion.div>
      </div>
    </section>
  );
};

