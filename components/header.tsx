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
        <nav className="hidden md:flex items-center gap-3 lg:gap-4 xl:gap-6 text-xs lg:text-sm">
          {user ? (
            <>
              <Link 
                href="/dashboard" 
                className="font-medium text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors whitespace-nowrap"
              >
                Portfolio
              </Link>
              <Link 
                href="/wallets" 
                className="font-medium text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors whitespace-nowrap"
              >
                Wallets
              </Link>
              <Link 
                href="/liquidity" 
                className="font-medium text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors whitespace-nowrap"
              >
                Liquidity
              </Link>
              <ProposalsButton className="font-medium text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors whitespace-nowrap" />
              <Link 
                href="/membership" 
                className="font-medium text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors whitespace-nowrap"
              >
                Membership
              </Link>
            </>
          ) : (
            <>
              <Link 
                href="/#features" 
                className="font-medium text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors whitespace-nowrap"
              >
                Features
              </Link>
              <Link 
                href="/liquidity" 
                className="font-medium text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors whitespace-nowrap"
              >
                Liquidity
              </Link>
              <ProposalsButton className="font-medium text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors whitespace-nowrap" />
              <Link 
                href="/membership" 
                className="font-medium text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors whitespace-nowrap"
              >
                Membership
              </Link>
            </>
          )}
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center gap-3">
          {/* Mobile Menu (visible on tablet and mobile only) */}
          <div className="md:hidden">
            <MobileMenu isAuthenticated={!!user} />
          </div>
          
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
