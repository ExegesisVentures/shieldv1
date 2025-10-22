"use client";

import { useState, useEffect } from "react";
import { IoMenu, IoClose, IoWallet, IoPerson, IoSettings, IoLogOut, IoLogIn, IoShieldCheckmark as ShieldIcon, IoGitBranch } from "react-icons/io5";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOutAction } from "@/app/actions";
import { createSupabaseClient } from "@/utils/supabase/client";
import { isUserAdmin, isAdminWallet } from "@/utils/admin";
import SignInModal from "@/components/auth/SignInModal";
import { ProposalsButtonMobile } from "@/components/proposals-button";

interface MobileMenuProps {
  isAuthenticated: boolean;
}

export default function MobileMenu({ isAuthenticated }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [hasVisitorWallets, setHasVisitorWallets] = useState(false);
  const [walletCount, setWalletCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    // Check admin status and visitor wallets
    async function checkStatus() {
      try {
        if (isAuthenticated) {
          const supabase = createSupabaseClient();
          const adminStatus = await isUserAdmin(supabase);
          setIsAdmin(adminStatus);
        } else {
          // Check visitor wallets
          const visitorAddresses = JSON.parse(localStorage.getItem('visitor_addresses') || '[]');
          setHasVisitorWallets(visitorAddresses.length > 0);
          setWalletCount(visitorAddresses.length);
          
          // Check if any visitor wallet is admin
          const hasAdminWallet = visitorAddresses.some((w: { address: string }) => 
            isAdminWallet(w.address)
          );
          setIsAdmin(hasAdminWallet);
        }
      } catch (error) {
        console.error("Error checking status:", error);
      }
    }
    
    checkStatus();

    // Listen for changes in visitor wallets
    const handleStorageChange = () => {
      const visitorAddresses = JSON.parse(localStorage.getItem('visitor_addresses') || '[]');
      setHasVisitorWallets(visitorAddresses.length > 0);
      setWalletCount(visitorAddresses.length);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [isAuthenticated]);

  const handleSignOut = async () => {
    await signOutAction();
    setIsOpen(false);
  };

  const handleDisconnectAll = () => {
    if (confirm(`Disconnect all ${walletCount} wallet${walletCount !== 1 ? 's' : ''}?`)) {
      localStorage.removeItem('visitor_addresses');
      window.dispatchEvent(new Event('storage'));
      setIsOpen(false);
      window.location.reload();
    }
  };

  const handleSignInSuccess = () => {
    setShowSignInModal(false);
    setIsOpen(false);
    router.push("/dashboard");
  };

  return (
    <>
      {/* Hamburger Button - Mobile Only */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        type="button"
        className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Toggle menu"
      >
        {isOpen ? (
          <IoClose className="w-6 h-6 text-gray-700 dark:text-gray-300" />
        ) : (
          <IoMenu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
        )}
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-[60]"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsOpen(false);
            }}
          />
          
          {/* Menu Panel */}
          <div className="fixed top-16 right-0 w-80 max-w-[90vw] h-[calc(100vh-4rem)] bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 z-[70] overflow-y-auto">
            <div className="p-4 space-y-2">
              {/* User Status Section */}
              {isAuthenticated || hasVisitorWallets ? (
                <div className="pb-3 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3 px-3 py-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                      {hasVisitorWallets && !isAuthenticated ? (
                        <IoWallet className="w-5 h-5 text-white" />
                      ) : (
                        <IoPerson className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {hasVisitorWallets && !isAuthenticated
                          ? `${walletCount} Wallet${walletCount !== 1 ? 's' : ''}`
                          : 'Authenticated'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {hasVisitorWallets && !isAuthenticated
                          ? 'Guest Mode'
                          : 'Signed In'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Navigation Links */}
              {isAuthenticated ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <IoWallet className="w-5 h-5 text-gray-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Portfolio</span>
                  </Link>
                  <Link
                    href="/wallets"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <IoWallet className="w-5 h-5 text-gray-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Wallets</span>
                  </Link>
                  <Link
                    href="/liquidity"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <IoWallet className="w-5 h-5 text-gray-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Liquidity</span>
                  </Link>
                  <ProposalsButtonMobile onClick={() => setIsOpen(false)} />
                  <Link
                    href="/membership"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <IoWallet className="w-5 h-5 text-gray-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Membership</span>
                  </Link>
                </>
              ) : hasVisitorWallets ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <IoWallet className="w-5 h-5 text-gray-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Portfolio</span>
                  </Link>
                  <Link
                    href="/liquidity"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <IoWallet className="w-5 h-5 text-gray-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Liquidity</span>
                  </Link>
                  <ProposalsButtonMobile onClick={() => setIsOpen(false)} />
                  <Link
                    href="/membership"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <IoWallet className="w-5 h-5 text-gray-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Membership</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/#features"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <IoWallet className="w-5 h-5 text-gray-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Features</span>
                  </Link>
                  <Link
                    href="/liquidity"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <IoWallet className="w-5 h-5 text-gray-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Liquidity</span>
                  </Link>
                  <ProposalsButtonMobile onClick={() => setIsOpen(false)} />
                  <Link
                    href="/membership"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <IoWallet className="w-5 h-5 text-gray-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Membership</span>
                  </Link>
                </>
              )}

              {/* Admin Link */}
              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                >
                  <ShieldIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm text-purple-600 dark:text-purple-400 font-medium">Admin</span>
                </Link>
              )}

              {/* Settings Link */}
              {(isAuthenticated || hasVisitorWallets) && (
                <Link
                  href="/settings"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <IoSettings className="w-5 h-5 text-gray-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Settings</span>
                </Link>
              )}

              {/* Divider */}
              {(isAuthenticated || hasVisitorWallets) && (
                <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
              )}

              {/* Authentication Actions */}
              {!isAuthenticated && !hasVisitorWallets ? (
                <>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      setShowSignInModal(true);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors text-purple-600 dark:text-purple-400"
                  >
                    <IoLogIn className="w-5 h-5" />
                    <span className="text-sm font-medium">Sign In</span>
                  </button>
                  <Link
                    href="/dashboard"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <IoWallet className="w-5 h-5 text-gray-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Continue as Guest</span>
                  </Link>
                </>
              ) : hasVisitorWallets && !isAuthenticated ? (
                <>
                  <Link
                    href="/sign-up"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors text-purple-600 dark:text-purple-400"
                  >
                    <IoPerson className="w-5 h-5" />
                    <span className="text-sm font-medium">Save & Sign Up</span>
                  </Link>
                  <button
                    onClick={handleDisconnectAll}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors text-orange-600 dark:text-orange-400"
                  >
                    <IoClose className="w-5 h-5" />
                    <span className="text-sm">Disconnect All Wallets</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600 dark:text-red-400"
                >
                  <IoLogOut className="w-5 h-5" />
                  <span className="text-sm font-medium">Sign Out</span>
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* Sign In Modal */}
      <SignInModal
        isOpen={showSignInModal}
        onClose={() => setShowSignInModal(false)}
        onSuccess={handleSignInSuccess}
      />
    </>
  );
}

