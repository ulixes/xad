export enum Platform {
  INSTAGRAM = 'instagram',
  TWITTER = 'twitter',
  TIKTOK = 'tiktok',
  YOUTUBE = 'youtube'
}

export enum UserStatus {
  PENDING_VERIFICATION = 'pending_verification',
  VERIFIED = 'verified',
  SUSPENDED = 'suspended'
}

export enum ActionType {
  LIKE = 'like',
  COMMENT = 'comment',
  SHARE = 'share',
  FOLLOW = 'follow',
  RETWEET = 'retweet',
  UPVOTE = 'upvote',
  AWARD = 'award'
}

export enum InstagramAccountType {
  PERSONAL = 'personal',
  BUSINESS = 'business',
  CREATOR = 'creator'
}

// Base interface for all platform metadata
export interface BasePlatformMetadata {
  lastCollectedAt: string; // ISO timestamp
  collectionErrors?: Array<string>;
  rawData?: Record<string, any>; // For debugging/future extensibility
}

// Instagram-specific metadata interface
export interface InstagramMetadata extends BasePlatformMetadata {
  // Basic Profile Info (from edit page)
  profile: {
    followerCount: number;
    followingCount: number;
    postCount: number;
    isVerified: boolean;
    accountType: InstagramAccountType;
    category?: string; // Business/Creator only
    biography?: string;
    profilePicUrl?: string;
    isPrivate?: boolean;
    isBusinessAccount?: boolean;
    isProfessional?: boolean;
    externalUrl?: string;
    locationCountry?: string;
    locationCity?: string;
    mediaCount?: number;
  };

  // Insights metrics (from insights page - requires business/creator account)
  insights?: {
    // Performance Metrics (time-based)
    profileVisits?: {
      sevenDays?: number;
      thirtyDays?: number;
      ninetyDays?: number;
    };

    accountsReached?: {
      sevenDays?: number;
      thirtyDays?: number;
    };

    accountsEngaged?: {
      sevenDays?: number;
      thirtyDays?: number;
    };

    // Growth Metrics
    followerGrowth?: {
      sevenDays?: number; // Percentage
      thirtyDays?: number;
      ninetyDays?: number;
    };

    engagementRate?: number;

    // Content Performance
    videoContentRatio?: number;
    contentTypePerformance?: Array<{
      mediaType: string; // photo, video, reel
      interactions: number;
    }>;

    contentEngagementTrend?: Array<{
      postId?: string;
      engagementValue: number;
    }>;

    // Demographics (Professional accounts only)
    audienceGender?: Array<{
      gender: 'male' | 'female' | 'unknown';
      percentage: number;
    }>;

    audienceAge?: Array<{
      ageRange: string; // e.g., '18-24', '25-34'
      percentage: number;
    }>;

    topLocations?: Array<{
      locationName: string;
      percentage?: number;
    }>;
  };
}

// Future platform metadata interfaces
export interface TwitterMetadata extends BasePlatformMetadata {
  // Twitter-specific fields
}

export interface TikTokMetadata extends BasePlatformMetadata {
  // TikTok-specific fields
}

export interface YouTubeMetadata extends BasePlatformMetadata {
  // YouTube-specific fields
}

// Union type for all platform metadata
export type PlatformMetadata = 
  | InstagramMetadata 
  | TwitterMetadata 
  | TikTokMetadata 
  | YouTubeMetadata;

export interface SocialAccount {
  id: string;
  userId: string;
  platform: Platform;
  handle: string;
  platformUserId: string | null;
  isVerified: boolean;
  lastVerifiedAt: string | null;
  // Platform-specific metadata stored as JSONB in database
  metadata?: PlatformMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface EligibleAction {
  id: string;
  campaignId?: string;
  platform: Platform;
  type?: ActionType;  // For consistency with UI expectations
  actionType: ActionType;
  target: string;
  targetUrl?: string;  // Clean URL without comment content
  title: string;
  description: string | null;
  price: number;
  maxVolume: number;
  currentVolume: number;
  eligibilityCriteria: Record<string, any>;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  // Metadata including comment content for comment actions
  metadata?: Record<string, any>;
  // Added by the API endpoint
  availableVolume?: number;
  percentageComplete?: number;
  // User's action run data if exists
  userActionRun?: {
    id: string;
    status: string;
    startedAt: string | Date;
    completedAt?: string | Date | null;
    rewardAmount?: number;
  };
}

export interface EligibleActionsResponse {
  accountId: string;
  platform: string;
  accountMetadata?: any;
  actions: EligibleAction[];
  summary: {
    available: number;
    inProgress: number;
    completedToday: number;
  };
  totalEligibleActions: number;
}

export interface User {
  id: string;
  email: string | null;
  status: UserStatus;
  created_at: string;
  updated_at: string;
  walletAddress: string | null;
  metadata: Record<string, any>;
  totalEarned: number;
  availableBalance: number;
  // UI-specific fields (not in database, calculated client-side)
  pendingEarnings?: number;
  availableEarnings?: number;
  dailyActionsCompleted?: number;
  dailyActionsRequired?: number;
  socialAccounts?: SocialAccount[];
}
