export type OperatorType = '>' | '<' | '=' | '>=' | '<=' | '!=' | 'contains' | 'in' | 'has_achievement' | 'min_unlocked' | 'can_perform' | 'is' | 'is not' | 'during';
export type AttributeType = 'number' | 'string' | 'boolean' | 'date' | 'achievement' | 'tier' | 'action' | 'select';
export type LogicalOperator = 'AND' | 'OR';

// Operator sets for different data contexts
export const OPERATOR_SETS = {
  DISCRETE: ['='] as OperatorType[], // For locations, categories, etc.
  PERCENTAGE: ['=', '>', '<'] as OperatorType[], // For audience percentages
  COUNT: ['=', '>', '<', '>=', '<='] as OperatorType[], // For followers, likes, views
  TEXT: ['contains'] as OperatorType[], // For bio, username
  BOOLEAN: ['='] as OperatorType[], // For verified, business account
  DATE: ['=', '>', '<'] as OperatorType[], // For account age, last post
} as const;

// Human-readable labels for operators
export const OPERATOR_LABELS: Record<string, string> = {
  '=': 'is',
  '>': 'more than',
  '<': 'less than',
  '>=': 'at least',
  '<=': 'at most',
  '!=': 'is not',
  'contains': 'contains',
  'in': 'is one of',
};

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
  },
  {
    id: 'ig-audience-gender',
    platform: 'Instagram',
    category: 'Demographics',
    provider: 'zkpass',
    displayName: 'Audience Gender',
    attribute: 'audience_gender_percentage',
    type: 'number',
    operators: OPERATOR_SETS.PERCENTAGE,
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
    id: 'ig-audience-age',
    platform: 'Instagram',
    category: 'Demographics',
    provider: 'zkpass',
    displayName: 'Audience Age Range',
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
          { value: '45-54', label: '45-54 years' },
          { value: '55-64', label: '55-64 years' },
          { value: '65+', label: '65+ years' }
        ]
      }
    ]
  },
  {
    id: 'ig-profile-visits-7d',
    platform: 'Instagram',
    category: 'Analytics',
    provider: 'zkpass',
    displayName: 'Profile Visits (7 days)',
    attribute: 'profile_visits_7d',
    type: 'number',
    operators: ['>', '<', '=', '>=', '<=']
  },
  {
    id: 'ig-profile-visits-30d',
    platform: 'Instagram',
    category: 'Analytics',
    provider: 'zkpass',
    displayName: 'Profile Visits (30 days)',
    attribute: 'profile_visits_30d',
    type: 'number',
    operators: ['>', '<', '=', '>=', '<=']
  },
  {
    id: 'ig-profile-visits-90d',
    platform: 'Instagram',
    category: 'Analytics',
    provider: 'zkpass',
    displayName: 'Profile Visits (90 days)',
    attribute: 'profile_visits_90d',
    type: 'number',
    operators: ['>', '<', '=', '>=', '<=']
  },
  {
    id: 'ig-accounts-reached-7d',
    platform: 'Instagram',
    category: 'Analytics',
    provider: 'zkpass',
    displayName: 'Accounts Reached (7 days)',
    attribute: 'accounts_reached_7d',
    type: 'number',
    operators: ['>', '<', '=', '>=', '<=']
  },
  {
    id: 'ig-accounts-reached-30d',
    platform: 'Instagram',
    category: 'Analytics',
    provider: 'zkpass',
    displayName: 'Accounts Reached (30 days)',
    attribute: 'accounts_reached_30d',
    type: 'number',
    operators: ['>', '<', '=', '>=', '<=']
  },
  {
    id: 'ig-accounts-engaged-7d',
    platform: 'Instagram',
    category: 'Analytics',
    provider: 'zkpass',
    displayName: 'Accounts Engaged (7 days)',
    attribute: 'accounts_engaged_7d',
    type: 'number',
    operators: ['>', '<', '=', '>=', '<=']
  },
  {
    id: 'ig-accounts-engaged-30d',
    platform: 'Instagram',
    category: 'Analytics',
    provider: 'zkpass',
    displayName: 'Accounts Engaged (30 days)',
    attribute: 'accounts_engaged_30d',
    type: 'number',
    operators: ['>', '<', '=', '>=', '<=']
  },
  {
    id: 'ig-follower-growth-7d',
    platform: 'Instagram',
    category: 'Growth',
    provider: 'zkpass',
    displayName: 'Follower Growth % (7 days)',
    attribute: 'follower_growth_7d',
    type: 'number',
    operators: ['>', '<', '=', '>=', '<=']
  },
  {
    id: 'ig-follower-growth-30d',
    platform: 'Instagram',
    category: 'Growth',
    provider: 'zkpass',
    displayName: 'Follower Growth % (30 days)',
    attribute: 'follower_growth_30d',
    type: 'number',
    operators: ['>', '<', '=', '>=', '<=']
  },
  {
    id: 'ig-follower-growth-90d',
    platform: 'Instagram',
    category: 'Growth',
    provider: 'zkpass',
    displayName: 'Follower Growth % (90 days)',
    attribute: 'follower_growth_90d',
    type: 'number',
    operators: ['>', '<', '=', '>=', '<=']
  },
  {
    id: 'ig-engagement-rate',
    platform: 'Instagram',
    category: 'Engagement',
    provider: 'zkpass',
    displayName: 'Engagement Rate %',
    attribute: 'engagement_rate',
    type: 'number',
    operators: ['>', '<', '=', '>=', '<=']
  },
  {
    id: 'ig-top-location',
    platform: 'Instagram',
    category: 'Demographics',
    provider: 'zkpass',
    displayName: 'Top Audience Location',
    attribute: 'top_location',
    type: 'string',
    operators: ['='],
    params: [
      {
        name: 'location_type',
        type: 'string',
        required: true,
        placeholder: 'Location type',
        options: [
          { value: 'city', label: 'City' },
          { value: 'country', label: 'Country' }
        ]
      }
    ]
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
  },
  {
    id: 'fb-page-likes',
    platform: 'Facebook',
    category: 'Social',
    provider: 'zkpass',
    displayName: 'Page Likes',
    attribute: 'page_likes',
    type: 'number',
    operators: ['>', '<', '=', '>=', '<=']
  },
  {
    id: 'fb-page-views-7d',
    platform: 'Facebook',
    category: 'Analytics',
    provider: 'zkpass',
    displayName: 'Page Views (7 days)',
    attribute: 'page_views_7d',
    type: 'number',
    operators: ['>', '<', '=', '>=', '<=']
  },
  {
    id: 'fb-page-views-30d',
    platform: 'Facebook',
    category: 'Analytics',
    provider: 'zkpass',
    displayName: 'Page Views (30 days)',
    attribute: 'page_views_30d',
    type: 'number',
    operators: ['>', '<', '=', '>=', '<=']
  },
  {
    id: 'fb-reach-7d',
    platform: 'Facebook',
    category: 'Analytics',
    provider: 'zkpass',
    displayName: 'Reach (7 days)',
    attribute: 'reach_7d',
    type: 'number',
    operators: ['>', '<', '=', '>=', '<=']
  },
  {
    id: 'fb-reach-30d',
    platform: 'Facebook',
    category: 'Analytics',
    provider: 'zkpass',
    displayName: 'Reach (30 days)',
    attribute: 'reach_30d',
    type: 'number',
    operators: ['>', '<', '=', '>=', '<=']
  },
  {
    id: 'fb-content-interactions-7d',
    platform: 'Facebook',
    category: 'Engagement',
    provider: 'zkpass',
    displayName: 'Content Interactions (7 days)',
    attribute: 'content_interactions_7d',
    type: 'number',
    operators: ['>', '<', '=', '>=', '<=']
  },
  {
    id: 'fb-content-interactions-30d',
    platform: 'Facebook',
    category: 'Engagement',
    provider: 'zkpass',
    displayName: 'Content Interactions (30 days)',
    attribute: 'content_interactions_30d',
    type: 'number',
    operators: ['>', '<', '=', '>=', '<=']
  },
  {
    id: 'fb-net-followers-7d',
    platform: 'Facebook',
    category: 'Growth',
    provider: 'zkpass',
    displayName: 'Net Followers (7 days)',
    attribute: 'net_followers_7d',
    type: 'number',
    operators: ['>', '<', '=', '>=', '<=']
  },
  {
    id: 'fb-net-followers-30d',
    platform: 'Facebook',
    category: 'Growth',
    provider: 'zkpass',
    displayName: 'Net Followers (30 days)',
    attribute: 'net_followers_30d',
    type: 'number',
    operators: ['>', '<', '=', '>=', '<=']
  },
  {
    id: 'fb-net-followers-90d',
    platform: 'Facebook',
    category: 'Growth',
    provider: 'zkpass',
    displayName: 'Net Followers (90 days)',
    attribute: 'net_followers_90d',
    type: 'number',
    operators: ['>', '<', '=', '>=', '<=']
  },
  {
    id: 'fb-audience-gender',
    platform: 'Facebook',
    category: 'Demographics',
    provider: 'zkpass',
    displayName: 'Audience Gender',
    attribute: 'audience_gender_percentage',
    type: 'number',
    operators: OPERATOR_SETS.PERCENTAGE,
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
    id: 'fb-audience-age',
    platform: 'Facebook',
    category: 'Demographics',
    provider: 'zkpass',
    displayName: 'Audience Age Range',
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
          { value: '45-54', label: '45-54 years' },
          { value: '55-64', label: '55-64 years' },
          { value: '65+', label: '65+ years' }
        ]
      }
    ]
  },
  {
    id: 'fb-top-location',
    platform: 'Facebook',
    category: 'Demographics',
    provider: 'zkpass',
    displayName: 'Top Audience Location',
    attribute: 'top_location',
    type: 'string',
    operators: ['='],
    params: [
      {
        name: 'location_type',
        type: 'string',
        required: true,
        placeholder: 'Location type',
        options: [
          { value: 'city', label: 'City' },
          { value: 'country', label: 'Country' }
        ]
      }
    ]
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
    displayName: 'Total Video Views',
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
    displayName: 'Audience Age',
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
    displayName: 'Audience Gender',
    attribute: 'audience_gender_percentage',
    type: 'number',
    operators: OPERATOR_SETS.PERCENTAGE,
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
    id: 'tiktok-audience-location',
    platform: 'TikTok',
    category: 'Video',
    provider: 'zkpass',
    displayName: 'Audience Location',
    attribute: 'audience_location_percentage',
    type: 'number',
    operators: ['>', '<', '=', '>=', '<='],
    params: [
      {
        name: 'country',
        type: 'string',
        required: true,
        placeholder: 'Select country',
        options: [
          // Top markets first
          { value: 'us', label: '🇺🇸 United States' },
          { value: 'gb', label: '🇬🇧 United Kingdom' },
          { value: 'ca', label: '🇨🇦 Canada' },
          { value: 'au', label: '🇦🇺 Australia' },
          // Then alphabetical
          { value: 'af', label: 'Afghanistan' },
          { value: 'al', label: 'Albania' },
          { value: 'dz', label: 'Algeria' },
          { value: 'ar', label: 'Argentina' },
          { value: 'am', label: 'Armenia' },
          { value: 'at', label: 'Austria' },
          { value: 'az', label: 'Azerbaijan' },
          { value: 'bh', label: 'Bahrain' },
          { value: 'bd', label: 'Bangladesh' },
          { value: 'by', label: 'Belarus' },
          { value: 'be', label: 'Belgium' },
          { value: 'bo', label: 'Bolivia' },
          { value: 'ba', label: 'Bosnia and Herzegovina' },
          { value: 'br', label: 'Brazil' },
          { value: 'bg', label: 'Bulgaria' },
          { value: 'kh', label: 'Cambodia' },
          { value: 'cm', label: 'Cameroon' },
          { value: 'cl', label: 'Chile' },
          { value: 'cn', label: 'China' },
          { value: 'co', label: 'Colombia' },
          { value: 'cr', label: 'Costa Rica' },
          { value: 'hr', label: 'Croatia' },
          { value: 'cu', label: 'Cuba' },
          { value: 'cy', label: 'Cyprus' },
          { value: 'cz', label: 'Czech Republic' },
          { value: 'dk', label: 'Denmark' },
          { value: 'do', label: 'Dominican Republic' },
          { value: 'ec', label: 'Ecuador' },
          { value: 'eg', label: 'Egypt' },
          { value: 'sv', label: 'El Salvador' },
          { value: 'ee', label: 'Estonia' },
          { value: 'et', label: 'Ethiopia' },
          { value: 'fi', label: 'Finland' },
          { value: 'fr', label: 'France' },
          { value: 'ge', label: 'Georgia' },
          { value: 'de', label: 'Germany' },
          { value: 'gh', label: 'Ghana' },
          { value: 'gr', label: 'Greece' },
          { value: 'gt', label: 'Guatemala' },
          { value: 'hn', label: 'Honduras' },
          { value: 'hk', label: 'Hong Kong' },
          { value: 'hu', label: 'Hungary' },
          { value: 'is', label: 'Iceland' },
          { value: 'in', label: 'India' },
          { value: 'id', label: 'Indonesia' },
          { value: 'ir', label: 'Iran' },
          { value: 'iq', label: 'Iraq' },
          { value: 'ie', label: 'Ireland' },
          { value: 'il', label: 'Israel' },
          { value: 'it', label: 'Italy' },
          { value: 'jm', label: 'Jamaica' },
          { value: 'jp', label: 'Japan' },
          { value: 'jo', label: 'Jordan' },
          { value: 'kz', label: 'Kazakhstan' },
          { value: 'ke', label: 'Kenya' },
          { value: 'kw', label: 'Kuwait' },
          { value: 'kg', label: 'Kyrgyzstan' },
          { value: 'la', label: 'Laos' },
          { value: 'lv', label: 'Latvia' },
          { value: 'lb', label: 'Lebanon' },
          { value: 'ly', label: 'Libya' },
          { value: 'lt', label: 'Lithuania' },
          { value: 'lu', label: 'Luxembourg' },
          { value: 'mk', label: 'Macedonia' },
          { value: 'my', label: 'Malaysia' },
          { value: 'mt', label: 'Malta' },
          { value: 'mx', label: 'Mexico' },
          { value: 'md', label: 'Moldova' },
          { value: 'mn', label: 'Mongolia' },
          { value: 'me', label: 'Montenegro' },
          { value: 'ma', label: 'Morocco' },
          { value: 'mm', label: 'Myanmar' },
          { value: 'np', label: 'Nepal' },
          { value: 'nl', label: 'Netherlands' },
          { value: 'nz', label: 'New Zealand' },
          { value: 'ni', label: 'Nicaragua' },
          { value: 'ng', label: 'Nigeria' },
          { value: 'no', label: 'Norway' },
          { value: 'om', label: 'Oman' },
          { value: 'pk', label: 'Pakistan' },
          { value: 'ps', label: 'Palestine' },
          { value: 'pa', label: 'Panama' },
          { value: 'py', label: 'Paraguay' },
          { value: 'pe', label: 'Peru' },
          { value: 'ph', label: 'Philippines' },
          { value: 'pl', label: 'Poland' },
          { value: 'pt', label: 'Portugal' },
          { value: 'pr', label: 'Puerto Rico' },
          { value: 'qa', label: 'Qatar' },
          { value: 'ro', label: 'Romania' },
          { value: 'ru', label: 'Russia' },
          { value: 'sa', label: 'Saudi Arabia' },
          { value: 'rs', label: 'Serbia' },
          { value: 'sg', label: 'Singapore' },
          { value: 'sk', label: 'Slovakia' },
          { value: 'si', label: 'Slovenia' },
          { value: 'za', label: 'South Africa' },
          { value: 'kr', label: 'South Korea' },
          { value: 'es', label: 'Spain' },
          { value: 'lk', label: 'Sri Lanka' },
          { value: 'sd', label: 'Sudan' },
          { value: 'se', label: 'Sweden' },
          { value: 'ch', label: 'Switzerland' },
          { value: 'sy', label: 'Syria' },
          { value: 'tw', label: 'Taiwan' },
          { value: 'tj', label: 'Tajikistan' },
          { value: 'tz', label: 'Tanzania' },
          { value: 'th', label: 'Thailand' },
          { value: 'tn', label: 'Tunisia' },
          { value: 'tr', label: 'Turkey' },
          { value: 'tm', label: 'Turkmenistan' },
          { value: 'ug', label: 'Uganda' },
          { value: 'ua', label: 'Ukraine' },
          { value: 'ae', label: 'United Arab Emirates' },
          { value: 'uy', label: 'Uruguay' },
          { value: 'uz', label: 'Uzbekistan' },
          { value: 've', label: 'Venezuela' },
          { value: 'vn', label: 'Vietnam' },
          { value: 'ye', label: 'Yemen' },
          { value: 'zm', label: 'Zambia' },
          { value: 'zw', label: 'Zimbabwe' }
        ]
      }
    ]
  },
  {
    id: 'tiktok-viewer-type',
    platform: 'TikTok',
    category: 'Video',
    provider: 'zkpass',
    displayName: 'Viewer Type',
    attribute: 'viewer_type',
    type: 'string',
    operators: ['is', 'is not'],
    params: [
      {
        name: 'type',
        type: 'select',
        required: true,
        placeholder: 'Select viewer type',
        options: [
          { value: 'new_viewers', label: 'New Viewers (First time or 1+ year)' },
          { value: 'returning_viewers', label: 'Returning Viewers (Within past year)' },
          { value: 'followers', label: 'Followers' },
          { value: 'non_followers', label: 'Non-Followers' }
        ]
      }
    ]
  },
  {
    id: 'tiktok-active-time',
    platform: 'TikTok',
    category: 'Video',
    provider: 'zkpass',
    displayName: 'Audience Most Active Time',
    attribute: 'audience_active_time',
    type: 'string',
    operators: ['during'],
    params: [
      {
        name: 'time_range',
        type: 'select',
        required: true,
        placeholder: 'Select time range',
        options: [
          { value: 'morning', label: 'Morning (6 AM - 12 PM)' },
          { value: 'afternoon', label: 'Afternoon (12 PM - 6 PM)' },
          { value: 'evening', label: 'Evening (6 PM - 10 PM)' },
          { value: 'night', label: 'Night (10 PM - 2 AM)' },
          { value: 'late_night', label: 'Late Night (2 AM - 6 AM)' }
        ]
      },
      {
        name: 'timezone',
        type: 'select',
        required: true,
        placeholder: 'Select timezone',
        options: [
          { value: 'user_local', label: 'User\'s Local Time' },
          { value: 'utc', label: 'UTC' },
          { value: 'est', label: 'EST/EDT' },
          { value: 'pst', label: 'PST/PDT' },
          { value: 'cst', label: 'CST/CDT' }
        ]
      }
    ]
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