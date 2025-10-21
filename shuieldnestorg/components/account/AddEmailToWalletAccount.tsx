"use client";

import { useState } from "react";
import { createSupabaseClient } from "@/utils/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { IoMail, IoLockClosed, IoCheckmarkCircle } from "react-icons/io5";

/**
 * AddEmailToWalletAccount Component
 * 
 * Allows users with wallet-only (anonymous) accounts to add an email address.
 * This enables:
 * - Email notifications
 * - Password-based sign-in as backup
 * - Account recovery options
 * 
 * The user keeps all their wallet data and can still sign in with their wallet.
 */
export default function AddEmailToWalletAccount() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validation
    if (!email || !password) {
      setError("Please provide both email and password");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const supabase = createSupabaseClient();

      // Update the anonymous user to have email and password
      const { error: updateError } = await supabase.auth.updateUser({
        email,
        password,
      });

      if (updateError) {
        throw updateError;
      }

      setSuccess(true);
      setEmail("");
      setPassword("");
      setConfirmPassword("");

      // Show success message and reload after a delay
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (err) {
      console.error("Failed to add email:", err);
      setError(err instanceof Error ? err.message : "Failed to add email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="p-6 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
        <div className="flex items-center gap-3 text-green-700 dark:text-green-300">
          <IoCheckmarkCircle className="w-8 h-8" />
          <div>
            <h3 className="text-lg font-semibold">Email Added Successfully!</h3>
            <p className="text-sm">You can now sign in with email or wallet. Refreshing...</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Add Email to Your Account
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Optional: Add an email to enable notifications and backup sign-in. 
          You'll still be able to sign in with your wallet.
        </p>
      </div>

      <form onSubmit={handleAddEmail} className="space-y-4">
        {/* Email Input */}
        <div>
          <Label htmlFor="email" className="flex items-center gap-2 mb-2">
            <IoMail className="w-4 h-4" />
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            disabled={loading}
          />
        </div>

        {/* Password Input */}
        <div>
          <Label htmlFor="password" className="flex items-center gap-2 mb-2">
            <IoLockClosed className="w-4 h-4" />
            Password
          </Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            required
            disabled={loading}
            minLength={6}
          />
        </div>

        {/* Confirm Password Input */}
        <div>
          <Label htmlFor="confirmPassword" className="flex items-center gap-2 mb-2">
            <IoLockClosed className="w-4 h-4" />
            Confirm Password
          </Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter your password"
            required
            disabled={loading}
            minLength={6}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={loading}
          className="w-full"
        >
          {loading ? "Adding Email..." : "Add Email"}
        </Button>

        {/* Benefits List */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Benefits of adding email:
          </p>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>📧 Receive portfolio alerts and notifications</li>
            <li>🔐 Backup sign-in method (email + password)</li>
            <li>🔄 Account recovery if you lose wallet access</li>
            <li>📱 Sign in from devices without wallet extension</li>
          </ul>
        </div>
      </form>
    </Card>
  );
}

