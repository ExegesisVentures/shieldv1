/**
 * ============================================
 * ChangeNOW CREATE EXCHANGE API ROUTE
 * ============================================
 * 
 * Creates a new ChangeNOW exchange to buy COREUM with fiat
 * Stores transaction in database for tracking
 * 
 * File: /app/api/changenow/create-exchange/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/utils/supabase/server';
import { createExchange, isValidCoreumAddress } from '@/utils/changenow/client';

export async function POST(request: NextRequest) {
  try {
    console.log('📡 [ChangeNOW API] Creating exchange...');

    // Parse request body
    const body = await request.json();
    const {
      fromCurrency,
      fromAmount,
      payoutAddress,
      contactEmail,
      walletLabel,
      isGuest = false,
      guestSessionId,
    } = body;

    // For guest users, require email
    if (isGuest && !contactEmail) {
      return NextResponse.json(
        { error: 'Email required for guest checkout' },
        { status: 400 }
      );
    }

    // Get user if authenticated (optional for guests)
    const supabase = await createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    // For authenticated users, require auth
    if (!isGuest && !user) {
      return NextResponse.json(
        { error: 'Authentication required for non-guest checkout' },
        { status: 401 }
      );
    }

    // Validate inputs
    if (!fromCurrency || !fromAmount || !payoutAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: fromCurrency, fromAmount, payoutAddress' },
        { status: 400 }
      );
    }

    // Validate COREUM address
    if (!isValidCoreumAddress(payoutAddress)) {
      return NextResponse.json(
        { error: 'Invalid COREUM address format' },
        { status: 400 }
      );
    }

    // Validate amount
    const amount = parseFloat(fromAmount);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    console.log(`📝 [ChangeNOW API] Creating exchange: ${fromAmount} ${fromCurrency} → COREUM`);
    console.log(`📝 [ChangeNOW API] Payout address: ${payoutAddress}`);
    console.log(`📝 [ChangeNOW API] Mode: ${isGuest ? 'Guest' : 'Authenticated'}`);

    // Create exchange with ChangeNOW
    const exchange = await createExchange({
      fromCurrency,
      toCurrency: 'coreum',
      fromAmount,
      address: payoutAddress,
      userId: user?.id || guestSessionId,
      contactEmail: contactEmail || user?.email || undefined,
    });

    if (!exchange) {
      console.error('❌ [ChangeNOW API] Failed to create exchange');
      return NextResponse.json(
        { error: 'Failed to create exchange with ChangeNOW' },
        { status: 500 }
      );
    }

    console.log(`✅ [ChangeNOW API] Exchange created: ${exchange.id}`);

    // Store transaction in database
    const { error: dbError } = await supabase
      .from('changenow_transactions')
      .insert({
        user_id: user?.id || null,
        is_guest: isGuest,
        guest_session_id: isGuest ? guestSessionId : null,
        changenow_id: exchange.id,
        payin_address: exchange.payinAddress,
        payout_address: exchange.payoutAddress,
        from_currency: exchange.fromCurrency,
        from_amount: exchange.fromAmount,
        to_currency: exchange.toCurrency,
        to_amount: exchange.toAmount,
        expected_amount: exchange.toAmount,
        status: 'new',
        user_email: contactEmail || user?.email || null,
        user_wallet_label: walletLabel || null,
        raw_response: exchange as any,
      });

    if (dbError) {
      console.error('❌ [ChangeNOW API] Failed to store transaction:', dbError);
      // Don't fail the request - exchange was created
      // User can still complete it even if our DB insert failed
    }

    return NextResponse.json({
      success: true,
      data: {
        id: exchange.id,
        payinAddress: exchange.payinAddress,
        payoutAddress: exchange.payoutAddress,
        fromCurrency: exchange.fromCurrency,
        toCurrency: exchange.toCurrency,
        fromAmount: exchange.fromAmount,
        toAmount: exchange.toAmount,
        paymentUrl: exchange.paymentUrl,
      },
    });

  } catch (error) {
    console.error('❌ [ChangeNOW API] Error creating exchange:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

