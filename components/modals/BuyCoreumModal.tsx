/**
 * ============================================
 * BUY COREUM MODAL
 * ============================================
 * 
 * Modal for buying COREUM with fiat using ChangeNOW
 * Features:
 * - Shows pending transactions at top
 * - Opens payment in popup/iframe
 * - Tracks transaction status
 * - Updates when transaction completes
 * 
 * File: /components/modals/BuyCoreumModal.tsx
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { IoClose, IoCopy, IoTime, IoCheckmarkCircle, IoAlertCircle, IoOpenOutline } from 'react-icons/io5';

interface PendingTransaction {
  id: string;
  fromCurrency: string;
  fromAmount: number;
  toAmount: number | null;
  expectedAmount: number | null;
  status: string;
  createdAt: string;
  payoutHash?: string | null;
  payinHash?: string | null;
}

interface BuyCoreumModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletAddress: string;
  walletLabel?: string;
  onTransactionComplete?: () => void;
  isGuest?: boolean;
}

export default function BuyCoreumModal({
  isOpen,
  onClose,
  walletAddress,
  walletLabel,
  onTransactionComplete,
  isGuest = false,
}: BuyCoreumModalProps) {
  // Form state
  const [fromCurrency, setFromCurrency] = useState('usd');
  const [fromAmount, setFromAmount] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [estimatedAmount, setEstimatedAmount] = useState<number | null>(null);
  const [minAmount, setMinAmount] = useState<number | null>(null);
  const [pendingTransactions, setPendingTransactions] = useState<PendingTransaction[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Generate guest session ID if in guest mode
  const [guestSessionId] = useState(() => 
    isGuest ? `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` : null
  );

  // Fetch pending transactions
  const fetchPendingTransactions = useCallback(async () => {
    try {
      const response = await fetch('/api/changenow/user-transactions?filter=pending');
      
      // If not authenticated, skip silently (user will see auth error when trying to buy)
      if (response.status === 401) {
        console.log('User not authenticated - skipping pending transactions fetch');
        return;
      }

      const data = await response.json();

      if (data.success) {
        setPendingTransactions(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch pending transactions:', error);
    }
  }, []);

  // Fetch exchange info when amount changes
  useEffect(() => {
    if (!isOpen) return;

    const fetchExchangeInfo = async () => {
      try {
        const params = new URLSearchParams({
          fromCurrency,
          ...(fromAmount && { fromAmount }),
        });

        const response = await fetch(`/api/changenow/exchange-info?${params}`);
        const data = await response.json();

        if (!response.ok) {
          // Show specific error if service not configured
          if (response.status === 503) {
            setError(data.hint || 'ChangeNOW service not available');
          }
          return;
        }

        if (data.success) {
          setMinAmount(data.data.minAmount);
          if (data.data.estimatedAmount) {
            setEstimatedAmount(data.data.estimatedAmount);
          }
        }
      } catch (error) {
        console.error('Failed to fetch exchange info:', error);
        setError('Unable to load exchange rates. Please try again later.');
      }
    };

    fetchExchangeInfo();
  }, [isOpen, fromCurrency, fromAmount]);

  // Fetch pending transactions on mount
  useEffect(() => {
    if (isOpen) {
      fetchPendingTransactions();
    }
  }, [isOpen, fetchPendingTransactions]);

  // Handle create exchange
  const handleCreateExchange = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/changenow/create-exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromCurrency,
          fromAmount,
          payoutAddress: walletAddress,
          contactEmail,
          walletLabel,
          isGuest,
          guestSessionId,
        }),
      });

      const data = await response.json();

      // Handle authentication error
      if (response.status === 401) {
        throw new Error('Please sign in to buy COREUM. Click the user menu in the top right to sign in or sign up.');
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to create exchange');
      }

      console.log('✅ Exchange created:', data.data);

      // Open payment URL in popup
      if (data.data.paymentUrl) {
        const popup = window.open(
          data.data.paymentUrl,
          'ChangeNOW Payment',
          'width=600,height=800,scrollbars=yes,resizable=yes'
        );

        if (!popup) {
          // Popup blocked - show link instead
          setError('Popup blocked. Please allow popups or click the link to continue payment.');
        }
      }

      // Refresh pending transactions
      await fetchPendingTransactions();

      // Reset form
      setFromAmount('');
      setEstimatedAmount(null);

    } catch (error: any) {
      console.error('Failed to create exchange:', error);
      setError(error.message || 'Failed to create exchange');
    } finally {
      setLoading(false);
    }
  };

  // Copy transaction ID
  const handleCopyId = useCallback(async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }, []);

  // Get status color
  const getStatusColor = (status: string) => {
    if (['finished'].includes(status)) return 'text-green-600 dark:text-green-400';
    if (['failed', 'expired', 'refunded'].includes(status)) return 'text-red-600 dark:text-red-400';
    return 'text-yellow-600 dark:text-yellow-400';
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    if (['finished'].includes(status)) return <IoCheckmarkCircle className="w-5 h-5" />;
    if (['failed', 'expired', 'refunded'].includes(status)) return <IoAlertCircle className="w-5 h-5" />;
    return <IoTime className="w-5 h-5 animate-spin" />;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border-2 border-blue-200 dark:border-blue-800 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Buy COREUM
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <IoClose className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Pending Transactions */}
          {pendingTransactions.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Pending Transactions
              </h3>
              {pendingTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-700 rounded-xl"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(tx.status)}
                      <span className={`text-sm font-medium ${getStatusColor(tx.status)}`}>
                        {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                      </span>
                    </div>
                    <button
                      onClick={() => handleCopyId(tx.id)}
                      className="p-1 hover:bg-yellow-100 dark:hover:bg-yellow-800 rounded transition-colors"
                      title="Copy transaction ID"
                    >
                      <IoCopy className={`w-4 h-4 ${copiedId === tx.id ? 'text-green-600' : 'text-gray-500'}`} />
                    </button>
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    <p>
                      <strong>{tx.fromAmount} {tx.fromCurrency.toUpperCase()}</strong> →{' '}
                      <strong>{tx.expectedAmount?.toFixed(2) || '...'} COREUM</strong>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(tx.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <a
                    href="https://changenow.io/support"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline mt-2"
                  >
                    <IoOpenOutline className="w-3 h-3" />
                    Contact ChangeNOW Support
                  </a>
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-700 rounded-xl">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleCreateExchange} className="space-y-4">
            {/* Payout Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                COREUM Address
              </label>
              <input
                type="text"
                value={walletAddress}
                disabled
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-sm font-mono"
              />
              {walletLabel && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Wallet: {walletLabel}
                </p>
              )}
            </div>

            {/* Currency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Pay With
              </label>
              <select
                value={fromCurrency}
                onChange={(e) => setFromCurrency(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="usd">USD (US Dollar)</option>
                <option value="eur">EUR (Euro)</option>
                <option value="gbp">GBP (British Pound)</option>
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Amount
              </label>
              <input
                type="number"
                step="0.01"
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                placeholder={minAmount ? `Min: ${minAmount}` : '0.00'}
                disabled={loading}
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {minAmount && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Minimum: {minAmount} {fromCurrency.toUpperCase()}
                </p>
              )}
            </div>

            {/* Estimated Amount */}
            {estimatedAmount && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-xl">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  You will receive approximately:
                </p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                  {estimatedAmount.toFixed(6)} COREUM
                </p>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Contact Email {isGuest && <span className="text-red-500">*</span>}
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="your@email.com"
                required={isGuest}
                disabled={loading}
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {isGuest && (
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                  <strong>Required for guest checkout</strong> - We'll send your transaction details here
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !fromAmount || !walletAddress || (isGuest && !contactEmail)}
              className="w-full px-6 py-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <IoTime className="w-5 h-5 animate-spin" />
                  Creating Exchange...
                </>
              ) : (
                'Continue to Payment'
              )}
            </button>

            {/* Guest Mode Notice */}
            {isGuest && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-xs text-yellow-800 dark:text-yellow-200">
                  💡 <strong>Guest Checkout</strong> - Save your transaction ID! You'll need it to check status or get support.
                </p>
              </div>
            )}
          </form>

          {/* Info */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <p>• Powered by ChangeNOW - secure cryptocurrency exchange</p>
            <p>• You will be redirected to complete payment</p>
            <p>• COREUM will be sent to your wallet address</p>
            <p>• Transaction typically completes in 5-30 minutes</p>
          </div>
        </div>
      </div>
    </div>
  );
}

