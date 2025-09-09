import { Icon } from '@phosphor-icons/react';

export interface NormalizedUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  verified?: boolean;
  followers?: number;
  following?: number;
}

export interface ProofConfig {
  type: string;
  platform: Platform;
  contentType: ContentType;
  icon: Icon;
  color: string;
  urlRegex: RegExp;
  context: {
    endpointIdentifier: string;
    parser: (json: any) => NormalizedUser;
  };
  action: {
    endpointIdentifier: string;
    parser: (json: any) => any[];
  };
}

export type Platform = 
  | 'farcaster'
  | 'x'
  | 'tiktok'
  | 'instagram'
  | 'facebook'
  | 'linkedin';

export type ContentType =
  | 'like'
  | 'comment'
  | 'follow'
  | 'retweet'
  | 'share'
  | 'story_share'
  | 'reel_share'
  | 'post_share';

export interface ContentTypeConfig {
  type: ContentType;
  label: string;
  description: string;
  icon: Icon;
  available: boolean;
}

export interface PlatformConfig {
  platform: Platform;
  displayName: string;
  icon: Icon;
  color: string;
  contentTypes: ContentTypeConfig[];
}

export interface VerificationStep {
  id: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  title: string;
  description?: string;
  errorMessage?: string;
  icon?: Icon;
}

export interface VerificationResult {
  proofResult: boolean;
  targetId: string;
  totalItems: number;
  timestamp?: string;
  errorMessage?: string;
}

export interface VerificationFlow {
  platform: Platform;
  contentType: ContentType;
  steps: VerificationStep[];
  currentStep: number;
  targetUrl?: string;
  contextData?: NormalizedUser;
  actionData?: any[];
  result?: VerificationResult;
}