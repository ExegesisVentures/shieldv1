import { NextResponse } from "next/server";
import { makeNonce } from "@/utils/wallet/adr36";
import { uiError } from "@/utils/errors";
import { createSupabaseClient } from "@/utils/supabase/server";

/**
 * Generate a nonce for wallet signature verification
 * Stores nonce with expiry for later verification
 */
export async function GET(req: Request) {
  console.log("=== NONCE REQUEST START ===");
  
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get("address");
    console.log("Request params:", { hasAddress: !!address, addressLength: address?.length });

    if (!address) {
      console.error("Missing address parameter");
      return NextResponse.json(
        uiError("BAD_REQUEST", "Address parameter is required"),
        { status: 400 }
      );
    }

    console.log("Creating Supabase client...");
    const supabase = await createSupabaseClient();
    
    console.log("Generating nonce...");
    const nonce = makeNonce();
    console.log("Nonce generated:", nonce.substring(0, 10) + "...");
    
    // Store nonce (expires_at has default of now() + 10 minutes in DB)
    console.log("Storing nonce in database...");
    const { error: insertError } = await supabase.from("wallet_nonces").insert({
      nonce,
      address: address.toLowerCase(), // Normalize to lowercase
      // expires_at will use DB default (now() + 10 minutes)
      // used will default to false
      // created_at will default to now()
    });

    if (insertError) {
      console.error("Failed to store nonce:", {
        message: insertError.message,
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint,
      });
      return NextResponse.json(
        uiError("NONCE_STORAGE_FAILED", "Could not store nonce. Please try again."),
        { status: 500 }
      );
    }

    // Calculate expiry for response (10 minutes from now)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    console.log("Nonce stored successfully");
    console.log("=== NONCE REQUEST SUCCESS ===");
    
    return NextResponse.json({ nonce, expiresAt: expiresAt.toISOString() });
  } catch (e) {
    console.error("=== NONCE GENERATION ERROR ===");
    console.error("Error type:", e instanceof Error ? e.constructor.name : typeof e);
    console.error("Error message:", e instanceof Error ? e.message : String(e));
    console.error("Error stack:", e instanceof Error ? e.stack : "No stack trace");
    console.error("===========================");
    
    const errorMessage = e instanceof Error ? e.message : "Unknown error";
    const err = uiError("NONCE_FAILED", "Could not create a login nonce.", errorMessage);
    return NextResponse.json(err, { status: 500 });
  }
}

