import React from "react";
import { cn } from "@/utils/styles";

interface ThreeArrowSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "primary" | "success" | "warning";
}

export function ThreeArrowSpinner({
  className,
  size = "md",
  variant = "default",
}: ThreeArrowSpinnerProps) {
  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4", 
    lg: "w-6 h-6",
  };

  // Define the bright and dim colors for each variant
  const getColors = () => {
    switch (variant) {
      case "warning":
        return {
          bright: "text-orange-500 dark:text-orange-400",
          dim: "text-orange-200 dark:text-orange-800",
        };
      case "primary":
        return {
          bright: "text-blue-500 dark:text-blue-400",
          dim: "text-blue-200 dark:text-blue-800",
        };
      case "success":
        return {
          bright: "text-green-500 dark:text-green-400",
          dim: "text-green-200 dark:text-green-800",
        };
      default:
        return {
          bright: "text-gray-500 dark:text-gray-400",
          dim: "text-gray-200 dark:text-gray-800",
        };
    }
  };

  const colors = getColors();

  return (
    <div
      className={cn(
        "relative inline-block",
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      {/* Three arrows with cycling bright effect - NO SPINNING */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <style>
            {`
              @keyframes arrow-pulse-1 {
                0% { 
                  stroke: #f97316; 
                  stroke-width: 4;
                }
                30% { 
                  stroke: #6b7280; 
                  stroke-width: 3;
                }
                100% { 
                  stroke: #6b7280; 
                  stroke-width: 3;
                }
              }
              
              @keyframes arrow-pulse-2 {
                0% { 
                  stroke: #6b7280; 
                  stroke-width: 3;
                }
                30% { 
                  stroke: #6b7280; 
                  stroke-width: 3;
                }
                33% { 
                  stroke: #f97316; 
                  stroke-width: 4;
                }
                63% { 
                  stroke: #6b7280; 
                  stroke-width: 3;
                }
                100% { 
                  stroke: #6b7280; 
                  stroke-width: 3;
                }
              }
              
              @keyframes arrow-pulse-3 {
                0% { 
                  stroke: #6b7280; 
                  stroke-width: 3;
                }
                60% { 
                  stroke: #6b7280; 
                  stroke-width: 3;
                }
                66% { 
                  stroke: #f97316; 
                  stroke-width: 4;
                }
                96% { 
                  stroke: #6b7280; 
                  stroke-width: 3;
                }
                100% { 
                  stroke: #6b7280; 
                  stroke-width: 3;
                }
              }
              
              .arrow-1 {
                animation: arrow-pulse-1 1.5s ease-in-out infinite;
              }
              
              .arrow-2 {
                animation: arrow-pulse-2 1.5s ease-in-out infinite;
              }
              
              .arrow-3 {
                animation: arrow-pulse-3 1.5s ease-in-out infinite;
              }
            `}
          </style>
        </defs>
        
        {/* Arrow 1 - Flashes bright orange first */}
        <path
          d="M4 4L8 8L12 4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="arrow-1"
        />
        
        {/* Arrow 2 - Flashes bright orange second */}
        <path
          d="M4 10L8 14L12 10"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="arrow-2"
        />
        
        {/* Arrow 3 - Flashes bright orange third */}
        <path
          d="M4 16L8 20L12 16"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="arrow-3"
        />
      </svg>
    </div>
  );
}
