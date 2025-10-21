"use client";

import { IoShieldCheckmark, IoEyeOutline } from "react-icons/io5";

interface VerificationBadgeProps {
  verified: boolean;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export default function VerificationBadge({
  verified,
  size = "md",
  showLabel = false,
}: VerificationBadgeProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  if (verified) {
    return (
      <div 
        className="inline-flex items-center gap-1.5 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full"
        title="Ownership verified"
      >
        <IoShieldCheckmark className={sizeClasses[size]} />
        {showLabel && (
          <span className={`font-semibold ${textSizeClasses[size]}`}>
            Verified
          </span>
        )}
      </div>
    );
  }

  return (
    <div 
      className="inline-flex items-center gap-1.5 px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full"
      title="View only - ownership not verified"
    >
      <IoEyeOutline className={sizeClasses[size]} />
      {showLabel && (
        <span className={`font-medium ${textSizeClasses[size]}`}>
          View Only
        </span>
      )}
    </div>
  );
}

