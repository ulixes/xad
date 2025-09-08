import { Platform, ContentType } from '../types/proof-config';

export interface UITemplate {
  verified: string;
  not_found: string;
  target: string;
  stats: string;
  error: string;
}

export const UI_TEMPLATES: Record<string, UITemplate> = {
  'x_like': {
    verified: "VERIFIED - User has liked this tweet",
    not_found: "NOT FOUND - User has not liked this tweet",
    target: "Target Tweet: {targetId}",
    stats: "Searched {totalItems} liked tweets",
    error: "ERROR - Could not verify tweet like"
  },
  'x_comment': {
    verified: "VERIFIED - User has commented on this tweet",
    not_found: "NOT FOUND - User has not commented on this tweet",
    target: "Target Tweet: {targetId}",
    stats: "Searched {totalItems} comments",
    error: "ERROR - Could not verify tweet comment"
  },
  'x_follow': {
    verified: "VERIFIED - User is following this account",
    not_found: "NOT FOUND - User is not following this account",
    target: "Target Account: @{targetId}",
    stats: "Checked {totalItems} following accounts",
    error: "ERROR - Could not verify following status"
  },
  'instagram_like': {
    verified: "VERIFIED - User has liked this post",
    not_found: "NOT FOUND - User has not liked this post",
    target: "Target Post: {targetId}",
    stats: "Searched {totalItems} liked posts",
    error: "ERROR - Could not verify post like"
  },
  'generic': {
    verified: "VERIFIED - User has performed this action",
    not_found: "NOT FOUND - User has not performed this action",
    target: "Target: {targetId}",
    stats: "Searched {totalItems} items",
    error: "ERROR - Verification failed"
  }
};

export function getUIText(
  platform: Platform,
  contentType: ContentType,
  contextData: { username: string; displayName: string },
  result: {
    proofResult?: boolean;
    targetId: string;
    totalItems: number;
    timestamp?: string;
    errorMessage?: string;
  }
) {
  const templateKey = `${platform}_${contentType}`;
  const template = UI_TEMPLATES[templateKey] || UI_TEMPLATES['generic'];
  
  let status: string;
  if (result.errorMessage) {
    status = template.error;
  } else if (result.proofResult === true) {
    status = template.verified;
  } else {
    status = template.not_found;
  }

  return {
    status,
    user: `@${contextData.username} (${contextData.displayName})`,
    target: template.target.replace('{targetId}', result.targetId || 'unknown'),
    stats: template.stats.replace('{totalItems}', result.totalItems?.toString() || '0'),
    timestamp: result.timestamp 
      ? `Verified at ${new Date(result.timestamp).toLocaleTimeString()}`
      : `Verified at ${new Date().toLocaleTimeString()}`
  };
}