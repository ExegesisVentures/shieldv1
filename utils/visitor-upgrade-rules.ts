/**
 * Rules for when to show upgrade prompts to visitors
 * Visitors start with localStorage only, we prompt them to upgrade to Public User at strategic moments
 */

/**
 * Check if user is authenticated
 * If authenticated, don't show visitor upgrade prompts
 */
async function isUserAuthenticated(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  
  try {
    const { createSupabaseClient } = await import('@/utils/supabase/client');
    const supabase = createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    return !!user;
  } catch (error) {
    console.error("Error checking authentication:", error);
    return false;
  }
}

export interface UpgradeRule {
  id: string;
  name: string;
  description: string;
  checkTrigger: () => boolean;
  priority: number; // 1 = highest
}

/**
 * Get visitor wallet count from localStorage
 */
function getVisitorWalletCount(): number {
  if (typeof window === 'undefined') return 0;
  const addresses = JSON.parse(localStorage.getItem('visitor_addresses') || '[]');
  return addresses.length;
}

/**
 * Get visitor session duration in minutes
 */
function getVisitorSessionDuration(): number {
  if (typeof window === 'undefined') return 0;
  const sessionStart = localStorage.getItem('visitor_session_start');
  if (!sessionStart) {
    localStorage.setItem('visitor_session_start', Date.now().toString());
    return 0;
  }
  const elapsed = Date.now() - parseInt(sessionStart);
  return Math.floor(elapsed / 1000 / 60); // minutes
}

/**
 * Check if visitor has dismissed upgrade prompts
 */
function hasUserDismissedUpgrade(ruleId: string): boolean {
  if (typeof window === 'undefined') return false;
  const dismissed = JSON.parse(localStorage.getItem('upgrade_dismissed') || '{}');
  return dismissed[ruleId] === true;
}

/**
 * Mark upgrade prompt as dismissed
 */
export function dismissUpgradePrompt(ruleId: string) {
  if (typeof window === 'undefined') return;
  const dismissed = JSON.parse(localStorage.getItem('upgrade_dismissed') || '{}');
  dismissed[ruleId] = true;
  localStorage.setItem('upgrade_dismissed', JSON.stringify(dismissed));
}

/**
 * All upgrade rules - checked in priority order
 */
export const UPGRADE_RULES: UpgradeRule[] = [
  {
    id: 'multiple_wallets',
    name: 'Multiple Wallets Connected',
    description: 'User has connected 3+ wallets',
    priority: 1,
    checkTrigger: () => {
      if (hasUserDismissedUpgrade('multiple_wallets')) return false;
      return getVisitorWalletCount() >= 3;
    },
  },
  {
    id: 'extended_session',
    name: 'Extended Session',
    description: 'User has been active for 5+ minutes',
    priority: 2,
    checkTrigger: () => {
      if (hasUserDismissedUpgrade('extended_session')) return false;
      return getVisitorSessionDuration() >= 5;
    },
  },
  {
    id: 'return_visit',
    name: 'Return Visit',
    description: 'User has returned to the site',
    priority: 3,
    checkTrigger: () => {
      if (hasUserDismissedUpgrade('return_visit')) return false;
      const visitCount = parseInt(localStorage.getItem('visit_count') || '0');
      if (visitCount === 0) {
        localStorage.setItem('visit_count', '1');
        return false;
      }
      localStorage.setItem('visit_count', (visitCount + 1).toString());
      return visitCount >= 2; // 3rd visit
    },
  },
  {
    id: 'portfolio_value',
    name: 'Significant Portfolio',
    description: 'User has $100+ portfolio value',
    priority: 4,
    checkTrigger: () => {
      if (hasUserDismissedUpgrade('portfolio_value')) return false;
      const totalValue = parseFloat(localStorage.getItem('portfolio_value_usd') || '0');
      return totalValue >= 100;
    },
  },
];

/**
 * Check which upgrade rule should trigger (if any)
 * Returns the highest priority rule that triggers
 */
export async function checkUpgradeTriggers(): Promise<UpgradeRule | null> {
  // Don't show prompts if user is authenticated
  const authenticated = await isUserAuthenticated();
  if (authenticated) {
    console.log("🔐 [UpgradeRules] User authenticated, skipping visitor prompts");
    return null;
  }
  
  const triggeredRules = UPGRADE_RULES.filter(rule => rule.checkTrigger());
  
  if (triggeredRules.length === 0) return null;
  
  // Sort by priority (lower number = higher priority)
  triggeredRules.sort((a, b) => a.priority - b.priority);
  
  return triggeredRules[0];
}

/**
 * Store portfolio value for trigger checks
 */
export function updatePortfolioValue(valueUsd: number) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('portfolio_value_usd', valueUsd.toString());
}

