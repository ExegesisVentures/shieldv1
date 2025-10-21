"use client";

import { useState } from "react";
import { IoWallet, IoCreate, IoTrash, IoOpenOutline, IoAdd } from "react-icons/io5";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Address {
  id: string;
  address: string;
  label: string;
  chain: string;
}

interface AddressListProps {
  addresses?: Address[];
  loading?: boolean;
  onAdd?: () => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function AddressList({
  addresses = [],
  loading = false,
  onAdd,
  onEdit,
  onDelete,
}: AddressListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this address?")) {
      return;
    }
    setDeletingId(id);
    await onDelete?.(id);
    setDeletingId(null);
  };

  const truncateAddress = (address: string) => {
    if (address.length <= 20) return address;
    return `${address.slice(0, 10)}...${address.slice(-8)}`;
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-3 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (addresses.length === 0) {
    return (
      <Card className="p-12 text-center">
        <IoWallet className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-600 dark:text-gray-400 mb-2">No addresses saved</p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
          Add addresses to track multiple wallets
        </p>
        {onAdd && (
          <Button onClick={onAdd}>
            <IoAdd className="w-4 h-4 mr-2" />
            Add Address
          </Button>
        )}
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          Saved Addresses
        </h3>
        {onAdd && (
          <Button onClick={onAdd} size="sm">
            <IoAdd className="w-4 h-4 mr-2" />
            Add Address
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {addresses.map((addr) => (
          <div
            key={addr.id}
            className="group flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 rounded-xl transition-all"
          >
            {/* Address Info */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                <IoWallet className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {addr.label}
                  </span>
                  <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                    {addr.chain}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                    {truncateAddress(addr.address)}
                  </code>
                  <a
                    href={`https://explorer.coreum.com/coreum/accounts/${addr.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    title="View on explorer"
                  >
                    <IoOpenOutline className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {onEdit && (
                <button
                  onClick={() => onEdit(addr.id)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                  title="Edit label"
                >
                  <IoCreate className="w-4 h-4" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => handleDelete(addr.id)}
                  disabled={deletingId === addr.id}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                  title="Remove address"
                >
                  {deletingId === addr.id ? (
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-red-600 rounded-full animate-spin"></div>
                  ) : (
                    <IoTrash className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

