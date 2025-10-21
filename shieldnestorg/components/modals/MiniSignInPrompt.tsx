"use client";

import { useState, useEffect } from "react";
import { IoClose, IoLogIn } from "react-icons/io5";
import { useRouter } from "next/navigation";

interface MiniSignInPromptProps {
  userEmail: string | null;
  onClose: () => void;
}

export default function MiniSignInPrompt({ userEmail, onClose }: MiniSignInPromptProps) {
  const router = useRouter();
  const [dismissCount, setDismissCount] = useState(0);

  useEffect(() => {
    // Check how many times user has dismissed this
    const count = parseInt(sessionStorage.getItem('mini_prompt_dismiss_count') || '0');
    setDismissCount(count);
  }, []);

  const handleDismiss = () => {
    const newCount = dismissCount + 1;
    setDismissCount(newCount);
    sessionStorage.setItem('mini_prompt_dismiss_count', newCount.toString());
    
    // After 2 dismissals, don't show again this session
    if (newCount >= 2) {
      sessionStorage.setItem('mini_prompt_permanently_dismissed', 'true');
    }
    
    onClose();
  };

  const handleSignIn = () => {
    sessionStorage.setItem('mini_prompt_permanently_dismissed', 'true');
    router.push('/sign-in');
  };

  return (
    <div className="fixed top-20 right-4 z-[9998] animate-slide-in-right">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 max-w-sm">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
            <IoLogIn className="w-5 h-5 text-white" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              Sign in to unlock more
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              {userEmail ? `Welcome back, ${userEmail.split('@')[0]}!` : 'Access your full account'}
            </p>
            
            <button
              onClick={handleSignIn}
              className="w-full px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
            >
              Sign In
            </button>
          </div>

          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
          >
            <IoClose className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {dismissCount === 1 && (
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 text-center">
            Click IoClose one more time to hide permanently
          </p>
        )}
      </div>
    </div>
  );
}

