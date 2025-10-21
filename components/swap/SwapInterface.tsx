"use client";

import { useState, useEffect } from "react";
import { IoSwapVertical, IoSettings, IoInformationCircle, IoTrendingUp, IoWarning } from "react-icons/io5";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnimatedBalance, AnimatedPercentage } from "@/components/ui/AnimatedNumber";
import { useSearchParams } from "next/navigation";

/**
 * SwapInterface Component
 * 
 * Multi-DEX swap interface powered by Astroport
 * Automatically finds best swap routes across Cruise Control and Pulsara
 * 
 * Features:
 * - Real-time swap quotes
 * - Best route discovery
 * - Slippage settings
 * - Price impact warnings
 * - Multi-DEX comparison
 * 
 * Note: Price data for portfolio display comes from CoreDEX API
 */

interface Token {
  denom: string;
  symbol: string;
  decimals: number;
  icon?: string;
}

interface SwapQuote {
  route: {
    dexName: string;
    pairContract: string;
    inputToken: string;
    outputToken: string;
    inputAmount: string;
    expectedOutput: string;
    priceImpact: number;
    minimumOutput: string;
    spreadAmount: string;
    commissionAmount: string;
  };
  totalInput: string;
  totalOutput: string;
  priceImpact: number;
  minimumOutput: string;
  effectivePrice: number;
}

interface MultiDexQuote {
  bestQuote: SwapQuote;
  allQuotes: SwapQuote[];
  savings: string;
  savingsPercent: number;
}

// Available tokens for swapping (from Cruise Control + Pulsara - 64+ pairs!)
const AVAILABLE_TOKENS: Token[] = [
  // Core tokens
  { denom: "ucore", symbol: "CORE", decimals: 6 },
  { denom: "usara-core1r9gc0rnxnzpq33u82f44aufgdwvyxv4wyepyck98m9v2pxua6naqr8h03z", symbol: "SARA", decimals: 6 },
  
  // Major IBC tokens
  { denom: "ibc/E1E3674A0E4E1EF9C69646F9AF8D9497173821826074622D831BAB73CCB99A2D", symbol: "USDC", decimals: 6 },
  { denom: "ibc/45C001A5AE212D09879BE4627C45B64D5636086285590D5145A51E18E9D16722", symbol: "IBC-45C", decimals: 6 },
  { denom: "ibc/13B2C536D0F5E10E6A6876E5A5E5E5E5E5E5E5E5E5E5E5E5E5E5E5E5E5E5E5E", symbol: "IBC-13B", decimals: 6 },
  { denom: "ibc/F8CA5236F8CA5236F8CA5236F8CA5236F8CA5236F8CA5236F8CA5236F8CA5236", symbol: "IBC-F8C", decimals: 6 },
  
  // XRP Ledger tokens
  { denom: "drop-core1zhs909jp9yktml6qqx9f0ptcq2xnhhj99cja03j3lfcsp2pgm86studdrz", symbol: "DROP", decimals: 6 },
  { denom: "xrpl11278ecf9e-core1zhs909jp9yktml6qqx9f0ptcq2xnhhj99cja03j3lfcsp2pgm86studdrz", symbol: "XRP-112", decimals: 6 },
  { denom: "xrpl2661e5b556-core1zhs909jp9yktml6qqx9f0ptcq2xnhhj99cja03j3lfcsp2pgm86studdrz", symbol: "XRP-266", decimals: 6 },
  { denom: "xrpl570c00a604-core1zhs909jp9yktml6qqx9f0ptcq2xnhhj99cja03j3lfcsp2pgm86studdrz", symbol: "XRP-570", decimals: 6 },
  
  // Coreum ecosystem tokens
  { denom: "ulicore-core13gza3msdh8hegqxhgezll9quucsr63s0gp43k274xwt66k4e8pmq5zpnm9", symbol: "LICORE", decimals: 6 },
  { denom: "usbc-core1rfxrg75fzuq5hgnnymjgsxj70d9w9cs8xuza7x", symbol: "USBC", decimals: 6 },
  { denom: "ubukec-core1sj0phdvucwd5x53yesr0qhnyvhwvze0vxk76qsg4xptws6z29nxs9je79w", symbol: "BUKEC", decimals: 6 },
  
  // Cruise Control tokens (additional pairs)
  { denom: "ucat-core129pfw890e2e0c7p4uw04z88zjfudm2zydcd7zj4jj9lr492t4mws89skd6", symbol: "CAT", decimals: 6 },
  { denom: "ucozy-core19w7yasdscfu09un47h8vf5rfjshwug2kgrplkwtfdrrgjzrld82sc7f494", symbol: "COZY", decimals: 6 },
  { denom: "umbs-core166wgcj0kwhgujm3ggv9x4q47dxp7c3g75qxelnpptjcd5fxq4m8ql4wgrl", symbol: "MBS", decimals: 6 },
  { denom: "ucct-core1362hrnvgrcmfkane5pfsvxwyesmgpz90wqu2u7mr79l9rar0554qzv30n2", symbol: "CCT", decimals: 6 },
  { denom: "ucorez-core1astd8pqhs7mslk9rnygy9kzc5s2cqnwftcvmquxr7z9z78szzvzqljlc23", symbol: "COREZ", decimals: 6 },
  { denom: "uclan-core12gjuvu3evjet6m5lrhl404ufy0vtf5hmftz7d0qyalc26k5m8j2q5aaaes", symbol: "CLAN", decimals: 6 },
  { denom: "upunks-core1zceldt0z76n3cje52fps53lh6ejlxqcnu4fgexl3vyj688nx3f0sgm7xaa", symbol: "PUNKS", decimals: 6 },
];

export default function SwapInterface() {
  const searchParams = useSearchParams();
  
  // Get pre-selected token from URL params (e.g., ?token=ucore or ?token=CORE)
  const preselectedTokenParam = searchParams?.get('token');
  const findPreselectedToken = () => {
    if (!preselectedTokenParam) return AVAILABLE_TOKENS[0];
    
    // Try to find by denom first, then by symbol
    const found = AVAILABLE_TOKENS.find(
      t => t.denom.toLowerCase() === preselectedTokenParam.toLowerCase() || 
           t.symbol.toLowerCase() === preselectedTokenParam.toLowerCase()
    );
    return found || AVAILABLE_TOKENS[0];
  };
  
  const [inputToken, setInputToken] = useState<Token>(findPreselectedToken());
  const [outputToken, setOutputToken] = useState<Token>(AVAILABLE_TOKENS[1]);
  const [inputAmount, setInputAmount] = useState<string>("");
  const [outputAmount, setOutputAmount] = useState<string>("");
  const [slippage, setSlippage] = useState<number>(1.0); // 1% default
  const [showIoSettings, setShowIoSettings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState<MultiDexQuote | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Update input token when URL param changes
  useEffect(() => {
    if (preselectedTokenParam) {
      const token = findPreselectedToken();
      setInputToken(token);
      // Make sure output token is different
      if (token.denom === outputToken.denom) {
        const differentToken = AVAILABLE_TOKENS.find(t => t.denom !== token.denom);
        if (differentToken) setOutputToken(differentToken);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectedTokenParam]);

  // Debounce quote fetching
  useEffect(() => {
    if (!inputAmount || parseFloat(inputAmount) <= 0) {
      setQuote(null);
      setOutputAmount("");
      return;
    }

    const timer = setTimeout(() => {
      fetchQuote();
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputAmount, inputToken, outputToken, slippage]);

  const fetchQuote = async () => {
    setLoading(true);
    setError(null);

    try {
      // Convert input amount to base units
      const baseAmount = (parseFloat(inputAmount) * Math.pow(10, inputToken.decimals)).toString();

      const response = await fetch(
        `/api/astroport/swap/quote?input=${inputToken.denom}&output=${outputToken.denom}&amount=${baseAmount}&slippage=${slippage / 100}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to get quote");
      }

      const data: MultiDexQuote = await response.json();
      setQuote(data);

      // Convert output amount from base units
      const outputValue = parseFloat(data.bestQuote.totalOutput) / Math.pow(10, outputToken.decimals);
      setOutputAmount(outputValue.toFixed(6));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get quote");
      setQuote(null);
      setOutputAmount("");
    } finally {
      setLoading(false);
    }
  };

  const handleSwapTokens = () => {
    const temp = inputToken;
    setInputToken(outputToken);
    setOutputToken(temp);
    setInputAmount(outputAmount);
    setOutputAmount(inputAmount);
  };

  const handleMaxInput = () => {
    // In a real implementation, this would get the user's balance
    setInputAmount("100");
  };

  const isPriceImpactHigh = quote && Math.abs(quote.bestQuote.priceImpact) > 3;
  const isPriceImpactVeryHigh = quote && Math.abs(quote.bestQuote.priceImpact) > 5;

  return (
    <Card className="max-w-lg mx-auto p-6 bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-900/50 border-2 border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Swap Tokens</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowIoSettings(!showIoSettings)}
          className="w-10 h-10 p-0"
        >
          <IoSettings className="w-5 h-5" />
        </Button>
      </div>

      {/* IoSettings Panel */}
      {showIoSettings && (
        <Card className="p-4 mb-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Slippage Tolerance
              </label>
              <div className="flex gap-2">
                {[0.5, 1.0, 2.0, 5.0].map((value) => (
                  <Button
                    key={value}
                    variant={slippage === value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSlippage(value)}
                    className="flex-1"
                  >
                    {value}%
                  </Button>
                ))}
              </div>
              <Input
                type="number"
                value={slippage}
                onChange={(e) => setSlippage(parseFloat(e.target.value) || 1.0)}
                className="mt-2"
                placeholder="Custom %"
                step="0.1"
                min="0.1"
                max="50"
              />
            </div>
          </div>
        </Card>
      )}

      {/* Input Token Section */}
      <div className="mb-2">
        <div className="flex justify-between mb-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">From</label>
          <button
            onClick={handleMaxInput}
            className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
          >
            MAX
          </button>
        </div>
        <Card className="p-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Input
              type="number"
              value={inputAmount}
              onChange={(e) => setInputAmount(e.target.value)}
              placeholder="0.00"
              className="flex-1 text-2xl font-semibold border-none focus-visible:ring-0 bg-transparent"
              step="any"
              min="0"
            />
            <select
              value={inputToken.denom}
              onChange={(e) => {
                const token = AVAILABLE_TOKENS.find((t) => t.denom === e.target.value);
                if (token) setInputToken(token);
              }}
              className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 font-semibold cursor-pointer border-2 border-gray-200 dark:border-gray-600 focus:outline-none focus:border-purple-500"
            >
              {AVAILABLE_TOKENS.map((token) => (
                <option key={token.denom} value={token.denom}>
                  {token.symbol}
                </option>
              ))}
            </select>
          </div>
        </Card>
      </div>

      {/* Swap Direction Button */}
      <div className="flex justify-center my-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSwapTokens}
          className="w-12 h-12 rounded-full p-0 border-2"
        >
          <IoSwapVertical className="w-5 h-5" />
        </Button>
      </div>

      {/* Output Token Section */}
      <div className="mb-4">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">To</label>
        <Card className="p-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Input
              type="number"
              value={outputAmount}
              placeholder="0.00"
              className="flex-1 text-2xl font-semibold border-none focus-visible:ring-0 bg-transparent"
              disabled
            />
            <select
              value={outputToken.denom}
              onChange={(e) => {
                const token = AVAILABLE_TOKENS.find((t) => t.denom === e.target.value);
                if (token) setOutputToken(token);
              }}
              className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 font-semibold cursor-pointer border-2 border-gray-200 dark:border-gray-600 focus:outline-none focus:border-purple-500"
            >
              {AVAILABLE_TOKENS.map((token) => (
                <option key={token.denom} value={token.denom}>
                  {token.symbol}
                </option>
              ))}
            </select>
          </div>
        </Card>
      </div>

      {/* Quote IoInformationCirclermation */}
      {loading && (
        <Card className="p-4 mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            <span className="text-sm font-medium">Fetching best price across DEXs...</span>
          </div>
        </Card>
      )}

      {error && (
        <Card className="p-4 mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
            <IoWarning className="w-4 h-4" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        </Card>
      )}

      {quote && !loading && (
        <Card className="p-4 mb-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800">
          <div className="space-y-3">
            {/* Best Route */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Best Route</span>
              <div className="flex items-center gap-2">
                <IoTrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-bold text-green-600 dark:text-green-400">
                  {quote.bestQuote.route.dexName}
                </span>
              </div>
            </div>

            {/* Price Impact */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Price Impact</span>
              <span
                className={`text-sm font-bold ${
                  isPriceImpactVeryHigh
                    ? "text-red-600 dark:text-red-400"
                    : isPriceImpactHigh
                    ? "text-orange-600 dark:text-orange-400"
                    : "text-green-600 dark:text-green-400"
                }`}
              >
                {Math.abs(quote.bestQuote.priceImpact).toFixed(2)}%
              </span>
            </div>

            {/* Minimum Received */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Minimum Received</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                <AnimatedBalance 
                  value={parseFloat(quote.bestQuote.minimumOutput) / Math.pow(10, outputToken.decimals)} 
                  decimals={6}
                />{" "}
                {outputToken.symbol}
              </span>
            </div>

            {/* Savings */}
            {quote.allQuotes.length > 1 && quote.savingsPercent > 0 && (
              <div className="flex items-center justify-between pt-2 border-t border-green-200 dark:border-green-800">
                <div className="flex items-center gap-1">
                  <IoInformationCircle className="w-3 h-3 text-green-600 dark:text-green-400" />
                  <span className="text-xs font-medium text-green-700 dark:text-green-300">
                    Saved vs other DEX
                  </span>
                </div>
                <span className="text-xs font-bold text-green-600 dark:text-green-400">
                  <AnimatedPercentage value={quote.savingsPercent} decimals={2} showPlusSign={true} />
                </span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Price Impact Warning */}
      {isPriceImpactVeryHigh && (
        <Card className="p-4 mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <div className="flex items-start gap-2 text-red-700 dark:text-red-300">
            <IoWarning className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold">High Price Impact!</p>
              <p className="text-xs mt-1">
                This swap has a high price impact. Consider swapping a smaller amount or waiting for better
                liquidity.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Swap Button */}
      <Button
        className="w-full h-14 text-lg font-bold"
        disabled={!inputAmount || !quote || loading || parseFloat(inputAmount) <= 0}
      >
        {loading
          ? "Loading..."
          : !inputAmount || parseFloat(inputAmount) <= 0
          ? "Enter Amount"
          : !quote
          ? "No Route Available"
          : "Swap Tokens"}
      </Button>

      {/* IoInformationCircle Note */}
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-2 text-blue-700 dark:text-blue-300">
          <IoInformationCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p className="text-xs">
            <strong>Multi-DEX Aggregation:</strong> We automatically compare prices across Cruise Control and
            Pulsara to get you the best rate. Actual swap requires wallet connection.
          </p>
        </div>
      </div>
    </Card>
  );
}

