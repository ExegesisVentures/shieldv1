"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { IoGitBranch } from "react-icons/io5";

export default function ProposalsButton({ className = "" }: { className?: string }) {
  const [hasActiveProposals, setHasActiveProposals] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch proposals to check if any are active
    const checkActiveProposals = async () => {
      try {
        const response = await fetch('/api/governance/proposals?enriched=true');
        const data = await response.json();
        
        if (data.success && data.data) {
          const activeCount = data.data.filter((p: any) => 
            p.status === 'PROPOSAL_STATUS_VOTING_PERIOD'
          ).length;
          
          setHasActiveProposals(activeCount > 0);
        }
      } catch (error) {
        console.error('Failed to check active proposals:', error);
      } finally {
        setLoading(false);
      }
    };

    checkActiveProposals();
    
    // Check every 5 minutes
    const interval = setInterval(checkActiveProposals, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <Link 
      href="/proposals" 
      className={`relative inline-flex items-center gap-1.5 ${className}`}
    >
      <span className={hasActiveProposals ? 'animate-pulse' : ''}>
        Proposals
      </span>
      {hasActiveProposals && !loading && (
        <>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
        </>
      )}
      
      <style jsx>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .animate-pulse {
          animation: pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </Link>
  );
}

export function ProposalsButtonMobile({ onClick }: { onClick?: () => void }) {
  const [hasActiveProposals, setHasActiveProposals] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkActiveProposals = async () => {
      try {
        const response = await fetch('/api/governance/proposals?enriched=true');
        const data = await response.json();
        
        if (data.success && data.data) {
          const activeCount = data.data.filter((p: any) => 
            p.status === 'PROPOSAL_STATUS_VOTING_PERIOD'
          ).length;
          
          setHasActiveProposals(activeCount > 0);
        }
      } catch (error) {
        console.error('Failed to check active proposals:', error);
      } finally {
        setLoading(false);
      }
    };

    checkActiveProposals();
    const interval = setInterval(checkActiveProposals, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Link
      href="/proposals"
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors rounded-lg relative"
    >
      <div className="relative">
        <IoGitBranch className={`w-5 h-5 text-gray-700 dark:text-gray-300 ${hasActiveProposals ? 'animate-pulse' : ''}`} />
        {hasActiveProposals && !loading && (
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
          </span>
        )}
      </div>
      <span className="text-gray-700 dark:text-gray-300">Proposals</span>
      {hasActiveProposals && !loading && (
        <span className="ml-auto text-xs bg-green-500 text-white px-2 py-0.5 rounded-full animate-pulse">
          Active
        </span>
      )}
    </Link>
  );
}

