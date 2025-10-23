/**
 * BondingCurveTable Component
 * File: components/analytics/BondingCurveTable.tsx
 * 
 * Expandable table showing detailed bonding curve math with speed multipliers
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoChevronDown, IoChevronUp, IoInformationCircle } from 'react-icons/io5';
import { generateBondingCurveTable, formatBondingNumber } from '@/utils/bondingCurveData';

interface BondingCurveTableProps {
  currentInflation: number; // current inflation % (e.g., 17.51)
  currentBondedRatio: number; // current bonded ratio % (e.g., 67.24)
  targetInflation?: number; // target inflation % for timeline calculations (default 15)
}

export const BondingCurveTable = ({
  currentInflation,
  currentBondedRatio,
  targetInflation = 15,
}: BondingCurveTableProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const tableData = generateBondingCurveTable(
    currentInflation,
    targetInflation
  );
  
  return (
    <div className="mt-8">
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-6 bg-gradient-to-r from-indigo-900/30 to-purple-900/30 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-xl border border-indigo-500/30 hover:border-indigo-500/50 transition-all duration-300 group"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-lg group-hover:bg-indigo-500/30 transition-colors">
            <IoInformationCircle className="w-6 h-6 text-indigo-400" />
          </div>
          <div className="text-left">
            <h3 className="text-xl font-bold text-white mb-1">
              Detailed Bonding Curve Math
            </h3>
            <p className="text-sm text-gray-400">
              See exact inflation reduction rates at different bonded ratios
            </p>
          </div>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          {isExpanded ? (
            <IoChevronUp className="w-6 h-6 text-indigo-400" />
          ) : (
            <IoChevronDown className="w-6 h-6 text-indigo-400" />
          )}
        </motion.div>
      </button>
      
      {/* Expandable Table */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="mt-4 bg-gray-900/50 dark:bg-gray-950/50 rounded-xl border border-gray-700/50 p-6">
              {/* Info Banner */}
              <div className="mb-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                <div className="flex items-start gap-3">
                  <IoInformationCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-300">
                    <p className="mb-2">
                      <strong className="text-blue-400">Formula:</strong>{' '}
                      Annual Reduction = (1 - bonded_ratio/0.67) × 0.13 | APR = inflation / bonded_ratio
                    </p>
                    <p className="mb-2">
                      <strong className="text-blue-400">Real APR:</strong>{' '}
                      What stakers actually earn (Staking APR - Inflation). As more stake, APR drops BUT inflation drops faster = Higher Real APR!
                    </p>
                    <p>
                      <strong className="text-blue-400">Current:</strong>{' '}
                      {currentBondedRatio.toFixed(2)}% bonded, {currentInflation.toFixed(2)}% inflation
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Responsive Table Wrapper */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px]">
                  <thead>
                    <tr className="border-b-2 border-indigo-500/30">
                      <th className="text-left py-4 px-4 text-indigo-300 font-bold text-sm">
                        Bonded Ratio
                      </th>
                      <th className="text-left py-4 px-4 text-indigo-300 font-bold text-sm">
                        Staking APR
                      </th>
                      <th className="text-left py-4 px-4 text-indigo-300 font-bold text-sm">
                        Real APR
                      </th>
                      <th className="text-left py-4 px-4 text-indigo-300 font-bold text-sm">
                        Annual Reduction
                      </th>
                      <th className="text-left py-4 px-4 text-indigo-300 font-bold text-sm">
                        Daily Reduction
                      </th>
                      <th className="text-left py-4 px-4 text-indigo-300 font-bold text-sm">
                        Days to {targetInflation}%
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.map((row, index) => {
                      const isCurrent = Math.abs(row.bondedRatio - currentBondedRatio) < 0.01;
                      const isGoal = row.bondedRatio === 67.00;
                      const isSignificant = Math.abs(row.annualReduction) >= 1.0; // 1% or more annual reduction
                      
                      return (
                        <tr
                          key={row.bondedRatio}
                          className={`
                            border-b border-gray-800/50 transition-colors
                            ${isCurrent ? 'bg-cyan-900/20 border-cyan-500/30' : ''}
                            ${isGoal ? 'bg-yellow-900/10 border-yellow-500/20' : ''}
                            ${isSignificant && !isCurrent ? 'bg-purple-900/10' : ''}
                            hover:bg-gray-800/30
                          `}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className={`font-bold ${isCurrent ? 'text-cyan-400' : isGoal ? 'text-yellow-400' : 'text-white'}`}>
                                {row.bondedRatio.toFixed(2)}%
                              </span>
                              {isCurrent && (
                                <span className="text-xs bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded">
                                  Current
                                </span>
                              )}
                              {isGoal && (
                                <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded">
                                  Goal
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-mono text-white">
                              {row.apr.toFixed(2)}%
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`font-bold font-mono ${row.realAPR > 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {row.realAPR > 0 ? '+' : ''}{row.realAPR.toFixed(2)}%
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`font-mono ${row.annualReduction < 0 ? 'text-green-400' : 'text-gray-400'}`}>
                              {row.annualReduction === 0 
                                ? '0.0000%' 
                                : `${formatBondingNumber(row.annualReduction, 4)}%`}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`font-mono ${row.dailyReduction < 0 ? 'text-green-400' : 'text-gray-400'}`}>
                              {row.dailyReduction === 0 
                                ? '0.000000%' 
                                : `${formatBondingNumber(row.dailyReduction, 6)}%`}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-white font-mono">
                              {!isFinite(row.daysToTarget) 
                                ? 'N/A' 
                                : Math.ceil(row.daysToTarget).toLocaleString()}
                            </span>
                            {isFinite(row.daysToTarget) && (
                              <div className="text-xs text-gray-500 mt-1">
                                ~{formatBondingNumber(row.yearsToTarget, 1)} years
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* Key Insights */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gradient-to-br from-yellow-900/20 to-orange-900/20 border border-yellow-500/30 rounded-lg">
                  <div className="text-xs text-yellow-400 font-semibold mb-1">67% GOAL</div>
                  <div className="text-sm text-gray-300">
                    Below this, inflation <strong>increases</strong>. At exactly 67%, inflation stays flat.
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border border-cyan-500/30 rounded-lg">
                  <div className="text-xs text-cyan-400 font-semibold mb-1">70-75% RANGE</div>
                  <div className="text-sm text-gray-300">
                    Inflation reduces <strong>10-33x faster</strong> than current. Sweet spot for community.
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-500/30 rounded-lg">
                  <div className="text-xs text-purple-400 font-semibold mb-1">80%+ EXTREME</div>
                  <div className="text-sm text-gray-300">
                    Inflation reduces <strong>50x+ faster</strong>. Rapid deflationary effect.
                  </div>
                </div>
              </div>
              
              {/* Formula Explanation */}
              <div className="mt-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
                <h4 className="text-sm font-bold text-white mb-2">Understanding the Math:</h4>
                <div className="space-y-2 text-sm text-gray-300">
                  <p>
                    • <strong>Staking APR:</strong> Goes DOWN as more people stake (same rewards divided among more stakers)
                  </p>
                  <p>
                    • <strong>Real APR (Green = Good):</strong> What you ACTUALLY earn after inflation. This INCREASES as bonded ratio rises!
                  </p>
                  <p>
                    • <strong>The Magic:</strong> Even though APR drops from {tableData[0]?.apr.toFixed(2)}% to {tableData[tableData.length-1]?.apr.toFixed(2)}%, 
                    Real APR goes from {tableData[0]?.realAPR.toFixed(2)}% to +{tableData[tableData.length-1]?.realAPR.toFixed(2)}%!
                  </p>
                  <p>
                    • <strong>Example at 75%:</strong> APR is {tableData.find(r => r.bondedRatio === 75)?.apr.toFixed(2)}%, 
                    but Real APR is <span className="text-green-400 font-bold">+{tableData.find(r => r.bondedRatio === 75)?.realAPR.toFixed(2)}%</span> because inflation is only {currentInflation.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

