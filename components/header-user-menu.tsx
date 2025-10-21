"use client";

import { useState, useEffect, useRef } from "react";
import { IoPerson, IoSettings, IoLogOut, IoChevronDown, IoShieldCheckmark as ShieldIcon, IoWallet as WalletIcon, IoClose } from "react-icons/io5";
import Link from "next/link";
import { signOutAction } from "@/app/actions";
import { createSupabaseClient } from "@/utils/supabase/client";
import { isUserAdmin, isAdminWallet } from "@/utils/admin";

interface HeaderUserMenuProps {
  user: {
    id: string;
    email?: string;
  };
  isVisitor?: boolean;
  walletCount?: number;
}

export default function HeaderUserMenu({ user, isVisitor = false, walletCount = 0 }: HeaderUserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check admin status on mount
    async function checkAdmin() {
      try {
        if (isVisitor) {
          // For visitors, check if any of their localStorage wallets are admin wallets
          const visitorAddresses = JSON.parse(localStorage.getItem('visitor_addresses') || '[]');
          const hasAdminWallet = visitorAddresses.some((w: { address: string }) => 
            isAdminWallet(w.address)
          );
          setIsAdmin(hasAdminWallet);
        } else {
          // For authenticated users, use the full admin check
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
        console.error("Error checking admin status:", error);
      }
    }
    
    checkAdmin();
  }, [isVisitor]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  const handleSignOut = async () => {
    await signOutAction();
  };

  const handleDisconnectAll = () => {
    if (confirm(`Disconnect all ${walletCount} wallet${walletCount !== 1 ? 's' : ''}?`)) {
      localStorage.removeItem('visitor_addresses');
      window.dispatchEvent(new Event('storage'));
      setIsOpen(false);
      window.location.reload(); // Reload to update UI
    }
  };

  return (
    <div className="relative hidden md:block" ref={menuRef}>
      {/* IoPerson Button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        type="button"
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center overflow-hidden">
          {profileImage ? (
            <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
          ) : isVisitor ? (
            <WalletIcon className="w-4 h-4 text-white" />
          ) : (
            <IoPerson className="w-4 h-4 text-white" />
          )}
        </div>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:inline-block">
          {isVisitor ? 'Connected' : (user.email ? user.email.split('@')[0] : 'IoPerson')}
        </span>
        <IoChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop - Click to close */}
          <div
            className="fixed inset-0 z-[9998]"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsOpen(false);
            }}
          />
          
          {/* Menu Dropdown */}
          <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-[9999]">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {isVisitor ? `${walletCount} Wallet${walletCount !== 1 ? 's' : ''} Connected` : (user.email || 'Wallet IoPerson')}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {isVisitor ? 'Sign up to save your data' : (user.email ? 'Public IoPerson' : 'Wallet-Only')}
            </p>
          </div>

          <div className="p-2">
            {/* Dashboard/Portfolio Link */}
            <Link
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <WalletIcon className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Portfolio</span>
            </Link>

            {/* Admin Link (show if admin, for both visitors and authenticated users) */}
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
              >
                <ShieldIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="text-sm text-purple-600 dark:text-purple-400 font-medium">Admin</span>
              </Link>
            )}

            {/* Settings Link (available for everyone with wallets) */}
            <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <IoSettings className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Settings</span>
            </Link>

            {/* Disconnect All Wallets (for visitors) */}
            {isVisitor && (
              <button
                onClick={handleDisconnectAll}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors text-orange-600 dark:text-orange-400"
              >
                <IoClose className="w-4 h-4" />
                <span className="text-sm">Disconnect All Wallets</span>
              </button>
            )}

            {/* Sign Out / Sign Up */}
            {isVisitor ? (
              <Link
                href="/sign-up"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors text-purple-600 dark:text-purple-400"
              >
                <IoPerson className="w-4 h-4" />
                <span className="text-sm">Save & Sign Up</span>
              </Link>
            ) : (
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600 dark:text-red-400"
              >
                <IoLogOut className="w-4 h-4" />
                <span className="text-sm">Sign Out</span>
              </button>
            )}
          </div>
        </div>
        </>
      )}
    </div>
  );
}

