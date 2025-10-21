"use client";

import { IoShieldCheckmark, IoOpenOutline, IoBanOutline } from "react-icons/io5";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface ShieldNftPanelProps {
  imageUrl?: string | null;
  valueUsd?: number;
  isOwner?: boolean;
  loading?: boolean;
}

export default function ShieldNftPanel({
  imageUrl = null,
  valueUsd = 5500,
  isOwner = false,
  loading = false,
}: ShieldNftPanelProps) {
  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all">
      {/* NFT Image */}
      <div className="relative h-64 bg-gradient-to-br from-purple-600 via-blue-600 to-purple-800 flex items-center justify-center">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt="Shield NFT"
            fill
            className="object-cover"
          />
        ) : (
          <div className="text-center text-white">
            <IoShieldCheckmark className="w-24 h-24 mx-auto mb-4 opacity-80" />
            <p className="text-sm opacity-75">Shield NFT Placeholder</p>
          </div>
        )}
        {isOwner && (
          <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
            ✓ Owned
          </div>
        )}
      </div>

      {/* NFT Info */}
      <div className="p-6">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Shield NFT
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
          Exclusive membership NFT for ShieldNest Private members
        </p>

        {/* Value */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-4 mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Estimated Value
          </p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            ${valueUsd.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            *Placeholder value for v1
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          {!isOwner ? (
            <>
              <Button className="w-full" size="lg">
                <IoShieldCheckmark className="w-4 h-4 mr-2" />
                Buy Shield NFT
              </Button>
              <p className="text-xs text-center text-gray-500 dark:text-gray-500">
                Live contract integration coming soon
              </p>
            </>
          ) : (
            <>
              <Button variant="outline" className="w-full" size="lg">
                <IoOpenOutline className="w-4 h-4 mr-2" />
                View on Explorer
              </Button>
              <Button
                variant="outline"
                className="w-full opacity-50 cursor-not-allowed"
                disabled
              >
                <IoBanOutline className="w-4 h-4 mr-2" />
                Sell Back (Coming Soon)
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}

