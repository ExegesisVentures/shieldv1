"use client";

import { useState } from "react";
import { IoCloudUpload, IoClose, IoCheckmarkCircle, IoAlertCircle } from "react-icons/io5";
import { migrateWalletsToAccount } from "@/utils/wallet/simplified-operations";

interface WalletMigrationModalProps {
  isOpen: boolean;
  walletCount: number;
  onSuccess: () => void;
  onDismiss: () => void;
}

export default function WalletMigrationModal({
  isOpen,
  walletCount,
  onSuccess,
  onDismiss,
}: WalletMigrationModalProps) {
  const [migrating, setMigrating] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    migratedCount: number;
    errors: string[];
  } | null>(null);

  if (!isOpen) return null;

  const handleMigrate = async () => {
    setMigrating(true);

    try {
      const migrationResult = await migrateWalletsToAccount();
      setResult(migrationResult);

      if (migrationResult.success || migrationResult.migratedCount > 0) {
        // Wait a moment to show success message, then reload
        setTimeout(() => {
          onSuccess();
          window.location.reload();
        }, 2000);
      }
    } catch (error) {
      console.error("Migration failed:", error);
      setResult({
        success: false,
        migratedCount: 0,
        errors: [error instanceof Error ? error.message : "Unknown error"],
      });
    } finally {
      setMigrating(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('migration_prompt_dismissed', 'true');
    onDismiss();
  };

  // Success state
  if (result?.success && result.migratedCount > 0) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-8 relative border border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <IoCheckmarkCircle className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Success!
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Successfully migrated {result.migratedCount} wallet{result.migratedCount !== 1 ? 's' : ''} to your account.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Refreshing dashboard...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (result && !result.success && result.errors.length > 0) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-8 relative border border-gray-200 dark:border-gray-700">
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <IoClose className="w-5 h-5" />
          </button>

          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <IoAlertCircle className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Migration Failed
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {result.errors[0]}
            </p>
            <button
              onClick={handleDismiss}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main migration prompt
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-8 relative border border-gray-200 dark:border-gray-700">
        <button
          onClick={handleDismiss}
          disabled={migrating}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
        >
          <IoClose className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <IoCloudUpload className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Save Your Wallets
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            We found {walletCount} wallet{walletCount !== 1 ? 's' : ''} that haven't been saved to your account yet.
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-6">
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
            <strong>Why save?</strong>
          </p>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
            <li>Access from any device</li>
            <li>Never lose your wallets</li>
            <li>Sync across browsers</li>
          </ul>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleDismiss}
            disabled={migrating}
            className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            Not Now
          </button>
          <button
            onClick={handleMigrate}
            disabled={migrating}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {migrating ? "Saving..." : "Save Wallets"}
          </button>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-500 text-center mt-4">
          You can always save them later from settings
        </p>
      </div>
    </div>
  );
}

