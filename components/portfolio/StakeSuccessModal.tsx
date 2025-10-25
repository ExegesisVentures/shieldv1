"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { IoRocket, IoCheckmarkCircle, IoTrophy } from "react-icons/io5";

interface StakeSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionHash?: string;
  amount?: string;
  validatorName?: string;
}

export default function StakeSuccessModal({ 
  isOpen, 
  onClose, 
  transactionHash,
  amount,
  validatorName 
}: StakeSuccessModalProps) {
  const [mounted, setMounted] = useState(false);
  const [fireworks, setFireworks] = useState<Array<{ 
    id: number; 
    left: number; 
    delay: number; 
    duration: number; 
    color: string;
    size: number;
  }>>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      console.log('🎆 [StakeSuccessModal] Opening modal with fireworks!');
      
      // Generate fireworks particles
      const fireworkColors = [
        'rgba(168, 85, 247, 0.9)',  // purple
        'rgba(59, 130, 246, 0.9)',   // blue
        'rgba(34, 197, 94, 0.9)',    // green
        'rgba(234, 179, 8, 0.9)',    // yellow
        'rgba(239, 68, 68, 0.9)',    // red
        'rgba(236, 72, 153, 0.9)',   // pink
      ];

      const particles = Array.from({ length: 40 }, (_, i) => ({
        id: i,
        left: 10 + Math.random() * 80, // Spread across width
        delay: Math.random() * 0.8,
        duration: 1.5 + Math.random() * 1.5,
        color: fireworkColors[Math.floor(Math.random() * fireworkColors.length)],
        size: 6 + Math.random() * 8
      }));
      setFireworks(particles);

      // Generate more fireworks in waves
      const interval = setInterval(() => {
        const newParticles = Array.from({ length: 20 }, (_, i) => ({
          id: Date.now() + i,
          left: 10 + Math.random() * 80,
          delay: Math.random() * 0.3,
          duration: 1.5 + Math.random() * 1,
          color: fireworkColors[Math.floor(Math.random() * fireworkColors.length)],
          size: 6 + Math.random() * 8
        }));
        setFireworks(prev => [...prev.slice(-20), ...newParticles]);
      }, 1500);

      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!mounted || !isOpen) {
    return null;
  }

  console.log('🎆 [StakeSuccessModal] Rendering modal');

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={onClose}
      ></div>

      {/* Fireworks Container */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {fireworks.map((firework) => (
          <div
            key={firework.id}
            className="firework-particle absolute rounded-full"
            style={{
              left: `${firework.left}%`,
              bottom: '0',
              width: `${firework.size}px`,
              height: `${firework.size}px`,
              backgroundColor: firework.color,
              boxShadow: `0 0 ${firework.size * 2}px ${firework.color}`,
              animationDelay: `${firework.delay}s`,
              animationDuration: `${firework.duration}s`,
            }}
          />
        ))}
      </div>

      {/* Modal Content */}
      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900 shadow-2xl border-2 border-purple-500/30 p-8 animate-scale-in overflow-hidden">
        
        {/* Animated background glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-blue-600/20 to-purple-600/20 animate-pulse"></div>
        
        {/* Content */}
        <div className="relative z-10 space-y-6">
          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <IoCheckmarkCircle className="w-24 h-24 text-green-400 animate-bounce" />
              <div className="absolute inset-0 bg-green-400/20 rounded-full animate-ping"></div>
            </div>
          </div>

          {/* Main message */}
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-white">
              🎉 Staking Successful! 🎉
            </h2>
            <p className="text-xl font-semibold text-purple-200">
              Thank You for Supporting Decentralization!
            </p>
          </div>

          {/* Stake Details */}
          {amount && (
            <div className="bg-white/10 rounded-xl p-4 border border-purple-500/30">
              <div className="text-center space-y-2">
                <p className="text-gray-300 text-sm">You staked</p>
                <p className="text-2xl font-bold text-white">
                  {amount} CORE
                </p>
                {validatorName && (
                  <p className="text-purple-300 text-sm">
                    with {validatorName}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Thank you message */}
          <div className="space-y-3">
            <p className="text-lg font-semibold text-white text-center">
              You're Powering the Network! 💪
            </p>
            <p className="text-gray-300 leading-relaxed text-center">
              By staking your CORE tokens, you're actively contributing to a more 
              <span className="text-green-400 font-semibold"> secure</span>, 
              <span className="text-blue-400 font-semibold"> decentralized</span>, and 
              <span className="text-purple-400 font-semibold"> resilient</span> blockchain ecosystem.
            </p>
          </div>

          {/* Impact Stats */}
          <div className="bg-white/5 rounded-xl p-4 border border-purple-500/20">
            <div className="flex items-center justify-center gap-2 text-gray-300">
              <IoRocket className="w-5 h-5 text-purple-400" />
              <span className="text-sm">
                Your stake helps secure the network and earn you rewards!
              </span>
            </div>
          </div>

          {/* Rewards info */}
          <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl p-4 border border-yellow-500/30">
            <div className="flex items-center justify-center gap-2 text-yellow-200">
              <IoTrophy className="w-5 h-5 text-yellow-400" />
              <span className="text-sm font-medium">
                Start earning staking rewards automatically!
              </span>
            </div>
          </div>

          {/* Transaction hash (if available) */}
          {transactionHash && (
            <div className="text-xs text-gray-400 font-mono break-all text-center bg-black/20 rounded-lg p-3 border border-gray-700/50">
              TX: {transactionHash}
            </div>
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/50"
          >
            Continue Staking Journey
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes firework-launch {
          0% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
          50% {
            transform: translateY(-70vh) scale(1.2);
            opacity: 0.9;
          }
          70% {
            transform: translateY(-85vh) scale(0.8);
            opacity: 0.7;
          }
          100% {
            transform: translateY(-100vh) scale(0.3);
            opacity: 0;
          }
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }

        .firework-particle {
          animation: firework-launch linear forwards;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 0.5;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.1);
          }
        }
      `}</style>
    </div>
  );

  return createPortal(modalContent, document.body);
}

