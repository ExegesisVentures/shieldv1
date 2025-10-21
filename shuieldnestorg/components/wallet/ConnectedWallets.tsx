"use client";

import { useEffect, useState } from "react";
import { createSupabaseClient } from "@/utils/supabase/client";
import { getAllWallets } from "@/utils/wallet/simplified-operations";
import { IoWallet, IoTrash, IoStar, IoOpenOutline, IoCopy, IoCheckmark } from "react-icons/io5";
import VerificationBadge from "@/components/wallet/VerificationBadge";

interface WalletData {
  id: string;
  address: string;
  label: string;
  read_only: boolean;
  is_primary: boolean;
  is_custodial?: boolean;
  ownership_verified?: boolean;
  custodian_note?: string;
  created_at: string;
}

interface ConnectedWalletsProps {
  onRefresh?: number; // Counter to trigger refresh
}

export default function ConnectedWallets({ onRefresh }: ConnectedWalletsProps) {
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [isVisitor, setIsVisitor] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);

  // Check for connected Keplr wallet
  useEffect(() => {
    const checkConnectedWallet = async () => {
      if (window.keplr) {
        try {
          const { keplrGetAddress } = await import('@/utils/wallet/keplr');
          const address = await keplrGetAddress();
          setConnectedWallet(address);
          console.log("🔗 Connected Keplr wallet:", address);
        } catch (error) {
          console.log("No Keplr wallet connected");
          setConnectedWallet(null);
        }
      }
    };
    checkConnectedWallet();
  }, [onRefresh]);

  useEffect(() => {
    console.log("🚀 ConnectedWallets: Component mounted/refreshed, onRefresh:", onRefresh);
    let mounted = true;
    
    const loadWalletsIfMounted = async () => {
      await loadWallets();
      if (!mounted) {
        console.log("⚠️ ConnectedWallets: Component unmounted during load, ignoring results");
      }
    };
    
    loadWalletsIfMounted();
    
    // Listen for storage changes (for visitor addresses from other tabs)
    const handleStorageChange = () => {
      if (mounted) loadWallets();
    };
    
    // Listen for custom wallet storage change event (fires in same window for visitors)
    const handleWalletStorageChange = () => {
      if (mounted) loadWallets();
    };
    
    // Listen for wallet database change event (fires in same window for authenticated users)
    const handleWalletDatabaseChange = () => {
      if (mounted) loadWallets();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('walletStorageChange', handleWalletStorageChange);
    window.addEventListener('walletDatabaseChange', handleWalletDatabaseChange);
    
    return () => {
      mounted = false;
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('walletStorageChange', handleWalletStorageChange);
      window.removeEventListener('walletDatabaseChange', handleWalletDatabaseChange);
    };
  }, [onRefresh]);

  const loadWallets = async () => {
    console.log("🔄 ConnectedWallets: Starting loadWallets...");
    setLoading(true);
    
    try {
      const supabase = createSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      console.log("👤 ConnectedWallets: User authenticated:", !!user);
      
      // Use the centralized getAllWallets utility
      const allWallets = await getAllWallets();
      console.log("✅ ConnectedWallets: Retrieved wallets:", allWallets.length);
      
      if (user) {
        // AUTHENTICATED USER - Get full wallet data from database
        console.log("🔐 ConnectedWallets: Fetching full wallet data from database...");
        setIsVisitor(false);
        
        // Get user's public_user_id
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("public_user_id")
          .eq("auth_user_id", user.id)
          .maybeSingle();
        
        if (!profile?.public_user_id) {
          console.warn("⚠️ ConnectedWallets: No user profile found");
          // Fall back to simple display from getAllWallets
          const formattedWallets = allWallets.map((w, index) => ({
            id: `wallet-${index}`,
            address: w.address,
            label: w.label || "Wallet",
            read_only: true,
            is_primary: index === 0,
            created_at: new Date().toISOString(),
          }));
          setWallets(formattedWallets);
          setLoading(false);
          return;
        }
        
        // Get full wallet data from database
        const { data: dbWallets, error } = await supabase
          .from("wallets")
          .select("*")
          .eq("public_user_id", profile.public_user_id)
          .order("created_at", { ascending: false });
        
        if (error) {
          console.error("❌ ConnectedWallets: Database error:", error);
          // Fall back to simple display
          const formattedWallets = allWallets.map((w, index) => ({
            id: `wallet-${index}`,
            address: w.address,
            label: w.label || "Wallet",
            read_only: true,
            is_primary: index === 0,
            created_at: new Date().toISOString(),
          }));
          setWallets(formattedWallets);
        } else {
          console.log("✅ ConnectedWallets: Loaded", dbWallets?.length || 0, "wallets from database");
          setWallets(dbWallets || []);
        }
      } else {
        // ANONYMOUS USER - Format wallets from getAllWallets
        console.log("📦 ConnectedWallets: Anonymous mode, formatting", allWallets.length, "wallets");
        setIsVisitor(true);
        
        const formattedWallets = allWallets.map((w, index) => ({
          id: `visitor-${index}`,
          address: w.address,
          label: w.label || "Manual Address",
          read_only: true,
          is_primary: index === 0,
          created_at: new Date().toISOString(),
        }));
        
        console.log("✅ ConnectedWallets: Formatted", formattedWallets.length, "anonymous wallets");
        setWallets(formattedWallets);
      }
    } catch (error) {
      console.error("❌ ConnectedWallets: Error loading wallets:", error);
      setWallets([]);
    } finally {
      console.log("✅ ConnectedWallets: Finished loading, setting loading=false");
      setLoading(false);
    }
  };

  const handleDelete = async (walletId: string) => {
    if (!confirm("Are you sure you want to remove this wallet?")) {
      return;
    }

    setDeleting(walletId);

    try {
      // Check if it's a visitor wallet
      if (walletId.startsWith('visitor-')) {
        // Delete from localStorage (using the correct key from simplified operations)
        const anonymousWallets = JSON.parse(localStorage.getItem('anonymous_wallets') || '[]');
        const index = parseInt(walletId.replace('visitor-', ''));
        anonymousWallets.splice(index, 1);
        localStorage.setItem('anonymous_wallets', JSON.stringify(anonymousWallets));
        
        // Trigger wallet storage change event for anonymous users
        window.dispatchEvent(new CustomEvent('walletStorageChange', {
          detail: { action: 'remove', index }
        }));
        
        await loadWallets();
      } else {
        // Delete from database
        const supabase = createSupabaseClient();
        const { error } = await supabase.from("wallets").delete().eq("id", walletId);

        if (error) {
          console.error("Failed to delete wallet:", error);
          alert("Failed to remove wallet. Please try again.");
        } else {
          await loadWallets();
        }
      }
    } catch (error) {
      console.error("Error deleting wallet:", error);
      alert("Failed to remove wallet. Please try again.");
    } finally {
      setDeleting(null);
    }
  };

  const truncateAddress = (address: string) => {
    if (address.length <= 20) return address;
    return `${address.slice(0, 10)}...${address.slice(-8)}`;
  };

  const handleCopyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-20 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
        <div className="h-20 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
      </div>
    );
  }

  if (wallets.length === 0) {
    return (
      <div className="text-center py-12 px-4 bg-gray-50 dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
        <IoWallet className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-600 dark:text-gray-400 mb-2">No wallets connected</p>
        <p className="text-sm text-gray-500 dark:text-gray-500">
          Connect a wallet or add an address to track your portfolio
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {wallets.map((wallet) => {
        const isConnected = connectedWallet === wallet.address;
        return (
        <div
          key={wallet.id}
          className={`group bg-white dark:bg-gray-800 rounded-xl p-4 hover:shadow-lg transition-all ${
            isConnected 
              ? 'border-2 border-green-500 dark:border-green-400 shadow-lg shadow-green-500/20' 
              : 'border border-gray-200 dark:border-gray-700'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            {/* IoWallet Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <IoWallet className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {wallet.label}
                </span>
                {wallet.is_primary && (
                  <IoStar className="w-4 h-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                )}
                
                {/* Custodial Badge */}
                {wallet.is_custodial && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full">
                    🏦 Custodial
                  </span>
                )}
                
                {/* Verification Badge - only for non-custodial wallets */}
                {!wallet.is_custodial && (
                  <VerificationBadge verified={wallet.ownership_verified || false} size="sm" showLabel={true} />
                )}
              </div>
              
              {/* Custodial note if present */}
              {wallet.is_custodial && wallet.custodian_note && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  {wallet.custodian_note}
                </p>
              )}
              
              <div className="flex items-center gap-2">
                <code className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                  {truncateAddress(wallet.address)}
                </code>
                <button
                  onClick={() => handleCopyAddress(wallet.address)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  title="Copy address"
                >
                  {copiedAddress === wallet.address ? (
                    <IoCheckmark className="w-4 h-4 text-green-500" />
                  ) : (
                    <IoCopy className="w-4 h-4" />
                  )}
                </button>
                <a
                  href={`https://explorer.coreum.com/coreum/accounts/${wallet.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  title="View on explorer"
                >
                  <IoOpenOutline className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Delete Button - visitors can delete any wallet, authenticated users can't delete primary */}
            {(isVisitor || !wallet.is_primary) && (
              <button
                onClick={() => handleDelete(wallet.id)}
                disabled={deleting === wallet.id}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                title="Remove wallet"
              >
                {deleting === wallet.id ? (
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-red-600 rounded-full animate-spin"></div>
                ) : (
                  <IoTrash className="w-5 h-5" />
                )}
              </button>
            )}
          </div>
        </div>
      )})}
    </div>
  );
}

