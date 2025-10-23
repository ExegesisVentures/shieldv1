/**
 * useCoreum Hook - Fetch Coreum blockchain data
 * File: hooks/useCoreum.ts
 * 
 * Next.js adapted version for ShieldNest
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface CoreumStats {
  currentAPR: string;
  inflation: string;
  bondedRatio: string;
  totalBonded: string;
  totalSupply: string;
  lastUpdated: string;
}

// Coreum mainnet RPC endpoints
const COREUM_BASE = 'https://full-node.mainnet-1.coreum.dev:1317';
const COREUM_INFLATION_URL = `${COREUM_BASE}/cosmos/mint/v1beta1/inflation`;
const COREUM_STAKING_POOL_URL = `${COREUM_BASE}/cosmos/staking/v1beta1/pool`;
const COREUM_ANNUAL_PROVISIONS_URL = `${COREUM_BASE}/cosmos/mint/v1beta1/annual_provisions`;

export const useCoreum = () => {
  const [stats, setStats] = useState<CoreumStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [interpolatedStats, setInterpolatedStats] = useState<CoreumStats | null>(null);
  const previousStatsRef = useRef<CoreumStats | null>(null);
  const interpolationFrameRef = useRef<number>();
  
  // Interpolate between old and new values for smooth transitions
  const interpolateStats = (oldStats: CoreumStats, newStats: CoreumStats, progress: number) => {
    const lerp = (start: number, end: number, t: number) => start + (end - start) * t;
    
    const parsePercent = (str: string) => parseFloat(str.replace('%', ''));
    
    return {
      ...newStats,
      currentAPR: `${lerp(parsePercent(oldStats.currentAPR), parsePercent(newStats.currentAPR), progress).toFixed(2)}%`,
      inflation: `${lerp(parsePercent(oldStats.inflation), parsePercent(newStats.inflation), progress).toFixed(2)}%`,
      bondedRatio: `${lerp(parsePercent(oldStats.bondedRatio), parsePercent(newStats.bondedRatio), progress).toFixed(2)}%`,
    };
  };
  
  // Animate transition between values
  useEffect(() => {
    if (!previousStatsRef.current || !stats) return;
    
    const startTime = Date.now();
    const duration = 1500; // 1.5 seconds transition
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      
      const interpolated = interpolateStats(previousStatsRef.current!, stats, eased);
      setInterpolatedStats(interpolated);
      
      if (progress < 1) {
        interpolationFrameRef.current = requestAnimationFrame(animate);
      }
    };
    
    interpolationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (interpolationFrameRef.current) {
        cancelAnimationFrame(interpolationFrameRef.current);
      }
    };
  }, [stats]);

  const fetchStats = useCallback(async () => {
    try {
      // Only show loading on initial fetch, not on refreshes
      if (!stats) {
        setLoading(true);
      }
      setError(null);

      console.log('📊 Fetching Coreum blockchain data...');

      // Fetch inflation, staking pool, and annual provisions data in parallel
      const [inflationRes, stakingPoolRes, annualProvisionsRes] = await Promise.all([
        fetch(COREUM_INFLATION_URL).then(r => r.json()),
        fetch(COREUM_STAKING_POOL_URL).then(r => r.json()),
        fetch(COREUM_ANNUAL_PROVISIONS_URL).then(r => r.json())
      ]);

      console.log('✅ Coreum data fetched successfully');

      // Parse inflation rate
      const inflation = parseFloat(inflationRes.inflation);
      const inflationPercentage = (inflation * 100).toFixed(2) + '%';

      // Parse annual provisions
      const annualProvisions = parseFloat(annualProvisionsRes.annual_provisions);
      
      // Calculate total supply: annual_provisions / inflation
      const totalSupply = (annualProvisions / inflation).toString();

      // Parse staking pool data
      const bondedTokens = stakingPoolRes.pool.bonded_tokens;

      // Calculate bonded ratio
      const bondedRatio = parseFloat(bondedTokens) / parseFloat(totalSupply);
      const bondedRatioPercentage = (bondedRatio * 100).toFixed(2) + '%';

      // Calculate APR
      const apr = inflation / bondedRatio;
      const aprPercentage = (apr * 100).toFixed(2) + '%';

      const newStats = {
        currentAPR: aprPercentage,
        inflation: inflationPercentage,
        bondedRatio: bondedRatioPercentage,
        totalBonded: bondedTokens,
        totalSupply: totalSupply,
        lastUpdated: new Date().toISOString(),
      };

      previousStatsRef.current = stats; // Store previous for interpolation
      setStats(newStats);
    } catch (err) {
      console.error('❌ Error fetching Coreum stats:', err);
      setError('Failed to fetch blockchain data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [stats]);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, [fetchStats]);

  return {
    stats: interpolatedStats || stats,
    loading,
    error,
    refresh: fetchStats,
  };
};

