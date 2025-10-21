/**
 * Address utility functions for formatting and copying wallet addresses
 * 
 * File: /utils/address-utils.ts
 */

/**
 * Validate if a string is a valid Coreum address
 * - Bech32-style: must start with "core1"
 * - Case-insensitive (we normalize to lowercase)
 * - Allow a reasonable range for the data part length (bech32 varies by chain)
 */
export function isValidCoreumAddress(address: string): boolean {
  if (!address || typeof address !== 'string') {
    return false;
  }

  const normalized = address.trim().toLowerCase();
  if (!normalized.startsWith('core1')) return false;

  // Looser bech32 check: letters+digits only, data length 38-60 chars after "core1"
  // This avoids rejecting valid addresses due to strict length assumptions while
  // still filtering obvious invalid inputs.
  const coreumAddressRegex = /^core1[0-9a-z]{38,60}$/;
  return coreumAddressRegex.test(normalized);
}

/**
 * Format an address to show last 4-5 digits with dots prefix
 * Example: "core1mgvlgvh2hfw5pgdqc79up3du69v2z3t8qz4kwg" -> "...qz4kwg"
 */
export function formatAddressSnippet(address: string, digits: number = 5): string {
  if (!address || address.length <= digits) {
    return address;
  }
  
  const lastDigits = address.slice(-digits);
  return `...${lastDigits}`;
}

/**
 * Copy text to clipboard with user feedback
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    
    // Fallback for older browsers
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const result = document.execCommand('copy');
      document.body.removeChild(textArea);
      return result;
    } catch (fallbackError) {
      console.error('Fallback copy failed:', fallbackError);
      return false;
    }
  }
}

/**
 * Show a temporary toast notification
 * This is a simple implementation - you might want to use a proper toast library
 */
export function showToast(message: string, type: 'success' | 'error' = 'success') {
  // Create a simple toast element
  const toast = document.createElement('div');
  toast.className = `fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-white text-sm font-medium transition-all duration-300 ${
    type === 'success' ? 'bg-green-500' : 'bg-red-500'
  }`;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  // Auto remove after 3 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 300);
  }, 3000);
}
