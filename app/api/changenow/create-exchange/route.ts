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

    // Authenticate user
    const supabase = await createSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('❌ [ChangeNOW API] Authentication failed:', userError);
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      fromCurrency,
      fromAmount,
      payoutAddress,
      contactEmail,
      walletLabel,
    } = body;

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

    // Create exchange with ChangeNOW
    const exchange = await createExchange({
      fromCurrency,
      toCurrency: 'coreum',
      fromAmount,
      address: payoutAddress,
      userId: user.id,
      contactEmail: contactEmail || user.email || undefined,
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
        user_id: user.id,
        changenow_id: exchange.id,
        payin_address: exchange.payinAddress,
        payout_address: exchange.payoutAddress,
        from_currency: exchange.fromCurrency,
        from_amount: exchange.fromAmount,
        to_currency: exchange.toCurrency,
        to_amount: exchange.toAmount,
        expected_amount: exchange.toAmount,
        status: 'new',
        user_email: contactEmail || user.email || null,
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

