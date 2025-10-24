/**
 * ============================================
 * ChangeNOW USER TRANSACTIONS API ROUTE
 * ============================================
 * 
 * Lists all ChangeNOW transactions for the current user
 * Can filter by status (pending, completed, all)
 * 
 * File: /app/api/changenow/user-transactions/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/utils/supabase/server';
import { isPendingStatus } from '@/utils/changenow/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all'; // all, pending, completed

    console.log(`📡 [ChangeNOW API] Fetching user transactions (filter: ${filter})`);

    // Authenticate user
    const supabase = await createSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Build query
    let query = supabase
      .from('changenow_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filter === 'pending') {
      query = query.in('status', ['new', 'waiting', 'confirming', 'exchanging', 'sending']);
    } else if (filter === 'completed') {
      query = query.in('status', ['finished', 'failed', 'refunded', 'expired']);
    }

    const { data: transactions, error: txError } = await query;

    if (txError) {
      console.error('❌ [ChangeNOW API] Failed to fetch transactions:', txError);
      return NextResponse.json(
        { error: 'Failed to fetch transactions' },
        { status: 500 }
      );
    }

    console.log(`✅ [ChangeNOW API] Found ${transactions?.length || 0} transactions`);

    // Transform data for client
    const transformedTransactions = (transactions || []).map((tx) => ({
      id: tx.changenow_id,
      fromCurrency: tx.from_currency,
      fromAmount: parseFloat(tx.from_amount),
      toCurrency: tx.to_currency,
      toAmount: tx.to_amount ? parseFloat(tx.to_amount) : null,
      expectedAmount: tx.expected_amount ? parseFloat(tx.expected_amount) : null,
      status: tx.status,
      payinAddress: tx.payin_address,
      payoutAddress: tx.payout_address,
      payinHash: tx.payin_hash,
      payoutHash: tx.payout_hash,
      createdAt: tx.created_at,
      updatedAt: tx.updated_at,
      statusUpdatedAt: tx.status_updated_at,
      completedAt: tx.completed_at,
      isPending: isPendingStatus(tx.status),
    }));

    return NextResponse.json({
      success: true,
      data: transformedTransactions,
    });

  } catch (error) {
    console.error('❌ [ChangeNOW API] Error fetching transactions:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

