"use client";

import { useState, useEffect } from "react";
import { IoClose, IoEyeOutline, IoTrash } from "react-icons/io5";
import { createPortal } from "react-dom";
import { getHiddenTokens, unhideToken, clearAllHiddenTokens, type HiddenToken } from "@/utils/hidden-tokens";

interface HiddenTokensListProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HiddenTokensList({ isOpen, onClose }: HiddenTokensListProps) {
  const [hiddenTokens, setHiddenTokens] = useState<HiddenToken[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadHiddenTokens();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleHiddenTokensChange = () => {
      loadHiddenTokens();
    };

    window.addEventListener('hiddenTokensChanged', handleHiddenTokensChange);
    return () => {
      window.removeEventListener('hiddenTokensChanged', handleHiddenTokensChange);
    };
  }, []);

  const loadHiddenTokens = () => {
    const tokens = getHiddenTokens();
    setHiddenTokens(tokens);
  };

  const handleUnhide = (denom: string) => {
    unhideToken(denom);
    loadHiddenTokens();
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to unhide all tokens?')) {
      clearAllHiddenTokens();
      loadHiddenTokens();
    }
  };

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full border border-gray-200 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Hidden Tokens
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage tokens you've hidden from your portfolio
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <IoClose className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {hiddenTokens.length === 0 ? (
            <div className="text-center py-12">
              <IoEyeOutline className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 dark:text-gray-400 mb-2">No hidden tokens</p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Tokens you hide will appear here
              </p>
            </div>
          ) : (
            <>
              {/* Clear All Button */}
              <div className="flex justify-end mb-4">
                <button
                  onClick={handleClearAll}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <IoTrash className="w-4 h-4" />
                  Unhide All
                </button>
              </div>

              {/* Hidden Tokens List */}
              <div className="space-y-3">
                {hiddenTokens.map((token) => (
                  <div
                    key={token.denom}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white font-bold">
                          {token.symbol.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {token.symbol}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Hidden {new Date(token.hiddenAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleUnhide(token.denom)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                    >
                      <IoEyeOutline className="w-4 h-4" />
                      Show
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

