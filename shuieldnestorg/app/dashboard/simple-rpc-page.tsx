/**
 * SIMPLE RPC DASHBOARD
 * This is how the portfolio should actually work - direct RPC calls, no complexity
 */

'use client';

import { useState, useEffect } from 'react';
import { getCompletePortfolioFromRPC } from '@/utils/coreum/direct-rpc-prices';

interface SimpleToken {
  denom: string;
  amount: string;
  symbol: string;
  decimals: number;
  price: number;
  valueUsd: number;
}

interface SimplePortfolio {
  tokens: SimpleToken[];
  totalValueUsd: number;
}

export default function SimpleRPCDashboard() {
  const [portfolio, setPortfolio] = useState<SimplePortfolio | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [address, setAddress] = useState('');

  const loadPortfolio = async () => {
    if (!address) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log(`🚀 [Simple Dashboard] Loading portfolio for ${address}...`);
      const startTime = Date.now();
      
      const result = await getCompletePortfolioFromRPC(address);
      
      const endTime = Date.now();
      console.log(`✅ [Simple Dashboard] Loaded in ${endTime - startTime}ms`);
      
      setPortfolio(result);
      
    } catch (err) {
      console.error('❌ [Simple Dashboard] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load portfolio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Simple RPC Dashboard
        </h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Load Portfolio</h2>
          
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter Coreum address (e.g., core1...)"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#25d695]"
            />
            <button
              onClick={loadPortfolio}
              disabled={loading || !address}
              className="px-6 py-2 bg-[#25d695] text-white rounded-md hover:bg-[#179b69] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : 'Load Portfolio'}
            </button>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
              <p className="text-red-800">Error: {error}</p>
            </div>
          )}
        </div>
        
        {portfolio && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Portfolio</h2>
              <div className="text-right">
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-green-600">
                  ${portfolio.totalValueUsd.toFixed(2)}
                </p>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Token</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">Balance</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">Price</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.tokens.map((token) => {
                    const balanceFormatted = parseInt(token.amount) / Math.pow(10, token.decimals);
                    
                    return (
                      <tr key={token.denom} className="border-b border-gray-100">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium">{token.symbol}</p>
                            <p className="text-sm text-gray-500">{token.denom}</p>
                          </div>
                        </td>
                        <td className="text-right py-3 px-4">
                          {balanceFormatted.toFixed(4)}
                        </td>
                        <td className="text-right py-3 px-4">
                          ${token.price.toFixed(6)}
                        </td>
                        <td className="text-right py-3 px-4">
                          <span className="font-medium">
                            ${token.valueUsd.toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {portfolio.tokens.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No tokens found for this address
              </div>
            )}
          </div>
        )}
        
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            How This Works
          </h3>
          <ul className="text-blue-800 space-y-2">
            <li>• <strong>Direct RPC calls</strong> - No APIs, no caching, no complexity</li>
            <li>• <strong>One call for balances</strong> - Get all token balances from Coreum RPC</li>
            <li>• <strong>One call for prices</strong> - Get all prices from liquidity pools</li>
            <li>• <strong>Instant results</strong> - No waiting, no loading states, no fallbacks</li>
            <li>• <strong>Always accurate</strong> - Direct on-chain data, always up-to-date</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
