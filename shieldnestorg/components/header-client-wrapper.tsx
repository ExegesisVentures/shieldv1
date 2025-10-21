"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { IoLogIn } from "react-icons/io5";
import SignInModal from "@/components/auth/SignInModal";
import HeaderUserMenu from "@/components/header-user-menu";

interface HeaderClientWrapperProps {
  hasAuthUser: boolean;
}

export default function HeaderClientWrapper({ hasAuthUser }: HeaderClientWrapperProps) {
  const [showModal, setShowModal] = useState(false);
  const [hasVisitorWallets, setHasVisitorWallets] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if visitor has wallets in localStorage
    if (!hasAuthUser) {
      const checkVisitorWallets = () => {
        const visitorAddresses = JSON.parse(localStorage.getItem('visitor_addresses') || '[]');
        setHasVisitorWallets(visitorAddresses.length > 0);
      };

      checkVisitorWallets();

      // Listen for changes
      const handleStorageChange = () => {
        checkVisitorWallets();
      };

      window.addEventListener('storage', handleStorageChange);
      return () => {
        window.removeEventListener('storage', handleStorageChange);
      };
    }
  }, [hasAuthUser]);

  const handleSuccess = () => {
    setShowModal(false);
    router.push("/dashboard");
  };

  // If user is authenticated, this component isn't shown (parent handles it)
  if (hasAuthUser) return null;

  // Visitor with wallets - show connected menu (HeaderUserMenu handles responsive visibility)
  if (hasVisitorWallets) {
    // Get wallet count
    const visitorAddresses = JSON.parse(localStorage.getItem('visitor_addresses') || '[]');
    const walletCount = visitorAddresses.length;
    
    return (
      <HeaderUserMenu 
        user={{ id: 'visitor', email: undefined }} 
        isVisitor={true}
        walletCount={walletCount}
      />
    );
  }

  // Visitor without wallets - show click dropdown with sign-in options
  return (
    <div className="relative hidden md:block">
      <Button 
        size="sm" 
        className="flex items-center gap-2"
        onClick={() => setShowModal(true)}
      >
        <IoLogIn className="w-4 h-4" />
        <span className="hidden sm:inline">Sign In</span>
      </Button>

      <SignInModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleSuccess}
      />
    </div>
  );
}

