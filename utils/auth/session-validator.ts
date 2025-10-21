/**
 * Session Validation Utilities
 * 
 * Provides utilities to validate and refresh user sessions
 * to handle cases where the user appears authenticated but data isn't loading
 */

import { createSupabaseClient } from "@/utils/supabase/client";

export interface SessionValidationResult {
  isValid: boolean;
  user: any | null;
  needsRefresh: boolean;
  error?: string;
}

/**
 * Validate the current user session and attempt to refresh if needed
 */
export async function validateUserSession(): Promise<SessionValidationResult> {
  try {
    const supabase = createSupabaseClient();
    
    // First, try to get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (!userError && user) {
      return {
        isValid: true,
        user,
        needsRefresh: false
      };
    }
    
    // Check if it's a session missing error - this is normal for unauthenticated users
    if (userError?.message?.includes('Auth session missing') || userError?.message?.includes('session_not_found')) {
      return {
        isValid: false,
        user: null,
        needsRefresh: false,
        error: "No active session"
      };
    }
    
    // If getUser failed with other error, try to refresh the session
    console.warn("User session validation failed, attempting refresh:", userError);
    
    const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();
    
    if (refreshError) {
      console.error("Session refresh failed:", refreshError);
      return {
        isValid: false,
        user: null,
        needsRefresh: false,
        error: refreshError.message
      };
    }
    
    if (session?.user) {
      return {
        isValid: true,
        user: session.user,
        needsRefresh: true
      };
    }
    
    return {
      isValid: false,
      user: null,
      needsRefresh: false,
      error: "No valid session found"
    };
    
  } catch (error) {
    console.error("Session validation error:", error);
    return {
      isValid: false,
      user: null,
      needsRefresh: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Force a session refresh and return the updated user
 */
export async function forceSessionRefresh(): Promise<SessionValidationResult> {
  try {
    const supabase = createSupabaseClient();
    
    const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();
    
    if (refreshError) {
      console.error("Forced session refresh failed:", refreshError);
      return {
        isValid: false,
        user: null,
        needsRefresh: false,
        error: refreshError.message
      };
    }
    
    if (session?.user) {
      return {
        isValid: true,
        user: session.user,
        needsRefresh: true
      };
    }
    
    return {
      isValid: false,
      user: null,
      needsRefresh: false,
      error: "No session found after refresh"
    };
    
  } catch (error) {
    console.error("Forced session refresh error:", error);
    return {
      isValid: false,
      user: null,
      needsRefresh: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Check if the user has a valid profile mapping
 */
export async function validateUserProfile(): Promise<{
  hasProfile: boolean;
  publicUserId: string | null;
  error?: string;
}> {
  try {
    const supabase = createSupabaseClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return {
        hasProfile: false,
        publicUserId: null,
        error: "User not authenticated"
      };
    }
    
    // Check if user has a profile mapping
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("public_user_id")
      .eq("auth_user_id", user.id)
      .maybeSingle();
    
    if (profileError) {
      return {
        hasProfile: false,
        publicUserId: null,
        error: profileError.message
      };
    }
    
    return {
      hasProfile: !!profile?.public_user_id,
      publicUserId: profile?.public_user_id || null
    };
    
  } catch (error) {
    console.error("Profile validation error:", error);
    return {
      hasProfile: false,
      publicUserId: null,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}
