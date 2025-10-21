import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * POST /api/auth/wallet/connect
 * 
 * Signature-free authentication for wallet users.
 * Simply connecting via Keplr proves wallet ownership.
 * 
 * This endpoint:
 * 1. Verifies the wallet exists in our database
 * 2. Finds the user who owns it
 * 3. Creates an authenticated session
 * 4. Returns a redirect URL to the dashboard
 */
export async function POST(request: NextRequest) {
  try {
    const { walletAddress } = await request.json();

    console.log('🔐 [Wallet Connect Auth] Starting signature-free authentication');
    console.log('📍 Wallet Address:', walletAddress);

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Create service client
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Find the wallet in the database
    console.log('🔍 Looking up wallet in database...');
    const { data: wallet, error: walletError } = await serviceClient
      .from('wallets')
      .select('public_user_id')
      .eq('address', walletAddress)
      .maybeSingle();

    if (walletError) {
      console.error('❌ Database error:', walletError);
      return NextResponse.json(
        { error: 'Database error', details: walletError.message },
        { status: 500 }
      );
    }

    if (!wallet) {
      console.log('⚠️ Wallet not found in database');
      return NextResponse.json(
        { error: 'Wallet not registered to any account' },
        { status: 404 }
      );
    }

    console.log('✅ Wallet found! User ID:', wallet.public_user_id);

    // Get the user's auth_user_id from profile
    const { data: profile, error: profileError } = await serviceClient
      .from('user_profiles')
      .select('auth_user_id')
      .eq('public_user_id', wallet.public_user_id)
      .single();

    if (profileError || !profile) {
      console.error('❌ Profile lookup error:', profileError);
      return NextResponse.json(
        { error: 'Could not find user profile' },
        { status: 404 }
      );
    }

    console.log('🔍 Auth user ID:', profile.auth_user_id);

    // Get the user's email from Supabase Auth
    const { data: authUser, error: authError } = await serviceClient.auth.admin.getUserById(
      profile.auth_user_id
    );

    if (authError || !authUser) {
      console.error('❌ Auth user lookup error:', authError);
      return NextResponse.json(
        { error: 'Could not find auth user' },
        { status: 404 }
      );
    }

    console.log('📧 User email:', authUser.user.email);

    // Generate a session token that the client can use
    console.log('🔑 Generating session for instant sign-in...');
    
    // Create a session using the admin API
    const { data: sessionData, error: sessionError } = await serviceClient.auth.admin.generateLink({
      type: 'magiclink',
      email: authUser.user.email!,
    });

    if (sessionError || !sessionData) {
      console.error('❌ Session generation failed:', sessionError);
      return NextResponse.json(
        { error: 'Could not generate session', details: sessionError?.message || 'Unknown error' },
        { status: 500 }
      );
    }

    // Extract the action link which contains the tokens
    const actionLink = sessionData.properties?.action_link;
    
    if (!actionLink) {
      console.error('❌ No action link generated');
      return NextResponse.json(
        { error: 'No action link generated' },
        { status: 500 }
      );
    }

    console.log('✅ Session link generated successfully!');

    // Return the action link for client-side navigation
    return NextResponse.json({
      success: true,
      actionLink: actionLink,
      email: authUser.user.email,
      userId: profile.auth_user_id,
      message: 'Session ready - navigate to action link',
    });
  } catch (error) {
    console.error('❌ [Wallet Connect Auth] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

