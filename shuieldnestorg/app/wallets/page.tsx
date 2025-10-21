"use client";

import { useState, useEffect } from "react";
import { IoWallet, IoAdd } from "react-icons/io5";
// import { Button } from "@/components/ui/button";
import AddressList from "@/components/portfolio/AddressList";
import NftHoldings from "@/components/portfolio/NftHoldings";
import WalletConnectModal from "@/components/wallet/WalletConnectModal";
import { createSupabaseClient } from "@/utils/supabase/client";
import { fetchUserWallets, deleteWallet, updateWalletLabel } from "@/utils/wallet/operations";
import { getShieldNftHolding, ShieldNftHolding, fetchShieldSettings, hasShieldNft } from "@/utils/nft/shield";
import { getTokenPrice, getTokenChange24h } from "@/utils/coreum/rpc";

export default function WalletsPage() {
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [addresses, setAddresses] = useState<Array<{
    id: string;
    address: string;
    label: string;
    chain: string;
  }>>([]);
  const [shieldNft, setShieldNft] = useState<ShieldNftHolding | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWallets();
  }, [refreshCounter]);

  const loadWallets = async () => {
    setLoading(true);
    try {
      const supabase = createSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setAddresses([]);
        setShieldNft(null);
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("public_user_id")
        .eq("auth_user_id", user.id)
        .single();

      if (profile?.public_user_id) {
        // Fetch Shield NFT settings and CORE price in parallel for better performance
        const [shieldSettings, corePrice, coreChange] = await Promise.all([
          fetchShieldSettings(supabase),
          getTokenPrice("CORE"),
          getTokenChange24h("CORE")
        ]);
        
        // Check if user actually owns Shield NFT before showing it
        const userOwnsShieldNft = await hasShieldNft(supabase, profile.public_user_id, "public");
        
        if (userOwnsShieldNft) {
          // Generate Shield NFT holding (backed by 41,666 CORE tokens)
          const nftHolding = getShieldNftHolding(
            corePrice,
            coreChange,
            shieldSettings
          );
          setShieldNft(nftHolding);
        } else {
          // User doesn't own Shield NFT, don't show it
          setShieldNft(null);
        }

        const wallets = await fetchUserWallets(supabase, profile.public_user_id);
        setAddresses(wallets.map(w => ({
          id: w.id,
          address: w.address,
          label: w.label,
          chain: "Coreum",
        })));
      } else {
        setAddresses([]);
        setShieldNft(null);
      }
    } catch (error) {
      console.error("Error loading wallets:", error);
      setAddresses([]);
      setShieldNft(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setShowConnectModal(true);
  };

  const handleEdit = async (id: string) => {
    const newLabel = prompt("Enter new label:");
    if (newLabel) {
      const supabase = createSupabaseClient();
      const result = await updateWalletLabel(supabase, id, newLabel);
      if (result.success) {
        loadWallets();
      } else {
        alert(result.error?.message || "Failed to update label");
      }
    }
  };

  const handleDelete = async (id: string) => {
    const supabase = createSupabaseClient();
    const result = await deleteWallet(supabase, id);
    if (result.success) {
      loadWallets();
    } else {
      alert(result.error?.message || "Failed to delete wallet");
    }
  };

  const handleConnectionSuccess = () => {
    setRefreshCounter((prev) => prev + 1);
    setShowConnectModal(false);
  };

  return (
    <main className="p-6 max-w-7xl mx-auto neo-gradient-bg min-h-screen">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-4 mb-3">
          <div className="neo-icon-glow-green p-3 rounded-2xl">
            <IoWallet className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white">
            Wallet Management
          </h1>
        </div>
        <p className="text-lg text-gray-400">
          Connect and manage your Coreum wallets in one place
        </p>
      </div>

      {/* Add Wallet Button */}
      <div className="mb-8">
        <button 
          onClick={handleAdd}
          className="neo-float-green px-8 py-4 text-lg font-semibold text-white flex items-center gap-2"
        >
          <IoAdd className="w-5 h-5" />
          Add Wallet
        </button>
      </div>

      {/* Shield NFT Holdings */}
      {shieldNft && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Your NFT Holdings
          </h2>
          <NftHoldings nfts={[shieldNft]} loading={loading} />
        </div>
      )}

      {/* Address List */}
      <AddressList
        addresses={addresses}
        loading={loading}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Wallet Connect Modal */}
      <WalletConnectModal
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        onSuccess={handleConnectionSuccess}
      />
    </main>
  );
}

