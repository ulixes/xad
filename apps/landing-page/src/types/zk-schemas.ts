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
  category: string;
  provider: 'zkpass' | 'camp';
  schemaName: string;
  displayName: string;
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
  operator: OperatorType;
  value: any;
  params?: Record<string, any>;
  logicalOperator?: LogicalOperator; // AND/OR to connect to next condition
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

// Mock schemas based on ZKPass and Camp Network capabilities
export const availableSchemas: ZKSchema[] = [
  // Demographics (ZKPass)
  {
    id: 'zkp-age',
    category: 'Demographics',
    provider: 'zkpass',
    schemaName: 'OKX KYC',
    displayName: 'Age Verification',
    description: 'Verify user age through KYC',
    attribute: 'age',
    type: 'number',
    operators: ['>', '<', '=', '>=', '<='],
    icon: '',
    verified: true
  },
  {
    id: 'zkp-country',
    category: 'Demographics',
    provider: 'zkpass',
    schemaName: 'MyGovID',
    displayName: 'Country Verification',
    description: 'Verify user country of residence',
    attribute: 'country',
    type: 'string',
    operators: ['=', '!=', 'in'],
    icon: '',
    verified: true
  },
  
  // Social Media (Camp Network + Custom)
  {
    id: 'camp-spotify-listens',
    category: 'Music',
    provider: 'camp',
    schemaName: 'Spotify',
    displayName: 'Artist Listen Count',
    description: 'Number of times user listened to an artist',
    attribute: 'listens_to_artist',
    type: 'number',
    operators: ['>', '<', '=', '>=', '<='],
    params: [
      {
        name: 'artist_name',
        type: 'string',
        required: true,
        placeholder: 'e.g., Kanye West',
        description: 'Name of the artist'
      }
    ],
    icon: '',
    verified: true
  },
  {
    id: 'camp-spotify-top-artist',
    category: 'Music',
    provider: 'camp',
    schemaName: 'Spotify',
    displayName: 'Top Artists',
    description: 'User\'s top artists',
    attribute: 'top_artists',
    type: 'string',
    operators: ['contains'],
    icon: '',
    verified: true
  },
  {
    id: 'custom-reddit-karma',
    category: 'Social',
    provider: 'zkpass',
    schemaName: 'Reddit (Custom)',
    displayName: 'Reddit Karma',
    description: 'Total karma points on Reddit',
    attribute: 'karma',
    type: 'number',
    operators: ['>', '<', '=', '>=', '<='],
    icon: '',
    verified: false
  },
  {
    id: 'camp-twitter-followers',
    category: 'Social',
    provider: 'camp',
    schemaName: 'X (Twitter)',
    displayName: 'Follower Count',
    description: 'Number of followers on X',
    attribute: 'followers',
    type: 'number',
    operators: ['>', '<', '=', '>=', '<='],
    icon: '',
    verified: true
  },
  {
    id: 'camp-tiktok-views',
    category: 'Social',
    provider: 'camp',
    schemaName: 'TikTok',
    displayName: 'Total Views',
    description: 'Total video views on TikTok',
    attribute: 'total_views',
    type: 'number',
    operators: ['>', '<', '=', '>=', '<='],
    icon: '',
    verified: true
  },
  
  // Financial (ZKPass)
  {
    id: 'zkp-bank-balance',
    category: 'Financial',
    provider: 'zkpass',
    schemaName: 'ANZ Bank',
    displayName: 'Account Balance',
    description: 'Bank account balance verification',
    attribute: 'balance',
    type: 'number',
    operators: ['>', '<', '=', '>=', '<='],
    icon: '',
    verified: true
  },
  {
    id: 'zkp-paypal-verified',
    category: 'Financial',
    provider: 'zkpass',
    schemaName: 'PayPal',
    displayName: 'PayPal Verified',
    description: 'PayPal account verification status',
    attribute: 'verified',
    type: 'boolean',
    operators: ['='],
    icon: '',
    verified: true
  },
  
  // Education (ZKPass)
  {
    id: 'zkp-coursera-courses',
    category: 'Education',
    provider: 'zkpass',
    schemaName: 'Coursera',
    displayName: 'Courses Completed',
    description: 'Number of completed courses',
    attribute: 'courses_completed',
    type: 'number',
    operators: ['>', '<', '=', '>=', '<='],
    icon: '',
    verified: true
  },
  {
    id: 'zkp-duolingo-streak',
    category: 'Education',
    provider: 'zkpass',
    schemaName: 'Duolingo',
    displayName: 'Learning Streak',
    description: 'Current learning streak in days',
    attribute: 'streak_days',
    type: 'number',
    operators: ['>', '<', '=', '>=', '<='],
    icon: '',
    verified: true
  },
  
  // E-Commerce (ZKPass)
  {
    id: 'zkp-amazon-prime',
    category: 'E-Commerce',
    provider: 'zkpass',
    schemaName: 'Amazon',
    displayName: 'Prime Member',
    description: 'Amazon Prime membership status',
    attribute: 'prime_member',
    type: 'boolean',
    operators: ['='],
    icon: '',
    verified: true
  },
  
  // Crypto (ZKPass)
  {
    id: 'zkp-crypto-holdings',
    category: 'Crypto',
    provider: 'zkpass',
    schemaName: 'OKX Exchange',
    displayName: 'Crypto Holdings',
    description: 'Total crypto holdings in USD',
    attribute: 'total_holdings_usd',
    type: 'number',
    operators: ['>', '<', '=', '>=', '<='],
    icon: '',
    verified: true
  }
];

export const schemaCategories = [
  { name: 'Demographics', icon: '', description: 'Age, location, identity' },
  { name: 'Social', icon: '', description: 'Social media activity' },
  { name: 'Music', icon: '', description: 'Music streaming behavior' },
  { name: 'Financial', icon: '', description: 'Financial verification' },
  { name: 'Education', icon: '', description: 'Learning and courses' },
  { name: 'E-Commerce', icon: '', description: 'Shopping behavior' },
  { name: 'Crypto', icon: '', description: 'Cryptocurrency activity' }
];