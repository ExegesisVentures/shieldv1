"use client";

import { useState, useEffect } from "react";
import { createSupabaseClient } from "@/utils/supabase/client";
import { validateUserSession, validateUserProfile } from "@/utils/auth/session-validator";

interface SessionDebugProps {
  className?: string;
}

export default function SessionDebug({ className = "" }: SessionDebugProps) {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const runDiagnostics = async () => {
      try {
        const supabase = createSupabaseClient();
        
        // Get basic auth info
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        // Validate session
        const sessionValidation = await validateUserSession();
        
        // Validate profile
        const profileValidation = await validateUserProfile();
        
        // Get wallet count
        const { getWalletCount } = await import("@/utils/wallet/simplified-operations");
        const walletCount = await getWalletCount();
        
        setDebugInfo({
          timestamp: new Date().toISOString(),
          user: user ? {
            id: user.id,
            email: user.email,
            created_at: user.created_at
          } : null,
          userError: userError?.message,
          session: session ? {
            access_token: session.access_token ? "present" : "missing",
            refresh_token: session.refresh_token ? "present" : "missing",
            expires_at: session.expires_at
          } : null,
          sessionError: sessionError?.message,
          sessionValidation,
          profileValidation,
          walletCount,
          localStorage: {
            anonymous_wallets: localStorage.getItem('anonymous_wallets') ? "present" : "missing",
            visitor_addresses: localStorage.getItem('visitor_addresses') ? "present" : "missing"
          }
        });
      } catch (error) {
        setDebugInfo({
          error: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date().toISOString()
        });
      } finally {
        setLoading(false);
      }
    };

    runDiagnostics();
  }, []);

  if (loading) {
    return <div className={`p-4 bg-gray-100 dark:bg-gray-800 rounded ${className}`}>Loading debug info...</div>;
  }

  return (
    <div className={`p-4 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono ${className}`}>
      <h3 className="font-bold mb-2">Session Debug Info</h3>
      <pre className="whitespace-pre-wrap overflow-auto max-h-96">
        {JSON.stringify(debugInfo, null, 2)}
      </pre>
    </div>
  );
}
