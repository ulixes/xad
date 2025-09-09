export type OperatorType = '>' | '<' | '=' | '>=' | '<=' | '!=' | 'contains' | 'in';
export type AttributeType = 'number' | 'string' | 'boolean' | 'date';
export type LogicalOperator = 'AND' | 'OR';

export interface SchemaParam {
  name: string;
  type: AttributeType;
  required: boolean;
  placeholder?: string;
  description?: string;
}

export interface ZKSchema {
  id: string;
  service: string; // The actual service/platform (e.g., "Spotify", "Duolingo", etc.)
  category: string;
  provider: 'zkpass' | 'camp';
  displayName: string; // What shows in the dropdown (e.g., "Listening History", "Learning Streak")
  description: string;
  attribute: string;
  type: AttributeType;
  operators: OperatorType[];
  params?: SchemaParam[];
  icon?: string;
  verified?: boolean;
}

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

// Comprehensive schema list based on ZKPass and Camp Network capabilities
export const availableSchemas: ZKSchema[] = [
  // ========== IDENTITY & KYC ==========
  {
    id: 'zkp-mygov-age',
    service: 'MyGovID',
    category: 'Identity',
    provider: 'zkpass',
    displayName: 'Age Verification',
    description: 'Verify age through government ID',
    attribute: 'age',
    type: 'number',
    operators: ['>', '<', '=', '>=', '<='],
    verified: true
  },
  {
    id: 'zkp-mygov-country',
    service: 'MyGovID',
    category: 'Identity',
    provider: 'zkpass',
    displayName: 'Country of Residence',
    description: 'Verified country from government ID',
    attribute: 'country',
    type: 'string',
    operators: ['=', '!=', 'in'],
    verified: true
  },
  {
    id: 'zkp-okx-kyc-status',
    service: 'OKX',
    category: 'Identity',
    provider: 'zkpass',
    displayName: 'KYC Status',
    description: 'KYC verification completion status',
    attribute: 'kyc_passed',
    type: 'boolean',
    operators: ['='],
    verified: true
  },
  {
    id: 'zkp-okx-kyc-age',
    service: 'OKX',
    category: 'Identity',
    provider: 'zkpass',
    displayName: 'Age (KYC)',
    description: 'Age verified through OKX KYC',
    attribute: 'age',
    type: 'number',
    operators: ['>', '<', '=', '>=', '<='],
    verified: true
  },

  // ========== MUSIC & STREAMING (Camp Network) ==========
  {
    id: 'camp-spotify-artist-listens',
    service: 'Spotify',
    category: 'Music',
    provider: 'camp',
    displayName: 'Artist Listen Count',
    description: 'Number of times listened to specific artist',
    attribute: 'artist_play_count',
    type: 'number',
    operators: ['>', '<', '=', '>=', '<='],
    params: [
      {
        name: 'artist_name',
        type: 'string',
        required: true,
        placeholder: 'e.g., Kanye West',
        description: 'Artist name'
      }
    ],
    verified: true
  },
  {
    id: 'camp-spotify-top-artists',
    service: 'Spotify',
    category: 'Music',
    provider: 'camp',
    displayName: 'Top Artists',
    description: 'User\'s most played artists',
    attribute: 'top_artists',
    type: 'string',
    operators: ['contains'],
    verified: true
  },
  {
    id: 'camp-spotify-monthly-minutes',
    service: 'Spotify',
    category: 'Music',
    provider: 'camp',
    displayName: 'Monthly Listening Time',
    description: 'Minutes listened in past month',
    attribute: 'monthly_minutes',
    type: 'number',
    operators: ['>', '<', '=', '>=', '<='],
    verified: true
  },

  // ========== SOCIAL MEDIA ==========
  {
    id: 'camp-twitter-followers',
    service: 'X (Twitter)',
    category: 'Social',
    provider: 'camp',
    displayName: 'Follower Count',
    description: 'Number of followers on X',
    attribute: 'followers_count',
    type: 'number',
    operators: ['>', '<', '=', '>=', '<='],
    verified: true
  },
  {
    id: 'camp-twitter-tweets',
    service: 'X (Twitter)',
    category: 'Social',
    provider: 'camp',
    displayName: 'Tweet Count',
    description: 'Total number of tweets',
    attribute: 'tweet_count',
    type: 'number',
    operators: ['>', '<', '=', '>=', '<='],
    verified: true
  },
  {
    id: 'camp-tiktok-views',
    service: 'TikTok',
    category: 'Social',
    provider: 'camp',
    displayName: 'Total Video Views',
    description: 'Combined views across all videos',
    attribute: 'total_views',
    type: 'number',
    operators: ['>', '<', '=', '>=', '<='],
    verified: true
  },
  {
    id: 'camp-tiktok-followers',
    service: 'TikTok',
    category: 'Social',
    provider: 'camp',
    displayName: 'Follower Count',
    description: 'Number of TikTok followers',
    attribute: 'followers',
    type: 'number',
    operators: ['>', '<', '=', '>=', '<='],
    verified: true
  },
  {
    id: 'camp-telegram-groups',
    service: 'Telegram',
    category: 'Social',
    provider: 'camp',
    displayName: 'Group Memberships',
    description: 'Number of groups joined',
    attribute: 'group_count',
    type: 'number',
    operators: ['>', '<', '=', '>=', '<='],
    verified: true
  },
  {
    id: 'custom-reddit-karma',
    service: 'Reddit',
    category: 'Social',
    provider: 'zkpass',
    displayName: 'Total Karma',
    description: 'Combined post and comment karma',
    attribute: 'total_karma',
    type: 'number',
    operators: ['>', '<', '=', '>=', '<='],
    verified: false // Custom schema
  },
  {
    id: 'zkp-quora-posts',
    service: 'Quora',
    category: 'Social',
    provider: 'zkpass',
    displayName: 'Answer Count',
    description: 'Number of answers posted',
    attribute: 'answer_count',
    type: 'number',
    operators: ['>', '<', '=', '>=', '<='],
    verified: true
  },

  // ========== FINANCIAL ==========
  {
    id: 'zkp-anz-balance',
    service: 'ANZ Bank',
    category: 'Financial',
    provider: 'zkpass',
    displayName: 'Account Balance',
    description: 'Current account balance',
    attribute: 'balance',
    type: 'number',
    operators: ['>', '<', '=', '>=', '<='],
    verified: true
  },
  {
    id: 'zkp-paypal-verified',
    service: 'PayPal',
    category: 'Financial',
    provider: 'zkpass',
    displayName: 'Account Verified',
    description: 'PayPal verification status',
    attribute: 'is_verified',
    type: 'boolean',
    operators: ['='],
    verified: true
  },
  {
    id: 'zkp-paypal-transactions',
    service: 'PayPal',
    category: 'Financial',
    provider: 'zkpass',
    displayName: 'Monthly Transactions',
    description: 'Number of transactions in past month',
    attribute: 'monthly_transactions',
    type: 'number',
    operators: ['>', '<', '=', '>=', '<='],
    verified: true
  },

  // ========== EDUCATION & LEARNING ==========
  {
    id: 'zkp-coursera-completed',
    service: 'Coursera',
    category: 'Education',
    provider: 'zkpass',
    displayName: 'Courses Completed',
    description: 'Total completed courses',
    attribute: 'courses_completed',
    type: 'number',
    operators: ['>', '<', '=', '>=', '<='],
    verified: true
  },
  {
    id: 'zkp-coursera-certificates',
    service: 'Coursera',
    category: 'Education',
    provider: 'zkpass',
    displayName: 'Certificates Earned',
    description: 'Number of certificates',
    attribute: 'certificates',
    type: 'number',
    operators: ['>', '<', '=', '>=', '<='],
    verified: true
  },
  {
    id: 'zkp-duolingo-streak',
    service: 'Duolingo',
    category: 'Education',
    provider: 'zkpass',
    displayName: 'Current Streak',
    description: 'Consecutive days of learning',
    attribute: 'streak_days',
    type: 'number',
    operators: ['>', '<', '=', '>=', '<='],
    verified: true
  },
  {
    id: 'zkp-duolingo-languages',
    service: 'Duolingo',
    category: 'Education',
    provider: 'zkpass',
    displayName: 'Languages Learning',
    description: 'Number of active languages',
    attribute: 'language_count',
    type: 'number',
    operators: ['>', '<', '=', '>=', '<='],
    verified: true
  },
  {
    id: 'zkp-chatgpt-usage',
    service: 'ChatGPT',
    category: 'Education',
    provider: 'zkpass',
    displayName: 'Monthly Usage',
    description: 'Messages sent in past month',
    attribute: 'monthly_messages',
    type: 'number',
    operators: ['>', '<', '=', '>=', '<='],
    verified: true
  },

  // ========== TRAVEL & LIFESTYLE ==========
  {
    id: 'zkp-delta-status',
    service: 'Delta Airlines',
    category: 'Travel',
    provider: 'zkpass',
    displayName: 'SkyMiles Status',
    description: 'Medallion status level',
    attribute: 'status',
    type: 'string',
    operators: ['=', '!=', 'in'],
    verified: true
  },
  {
    id: 'zkp-delta-miles',
    service: 'Delta Airlines',
    category: 'Travel',
    provider: 'zkpass',
    displayName: 'SkyMiles Balance',
    description: 'Current miles balance',
    attribute: 'miles',
    type: 'number',
    operators: ['>', '<', '=', '>=', '<='],
    verified: true
  },
  {
    id: 'zkp-hilton-honors',
    service: 'Hilton',
    category: 'Travel',
    provider: 'zkpass',
    displayName: 'Honors Status',
    description: 'Hilton Honors tier',
    attribute: 'honors_tier',
    type: 'string',
    operators: ['=', '!=', 'in'],
    verified: true
  },
  {
    id: 'zkp-hilton-nights',
    service: 'Hilton',
    category: 'Travel',
    provider: 'zkpass',
    displayName: 'Annual Nights',
    description: 'Nights stayed this year',
    attribute: 'annual_nights',
    type: 'number',
    operators: ['>', '<', '=', '>=', '<='],
    verified: true
  },
  {
    id: 'zkp-ferrari-owner',
    service: 'Ferrari',
    category: 'Lifestyle',
    provider: 'zkpass',
    displayName: 'Owner Status',
    description: 'Ferrari ownership verification',
    attribute: 'is_owner',
    type: 'boolean',
    operators: ['='],
    verified: true
  },

  // ========== E-COMMERCE ==========
  {
    id: 'zkp-amazon-prime',
    service: 'Amazon',
    category: 'E-Commerce',
    provider: 'zkpass',
    displayName: 'Prime Member',
    description: 'Amazon Prime subscription status',
    attribute: 'has_prime',
    type: 'boolean',
    operators: ['='],
    verified: true
  },
  {
    id: 'zkp-amazon-purchases',
    service: 'Amazon',
    category: 'E-Commerce',
    provider: 'zkpass',
    displayName: 'Annual Purchase Count',
    description: 'Orders placed this year',
    attribute: 'annual_orders',
    type: 'number',
    operators: ['>', '<', '=', '>=', '<='],
    verified: true
  },

  // ========== CRYPTO ==========
  {
    id: 'zkp-okx-holdings',
    service: 'OKX Exchange',
    category: 'Crypto',
    provider: 'zkpass',
    displayName: 'Portfolio Value',
    description: 'Total holdings in USD',
    attribute: 'portfolio_usd',
    type: 'number',
    operators: ['>', '<', '=', '>=', '<='],
    verified: true
  },
  {
    id: 'zkp-okx-trading-volume',
    service: 'OKX Exchange',
    category: 'Crypto',
    provider: 'zkpass',
    displayName: 'Monthly Trading Volume',
    description: 'Trading volume in past 30 days',
    attribute: 'monthly_volume',
    type: 'number',
    operators: ['>', '<', '=', '>=', '<='],
    verified: true
  }
];

// Group schemas by service for better organization
export const schemasByService = availableSchemas.reduce((acc, schema) => {
  if (!acc[schema.service]) {
    acc[schema.service] = [];
  }
  acc[schema.service].push(schema);
  return acc;
}, {} as Record<string, ZKSchema[]>);

export const serviceCategories = [
  { name: 'Identity', services: ['MyGovID', 'OKX'] },
  { name: 'Social', services: ['X (Twitter)', 'TikTok', 'Reddit', 'Quora', 'Telegram'] },
  { name: 'Music', services: ['Spotify'] },
  { name: 'Financial', services: ['ANZ Bank', 'PayPal'] },
  { name: 'Education', services: ['Coursera', 'Duolingo', 'ChatGPT'] },
  { name: 'Travel', services: ['Delta Airlines', 'Hilton'] },
  { name: 'Lifestyle', services: ['Ferrari'] },
  { name: 'E-Commerce', services: ['Amazon'] },
  { name: 'Crypto', services: ['OKX Exchange'] }
];