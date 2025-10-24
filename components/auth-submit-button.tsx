"use client";

import { useFormStatus } from "react-dom";
import { IoArrowForward } from "react-icons/io5";

interface AuthSubmitButtonProps {
  label?: string;
  pendingLabel?: string;
}

export default function AuthSubmitButton({ label = "Sign in", pendingLabel = "Signing in..." }: AuthSubmitButtonProps) {
  const { pending } = useFormStatus();
  
  return (
    <button 
      type="submit" 
      disabled={pending}
      className="w-full btn-coreum-green h-12 text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? (
        <>
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span>{pendingLabel}</span>
        </>
      ) : (
        <>
          <span>{label}</span>
          <IoArrowForward className="w-4 h-4" />
        </>
      )}
    </button>
  );
}
