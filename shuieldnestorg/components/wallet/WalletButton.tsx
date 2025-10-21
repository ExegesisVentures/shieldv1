"use client";

import { IoReload } from "react-icons/io5";

interface WalletButtonProps {
  provider: "keplr" | "leap" | "cosmostation";
  onClick: () => void;
  connecting: boolean;
  disabled?: boolean;
}

const walletInfo = {
  keplr: {
    name: "Keplr",
    icon: "🦊", // In production, use actual logo
    color: "from-purple-600 to-purple-800",
  },
  leap: {
    name: "Leap",
    icon: "🐸",
    color: "from-green-600 to-green-800",
  },
  cosmostation: {
    name: "Cosmostation",
    icon: "🚀",
    color: "from-blue-600 to-blue-800",
  },
};

export default function WalletButton({
  provider,
  onClick,
  connecting,
  disabled,
}: WalletButtonProps) {
  const info = walletInfo[provider];

  return (
    <button
      onClick={onClick}
      disabled={disabled || connecting}
      className={`
        group relative w-full
        bg-gradient-to-r ${info.color}
        hover:shadow-xl hover:scale-105
        active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
        text-white font-semibold
        px-6 py-4 rounded-xl
        transition-all duration-200
        flex items-center justify-center gap-3
      `}
    >
      <span className="text-3xl">{info.icon}</span>
      <span className="text-lg">{info.name}</span>
      {connecting && (
        <IoReload className="w-5 h-5 animate-spin ml-auto" />
      )}
    </button>
  );
}

