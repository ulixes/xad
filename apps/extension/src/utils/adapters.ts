import { SocialAccount, Platform } from '@/src/types';

// Home component's ConnectedAccount interface (from @xad/ui)
interface ConnectedAccount {
  platform: string;
  handle: string;
  availableActions: number;
  isVerifying?: boolean;
}

/**
 * Calculates available actions for a social account based on verification status
 * and platform-specific business rules
 */
function calculateAvailableActions(account: SocialAccount): number {
  if (!account.is_verified) return 0;
  
  // Platform-specific action limits
  switch (account.platform) {
    case Platform.INSTAGRAM:
      return account.metadata?.followerCount ? Math.min(10, Math.floor(account.metadata.followerCount / 100)) : 5;
    case Platform.TIKTOK:
      return 8;
    case Platform.TWITTER:
      return 6;
    default:
      return 5;
  }
}

/**
 * Determines if an account needs verification/re-verification or is currently being added
 */
function needsReverification(account: SocialAccount): boolean {
  // Check if account is being added
  if (account.metadata?.isAdding) return true;
  
  if (!account.is_verified) return true;
  
  // Re-verify if last verification was over 30 days ago
  if (account.last_verified_at) {
    const lastVerified = new Date(account.last_verified_at);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return lastVerified < thirtyDaysAgo;
  }
  
  return true;
}

/**
 * Adapts SocialAccount array to ConnectedAccount array for Home component UI
 * Transforms backend SocialAccount model to UI ConnectedAccount interface
 */
export function adaptSocialAccountsForUI(
  socialAccounts: SocialAccount[], 
  accountActions: Record<string, number> = {},
  verifyingAccounts: Set<string> = new Set()
): ConnectedAccount[] {
  return socialAccounts.map(account => ({
    platform: account.platform,
    handle: account.handle,
    availableActions: accountActions[account.id] || 0,
    isVerifying: verifyingAccounts.has(account.id) || !account.is_verified
  }));
}