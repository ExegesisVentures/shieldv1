"use client";

import { Button } from "@/components/ui/button";
import { useFormStatus } from "react-dom";

interface AuthSubmitButtonProps {
  label?: string;
  pendingLabel?: string;
}

export default function AuthSubmitButton({ label = "Sign in", pendingLabel = "Signing in..." }: AuthSubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" aria-disabled={pending}>
      {pending ? pendingLabel : label}
    </Button>
  );
}
