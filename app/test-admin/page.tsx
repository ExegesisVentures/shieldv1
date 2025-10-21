"use client";

import { useState, useEffect } from "react";
import { createSupabaseClient } from "@/utils/supabase/client";
import { isUserAdmin } from "@/utils/admin";

export default function TestAdminPage() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkEverything();
  }, []);

  async function checkEverything() {
    const supabase = createSupabaseClient();
    const results: any = {};

    try {
      // 1. Check auth user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      results.authUser = user ? {
        id: user.id,
        email: user.email,
        metadata: user.user_metadata,
      } : null;
      results.authError = authError?.message;

      if (user) {
        // 2. Check user profile
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("public_user_id")
          .eq("auth_user_id", user.id)
          .maybeSingle();
        results.profile = profile;

        // 3. Check wallets
        if (profile) {
          const { data: wallets } = await supabase
            .from("wallets")
            .select("address, label, is_custodial, source")
            .eq("public_user_id", profile.public_user_id);
          results.wallets = wallets;
        }

        // 4. Check admin status
        const adminStatus = await isUserAdmin(supabase);
        results.isAdmin = adminStatus;

        // 5. Check if email matches
        results.isAdminEmail = user.email?.toLowerCase() === "nestd@pm.me";

        // 6. Check admin wallets
        const adminWallets = [
          "core1mgvlgvh2hfw5pgdqc79up3du69v2z3t8qz4kwg",
          "core1jcas459gnu857ylephjdjlea3rkr38m0asj6gw",
          "core1ltltw0jya4hq39myd9798qqvu6jzy6zxalxhqu",
        ];
        results.hasAdminWallet = results.wallets?.some((w: any) => 
          adminWallets.includes(w.address.toLowerCase())
        );

        // 7. Check custodial wallets
        results.custodialCount = results.wallets?.filter((w: any) => w.is_custodial).length || 0;
        results.totalWallets = results.wallets?.length || 0;

        // 8. Check rewards table
        const { error: tableError } = await supabase
          .from("wallet_rewards_history")
          .select("count")
          .limit(1);
        results.rewardsTableExists = !tableError;
        results.rewardsTableError = tableError?.message;
      }

    } catch (error: any) {
      results.error = error.message;
    }

    setStatus(results);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">Admin Status Test</h1>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔍 Admin Status Diagnostic</h1>

        {/* Auth Status */}
        <div className="mb-6 p-4 bg-gray-800 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">Authentication</h2>
          {status.authUser ? (
            <div className="space-y-2">
              <p>✅ Authenticated as: <span className="text-green-400">{status.authUser.email}</span></p>
              <p>User ID: <code className="text-xs bg-gray-700 px-2 py-1 rounded">{status.authUser.id}</code></p>
            </div>
          ) : (
            <p>❌ Not authenticated</p>
          )}
        </div>

        {/* Profile Status */}
        <div className="mb-6 p-4 bg-gray-800 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">User Profile</h2>
          {status.profile ? (
            <p>✅ Profile exists: <code className="text-xs bg-gray-700 px-2 py-1 rounded">{status.profile.public_user_id}</code></p>
          ) : (
            <p>❌ No profile found - THIS IS THE PROBLEM!</p>
          )}
        </div>

        {/* Wallets Status */}
        <div className="mb-6 p-4 bg-gray-800 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">Wallets</h2>
          <p>Total Wallets: <span className="text-[#25d695]">{status.totalWallets}</span></p>
          <p>Custodial Wallets: <span className="text-green-400">{status.custodialCount}</span></p>
          <p>Has Admin Wallet: {status.hasAdminWallet ? "✅ Yes" : "❌ No"}</p>
          {status.wallets && status.wallets.length > 0 && (
            <div className="mt-3">
              <p className="text-sm text-gray-400 mb-2">Wallet Details:</p>
              {status.wallets.map((w: any, i: number) => (
                <div key={i} className="text-xs bg-gray-700 p-2 rounded mb-2">
                  <p>Address: {w.address.slice(0, 20)}...</p>
                  <p>Label: {w.label || "None"}</p>
                  <p>Custodial: {w.is_custodial ? "✅ Yes" : "❌ No"}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Admin Status */}
        <div className="mb-6 p-4 bg-gray-800 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">Admin Status</h2>
          <p>Is Admin Email (nestd@pm.me): {status.isAdminEmail ? "✅ Yes" : "❌ No"}</p>
          <p>Has Admin Wallet: {status.hasAdminWallet ? "✅ Yes" : "❌ No"}</p>
          <p className="text-xl mt-3">
            <strong>isUserAdmin() Result: {status.isAdmin ? "✅ TRUE" : "❌ FALSE"}</strong>
          </p>
        </div>

        {/* Rewards Table */}
        <div className="mb-6 p-4 bg-gray-800 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">Rewards History Table</h2>
          <p>Table Exists: {status.rewardsTableExists ? "✅ Yes" : "❌ No"}</p>
          {status.rewardsTableError && (
            <p className="text-red-400 text-sm mt-2">Error: {status.rewardsTableError}</p>
          )}
        </div>

        {/* Summary */}
        <div className="mb-6 p-4 bg-blue-900 rounded-lg border-2 border-[#25d695]">
          <h2 className="text-xl font-semibold mb-3">🎯 Summary</h2>
          {status.isAdmin ? (
            <div>
              <p className="text-green-400 text-lg font-bold mb-3">✅ You ARE an admin!</p>
              <p>You should be able to access <a href="/admin" className="text-[#25d695] underline">/admin</a></p>
              <p className="mt-2 text-sm text-gray-300">
                If you still can&apos;t see the admin page, try:
              </p>
              <ul className="list-disc ml-6 mt-2 text-sm">
                <li>Log out and log back in</li>
                <li>Clear browser cache</li>
                <li>Hard refresh (Cmd+Shift+R / Ctrl+Shift+R)</li>
              </ul>
            </div>
          ) : (
            <div>
              <p className="text-red-400 text-lg font-bold mb-3">❌ You are NOT admin</p>
              <p className="text-sm">Reasons:</p>
              <ul className="list-disc ml-6 mt-2 text-sm">
                {!status.authUser && <li>Not authenticated</li>}
                {!status.isAdminEmail && <li>Email is not nestd@pm.me</li>}
                {!status.profile && <li>No user profile</li>}
                {status.totalWallets === 0 && <li>No wallets connected</li>}
                {!status.hasAdminWallet && <li>No admin wallets connected</li>}
              </ul>
            </div>
          )}
        </div>

        {/* Raw Data */}
        <details className="mb-6 p-4 bg-gray-800 rounded-lg">
          <summary className="cursor-pointer font-semibold mb-2">🔧 Raw Data (for debugging)</summary>
          <pre className="text-xs overflow-auto bg-gray-900 p-4 rounded">
            {JSON.stringify(status, null, 2)}
          </pre>
        </details>

        {/* Actions */}
        <div className="flex gap-4">
          <button 
            onClick={checkEverything}
            className="px-4 py-2 bg-[#25d695] hover:bg-[#179b69] rounded"
          >
            🔄 Refresh Check
          </button>
          <a 
            href="/admin"
            className="px-4 py-2 bg-[#25d695] hover:bg-[#179b69] rounded inline-block"
          >
            📋 Go to Admin Page
          </a>
          <a 
            href="/dashboard"
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded inline-block"
          >
            🏠 Go to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}

