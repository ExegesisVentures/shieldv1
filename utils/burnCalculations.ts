/**
 * Burn Calculations Utility
 * File: utils/burnCalculations.ts
 * 
 * Calculations for token burning impact on inflation and supply
 */

export interface BurnImpact {
  burnAmount: number;
  percentOfSupply: number;
  newCirculatingSupply: number;
  supplyReduction: number;
  inflationImpact: number;
  projectedInflationRate: number;
  yearlyDilutionSaved: number;
  stakingAdvantageIncrease: number;
}

export interface InflationProjection {
  currentInflation: number;
  targetInflation: number;
  daysToTarget: number;
  yearsToTarget: number;
  burnNeeded: number;
  progressPercentage: number;
}

/**
 * Calculate the impact of burning tokens
 */
export function calculateBurnImpact(
  burnAmount: number,
  totalSupply: number,
  currentInflation: number,
  bondedRatio: number
): BurnImpact {
  // Calculate percentage of supply being burned
  const percentOfSupply = (burnAmount / totalSupply) * 100;

  // Calculate new circulating supply
  const newCirculatingSupply = totalSupply - burnAmount;
  const supplyReduction = burnAmount;

  // Estimate inflation impact
  // Simplified model: burning reduces effective inflation
  const inflationImpact = (burnAmount / totalSupply) * currentInflation;
  const projectedInflationRate = Math.max(7, currentInflation - inflationImpact); // Min 7% floor

  // Calculate dilution saved
  const yearlyDilutionSaved = (currentInflation / 100) * burnAmount;

  // Calculate staking advantage increase
  const currentAPR = (currentInflation / bondedRatio) * 100;
  const newAPR = (projectedInflationRate / bondedRatio) * 100;
  const stakingAdvantageIncrease = currentAPR - newAPR;

  return {
    burnAmount,
    percentOfSupply,
    newCirculatingSupply,
    supplyReduction,
    inflationImpact,
    projectedInflationRate,
    yearlyDilutionSaved,
    stakingAdvantageIncrease,
  };
}

/**
 * Calculate time to reach target inflation with current burn rate
 */
export function calculateInflationProjection(
  currentInflation: number,
  targetInflation: number,
  totalSupply: number,
  burnRatePerDay: number
): InflationProjection {
  const inflationDifference = currentInflation - targetInflation;
  
  // Calculate progress percentage (how close we are to the target)
  // Progress is based on how much we've reduced from a theoretical starting point
  let progressPercentage = 0;
  
  if (inflationDifference <= 0) {
    // Already at or below target
    progressPercentage = 100;
  } else if (currentInflation > 0) {
    // Calculate relative progress
    // The closer the target, the higher the progress
    progressPercentage = Math.max(0, (1 - (inflationDifference / currentInflation)) * 100);
  }
  
  if (inflationDifference <= 0 || burnRatePerDay <= 0) {
    return {
      currentInflation,
      targetInflation,
      daysToTarget: Infinity,
      yearsToTarget: Infinity,
      burnNeeded: 0,
      progressPercentage: inflationDifference <= 0 ? 100 : 0,
    };
  }

  // Simplified calculation: assumes linear relationship
  const dailyInflationReduction = (burnRatePerDay / totalSupply) * currentInflation;
  const daysToTarget = inflationDifference / dailyInflationReduction;
  const yearsToTarget = daysToTarget / 365;

  const burnNeeded = burnRatePerDay * daysToTarget;

  return {
    currentInflation,
    targetInflation,
    daysToTarget: Math.ceil(daysToTarget),
    yearsToTarget: parseFloat(yearsToTarget.toFixed(2)),
    burnNeeded: Math.ceil(burnNeeded),
    progressPercentage: parseFloat(progressPercentage.toFixed(2)),
  };
}

/**
 * Format large numbers with suffixes (K, M, B)
 */
export function formatLargeNumber(num: number): string {
  if (num >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(2) + 'B';
  }
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(2) + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(2) + 'K';
  }
  return num.toFixed(2);
}

/**
 * Calculate burn rate acceleration bonus
 * More burns = faster inflation reduction
 */
export function calculateBurnBonus(
  burnsInLast24h: number,
  averageDailyBurns: number
): {
  multiplier: number;
  bonusPercentage: number;
  message: string;
} {
  if (averageDailyBurns === 0) {
    return {
      multiplier: 1,
      bonusPercentage: 0,
      message: 'Start burning to accelerate inflation reduction!',
    };
  }

  const ratio = burnsInLast24h / averageDailyBurns;
  
  let multiplier = 1;
  let message = '';

  if (ratio >= 2) {
    multiplier = 1.5;
    message = '🔥 FIRE SALE! 50% bonus acceleration!';
  } else if (ratio >= 1.5) {
    multiplier = 1.25;
    message = '🚀 HOT! 25% bonus acceleration!';
  } else if (ratio >= 1.2) {
    multiplier = 1.1;
    message = '⚡ Warming up! 10% bonus acceleration!';
  } else {
    message = 'Burn more to unlock acceleration bonuses!';
  }

  const bonusPercentage = (multiplier - 1) * 100;

  return {
    multiplier,
    bonusPercentage,
    message,
  };
}

/**
 * Calculate staker advantage vs non-staker
 */
export function calculateStakerAdvantage(
  apr: number,
  inflation: number
): {
  stakerGain: number;
  nonStakerLoss: number;
  netAdvantage: number;
  advantageDescription: string;
} {
  const stakerGain = apr;
  const nonStakerLoss = inflation;
  const netAdvantage = apr - inflation;

  let advantageDescription = '';
  
  if (netAdvantage > 15) {
    advantageDescription = 'MASSIVE advantage for stakers!';
  } else if (netAdvantage > 10) {
    advantageDescription = 'Strong advantage for stakers!';
  } else if (netAdvantage > 5) {
    advantageDescription = 'Good advantage for stakers';
  } else {
    advantageDescription = 'Moderate advantage for stakers';
  }

  return {
    stakerGain,
    nonStakerLoss,
    netAdvantage,
    advantageDescription,
  };
}

/**
 * Calculate deflationary milestones
 */
export function calculateDeflationaryMilestones(
  currentSupply: number,
  burnRatePerDay: number
): {
  milestone: string;
  tokensNeeded: number;
  daysToMilestone: number;
  dateEstimate: Date;
}[] {
  const milestones = [
    { supply: 750_000_000, label: '750M Supply' },
    { supply: 700_000_000, label: '700M Supply' },
    { supply: 650_000_000, label: '650M Supply' },
    { supply: 600_000_000, label: '600M Supply' },
    { supply: 500_000_000, label: '500M Supply' },
  ];

  return milestones
    .filter(m => m.supply < currentSupply)
    .map(m => {
      const tokensNeeded = currentSupply - m.supply;
      const daysToMilestone = burnRatePerDay > 0 ? tokensNeeded / burnRatePerDay : Infinity;
      const dateEstimate = new Date();
      dateEstimate.setDate(dateEstimate.getDate() + daysToMilestone);

      return {
        milestone: m.label,
        tokensNeeded,
        daysToMilestone: Math.ceil(daysToMilestone),
        dateEstimate,
      };
    });
}

