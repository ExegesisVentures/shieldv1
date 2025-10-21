"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IoWallet } from "react-icons/io5";
import { Button } from "@/components/ui/button";
import WalletConnectModal from "@/components/wallet/WalletConnectModal";

export default function HeaderSignInButton() {
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  const handleSuccess = () => {
    setShowModal(false);
    router.push("/dashboard");
  };

  return (
    <>
      <Button size="sm" onClick={() => setShowModal(true)}>
        <IoWallet className="w-4 h-4 mr-2" />
        Sign In
      </Button>

      <WalletConnectModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleSuccess}
      />
    </>
  );
}

