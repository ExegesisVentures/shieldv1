"use client";

import { useEffect, useState } from "react";
import { IoCheckmarkCircle, IoClose, IoSparkles, IoRocket } from "react-icons/io5";

interface VoteSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionHash?: string;
}

export default function VoteSuccessModal({ isOpen, onClose, transactionHash }: VoteSuccessModalProps) {
  const [mounted, setMounted] = useState(false);
  const [confettiPieces, setConfettiPieces] = useState<Array<{ id: number; left: number; delay: number; duration: number; rotation: number }>>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Generate confetti pieces
      const pieces = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 2 + Math.random() * 2,
        rotation: Math.random() * 360,
      }));
      setConfettiPieces(pieces);

      // Auto-close after 5 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!mounted || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Confetti */}
      {confettiPieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute top-0 w-3 h-3 confetti-piece"
          style={{
            left: `${piece.left}%`,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
            transform: `rotate(${piece.rotation}deg)`,
            background: ['#9333ea', '#a855f7', '#c084fc', '#e879f9', '#fbbf24', '#22d3ee'][Math.floor(Math.random() * 6)],
          }}
        ></div>
      ))}

      {/* Modal */}
      <div 
        className="relative z-10 w-full max-w-lg bg-gradient-to-br from-purple-900/95 via-gray-900/95 to-purple-900/95 rounded-2xl shadow-2xl border border-purple-500/30 p-8 animate-scale-in"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <IoClose className="w-5 h-5 text-gray-400 hover:text-white" />
        </button>

        {/* Content */}
        <div className="text-center space-y-6">
          {/* Icon with pulse animation */}
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-green-500 rounded-full blur-2xl opacity-50 animate-pulse"></div>
            <div className="relative bg-gradient-to-br from-green-400 to-emerald-500 rounded-full p-6">
              <IoCheckmarkCircle className="w-16 h-16 text-white" />
            </div>
          </div>

          {/* Title */}
          <div>
            <h2 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-2">
              <IoSparkles className="w-8 h-8 text-yellow-400" />
              Vote Cast Successfully!
              <IoSparkles className="w-8 h-8 text-yellow-400" />
            </h2>
            <div className="inline-block bg-purple-500/20 border border-purple-500/50 rounded-full px-4 py-1 text-sm text-purple-300 font-medium">
              On-Chain Transaction Complete
            </div>
          </div>

          {/* Thank you message */}
          <div className="space-y-3">
            <p className="text-xl font-semibold text-white">
              Thank You for Participating!
            </p>
            <p className="text-gray-300 leading-relaxed">
              Your vote helps shape the future of <span className="text-purple-400 font-semibold">Coreum</span>.
              By participating in governance, you're actively contributing to a more 
              <span className="text-green-400 font-semibold"> decentralized</span> and 
              <span className="text-blue-400 font-semibold"> democratic</span> blockchain ecosystem.
            </p>
          </div>

          {/* Stats/Impact */}
          <div className="bg-white/5 rounded-xl p-4 border border-purple-500/20">
            <div className="flex items-center justify-center gap-2 text-gray-300">
              <IoRocket className="w-5 h-5 text-purple-400" />
              <span className="text-sm">
                Your voice matters in building the future of decentralized finance
              </span>
            </div>
          </div>

          {/* Transaction hash (if available) */}
          {transactionHash && (
            <div className="text-xs text-gray-400 font-mono break-all">
              TX: {transactionHash}
            </div>
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/50"
          >
            Continue Exploring
          </button>

          <p className="text-xs text-gray-500">
            This window will close automatically in 5 seconds
          </p>
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

        @keyframes confetti-fall {
          0% {
            transform: translateY(-10vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }

        .confetti-piece {
          animation: confetti-fall linear forwards;
          border-radius: 2px;
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
}

