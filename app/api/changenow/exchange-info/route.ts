/**
 * ============================================
 * ChangeNOW EXCHANGE INFO API ROUTE
 * ============================================
 * 
 * Gets minimum/maximum amounts and estimated exchange rate
 * PUBLIC ENDPOINT - No authentication required (just getting rates)
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

    // Check if API key is configured
    const apiKey = process.env.CHANGENOW_API_KEY;
    if (!apiKey) {
      console.error('❌ [ChangeNOW API] API key not configured');
      return NextResponse.json(
        { 
          error: 'ChangeNOW service not configured',
          hint: 'Administrator needs to add CHANGENOW_API_KEY to environment variables'
        },
        { status: 503 }
      );
    }

    // Get minimal exchange amount
    const minimalAmount = await getMinimalExchangeAmount(fromCurrency, 'coreum');

    if (!minimalAmount) {
      console.error('❌ [ChangeNOW API] Failed to get minimal amount');
      return NextResponse.json(
        { 
          error: 'Failed to get exchange information',
          hint: 'Unable to connect to ChangeNOW API. Please try again later.'
        },
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

