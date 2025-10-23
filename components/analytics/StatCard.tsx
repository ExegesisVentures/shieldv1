/**
 * StatCard Component - Individual stat display card
 * File: components/analytics/StatCard.tsx
 */

'use client';

import { motion } from 'framer-motion';
import { AnimatedNumber } from './AnimatedNumber';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down';
  description?: string;
  loading?: boolean;
  highlight?: boolean;
  small?: boolean;
  showLogo?: boolean;
}

export const StatCard = ({
  title,
  value,
  icon,
  trend,
  description,
  loading,
  highlight,
  small,
  showLogo = false
}: StatCardProps) => {
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <motion.div
      className={`
        relative overflow-hidden rounded-xl p-6
        bg-gradient-to-br from-slate-800/50 to-slate-900/50
        border transition-all duration-400 cursor-pointer
        backdrop-blur-sm
        ${highlight 
          ? 'border-green-500/30 shadow-lg shadow-green-500/10' 
          : 'border-white/5'
        }
        hover:translate-y-[-8px] hover:scale-[1.02]
        hover:border-green-500/40 hover:shadow-xl hover:shadow-green-500/20
      `}
      variants={cardVariants}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className={`
          flex items-center justify-center
          w-14 h-14 rounded-lg flex-shrink-0
          transition-all duration-400
          ${highlight
            ? 'bg-gradient-to-br from-green-500/35 to-green-500/15 text-green-400'
            : 'bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 text-cyan-400'
          }
          shadow-lg
        `}>
          {icon}
        </div>
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
          {title}
        </h3>
      </div>
      
      <div className="mt-4">
        <div className={`
          text-4xl font-bold mb-2 flex items-center gap-2
          ${trend === 'up' ? 'text-green-400' : ''}
          ${trend === 'down' ? 'text-red-400' : ''}
          ${!trend ? 'text-white' : ''}
        `}>
          {showLogo && (
            <img 
              src="/coreum-logo.svg" 
              alt="CORE" 
              className="h-10 w-auto filter drop-shadow-lg"
            />
          )}
          <AnimatedNumber value={value} />
        </div>
        
        {description && (
          <p className="text-sm text-gray-400 leading-relaxed">
            {description}
          </p>
        )}
      </div>
      
      {highlight && (
        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-green-500/10 to-transparent pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-400"></div>
      )}
    </motion.div>
  );
};

