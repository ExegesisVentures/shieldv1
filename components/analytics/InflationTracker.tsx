/**
 * Inflation Tracker - Interactive timeframe selector with recommendations
 * File: components/analytics/InflationTracker.tsx
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { IoCalendar, IoTrendingDown, IoAlertCircle, IoFlame } from 'react-icons/io5';
import { AnimatedNumber } from './AnimatedNumber';

interface InflationTrackerProps {
  dailyInflation: number;
  currentInflation: number; // as percentage
  bondedRatio: number; // as decimal
  totalSupply: number; // in CORE
}

type Timeframe = 'today' | 'week' | 'month';

export const InflationTracker = ({ 
  dailyInflation, 
  currentInflation,
  bondedRatio,
  totalSupply 
}: InflationTrackerProps) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('today');
  
  // Calculate inflation printed for different timeframes
  const calculations = {
    today: dailyInflation,
    week: dailyInflation * 7,
    month: dailyInflation * 30,
  };
  
  const printedAmount = calculations[selectedTimeframe];
  
  // Use the SAME amount for fair comparison
  const comparisonAmount = printedAmount;
  
  // Calculate ACTUAL impact of staking this amount
  const currentBonded = bondedRatio * totalSupply;
  const newBondedAfterStake = currentBonded + comparisonAmount;
  const newBondedRatioStake = newBondedAfterStake / totalSupply;
  const bondedRatioIncrease = ((newBondedRatioStake - bondedRatio) * 100);
  
  // Current APR = inflation / bonded_ratio
  const currentAPRCalc = (currentInflation / 100) / bondedRatio;
  const newAPRAfterStake = (currentInflation / 100) / newBondedRatioStake;
  const aprChangeStake = ((newAPRAfterStake - currentAPRCalc) * 100);
  
  // Calculate ACTUAL impact of burning this amount
  const newSupplyAfterBurn = totalSupply - comparisonAmount;
  const newBondedRatioAfterBurn = currentBonded / newSupplyAfterBurn;
  const bondedRatioIncreaseBurn = ((newBondedRatioAfterBurn - bondedRatio) * 100);
  
  const newAPRAfterBurn = (currentInflation / 100) / newBondedRatioAfterBurn;
  const aprChangeBurn = ((newAPRAfterBurn - currentAPRCalc) * 100);
  const supplyReduction = ((comparisonAmount / totalSupply) * 100);
  
  // Calculate long-term efficiency
  const efficiencyScore = {
    stake: bondedRatioIncrease,
    burn: bondedRatioIncreaseBurn + supplyReduction
  };
  
  const burnIsMoreEfficient = efficiencyScore.burn > efficiencyScore.stake;
  
  const timeframeLabels = {
    today: 'Today',
    week: 'This Week',
    month: 'This Month'
  };
  
  return (
    <section className="my-16">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl font-bold text-white mb-4 flex items-center gap-3">
            <IoCalendar className="text-cyan-400" size={36} />
            Inflation Impact Tracker
          </h2>
          <p className="text-lg text-gray-400 mb-8">
            See how much inflation is being printed and how you can help reduce it
          </p>
          
          {/* Timeframe Selector */}
          <div className="flex gap-4 mb-8">
            {(['today', 'week', 'month'] as Timeframe[]).map((timeframe) => (
              <button
                key={timeframe}
                className={`
                  px-6 py-3 rounded-lg font-semibold transition-all duration-300
                  ${selectedTimeframe === timeframe 
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/50' 
                    : 'bg-slate-800/50 text-gray-400 hover:bg-slate-700/50'
                  }
                `}
                onClick={() => setSelectedTimeframe(timeframe)}
              >
                {timeframeLabels[timeframe]}
              </button>
            ))}
          </div>
          
          {/* Printed Amount Display */}
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl p-8 mb-10 border border-white/10 backdrop-blur-sm">
            <div className="text-center">
              <div className="text-gray-400 text-lg mb-3">
                Inflation Printed {timeframeLabels[selectedTimeframe]}
              </div>
              <div className="text-6xl font-bold text-white flex items-center justify-center gap-4">
                <img 
                  src="/coreum-logo.svg" 
                  alt="CORE" 
                  className="h-16 w-auto filter drop-shadow-lg"
                />
                <AnimatedNumber value={printedAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })} />
              </div>
              <div className="text-gray-500 mt-3">
                At {currentInflation.toFixed(2)}% annual inflation rate
              </div>
            </div>
          </div>
          
          {/* Recommendations */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <IoAlertCircle className="text-yellow-400" size={32} />
              <h3 className="text-2xl font-bold text-white">How You Can Help Reduce Inflation</h3>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Staking Option */}
              <motion.div 
                className="relative bg-gradient-to-br from-blue-900/30 to-blue-800/10 rounded-xl p-6 border border-blue-500/20 hover:border-blue-500/40 transition-all duration-300"
                whileHover={{ scale: 1.02 }}
              >
                {!burnIsMoreEfficient && (
                  <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                    ✓ Most Efficient
                  </div>
                )}
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-blue-500/20 p-4 rounded-lg">
                    <IoTrendingDown className="text-blue-400" size={32} />
                  </div>
                  <h4 className="text-xl font-bold text-white">Stake Tokens</h4>
                </div>
                <div className="flex items-center gap-2 text-3xl font-bold text-blue-400 mb-4">
                  <img src="/coreum-logo.svg" alt="CORE" className="h-8 w-auto" />
                  <AnimatedNumber value={comparisonAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })} />
                </div>
                <p className="text-gray-300 text-sm mb-4">
                  Staking <strong>{comparisonAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong> tokens 
                  increases bonded ratio by <strong>{bondedRatioIncrease.toFixed(3)}%</strong>.
                  <br/><br/>
                  <span className="text-yellow-400">
                    ⚠️ Temporarily lowers APR by {Math.abs(aprChangeStake).toFixed(3)}% (diluted among more stakers), 
                    but you earn rewards while securing the network.
                  </span>
                </p>
                <div className="bg-blue-900/30 p-3 rounded-lg text-sm text-gray-300">
                  ✅ Secures the network<br/>
                  ✅ YOU earn staking rewards<br/>
                  ✅ Increases bonded ratio
                </div>
              </motion.div>
              
              {/* Burning Option */}
              <motion.div 
                className="relative bg-gradient-to-br from-orange-900/30 to-red-800/10 rounded-xl p-6 border border-orange-500/20 hover:border-orange-500/40 transition-all duration-300"
                whileHover={{ scale: 1.02 }}
              >
                {burnIsMoreEfficient && (
                  <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                    ✓ Most Efficient
                  </div>
                )}
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-orange-500/20 p-4 rounded-lg">
                    <IoFlame className="text-orange-400" size={32} />
                  </div>
                  <h4 className="text-xl font-bold text-white">Burn Tokens</h4>
                </div>
                <div className="flex items-center gap-2 text-3xl font-bold text-orange-400 mb-4">
                  <img src="/coreum-logo.svg" alt="CORE" className="h-8 w-auto" />
                  <AnimatedNumber value={comparisonAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })} />
                </div>
                <p className="text-gray-300 text-sm mb-4">
                  Burning <strong>{comparisonAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong> tokens 
                  reduces supply by <strong>{supplyReduction.toFixed(3)}%</strong> and 
                  increases bonded ratio by <strong>{bondedRatioIncreaseBurn.toFixed(3)}%</strong>.
                  <br/><br/>
                  <span className="text-green-400">
                    🔥 {bondedRatioIncreaseBurn > bondedRatioIncrease ? 
                      `${((bondedRatioIncreaseBurn / bondedRatioIncrease - 1) * 100).toFixed(0)}% MORE effective` : 
                      'Same effectiveness'} at increasing bonded ratio! 
                    Plus permanently deflationary - benefits EVERYONE long-term!
                  </span>
                </p>
                <div className="bg-orange-900/30 p-3 rounded-lg text-sm text-gray-300">
                  ✅ Reduces supply FOREVER<br/>
                  ✅ Benefits all holders<br/>
                  ✅ Compounds over time
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

