/**
 * Hidden Tokens Management
 * 
 * Utilities for hiding/unhiding tokens from the portfolio view
 */

const HIDDEN_TOKENS_KEY = 'hidden_tokens';

export interface HiddenToken {
  denom: string;
  symbol: string;
  hiddenAt: string;
}

/**
 * Get all hidden tokens for the current user
 */
export function getHiddenTokens(): HiddenToken[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(HIDDEN_TOKENS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading hidden tokens:', error);
    return [];
  }
}

/**
 * Hide a token
 */
export function hideToken(denom: string, symbol: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const hiddenTokens = getHiddenTokens();
    console.log('🔒 Hiding token:', { denom, symbol, currentHidden: hiddenTokens.length });
    
    // Check if already hidden
    if (hiddenTokens.some(t => t.denom === denom)) {
      console.log('⚠️ Token already hidden:', symbol);
      return;
    }
    
    // Add to hidden list
    const newHidden: HiddenToken = {
      denom,
      symbol,
      hiddenAt: new Date().toISOString(),
    };
    
    hiddenTokens.push(newHidden);
    localStorage.setItem(HIDDEN_TOKENS_KEY, JSON.stringify(hiddenTokens));
    
    console.log('💾 Saved to localStorage:', hiddenTokens);
    console.log('📢 Dispatching hiddenTokensChanged event');
    
    // Dispatch event for UI updates
    window.dispatchEvent(new CustomEvent('hiddenTokensChanged'));
    
    console.log('✅ Token hidden successfully:', symbol, 'Total hidden:', hiddenTokens.length);
  } catch (error) {
    console.error('❌ Error hiding token:', error);
  }
}

/**
 * Unhide a token
 */
export function unhideToken(denom: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const hiddenTokens = getHiddenTokens();
    const filtered = hiddenTokens.filter(t => t.denom !== denom);
    
    localStorage.setItem(HIDDEN_TOKENS_KEY, JSON.stringify(filtered));
    
    // Dispatch event for UI updates
    window.dispatchEvent(new CustomEvent('hiddenTokensChanged'));
    
    console.log('✅ Token unhidden');
  } catch (error) {
    console.error('Error unhiding token:', error);
  }
}

/**
 * Check if a token is hidden
 */
export function isTokenHidden(denom: string): boolean {
  const hiddenTokens = getHiddenTokens();
  const hidden = hiddenTokens.some(t => t.denom === denom);
  // console.log('🔍 Checking if hidden:', denom, '→', hidden);
  return hidden;
}

/**
 * Clear all hidden tokens
 */
export function clearAllHiddenTokens(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(HIDDEN_TOKENS_KEY, JSON.stringify([]));
    window.dispatchEvent(new CustomEvent('hiddenTokensChanged'));
    console.log('✅ All hidden tokens cleared');
  } catch (error) {
    console.error('Error clearing hidden tokens:', error);
  }
}

