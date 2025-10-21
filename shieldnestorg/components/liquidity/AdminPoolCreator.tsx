"use client";

import { useState, useEffect } from "react";
import { IoAdd, IoSettings, IoAlertCircle, IoCheckmarkCircle, IoReload } from "react-icons/io5";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createSupabaseClient } from "@/utils/supabase/client";
import { isUserAdmin } from "@/utils/admin";

interface CreatePoolForm {
  token0: string;
  token1: string;
  token0Amount: string;
  token1Amount: string;
  feeTier: number;
  poolType: 'AMM' | 'CLMM' | 'STABLE';
}

interface Message {
  type: 'success' | 'error' | 'info';
  text: string;
  hint?: string;
}

export default function AdminPoolCreator() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  const [form, setForm] = useState<CreatePoolForm>({
    token0: '',
    token1: '',
    token0Amount: '',
    token1Amount: '',
    feeTier: 0.3,
    poolType: 'AMM'
  });

  // Common token options
  const tokenOptions = [
    { value: 'ucore', label: 'CORE (ucore)' },
    { value: 'ibc/F082B65C88E4B6D5EF1DB243CDA1D331D002759E938A0F5CD3FFDC5D53B3E349', label: 'USDC (IBC)' },
    { value: 'ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2', label: 'ATOM (IBC)' },
    { value: 'drop-core1zhs909jp9yktml6qqx9f0ptcq2xnhhj99cja03j3lfcsp2pgm86studdrz', label: 'XRP (Drop)' },
    { value: 'solo-token', label: 'SOLO' },
    { value: 'osmo-token', label: 'OSMO' },
  ];

  const feeTierOptions = [
    { value: 0.1, label: '0.1% (Stable)' },
    { value: 0.3, label: '0.3% (Standard)' },
    { value: 1.0, label: '1.0% (Exotic)' },
  ];

  const poolTypeOptions = [
    { value: 'AMM', label: 'AMM (Automated Market Maker)' },
    { value: 'CLMM', label: 'CLMM (Concentrated Liquidity)' },
    { value: 'STABLE', label: 'STABLE (Stablecoin Pool)' },
  ];

  useEffect(() => {
    checkAdminStatus();
  }, []);

  async function checkAdminStatus() {
    try {
      const supabase = createSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      let adminStatus = false;
      
      if (user) {
        // Authenticated user - check via database
        adminStatus = await isUserAdmin(supabase);
      } else {
        // Not authenticated - check if connected wallet is admin wallet
        const { isAdminWallet } = await import("@/utils/admin");
        const visitorAddresses = JSON.parse(localStorage.getItem('visitor_addresses') || '[]');
        adminStatus = visitorAddresses.some((w: { address: string }) => isAdminWallet(w.address));
      }
      
      setIsAdmin(adminStatus);
    } catch (error) {
      console.error("Error checking admin status:", error);
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreatePool() {
    if (!form.token0 || !form.token1 || !form.token0Amount || !form.token1Amount) {
      setMessage({
        type: 'error',
        text: 'Please fill in all required fields',
        hint: 'Token pairs and amounts are required'
      });
      return;
    }

    if (form.token0 === form.token1) {
      setMessage({
        type: 'error',
        text: 'Token pair must be different',
        hint: 'Please select different tokens for the pool'
      });
      return;
    }

    const amount0 = parseFloat(form.token0Amount);
    const amount1 = parseFloat(form.token1Amount);
    
    if (isNaN(amount0) || isNaN(amount1) || amount0 <= 0 || amount1 <= 0) {
      setMessage({
        type: 'error',
        text: 'Invalid token amounts',
        hint: 'Amounts must be positive numbers'
      });
      return;
    }

    setIsCreating(true);
    setMessage(null);

    try {
      const response = await fetch('/api/coredex/pools/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: 'Liquidity pool created successfully!',
          hint: `Pool ID: ${data.pool.id}`
        });
        
        // Reset form
        setForm({
          token0: '',
          token1: '',
          token0Amount: '',
          token1Amount: '',
          feeTier: 0.3,
          poolType: 'AMM'
        });

        // Refresh the page to show the new pool
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setMessage({
          type: 'error',
          text: data.message || 'Failed to create pool',
          hint: data.hint
        });
      }
    } catch (error) {
      console.error('Error creating pool:', error);
      setMessage({
        type: 'error',
        text: 'An error occurred while creating the pool',
        hint: 'Please try again or check your connection'
      });
    } finally {
      setIsCreating(false);
    }
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <IoReload className="w-6 h-6 animate-spin mr-2" />
          <span>Checking admin status...</span>
        </div>
      </Card>
    );
  }

  if (isAdmin === false) {
    return null; // Don't show admin section if not admin
  }

  return (
    <Card className="group p-6 mb-8 border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 transition-all duration-300 hover:border-blue-400 dark:hover:border-blue-400 hover:shadow-[0_8px_20px_rgba(0,0,0,0.3),0_0_0_1px_rgba(77,156,255,0.2),0_0_20px_rgba(77,156,255,0.3)]">
      <div className="flex items-center gap-3 mb-6">
        <div className="neo-icon-glow-blue neo-transition">
          <IoSettings className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Admin: Create Liquidity Pool
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Create new liquidity pools on Coreum DEX
          </p>
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
          message.type === 'success' 
            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100'
            : message.type === 'error'
            ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100'
            : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100'
        }`}>
          {message.type === 'success' ? (
            <IoCheckmarkCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          ) : (
            <IoAlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <p className="font-semibold">{message.text}</p>
            {message.hint && (
              <p className="text-sm mt-1 opacity-90">{message.hint}</p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Token Selection */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="token0">Token 0 (Base)</Label>
            <Select value={form.token0} onValueChange={(value) => setForm({ ...form, token0: value })}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select base token" />
              </SelectTrigger>
              <SelectContent>
                {tokenOptions.map((token) => (
                  <SelectItem key={token.value} value={token.value}>
                    {token.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="token1">Token 1 (Quote)</Label>
            <Select value={form.token1} onValueChange={(value) => setForm({ ...form, token1: value })}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select quote token" />
              </SelectTrigger>
              <SelectContent>
                {tokenOptions.map((token) => (
                  <SelectItem key={token.value} value={token.value}>
                    {token.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Amounts */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="token0Amount">Token 0 Amount</Label>
            <Input
              id="token0Amount"
              type="number"
              placeholder="0.0"
              value={form.token0Amount}
              onChange={(e) => setForm({ ...form, token0Amount: e.target.value })}
              className="mt-2"
              step="0.000001"
              min="0"
            />
          </div>

          <div>
            <Label htmlFor="token1Amount">Token 1 Amount</Label>
            <Input
              id="token1Amount"
              type="number"
              placeholder="0.0"
              value={form.token1Amount}
              onChange={(e) => setForm({ ...form, token1Amount: e.target.value })}
              className="mt-2"
              step="0.000001"
              min="0"
            />
          </div>
        </div>
      </div>

      {/* Pool Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div>
          <Label htmlFor="feeTier">Fee Tier</Label>
          <Select value={form.feeTier.toString()} onValueChange={(value) => setForm({ ...form, feeTier: parseFloat(value) })}>
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {feeTierOptions.map((tier) => (
                <SelectItem key={tier.value} value={tier.value.toString()}>
                  {tier.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="poolType">Pool Type</Label>
          <Select value={form.poolType} onValueChange={(value: 'AMM' | 'CLMM' | 'STABLE') => setForm({ ...form, poolType: value })}>
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {poolTypeOptions.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Create Button */}
      <div className="mt-6 flex justify-end">
        <Button
          onClick={handleCreatePool}
          disabled={isCreating}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2"
        >
          {isCreating ? (
            <>
              <IoReload className="w-4 h-4 mr-2 animate-spin" />
              Creating Pool...
            </>
          ) : (
            <>
              <IoAdd className="w-4 h-4 mr-2" />
              Create Pool
            </>
          )}
        </Button>
      </div>

      {/* Info */}
      <div className="mt-6 p-4 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
          Pool Creation Info
        </h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• Pools are created on the Coreum mainnet</li>
          <li>• Initial liquidity will be provided with the specified amounts</li>
          <li>• Fee tier determines the trading fees for the pool</li>
          <li>• Pool type affects the pricing mechanism used</li>
        </ul>
      </div>
    </Card>
  );
}




