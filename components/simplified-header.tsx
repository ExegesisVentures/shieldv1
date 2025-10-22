import Link from "next/link";
import Image from "next/image";
import { createSupabaseClient } from "@/utils/supabase/server";
import SimplifiedHeaderUserMenu from "@/components/simplified-header-user-menu";
import ThemeToggle from "@/components/theme-toggle";
import ProposalsButton from "@/components/proposals-button";
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
      <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-visible">
        {/* Logo & Brand with Social Icons - matching coreumdash style */}
        <div className="flex items-center gap-3">
          {/* Logo */}
          <Link href="/" className="hover:opacity-80 transition-opacity flex-shrink-0">
            <Image
              src="/tokens/shld_dark.svg"
              alt="ShieldNest Logo"
              width={40}
              height={40}
              className="object-contain w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 lg:w-14 lg:h-14"
              priority
            />
          </Link>
          
          {/* Brand Name & Social Icons */}
          <div className="flex flex-col">
            <Link href="/" className="hover:opacity-80 transition-opacity">
              <h1 className="font-bold text-2xl text-white">
                ShieldNEST
              </h1>
            </Link>
            
            {/* Social Icons underneath the text */}
            <div className="flex items-center gap-2 mt-1">
              <a
                href="https://github.com/shieldnest"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity"
                aria-label="GitHub"
              >
                <IoLogoGithub className="w-5 h-5 text-[#A855F7]" />
              </a>
              <a
                href="https://twitter.com/shieldnest"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity"
                aria-label="X (Twitter)"
              >
                <svg className="w-5 h-5 text-[#A855F7]" viewBox="0 0 24 24" fill="currentColor">
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
            href="/wallets" 
            className="font-medium text-gray-300 hover:text-[#25d695] transition-colors whitespace-nowrap"
          >
            Wallets
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
          <ThemeToggle />
          <SimplifiedHeaderUserMenu user={user} />
        </div>
      </div>
    </header>
  );
}
