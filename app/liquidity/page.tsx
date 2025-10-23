import { IoWater, IoTrendingUp, IoLockClosed, IoInformationCircle } from "react-icons/io5";
import PoolsTable from "@/components/liquidity/PoolsTable";
import AdminPoolCreator from "@/components/liquidity/AdminPoolCreator";
import { Card } from "@/components/ui/card";

export default function LiquidityPage() {
  return (
    <main className="p-6 max-w-7xl mx-auto neo-gradient-bg min-h-screen">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-4 mb-3">
          {/* Improved icon with 3D effect and reduced glow */}
          <div className="relative p-4 rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl blur-lg opacity-40" />
            <IoWater className="relative w-8 h-8 text-white drop-shadow-lg" />
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-green-400 drop-shadow-lg">
            Liquidity Pools
          </h1>
        </div>
        <p className="text-xl text-gray-300 font-medium">
          Track liquidity pools on Coreum DEXs (view-only in v1)
        </p>
      </div>

      {/* Status Banner */}
      <Card variant="glass" className="p-6 mb-8 bg-gradient-to-r from-blue-900/30 via-purple-900/30 to-blue-900/30 border-2 border-blue-500/30">
        <div className="flex items-start gap-4">
          <div className="relative p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex-shrink-0 shadow-lg">
            <div className="absolute inset-0 bg-blue-400 rounded-xl blur-md opacity-30" />
            <IoInformationCircle className="relative w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-xl text-white mb-2">
              Live Pool Data
            </h3>
            <p className="text-gray-300 text-base">
              View real-time liquidity pool statistics from Coreum DEX. 
              Trading and liquidity provision features coming soon!
            </p>
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {/* Total TVL */}
        <Card variant="neo-blue" className="relative p-8 group cursor-pointer hover:scale-105 transition-transform duration-300 bg-gradient-to-br from-blue-900/50 via-blue-800/40 to-purple-900/50 border-2 border-blue-500/30 hover:border-blue-400/60 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <span className="text-base font-semibold text-gray-300">Total TVL</span>
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg">
                <IoWater className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-4xl font-extrabold text-white mb-2">
              $4.5M
            </div>
            <div className="text-sm text-green-400 flex items-center gap-1 font-medium">
              <IoTrendingUp className="w-5 h-5" />
              +15.2% this week
            </div>
          </div>
        </Card>

        {/* Average APY */}
        <Card variant="neo-green" className="relative p-8 group cursor-pointer hover:scale-105 transition-transform duration-300 bg-gradient-to-br from-green-900/50 via-emerald-800/40 to-teal-900/50 border-2 border-green-500/30 hover:border-green-400/60 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <span className="text-base font-semibold text-gray-300">Average APY</span>
              <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg">
                <IoTrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-4xl font-extrabold text-white mb-2">
              31.3%
            </div>
            <div className="text-sm text-gray-300 font-medium">
              Across active pools
            </div>
          </div>
        </Card>

        {/* 24h Volume */}
        <Card variant="neo-purple" className="relative p-8 group cursor-pointer hover:scale-105 transition-transform duration-300 bg-gradient-to-br from-purple-900/50 via-pink-800/40 to-purple-900/50 border-2 border-purple-500/30 hover:border-purple-400/60 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <span className="text-base font-semibold text-gray-300">24h Volume</span>
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
                <IoTrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-4xl font-extrabold text-white mb-2">
              $742K
            </div>
            <div className="text-sm text-green-400 flex items-center gap-1 font-medium">
              <IoTrendingUp className="w-5 h-5" />
              +10.7% from yesterday
            </div>
          </div>
        </Card>
      </div>

      {/* Admin Pool Creator */}
      <AdminPoolCreator />

      {/* Pools Table */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-400 to-green-400 mb-6 drop-shadow-lg">
          Available Pools
        </h2>
        <PoolsTable />
      </div>

      {/* IoInformationCircle Card */}
      <Card className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
        <h3 className="font-semibold text-white mb-2">
          About Liquidity Pools
        </h3>
        <p className="text-sm text-gray-400 mb-4">
          Liquidity pools enable decentralized trading on Coreum. By providing liquidity,
          users earn fees from trades that occur in the pool. APY reflects current
          annualized returns based on trading volume and fee structure.
        </p>
        <div className="flex items-start gap-2 text-sm text-gray-400">
          <IoLockClosed className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p>
            Trading features are coming soon. Shield Members will receive priority access
            to advanced DEX features when released.
          </p>
        </div>
      </Card>
    </main>
  );
}

