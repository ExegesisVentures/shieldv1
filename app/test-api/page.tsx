"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function APITestPage() {
  const [priceData, setPriceData] = useState<any>(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);

  const [walletAddress, setWalletAddress] = useState("");
  const [rewardsData, setRewardsData] = useState<any>(null);
  const [rewardsLoading, setRewardsLoading] = useState(false);
  const [rewardsError, setRewardsError] = useState<string | null>(null);

  const testPriceAPI = async () => {
    setPriceLoading(true);
    setPriceError(null);
    setPriceData(null);

    try {
      console.log("🔍 Testing Price API...");
      const response = await fetch("/api/prices/base-tokens");
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("✅ Price API Response:", data);
      setPriceData(data);
    } catch (error: any) {
      console.error("❌ Price API Error:", error);
      setPriceError(error.message || "Failed to fetch prices");
    } finally {
      setPriceLoading(false);
    }
  };

  const testRewardsAPI = async () => {
    if (!walletAddress) {
      setRewardsError("Please enter a wallet address");
      return;
    }

    setRewardsLoading(true);
    setRewardsError(null);
    setRewardsData(null);

    try {
      console.log(`🔍 Testing Rewards API for ${walletAddress}...`);
      const response = await fetch(`/api/coreum/user-rewards?addresses=${walletAddress}`);
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("✅ Rewards API Response:", data);
      setRewardsData(data);
    } catch (error: any) {
      console.error("❌ Rewards API Error:", error);
      setRewardsError(error.message || "Failed to fetch rewards");
    } finally {
      setRewardsLoading(false);
    }
  };

  const testRewardsRefresh = async () => {
    if (!walletAddress) {
      setRewardsError("Please enter a wallet address");
      return;
    }

    setRewardsLoading(true);
    setRewardsError(null);
    setRewardsData(null);

    try {
      console.log(`🔄 Testing Rewards Refresh for ${walletAddress}...`);
      const response = await fetch(`/api/coreum/user-rewards?addresses=${walletAddress}&refresh=true`);
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("✅ Rewards Refresh Response:", data);
      setRewardsData(data);
    } catch (error: any) {
      console.error("❌ Rewards Refresh Error:", error);
      setRewardsError(error.message || "Failed to refresh rewards");
    } finally {
      setRewardsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">API Diagnostics</h1>

      {/* Price API Test */}
      <Card className="p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-4">1. Price API Test</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Tests the CoinGecko price fetching for base tokens (CORE, XRP, SARA, SOLO)
        </p>
        
        <Button onClick={testPriceAPI} disabled={priceLoading} className="mb-4">
          {priceLoading ? "Testing..." : "Test Price API"}
        </Button>

        {priceError && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mb-4">
            <p className="text-sm text-red-700 dark:text-red-300">❌ {priceError}</p>
          </div>
        )}

        {priceData && (
          <div className="space-y-2">
            <h3 className="font-semibold text-green-600 dark:text-green-400">✅ Price API Working!</h3>
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-300 dark:border-gray-600">
                    <th className="text-left py-2">Token</th>
                    <th className="text-right py-2">Price (USD)</th>
                    <th className="text-right py-2">24h Change</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(priceData).map(([symbol, data]: [string, any]) => (
                    <tr key={symbol} className="border-b border-gray-200 dark:border-gray-700">
                      <td className="py-2 font-medium">{symbol}</td>
                      <td className="text-right">${data.price?.toFixed(6) || 'N/A'}</td>
                      <td className={`text-right ${data.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {data.change24h?.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>

      {/* Rewards API Test */}
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-4">2. Historical Rewards API Test</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Tests the blockchain query system for historical validator rewards
        </p>

        <div className="space-y-4 mb-4">
          <div>
            <Label htmlFor="walletAddress">Wallet Address</Label>
            <Input
              id="walletAddress"
              placeholder="core1..."
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={testRewardsAPI} disabled={rewardsLoading || !walletAddress}>
              {rewardsLoading ? "Testing..." : "Get Cached Data"}
            </Button>
            <Button onClick={testRewardsRefresh} disabled={rewardsLoading || !walletAddress} variant="outline">
              {rewardsLoading ? "Refreshing..." : "Force Refresh (Slow)"}
            </Button>
          </div>
        </div>

        {rewardsError && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mb-4">
            <p className="text-sm text-red-700 dark:text-red-300">❌ {rewardsError}</p>
          </div>
        )}

        {rewardsData && (
          <div className="space-y-2">
            <h3 className="font-semibold text-green-600 dark:text-green-400">
              ✅ Rewards API Working!
            </h3>
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
              <pre className="text-xs overflow-auto whitespace-pre-wrap">
                {JSON.stringify(rewardsData, null, 2)}
              </pre>
            </div>

            {rewardsData.success && rewardsData.data && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h4 className="font-semibold mb-2">Summary:</h4>
                <ul className="text-sm space-y-1">
                  <li>💰 Total Rewards: {(parseFloat(rewardsData.data.total) / 1_000_000).toFixed(6)} CORE</li>
                  <li>👛 Wallet Count: {rewardsData.data.walletCount}</li>
                  <li>🔄 Refreshed: {rewardsData.refreshed ? 'Yes' : 'No'}</li>
                  <li>⏰ Stale Data: {rewardsData.data.anyStale ? 'Yes (>36h old)' : 'No'}</li>
                  {rewardsData.rateLimited && (
                    <li className="text-yellow-600">⚠️ Rate Limited: Try again in {rewardsData.hoursUntilNextRefresh}h</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Console Log Instructions */}
      <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <h3 className="font-semibold mb-2">📋 Check Console Logs</h3>
        <p className="text-sm">
          Open your browser's developer console (F12) to see detailed API logs:
        </p>
        <ul className="text-sm mt-2 space-y-1 list-disc list-inside">
          <li>🔍 = API request started</li>
          <li>✅ = API request successful</li>
          <li>❌ = API request failed</li>
          <li>💰 = Price data</li>
          <li>🔄 = Refresh operation</li>
        </ul>
      </div>
    </div>
  );
}

