import Link from "next/link";
import { IoShieldCheckmark, IoLogoTwitter, IoLogoGithub, IoDocument } from "react-icons/io5";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <IoShieldCheckmark className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-xl text-gray-900 dark:text-white">
                ShieldNest
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md">
              The premier portfolio management and membership platform for the Coreum blockchain.
              Track your assets, join exclusive IoShieldCheckmark Membership, and unlock private features.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://x.com/shieldnest_org"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors group"
                aria-label="X (Twitter)"
              >
                <IoLogoTwitter className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-[#25d695] transition-colors" />
              </a>
              <a
                href="https://github.com/ShieldNEST-org"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors group"
                aria-label="GitHub"
              >
                <IoLogoGithub className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-[#25d695] transition-colors" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Product</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/dashboard"
                  className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/membership"
                  className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                >
                  IoShieldCheckmark Membership
                </Link>
              </li>
              <li>
                <Link
                  href="/liquidity"
                  className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                >
                  Liquidity Pools
                </Link>
              </li>
              <li>
                <span className="text-gray-400 dark:text-gray-600 cursor-not-allowed">
                  Trading (Coming Soon)
                </span>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Legal</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/privacy"
                  className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/pma"
                  className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors flex items-center gap-1"
                >
                  <IoDocument className="w-4 h-4" />
                  PMA Agreement
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              © {currentYear} ShieldNest. All rights reserved.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Built on{" "}
              <a
                href="https://www.coreum.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-600 dark:text-purple-400 hover:underline"
              >
                Coreum
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

