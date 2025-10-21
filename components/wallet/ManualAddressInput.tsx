"use client";
import { useState } from "react";
import { IoAdd } from "react-icons/io5";

export default function ManualAddressInput({
  onAdd,
}: {
  onAdd: (addr: string, label?: string) => void;
}) {
  const [addr, setAddr] = useState("");
  const [label, setLabel] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (addr.trim()) {
      onAdd(addr.trim(), label.trim() || undefined);
      setAddr("");
      setLabel("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Coreum Address *
        </label>
        <input
          type="text"
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          placeholder="core1..."
          value={addr}
          onChange={(e) => setAddr(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Label (Optional)
        </label>
        <input
          type="text"
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          placeholder="e.g., My Wallet"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
      </div>

      <button
        type="submit"
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
      >
        <IoAdd className="w-5 h-5" />
        <span>Add Address</span>
      </button>
    </form>
  );
}

