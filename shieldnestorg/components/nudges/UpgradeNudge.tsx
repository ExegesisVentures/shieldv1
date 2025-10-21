"use client";

import { IoAlertCircle, IoArrowForward, IoClose } from "react-icons/io5";
import { useState } from "react";

interface UpgradeNudgeProps {
  message: string;
  ctaText: string;
  ctaHref: string;
  dismissible?: boolean;
}

export default function UpgradeNudge({
  message,
  ctaText,
  ctaHref,
  dismissible = true,
}: UpgradeNudgeProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 relative">
      {dismissible && (
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-2 right-2 p-1 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded-lg transition-colors"
        >
          <IoClose className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        </button>
      )}

      <div className="flex items-start gap-3 pr-8">
        <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-lg flex-shrink-0">
          <IoAlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-amber-900 dark:text-amber-100 mb-2">
            {message}
          </p>
          <a
            href={ctaHref}
            className="inline-flex items-center gap-2 text-sm font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
          >
            {ctaText}
            <IoArrowForward className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}

