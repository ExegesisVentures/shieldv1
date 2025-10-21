"use client";

import ShieldNestLogo from "@/components/shieldnest-logo";

export default function LogoMenuButton() {
  const handleClick = () => {
    try {
      const evt = new CustomEvent('openHeaderMenu');
      window.dispatchEvent(evt);
    } catch {}
  };

  return (
    <button
      className="hover:opacity-80 transition-opacity"
      onClick={handleClick}
      aria-label="Open menu"
    >
      <ShieldNestLogo width={32} height={32} showText={true} />
    </button>
  );
}


