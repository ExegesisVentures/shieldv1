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
          <div className="neo-icon-glow-blue p-3 rounded-2xl">
            <IoWater className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white">
            Liquidity Pools
          </h1>
        </div>
        <p className="text-lg text-gray-400">
          Track liquidity pools on Coreum DEXs (view-only in v1)
        </p>
      </div>

      {/* Status Banner */}
      <Card variant="glass" className="p-6 mb-8">
        <div className="flex items-start gap-4">
          <div className="neo-icon-glow-blue p-2 rounded-xl flex-shrink-0">
            <IoInformationCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white mb-2">
              Live Pool Data
            </h3>
            <p className="text-gray-400">
              View real-time liquidity pool statistics from Coreum DEX. 
              Trading and liquidity provision features coming soon!
            </p>
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {/* Total TVL */}
        <Card variant="neo-blue" className="p-8 group cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-400">Total TVL</span>
            <IoWater className="w-5 h-5 text-[#25d695]" />
          </div>
          <div className="text-3xl font-bold text-white mb-2">
            $4.5M
          </div>
          <div className="text-sm text-green-600 dark:text-green-500 flex items-center gap-1">
            <IoTrendingUp className="w-4 h-4" />
            +15.2% this week
          </div>
        </Card>

        {/* Average APY */}
        <Card variant="neo-green" className="p-8 group cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-400">Average APY</span>
            <IoTrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-3xl font-bold text-white mb-2">
            31.3%
          </div>
          <div className="text-sm text-gray-400">
            Across active pools
          </div>
        </Card>

        {/* 24h Volume */}
        <Card variant="neo-purple" className="p-8 group cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-400">24h Volume</span>
            <IoTrendingUp className="w-5 h-5 text-[#25d695]" />
          </div>
          <div className="text-3xl font-bold text-white mb-2">
            $742K
          </div>
          <div className="text-sm text-green-600 dark:text-green-500 flex items-center gap-1">
            <IoTrendingUp className="w-4 h-4" />
            +10.7% from yesterday
          </div>
        </Card>
      </div>

      {/* Admin Pool Creator */}
      <AdminPoolCreator />

      {/* Pools Table */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="neo-icon-glow-green" style={{ minWidth: '48px', minHeight: '48px' }}>
            <IoWater className="w-6 h-6 text-white relative z-10" />
          </div>
          <h2 className="text-3xl font-bold text-white">
            Available Pools
          </h2>
        </div>
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

