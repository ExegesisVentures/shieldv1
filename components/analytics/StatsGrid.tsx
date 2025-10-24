/**
 * StatsGrid Component - Displays blockchain statistics
 * File: components/analytics/StatsGrid.tsx
 */

'use client';

import { motion } from 'framer-motion';
import { IoTrendingUp, IoCash, IoFlash, IoStatsChart, IoTime, IoBarChart, IoFlame, IoSpeedometer } from 'react-icons/io5';
import { StatCard } from './StatCard';
import { CountdownPie } from './CountdownPie';

interface StatsGridProps {
  stats: {
    currentAPR?: string;
    inflation?: string;
    bondedRatio?: string;
    totalBonded?: string;
    totalSupply?: string;
    lastUpdated?: string;
  } | null;
  loading: boolean;
  totalBurned?: number; // in CORE
  dailyInflationPrinted?: number; // in CORE
}

export const StatsGrid = ({ stats, loading, totalBurned = 0, dailyInflationPrinted = 0 }: StatsGridProps) => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const formatNumber = (num: string) => {
    // Convert from ucore to CORE (divide by 1,000,000)
    const ucoreValue = parseFloat(num);
    const coreValue = ucoreValue / 1_000_000;
    
    if (coreValue >= 1e12) return `${(coreValue / 1e12).toFixed(2)}T`;
    if (coreValue >= 1e9) return `${(coreValue / 1e9).toFixed(2)}B`;
    if (coreValue >= 1e6) return `${(coreValue / 1e6).toFixed(2)}M`;
    if (coreValue >= 1e3) return `${(coreValue / 1e3).toFixed(2)}K`;
    return coreValue.toFixed(2);
  };

  // Calculate deflation speed multiplier based on current bonded ratio
  const calculateDeflationSpeed = () => {
    const bondedPercent = parseFloat(stats?.bondedRatio || '67.23');
    
    // Baseline at 67.24%
    if (bondedPercent < 68) return '1.0';
    if (bondedPercent < 69) return '4.2';
    if (bondedPercent < 70) return '8.5';
    if (bondedPercent < 75) return '12.7';
    if (bondedPercent < 80) return '33.9';
    return '55.2';
  };

  const deflationSpeed = calculateDeflationSpeed();

  return (
    <motion.section
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 my-12"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <StatCard
        title="Current APR"
        value={stats?.currentAPR || '--'}
        icon={<IoTrendingUp size={28} />}
        trend="up"
        description="Annual Percentage Rate for staking"
        loading={loading}
        highlight
      />
      
      <StatCard
        title="Inflation Rate"
        value={stats?.inflation || '--'}
        icon={<IoBarChart size={28} />}
        description="Current blockchain inflation"
        loading={loading}
      />
      
      <StatCard
        title="Bonded Ratio"
        value={stats?.bondedRatio || '--'}
        icon={<IoStatsChart size={28} />}
        description="Percentage of tokens staked"
        loading={loading}
      />
      
      <StatCard
        title="Total Bonded"
        value={stats?.totalBonded ? formatNumber(stats.totalBonded) : '--'}
        icon={<IoCash size={28} />}
        description="Total tokens currently staked"
        loading={loading}
        showLogo
      />
      
      <StatCard
        title="Total Supply"
        value={stats?.totalSupply ? formatNumber(stats.totalSupply) : '--'}
        icon={<IoFlash size={28} />}
        description="Total token supply"
        loading={loading}
        showLogo
      />
      
      <StatCard
        title="Printed Today"
        value={dailyInflationPrinted > 0 ? dailyInflationPrinted.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '--'}
        icon={<IoBarChart size={28} />}
        description="New tokens from inflation today"
        loading={loading}
        trend="down"
        showLogo
      />
      
      <StatCard
        title="Total Burned"
        value={totalBurned > 0 ? totalBurned.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '0'}
        icon={<IoFlame size={28} />}
        description={
          <div className="flex flex-col gap-1">
            <span>{totalBurned > 0 ? "Permanently removed from circulation" : "No tokens burned yet - be the first!"}</span>
            <a 
              href="https://github.com/CoreumFoundation/coreum/discussions/TBD" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-cyan-400 hover:text-cyan-300 underline underline-offset-2 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              📋 View Burn Feature Proposal
            </a>
          </div>
        }
        loading={loading}
        trend="down"
        showLogo
      />
      
      <StatCard
        title="Deflation Speed"
        value={`${deflationSpeed}x`}
        icon={<IoSpeedometer size={28} />}
        description="Current inflation reduction multiplier"
        loading={loading}
        trend="up"
        highlight
      />
      
      <StatCard
        title="Last Updated"
        value={
          stats?.lastUpdated 
            ? new Date(stats.lastUpdated).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
              }) 
            : '--'
        }
        icon={<IoTime size={28} />}
        description={
          <div className="flex items-center gap-2">
            <span>Refreshes every 30s</span>
            <CountdownPie 
              duration={30000} 
              size={18}
              refreshKey={stats?.lastUpdated}
            />
          </div>
        }
        loading={loading}
        small
      />
    </motion.section>
  );
};

