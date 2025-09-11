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

export enum InstagramAccountType {
  PERSONAL = 'personal',
  BUSINESS = 'business',
  CREATOR = 'creator'
}

// Instagram-specific metadata interface
export interface InstagramMetadata {
  // Basic Profile Info (100% coverage, auth-required)
  followerCount: number;
  followingCount: number;
  postCount: number;
  isVerified: boolean;
  accountType: InstagramAccountType;
  category?: string; // Business/Creator only
  biography?: string;

  // Performance Metrics (time-based)
  profileVisits: {
    sevenDays: number;
    thirtyDays: number;
    ninetyDays: number;
  };

  accountsReached: {
    sevenDays: number;
    thirtyDays: number;
  };

  accountsEngaged: {
    sevenDays: number;
    thirtyDays: number;
  };

  // Growth Metrics
  followerGrowth: {
    sevenDays: number; // Percentage
    thirtyDays: number;
    ninetyDays: number;
  };

  engagementRate: number;

  // Demographics (Professional accounts only - 85-90% coverage)
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

  // Content Performance Trends
  contentEngagementTrend?: Array<{
    postId?: string;
    engagementValue: number;
  }>;

  // Collection Metadata
  lastCollectedAt: string; // ISO timestamp
  collectionErrors?: Array<string>; // e.g., ['Non-professional account, demographics skipped']

  // UI State
  isAdding?: boolean; // Whether account is currently being added

  // Raw data for debugging/future extensibility
  rawData?: Record<string, any>;
}

export interface SocialAccount {
  id: string;
  user_id: string;
  platform: Platform;
  handle: string;
  platform_user_id: string | null;
  is_verified: boolean;
  last_verified_at: string | null;
  metadata?: InstagramMetadata;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string | null;
  status: UserStatus;
  created_at: string;
  updated_at: string;
  wallet_address: string;
  metadata: Record<string, any>;
  pendingEarnings: number;
  availableEarnings: number;
  dailyActionsCompleted: number;
  dailyActionsRequired: number;
  socialAccounts: SocialAccount[];
}
