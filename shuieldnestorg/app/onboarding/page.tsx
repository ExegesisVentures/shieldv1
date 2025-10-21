/**
 * Onboarding Page
 * File: app/onboarding/page.tsx
 * 
 * Guided onboarding flow for new users after email confirmation
 * Collects: first name, optional wallet connection
 */

import { redirect } from "next/navigation";
import { createSupabaseClient } from "@/utils/supabase/server";
import { createServiceRoleClient } from "@/utils/supabase/service-role";
import SimpleOnboarding from "@/components/onboarding/SimpleOnboarding";

export default async function OnboardingPage() {
  const supabase = await createSupabaseClient();
  
  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return redirect("/sign-in");
  }

  // Check if user has a profile
  const serviceClient = createServiceRoleClient();
  const { data: profile } = await serviceClient
    .from("user_profiles")
    .select("public_user_id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!profile) {
    // Profile should have been created during sign-in, but if not, redirect back
    return redirect("/sign-in");
  }

  // Check if onboarding is already completed
  const { data: publicUser } = await serviceClient
    .from("public_users")
    .select("onboarding_completed, first_name")
    .eq("id", profile.public_user_id)
    .single();

  if (publicUser?.onboarding_completed) {
    return redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <SimpleOnboarding 
          userEmail={user.email || ""}
          publicUserId={profile.public_user_id}
        />
      </div>
    </div>
  );
}
