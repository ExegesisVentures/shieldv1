/**
 * Bonding Curve Data Generator
 * File: utils/bondingCurveData.ts
 * 
 * Generate accurate bonding curve table data based on Coreum/Cosmos inflation mechanics
 */

// Coreum constants
const GOAL_BONDED_RATIO = 0.67; // 67% target
const INFLATION_RATE_CHANGE = 0.13; // 13% max annual change

export interface BondingCurveRow {
  bondedRatio: number; // as percentage (67 for 67%)
  annualReduction: number; // annual inflation reduction % per year
  dailyReduction: number; // daily inflation reduction %
  apr: number; // staking APR at this bonded ratio
  inflationRate: number; // projected inflation rate (current - reduction over time)
  realAPR: number; // apr - inflation (actual earnings)
  daysToTarget: number; // days to reduce from current to 15% inflation
  yearsToTarget: number; // years to reduce from current to 15% inflation
}

/**
 * Calculate inflation rate change per year based on bonded ratio
 * Formula from Cosmos SDK: (1 - bonded_ratio/goal) × inflation_rate_change
 */
export function calculateAnnualInflationChange(bondedRatio: number): number {
  const bondedRatioChange = (1 - bondedRatio / GOAL_BONDED_RATIO);
  const annualChange = bondedRatioChange * INFLATION_RATE_CHANGE;
  
  // Negative = inflation decreasing (good)
  // Positive = inflation increasing (bad)
  return -annualChange;
}

/**
 * Calculate daily inflation change
 */
export function calculateDailyInflationChange(annualChange: number): number {
  return annualChange / 365;
}

/**
 * Calculate days to reach target inflation from current inflation
 */
export function calculateDaysToTarget(
  currentInflation: number,
  targetInflation: number,
  dailyReduction: number
): number {
  if (dailyReduction >= 0 || currentInflation <= targetInflation) {
    return Infinity;
  }
  
  const inflationDifference = currentInflation - targetInflation;
  return inflationDifference / Math.abs(dailyReduction);
}

/**
 * Generate complete bonding curve table
 */
export function generateBondingCurveTable(
  currentInflation: number = 17.51, // Current Coreum inflation %
  targetInflation: number = 15 // Target we're measuring to
): BondingCurveRow[] {
  // Generate table for key bonded ratios
  const ratios = [67.00, 67.24, 68.00, 69.00, 70.00, 71.00, 72.00, 73.00, 74.00, 75.00, 80.00, 85.00, 90.00, 95.00, 100.00];
  
  return ratios.map(ratio => {
    const bondedRatioDecimal = ratio / 100;
    const annualReduction = calculateAnnualInflationChange(bondedRatioDecimal);
    const dailyReduction = calculateDailyInflationChange(annualReduction);
    const daysToTarget = calculateDaysToTarget(currentInflation, targetInflation, dailyReduction);
    const yearsToTarget = daysToTarget / 365;
    
    // Calculate APR at this bonded ratio
    // APR = inflation / bonded_ratio
    const apr = (currentInflation / ratio) * 100;
    
    // For inflation rate, use current inflation as baseline
    // (In reality, it would gradually decrease, but we show current state)
    const inflationRate = currentInflation;
    
    // Real APR = APR - Inflation (what stakers actually earn)
    const realAPR = apr - inflationRate;
    
    return {
      bondedRatio: ratio,
      annualReduction: annualReduction * 100, // Convert to percentage
      dailyReduction: dailyReduction * 100, // Convert to percentage
      apr,
      inflationRate,
      realAPR,
      daysToTarget,
      yearsToTarget,
    };
  });
}

/**
 * Format number for display
 */
export function formatBondingNumber(num: number, decimals: number = 4): string {
  if (!isFinite(num)) return 'N/A';
  return num.toFixed(decimals);
}

