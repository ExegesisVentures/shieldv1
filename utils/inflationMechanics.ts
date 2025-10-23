/**
 * Coreum Inflation Mechanics Utility
 * File: utils/inflationMechanics.ts
 * 
 * Detailed calculations for how bonded ratio affects inflation reduction rate
 * Based on Coreum's inflation mechanism where higher bonded ratio = faster deflation
 */

export interface BondedRatioScenario {
  bondedRatio: number; // as percentage (e.g., 67 for 67%)
  inflationRate: number; // annual inflation %
  apr: number; // staking APR %
  inflationPerBlock: number; // CORE tokens minted per block
  inflationPerDay: number; // CORE tokens minted per day
  inflationPerYear: number; // CORE tokens minted per year
  deflationSpeed: number; // how fast inflation reduces (multiplier compared to baseline)
  timeToNextInflationDrop: number; // days until inflation drops by 0.1%
}

export interface InflationComparison {
  current: BondedRatioScenario;
  scenario70: BondedRatioScenario;
  scenario75: BondedRatioScenario;
  speedup70: number; // how much faster at 70% vs current
  speedup75: number; // how much faster at 75% vs current
}

// Coreum blockchain constants
const BLOCK_TIME_SECONDS = 6; // ~6 seconds per block
const BLOCKS_PER_DAY = (24 * 60 * 60) / BLOCK_TIME_SECONDS;
const BLOCKS_PER_YEAR = BLOCKS_PER_DAY * 365;

// Coreum inflation parameters (CORRECTED VALUES)
const MIN_INFLATION = 0.07; // 7% minimum inflation
const MAX_INFLATION = 0.20; // 20% maximum inflation
const GOAL_BONDED_RATIO = 0.67; // 67% target bonded ratio
const INFLATION_RATE_CHANGE = 0.13; // 13% max annual change in inflation rate
const BLOCKS_PER_YEAR_PARAM = 17900000; // ✅ CORRECT: Coreum parameter (17.9M blocks/year)

/**
 * Calculate Coreum inflation rate based on bonded ratio
 * This follows the Cosmos SDK inflation algorithm used by Coreum
 */
export function calculateCoreumInflationRate(
  bondedRatio: number, // as decimal (0.67 for 67%)
  currentInflation: number // as decimal (0.18 for 18%)
): number {
  const bondedRatioChange = (1 - bondedRatio / GOAL_BONDED_RATIO);
  
  // Calculate inflation rate change per block
  const inflationRateChangePerBlock = 
    (1 - bondedRatioChange) * (INFLATION_RATE_CHANGE / BLOCKS_PER_YEAR_PARAM);
  
  // When bonded ratio is ABOVE goal (67%), inflation DECREASES
  // When bonded ratio is BELOW goal, inflation INCREASES
  let newInflation = currentInflation;
  
  if (bondedRatio > GOAL_BONDED_RATIO) {
    // Decrease inflation - the higher bonded ratio, the faster it decreases
    const decreasePerBlock = Math.abs(inflationRateChangePerBlock);
    newInflation = currentInflation - decreasePerBlock;
  } else {
    // Increase inflation
    newInflation = currentInflation + Math.abs(inflationRateChangePerBlock);
  }
  
  // Clamp to min/max bounds
  return Math.max(MIN_INFLATION, Math.min(MAX_INFLATION, newInflation));
}

/**
 * Calculate how fast inflation reduces per block at a given bonded ratio
 */
export function calculateInflationReductionRate(bondedRatio: number): number {
  if (bondedRatio <= GOAL_BONDED_RATIO) {
    return 0; // No reduction below target
  }
  
  const bondedRatioChange = (1 - bondedRatio / GOAL_BONDED_RATIO);
  const reductionPerBlock = 
    (1 - bondedRatioChange) * (INFLATION_RATE_CHANGE / BLOCKS_PER_YEAR_PARAM);
  
  return Math.abs(reductionPerBlock);
}

/**
 * Calculate complete scenario for a given bonded ratio
 */
export function calculateScenario(
  bondedRatio: number, // as percentage (67 for 67%)
  totalSupply: number, // total CORE supply
  currentInflationRate: number // as percentage (18 for 18%)
): BondedRatioScenario {
  const bondedRatioDecimal = bondedRatio / 100;
  const inflationDecimal = currentInflationRate / 100;
  
  // Calculate APR (inflation divided by bonded ratio)
  const apr = (inflationDecimal / bondedRatioDecimal) * 100;
  
  // Calculate inflation per time period
  const inflationPerYear = totalSupply * inflationDecimal;
  const inflationPerDay = inflationPerYear / 365;
  const inflationPerBlock = inflationPerYear / BLOCKS_PER_YEAR;
  
  // Calculate deflation speed (how fast inflation reduces)
  const reductionPerBlock = calculateInflationReductionRate(bondedRatioDecimal);
  const reductionPerDay = reductionPerBlock * BLOCKS_PER_DAY;
  
  // Calculate deflation speed multiplier compared to 67% baseline
  const baselineReduction = calculateInflationReductionRate(0.67);
  const deflationSpeed = baselineReduction > 0 ? reductionPerBlock / baselineReduction : 1;
  
  // Calculate days to reduce inflation by 0.1%
  const timeToNextInflationDrop = reductionPerDay > 0 
    ? (0.001 / reductionPerDay) // 0.001 = 0.1% as decimal
    : Infinity;
  
  return {
    bondedRatio,
    inflationRate: currentInflationRate,
    apr,
    inflationPerBlock,
    inflationPerDay,
    inflationPerYear,
    deflationSpeed,
    timeToNextInflationDrop,
  };
}

/**
 * Create comparison between current bonded ratio and target scenarios
 */
export function createInflationComparison(
  currentBondedRatio: number, // as percentage
  totalSupply: number,
  currentInflationRate: number // as percentage
): InflationComparison {
  const current = calculateScenario(currentBondedRatio, totalSupply, currentInflationRate);
  const scenario70 = calculateScenario(70, totalSupply, currentInflationRate);
  const scenario75 = calculateScenario(75, totalSupply, currentInflationRate);
  
  // Calculate speedup factors
  const speedup70 = current.deflationSpeed > 0 
    ? scenario70.deflationSpeed / current.deflationSpeed 
    : scenario70.deflationSpeed;
  
  const speedup75 = current.deflationSpeed > 0 
    ? scenario75.deflationSpeed / current.deflationSpeed 
    : scenario75.deflationSpeed;
  
  return {
    current,
    scenario70,
    scenario75,
    speedup70,
    speedup75,
  };
}

/**
 * Calculate exact tokens needed to reach target bonded ratio
 */
export function tokensNeededForRatio(
  currentBondedRatio: number, // as percentage
  targetBondedRatio: number, // as percentage
  totalSupply: number,
  currentBondedTokens: number
): {
  tokensToStake: number;
  percentageIncrease: number;
  newTotalBonded: number;
} {
  const currentRatioDecimal = currentBondedRatio / 100;
  const targetRatioDecimal = targetBondedRatio / 100;
  
  // Calculate tokens needed to reach target
  const tokensToStake = (targetRatioDecimal * totalSupply) - currentBondedTokens;
  const percentageIncrease = ((tokensToStake / totalSupply) * 100);
  const newTotalBonded = currentBondedTokens + tokensToStake;
  
  return {
    tokensToStake: Math.max(0, tokensToStake),
    percentageIncrease,
    newTotalBonded,
  };
}

/**
 * Calculate inflation reduction timeline
 */
export function calculateInflationTimeline(
  startingInflation: number, // as percentage
  targetInflation: number, // as percentage
  bondedRatio: number, // as percentage
  totalSupply: number
): {
  daysToTarget: number;
  blocksToTarget: number;
  inflationReductionPerDay: number;
  inflationReductionPerBlock: number;
} {
  const bondedRatioDecimal = bondedRatio / 100;
  const reductionPerBlock = calculateInflationReductionRate(bondedRatioDecimal);
  const reductionPerDay = reductionPerBlock * BLOCKS_PER_DAY;
  
  const inflationDifference = (startingInflation - targetInflation) / 100; // as decimal
  
  if (reductionPerBlock <= 0 || inflationDifference <= 0) {
    return {
      daysToTarget: Infinity,
      blocksToTarget: Infinity,
      inflationReductionPerDay: reductionPerDay * 100, // convert to percentage
      inflationReductionPerBlock: reductionPerBlock * 100, // convert to percentage
    };
  }
  
  const blocksToTarget = inflationDifference / reductionPerBlock;
  const daysToTarget = blocksToTarget / BLOCKS_PER_DAY;
  
  return {
    daysToTarget,
    blocksToTarget,
    inflationReductionPerDay: reductionPerDay * 100, // convert to percentage
    inflationReductionPerBlock: reductionPerBlock * 100, // convert to percentage
  };
}

