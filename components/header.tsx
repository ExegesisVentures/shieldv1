import Link from "next/link";
import { createSupabaseClient } from "@/utils/supabase/server";
import HeaderUserMenu from "@/components/header-user-menu";
import HeaderClientWrapper from "@/components/header-client-wrapper";
import ShieldNestLogo from "@/components/shieldnest-logo";
import ThemeToggle from "@/components/theme-toggle";
import MobileMenu from "@/components/mobile-menu";
import ProposalsButton from "@/components/proposals-button";

export default async function Header() {
  const client = await createSupabaseClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Logo & Brand */}
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <ShieldNestLogo width={32} height={32} showText={true} />
        </Link>

        {/* Navigation Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-6">
          {user ? (
            <>
              <Link 
                href="/dashboard" 
                className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              >
                Portfolio
              </Link>
              <Link 
                href="/wallets" 
                className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              >
                Wallets
              </Link>
              <Link 
                href="/liquidity" 
                className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              >
                Liquidity
              </Link>
              <ProposalsButton className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors" />
              <Link 
                href="/membership" 
                className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              >
                Membership
              </Link>
            </>
          ) : (
            <>
              <Link 
                href="/#features" 
                className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              >
                Features
              </Link>
              <Link 
                href="/liquidity" 
                className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              >
                Liquidity
              </Link>
              <ProposalsButton className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors" />
              <Link 
                href="/membership" 
                className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              >
                Membership
              </Link>
            </>
          )}
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center gap-3">
          {/* Mobile Menu (visible on mobile only) */}
          <MobileMenu isAuthenticated={!!user} />
          
          <ThemeToggle />
          
          {/* User Menu (always visible, responsive design handled in components) */}
          {user ? (
            <HeaderUserMenu user={user} />
          ) : (
            <HeaderClientWrapper hasAuthUser={false} />
          )}
        </div>
      </div>
    </header>
  );
}
