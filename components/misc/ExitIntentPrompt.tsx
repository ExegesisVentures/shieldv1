"use client";
import { useEffect, useState } from "react";

export default function ExitIntentPrompt() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onLeave = (e: MouseEvent) => { if (e.clientY <= 0) setShow(true); };
    window.addEventListener("mouseout", onLeave);
    return () => window.removeEventListener("mouseout", onLeave);
  }, []);
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100]">
      <div className="bg-white rounded-xl p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold">Save your portfolio</h3>
        <p className="text-sm text-gray-600 mt-2">Create a free account to keep your addresses and get updates.</p>
        <div className="mt-4 flex gap-2">
          <a href="/(auth)/sign-up" className="px-3 py-2 rounded bg-black text-white">Create account</a>
          <button onClick={()=>setShow(false)} className="px-3 py-2 rounded border">Not now</button>
        </div>
      </div>
    </div>
  );
}

