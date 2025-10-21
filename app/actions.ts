"use server";

import { createSupabaseClient } from "@/utils/supabase/server";
import { createServiceRoleClient } from "@/utils/supabase/service-role";
import { redirect } from "next/navigation";
import { encodedRedirect } from "@/utils/redirect";
import { ensurePublicUserProfile } from "@/utils/supabase/user-profile";

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const client = await createSupabaseClient();

  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect("error", "/sign-in", error.message);
  }

  if (!data.user) {
    return encodedRedirect("error", "/sign-in", "Authentication failed");
  }

  // Ensure user profile exists (in case they signed up before we had the function)
  try {
    const serviceClient = createServiceRoleClient();
    await serviceClient.rpc('create_user_profile_for_auth_user', {
      auth_user_id: data.user.id,
      user_email: email,
    });
  } catch (profileError) {
    // Log but don't block - profile might already exist
    console.error("⚠️ Profile check/creation failed (might already exist):", profileError);
  }

  // Always go to dashboard
  return redirect("/dashboard");
};

// Modal-friendly sign-in that returns errors instead of redirecting
export const signInModalAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const client = await createSupabaseClient();

  const { error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  // Ensure public user profile exists
  try {
    const serviceClient = createServiceRoleClient();
    await ensurePublicUserProfile(serviceClient);
  } catch (e) {
    console.error("Failed to ensure public user profile:", e);
  }

  return { success: true };
};

export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const client = await createSupabaseClient();
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  // If user already exists and confirmations are enabled, Supabase returns
  // an error like "User already registered". Handle this gracefully.
  // We will redirect to sign-in with a friendly message instead of saying
  // an email was sent.
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl}/sign-in`,
    },
  });

  if (error) {
    const normalized = (error.message || "").toLowerCase();
    if (normalized.includes("already registered") || normalized.includes("user already exists")) {
      return encodedRedirect(
        "success",
        "/sign-in",
        "You already have an account. Please sign in."
      );
    }
    return encodedRedirect("error", "/sign-up", error.message);
  }

  // Create user profile using service role client
  if (data.user) {
    try {
      const serviceClient = createServiceRoleClient();
      await serviceClient.rpc('create_user_profile_for_auth_user', {
        auth_user_id: data.user.id,
        user_email: email,
      });
      console.log("✅ User profile created for:", email);
    } catch (profileError) {
      // Log but don't fail - profile can be created on first login
      console.error("⚠️ Failed to create user profile (will retry on login):", profileError);
    }
  }

  // Check if email confirmation is required
  if (data.user && !data.session) {
    // Email confirmation required
    return encodedRedirect(
      "success",
      "/sign-in",
      "Check your email to confirm your account, then sign in."
    );
  }

  // If email confirmation is disabled (dev mode), redirect to sign-in
  return encodedRedirect(
    "success",
    "/sign-in",
    "Account created! Please sign in."
  );
};

export const signOutAction = async () => {
  const client = await createSupabaseClient();
  await client.auth.signOut();
  return redirect("/");
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const client = await createSupabaseClient();
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  const { error } = await client.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/reset-password`,
  });

  if (error) {
    return encodedRedirect("error", "/forgot-password", error.message);
  }

  return encodedRedirect(
    "success",
    "/sign-in",
    "Check your email for a password reset link."
  );
};

export const resetPasswordAction = async (formData: FormData) => {
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;
  const client = await createSupabaseClient();

  if (password !== confirmPassword) {
    return encodedRedirect("error", "/reset-password", "Passwords do not match.");
  }

  const { error } = await client.auth.updateUser({
    password,
  });

  if (error) {
    return encodedRedirect("error", "/reset-password", error.message);
  }

  return encodedRedirect("success", "/sign-in", "Password updated successfully.");
};
