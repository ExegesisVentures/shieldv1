/**
 * ============================================
 * ChangeNOW GET TRANSACTION STATUS API ROUTE
 * ============================================
 * 
 * Checks the status of a ChangeNOW transaction
 * Updates database with latest status
 * 
 * File: /app/api/changenow/transaction-status/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/utils/supabase/server';
import { getTransactionStatus, isTerminalStatus } from '@/utils/changenow/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get('id');

    if (!transactionId) {
      return NextResponse.json(
        { error: 'Transaction ID required' },
        { status: 400 }
      );
    }

    console.log(`📡 [ChangeNOW API] Checking status for transaction: ${transactionId}`);

    // Authenticate user
    const supabase = await createSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify user owns this transaction
    const { data: transaction, error: txError } = await supabase
      .from('changenow_transactions')
      .select('*')
      .eq('changenow_id', transactionId)
      .eq('user_id', user.id)
      .single();

    if (txError || !transaction) {
      console.error('❌ [ChangeNOW API] Transaction not found:', txError);
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Get latest status from ChangeNOW
    const status = await getTransactionStatus(transactionId);

    if (!status) {
      console.error('❌ [ChangeNOW API] Failed to get transaction status');
      return NextResponse.json(
        { error: 'Failed to get transaction status' },
        { status: 500 }
      );
    }

    console.log(`📊 [ChangeNOW API] Transaction status: ${status.status}`);

    // Update database if status changed
    if (status.status !== transaction.status) {
      const updateData: any = {
        status: status.status,
        status_updated_at: new Date().toISOString(),
      };

      // Update hashes if available
      if (status.payinHash) {
        updateData.payin_hash = status.payinHash;
      }
      if (status.payoutHash) {
        updateData.payout_hash = status.payoutHash;
      }

      // Update actual amount if available
      if (status.toAmount) {
        updateData.to_amount = status.toAmount;
      }

      // Set completed_at if terminal status
      if (isTerminalStatus(status.status)) {
        updateData.completed_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from('changenow_transactions')
        .update(updateData)
        .eq('changenow_id', transactionId);

      if (updateError) {
        console.error('❌ [ChangeNOW API] Failed to update transaction:', updateError);
        // Don't fail the request - we still got the status
      } else {
        console.log(`✅ [ChangeNOW API] Transaction updated to status: ${status.status}`);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: transactionId,
        status: status.status,
        payinHash: status.payinHash,
        payoutHash: status.payoutHash,
        fromAmount: status.fromAmount,
        toAmount: status.toAmount,
        createdAt: status.createdAt,
        updatedAt: status.updatedAt,
      },
    });

  } catch (error) {
    console.error('❌ [ChangeNOW API] Error checking transaction status:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

