"use client";

import { useEffect, useRef } from "react";
import { IoWarning, IoCheckmark, IoClose } from "react-icons/io5";

interface ConfirmPopoverProps {
  message: string;
  subMessage?: string;
  onConfirm: () => void;
  onCancel: () => void;
  position: { x: number; y: number };
  confirmText?: string;
  cancelText?: string;
}

export default function ConfirmPopover({
  message,
  subMessage,
  onConfirm,
  onCancel,
  position,
  confirmText = "Hide",
  cancelText = "Cancel",
}: ConfirmPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Click outside to close
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onCancel();
      }
    };

    // ESC key to close
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onCancel]);

  return (
    <div
      ref={popoverRef}
      className="fixed z-[10000] animate-in fade-in slide-in-from-bottom-2 duration-200"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: "translate(-50%, 10px)",
      }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border-2 border-orange-500/30 dark:border-orange-400/30 p-4 min-w-[280px] max-w-[360px]">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
            <IoWarning className="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white text-base">
              {message}
            </h3>
            {subMessage && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {subMessage}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
          >
            <IoClose className="w-4 h-4" />
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors flex items-center gap-2 shadow-lg"
          >
            <IoCheckmark className="w-4 h-4" />
            {confirmText}
          </button>
        </div>
      </div>

      {/* Arrow pointing up */}
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-gray-800 border-l-2 border-t-2 border-orange-500/30 dark:border-orange-400/30 rotate-45"></div>
    </div>
  );
}

