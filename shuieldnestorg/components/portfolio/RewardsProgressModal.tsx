"use client";

import { useEffect, useState } from "react";
import { IoClose, IoTime, IoServer, IoCheckmarkCircle } from "react-icons/io5";

interface RewardsProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletAddress: string;
  estimatedTime?: string;
  realProgress?: number;
  currentStep?: string;
}

export default function RewardsProgressModal({
  isOpen,
  onClose,
  walletAddress,
  estimatedTime = "5-15 minutes",
  realProgress,
  currentStep: realCurrentStep
}: RewardsProgressModalProps) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("Initializing...");
  const [dots, setDots] = useState("");

  // Use real-time progress when available, otherwise simulate
  useEffect(() => {
    if (!isOpen) {
      setProgress(0);
      setCurrentStep("Initializing...");
      return;
    }

    // Use real progress data if available
    if (realProgress !== undefined) {
      setProgress(realProgress);
    }
    
    if (realCurrentStep) {
      setCurrentStep(realCurrentStep);
    }
  }, [isOpen, realProgress, realCurrentStep]);

  // Fallback simulation when no real data is available
  useEffect(() => {
    if (!isOpen || realProgress !== undefined) return;

    const steps = [
      { step: "Connecting to blockchain", duration: 2000 },
      { step: "Scanning transaction history", duration: 3000 },
      { step: "Processing reward transactions", duration: 4000 },
      { step: "Calculating totals", duration: 2000 },
      { step: "Updating database", duration: 1000 },
    ];

    let currentStepIndex = 0;

    const updateProgress = () => {
      if (currentStepIndex < steps.length) {
        setCurrentStep(steps[currentStepIndex].step);
        
        // Simulate progress within each step
        const stepProgress = (currentStepIndex + 1) / steps.length * 100;
        setProgress(Math.min(stepProgress, 100));
        
        setTimeout(() => {
          currentStepIndex++;
          updateProgress();
        }, steps[currentStepIndex].duration);
      } else {
        setCurrentStep("Complete!");
        setProgress(100);
      }
    };

    updateProgress();
  }, [isOpen, realProgress]);

  // Animate dots
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? "" : prev + ".");
    }, 500);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full p-8 md:p-12 relative border border-gray-200 dark:border-gray-700">
        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-2 rounded-lg transition-colors ${
            progress === 100 
              ? 'bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50' 
              : 'hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <IoClose className={`w-5 h-5 ${progress === 100 ? 'text-green-600 dark:text-green-400' : ''}`} />
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <IoTime className="w-10 h-10 text-white animate-pulse" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
            Processing Historical Rewards
          </h2>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-2">
            Scanning blockchain history for wallet
          </p>
          <p className="text-sm md:text-base text-gray-500 dark:text-gray-500 font-mono bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-lg inline-block">
            {walletAddress}
          </p>
        </div>

        {/* Info Box */}
        <div className="mb-8 p-8 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <div className="flex items-start gap-6">
            <IoTime className="w-8 h-8 text-amber-600 dark:text-amber-400 mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-2xl md:text-3xl font-medium text-amber-800 dark:text-amber-200 mb-4">
                This may take a while
              </h3>
              <p className="text-lg md:text-xl text-amber-700 dark:text-amber-300 leading-relaxed">
                Older wallets with extensive transaction history can take {estimatedTime} to process. 
                We'll show your progress here and update your balance once complete.
              </p>
            </div>
          </div>
        </div>

        {/* Simple Status */}
        <div className="flex items-center justify-center gap-4 text-lg md:text-xl text-gray-600 dark:text-gray-400">
          <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
          <span className="font-medium">Processing your historical rewards in the background...</span>
        </div>
      </div>
    </div>
  );
}
