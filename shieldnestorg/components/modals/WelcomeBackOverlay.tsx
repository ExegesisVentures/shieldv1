"use client";

import { IoShieldCheckmark } from "react-icons/io5";

interface WelcomeBackOverlayProps {
  isOpen: boolean;
  userEmail?: string | null;
}

export default function WelcomeBackOverlay({ isOpen, userEmail }: WelcomeBackOverlayProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[10002] animate-in fade-in duration-300">
      <div className="text-center px-8">
        {/* Animated Shield Icon */}
        <div className="mb-6 animate-in zoom-in duration-500">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center shadow-2xl shadow-purple-500/50">
            <IoShieldCheckmark className="w-12 h-12 text-white animate-pulse" />
          </div>
        </div>

        {/* Welcome Message */}
        <h2 className="text-4xl font-bold text-white mb-3 animate-in slide-in-from-bottom-4 duration-700">
          Welcome Back! 🎉
        </h2>
        
        {userEmail && (
          <p className="text-xl text-gray-300 mb-6 animate-in slide-in-from-bottom-4 duration-700 delay-100">
            {userEmail}
          </p>
        )}

        <p className="text-gray-400 mb-8 animate-in slide-in-from-bottom-4 duration-700 delay-200">
          Signing you in... No Ledger required! 🔓
        </p>

        {/* Loading Spinner */}
        <div className="flex items-center justify-center gap-2 animate-in slide-in-from-bottom-4 duration-700 delay-300">
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
}

