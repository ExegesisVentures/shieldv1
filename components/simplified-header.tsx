import Link from "next/link";
import Image from "next/image";
import { createSupabaseClient } from "@/utils/supabase/server";
import SimplifiedHeaderUserMenu from "@/components/simplified-header-user-menu";
import ProposalsButton from "@/components/proposals-button";
import MobileMenu from "@/components/mobile-menu";
import { IoLogoGithub } from "react-icons/io5";

export default async function SimplifiedHeader() {
  const client = await createSupabaseClient();
  
  let user = null;
  try {
    const {
      data: { user: authUser },
      error: userError
    } = await client.auth.getUser();
    
    if (userError) {
      // Check if it's a session missing error - this is normal for unauthenticated users
      if (userError.message?.includes('Auth session missing') || userError.message?.includes('session_not_found')) {
        // This is expected for unauthenticated users, don't log as warning
        user = null;
      } else {
        console.warn("Failed to get user from Supabase:", userError);
        // Try to refresh session only for other types of errors
        try {
          const { data: { session }, error: refreshError } = await client.auth.refreshSession();
          if (!refreshError && session?.user) {
            user = session.user;
          }
        } catch (refreshError) {
          console.warn("Session refresh failed:", refreshError);
        }
      }
    } else {
      user = authUser;
    }
  } catch (error) {
    // Only log as warning if it's not a session missing error
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (!errorMessage.includes('Auth session missing') && !errorMessage.includes('session_not_found')) {
      console.warn("Failed to get user from Supabase:", error);
    }
    // Continue with user = null
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-800 bg-gray-900/95 backdrop-blur-sm">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-[88rem] mx-auto overflow-visible">
        {/* Logo & Brand with Social Icons - matching coreumdash style */}
        <div className="flex items-center gap-1.5">
          {/* Logo */}
          <Link href="/" className="hover:opacity-80 transition-opacity flex-shrink-0">
            <Image
              src="/tokens/shld_dark.svg"
              alt="ShieldNest Logo"
              width={33}
              height={33}
              className="object-contain w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-12 lg:h-12"
              priority
            />
          </Link>
          
          {/* Brand Name & Social Icons */}
          <div className="flex flex-col">
            <Link href="/" className="hover:opacity-80 transition-opacity">
              <h1 className="font-bold text-lg text-white">
                ShieldNEST
              </h1>
            </Link>
            
            {/* Social Icons underneath the text */}
            <div className="flex items-center gap-1.5 mt-0.5">
              <a
                href="https://github.com/ShieldNEST-org"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity group"
                aria-label="GitHub"
              >
                <IoLogoGithub className="w-4 h-4 text-[#A855F7] group-hover:text-[#25d695] transition-colors" />
              </a>
              <a
                href="https://x.com/shieldnest_org"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity group"
                aria-label="X (Twitter)"
              >
                <svg className="w-4 h-4 text-[#A855F7] group-hover:text-[#25d695] transition-colors" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Navigation Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-3 lg:gap-4 xl:gap-6 text-xs lg:text-sm">
          <Link 
            href="/dashboard" 
            className="font-medium text-gray-300 hover:text-[#25d695] transition-colors whitespace-nowrap"
          >
            Portfolio
          </Link>
          <Link 
            href="/analytics" 
            className="font-medium text-gray-300 hover:text-[#25d695] transition-colors whitespace-nowrap"
          >
            Analytics
          </Link>
          <Link 
            href="/restake-calculator" 
            className="font-medium text-gray-300 hover:text-[#25d695] transition-colors whitespace-nowrap"
          >
            Calculator
          </Link>
          <Link 
            href="/liquidity" 
            className="font-medium text-gray-300 hover:text-[#25d695] transition-colors whitespace-nowrap"
          >
            Liquidity
          </Link>
          <ProposalsButton className="font-medium text-gray-300 hover:text-[#25d695] transition-colors whitespace-nowrap" />
          <Link 
            href="/membership" 
            className="font-medium text-gray-300 hover:text-[#25d695] transition-colors whitespace-nowrap"
          >
            Membership
          </Link>
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center gap-3">
          <MobileMenu isAuthenticated={!!user} />
          <SimplifiedHeaderUserMenu user={user} />
        </div>
      </div>
    </header>
  );
}
