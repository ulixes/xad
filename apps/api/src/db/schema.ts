import { pgTable, pgEnum, uuid, text, integer, boolean, timestamp, jsonb, decimal, date } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const actionRunStatusEnum = pgEnum('action_run_status', [
  'pending_verification',
  'dom_verified',
  'cdp_verified',
  'completed', 
  'failed',
  'paid'
]);

export const actionTypeEnum = pgEnum('action_type', [
  'like',
  'comment', 
  'share',
  'follow',
  'retweet',
  'upvote',
  'award'
]);

export const platformEnum = pgEnum('platform', [
  'tiktok',
  'x',
  'instagram', 
  'reddit',
  'facebook',
  'farcaster',
  'youtube',
  'linkedin'
]);

export const userStatusEnum = pgEnum('user_status', [
  'active',
  'pending_verification',
  'suspended',
  'deactivated'
]);

export const campaignStatusEnum = pgEnum('campaign_status', [
  'draft',
  'pending_payment', 
  'active',
  'paused',
  'completed',
  'cancelled'
]);

export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'processing', 
  'completed',
  'failed',
  'refunded'
]);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  privyDid: text('privy_did').unique(), // Privy user identifier
  walletAddress: text('wallet_address').unique(),
  email: text('email').unique(),
  status: userStatusEnum('status').notNull().default('pending_verification'),
  totalEarned: integer('total_earned').notNull().default(0),
  availableBalance: integer('available_balance').notNull().default(0),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const socialAccounts = pgTable('social_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  platform: platformEnum('platform').notNull(),
  handle: text('handle').notNull(),
  platformUserId: text('platform_user_id'),
  isVerified: boolean('is_verified').notNull().default(false),
  lastVerifiedAt: timestamp('last_verified_at'),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Add brands table 
export const brands = pgTable('brands', {
  id: uuid('id').primaryKey().defaultRandom(),
  walletAddress: text('wallet_address').notNull().unique(),
  contactEmail: text('contact_email'),
  totalSpent: integer('total_spent').notNull().default(0),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Campaigns table (form submissions from brands)
export const campaigns = pgTable('campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),
  brandId: uuid('brand_id').notNull().references(() => brands.id, { onDelete: 'cascade' }),
  brandWalletAddress: text('brand_wallet_address').notNull(), // Keep for backward compatibility
  platform: platformEnum('platform').notNull(),
  targetingRules: jsonb('targeting_rules').notNull(),
  totalBudget: integer('total_budget').notNull(),
  remainingBudget: integer('remaining_budget').notNull(),
  rewardPerAction: integer('reward_per_action').notNull().default(100),
  status: campaignStatusEnum('status').notNull().default('draft'),
  isActive: boolean('is_active').notNull().default(false),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Campaign actions (individual actions from campaigns)
export const campaignActions = pgTable('campaign_actions', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id').notNull().references(() => campaigns.id, { onDelete: 'cascade' }),
  actionType: actionTypeEnum('action_type').notNull(),
  target: text('target').notNull(),
  pricePerAction: integer('price_per_action').notNull(),
  maxVolume: integer('max_volume').notNull(),
  currentVolume: integer('current_volume').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Payment tracking table
// Two types of payments:
// 1. Campaign Funding: brand -> escrow (brandId populated, userId null)
// 2. User Rewards: escrow -> user (brandId null, userId populated) 
export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id').notNull().references(() => campaigns.id, { onDelete: 'cascade' }),
  brandId: uuid('brand_id').references(() => brands.id, { onDelete: 'cascade' }), // For campaign funding payments
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }), // For user reward payments
  fromAddress: text('from_address').notNull(),
  toAddress: text('to_address'),
  amount: integer('amount').notNull(),
  currency: text('currency').notNull().default('ETH'),
  transactionHash: text('transaction_hash').unique(),
  blockNumber: integer('block_number'),
  gasUsed: text('gas_used'),
  status: paymentStatusEnum('status').notNull().default('pending'),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const actions = pgTable('actions', {
  id: uuid('id').primaryKey().defaultRandom(),
  platform: platformEnum('platform').notNull(),
  actionType: actionTypeEnum('action_type').notNull(),
  target: text('target').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  price: integer('price').notNull(),
  maxVolume: integer('max_volume').notNull(),
  currentVolume: integer('current_volume').notNull().default(0),
  eligibilityCriteria: jsonb('eligibility_criteria').notNull().default({}),
  isActive: boolean('is_active').notNull().default(true),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const actionRuns = pgTable('action_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  actionId: uuid('action_id').notNull().references(() => actions.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  socialAccountId: uuid('social_account_id').notNull().references(() => socialAccounts.id, { onDelete: 'cascade' }),
  brandId: uuid('brand_id').references(() => brands.id, { onDelete: 'cascade' }),
  rewardAmount: integer('reward_amount'),
  status: actionRunStatusEnum('status').notNull().default('pending_verification'),
  proof: jsonb('proof').notNull().default({}),
  verificationData: jsonb('verification_data'),
  paymentData: jsonb('payment_data'),
  completedAt: timestamp('completed_at'),
  paidAt: timestamp('paid_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  socialAccounts: many(socialAccounts),
  actionRuns: many(actionRuns),
}));

// Instagram-specific tables
export const instagramAccounts = pgTable('instagram_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  socialAccountId: uuid('social_account_id').notNull().unique().references(() => socialAccounts.id, { onDelete: 'cascade' }),
  
  // Profile Information
  instagramUserId: text('instagram_user_id'),
  username: text('username').notNull(),
  fullName: text('full_name'),
  biography: text('biography'),
  profilePicUrl: text('profile_pic_url'),
  followerCount: integer('follower_count').default(0),
  followingCount: integer('following_count').default(0),
  postCount: integer('post_count').default(0),
  isVerified: boolean('is_verified').default(false),
  isPrivate: boolean('is_private').default(false),
  isBusinessAccount: boolean('is_business_account').default(false),
  isProfessional: boolean('is_professional').default(false),
  accountType: text('account_type'),
  category: text('category'),
  externalUrl: text('external_url'),
  locationCountry: text('location_country'),
  locationCity: text('location_city'),
  mediaCount: integer('media_count'),
  
  // Performance Metrics
  profileVisits7d: integer('profile_visits_7d'),
  accountsReached7d: integer('accounts_reached_7d'),
  accountsEngaged7d: integer('accounts_engaged_7d'),
  followerGrowth7d: decimal('follower_growth_7d', { precision: 5, scale: 2 }),
  profileVisits30d: integer('profile_visits_30d'),
  accountsReached30d: integer('accounts_reached_30d'),
  accountsEngaged30d: integer('accounts_engaged_30d'),
  followerGrowth30d: decimal('follower_growth_30d', { precision: 5, scale: 2 }),
  profileVisits90d: integer('profile_visits_90d'),
  followerGrowth90d: decimal('follower_growth_90d', { precision: 5, scale: 2 }),
  
  // Engagement Metrics
  engagementRate: decimal('engagement_rate', { precision: 5, scale: 2 }),
  videoContentRatio: decimal('video_content_ratio', { precision: 5, scale: 2 }),
  
  // Collection Metadata
  lastCollectedAt: timestamp('last_collected_at'),
  rawData: jsonb('raw_data'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const instagramAudienceDemographics = pgTable('instagram_audience_demographics', {
  id: uuid('id').primaryKey().defaultRandom(),
  instagramAccountId: uuid('instagram_account_id').notNull().references(() => instagramAccounts.id, { onDelete: 'cascade' }),
  
  // Gender Distribution
  genderMalePercentage: decimal('gender_male_percentage', { precision: 5, scale: 2 }),
  genderFemalePercentage: decimal('gender_female_percentage', { precision: 5, scale: 2 }),
  genderUnknownPercentage: decimal('gender_unknown_percentage', { precision: 5, scale: 2 }),
  
  // Age Distribution
  age13_17Percentage: decimal('age_13_17_percentage', { precision: 5, scale: 2 }),
  age18_24Percentage: decimal('age_18_24_percentage', { precision: 5, scale: 2 }),
  age25_34Percentage: decimal('age_25_34_percentage', { precision: 5, scale: 2 }),
  age35_44Percentage: decimal('age_35_44_percentage', { precision: 5, scale: 2 }),
  age45_54Percentage: decimal('age_45_54_percentage', { precision: 5, scale: 2 }),
  age55_64Percentage: decimal('age_55_64_percentage', { precision: 5, scale: 2 }),
  age65PlusPercentage: decimal('age_65_plus_percentage', { precision: 5, scale: 2 }),
  
  // Top Locations
  topLocation1Name: text('top_location_1_name'),
  topLocation1Percentage: decimal('top_location_1_percentage', { precision: 5, scale: 2 }),
  topLocation2Name: text('top_location_2_name'),
  topLocation2Percentage: decimal('top_location_2_percentage', { precision: 5, scale: 2 }),
  topLocation3Name: text('top_location_3_name'),
  topLocation3Percentage: decimal('top_location_3_percentage', { precision: 5, scale: 2 }),
  topLocation4Name: text('top_location_4_name'),
  topLocation4Percentage: decimal('top_location_4_percentage', { precision: 5, scale: 2 }),
  topLocation5Name: text('top_location_5_name'),
  topLocation5Percentage: decimal('top_location_5_percentage', { precision: 5, scale: 2 }),
  
  collectedAt: timestamp('collected_at').defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const instagramContentPerformance = pgTable('instagram_content_performance', {
  id: uuid('id').primaryKey().defaultRandom(),
  instagramAccountId: uuid('instagram_account_id').notNull().references(() => instagramAccounts.id, { onDelete: 'cascade' }),
  
  mediaType: text('media_type'),
  interactions: integer('interactions').default(0),
  views: integer('views').default(0),
  engagementValue: decimal('engagement_value', { precision: 10, scale: 2 }),
  postId: text('post_id'),
  
  collectedAt: timestamp('collected_at').defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// TikTok-specific tables
export const tiktokAccounts = pgTable('tiktok_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  socialAccountId: uuid('social_account_id').notNull().unique().references(() => socialAccounts.id, { onDelete: 'cascade' }),
  
  // TikTok-specific identifiers
  tiktokUserId: text('tiktok_user_id').notNull(), // The long numeric ID like "7520550064620897298"
  secUid: text('sec_uid'), // Secure UID for API calls
  uniqueId: text('unique_id').notNull(), // Username/handle
  
  // Profile Information
  nickname: text('nickname'),
  avatarUrl: text('avatar_url'), // Changed from avatar
  bio: text('bio'), // Changed from signature
  isVerified: boolean('is_verified').default(false), // Changed from verified
  isPrivate: boolean('is_private').default(false),
  
  // Account metadata
  region: text('region'),
  language: text('language'),
  createTime: text('create_time'), // Store as text for bigint compatibility
  
  // Stats
  followerCount: integer('follower_count').default(0),
  followingCount: integer('following_count').default(0),
  likeCount: integer('like_count').default(0), // Changed from heartCount
  videoCount: integer('video_count').default(0),
  profileViewCount: integer('profile_view_count').default(0), // Changed from profileViews
  friendCount: integer('friend_count').default(0),
  
  // Business/Creator features
  analyticsOn: boolean('analytics_on').default(false),
  proAccountInfo: jsonb('pro_account_info'), // Store business/creator account details
  
  // Performance Metrics (30-day window)
  videoViews30d: integer('video_views_30d'),
  profileViews30d: integer('profile_views_30d'),
  shares30d: integer('shares_30d'),
  comments30d: integer('comments_30d'),
  engagementRate: decimal('engagement_rate', { precision: 5, scale: 2 }), // Simplified from engagementRate30d
  avgWatchTime: decimal('avg_watch_time', { precision: 10, scale: 2 }), // Simplified from avgWatchTime30d
  completionRate: decimal('completion_rate', { precision: 5, scale: 2 }), // Simplified from completionRate30d
  
  // Collection Metadata
  lastCollectedAt: timestamp('last_collected_at'),
  rawApiData: jsonb('raw_api_data'), // Store raw API responses for debugging
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const tiktokAudienceDemographics = pgTable('tiktok_audience_demographics', {
  id: uuid('id').primaryKey().defaultRandom(),
  tiktokAccountId: uuid('tiktok_account_id').notNull().references(() => tiktokAccounts.id, { onDelete: 'cascade' }),
  dateCollected: date('date_collected').defaultNow(),
  
  // Gender Distribution  
  genderMalePct: decimal('gender_male_pct', { precision: 5, scale: 2 }),
  genderFemalePct: decimal('gender_female_pct', { precision: 5, scale: 2 }),
  genderOtherPct: decimal('gender_other_pct', { precision: 5, scale: 2 }),
  
  // Age Distribution
  age13_17Pct: decimal('age_13_17_pct', { precision: 5, scale: 2 }),
  age18_24Pct: decimal('age_18_24_pct', { precision: 5, scale: 2 }),
  age25_34Pct: decimal('age_25_34_pct', { precision: 5, scale: 2 }),
  age35_44Pct: decimal('age_35_44_pct', { precision: 5, scale: 2 }),
  age45_54Pct: decimal('age_45_54_pct', { precision: 5, scale: 2 }),
  age55PlusPct: decimal('age_55_plus_pct', { precision: 5, scale: 2 }),
  
  // Top Countries
  topCountries: jsonb('top_countries'), // Array of {country: string, percentage: number}
  
  // Top Cities
  topCities: jsonb('top_cities'), // Array of {city: string, percentage: number}
  
  // Active Times and Devices
  activeTimes: jsonb('active_times'), // Peak hours data
  devices: jsonb('devices'), // Device distribution
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const tiktokContentPerformance = pgTable('tiktok_content_performance', {
  id: uuid('id').primaryKey().defaultRandom(),
  tiktokAccountId: uuid('tiktok_account_id').notNull().references(() => tiktokAccounts.id, { onDelete: 'cascade' }),
  
  // Video/Post identification
  contentId: text('content_id').notNull(), // Changed from itemId
  contentType: text('content_type'), // Changed from itemType to text
  
  // Content details
  description: text('description'),
  createdTime: text('created_time'), // Store as text for bigint compatibility
  duration: integer('duration'), // in seconds
  coverUrl: text('cover_url'),
  
  // Performance metrics
  playCount: text('play_count').default('0'), // Store as text for bigint compatibility
  likeCount: integer('like_count').default(0),
  commentCount: integer('comment_count').default(0),
  shareCount: integer('share_count').default(0),
  favoriteCount: integer('favorite_count').default(0),
  completionRate: decimal('completion_rate', { precision: 5, scale: 2 }),
  avgWatchTime: decimal('avg_watch_time', { precision: 10, scale: 2 }),
  hashtags: jsonb('hashtags'),
  
  // Additional metadata
  visibility: text('visibility'), // Changed to text
  isPinned: boolean('is_pinned').default(false),
  
  collectedAt: timestamp('collected_at').defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const socialAccountsRelations = relations(socialAccounts, ({ one, many }) => ({
  user: one(users, {
    fields: [socialAccounts.userId],
    references: [users.id],
  }),
  actionRuns: many(actionRuns),
  instagramAccount: one(instagramAccounts, {
    fields: [socialAccounts.id],
    references: [instagramAccounts.socialAccountId],
  }),
  tiktokAccount: one(tiktokAccounts, {
    fields: [socialAccounts.id],
    references: [tiktokAccounts.socialAccountId],
  }),
}));

export const actionsRelations = relations(actions, ({ many }) => ({
  actionRuns: many(actionRuns),
}));

export const actionRunsRelations = relations(actionRuns, ({ one }) => ({
  action: one(actions, {
    fields: [actionRuns.actionId],
    references: [actions.id],
  }),
  user: one(users, {
    fields: [actionRuns.userId],
    references: [users.id],
  }),
  socialAccount: one(socialAccounts, {
    fields: [actionRuns.socialAccountId],
    references: [socialAccounts.id],
  }),
}));