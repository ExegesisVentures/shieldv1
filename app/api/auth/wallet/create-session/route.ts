import { NextResponse } from "next/server";
import { uiError } from "@/utils/errors";
import { createServiceRoleClient } from "@/utils/supabase/service-role";

/**
 * Create a session for wallet-authenticated users
 * This endpoint is called after successful wallet signature verification
 * 
 * File: /app/api/auth/wallet/create-session/route.ts
 */
export async function POST(req: Request) {
  console.log("=== CREATE WALLET SESSION REQUEST START ===");
  
  try {
    const body = await req.json();
    const { userId } = body;
    
    if (!userId) {
      return NextResponse.json(
        uiError("BAD_REQUEST", "Missing required field: userId"),
        { status: 400 }
      );
    }

    console.log("Creating session for user:", userId);

    const serviceClient = createServiceRoleClient();

    // Get the user details
    const { data: { user: authUser }, error: authError } = await serviceClient.auth.admin.getUserById(userId);

    if (authError || !authUser) {
      console.error("User not found:", authError);
      return NextResponse.json(
        uiError("USER_NOT_FOUND", "User account not found"),
        { status: 404 }
      );
    }

    console.log("User found:", authUser.email || authUser.id);

    // Generate a magic link for session creation
    const { data: sessionData, error: sessionError } = await serviceClient.auth.admin.generateLink({
      type: 'magiclink',
      email: authUser.email || `${authUser.id}@wallet.local`,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard`
      }
    });

    if (sessionError || !sessionData) {
      console.error("Failed to generate session:", sessionError);
      return NextResponse.json(
        uiError("SESSION_CREATION_FAILED", "Failed to create session", sessionError?.message),
        { status: 500 }
      );
    }

    console.log("✅ Session created successfully");

    return NextResponse.json({
      success: true,
      message: "Session created successfully",
      session: {
        magicLink: sessionData.properties.action_link,
        redirectTo: "/dashboard",
      }
    });

  } catch (error) {
    console.error("Create session error:", error);
    return NextResponse.json(
      uiError("INTERNAL_ERROR", "An unexpected error occurred"),
      { status: 500 }
    );
  }
}
