"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface ShieldNestLogoProps {
  className?: string;
  width?: number;
  height?: number;
  showText?: boolean;
}

export default function ShieldNestLogo({ 
  className = "", 
  width = 32, 
  height = 32, 
  showText = true 
}: ShieldNestLogoProps) {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return a placeholder during SSR to prevent hydration mismatch
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div 
          className="bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center"
          style={{ width, height }}
        >
          <div className="w-5 h-5 bg-white rounded-sm" />
        </div>
        {showText && (
          <span className="font-bold text-xl text-gray-900 dark:text-white hidden sm:inline-block">
            ShieldNest
          </span>
        )}
      </div>
    );
  }

  // Determine which logo to use based on theme
  const isDark = resolvedTheme === "dark" || theme === "dark";
  const logoSrc = isDark ? "/tokens/shld_dark.svg" : "/tokens/shld_light.svg";

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Image
        src={logoSrc}
        alt="ShieldNest Logo"
        width={width}
        height={height}
        className="object-contain"
        priority
      />
      {showText && (
        <span className="font-bold text-xl text-gray-900 dark:text-white hidden sm:inline-block">
          ShieldNest
        </span>
      )}
    </div>
  );
}
