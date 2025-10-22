"use client";

import { useState, useEffect } from "react";
import { createSupabaseClient } from "@/utils/supabase/client";
import { isUserAdmin } from "@/utils/admin";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";

interface ShieldSettings {
  id: number;
  image_url: string | null;
  min_usd: number;
  max_usd: number;
  updated_at?: string;
}

interface RewardsHistoryWallet {
  address: string;
  label?: string;
  rewards: string;
}

interface UserWallet {
  id: string;
  address: string;
  label: string | null;
  public_user_id: string;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

interface UserData {
  user_id: string;
  email: string | null;
  created_at: string;
  wallets: UserWallet[];
  wallet_count: number;
  active_wallet_count: number;
}

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isVisitorAdmin, setIsVisitorAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<ShieldSettings>({
    id: 1,
    image_url: null,
    min_usd: 5000,
    max_usd: 6000,
  });
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  // Rewards tracking state
  const [rewardsData, setRewardsData] = useState<{
    total: string;
    walletCount: number;
    wallets: RewardsHistoryWallet[];
  } | null>(null);
  const [rewardsLoading, setRewardsLoading] = useState(false);
  const [refreshingRewards, setRefreshingRewards] = useState(false);

  // User management state
  const [users, setUsers] = useState<UserData[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    checkAdminAndLoadSettings();
    loadRewardsData();
    loadUsers();
  }, []);

  async function checkAdminAndLoadSettings() {
    try {
      const supabase = createSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      let adminStatus = false;
      
      if (user) {
        // Authenticated user - check via database
        adminStatus = await isUserAdmin(supabase);
      } else {
        // Not authenticated - check if connected wallet is admin wallet
        const { isAdminWallet } = await import("@/utils/admin");
        const visitorAddresses = JSON.parse(localStorage.getItem('visitor_addresses') || '[]');
        adminStatus = visitorAddresses.some((w: { address: string }) => isAdminWallet(w.address));
      }
      
      setIsAdmin(adminStatus);
      setIsVisitorAdmin(!user && adminStatus);

      if (!adminStatus) {
        setLoading(false);
        return;
      }

      // Load current settings
      const response = await fetch("/api/admin/shield-settings");
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error("Error loading admin page:", error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/shield-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image_url: settings.image_url,
          min_usd: settings.min_usd,
          max_usd: settings.max_usd,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSettings(data);
        setMessage({ type: "success", text: "Shield NFT settings saved successfully!" });
      } else {
        setMessage({ 
          type: "error", 
          text: data.message || "Failed to save settings" 
        });
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage({ type: "error", text: "An error occurred while saving" });
    } finally {
      setSaving(false);
    }
  }

  async function loadRewardsData() {
    setRewardsLoading(true);
    try {
      const response = await fetch("/api/coreum/rewards-history?custodial=true");
      const data = await response.json();
      
      if (data.success && data.data) {
        setRewardsData(data.data);
      }
    } catch (error) {
      console.error("Error loading rewards data:", error);
    } finally {
      setRewardsLoading(false);
    }
  }

  async function handleRefreshRewards() {
    setRefreshingRewards(true);
    setMessage(null);
    
    try {
      const response = await fetch("/api/admin/rewards/refresh", {
        method: "POST",
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMessage({ 
          type: "success", 
          text: `Refreshed ${data.data.success} of ${data.data.success + data.data.failed} wallets successfully!` 
        });
        // Reload rewards data
        await loadRewardsData();
      } else {
        setMessage({ 
          type: "error", 
          text: data.error || "Failed to refresh rewards" 
        });
      }
    } catch (error) {
      console.error("Error refreshing rewards:", error);
      setMessage({ type: "error", text: "An error occurred while refreshing" });
    } finally {
      setRefreshingRewards(false);
    }
  }

  async function loadUsers() {
    setUsersLoading(true);
    try {
      const url = searchTerm 
        ? `/api/admin/users?search=${encodeURIComponent(searchTerm)}`
        : "/api/admin/users";
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.data || []);
      }
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setUsersLoading(false);
    }
  }

  async function handleGrantShieldAccess(userId: string) {
    if (!confirm("Grant Shield member access to this user?")) return;
    
    setActionLoading(true);
    setMessage(null);
    
    try {
      const response = await fetch("/api/admin/users/shield-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          grantAccess: true,
          pmaSigned: true,
          hasShieldNft: true,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMessage({ type: "success", text: "Shield access granted successfully!" });
        await loadUsers();
      } else {
        setMessage({ type: "error", text: data.message || "Failed to grant access" });
      }
    } catch (error) {
      console.error("Error granting access:", error);
      setMessage({ type: "error", text: "An error occurred" });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRevokeShieldAccess(userId: string) {
    if (!confirm("Revoke Shield member access from this user?")) return;
    
    setActionLoading(true);
    setMessage(null);
    
    try {
      const response = await fetch("/api/admin/users/shield-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          grantAccess: false,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMessage({ type: "success", text: "Shield access revoked successfully!" });
        await loadUsers();
      } else {
        setMessage({ type: "error", text: data.message || "Failed to revoke access" });
      }
    } catch (error) {
      console.error("Error revoking access:", error);
      setMessage({ type: "error", text: "An error occurred" });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDeleteUser(userId: string) {
    if (!confirm("Soft delete this user's wallets? This will mark all their wallets as deleted.")) return;
    
    setActionLoading(true);
    setMessage(null);
    
    try {
      const response = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMessage({ type: "success", text: "User wallets deleted successfully!" });
        await loadUsers();
        setShowUserDetails(false);
        setSelectedUser(null);
      } else {
        setMessage({ type: "error", text: data.message || "Failed to delete user" });
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      setMessage({ type: "error", text: "An error occurred" });
    } finally {
      setActionLoading(false);
    }
  }

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearchTerm(e.target.value);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    loadUsers();
  }

  function viewUserDetails(user: UserData) {
    setSelectedUser(user);
    setShowUserDetails(true);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-400">
            You do not have permission to access this page. Only administrators can view this content.
          </p>
          <div className="mt-6">
            <Button onClick={() => window.location.href = "/dashboard"}>
              Go to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-400">
            Manage Shield NFT settings and application configuration
          </p>
        </div>

        {/* Visitor Admin Warning */}
        {isVisitorAdmin && (
          <div className="mb-6 p-4 rounded-lg bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100">
            <p className="font-semibold">⚠️ View-Only Mode</p>
            <p className="text-sm mt-1">
              You&apos;re connected with an admin wallet but not authenticated. 
              Sign up with this wallet to save settings.
            </p>
          </div>
        )}

        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === "success"
                ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100"
                : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Shield NFT Settings Card */}
        <Card className="p-6 mb-6">
          <h2 className="text-2xl font-bold text-white mb-6">
            Shield NFT Settings
          </h2>

          <div className="space-y-6">
            {/* Image URL */}
            <div>
              <Label htmlFor="image_url">Shield NFT Image URL</Label>
              <Input
                id="image_url"
                type="text"
                placeholder="https://example.com/shield-nft.png"
                value={settings.image_url || ""}
                onChange={(e) => setSettings({ ...settings, image_url: e.target.value })}
                className="mt-2"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Public URL for the Shield NFT placeholder image
              </p>
            </div>

            {/* Min USD Value */}
            <div>
              <Label htmlFor="min_usd">Minimum USD Value</Label>
              <Input
                id="min_usd"
                type="number"
                placeholder="5000"
                value={settings.min_usd}
                onChange={(e) => setSettings({ ...settings, min_usd: parseFloat(e.target.value) || 0 })}
                className="mt-2"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Minimum estimated value in USD
              </p>
            </div>

            {/* Max USD Value */}
            <div>
              <Label htmlFor="max_usd">Maximum USD Value</Label>
              <Input
                id="max_usd"
                type="number"
                placeholder="6000"
                value={settings.max_usd}
                onChange={(e) => setSettings({ ...settings, max_usd: parseFloat(e.target.value) || 0 })}
                className="mt-2"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Maximum estimated value in USD
              </p>
            </div>

            {/* Preview */}
            <div>
              <Label>Preview</Label>
              <div className="mt-2 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                {settings.image_url ? (
                  <div className="flex items-center space-x-4">
                    <img
                      src={settings.image_url}
                      alt="Shield NFT"
                      className="w-24 h-24 object-cover rounded"
                      onError={(e) => {
                        e.currentTarget.src = "/tokens/default.svg";
                      }}
                    />
                    <div>
                      <p className="font-semibold text-white">
                        Shield NFT
                      </p>
                      <p className="text-sm text-gray-400">
                        Estimated Value: ${settings.min_usd.toLocaleString()} - ${settings.max_usd.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                    No image URL set
                  </p>
                )}
              </div>
            </div>

            {/* Last Updated */}
            {settings.updated_at && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Last updated: {new Date(settings.updated_at).toLocaleString()}
              </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end space-x-4">
              <Button
                variant="outline"
                onClick={checkAdminAndLoadSettings}
                disabled={saving || isVisitorAdmin}
              >
                Reset
              </Button>
              <Button onClick={handleSave} disabled={saving || isVisitorAdmin}>
                {saving ? (
                  <>
                    <Spinner className="mr-2" />
                    Saving...
                  </>
                ) : isVisitorAdmin ? (
                  "Sign Up to Save"
                ) : (
                  "Save Settings"
                )}
              </Button>
            </div>
          </div>
        </Card>

        {/* Custodial Wallets Rewards Tracking */}
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">
                Custodial Wallets - Rewards History
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                Track total lifetime rewards earned by custodial wallets
              </p>
            </div>
            <Button 
              onClick={handleRefreshRewards} 
              disabled={refreshingRewards || isVisitorAdmin}
              variant="outline"
            >
              {refreshingRewards ? (
                <>
                  <Spinner className="mr-2" />
                  Refreshing...
                </>
              ) : (
                "Refresh All"
              )}
            </Button>
          </div>

          {rewardsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner />
            </div>
          ) : rewardsData ? (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-sm text-gray-400 mb-1">Total Rewards Earned</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {(parseFloat(rewardsData.total) / 1_000_000).toLocaleString("en-US", { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })} CORE
                  </p>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <p className="text-sm text-gray-400 mb-1">Custodial Wallets</p>
                  <p className="text-3xl font-bold text-[#25d695] dark:text-[#25d695]">
                    {rewardsData.walletCount}
                  </p>
                </div>
              </div>

              {/* Wallet List */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">
                  Rewards by Wallet
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {rewardsData.wallets.map((wallet, index) => {
                    const rewardsCore = parseFloat(wallet.rewards) / 1_000_000;
                    return (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-white">
                            {wallet.label || "Unlabeled Wallet"}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                            {wallet.address.slice(0, 16)}...{wallet.address.slice(-8)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600 dark:text-green-400">
                            {rewardsCore.toLocaleString("en-US", { 
                              minimumFractionDigits: 2, 
                              maximumFractionDigits: 2 
                            })} CORE
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No rewards data available
            </div>
          )}
        </Card>

        {/* User Management Card */}
        <Card className="p-6 mb-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">
              User Management
            </h2>
            <p className="text-sm text-gray-400">
              Query, manage users, and grant Shield member access
            </p>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="mb-6">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Search by email or wallet address..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="flex-1"
              />
              <Button type="submit" disabled={usersLoading || isVisitorAdmin}>
                {usersLoading ? <Spinner className="mr-2" /> : null}
                Search
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => { setSearchTerm(""); loadUsers(); }}
                disabled={usersLoading || isVisitorAdmin}
              >
                Clear
              </Button>
            </div>
          </form>

          {/* Users List */}
          {usersLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner />
            </div>
          ) : users.length > 0 ? (
            <div className="space-y-3">
              <div className="text-sm text-gray-400 mb-3">
                Found {users.length} user{users.length !== 1 ? "s" : ""}
              </div>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {users.map((user) => (
                  <div
                    key={user.user_id}
                    className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-white">
                            {user.email || "No Email"}
                          </p>
                          {user.active_wallet_count > 0 && (
                            <span className="px-2 py-0.5 text-xs bg-[#25d695] text-gray-900 rounded-full">
                              {user.active_wallet_count} wallet{user.active_wallet_count !== 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          User ID: {user.user_id}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Created: {new Date(user.created_at).toLocaleDateString()}
                        </p>
                        
                        {/* Show first wallet if exists */}
                        {user.wallets && user.wallets.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                              {user.wallets[0].address.slice(0, 20)}...{user.wallets[0].address.slice(-8)}
                              {user.wallets[0].label && ` (${user.wallets[0].label})`}
                            </p>
                            {user.wallets.length > 1 && (
                              <p className="text-xs text-gray-400 mt-1">
                                +{user.wallets.length - 1} more wallet{user.wallets.length - 1 !== 1 ? "s" : ""}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => viewUserDetails(user)}
                          disabled={isVisitorAdmin}
                        >
                          Details
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleGrantShieldAccess(user.user_id)}
                          disabled={actionLoading || isVisitorAdmin}
                          className="bg-[#25d695] hover:bg-[#1fc182] text-gray-900"
                        >
                          Grant Shield
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No users found. Try a different search term.
            </div>
          )}
        </Card>

        {/* User Details Modal */}
        {showUserDetails && selectedUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">User Details</h2>
                  <Button
                    variant="outline"
                    onClick={() => setShowUserDetails(false)}
                  >
                    Close
                  </Button>
                </div>

                {/* User Info */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-3">User Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Email:</span>
                      <span className="text-white font-mono">{selectedUser.email || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">User ID:</span>
                      <span className="text-white font-mono text-xs">{selectedUser.user_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Created:</span>
                      <span className="text-white">{new Date(selectedUser.created_at).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Wallets:</span>
                      <span className="text-white">{selectedUser.wallet_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Active Wallets:</span>
                      <span className="text-white">{selectedUser.active_wallet_count}</span>
                    </div>
                  </div>
                </div>

                {/* Wallets */}
                {selectedUser.wallets && selectedUser.wallets.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-3">Wallets</h3>
                    <div className="space-y-2">
                      {selectedUser.wallets.map((wallet) => (
                        <div
                          key={wallet.id}
                          className={`p-3 rounded-lg ${
                            wallet.deleted_at
                              ? "bg-red-50 dark:bg-red-900/20"
                              : "bg-gray-50 dark:bg-gray-800"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-medium text-white">
                              {wallet.label || "Unlabeled"}
                            </p>
                            {wallet.deleted_at && (
                              <span className="px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
                                Deleted
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-mono break-all">
                            {wallet.address}
                          </p>
                          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Added: {new Date(wallet.created_at).toLocaleDateString()}
                            {wallet.deleted_at && (
                              <> • Deleted: {new Date(wallet.deleted_at).toLocaleDateString()}</>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    onClick={() => handleGrantShieldAccess(selectedUser.user_id)}
                    disabled={actionLoading || isVisitorAdmin}
                    className="flex-1 bg-[#25d695] hover:bg-[#1fc182] text-gray-900"
                  >
                    {actionLoading ? <Spinner className="mr-2" /> : null}
                    Grant Shield Access
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleRevokeShieldAccess(selectedUser.user_id)}
                    disabled={actionLoading || isVisitorAdmin}
                    className="flex-1"
                  >
                    Revoke Shield Access
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDeleteUser(selectedUser.user_id)}
                    disabled={actionLoading || isVisitorAdmin}
                    className="flex-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    Delete User Wallets
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Info Card */}
        <Card className="p-6 bg-blue-50 dark:bg-blue-900/20">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
            About Admin Dashboard
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• Shield NFT settings control the placeholder displayed to private members</li>
            <li>• User management allows you to search, view, and manage all users</li>
            <li>• Grant Shield access to give users private member privileges</li>
            <li>• Soft delete marks wallets as deleted without removing data</li>
          </ul>
        </Card>
      </div>
    </main>
  );
}
