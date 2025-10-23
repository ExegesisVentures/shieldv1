"use client";

import { useState, useEffect, useRef } from "react";
import { IoShieldCheckmark, IoOpenOutline, IoBanOutline } from "react-icons/io5";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { AnimatedCurrency } from "@/components/ui/AnimatedNumber";

interface ShieldNftPanelProps {
  imageUrl?: string | null;
  valueUsd?: number;
  isOwner?: boolean;
  loading?: boolean;
  onRequestMembership?: () => void;
}

export default function ShieldNftPanel({
  imageUrl = null,
  valueUsd = 5500,
  isOwner = false,
  loading = false,
  onRequestMembership,
}: ShieldNftPanelProps) {
  const [showPopup, setShowPopup] = useState(false);
  const [pulseButton, setPulseButton] = useState(false);
  const requestButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showPopup) {
      // Auto-dismiss after 6 seconds (increased from 3.5)
      const timer = setTimeout(() => {
        setShowPopup(false);
        
        // Flash the button
        setPulseButton(true);
        
        // Notify parent to pulse the Request Membership button
        if (onRequestMembership) {
          onRequestMembership();
        }
        
        // Stop flashing after 6 seconds (slowed down)
        setTimeout(() => {
          setPulseButton(false);
        }, 6000);
      }, 6000);
      
      return () => clearTimeout(timer);
    }
  }, [showPopup, onRequestMembership]);

  const handleBuyClick = () => {
    if (!isOwner) {
      setShowPopup(true);
    }
  };

  const handleGotItClick = () => {
    setShowPopup(false);
    
    // Flash the button even when "Got It" is pressed
    setPulseButton(true);
    
    // Notify parent to pulse the Request Membership button
    if (onRequestMembership) {
      onRequestMembership();
    }
    
    // Stop flashing after 6 seconds (slowed down)
    setTimeout(() => {
      setPulseButton(false);
    }, 6000);
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </Card>
    );
  }

  return (
    <>
      {/* Popup Modal */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-purple-500/30 rounded-2xl p-8 max-w-md mx-4 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 mb-4">
                <IoShieldCheckmark className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                Shield Membership Required
              </h3>
              <p className="text-gray-300 mb-6">
                You are not a ShieldNest member. You must request a membership to purchase the Shield NFT.
              </p>
              <button
                onClick={handleGotItClick}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-[0_8px_20px_rgba(168,85,247,0.4),inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_-4px_12px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_28px_rgba(168,85,247,0.6),inset_0_2px_4px_rgba(255,255,255,0.4),inset_0_-4px_12px_rgba(0,0,0,0.4)] hover:scale-105 active:scale-95"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
      
      <Card className="overflow-hidden hover:shadow-xl transition-all bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-xl border border-gray-700/50 shadow-2xl" ref={requestButtonRef}>
        {/* NFT Image */}
        <div className="relative h-64 bg-gradient-to-br from-purple-600 via-blue-600 to-purple-800 flex items-center justify-center shadow-inner">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt="Shield NFT"
              fill
              className="object-cover"
            />
          ) : (
            <div className="text-center text-white">
              <IoShieldCheckmark className="w-24 h-24 mx-auto mb-4 opacity-80" />
              <p className="text-sm opacity-75">Shield NFT Placeholder</p>
            </div>
          )}
          {isOwner && (
            <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
              ✓ Owned
            </div>
          )}
        </div>

        {/* NFT Info */}
        <div className="p-6">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Shield NFT
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            Exclusive membership NFT for ShieldNest Private members
          </p>

          {/* Value */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-4 mb-4 border border-purple-300/20 shadow-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Estimated Value
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              <AnimatedCurrency value={valueUsd} decimals={0} />
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              *Placeholder value for v1
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            {!isOwner ? (
              <Button 
                className={`w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-[0_8px_20px_rgba(168,85,247,0.4),inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_-4px_12px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_28px_rgba(168,85,247,0.6),inset_0_2px_4px_rgba(255,255,255,0.4),inset_0_-4px_12px_rgba(0,0,0,0.4)] transition-all duration-200 ${pulseButton ? 'animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]' : ''}`}
                size="lg"
                onClick={handleBuyClick}
              >
                <IoShieldCheckmark className="w-4 h-4 mr-2" />
                Buy Shield NFT
              </Button>
            ) : (
              <>
                <Button variant="outline" className="w-full" size="lg">
                  <IoOpenOutline className="w-4 h-4 mr-2" />
                  View on Explorer
                </Button>
                <Button
                  variant="outline"
                  className="w-full opacity-50 cursor-not-allowed"
                  disabled
                >
                  <IoBanOutline className="w-4 h-4 mr-2" />
                  Sell Back (Coming Soon)
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>
    </>
  );
}

