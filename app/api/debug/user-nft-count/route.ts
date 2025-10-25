/**
 * Debug endpoint to check a specific user's NFT count
 * File: /app/api/debug/user-nft-count/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email')?.toLowerCase();

    if (!email) {
      return NextResponse.json({
        error: 'Email parameter required',
        example: '/api/debug/user-nft-count?email=vicnshane@sbcglobal.net'
      }, { status: 400 });
    }

    const supabase = await createSupabaseClient();

    // 1. Find auth user
    const { data: { users: authUsers } } = await supabase.auth.admin.listUsers();
    const authUser = authUsers?.find(u => u.email?.toLowerCase() === email);

    if (!authUser) {
      return NextResponse.json({
        error: 'User not found',
        email,
        solution: 'Run npm run import-members to import the user'
      }, { status: 404 });
    }

    // 2. Find user_profiles mapping
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('public_user_id')
      .eq('auth_user_id', authUser.id)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json({
        error: 'No user_profiles mapping found',
        auth_user_id: authUser.id,
        solution: 'Run npm run import-members to create the mapping'
      }, { status: 404 });
    }

    // 3. Find private_user_profiles mapping
    const { data: privateProfile } = await supabase
      .from('private_user_profiles')
      .select('private_user_id')
      .eq('auth_user_id', authUser.id)
      .maybeSingle();

    if (!privateProfile) {
      return NextResponse.json({
        success: true,
        email,
        auth_user_id: authUser.id,
        public_user_id: profile.public_user_id,
        nft_count: 0,
        message: 'User has no private profile (not a member)',
        solution: 'Run npm run import-members to create the private profile'
      });
    }

    // 4. Get private_users NFT count
    const { data: privateUser } = await supabase
      .from('private_users')
      .select('shieldnest_member_nft, pma_signed, shield_nft_verified')
      .eq('id', privateProfile.private_user_id)
      .maybeSingle();

    if (!privateUser) {
      return NextResponse.json({
        error: 'No private_users record found',
        private_user_id: privateProfile.private_user_id,
        solution: 'Run npm run import-members to create the private user record'
      }, { status: 404 });
    }

    // 5. Get wallets
    const { data: wallets } = await supabase
      .from('wallets')
      .select('address, label')
      .eq('public_user_id', profile.public_user_id);

    return NextResponse.json({
      success: true,
      email,
      auth_user_id: authUser.id,
      public_user_id: profile.public_user_id,
      private_user_id: privateProfile.private_user_id,
      nft_count: privateUser.shieldnest_member_nft || 0,
      pma_signed: privateUser.pma_signed,
      shield_nft_verified: privateUser.shield_nft_verified,
      wallets: wallets?.map(w => ({ address: w.address, label: w.label })) || [],
      message: privateUser.shieldnest_member_nft === 2 
        ? '✅ User has 2 NFTs as expected!' 
        : privateUser.shieldnest_member_nft > 0
        ? `⚠️ User has ${privateUser.shieldnest_member_nft} NFT(s), should be 2`
        : '❌ User has 0 NFTs, should be 2'
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

