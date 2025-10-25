"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { IoWallet as WalletIcon, IoMenu, IoSettings, IoLogOut, IoShieldCheckmark as ShieldIcon, IoPerson, IoClose, IoMoon, IoSunny, IoNotifications } from "react-icons/io5";
import Link from "next/link";
import { signOutAction } from "@/app/actions";
import { createSupabaseClient } from "@/utils/supabase/client";
import { isUserAdmin, isAdminWallet } from "@/utils/admin";
import WalletConnectModal from "@/components/wallet/WalletConnectModal";
import { useTheme } from "next-themes";
import { useNotifications } from "@/contexts/NotificationContext";

interface SimplifiedHeaderUserMenuProps {
  user?: {
    id: string;
    email?: string;
  } | null;
}

export default function SimplifiedHeaderUserMenu({ user }: SimplifiedHeaderUserMenuProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { unreadCount } = useNotifications();
  const [mounted, setMounted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isVisitor, setIsVisitor] = useState(false);
  const [walletCount, setWalletCount] = useState(0);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Prevent hydration mismatch for theme
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Check if visitor has wallets and admin status
    async function checkStatus() {
      try {
        if (!user) {
          // Check visitor wallets
          const visitorAddresses = JSON.parse(localStorage.getItem('visitor_addresses') || '[]');
          setIsVisitor(visitorAddresses.length > 0);
          setWalletCount(visitorAddresses.length);
          
          // Check if any visitor wallet is admin
          const hasAdminWallet = visitorAddresses.some((w: { address: string }) => 
            isAdminWallet(w.address)
          );
          setIsAdmin(hasAdminWallet);
        } else {
          // Check authenticated user admin status
          const supabase = createSupabaseClient();
          const adminStatus = await isUserAdmin(supabase);
          setIsAdmin(adminStatus);
          
          // Load profile image for authenticated users
          const { data } = await supabase
            .from("user_profiles")
            .select(`
              public_users:public_user_id (
                profile_image_url
              )
            `)
            .eq("auth_user_id", user.id)
            .single();
          
          const publicUsers = data?.public_users as { profile_image_url?: string } | null;
          if (publicUsers?.profile_image_url) {
            setProfileImage(publicUsers.profile_image_url);
          }
        }
      } catch (error) {
        console.error("Error checking status:", error);
      }
    }
    
    checkStatus();

    // Listen for wallet changes
    const handleStorageChange = () => {
      checkStatus();
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [user]);

  const handleSignOut = async () => {
    await signOutAction();
  };

  const handleDisconnectAll = () => {
    if (confirm(`Disconnect all ${walletCount} wallet${walletCount !== 1 ? 's' : ''}?`)) {
      localStorage.removeItem('visitor_addresses');
      window.dispatchEvent(new Event('storage'));
      window.location.reload();
    }
  };

  return (
    <div 
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Wallet Button - CoreumDash Style */}
      <button
        type="button"
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-800/50 transition-colors"
        aria-label="Open wallet menu"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#a855f7] to-[#7c3aed] flex items-center justify-center shadow-lg overflow-hidden">
          {profileImage ? (
            <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <WalletIcon className="w-4 h-4 text-white" />
          )}
        </div>
        <IoMenu className="w-5 h-5 text-gray-300" />
      </button>

      {/* Hover Dropdown Menu */}
      {isHovered && (
        <div className="absolute right-0 top-full pt-2 w-56 z-[9999]">
          <div className="bg-gray-800 rounded-xl shadow-xl border border-gray-700 overflow-hidden">
          {/* User Info Section */}
          {(user || isVisitor) && (
            <div className="p-3 border-b border-gray-700 bg-gray-800/50">
              <p className="text-sm font-medium text-white truncate">
                {isVisitor && !user 
                  ? `${walletCount} Wallet${walletCount !== 1 ? 's' : ''} Connected` 
                  : (user?.email || 'Wallet User')}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {isVisitor && !user ? 'Guest Mode' : 'Authenticated'}
              </p>
            </div>
          )}

          {/* Menu Items */}
          <div className="p-2">
            {/* Sign In / Sign Out - TOP */}
            {isVisitor && !user ? (
              <>
                {/* Sign In for guests */}
                <Link
                  href="/sign-in"
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-purple-900/20 transition-colors text-purple-400 hover:text-purple-300"
                >
                  <IoPerson className="w-4 h-4" />
                  <span className="text-sm">Sign In</span>
                </Link>
                
                {/* Save & Sign Up for guests */}
                <Link
                  href="/sign-up"
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-purple-900/20 transition-colors text-purple-400 hover:text-purple-300"
                >
                  <IoPerson className="w-4 h-4" />
                  <span className="text-sm">Sign Up</span>
                </Link>
              </>
            ) : user ? (
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-900/20 transition-colors text-red-400 hover:text-red-300"
              >
                <IoLogOut className="w-4 h-4" />
                <span className="text-sm">Sign Out</span>
              </button>
            ) : (
              /* Sign In for non-authenticated users */
              <Link
                href="/sign-in"
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-purple-900/20 transition-colors text-purple-400 hover:text-purple-300"
              >
                <IoPerson className="w-4 h-4" />
                <span className="text-sm">Sign In</span>
              </Link>
            )}

            {/* Portfolio Link - SECOND */}
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors text-gray-300 hover:text-white"
            >
              <WalletIcon className="w-4 h-4" />
              <span className="text-sm">Portfolio</span>
            </Link>

            {/* Notifications Link - NEW */}
            {(user || isVisitor) && (
              <Link
                href="/notifications"
                className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors text-gray-300 hover:text-white relative"
              >
                <div className="flex items-center gap-3">
                  <IoNotifications className="w-4 h-4" />
                  <span className="text-sm">Notifications</span>
                </div>
                {unreadCount > 0 && (
                  <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[#25d695] text-white text-xs font-bold">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
            )}

            {/* Settings Link - THIRD */}
            <Link
              href="/settings"
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors text-gray-300 hover:text-white"
            >
              <IoSettings className="w-4 h-4" />
              <span className="text-sm">Settings</span>
            </Link>

            {/* Theme Toggle - FOURTH */}
            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors text-gray-300 hover:text-white"
              >
                {theme === "dark" ? (
                  <>
                    <IoSunny className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm">Light Mode</span>
                  </>
                ) : (
                  <>
                    <IoMoon className="w-4 h-4 text-blue-400" />
                    <span className="text-sm">Dark Mode</span>
                  </>
                )}
              </button>
            )}

            {/* Admin Link */}
            {isAdmin && (
              <Link
                href="/admin"
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-purple-900/20 transition-colors text-purple-400 hover:text-purple-300"
              >
                <ShieldIcon className="w-4 h-4" />
                <span className="text-sm font-medium">Admin</span>
              </Link>
            )}

            {/* Disconnect All Wallets (for visitors) */}
            {isVisitor && !user && (
              <button
                onClick={handleDisconnectAll}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-orange-900/20 transition-colors text-orange-400 hover:text-orange-300"
              >
                <IoClose className="w-4 h-4" />
                <span className="text-sm">Disconnect All Wallets</span>
              </button>
            )}

            {/* Connect Wallet - BOTTOM with color changes */}
            {!user && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowConnectModal(true);
                  setIsHovered(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isVisitor 
                    ? 'hover:bg-green-900/20 text-green-400 hover:text-green-300' // Green when connected
                    : 'hover:bg-teal-900/20 text-teal-400 hover:text-teal-300' // Teal when not connected
                }`}
              >
                <WalletIcon className="w-4 h-4" />
                <span className="text-sm">Connect Wallet</span>
              </button>
            )}
          </div>
        </div>
        </div>
      )}

      {/* Wallet Connect Modal */}
      <WalletConnectModal
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        onSuccess={() => {
          setShowConnectModal(false);
          router.push('/dashboard');
        }}
      />
    </div>
  );
}
