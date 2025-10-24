/**
 * ============================================
 * ChangeNOW API Client
 * ============================================
 * 
 * Server-side utility for interacting with ChangeNOW API
 * Used for buying COREUM with fiat currency (debit card)
 * 
 * @see https://changenow.io/api/docs
 * 
 * File: /utils/changenow/client.ts
 */

// ============================================
// Types
// ============================================

export interface ChangeNowMinimalExchangeAmount {
  minAmount: number;
  maxAmount?: number;
}

export interface ChangeNowEstimatedAmount {
  estimatedAmount: number;
  transactionSpeedForecast: string;
  warningMessage?: string;
}

export interface ChangeNowCreateExchangeParams {
  fromCurrency: string; // e.g., 'usd'
  toCurrency: string; // e.g., 'coreum'
  fromAmount: string;
  address: string; // Payout address (user's COREUM wallet)
  extraId?: string;
  userId?: string;
  payload?: string;
  contactEmail?: string;
}

export interface ChangeNowCreateExchangeResponse {
  id: string; // Transaction ID
  payinAddress: string; // Where user sends payment
  payoutAddress: string; // User's wallet
  fromCurrency: string;
  toCurrency: string;
  fromAmount: number;
  toAmount: number;
  flow: string;
  type: string;
  paymentUrl?: string; // URL to payment page
}

export interface ChangeNowTransactionStatus {
  status: 'new' | 'waiting' | 'confirming' | 'exchanging' | 'sending' | 'finished' | 'failed' | 'refunded' | 'expired';
  payinAddress?: string;
  payoutAddress?: string;
  fromCurrency?: string;
  toCurrency?: string;
  fromAmount?: number;
  toAmount?: number;
  payinHash?: string;
  payoutHash?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================
// Configuration
// ============================================

const CHANGENOW_API_URL = 'https://api.changenow.io/v2';
const CHANGENOW_API_KEY = process.env.CHANGENOW_API_KEY || '';

if (!CHANGENOW_API_KEY) {
  console.warn('⚠️ [ChangeNOW] API key not found in environment variables');
}

// ============================================
// API Client Functions
// ============================================

/**
 * Get minimum exchange amount for a currency pair
 */
export async function getMinimalExchangeAmount(
  fromCurrency: string,
  toCurrency: string = 'coreum'
): Promise<ChangeNowMinimalExchangeAmount | null> {
  try {
    const url = `${CHANGENOW_API_URL}/exchange/min-amount/${fromCurrency}_${toCurrency}?api_key=${CHANGENOW_API_KEY}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[ChangeNOW] Get min amount failed: ${response.status} - ${errorText}`);
      return null;
    }

    const data = await response.json();
    return {
      minAmount: parseFloat(data.minAmount),
      maxAmount: data.maxAmount ? parseFloat(data.maxAmount) : undefined,
    };
  } catch (error) {
    console.error('[ChangeNOW] Error getting minimal exchange amount:', error);
    return null;
  }
}

/**
 * Get estimated exchange amount
 */
export async function getEstimatedExchangeAmount(
  fromCurrency: string,
  toCurrency: string = 'coreum',
  fromAmount: string
): Promise<ChangeNowEstimatedAmount | null> {
  try {
    const url = `${CHANGENOW_API_URL}/exchange/estimated-amount`;
    
    const params = new URLSearchParams({
      fromCurrency,
      toCurrency,
      fromAmount,
      fromNetwork: fromCurrency,
      toNetwork: 'coreum',
      flow: 'standard',
      type: 'direct',
      useRateId: 'false',
    });

    const response = await fetch(`${url}?${params}&api_key=${CHANGENOW_API_KEY}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[ChangeNOW] Get estimated amount failed: ${response.status} - ${errorText}`);
      return null;
    }

    const data = await response.json();
    return {
      estimatedAmount: parseFloat(data.toAmount),
      transactionSpeedForecast: data.transactionSpeedForecast || 'unknown',
      warningMessage: data.warningMessage,
    };
  } catch (error) {
    console.error('[ChangeNOW] Error getting estimated exchange amount:', error);
    return null;
  }
}

/**
 * Create a new exchange transaction
 */
export async function createExchange(
  params: ChangeNowCreateExchangeParams
): Promise<ChangeNowCreateExchangeResponse | null> {
  try {
    const url = `${CHANGENOW_API_URL}/exchange`;

    const body = {
      fromCurrency: params.fromCurrency,
      toCurrency: params.toCurrency,
      fromAmount: params.fromAmount,
      address: params.address,
      fromNetwork: params.fromCurrency,
      toNetwork: 'coreum',
      flow: 'standard',
      type: 'direct',
      extraId: params.extraId,
      userId: params.userId,
      payload: params.payload,
      contactEmail: params.contactEmail,
    };

    const response = await fetch(`${url}?api_key=${CHANGENOW_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[ChangeNOW] Create exchange failed: ${response.status} - ${errorText}`);
      return null;
    }

    const data = await response.json();
    return {
      id: data.id,
      payinAddress: data.payinAddress,
      payoutAddress: data.payoutAddress,
      fromCurrency: data.fromCurrency,
      toCurrency: data.toCurrency,
      fromAmount: parseFloat(data.fromAmount),
      toAmount: parseFloat(data.toAmount),
      flow: data.flow,
      type: data.type,
      paymentUrl: data.paymentUrl,
    };
  } catch (error) {
    console.error('[ChangeNOW] Error creating exchange:', error);
    return null;
  }
}

/**
 * Get transaction status by ID
 */
export async function getTransactionStatus(
  transactionId: string
): Promise<ChangeNowTransactionStatus | null> {
  try {
    const url = `${CHANGENOW_API_URL}/exchange/by-id`;
    
    const params = new URLSearchParams({
      id: transactionId,
    });

    const response = await fetch(`${url}?${params}&api_key=${CHANGENOW_API_KEY}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[ChangeNOW] Get transaction status failed: ${response.status} - ${errorText}`);
      return null;
    }

    const data = await response.json();
    return {
      status: data.status,
      payinAddress: data.payinAddress,
      payoutAddress: data.payoutAddress,
      fromCurrency: data.fromCurrency,
      toCurrency: data.toCurrency,
      fromAmount: data.fromAmount ? parseFloat(data.fromAmount) : undefined,
      toAmount: data.toAmount ? parseFloat(data.toAmount) : undefined,
      payinHash: data.payinHash,
      payoutHash: data.payoutHash,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  } catch (error) {
    console.error('[ChangeNOW] Error getting transaction status:', error);
    return null;
  }
}

/**
 * Get list of available currencies
 */
export async function getAvailableCurrencies(): Promise<string[] | null> {
  try {
    const url = `${CHANGENOW_API_URL}/exchange/currencies`;
    
    const response = await fetch(`${url}?api_key=${CHANGENOW_API_KEY}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[ChangeNOW] Get currencies failed: ${response.status} - ${errorText}`);
      return null;
    }

    const data = await response.json();
    return data.map((currency: any) => currency.ticker);
  } catch (error) {
    console.error('[ChangeNOW] Error getting available currencies:', error);
    return null;
  }
}

// ============================================
// Helper Functions
// ============================================

/**
 * Validate COREUM address format
 */
export function isValidCoreumAddress(address: string): boolean {
  // COREUM addresses start with 'core1' and are bech32 format
  const coreumAddressRegex = /^core1[a-z0-9]{38,}$/;
  return coreumAddressRegex.test(address);
}

/**
 * Get user-friendly status message
 */
export function getStatusMessage(status: string): string {
  const statusMessages: Record<string, string> = {
    new: 'Transaction created',
    waiting: 'Waiting for payment',
    confirming: 'Confirming payment',
    exchanging: 'Exchanging currencies',
    sending: 'Sending COREUM to your wallet',
    finished: 'Transaction complete',
    failed: 'Transaction failed',
    refunded: 'Transaction refunded',
    expired: 'Transaction expired',
  };

  return statusMessages[status] || 'Unknown status';
}

/**
 * Check if transaction is in terminal state (completed, failed, etc.)
 */
export function isTerminalStatus(status: string): boolean {
  return ['finished', 'failed', 'refunded', 'expired'].includes(status);
}

/**
 * Check if transaction is still pending
 */
export function isPendingStatus(status: string): boolean {
  return ['new', 'waiting', 'confirming', 'exchanging', 'sending'].includes(status);
}

