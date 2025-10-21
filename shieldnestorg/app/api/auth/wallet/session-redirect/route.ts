import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/utils/supabase/service-role";
import { cookies } from "next/headers";

/**
 * Fallback session redirect handler
 * Creates a session using admin API and sets cookies directly
 * 
 * File: /app/api/auth/wallet/session-redirect/route.ts
 */
export async function GET(req: NextRequest) {
  console.log("=== SESSION REDIRECT START ===");
  
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      console.error("Missing userId parameter");
      return NextResponse.redirect(new URL('/dashboard?error=missing_user', req.url));
    }

    console.log("Creating session for userId:", userId);

    const serviceClient = createServiceRoleClient();

    // Get the user
    const { data: { user }, error: userError } = await serviceClient.auth.admin.getUserById(userId);

    if (userError || !user) {
      console.error("User not found:", userError);
      return NextResponse.redirect(new URL('/dashboard?error=user_not_found', req.url));
    }

    console.log("User found, generating session token...");

    // Try to generate a session using admin API
    const redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard`;
    console.log("📍 Setting redirect destination:", redirectUrl);
    
    const { data: linkData, error: linkError } = await serviceClient.auth.admin.generateLink({
      type: 'magiclink',
      email: user.email || `wallet-${user.id}@shieldnest.local`,
      options: {
        redirectTo: redirectUrl
      }
    });

    if (linkError || !linkData) {
      console.error("Failed to generate link:", linkError);
      
      // Last resort fallback - just redirect to dashboard
      // The user will need to sign in manually
      return NextResponse.redirect(new URL('/dashboard?error=session_failed', req.url));
    }

    console.log("✅ Session link generated, redirecting...");

    // Redirect to the magic link URL which will establish the session
    return NextResponse.redirect(linkData.properties.action_link);

  } catch (error) {
    console.error("Session redirect error:", error);
    return NextResponse.redirect(new URL('/dashboard?error=server_error', req.url));
  }
}

