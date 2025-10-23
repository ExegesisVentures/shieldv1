/**
 * Restake Calculator Component - Staking vs Burning Impact Calculator
 * File: components/analytics/RestakeCalculator.tsx
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoTrendingUp, IoTrendingDown } from 'react-icons/io5';
import { AnimatedNumber } from './AnimatedNumber';
import { MetricTooltip } from './MetricTooltip';

interface RestakeCalculatorProps {
  currentInflation: number;  // e.g., 17.5 (as percentage)
  bondedRatio: number;       // e.g., 0.6723 (as decimal)
  totalSupply: number;       // e.g., 794191964 (in CORE)
}

export const RestakeCalculator = ({ currentInflation, bondedRatio, totalSupply }: RestakeCalculatorProps) => {
  const [amount, setAmount] = useState('100000');
  const [enableRestaking, setEnableRestaking] = useState(false);
  const [compoundFrequency, setCompoundFrequency] = useState<'hourly' | '6hours' | '12hours' | 'daily' | 'weekly'>('daily');
  const [timeHorizon, setTimeHorizon] = useState<1 | 3 | 5 | 10>(1);
  
  const calculateCompoundAPR = (nominalAPR: number, frequency: string, years: number) => {
    const r = nominalAPR / 100;
    const periodsPerYear: Record<string, number> = {
      'hourly': 24 * 365,
      '6hours': 4 * 365,
      '12hours': 2 * 365,
      'daily': 365,
      'weekly': 52,
    };
    const n = periodsPerYear[frequency];
    
    const effectiveAPR = (Math.pow(1 + r / n, n) - 1) * 100;
    const finalMultiplier = Math.pow(1 + r / n, n * years);
    const totalReturn = (finalMultiplier - 1) * 100;
    const annualizedReturn = (Math.pow(finalMultiplier, 1 / years) - 1) * 100;
    
    return { effectiveAPR, finalMultiplier, totalReturn, annualizedReturn };
  };
  
  const calculateStakingImpact = (stakeAmount: number) => {
    const inflationDecimal = currentInflation / 100;
    const currentBonded = bondedRatio * totalSupply;
    const newBonded = currentBonded + stakeAmount;
    const newBondedRatio = newBonded / totalSupply;
    const currentAPR = (inflationDecimal / bondedRatio) * 100;
    const realAPR = currentAPR - currentInflation;
    
    let compoundAPR = currentAPR;
    let finalAmount = stakeAmount;
    
    if (enableRestaking) {
      const compound = calculateCompoundAPR(currentAPR, compoundFrequency, timeHorizon);
      compoundAPR = compound.effectiveAPR;
      finalAmount = stakeAmount * compound.finalMultiplier;
    }
    
    return {
      newBondedRatio: (newBondedRatio * 100).toFixed(2),
      currentAPR: currentAPR.toFixed(2),
      realAPR: realAPR.toFixed(2),
      bondedIncrease: ((newBondedRatio - bondedRatio) * 100).toFixed(4),
      compoundAPR: compoundAPR.toFixed(2),
      finalAmount: finalAmount.toFixed(0),
      gain: (finalAmount - stakeAmount).toFixed(0),
    };
  };
  
  const calculateBurningImpact = (burnAmount: number) => {
    const inflationDecimal = currentInflation / 100;
    const newTotalSupply = totalSupply - burnAmount;
    const supplyReduction = ((burnAmount / totalSupply) * 100);
    const currentBonded = bondedRatio * totalSupply;
    const newBondedRatio = currentBonded / newTotalSupply;
    const currentAPR = (inflationDecimal / bondedRatio) * 100;
    const realAPR = currentAPR - currentInflation;
    
    return {
      supplyReduction: supplyReduction.toFixed(4),
      newBondedRatio: (newBondedRatio * 100).toFixed(4),
      currentAPR: currentAPR.toFixed(2),
      realAPR: realAPR.toFixed(2),
      bondedIncrease: ((newBondedRatio - bondedRatio) * 100).toFixed(4),
    };
  };
  
  const numAmount = parseFloat(amount) || 0;
  const stakingImpact = calculateStakingImpact(numAmount);
  const burningImpact = calculateBurningImpact(numAmount);
  
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-5xl font-bold text-white text-center mb-4 flex items-center justify-center gap-4">
            <span>🔄</span>
            Choose Your Path to Support Coreum
          </h2>
          <p className="text-xl text-gray-400 text-center mb-12">
            Staking and burning both increase the bonded ratio - compare how each path strengthens the ecosystem
          </p>
          
          {/* Amount Input */}
          <div className="max-w-lg mx-auto mb-12">
            <label className="block text-lg font-semibold text-gray-300 mb-3 text-center">
              Enter Amount (CORE)
            </label>
            <input
              type="number"
              className="w-full px-6 py-4 bg-slate-900 border-2 border-gray-700 rounded-xl text-white text-2xl font-bold text-center focus:outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20 transition-all"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="100000"
            />
          </div>

          {/* Restaking Toggle Button */}
          {!enableRestaking && (
            <motion.div 
              className="text-center mb-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <button
                className="inline-flex items-center gap-4 px-8 py-6 bg-gradient-to-r from-green-900/20 to-green-800/10 border-2 border-green-500/30 rounded-xl text-green-400 hover:border-green-500 hover:bg-green-900/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-green-500/30"
                onClick={() => setEnableRestaking(true)}
              >
                <span className="text-3xl">🔄</span>
                <div className="text-left">
                  <div className="text-xl font-bold">Restaking Calculator</div>
                  <div className="text-sm italic text-green-400/80">What are you really earning?</div>
                </div>
              </button>
            </motion.div>
          )}

          {/* Restaking Calculator Box */}
          <AnimatePresence>
            {enableRestaking && (
              <motion.div
                className="max-w-6xl mx-auto mb-12 p-8 bg-gradient-to-br from-green-900/10 to-green-800/5 border-2 border-green-500/30 rounded-2xl relative"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <button 
                  className="absolute top-4 right-4 w-8 h-8 bg-black/50 border border-gray-700 rounded-full text-gray-400 hover:bg-red-900/50 hover:border-red-500 hover:text-red-400 transition-all hover:rotate-90 flex items-center justify-center"
                  onClick={() => setEnableRestaking(false)}
                >
                  ✕
                </button>
                
                <div className="grid md:grid-cols-[1fr_auto_1fr] gap-8 items-center">
                  {/* Controls */}
                  <div className="p-6 bg-black/30 rounded-xl border border-gray-700 min-h-[420px] flex flex-col">
                    <h3 className="text-2xl font-bold text-green-400 mb-6 text-center">🚀 Compound Calculator</h3>
                    
                    <div className="mb-6">
                      <label className="block text-sm font-semibold text-gray-300 mb-2">Compound Frequency</label>
                      <select 
                        value={compoundFrequency} 
                        onChange={(e) => setCompoundFrequency(e.target.value as any)}
                        className="w-full px-4 py-3 bg-slate-900 border-2 border-gray-700 rounded-lg text-white font-semibold cursor-pointer focus:outline-none focus:border-green-500 focus:ring-3 focus:ring-green-500/20 transition-all"
                      >
                        <option value="hourly">Hourly</option>
                        <option value="6hours">Every 6 Hours</option>
                        <option value="12hours">Twice Daily</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                      </select>
                    </div>
                    
                    <div className="mb-6">
                      <label className="block text-sm font-semibold text-gray-300 mb-2">Time Horizon</label>
                      <select 
                        value={timeHorizon} 
                        onChange={(e) => setTimeHorizon(Number(e.target.value) as any)}
                        className="w-full px-4 py-3 bg-slate-900 border-2 border-gray-700 rounded-lg text-white font-semibold cursor-pointer focus:outline-none focus:border-green-500 focus:ring-3 focus:ring-green-500/20 transition-all"
                      >
                        <option value="1">1 Year</option>
                        <option value="3">3 Years</option>
                        <option value="5">5 Years</option>
                        <option value="10">10 Years</option>
                      </select>
                    </div>
                    
                    {/* Without Restaking */}
                    <div className="mt-auto p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                      <div className="text-center font-bold text-yellow-400 mb-3">📊 Without Restaking</div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Base APR</span>
                          <span className="font-bold text-white"><AnimatedNumber value={`${stakingImpact.currentAPR}%`} /></span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Total After {timeHorizon}yr</span>
                          <span className="font-bold text-white">
                            <AnimatedNumber value={(numAmount * (1 + parseFloat(stakingImpact.currentAPR) / 100 * timeHorizon)).toFixed(0)} /> CORE
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* APR Boost Badge */}
                  <div className="flex items-center justify-center">
                    <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/10 border-2 border-purple-500/40 rounded-xl p-6 text-center min-w-[140px] hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50 transition-all">
                      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">APR Boost</div>
                      <div className="text-3xl font-bold text-purple-400">
                        +<AnimatedNumber value={(parseFloat(stakingImpact.compoundAPR) - parseFloat(stakingImpact.currentAPR)).toFixed(2)} />%
                      </div>
                    </div>
                  </div>
                  
                  {/* Results */}
                  <div className="p-6 bg-black/30 rounded-xl border border-gray-700 min-h-[420px] flex flex-col">
                    <h3 className="text-2xl font-bold text-green-400 mb-6 text-center">📊 Compound Results ({timeHorizon}yr)</h3>
                    
                    <div className="space-y-3 flex-1">
                      <div className="flex justify-between items-center p-3 bg-black/20 rounded-lg border border-green-500/10">
                        <span className="text-sm text-gray-400">Effective APR (Annual)</span>
                        <span className="font-bold text-white"><AnimatedNumber value={`${stakingImpact.compoundAPR}%`} /></span>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-black/20 rounded-lg border border-green-500/10">
                        <span className="text-sm text-gray-400">Total Return ({timeHorizon}yr)</span>
                        <span className="font-bold text-green-400 text-lg">
                          <AnimatedNumber value={`${((parseFloat(stakingImpact.finalAmount) / numAmount - 1) * 100).toFixed(2)}%`} />
                        </span>
                      </div>
                      
                      <div className="h-px bg-gradient-to-r from-transparent via-green-500/30 to-transparent my-2"></div>
                      
                      <div className="flex justify-between items-center p-3 bg-black/20 rounded-lg border border-green-500/10">
                        <span className="text-sm text-gray-400">Initial Amount</span>
                        <span className="font-bold text-white"><AnimatedNumber value={numAmount.toLocaleString()} /> CORE</span>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-black/20 rounded-lg border border-green-500/10">
                        <span className="text-sm text-gray-400">Final Amount</span>
                        <span className="font-bold text-white"><AnimatedNumber value={parseInt(stakingImpact.finalAmount).toLocaleString()} /> CORE</span>
                      </div>
                      
                      <div className="flex justify-between items-center p-4 bg-green-900/20 rounded-lg border border-green-500/30">
                        <span className="text-sm font-bold text-green-400">💰 Total Gain</span>
                        <span className="font-bold text-yellow-400 text-xl">+<AnimatedNumber value={parseInt(stakingImpact.gain).toLocaleString()} /> CORE</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Comparison Cards */}
          <div className="grid md:grid-cols-[1fr_auto_1fr] gap-8 items-center mb-12">
            {/* Staking Card */}
            <motion.div 
              className="p-8 bg-gradient-to-br from-green-900/10 to-transparent border-2 border-green-500/30 rounded-2xl hover:border-green-500/50 hover:shadow-2xl hover:shadow-green-500/20 transition-all duration-300"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-700">
                <IoTrendingUp className="text-5xl text-green-400" />
                <h3 className="text-3xl font-bold text-white">Staking</h3>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center p-3 bg-black/30 rounded-lg">
                  <span className="text-gray-400 flex items-center">
                    New Bonded Ratio
                    <MetricTooltip 
                      id="bonded-stake"
                      explanation="% of total supply that's staked. When YOU stake, more tokens are bonded, so this ratio goes UP. Higher ratio = more network security!"
                    />
                  </span>
                  <span className="font-bold text-white text-xl">
                    <AnimatedNumber value={`${stakingImpact.newBondedRatio}%`} />
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-black/30 rounded-lg">
                  <span className="text-gray-400 flex items-center">
                    Current APR
                    <MetricTooltip 
                      id="current-apr"
                      explanation="Current staking APR for the network. This is what you'll earn by staking your tokens and securing the network!"
                    />
                  </span>
                  <span className="font-bold text-green-400 text-xl">
                    <AnimatedNumber value={`${stakingImpact.currentAPR}%`} />
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-black/30 rounded-lg">
                  <span className="text-gray-400 flex items-center">
                    Real APR (After Inflation)
                    <MetricTooltip 
                      id="real-apr"
                      explanation="What you ACTUALLY earn! Real APR = Current APR - Inflation Rate. This is your true purchasing power gain."
                    />
                  </span>
                  <span className="font-bold text-yellow-400 text-xl">
                    <AnimatedNumber value={`${stakingImpact.realAPR}%`} />
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-black/30 rounded-lg">
                  <span className="text-gray-400 flex items-center">
                    Bonded Ratio Increase
                    <MetricTooltip 
                      id="bonded-increase"
                      explanation="How much the bonded ratio increases when you stake. More bonded = faster inflation reduction = better for everyone!"
                    />
                  </span>
                  <span className="font-bold text-white text-xl">
                    <AnimatedNumber value={`+${stakingImpact.bondedIncrease}%`} />
                  </span>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-700 text-gray-400 space-y-2">
                <p>🔒 Secures network + earns APR</p>
                <p>📈 Increases bonded tokens</p>
                <p>🌊 Raises bonded ratio (numerator ↑)</p>
              </div>
            </motion.div>
            
            {/* VS Divider */}
            <div className="flex items-center justify-center">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-3 border-green-500 flex items-center justify-center bg-gradient-to-r from-green-500/20 to-green-400/20">
                <span className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">VS</span>
              </div>
            </div>
            
            {/* Burning Card */}
            <motion.div 
              className="p-8 bg-gradient-to-br from-orange-900/10 to-transparent border-2 border-orange-500/30 rounded-2xl hover:border-orange-500/50 hover:shadow-2xl hover:shadow-orange-500/20 transition-all duration-300"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-700">
                <IoTrendingDown className="text-5xl text-orange-400" />
                <h3 className="text-3xl font-bold text-white">Burning</h3>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center p-3 bg-black/30 rounded-lg">
                  <span className="text-gray-400 flex items-center">
                    New Bonded Ratio
                    <MetricTooltip 
                      id="bonded-burn"
                      explanation="When you BURN tokens, total supply decreases but bonded tokens stay the same. bonded/supply ratio INCREASES!"
                    />
                  </span>
                  <span className="font-bold text-white text-xl">
                    <AnimatedNumber value={`${burningImpact.newBondedRatio}%`} />
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-black/30 rounded-lg">
                  <span className="text-gray-400 flex items-center">
                    Current APR
                    <MetricTooltip 
                      id="current-apr-burn"
                      explanation="Current staking APR for the network. Burning helps increase this over time by raising the bonded ratio!"
                    />
                  </span>
                  <span className="font-bold text-orange-400 text-xl">
                    <AnimatedNumber value={`${burningImpact.currentAPR}%`} />
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-black/30 rounded-lg">
                  <span className="text-gray-400 flex items-center">
                    Real APR (After Inflation)
                    <MetricTooltip 
                      id="real-apr-burn"
                      explanation="Your actual earning power after inflation. Burning helps EVERYONE earn more!"
                    />
                  </span>
                  <span className="font-bold text-yellow-400 text-xl">
                    <AnimatedNumber value={`${burningImpact.realAPR}%`} />
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-black/30 rounded-lg">
                  <span className="text-gray-400 flex items-center">
                    Supply Reduction
                    <MetricTooltip 
                      id="supply-reduction"
                      explanation="% of total supply removed FOREVER. Making all remaining tokens more valuable!"
                    />
                  </span>
                  <span className="font-bold text-white text-xl">
                    <AnimatedNumber value={`${burningImpact.supplyReduction}%`} />
                  </span>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-700 text-gray-400 space-y-2">
                <p>🔥 Permanent supply reduction</p>
                <p>💎 Raises bonded ratio (denominator ↓)</p>
                <p>🌊 Helps all stakers earn more</p>
              </div>
            </motion.div>
          </div>
          
          {/* Insight Box */}
          <div className="p-8 bg-gradient-to-br from-purple-900/20 to-green-900/10 border-2 border-purple-500/30 rounded-2xl text-center text-lg leading-relaxed">
            <p>
              <strong className="text-green-400 text-2xl">💡 Two Paths, Same Mission:</strong> Both staking and burning increase the{' '}
              <span className="text-green-400 font-bold">bonded ratio</span> - the key metric that accelerates deflation. 
              Staking increases the <strong>numerator</strong> (more bonded tokens), while burning decreases the{' '}
              <strong>denominator</strong> (less total supply). 
              Both paths push inflation from <span className="text-red-400 font-bold">{currentInflation.toFixed(2)}%</span> down faster, 
              benefiting the entire ecosystem. At <span className="text-green-400 font-bold">{(bondedRatio * 100).toFixed(2)}% bonded</span>, 
              we're accelerating toward 80%+ where deflation happens <strong>55x faster</strong>. 
              Choose your path - <strong className="text-green-400">both support Coreum equally!</strong>
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

