export type OperatorType = '>' | '<' | '=' | '>=' | '<=' | '!=' | 'contains' | 'in' | 'has_achievement' | 'min_unlocked' | 'can_perform';
export type AttributeType = 'number' | 'string' | 'boolean' | 'date' | 'achievement' | 'tier' | 'action';
export type LogicalOperator = 'AND' | 'OR';

export interface SchemaParam {
  name: string;
  type: AttributeType;
  required: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
}

export interface PlatformSchema {
  id: string;
  platform: string;
  category: string;
  provider: 'zkpass' | 'camp' | 'custom';
  displayName: string;
  attribute: string;
  type: AttributeType;
  operators: OperatorType[];
  params?: SchemaParam[];
  icon?: string;
}

// X (Twitter) Platform Schemas
export const xPlatformSchemas: PlatformSchema[] = [
  {
    id: 'x-follower-count',
    platform: 'X',
    category: 'Social',
    provider: 'zkpass',
    displayName: 'Follower Count',
    attribute: 'followers_count',
    type: 'number',
    operators: ['>', '<', '=', '>=', '<=']
  },
  {
    id: 'x-blue-badge',
    platform: 'X',
    category: 'Social',
    provider: 'zkpass',
    displayName: 'Blue Badge Verified',
    attribute: 'is_verified',
    type: 'boolean',
    operators: ['=']
  },
  {
    id: 'x-follows-account',
    platform: 'X',
    category: 'Social',
    provider: 'zkpass',
    displayName: 'Follows Account',
    attribute: 'follows',
    type: 'string',
    operators: ['contains'],
    params: [
      {
        name: 'account_handle',
        type: 'string',
        required: true,
        placeholder: '@elonmusk'
      }
    ]
  }
];

// Instagram Platform Schemas
export const instagramSchemas: PlatformSchema[] = [
  {
    id: 'ig-follower-count',
    platform: 'Instagram',
    category: 'Social',
    provider: 'zkpass',
    displayName: 'Follower Count',
    attribute: 'followers_count',
    type: 'number',
    operators: ['>', '<', '=', '>=', '<=']
  }
];

// LinkedIn Platform Schemas
export const linkedinSchemas: PlatformSchema[] = [
  {
    id: 'linkedin-connections',
    platform: 'LinkedIn',
    category: 'Professional',
    provider: 'zkpass',
    displayName: 'Connection Count',
    attribute: 'connections_count',
    type: 'number',
    operators: ['>', '<', '=', '>=', '<=']
  },
  {
    id: 'linkedin-account-age',
    platform: 'LinkedIn',
    category: 'Professional',
    provider: 'zkpass',
    displayName: 'Account Age',
    attribute: 'created_date',
    type: 'date',
    operators: ['>', '<', '>=', '<=']
  }
];

// Facebook Platform Schemas
export const facebookSchemas: PlatformSchema[] = [
  {
    id: 'fb-account-age',
    platform: 'Facebook',
    category: 'Social',
    provider: 'zkpass',
    displayName: 'Account Age',
    attribute: 'created_date',
    type: 'date',
    operators: ['>', '<', '>=', '<=']
  }
];

// Farcaster Platform Schemas
export const farcasterSchemas: PlatformSchema[] = [
  {
    id: 'farcaster-followers',
    platform: 'Farcaster',
    category: 'Web3 Social',
    provider: 'zkpass',
    displayName: 'Follower Count',
    attribute: 'followers_count',
    type: 'number',
    operators: ['>', '<', '=', '>=', '<=']
  }
];

// YouTube Platform Schemas
export const youtubeSchemas: PlatformSchema[] = [
  {
    id: 'youtube-subscribers',
    platform: 'YouTube',
    category: 'Video',
    provider: 'zkpass',
    displayName: 'Subscriber Count',
    attribute: 'subscriber_count',
    type: 'number',
    operators: ['>', '<', '=', '>=', '<=']
  }
];

// Reddit Platform Schemas with Achievements
export const redditSchemas: PlatformSchema[] = [
  {
    id: 'reddit-account-age',
    platform: 'Reddit',
    category: 'Social',
    provider: 'zkpass',
    displayName: 'Account Age',
    attribute: 'account_age_days',
    type: 'number',
    operators: ['>', '<', '=', '>=', '<=']
  },
  {
    id: 'reddit-top-commenter',
    platform: 'Reddit',
    category: 'Social',
    provider: 'zkpass',
    displayName: 'Top Commenter Achievement',
    attribute: 'top_commenter',
    type: 'achievement',
    operators: ['has_achievement', 'min_unlocked'],
    params: [
      {
        name: 'tier',
        type: 'tier',
        required: true,
        placeholder: 'Select tier',
        options: [
          { value: 'monthly-top-25-commenter', label: 'Top 25% Commenter' },
          { value: 'monthly-top-10-commenter', label: 'Top 10% Commenter' },
          { value: 'monthly-top-5-commenter', label: 'Top 5% Commenter' },
          { value: 'monthly-top-1-commenter', label: 'Top 1% Commenter' }
        ]
      }
    ]
  },
  {
    id: 'reddit-top-poster',
    platform: 'Reddit',
    category: 'Social',
    provider: 'zkpass',
    displayName: 'Top Poster Achievement',
    attribute: 'top_poster',
    type: 'achievement',
    operators: ['has_achievement', 'min_unlocked'],
    params: [
      {
        name: 'tier',
        type: 'tier',
        required: true,
        placeholder: 'Select tier',
        options: [
          { value: 'monthly-top-25-poster', label: 'Top 25% Poster' },
          { value: 'monthly-top-10-poster', label: 'Top 10% Poster' },
          { value: 'monthly-top-5-poster', label: 'Top 5% Poster' },
          { value: 'monthly-top-1-poster', label: 'Top 1% Poster' }
        ]
      }
    ]
  }
];

// TikTok Platform Schemas
export const tiktokSchemas: PlatformSchema[] = [
  {
    id: 'tiktok-followers',
    platform: 'TikTok',
    category: 'Video',
    provider: 'zkpass',
    displayName: 'Followers',
    attribute: 'totalFollowers',
    type: 'number',
    operators: ['>', '<', '=', '>=', '<=']
  },
  {
    id: 'tiktok-video-views',
    platform: 'TikTok',
    category: 'Video',
    provider: 'zkpass',
    displayName: 'Video Views',
    attribute: 'videoViews',
    type: 'number',
    operators: ['>', '<', '=', '>=', '<=']
  },
  {
    id: 'tiktok-profile-views',
    platform: 'TikTok',
    category: 'Video',
    provider: 'zkpass',
    displayName: 'Profile Views',
    attribute: 'profileViews',
    type: 'number',
    operators: ['>', '<', '=', '>=', '<=']
  },
  {
    id: 'tiktok-likes',
    platform: 'TikTok',
    category: 'Video',
    provider: 'zkpass',
    displayName: 'Total Likes',
    attribute: 'total_likes',
    type: 'number',
    operators: ['>', '<', '=', '>=', '<=']
  },
  {
    id: 'tiktok-comments',
    platform: 'TikTok',
    category: 'Video',
    provider: 'zkpass',
    displayName: 'Total Comments',
    attribute: 'total_comments',
    type: 'number',
    operators: ['>', '<', '=', '>=', '<=']
  },
  {
    id: 'tiktok-shares',
    platform: 'TikTok',
    category: 'Video',
    provider: 'zkpass',
    displayName: 'Total Shares',
    attribute: 'total_shares',
    type: 'number',
    operators: ['>', '<', '=', '>=', '<=']
  },
  {
    id: 'tiktok-audience-age',
    platform: 'TikTok',
    category: 'Video',
    provider: 'zkpass',
    displayName: 'Audience Age (% in range)',
    attribute: 'audience_age_percentage',
    type: 'number',
    operators: ['>', '<', '=', '>=', '<='],
    params: [
      {
        name: 'age_range',
        type: 'string',
        required: true,
        placeholder: 'Select age range',
        options: [
          { value: '13-17', label: '13-17 years' },
          { value: '18-24', label: '18-24 years' },
          { value: '25-34', label: '25-34 years' },
          { value: '35-44', label: '35-44 years' },
          { value: '45+', label: '45+ years' }
        ]
      }
    ]
  },
  {
    id: 'tiktok-audience-gender',
    platform: 'TikTok',
    category: 'Video',
    provider: 'zkpass',
    displayName: 'Audience Gender (%)',
    attribute: 'audience_gender_percentage',
    type: 'number',
    operators: ['>', '<', '=', '>=', '<='],
    params: [
      {
        name: 'gender',
        type: 'string',
        required: true,
        placeholder: 'Select gender',
        options: [
          { value: 'male', label: 'Male' },
          { value: 'female', label: 'Female' }
        ]
      }
    ]
  },
  {
    id: 'tiktok-fyf-eligible',
    platform: 'TikTok',
    category: 'Video',
    provider: 'zkpass',
    displayName: 'For You Feed Eligible',
    attribute: 'fyf_eligible',
    type: 'boolean',
    operators: ['=']
  }
];

// Combine all schemas
export const allPlatformSchemas: PlatformSchema[] = [
  ...xPlatformSchemas,
  ...instagramSchemas,
  ...linkedinSchemas,
  ...facebookSchemas,
  ...farcasterSchemas,
  ...youtubeSchemas,
  ...redditSchemas,
  ...tiktokSchemas
];

// Group schemas by platform
export const schemasByPlatform = allPlatformSchemas.reduce((acc, schema) => {
  if (!acc[schema.platform]) {
    acc[schema.platform] = [];
  }
  acc[schema.platform].push(schema);
  return acc;
}, {} as Record<string, PlatformSchema[]>);

// Export types for use in components
export interface ConditionBlock {
  id: string;
  schemaId: string;
  operator?: OperatorType;
  value?: any;
  params?: Record<string, any>;
  logicalOperator?: LogicalOperator;
}

export interface ConditionGroup {
  id: string;
  operator: LogicalOperator;
  conditions: (ConditionBlock | ConditionGroup)[];
}

export interface TargetingRule {
  id: string;
  name: string;
  description?: string;
  rootGroup: ConditionGroup;
  createdAt: Date;
  updatedAt: Date;
  status: 'draft' | 'active' | 'paused';
}