/**
 * ============================================
 * COREUM TOKEN DATABASE UTILITIES
 * ============================================
 * 
 * Fast token and pair lookup utilities using the database
 * for optimal performance instead of live blockchain queries.
 * 
 * File: /utils/coreum/token-database.ts
 */

import { createSupabaseClient } from '@/utils/supabase/client';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface TokenInfo {
  denom: string;
  symbol: string;
  name: string;
  type: 'native' | 'cw20' | 'ibc' | 'xrpl';
  contract_address?: string;
  decimals: number;
  pair_count?: number;
}

export interface PairInfo {
  pair_id: string;
  source: string;
  symbol: string;
  base_asset: string;
  quote_asset: string;
  base_denom: string;
  quote_denom: string;
  pool_contract: string;
  liquidity_token?: string;
  base_decimals: number;
  quote_decimals: number;
  base_symbol?: string;
  base_name?: string;
  base_type?: string;
  quote_symbol?: string;
  quote_name?: string;
  quote_type?: string;
}

export interface PriceInfo {
  pair_id: string;
  price: number;
  price_change_24h?: number;
  volume_24h?: number;
  liquidity?: number;
  reserve_base?: number;
  reserve_quote?: number;
  last_updated: string;
}

// ============================================
// TOKEN LOOKUP FUNCTIONS
// ============================================

/**
 * Get token information by denomination
 */
export async function getTokenByDenom(denom: string): Promise<TokenInfo | null> {
  try {
    const supabase = createSupabaseClient();
    
    const { data, error } = await supabase
      .from('coreum_tokens')
      .select('*')
      .eq('denom', denom)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Token not found
      }
      throw error;
    }

    return {
      denom: data.denom,
      symbol: data.symbol,
      name: data.name,
      type: data.type,
      contract_address: data.contract_address,
      decimals: data.decimals
    };
  } catch (error) {
    console.error('Error fetching token by denom:', error);
    return null;
  }
}

/**
 * Get token information by symbol
 */
export async function getTokenBySymbol(symbol: string): Promise<TokenInfo | null> {
  try {
    const supabase = createSupabaseClient();
    
    const { data, error } = await supabase
      .from('coreum_tokens')
      .select('*')
      .eq('symbol', symbol)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Token not found
      }
      throw error;
    }

    return {
      denom: data.denom,
      symbol: data.symbol,
      name: data.name,
      type: data.type,
      contract_address: data.contract_address,
      decimals: data.decimals
    };
  } catch (error) {
    console.error('Error fetching token by symbol:', error);
    return null;
  }
}

/**
 * Search tokens by symbol or name
 */
export async function searchTokens(query: string, limit: number = 20): Promise<TokenInfo[]> {
  try {
    const supabase = createSupabaseClient();
    
    const { data, error } = await supabase
      .from('coreum_tokens')
      .select('*')
      .or(`symbol.ilike.%${query}%,name.ilike.%${query}%`)
      .eq('is_active', true)
      .limit(limit);

    if (error) {
      throw error;
    }

    return data.map(token => ({
      denom: token.denom,
      symbol: token.symbol,
      name: token.name,
      type: token.type,
      contract_address: token.contract_address,
      decimals: token.decimals
    }));
  } catch (error) {
    console.error('Error searching tokens:', error);
    return [];
  }
}

/**
 * Get all active tokens with pair counts
 */
export async function getAllTokensWithPairs(): Promise<TokenInfo[]> {
  try {
    const supabase = createSupabaseClient();
    
    const { data, error } = await supabase
      .from('active_tokens_with_pairs')
      .select('*')
      .order('pair_count', { ascending: false });

    if (error) {
      throw error;
    }

    return data.map(token => ({
      denom: token.denom,
      symbol: token.symbol,
      name: token.name,
      type: token.type,
      contract_address: token.contract_address,
      decimals: token.decimals,
      pair_count: token.pair_count
    }));
  } catch (error) {
    console.error('Error fetching tokens with pairs:', error);
    return [];
  }
}

// ============================================
// PAIR LOOKUP FUNCTIONS
// ============================================

/**
 * Get pair information by pair ID
 */
export async function getPairById(pairId: string): Promise<PairInfo | null> {
  try {
    const supabase = createSupabaseClient();
    
    const { data, error } = await supabase
      .from('active_pairs_with_tokens')
      .select('*')
      .eq('pair_id', pairId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Pair not found
      }
      throw error;
    }

    return {
      pair_id: data.pair_id,
      source: data.source,
      symbol: data.symbol,
      base_asset: data.base_asset,
      quote_asset: data.quote_asset,
      base_denom: data.base_denom,
      quote_denom: data.quote_denom,
      pool_contract: data.pool_contract,
      liquidity_token: data.liquidity_token,
      base_decimals: data.base_decimals,
      quote_decimals: data.quote_decimals,
      base_symbol: data.base_symbol,
      base_name: data.base_name,
      base_type: data.base_type,
      quote_symbol: data.quote_symbol,
      quote_name: data.quote_name,
      quote_type: data.quote_type
    };
  } catch (error) {
    console.error('Error fetching pair by ID:', error);
    return null;
  }
}

/**
 * Get pairs by base token denomination
 */
export async function getPairsByBaseToken(baseDenom: string): Promise<PairInfo[]> {
  try {
    const supabase = createSupabaseClient();
    
    const { data, error } = await supabase
      .from('active_pairs_with_tokens')
      .select('*')
      .eq('base_denom', baseDenom)
      .order('symbol');

    if (error) {
      throw error;
    }

    return data.map(pair => ({
      pair_id: pair.pair_id,
      source: pair.source,
      symbol: pair.symbol,
      base_asset: pair.base_asset,
      quote_asset: pair.quote_asset,
      base_denom: pair.base_denom,
      quote_denom: pair.quote_denom,
      pool_contract: pair.pool_contract,
      liquidity_token: pair.liquidity_token,
      base_decimals: pair.base_decimals,
      quote_decimals: pair.quote_decimals,
      base_symbol: pair.base_symbol,
      base_name: pair.base_name,
      base_type: pair.base_type,
      quote_symbol: pair.quote_symbol,
      quote_name: pair.quote_name,
      quote_type: pair.quote_type
    }));
  } catch (error) {
    console.error('Error fetching pairs by base token:', error);
    return [];
  }
}

/**
 * Get pairs by quote token denomination
 */
export async function getPairsByQuoteToken(quoteDenom: string): Promise<PairInfo[]> {
  try {
    const supabase = createSupabaseClient();
    
    const { data, error } = await supabase
      .from('active_pairs_with_tokens')
      .select('*')
      .eq('quote_denom', quoteDenom)
      .order('symbol');

    if (error) {
      throw error;
    }

    return data.map(pair => ({
      pair_id: pair.pair_id,
      source: pair.source,
      symbol: pair.symbol,
      base_asset: pair.base_asset,
      quote_asset: pair.quote_asset,
      base_denom: pair.base_denom,
      quote_denom: pair.quote_denom,
      pool_contract: pair.pool_contract,
      liquidity_token: pair.liquidity_token,
      base_decimals: pair.base_decimals,
      quote_decimals: pair.quote_decimals,
      base_symbol: pair.base_symbol,
      base_name: pair.base_name,
      base_type: pair.base_type,
      quote_symbol: pair.quote_symbol,
      quote_name: pair.quote_name,
      quote_type: pair.quote_type
    }));
  } catch (error) {
    console.error('Error fetching pairs by quote token:', error);
    return [];
  }
}

/**
 * Find pairs between two specific tokens
 */
export async function findPairBetweenTokens(token1Denom: string, token2Denom: string): Promise<PairInfo[]> {
  try {
    const supabase = createSupabaseClient();
    
    const { data, error } = await supabase
      .from('active_pairs_with_tokens')
      .select('*')
      .or(`and(base_denom.eq.${token1Denom},quote_denom.eq.${token2Denom}),and(base_denom.eq.${token2Denom},quote_denom.eq.${token1Denom})`)
      .order('symbol');

    if (error) {
      throw error;
    }

    return data.map(pair => ({
      pair_id: pair.pair_id,
      source: pair.source,
      symbol: pair.symbol,
      base_asset: pair.base_asset,
      quote_asset: pair.quote_asset,
      base_denom: pair.base_denom,
      quote_denom: pair.quote_denom,
      pool_contract: pair.pool_contract,
      liquidity_token: pair.liquidity_token,
      base_decimals: pair.base_decimals,
      quote_decimals: pair.quote_decimals,
      base_symbol: pair.base_symbol,
      base_name: pair.base_name,
      base_type: pair.base_type,
      quote_symbol: pair.quote_symbol,
      quote_name: pair.quote_name,
      quote_type: pair.quote_type
    }));
  } catch (error) {
    console.error('Error finding pair between tokens:', error);
    return [];
  }
}

/**
 * Search pairs by symbol
 */
export async function searchPairs(query: string, limit: number = 20): Promise<PairInfo[]> {
  try {
    const supabase = createSupabaseClient();
    
    const { data, error } = await supabase
      .from('active_pairs_with_tokens')
      .select('*')
      .ilike('symbol', `%${query}%`)
      .limit(limit)
      .order('symbol');

    if (error) {
      throw error;
    }

    return data.map(pair => ({
      pair_id: pair.pair_id,
      source: pair.source,
      symbol: pair.symbol,
      base_asset: pair.base_asset,
      quote_asset: pair.quote_asset,
      base_denom: pair.base_denom,
      quote_denom: pair.quote_denom,
      pool_contract: pair.pool_contract,
      liquidity_token: pair.liquidity_token,
      base_decimals: pair.base_decimals,
      quote_decimals: pair.quote_decimals,
      base_symbol: pair.base_symbol,
      base_name: pair.base_name,
      base_type: pair.base_type,
      quote_symbol: pair.quote_symbol,
      quote_name: pair.quote_name,
      quote_type: pair.quote_type
    }));
  } catch (error) {
    console.error('Error searching pairs:', error);
    return [];
  }
}

/**
 * Get all pairs from a specific DEX source
 */
export async function getPairsBySource(source: string): Promise<PairInfo[]> {
  try {
    const supabase = createSupabaseClient();
    
    const { data, error } = await supabase
      .from('active_pairs_with_tokens')
      .select('*')
      .eq('source', source)
      .order('symbol');

    if (error) {
      throw error;
    }

    return data.map(pair => ({
      pair_id: pair.pair_id,
      source: pair.source,
      symbol: pair.symbol,
      base_asset: pair.base_asset,
      quote_asset: pair.quote_asset,
      base_denom: pair.base_denom,
      quote_denom: pair.quote_denom,
      pool_contract: pair.pool_contract,
      liquidity_token: pair.liquidity_token,
      base_decimals: pair.base_decimals,
      quote_decimals: pair.quote_decimals,
      base_symbol: pair.base_symbol,
      base_name: pair.base_name,
      base_type: pair.base_type,
      quote_symbol: pair.quote_symbol,
      quote_name: pair.quote_name,
      quote_type: pair.quote_type
    }));
  } catch (error) {
    console.error('Error fetching pairs by source:', error);
    return [];
  }
}

// ============================================
// PRICE FUNCTIONS
// ============================================

/**
 * Get cached price for a pair
 */
export async function getCachedPrice(pairId: string): Promise<PriceInfo | null> {
  try {
    const supabase = createSupabaseClient();
    
    const { data, error } = await supabase
      .from('coreum_prices')
      .select('*')
      .eq('pair_id', pairId)
      .order('last_updated', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No price data found
      }
      throw error;
    }

    return {
      pair_id: data.pair_id,
      price: parseFloat(data.price),
      price_change_24h: data.price_change_24h ? parseFloat(data.price_change_24h) : undefined,
      volume_24h: data.volume_24h ? parseFloat(data.volume_24h) : undefined,
      liquidity: data.liquidity ? parseFloat(data.liquidity) : undefined,
      reserve_base: data.reserve_base ? parseFloat(data.reserve_base) : undefined,
      reserve_quote: data.reserve_quote ? parseFloat(data.reserve_quote) : undefined,
      last_updated: data.last_updated
    };
  } catch (error) {
    console.error('Error fetching cached price:', error);
    return null;
  }
}

/**
 * Update cached price for a pair
 */
export async function updateCachedPrice(priceData: Omit<PriceInfo, 'last_updated'>): Promise<boolean> {
  try {
    const supabase = createSupabaseClient();
    
    const { error } = await supabase
      .from('coreum_prices')
      .upsert({
        pair_id: priceData.pair_id,
        price: priceData.price.toString(),
        price_change_24h: priceData.price_change_24h?.toString(),
        volume_24h: priceData.volume_24h?.toString(),
        liquidity: priceData.liquidity?.toString(),
        reserve_base: priceData.reserve_base?.toString(),
        reserve_quote: priceData.reserve_quote?.toString(),
        last_updated: new Date().toISOString()
      });

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error updating cached price:', error);
    return false;
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get token statistics
 */
export async function getTokenStats(): Promise<{
  totalTokens: number;
  totalPairs: number;
  tokensByType: Record<string, number>;
  pairsBySource: Record<string, number>;
}> {
  try {
    const supabase = createSupabaseClient();
    
    // Get token counts by type
    const { data: tokenTypes, error: tokenError } = await supabase
      .from('coreum_tokens')
      .select('type')
      .eq('is_active', true);

    if (tokenError) throw tokenError;

    // Get pair counts by source
    const { data: pairSources, error: pairError } = await supabase
      .from('coreum_pairs')
      .select('source')
      .eq('is_active', true);

    if (pairError) throw pairError;

    // Count tokens by type
    const tokensByType: Record<string, number> = {};
    tokenTypes.forEach(token => {
      tokensByType[token.type] = (tokensByType[token.type] || 0) + 1;
    });

    // Count pairs by source
    const pairsBySource: Record<string, number> = {};
    pairSources.forEach(pair => {
      pairsBySource[pair.source] = (pairsBySource[pair.source] || 0) + 1;
    });

    return {
      totalTokens: tokenTypes.length,
      totalPairs: pairSources.length,
      tokensByType,
      pairsBySource
    };
  } catch (error) {
    console.error('Error fetching token stats:', error);
    return {
      totalTokens: 0,
      totalPairs: 0,
      tokensByType: {},
      pairsBySource: {}
    };
  }
}
