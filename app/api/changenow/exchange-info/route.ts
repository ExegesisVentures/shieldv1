/**
 * ============================================
 * ChangeNOW EXCHANGE INFO API ROUTE
 * ============================================
 * 
 * Gets minimum/maximum amounts and estimated exchange rate
 * 
 * File: /app/api/changenow/exchange-info/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getMinimalExchangeAmount,
  getEstimatedExchangeAmount,
} from '@/utils/changenow/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fromCurrency = searchParams.get('fromCurrency');
    const fromAmount = searchParams.get('fromAmount');

    if (!fromCurrency) {
      return NextResponse.json(
        { error: 'fromCurrency required' },
        { status: 400 }
      );
    }

    console.log(`📡 [ChangeNOW API] Getting exchange info for ${fromCurrency}`);

    // Get minimal exchange amount
    const minimalAmount = await getMinimalExchangeAmount(fromCurrency, 'coreum');

    if (!minimalAmount) {
      console.error('❌ [ChangeNOW API] Failed to get minimal amount');
      return NextResponse.json(
        { error: 'Failed to get exchange information' },
        { status: 500 }
      );
    }

    // Get estimated amount if fromAmount provided
    let estimatedAmount = null;
    if (fromAmount) {
      estimatedAmount = await getEstimatedExchangeAmount(
        fromCurrency,
        'coreum',
        fromAmount
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        minAmount: minimalAmount.minAmount,
        maxAmount: minimalAmount.maxAmount,
        estimatedAmount: estimatedAmount?.estimatedAmount,
        transactionSpeed: estimatedAmount?.transactionSpeedForecast,
        warningMessage: estimatedAmount?.warningMessage,
      },
    });

  } catch (error) {
    console.error('❌ [ChangeNOW API] Error getting exchange info:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

