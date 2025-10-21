"use client";

import { useEffect, useState } from "react";
import { IoClose, IoTrendingUp, IoShieldCheckmark, IoTime, IoWallet } from "react-icons/io5";
import Link from "next/link";
import { checkUpgradeTriggers, dismissUpgradePrompt, UpgradeRule } from "@/utils/visitor-upgrade-rules";

export default function SmartUpgradePrompt() {
  const [rule, setRule] = useState<UpgradeRule | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check triggers on mount and periodically
    const checkTriggers = async () => {
      const triggeredRule = await checkUpgradeTriggers();
      if (triggeredRule && !show) {
        setRule(triggeredRule);
        setShow(true);
      }
    };

    checkTriggers();
    const interval = setInterval(checkTriggers, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [show]);

  const handleDismiss = () => {
    if (rule) {
      dismissUpgradePrompt(rule.id);
    }
    setShow(false);
  };

  if (!show || !rule) return null;

  const getIcon = () => {
    switch (rule.id) {
      case 'multiple_wallets':
        return <IoWallet className="w-6 h-6 text-purple-600" />;
      case 'extended_session':
        return <IoTime className="w-6 h-6 text-purple-600" />;
      case 'portfolio_value':
        return <IoTrendingUp className="w-6 h-6 text-purple-600" />;
      default:
        return <IoShieldCheckmark className="w-6 h-6 text-purple-600" />;
    }
  };

  const getMessage = () => {
    switch (rule.id) {
      case 'multiple_wallets':
        return {
          title: "Managing Multiple IoWallets?",
          subtitle: "Save your portfolio permanently with a free account",
          cta: "Create Account (No Email Required)",
        };
      case 'extended_session':
        return {
          title: "Still Exploring?",
          subtitle: "Create an account to save your progress and data",
          cta: "Save My Portfolio",
        };
      case 'return_visit':
        return {
          title: "Welcome Back!",
          subtitle: "Save your wallets so you don't have to re-add them",
          cta: "Create Free Account",
        };
      case 'portfolio_value':
        return {
          title: "Significant Portfolio Detected",
          subtitle: "Protect your data with a permanent account",
          cta: "Secure My Portfolio",
        };
      default:
        return {
          title: "Save Your Progress",
          subtitle: "Create a free account to keep your data",
          cta: "Get Started",
        };
    }
  };

  const content = getMessage();

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6 relative animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          aria-label="Dismiss"
        >
          <IoClose className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
            {getIcon()}
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {content.title}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {content.subtitle}
          </p>
        </div>

        {/* Benefits */}
        <div className="mb-6 space-y-2 text-left">
          <div className="flex items-start gap-2">
            <IoShieldCheckmark className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-700 dark:text-gray-300">
              No email required - just wallet address
            </p>
          </div>
          <div className="flex items-start gap-2">
            <IoShieldCheckmark className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Your data saved permanently
            </p>
          </div>
          <div className="flex items-start gap-2">
            <IoShieldCheckmark className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Access from any device
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Link
            href="/sign-up"
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all text-center"
          >
            {content.cta}
          </Link>
          <button
            onClick={handleDismiss}
            className="w-full px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors text-sm"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}

