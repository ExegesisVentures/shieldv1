"use client";

import { useState, useEffect } from "react";
import { IoGitBranch, IoFilter, IoSearch, IoRefresh, IoInformationCircle, IoAdd } from "react-icons/io5";
import ProposalCard from "@/components/governance/ProposalCard";
import ProposalDetailModal from "@/components/governance/ProposalDetailModal";
import VotingHistory from "@/components/governance/VotingHistory";
import CreateProposalModal from "@/components/governance/CreateProposalModal";
import { EnrichedProposal } from "@/types/governance";
import ErrorBoundary from "@/components/ErrorBoundary";
import { createSupabaseClient } from "@/utils/supabase/client";

type ProposalStatus = 'all' | 'voting' | 'passed' | 'rejected' | 'deposit';

function GovernanceContent() {
  const [proposals, setProposals] = useState<EnrichedProposal[]>([]);
  const [filteredProposals, setFilteredProposals] = useState<EnrichedProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<EnrichedProposal | null>(null);
  const [statusFilter, setStatusFilter] = useState<ProposalStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [showVotingHistory, setShowVotingHistory] = useState(false);
  const [showCreateProposal, setShowCreateProposal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    voting: 0,
    passed: 0,
    rejected: 0
  });

  // Get user's connected wallet address
  useEffect(() => {
    const getUserAddress = async () => {
      try {
        // Check for connected wallet (Keplr, Leap, etc.)
        if (window.keplr) {
          const chainId = 'coreum-mainnet-1';
          await window.keplr.enable(chainId);
          const offlineSigner = window.keplr.getOfflineSigner(chainId);
          const accounts = await offlineSigner.getAccounts();
          if (accounts.length > 0) {
            setUserAddress(accounts[0].address);
          }
        }
      } catch (error) {
        console.error('Failed to get user address:', error);
      }
    };

    getUserAddress();
  }, []);

  useEffect(() => {
    loadProposals();
  }, []);

  useEffect(() => {
    filterProposals();
  }, [proposals, statusFilter, searchQuery]);

  const loadProposals = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/governance/proposals?enriched=true');
      const data = await response.json();
      
      if (data.success) {
        setProposals(data.data || []);
        
        // Calculate stats
        const allProposals = data.data || [];
        setStats({
          total: allProposals.length,
          voting: allProposals.filter((p: EnrichedProposal) => 
            p.status === 'PROPOSAL_STATUS_VOTING_PERIOD'
          ).length,
          passed: allProposals.filter((p: EnrichedProposal) => 
            p.status === 'PROPOSAL_STATUS_PASSED'
          ).length,
          rejected: allProposals.filter((p: EnrichedProposal) => 
            p.status === 'PROPOSAL_STATUS_REJECTED'
          ).length,
        });
      }
    } catch (error) {
      console.error('Failed to load proposals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProposals();
    setRefreshing(false);
  };

  const filterProposals = () => {
    let filtered = [...proposals];

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => {
        switch (statusFilter) {
          case 'voting':
            return p.status === 'PROPOSAL_STATUS_VOTING_PERIOD';
          case 'passed':
            return p.status === 'PROPOSAL_STATUS_PASSED';
          case 'rejected':
            return p.status === 'PROPOSAL_STATUS_REJECTED' || 
                   p.status === 'PROPOSAL_STATUS_FAILED';
          case 'deposit':
            return p.status === 'PROPOSAL_STATUS_DEPOSIT_PERIOD';
          default:
            return true;
        }
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.content?.title?.toLowerCase().includes(query) ||
        p.content?.description?.toLowerCase().includes(query) ||
        p.proposal_id?.toString().includes(query)
      );
    }

    setFilteredProposals(filtered);
  };

  const handleVoteSuccess = () => {
    // Refresh proposals after successful vote
    handleRefresh();
    // Close modal
    setSelectedProposal(null);
  };

  if (loading) {
    return (
      <main className="min-h-screen neo-gradient-bg p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen neo-gradient-bg p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl">
              <IoGitBranch className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 
                className="text-4xl sm:text-5xl font-bold mb-2 relative"
                style={{
                  textShadow: '0 4px 8px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.3), 0 8px 16px rgba(168,85,247,0.2)',
                  transform: 'perspective(1000px) translateZ(0)',
                }}
              >
                <span 
                  className="governance-animated inline-block bg-gradient-to-r from-white via-purple-100 to-white bg-clip-text text-transparent"
                  style={{
                    filter: 'drop-shadow(0 0 20px rgba(168,85,247,0.3))'
                  }}
                >
                  {"Governance".split("").map((char, index) => (
                    <span
                      key={index}
                      className="governance-letter"
                      style={{
                        animationDelay: `${index * 0.05}s`,
                        display: char === " " ? "inline" : "inline-block",
                      }}
                    >
                      {char === " " ? "\u00A0" : char}
                    </span>
                  ))}
                </span>
              </h1>
              <p className="text-lg text-gray-400">
                Participate in Coreum on-chain governance
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="card-coreum p-4 hover:scale-105 transition-transform duration-300">
              <div className="text-gray-400 text-sm mb-1">Total Proposals</div>
              <div className="text-3xl font-bold text-white">{stats.total}</div>
            </div>
            <div className="card-coreum p-4 hover:scale-105 transition-transform duration-300 border-2 border-blue-500/30">
              <div className="text-gray-400 text-sm mb-1">Active Votes</div>
              <div className="text-3xl font-bold text-blue-400">{stats.voting}</div>
            </div>
            <div className="card-coreum p-4 hover:scale-105 transition-transform duration-300 border-2 border-green-500/30">
              <div className="text-gray-400 text-sm mb-1">Passed</div>
              <div className="text-3xl font-bold text-green-400">{stats.passed}</div>
            </div>
            <div className="card-coreum p-4 hover:scale-105 transition-transform duration-300 border-2 border-red-500/30">
              <div className="text-gray-400 text-sm mb-1">Rejected</div>
              <div className="text-3xl font-bold text-red-400">{stats.rejected}</div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="card-coreum p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search proposals..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              {/* Status Filter */}
              <div className="flex gap-2">
                {[
                  { value: 'all', label: 'All', icon: IoFilter },
                  { value: 'voting', label: 'Voting', icon: IoGitBranch },
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setStatusFilter(value as ProposalStatus)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                      statusFilter === value
                        ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-500/50'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                ))}

                {/* Refresh Button */}
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-medium transition-all duration-300 disabled:opacity-50"
                  title="Refresh proposals"
                >
                  <IoRefresh className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">{refreshing ? 'Loading...' : 'Refresh'}</span>
                </button>

                {/* Create Proposal Button */}
                <button
                  onClick={() => setShowCreateProposal(true)}
                  disabled={!userAddress}
                  className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:shadow-lg hover:shadow-purple-500/50 text-white rounded-lg font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={userAddress ? "Create a new proposal" : "Connect wallet to create proposal"}
                >
                  <IoAdd className="w-5 h-5" />
                  <span className="hidden sm:inline">Create Proposal</span>
                </button>
              </div>
            </div>

            {userAddress && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <button
                  onClick={() => setShowVotingHistory(!showVotingHistory)}
                  className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-2"
                >
                  <IoInformationCircle className="w-4 h-4" />
                  {showVotingHistory ? 'Hide' : 'View'} Your Voting History
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Voting History (if toggled) */}
        {showVotingHistory && userAddress && (
          <div className="mb-6">
            <VotingHistory userAddress={userAddress} />
          </div>
        )}

        {/* Proposals List */}
        <div className="space-y-4">
          {filteredProposals.length === 0 ? (
            <div className="card-coreum p-12 text-center">
              <IoInformationCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">
                No proposals found
              </h3>
              <p className="text-gray-500">
                {searchQuery 
                  ? 'Try adjusting your search query or filters'
                  : 'Check back later for new governance proposals'
                }
              </p>
            </div>
          ) : (
            filteredProposals.map((proposal) => (
              <ProposalCard
                key={proposal.proposal_id}
                proposal={proposal}
                userAddress={userAddress}
                onClick={() => setSelectedProposal(proposal)}
              />
            ))
          )}
        </div>
      </div>

      {/* Proposal Detail Modal */}
      {selectedProposal && (
        <ProposalDetailModal
          proposal={selectedProposal}
          userAddress={userAddress}
          isOpen={!!selectedProposal}
          onClose={() => setSelectedProposal(null)}
          onVoteSuccess={handleVoteSuccess}
        />
      )}

      {/* Create Proposal Modal */}
      <CreateProposalModal
        isOpen={showCreateProposal}
        onClose={() => setShowCreateProposal(false)}
        userAddress={userAddress}
        onSuccess={handleRefresh}
      />

      {/* Add custom CSS for animations */}
      <style jsx global>{`
        @keyframes governance-letter-bounce {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-10px) scale(1.05); }
        }

        .governance-letter {
          animation: governance-letter-bounce 2s ease-in-out infinite;
          transition: all 0.3s ease;
        }

        .governance-letter:hover {
          transform: scale(1.2) translateY(-5px);
          filter: drop-shadow(0 0 10px rgba(168,85,247,0.8));
        }
      `}</style>
    </main>
  );
}

export default function GovernancePage() {
  return (
    <ErrorBoundary>
      <GovernanceContent />
    </ErrorBoundary>
  );
}

