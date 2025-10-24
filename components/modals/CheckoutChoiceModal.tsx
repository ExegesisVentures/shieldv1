/**
 * ============================================
 * CHECKOUT CHOICE MODAL
 * ============================================
 * 
 * Asks user if they want to checkout as guest or sign in
 * Shows benefits of signing in with progressive nudge
 * 
 * File: /components/modals/CheckoutChoiceModal.tsx
 */

'use client';

import { useState } from 'react';
import { IoClose, IoPersonAdd, IoSpeedometer } from 'react-icons/io5';

interface CheckoutChoiceModalProps {
  isOpen: boolean;
  onGuestCheckout: () => void;
  onSignIn: () => void;
  onClose: () => void;
}

const SIGNIN_BENEFITS = [
  {
    icon: '📊',
    title: 'Track Your Purchases',
    description: 'See all transactions and status updates in one place'
  },
  {
    icon: '🔔',
    title: 'Get Notifications',
    description: 'Receive alerts when your COREUM arrives'
  },
  {
    icon: '💬',
    title: 'Easy Support',
    description: 'Quick help if something goes wrong'
  },
  {
    icon: '⚡',
    title: 'Faster Checkout',
    description: 'Your wallet pre-filled for next time'
  },
];

const EXTRA_BENEFITS = [
  '🎯 Access to portfolio tracking',
  '💰 View your total COREUM holdings',
  '📈 Price alerts and notifications',
  '🏆 Member-only features coming soon',
];

export default function CheckoutChoiceModal({
  isOpen,
  onGuestCheckout,
  onSignIn,
  onClose,
}: CheckoutChoiceModalProps) {
  const [showGuestNudge, setShowGuestNudge] = useState(false);

  if (!isOpen) return null;

  const handleGuestClick = () => {
    setShowGuestNudge(true);
  };

  const handleConfirmGuest = () => {
    onGuestCheckout();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border-2 border-blue-200 dark:border-blue-800">
        
        {!showGuestNudge ? (
          /* Initial Choice Screen */
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Choose Checkout Method
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <IoClose className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Sign In Option - Primary */}
              <button
                onClick={onSignIn}
                className="w-full p-6 border-2 border-blue-500 bg-gradient-to-br from-blue-500/10 to-blue-600/5 hover:from-blue-500/20 hover:to-blue-600/10 rounded-xl transition-all duration-300 text-left group hover:shadow-xl hover:scale-[1.02]"
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <IoPersonAdd className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      Sign In & Buy
                    </h3>
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                      Recommended
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  {SIGNIN_BENEFITS.map((benefit, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <span className="text-xl">{benefit.icon}</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {benefit.title}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {benefit.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </button>

              {/* Guest Option - Secondary */}
              <button
                onClick={handleGuestClick}
                className="w-full p-6 border-2 border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 rounded-xl transition-all duration-300 text-left group hover:shadow-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-400 dark:bg-gray-600 rounded-full flex items-center justify-center">
                    <IoSpeedometer className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      Continue as Guest
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Quick checkout without account
                    </p>
                  </div>
                </div>
              </button>

              {/* Info Note */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  💡 <strong>Free to sign up!</strong> Takes just 30 seconds and you can track all your purchases.
                </p>
              </div>
            </div>
          </>
        ) : (
          /* Guest Nudge Screen */
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Are You Sure?
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
              {/* Warning */}
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-700 rounded-xl">
                <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                  ⚠️ As a guest, you'll miss out on these benefits:
                </p>
              </div>

              {/* Benefits List */}
              <div className="space-y-3">
                {EXTRA_BENEFITS.map((benefit, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                    <span className="text-base">{benefit}</span>
                  </div>
                ))}
              </div>

              {/* Note */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Note:</strong> You'll need to save your transaction ID manually to check status or get support.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={onSignIn}
                  className="flex-1 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors"
                >
                  Sign In Instead
                </button>
                <button
                  onClick={handleConfirmGuest}
                  className="flex-1 px-6 py-4 border-2 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-xl transition-colors"
                >
                  Continue as Guest
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

