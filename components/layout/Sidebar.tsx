"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  IoGridSharp, 
  IoShieldCheckmark, 
  IoWallet, 
  IoWater, 
  IoSettings,
  IoLogOut,
  IoChevronBack,
  IoMenu,
  IoShield,
  IoStatsChart,
  IoCalculator
} from "react-icons/io5";
import { useState } from "react";

interface SidebarProps {
  userType?: "visitor" | "public" | "private";
}

export default function Sidebar({ userType = "public" }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: IoGridSharp,
      forUsers: ["visitor", "public", "private"],
    },
    {
      name: "Analytics",
      href: "/analytics",
      icon: IoStatsChart,
      forUsers: ["visitor", "public", "private"],
    },
    {
      name: "Restake Calculator",
      href: "/restake-calculator",
      icon: IoCalculator,
      forUsers: ["visitor", "public", "private"],
    },
    {
      name: "Membership",
      href: "/membership",
      icon: IoShieldCheckmark,
      forUsers: ["visitor", "public", "private"],
    },
    {
      name: "Liquidity",
      href: "/liquidity",
      icon: IoWater,
      forUsers: ["public", "private"],
    },
    {
      name: "Settings",
      href: "/settings",
      icon: IoSettings,
      forUsers: ["public", "private"],
    },
  ];

  const visibleItems = navItems.filter((item) =>
    item.forUsers.includes(userType)
  );

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + "/");

  return (
    <>
      {/* Mobile IoMenu Button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg"
      >
        <IoMenu className="w-6 h-6 text-gray-900 dark:text-white" />
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 
          transition-all duration-300 z-40
          ${collapsed ? "w-20" : "w-64"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              {!collapsed && (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                    <IoShield className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-bold text-xl text-gray-900 dark:text-white">
                    ShieldNest
                  </span>
                </div>
              )}
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="hidden lg:block p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <IoChevronBack
                  className={`w-5 h-5 text-gray-500 transition-transform ${
                    collapsed ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                    ${
                      active
                        ? "bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }
                  `}
                  title={collapsed ? item.name : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && (
                    <span className="font-medium">{item.name}</span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          {userType !== "visitor" && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-lg transition-colors w-full
                  text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20
                `}
                title={collapsed ? "Sign Out" : undefined}
              >
                <IoLogOut className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="font-medium">Sign Out</span>}
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

