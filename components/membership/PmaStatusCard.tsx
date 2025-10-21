"use client";

import { IoDocument, IoCheckmarkCircle, IoTime, IoAlertCircle } from "react-icons/io5";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type PmaStatus = "none" | "pending" | "signed";

interface PmaStatusCardProps {
  status: PmaStatus;
  signedDate?: string;
  onSign?: () => void;
}

export default function PmaStatusCard({
  status,
  signedDate,
  onSign,
}: PmaStatusCardProps) {
  const statusConfig = {
    none: {
      icon: IoDocument,
      iconColor: "text-gray-400",
      bgColor: "bg-gray-100 dark:bg-gray-800",
      title: "PMA Not Signed",
      description: "Sign the Private Member Agreement to unlock membership benefits",
      action: "Review & Sign PMA",
    },
    pending: {
      icon: IoTime,
      iconColor: "text-yellow-600",
      bgColor: "bg-yellow-100 dark:bg-yellow-900/20",
      title: "PMA Pending",
      description: "Your PMA signature is being verified on-chain",
      action: null,
    },
    signed: {
      icon: IoCheckmarkCircle,
      iconColor: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/20",
      title: "PMA Signed",
      description: "Your Private Member Agreement is active and verified",
      action: null,
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Card className="p-6">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`p-3 ${config.bgColor} rounded-xl flex-shrink-0`}>
          <Icon className={`w-6 h-6 ${config.iconColor}`} />
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            {config.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {config.description}
          </p>

          {/* Signed Date */}
          {status === "signed" && signedDate && (
            <div className="text-xs text-gray-500 dark:text-gray-500 mb-4">
              Signed on {new Date(signedDate).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          )}

          {/* Actions */}
          {config.action && onSign && (
            <Button onClick={onSign}>
              <IoDocument className="w-4 h-4 mr-2" />
              {config.action}
            </Button>
          )}

          {status === "pending" && (
            <div className="flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-400">
              <div className="w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Verification in progress...</span>
            </div>
          )}

          {status === "signed" && (
            <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
              <IoCheckmarkCircle className="w-4 h-4" />
              <span>Verified on-chain</span>
            </div>
          )}
        </div>
      </div>

      {/* PMA Details for signed status */}
      {status === "signed" && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Status:</span>
              <span className="ml-2 font-medium text-green-600">Active</span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Type:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white">Private Member</span>
            </div>
          </div>
        </div>
      )}

      {/* Warning for none status */}
      {status === "none" && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
            <IoAlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>
              The PMA provides legal protection and is required for Shield Membership.
              Review the agreement carefully before signing.
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}

