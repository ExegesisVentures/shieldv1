/**
 * ============================================
 * BUY COREUM MODAL
 * ============================================
 * 
 * Modal for buying COREUM using ChangeNOW widget
 * Features:
 * - Opens ChangeNOW exchange in pop-up with COREUM pre-filled
 * - No API key needed - uses ChangeNOW's public widget
 * - Tracks local pending transactions
 * - Users can buy with fiat/card or crypto
 * 
 * File: /components/modals/BuyCoreumModal.tsx
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { IoClose, IoCopy, IoTime, IoOpenOutline, IoCheckmarkCircle } from 'react-icons/io5';

interface LocalTransaction {
  id: string;
  walletAddress: string;
  timestamp: number;
  opened: boolean;
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
  const [pendingTransactions, setPendingTransactions] = useState<LocalTransaction[]>([]);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [popupWindow, setPopupWindow] = useState<Window | null>(null);

  // Load pending transactions from localStorage
  useEffect(() => {
    if (!isOpen) return;
    
    const stored = localStorage.getItem('changenow_pending_transactions');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as LocalTransaction[];
        // Filter out transactions older than 24 hours
        const recent = parsed.filter(tx => Date.now() - tx.timestamp < 24 * 60 * 60 * 1000);
        setPendingTransactions(recent);
        if (recent.length !== parsed.length) {
          localStorage.setItem('changenow_pending_transactions', JSON.stringify(recent));
        }
      } catch (error) {
        console.error('Failed to parse pending transactions:', error);
      }
    }
  }, [isOpen]);

  // Monitor popup window
  useEffect(() => {
    if (!popupWindow) return;

    const checkInterval = setInterval(() => {
      if (popupWindow.closed) {
        console.log('✅ ChangeNOW popup closed - user may have completed transaction');
        setPopupWindow(null);
        if (onTransactionComplete) {
          onTransactionComplete();
        }
      }
    }, 1000);

    return () => clearInterval(checkInterval);
  }, [popupWindow, onTransactionComplete]);

  // Open ChangeNOW widget in popup
  const handleOpenChangeNow = useCallback(() => {
    // Create ChangeNOW exchange URL with COREUM pre-filled
    // NOTE: Don't include address parameter - it prevents pre-filling from working
    const changeNowUrl = new URL('https://changenow.io/exchange');
    changeNowUrl.searchParams.set('from', 'usd');
    changeNowUrl.searchParams.set('to', 'coreum');
    changeNowUrl.searchParams.set('fiatMode', 'true');
    // NOT including address - user will copy/paste it from our modal
    
    const fullUrl = changeNowUrl.toString();
    console.log('🚀 Opening ChangeNOW:', fullUrl);
    console.log('📋 Wallet Address:', walletAddress);

    // Calculate centered position
    const width = 800;
    const height = 700;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;

    // Open popup with proper window features (matching working implementation)
    const popup = window.open(
      fullUrl,
      'ChangeNOW Exchange',
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no`
    );

    if (!popup) {
      alert('Popup blocked! Please allow popups for this site, then try again.');
      return;
    }

    popup.focus();
    setPopupWindow(popup);

    // Track this transaction locally
    const newTransaction: LocalTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      walletAddress,
      timestamp: Date.now(),
      opened: true,
    };

    const updated = [...pendingTransactions, newTransaction];
    setPendingTransactions(updated);
    localStorage.setItem('changenow_pending_transactions', JSON.stringify(updated));
  }, [walletAddress, pendingTransactions]);

  // Copy wallet address
  const handleCopyAddress = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }, [walletAddress]);

  // Clear completed transaction
  const handleClearTransaction = useCallback((id: string) => {
    const updated = pendingTransactions.filter(tx => tx.id !== id);
    setPendingTransactions(updated);
    localStorage.setItem('changenow_pending_transactions', JSON.stringify(updated));
  }, [pendingTransactions]);

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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <IoTime className="w-5 h-5 text-yellow-500 animate-spin" />
                Pending Transactions
              </h3>
              {pendingTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-700 rounded-xl"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      Opened {new Date(tx.timestamp).toLocaleTimeString()}
                    </p>
                    <button
                      onClick={() => handleClearTransaction(tx.id)}
                      className="text-xs text-gray-500 hover:text-green-600 dark:hover:text-green-400 flex items-center gap-1"
                      title="Mark as complete"
                    >
                      <IoCheckmarkCircle className="w-4 h-4" />
                      Complete
                    </button>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-mono break-all">
                    To: {tx.walletAddress.slice(0, 20)}...
                  </p>
                  <a
                    href="https://changenow.io/support"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline mt-2"
                  >
                    <IoOpenOutline className="w-3 h-3" />
                    Need help? Contact ChangeNOW Support
                  </a>
                </div>
              ))}
            </div>
          )}

          {/* Wallet Info */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              COREUM will be sent to:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={walletAddress}
                disabled
                className="flex-1 px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm font-mono"
              />
              <button
                onClick={handleCopyAddress}
                className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                title="Copy address"
              >
                <IoCopy className={`w-5 h-5 ${copiedAddress ? 'text-green-600' : 'text-gray-500'}`} />
              </button>
            </div>
            {walletLabel && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Wallet: {walletLabel}
              </p>
            )}
          </div>

          {/* Main CTA */}
          <button
            onClick={handleOpenChangeNow}
            className="w-full px-6 py-5 rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 hover:from-blue-600 hover:via-blue-700 hover:to-blue-800 text-white font-bold text-lg transition-all transform hover:scale-[1.02] active:scale-100 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            <IoOpenOutline className="w-6 h-6" />
            Open ChangeNOW Exchange
          </button>

          {/* Info Box */}
          <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl space-y-3">
            <h3 className="font-bold text-blue-900 dark:text-blue-100 text-sm">
              💳 How it works:
            </h3>
            <ol className="text-xs text-blue-800 dark:text-blue-200 space-y-2 ml-4 list-decimal">
              <li>Click "Open ChangeNOW Exchange" above</li>
              <li>On ChangeNOW, select:
                <ul className="ml-4 mt-1 list-disc space-y-1">
                  <li><strong>"You Send"</strong> = USD (or another crypto)</li>
                  <li><strong>"You Get"</strong> = COREUM</li>
                </ul>
              </li>
              <li>Copy your wallet address above and paste it in the "Recipient Address" field</li>
              <li>Choose payment method (Card or Crypto)</li>
              <li>Complete the transaction</li>
              <li>COREUM will arrive in 5-30 minutes</li>
            </ol>
          </div>

          {/* Security Notice */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <p>🔒 <strong>Secure:</strong> Powered by ChangeNOW - trusted cryptocurrency exchange</p>
            <p>📧 <strong>Support:</strong> If you have issues, use your transaction ID from ChangeNOW</p>
            <p>⏱️ <strong>Timing:</strong> Transactions typically complete in 5-30 minutes</p>
            <p>💰 <strong>No Fees:</strong> ShieldNest charges no additional fees - only ChangeNOW's rates apply</p>
          </div>

          {/* Guest Notice */}
          {isGuest && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-xs text-yellow-800 dark:text-yellow-200">
                💡 <strong>Guest Mode:</strong> Save your transaction ID from ChangeNOW! You'll need it to track your purchase or get support.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

