"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { IoWallet, IoAdd } from "react-icons/io5";
import { Card } from "@/components/ui/card";
import { ThreeArrowSpinner } from "@/components/ui/ThreeArrowSpinner";
import ConnectedWallets from "@/components/wallet/ConnectedWallets";

interface CollapsibleWalletCardProps {
  walletCount: number;
  loading?: boolean;
  onAddWallet: () => void;
  onRefresh?: number;
}

export default function CollapsibleWalletCard({
  walletCount,
  loading,
  onAddWallet,
  onRefresh,
}: CollapsibleWalletCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Detect if device is mobile (touch-based)
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close dropdown on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (isExpanded) {
        console.log("📜 Scroll detected, closing dropdown");
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      window.addEventListener('scroll', handleScroll, true); // Use capture phase to catch all scrolls
      return () => window.removeEventListener('scroll', handleScroll, true);
    }
  }, [isExpanded]);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card 
        ref={cardRef}
        className="pt-4 pb-6 px-6 hover:shadow-lg transition-all duration-300 ease-in-out relative z-10"
        onMouseEnter={() => {
          console.log("🖱️ Card mouseEnter - isMobile:", isMobile);
          if (!isMobile) {
            if (dropdownTimeoutRef.current) {
              clearTimeout(dropdownTimeoutRef.current);
              dropdownTimeoutRef.current = null;
            }
            setIsExpanded(true);
          }
        }}
        onMouseLeave={() => {
          console.log("🖱️ Card mouseLeave - isMobile:", isMobile);
          if (!isMobile) {
            dropdownTimeoutRef.current = setTimeout(() => {
              setIsExpanded(false);
            }, 100);
          }
        }}
      >
        {/* Main Card */}
        <div
          className="cursor-pointer group/card hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl p-2 -m-2 transition-colors"
          onClick={() => {
            console.log("👆 Card clicked - isMobile:", isMobile);
            if (isMobile) {
              setIsExpanded(!isExpanded);
            }
          }}
        >
          <div className="text-center relative">
            <div className="flex items-center justify-center gap-2 mb-2">
              <p className="text-base md:text-lg font-medium text-gray-600 dark:text-gray-400">
                Connected Wallets
              </p>
            </div>
            <div className="flex items-center justify-center gap-4">
              <h3 className="text-4xl font-bold text-gray-900 dark:text-white">
                {walletCount}
              </h3>
              <div className="flex items-center gap-1 group">
                <div className="neo-icon-glow-yellow neo-transition">
                  <IoWallet className="w-6 h-6" />
                </div>
                <div className="flex items-center">
                  <ThreeArrowSpinner 
                    size="sm" 
                    variant="warning"
                    className="w-8 h-8"
                  />
                </div>
              </div>
            </div>
            {walletCount > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                {isMobile ? 'Tap to view wallets' : 'Hover to view wallets'}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Expanded Wallet List - Portal positioned below card (like Total Value dropdown) */}
      {isExpanded && walletCount > 0 && typeof window !== 'undefined' && createPortal(
        <div 
          className="fixed bg-white dark:bg-gray-800 rounded-xl shadow-2xl border-2 border-orange-200 dark:border-orange-700 p-6 z-[999998] animate-in slide-in-from-top-2 duration-200"
          style={{
            top: cardRef.current ? cardRef.current.getBoundingClientRect().bottom + 4 : '50%',
            left: cardRef.current ? cardRef.current.getBoundingClientRect().left : '50%',
            width: cardRef.current ? cardRef.current.getBoundingClientRect().width : '300px',
            maxHeight: '500px',
            overflowY: 'auto'
          }}
          onMouseEnter={() => {
            console.log('🖱️ Dropdown mouse enter');
            if (!isMobile) {
              if (dropdownTimeoutRef.current) {
                clearTimeout(dropdownTimeoutRef.current);
                dropdownTimeoutRef.current = null;
              }
              setIsExpanded(true);
            }
          }}
          onMouseLeave={() => {
            console.log('🖱️ Dropdown mouse leave');
            if (!isMobile) {
              dropdownTimeoutRef.current = setTimeout(() => {
                setIsExpanded(false);
              }, 100);
            }
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
              Your Wallets
            </h4>
            <button
              onClick={(e) => {
                e.stopPropagation();
                console.log("➕ Add Wallet button clicked");
                onAddWallet();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
              title="Add Wallet"
            >
              <IoAdd className="w-5 h-5" />
              <span className="hidden sm:inline">Add Wallet</span>
            </button>
          </div>

          <ConnectedWallets onRefresh={onRefresh} />
        </div>,
        document.body
      )}
    </>
  );
}
