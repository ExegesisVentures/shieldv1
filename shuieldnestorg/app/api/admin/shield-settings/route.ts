import { NextResponse } from "next/server";
import { createSupabaseClient } from "@/utils/supabase/server";
import { uiError } from "@/utils/errors";
import { isUserAdmin } from "@/utils/admin";

/**
 * Get Shield NFT settings (public endpoint)
 */
export async function GET() {
  try {
    const supabase = await createSupabaseClient();
    const { data } = await supabase
      .from("shield_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    
    return NextResponse.json(data ?? { 
      id: 1, 
      image_url: null, 
      min_usd: 5000, 
      max_usd: 6000 
    });
  } catch (e) {
    console.error("Shield settings fetch error:", e);
    return NextResponse.json(
      uiError("FETCH_FAILED", "Could not fetch Shield settings."),
      { status: 500 }
    );
  }
}

/**
 * Update Shield NFT settings (admin only)
 */
export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseClient();
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        uiError("UNAUTHORIZED", "You must be logged in to update settings."),
        { status: 401 }
      );
    }

    // Check if user has admin role
    const adminStatus = await isUserAdmin(supabase);
    
    if (!adminStatus) {
      return NextResponse.json(
        uiError("FORBIDDEN", "You do not have permission to update settings. Admin access required."),
        { status: 403 }
      );
    }
    
    const body = await req.json();
    
    // Validate input
    if (body.min_usd && body.max_usd && body.min_usd > body.max_usd) {
      return NextResponse.json(
        uiError("INVALID_INPUT", "min_usd must be less than or equal to max_usd."),
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("shield_settings")
      .upsert({ 
        id: 1, 
        ...body, 
        updated_at: new Date().toISOString() 
      })
      .select("*")
      .single();
    
    if (error) {
      return NextResponse.json(
        uiError("UPDATE_FAILED", "Could not update Shield settings.", error.message),
        { status: 400 }
      );
    }
    
    return NextResponse.json(data);
  } catch (e) {
    console.error("Shield settings update error:", e);
    return NextResponse.json(
      uiError("UPDATE_FAILED", "Could not update Shield settings."),
      { status: 500 }
    );
  }
}

