"use client";
import { useEffect, useState } from "react";
export function useExitIntent() {
  const [fired, setFired] = useState(false);
  useEffect(() => {
    const onLeave = (e: MouseEvent) => { if (e.clientY <= 0 && !fired) setFired(true); };
    window.addEventListener("mouseout", onLeave);
    return () => window.removeEventListener("mouseout", onLeave);
  }, [fired]);
  return { fired, reset: () => setFired(false) };
}

