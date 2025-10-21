"use client";

import { useEffect, useRef, useState } from "react";
import { IoColorPalette, IoWater, IoMoon } from "react-icons/io5";
import { useTheme } from "next-themes";

// Continuous hue + card tint controls

export default function ColorSchemeSlider() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [hue, setHue] = useState(262); // default purple-ish
  const [tint, setTint] = useState(22); // 0..40 translates to 0..0.40
  const [darkness, setDarkness] = useState(0); // 0..100
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    const savedHue = Number(window.localStorage.getItem("accent-h"));
    const initialHue = Number.isFinite(savedHue) ? savedHue : 262;
    setHue(initialHue);
    document.documentElement.style.setProperty("--accent-h", String(initialHue));

    const savedTint = Number(window.localStorage.getItem("card-tint"));
    const initialTint = Number.isFinite(savedTint) ? savedTint : 22;
    setTint(initialTint);
    document.documentElement.style.setProperty("--card-tint", String(initialTint / 100));
    const savedDark = Number(window.localStorage.getItem("ui-darkness"));
    const initialDark = Number.isFinite(savedDark) ? savedDark : 0;
    setDarkness(initialDark);
    document.documentElement.style.setProperty("--ui-darkness", String(initialDark));
  }, [mounted]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (open && containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  if (!mounted) {
    return (
      <button className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
        <div className="w-5 h-5" />
      </button>
    );
  }

  const hueGradient = `linear-gradient(90deg, 
    hsl(0 100% 50%), 
    hsl(60 100% 50%), 
    hsl(120 100% 40%), 
    hsl(180 100% 40%), 
    hsl(240 100% 60%), 
    hsl(300 80% 60%), 
    hsl(360 100% 50%)
  )`;

  const onHueChange = (val: number) => {
    const bounded = Math.max(0, Math.min(val, 360));
    setHue(bounded);
    document.documentElement.style.setProperty("--accent-h", String(bounded));
    window.localStorage.setItem("accent-h", String(bounded));
  };

  const onTintChange = (val: number) => {
    const bounded = Math.max(0, Math.min(val, 40));
    setTint(bounded);
    document.documentElement.style.setProperty("--card-tint", String(bounded / 100));
    window.localStorage.setItem("card-tint", String(bounded));
  };

  const onDarknessChange = (val: number) => {
    const bounded = Math.max(0, Math.min(val, 100));
    setDarkness(bounded);
    document.documentElement.style.setProperty("--ui-darkness", String(bounded));
    window.localStorage.setItem("ui-darkness", String(bounded));
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Open color scheme selector"
        className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center gap-1"
      >
        <IoColorPalette className="w-5 h-5" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-2xl p-4 z-50">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Color Scheme</div>
          </div>

          <div className="py-3">
            <input
              type="range"
              min={0}
              max={360}
              step={1}
              value={hue}
              onChange={(e) => onHueChange(parseInt(e.target.value, 10))}
              className="w-full h-2 rounded-full appearance-none outline-none"
              style={{ background: hueGradient }}
            />
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-gray-600 dark:text-gray-400 inline-flex items-center gap-1">
                <IoWater className="w-3.5 h-3.5" /> Card Tint
              </div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400">{tint}%</div>
            </div>
            <input
              type="range"
              min={0}
              max={40}
              step={1}
              value={tint}
              onChange={(e) => onTintChange(parseInt(e.target.value, 10))}
              className="w-full h-2 rounded-full appearance-none outline-none bg-gray-200 dark:bg-gray-700"
            />
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-gray-600 dark:text-gray-400 inline-flex items-center gap-1">
                <IoMoon className="w-3.5 h-3.5" /> Darkness
              </div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400">{darkness}%</div>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={darkness}
              onChange={(e) => onDarknessChange(parseInt(e.target.value, 10))}
              className="w-full h-2 rounded-full appearance-none outline-none bg-gray-200 dark:bg-gray-700"
            />
          </div>
        </div>
      )}
    </div>
  );
}


