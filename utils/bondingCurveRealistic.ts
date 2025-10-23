/**
 * Realistic Bonding Curve Calculator - CORRECTED
 * File: utils/bondingCurveRealistic.ts
 * 
 * Based on ACTUAL Coreum blockchain parameters - no theoretical BS
 * Caps at 85% bonded (realistic maximum), focuses on speed multiplier
 */

/**
 * Coreum Inflation Parameters (Governance-defined - ACTUAL VALUES)
 */
export const COREUM_PARAMS = {
  GOAL_BONDED: 0.67,           // 67% target bonded ratio
  INFLATION_RATE_CHANGE: 0.13, // 13% max change per year
  INFLATION_MAX: 0.20,         // 20% maximum inflation
  INFLATION_MIN: 0.00,         // 0% minimum (theoretical - would take centuries)
  BLOCKS_PER_YEAR: 17900000,   // Expected block production (CORRECT VALUE)
  SECONDS_PER_BLOCK: 6.3,      // Average block time
  BLOCKS_PER_DAY: 13714,       // 86400 / 6.3
  
  // REALISTIC CONSTRAINTS
  REALISTIC_MAX_BONDED: 0.85,  // 85% is realistically achievable
  PRACTICAL_MAX_BONDED: 0.80,  // 80% is more practical
  HEALTHY_BONDED: 0.70,        // 70% is very healthy
};

export interface BondingCurveRow {
  bondedRatio: number;
  bondedPercent: string;
  label: string;
  isGoal?: boolean;
  isCurrent?: boolean;
  isMax?: boolean;
  highlight?: boolean;
  disabled?: boolean;
  
  // APR calculations
  stakingAPR: number;
  stakingAPRFormatted: string;
  
  realAPR: number;
  realAPRFormatted: string;
  realAPRSign: string;
  
  // Inflation change
  annualReduction: number;
  annualReductionFormatted: string;
  dailyReduction: number;
  dailyReductionFormatted: string;
  
  // Speed metrics
  speedMultiplier: number | null;
  speedMultiplierFormatted: string;
  isIncreasing: boolean;
  isStable: boolean;
  isDecreasing: boolean;
  
  // Timeline predictions
  daysTo15: number | null;
  daysTo12: number | null;
  daysTo10: number | null;
  yearsTo15: string | null;
  yearsTo12: string | null;
  yearsTo10: string | null;
  
  status: string;
  description: string;
}

/**
 * Calculate inflation change rate at a given bonded ratio
 * This is the EXACT formula used on-chain
 * 
 * @param {number} bondedRatio - Current bonded ratio (0.67 = 67%)
 * @returns {object} Inflation change rates
 */
export function calculateInflationChange(bondedRatio: number): {
  annualChange: number;
  perBlockChange: number;
  dailyChange: number;
} {
  const { GOAL_BONDED, INFLATION_RATE_CHANGE, BLOCKS_PER_YEAR, BLOCKS_PER_DAY } = COREUM_PARAMS;
  
  // Core formula from Cosmos SDK mint module
  // When bonded > goal: inflation DECREASES (negative value)
  // When bonded < goal: inflation INCREASES (positive value)
  const annualChange = (1 - bondedRatio / GOAL_BONDED) * INFLATION_RATE_CHANGE;
  const perBlockChange = annualChange / BLOCKS_PER_YEAR;
  const dailyChange = perBlockChange * BLOCKS_PER_DAY;
  
  return {
    annualChange,      // Annual inflation change % (negative = decreasing)
    perBlockChange,    // Per block change (tiny!)
    dailyChange,       // Daily inflation change %
  };
}

/**
 * Calculate Staking APR
 * APR = Inflation / Bonded Ratio
 * 
 * @param {number} inflation - Current inflation rate (0.1751 = 17.51%)
 * @param {number} bondedRatio - Current bonded ratio (0.67 = 67%)
 * @returns {number} Staking APR
 */
export function calculateStakingAPR(inflation: number, bondedRatio: number): number {
  return inflation / bondedRatio;
}

/**
 * Calculate "Real APR" - the advantage stakers have over non-stakers
 * This is APR minus inflation = purchasing power gain
 * 
 * @param {number} stakingAPR - Staking APR
 * @param {number} inflation - Current inflation rate
 * @returns {number} Real APR (purchasing power gain)
 */
export function calculateRealAPR(stakingAPR: number, inflation: number): number {
  return stakingAPR - inflation;
}

/**
 * Calculate speed multiplier compared to baseline
 * Shows how much FASTER inflation decreases at different bonded ratios
 * 
 * @param {number} bondedRatio - Target bonded ratio
 * @param {number} baselineBonded - Baseline bonded ratio to compare against
 * @returns {number | null} Speed multiplier (e.g., 5.0 = 5x faster)
 */
export function calculateSpeedMultiplier(
  bondedRatio: number, 
  baselineBonded: number
): number | null {
  const targetChange = calculateInflationChange(bondedRatio).annualChange;
  const baselineChange = calculateInflationChange(baselineBonded).annualChange;
  
  // If either is positive (inflation increasing), return null
  if (targetChange >= 0 || baselineChange >= 0) {
    return null;
  }
  
  // Return absolute ratio
  return Math.abs(targetChange / baselineChange);
}

/**
 * Calculate days to reach target inflation
 * 
 * @param {number} currentInflation - Current inflation rate
 * @param {number} targetInflation - Target inflation rate
 * @param {number} dailyChange - Daily inflation change rate
 * @returns {number | null} Days to reach target (null if impossible)
 */
export function calculateDaysToTarget(
  currentInflation: number, 
  targetInflation: number, 
  dailyChange: number
): number | null {
  // If inflation is increasing (dailyChange > 0), can't reach lower target
  if (dailyChange >= 0) {
    return null;
  }
  
  // If already at or below target
  if (currentInflation <= targetInflation) {
    return 0;
  }
  
  // Calculate days needed
  const inflationDelta = currentInflation - targetInflation;
  return inflationDelta / Math.abs(dailyChange);
}

/**
 * Generate realistic bonding curve data
 * This creates a table of realistic bonded ratios and their effects
 * 
 * @param {number} currentInflation - Current inflation rate (e.g., 0.1751)
 * @param {number} currentBonded - Current bonded ratio (e.g., 0.6724)
 * @returns {Array} Array of bonding curve data points
 */
export function generateRealisticBondingCurve(
  currentInflation: number = 0.1751, 
  currentBonded: number = 0.6724
): BondingCurveRow[] {
  const { GOAL_BONDED, REALISTIC_MAX_BONDED } = COREUM_PARAMS;
  
  // Define realistic bonded ratio milestones
  const bondedRatios: Array<{
    ratio: number;
    label: string;
    isGoal?: boolean;
    isCurrent?: boolean;
    isMax?: boolean;
    highlight?: boolean;
    disabled?: boolean;
  }> = [
    { ratio: GOAL_BONDED, label: 'Goal', isGoal: true },
    { ratio: currentBonded, label: 'Current', isCurrent: true },
    { ratio: 0.68, label: 'Slightly Higher' },
    { ratio: 0.69, label: 'Higher' },
    { ratio: 0.70, label: 'Healthy' },
    { ratio: 0.71, label: 'Very Healthy' },
    { ratio: 0.72, label: 'Strong' },
    { ratio: 0.73, label: 'Very Strong' },
    { ratio: 0.74, label: 'Excellent' },
    { ratio: 0.75, label: 'Target', highlight: true },
    { ratio: 0.80, label: 'Practical Max' },
    { ratio: REALISTIC_MAX_BONDED, label: 'Theoretical Max', isMax: true, disabled: true },
  ];
  
  // Sort and remove duplicates
  const uniqueRatios = Array.from(
    new Set(bondedRatios.map(r => r.ratio))
  )
    .sort((a, b) => a - b)
    .map(ratio => bondedRatios.find(r => r.ratio === ratio)!);
  
  // Calculate data for each ratio
  return uniqueRatios.map(({ ratio, label, isGoal, isCurrent, isMax, highlight, disabled }) => {
    const inflationChange = calculateInflationChange(ratio);
    const stakingAPR = calculateStakingAPR(currentInflation, ratio);
    const realAPR = calculateRealAPR(stakingAPR, currentInflation);
    const speedMultiplier = calculateSpeedMultiplier(ratio, currentBonded);
    
    // Calculate days to reach key milestones
    const daysTo15 = calculateDaysToTarget(currentInflation, 0.15, inflationChange.dailyChange);
    const daysTo12 = calculateDaysToTarget(currentInflation, 0.12, inflationChange.dailyChange);
    const daysTo10 = calculateDaysToTarget(currentInflation, 0.10, inflationChange.dailyChange);
    
    // Determine status
    let status = '📍';
    let description = 'Current state';
    
    if (isGoal) {
      status = '⚖️';
      description = 'Target equilibrium';
    } else if (isCurrent) {
      status = '📍';
      description = 'Very slow reduction';
    } else if (highlight) {
      status = '🎯';
      description = 'OPTIMAL - Sweet spot';
    } else if (isMax) {
      status = '🔶';
      description = 'Insufficient liquidity';
    } else if (ratio >= 0.80) {
      status = '⚠️';
      description = 'Maximum practical';
    } else if (ratio >= 0.70) {
      status = '✅';
      description = 'Good security';
    } else {
      status = '✅';
      description = 'Easy to achieve';
    }
    
    return {
      bondedRatio: ratio,
      bondedPercent: (ratio * 100).toFixed(2),
      label,
      isGoal,
      isCurrent,
      isMax,
      highlight,
      disabled,
      
      // APR calculations
      stakingAPR: stakingAPR * 100,           // Convert to %
      stakingAPRFormatted: (stakingAPR * 100).toFixed(2),
      
      realAPR: realAPR * 100,                  // Convert to %
      realAPRFormatted: (realAPR * 100).toFixed(2),
      realAPRSign: realAPR > 0 ? '+' : '',
      
      // Inflation change
      annualReduction: inflationChange.annualChange * 100,  // Convert to %
      annualReductionFormatted: (inflationChange.annualChange * 100).toFixed(4),
      dailyReduction: inflationChange.dailyChange * 100,     // Convert to %
      dailyReductionFormatted: (inflationChange.dailyChange * 100).toFixed(6),
      
      // Speed metrics
      speedMultiplier,
      speedMultiplierFormatted: speedMultiplier ? `${speedMultiplier.toFixed(1)}x` : 'N/A',
      isIncreasing: inflationChange.annualChange > 0,
      isStable: Math.abs(inflationChange.annualChange) < 0.0001,
      isDecreasing: inflationChange.annualChange < -0.0001,
      
      // Timeline predictions
      daysTo15,
      daysTo12,
      daysTo10,
      yearsTo15: daysTo15 ? (daysTo15 / 365).toFixed(1) : null,
      yearsTo12: daysTo12 ? (daysTo12 / 365).toFixed(1) : null,
      yearsTo10: daysTo10 ? (daysTo10 / 365).toFixed(1) : null,
      
      status,
      description,
    };
  });
}

/**
 * Get user-friendly message about bonding status
 * 
 * @param {number} bondedRatio - Current bonded ratio
 * @param {number} inflation - Current inflation rate
 * @returns {object} User-friendly messages and recommendations
 */
export function getBondingMessage(bondedRatio: number, inflation: number): {
  status: string;
  emoji: string;
  message: string;
  recommendation: string;
} {
  const { GOAL_BONDED, HEALTHY_BONDED, PRACTICAL_MAX_BONDED } = COREUM_PARAMS;
  const inflationChange = calculateInflationChange(bondedRatio);
  
  let status: string, message: string, recommendation: string, emoji: string;
  
  if (bondedRatio < GOAL_BONDED - 0.02) {
    status = 'low';
    emoji = '⚠️';
    message = `Bonded ratio is BELOW target. Inflation is INCREASING by ${Math.abs(inflationChange.annualChange * 100).toFixed(4)}% per year.`;
    recommendation = 'Stake more CORE to help reduce inflation and earn higher rewards!';
  } else if (bondedRatio < GOAL_BONDED + 0.01) {
    status = 'balanced';
    emoji = '⚖️';
    message = `Bonded ratio is near equilibrium. Inflation is ${inflationChange.annualChange > 0 ? 'slightly increasing' : 'slowly decreasing'}.`;
    recommendation = 'Network is balanced. Staking rewards are stable.';
  } else if (bondedRatio < HEALTHY_BONDED) {
    status = 'good';
    emoji = '✅';
    message = `Bonded ratio is ABOVE target. Inflation is decreasing by ${Math.abs(inflationChange.annualChange * 100).toFixed(4)}% per year.`;
    recommendation = 'Good security! Keep staking to reduce inflation faster.';
  } else if (bondedRatio < PRACTICAL_MAX_BONDED) {
    status = 'excellent';
    emoji = '🚀';
    message = `Bonded ratio is VERY HEALTHY. Inflation is decreasing by ${Math.abs(inflationChange.annualChange * 100).toFixed(4)}% per year.`;
    recommendation = 'Excellent network security! Inflation is decreasing rapidly.';
  } else {
    status = 'exceptional';
    emoji = '🔥';
    message = `Bonded ratio is EXCEPTIONALLY HIGH. Inflation is decreasing by ${Math.abs(inflationChange.annualChange * 100).toFixed(4)}% per year.`;
    recommendation = 'Maximum security achieved! Fastest possible inflation reduction.';
  }
  
  return {
    status,
    emoji,
    message,
    recommendation,
  };
}

/**
 * Format large numbers with appropriate suffix (M, B, T)
 */
export function formatLargeNumber(num: number): string {
  if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return num.toFixed(2);
}

/**
 * Calculate exact tokens needed to reach target bonded ratio
 */
export function tokensNeededForRatio(
  currentBondedRatio: number,
  targetBondedRatio: number,
  totalSupply: number,
  currentBondedTokens: number
): {
  tokensToStake: number;
  percentageIncrease: number;
  newTotalBonded: number;
} {
  // Calculate tokens needed to reach target
  const tokensToStake = (targetBondedRatio * totalSupply) - currentBondedTokens;
  const percentageIncrease = ((tokensToStake / totalSupply) * 100);
  const newTotalBonded = currentBondedTokens + tokensToStake;
  
  return {
    tokensToStake: Math.max(0, tokensToStake),
    percentageIncrease,
    newTotalBonded,
  };
}

export default {
  COREUM_PARAMS,
  calculateInflationChange,
  calculateStakingAPR,
  calculateRealAPR,
  calculateSpeedMultiplier,
  calculateDaysToTarget,
  generateRealisticBondingCurve,
  getBondingMessage,
  formatLargeNumber,
  tokensNeededForRatio,
};

