"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { IoClose, IoCloudUpload, IoCheckmarkCircle, IoAlertCircle } from "react-icons/io5";
import { Button } from "@/components/ui/button";
import { createSupabaseClient } from "@/utils/supabase/client";
import { performVisitorMigration, getVisitorWallets } from "@/utils/visitor-wallet-migration";

interface VisitorWalletMigrationPromptProps {
  publicUserId: string;
  onComplete: () => void;
  onDismiss: () => void;
}

export default function VisitorWalletMigrationPrompt({
  publicUserId,
  onComplete,
  onDismiss,
}: VisitorWalletMigrationPromptProps) {
  const [migrating, setMigrating] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    migratedCount: number;
    skippedCount: number;
    errors: string[];
  } | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const visitorWallets = getVisitorWallets();

  if (!mounted) return null;

  const handleMigrate = async () => {
    setMigrating(true);

    try {
      const supabase = createSupabaseClient();
      const migrationResult = await performVisitorMigration(supabase, publicUserId);
      
      setResult(migrationResult);

      if (migrationResult.success || migrationResult.migratedCount > 0) {
        // Wait a moment to show success message, then complete
        setTimeout(() => {
          onComplete();
        }, 2000);
      }
    } catch (error) {
      console.error("Migration failed:", error);
      setResult({
        success: false,
        migratedCount: 0,
        skippedCount: 0,
        errors: [error instanceof Error ? error.message : "Unknown error"],
      });
    } finally {
      setMigrating(false);
    }
  };

  // If migration is complete, show success message
  if (result && (result.success || result.migratedCount > 0)) {
    const successContent = (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
        style={{ isolation: 'isolate' }}>
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6 relative border border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <IoCheckmarkCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Wallets Migrated Successfully!
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              {result.migratedCount} {result.migratedCount === 1 ? "wallet" : "wallets"} imported to your account
            </p>
            {result.skippedCount > 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-500">
                ({result.skippedCount} already existed)
              </p>
            )}
          </div>
        </div>
      </div>
    );
    return createPortal(successContent, document.body);
  }

  // If migration failed, show error
  if (result && !result.success && result.errors.length > 0) {
    const errorContent = (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
        style={{ isolation: 'isolate' }}>
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6 relative border border-gray-200 dark:border-gray-700">
          <button
            onClick={onDismiss}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <IoClose className="w-5 h-5" />
          </button>

          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <IoAlertCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Migration Failed
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {result.errors[0]}
            </p>
            <div className="flex gap-3">
              <Button onClick={handleMigrate} className="flex-1">
                Try Again
              </Button>
              <Button onClick={onDismiss} variant="outline" className="flex-1">
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
    return createPortal(errorContent, document.body);
  }

  // Main migration prompt
  const promptContent = (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
      style={{ isolation: 'isolate' }}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6 relative border border-gray-200 dark:border-gray-700">
        <button
          onClick={onDismiss}
          disabled={migrating}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
        >
          <IoClose className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <IoCloudUpload className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Import Your Wallets?
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            We found {visitorWallets.length} {visitorWallets.length === 1 ? "wallet" : "wallets"} from your previous session.
            Would you like to import them to your account?
          </p>
        </div>

        {/* Wallet List Preview */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-6 max-h-48 overflow-y-auto">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Wallets to import:
          </p>
          <div className="space-y-2">
            {visitorWallets.map((wallet, index) => (
              <div
                key={index}
                className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
              >
                <div className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0"></div>
                <span className="font-mono truncate">{wallet.address}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={handleMigrate}
            disabled={migrating}
            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {migrating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                Importing...
              </>
            ) : (
              <>
                <IoCloudUpload className="w-4 h-4 mr-2" />
                Import Wallets
              </>
            )}
          </Button>
          <Button
            onClick={onDismiss}
            disabled={migrating}
            variant="outline"
            className="flex-1"
          >
            Maybe Later
          </Button>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-500 text-center mt-4">
          Your wallets will be permanently saved to your account
        </p>
      </div>
    </div>
  );

  return createPortal(promptContent, document.body);
}

