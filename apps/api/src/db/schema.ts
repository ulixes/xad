import { pgTable, unique, uuid, text, integer, jsonb, timestamp, foreignKey, boolean, numeric, date, pgEnum, index } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm/relations";


export const actionRunStatus = pgEnum("action_run_status", ['pending_verification', 'dom_verified', 'cdp_verified', 'completed', 'failed', 'paid'])
export const actionType = pgEnum("action_type", ['like', 'comment', 'share', 'follow', 'retweet', 'upvote', 'award'])
export const campaignStatus = pgEnum("campaign_status", ['draft', 'pending_payment', 'active', 'paused', 'completed', 'cancelled'])
export const paymentStatus = pgEnum("payment_status", ['pending', 'processing', 'completed', 'failed', 'refunded'])
export const platform = pgEnum("platform", ['tiktok', 'x', 'instagram', 'reddit', 'facebook', 'farcaster', 'youtube', 'linkedin'])
export const userStatus = pgEnum("user_status", ['active', 'pending_verification', 'suspended', 'deactivated'])


export const brands = pgTable("brands", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	walletAddress: text("wallet_address").notNull(), // Single wallet address for this brand
	contactEmail: text("contact_email"),
	totalSpent: integer("total_spent").default(0).notNull(),
	metadata: jsonb().default({}).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("brands_wallet_address_unique").on(table.walletAddress),
]);

export const campaigns = pgTable("campaigns", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	brandId: uuid("brand_id").notNull(),
	brandWalletAddress: text("brand_wallet_address").notNull(),
	platform: platform().notNull(),
	targetingRules: jsonb("targeting_rules").notNull(),
	totalBudget: integer("total_budget").notNull(),
	remainingBudget: integer("remaining_budget").notNull(),
	rewardPerAction: integer("reward_per_action").default(100).notNull(),
	status: campaignStatus().default('draft').notNull(),
	isActive: boolean("is_active").default(false).notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.brandId],
			foreignColumns: [brands.id],
			name: "campaigns_brand_id_brands_id_fk"
		}).onDelete("cascade"),
]);

export const campaignActions = pgTable("campaign_actions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	campaignId: uuid("campaign_id").notNull(),
	actionType: actionType("action_type").notNull(),
	target: text().notNull(),
	pricePerAction: integer("price_per_action").notNull(),
	maxVolume: integer("max_volume").notNull(),
	currentVolume: integer("current_volume").default(0).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.campaignId],
			foreignColumns: [campaigns.id],
			name: "campaign_actions_campaign_id_campaigns_id_fk"
		}).onDelete("cascade"),
]);

export const instagramAccounts = pgTable("instagram_accounts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	socialAccountId: uuid("social_account_id").notNull(),
	instagramUserId: text("instagram_user_id"),
	username: text().notNull(),
	fullName: text("full_name"),
	biography: text(),
	profilePicUrl: text("profile_pic_url"),
	followerCount: integer("follower_count").default(0),
	followingCount: integer("following_count").default(0),
	postCount: integer("post_count").default(0),
	isVerified: boolean("is_verified").default(false),
	isPrivate: boolean("is_private").default(false),
	isBusinessAccount: boolean("is_business_account").default(false),
	isProfessional: boolean("is_professional").default(false),
	accountType: text("account_type"),
	category: text(),
	externalUrl: text("external_url"),
	locationCountry: text("location_country"),
	locationCity: text("location_city"),
	mediaCount: integer("media_count"),
	profileVisits7D: integer("profile_visits_7d"),
	accountsReached7D: integer("accounts_reached_7d"),
	accountsEngaged7D: integer("accounts_engaged_7d"),
	followerGrowth7D: numeric("follower_growth_7d", { precision: 5, scale:  2 }),
	profileVisits30D: integer("profile_visits_30d"),
	accountsReached30D: integer("accounts_reached_30d"),
	accountsEngaged30D: integer("accounts_engaged_30d"),
	followerGrowth30D: numeric("follower_growth_30d", { precision: 5, scale:  2 }),
	profileVisits90D: integer("profile_visits_90d"),
	followerGrowth90D: numeric("follower_growth_90d", { precision: 5, scale:  2 }),
	engagementRate: numeric("engagement_rate", { precision: 5, scale:  2 }),
	videoContentRatio: numeric("video_content_ratio", { precision: 5, scale:  2 }),
	lastCollectedAt: timestamp("last_collected_at", { mode: 'string' }),
	rawData: jsonb("raw_data"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.socialAccountId],
			foreignColumns: [socialAccounts.id],
			name: "instagram_accounts_social_account_id_social_accounts_id_fk"
		}).onDelete("cascade"),
	unique("instagram_accounts_social_account_id_unique").on(table.socialAccountId),
]);

export const instagramAudienceDemographics = pgTable("instagram_audience_demographics", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	instagramAccountId: uuid("instagram_account_id").notNull(),
	genderMalePercentage: numeric("gender_male_percentage", { precision: 5, scale:  2 }),
	genderFemalePercentage: numeric("gender_female_percentage", { precision: 5, scale:  2 }),
	genderUnknownPercentage: numeric("gender_unknown_percentage", { precision: 5, scale:  2 }),
	age1317Percentage: numeric("age_13_17_percentage", { precision: 5, scale:  2 }),
	age1824Percentage: numeric("age_18_24_percentage", { precision: 5, scale:  2 }),
	age2534Percentage: numeric("age_25_34_percentage", { precision: 5, scale:  2 }),
	age3544Percentage: numeric("age_35_44_percentage", { precision: 5, scale:  2 }),
	age4554Percentage: numeric("age_45_54_percentage", { precision: 5, scale:  2 }),
	age5564Percentage: numeric("age_55_64_percentage", { precision: 5, scale:  2 }),
	age65PlusPercentage: numeric("age_65_plus_percentage", { precision: 5, scale:  2 }),
	topLocation1Name: text("top_location_1_name"),
	topLocation1Percentage: numeric("top_location_1_percentage", { precision: 5, scale:  2 }),
	topLocation2Name: text("top_location_2_name"),
	topLocation2Percentage: numeric("top_location_2_percentage", { precision: 5, scale:  2 }),
	topLocation3Name: text("top_location_3_name"),
	topLocation3Percentage: numeric("top_location_3_percentage", { precision: 5, scale:  2 }),
	topLocation4Name: text("top_location_4_name"),
	topLocation4Percentage: numeric("top_location_4_percentage", { precision: 5, scale:  2 }),
	topLocation5Name: text("top_location_5_name"),
	topLocation5Percentage: numeric("top_location_5_percentage", { precision: 5, scale:  2 }),
	collectedAt: timestamp("collected_at", { mode: 'string' }).defaultNow(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.instagramAccountId],
			foreignColumns: [instagramAccounts.id],
			name: "instagram_audience_demographics_instagram_account_id_instagram_"
		}).onDelete("cascade"),
]);

export const instagramContentPerformance = pgTable("instagram_content_performance", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	instagramAccountId: uuid("instagram_account_id").notNull(),
	mediaType: text("media_type"),
	interactions: integer().default(0),
	views: integer().default(0),
	engagementValue: numeric("engagement_value", { precision: 10, scale:  2 }),
	postId: text("post_id"),
	collectedAt: timestamp("collected_at", { mode: 'string' }).defaultNow(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.instagramAccountId],
			foreignColumns: [instagramAccounts.id],
			name: "instagram_content_performance_instagram_account_id_instagram_ac"
		}).onDelete("cascade"),
]);

export const payments = pgTable("payments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	campaignId: uuid("campaign_id").notNull(),
	brandId: uuid("brand_id"),
	userId: uuid("user_id"),
	fromAddress: text("from_address").notNull(),
	toAddress: text("to_address"),
	amount: integer().notNull(),
	currency: text().default('ETH').notNull(),
	transactionHash: text("transaction_hash"),
	blockNumber: integer("block_number"),
	gasUsed: text("gas_used"),
	status: paymentStatus().default('pending').notNull(),
	metadata: jsonb().default({}).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.campaignId],
			foreignColumns: [campaigns.id],
			name: "payments_campaign_id_campaigns_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.brandId],
			foreignColumns: [brands.id],
			name: "payments_brand_id_brands_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "payments_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("payments_transaction_hash_unique").on(table.transactionHash),
]);

export const actions = pgTable("actions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	platform: platform().notNull(),
	actionType: actionType("action_type").notNull(),
	target: text().notNull(),
	title: text().notNull(),
	description: text(),
	price: integer().notNull(),
	maxVolume: integer("max_volume").notNull(),
	currentVolume: integer("current_volume").default(0).notNull(),
	eligibilityCriteria: jsonb("eligibility_criteria").default({}).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const socialAccounts = pgTable("social_accounts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	platform: platform().notNull(),
	handle: text().notNull(),
	platformUserId: text("platform_user_id"),
	isVerified: boolean("is_verified").default(false).notNull(),
	lastVerifiedAt: timestamp("last_verified_at", { mode: 'string' }),
	metadata: jsonb().default({}).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "social_accounts_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const tiktokAccounts = pgTable("tiktok_accounts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	socialAccountId: uuid("social_account_id").notNull(),
	uniqueId: text("unique_id").notNull(), // @username (handle)
	bio: text(), // Profile description
	isVerified: boolean("is_verified").default(false), // Blue checkmark status
	isPrivate: boolean("is_private").default(false), // Private account flag
	analyticsOn: boolean("analytics_on").default(false), // Analytics enabled
	region: text(), // Account region
	language: text(), // Primary language
	createTime: text("create_time"), // Account creation date
	followers: integer().default(0).notNull(), // Follower count
	following: integer().default(0).notNull(), // Following count
	lastCollectedAt: timestamp("last_collected_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.socialAccountId],
			foreignColumns: [socialAccounts.id],
			name: "tiktok_accounts_social_account_id_social_accounts_id_fk"
		}).onDelete("cascade"),
	unique("tiktok_accounts_social_account_id_unique").on(table.socialAccountId),
]);

export const tiktokViewerDemographics = pgTable("tiktok_viewer_demographics", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tiktokAccountId: uuid("tiktok_account_id").notNull(),
	
	// Collection metadata
	collectedAt: timestamp("collected_at", { mode: 'string' }).defaultNow().notNull(),
	rangeDays: integer("range_days").default(7).notNull(),
	
	// Gender distribution (percentages)
	genderFemale: numeric("gender_female", { precision: 5, scale: 2 }),
	genderMale: numeric("gender_male", { precision: 5, scale: 2 }),
	genderOther: numeric("gender_other", { precision: 5, scale: 2 }),
	
	// Age distribution (percentages)  
	age18to24: numeric("age_18_24", { precision: 5, scale: 2 }),
	age25to34: numeric("age_25_34", { precision: 5, scale: 2 }),
	age35to44: numeric("age_35_44", { precision: 5, scale: 2 }),
	age45to54: numeric("age_45_54", { precision: 5, scale: 2 }),
	age55plus: numeric("age_55_plus", { precision: 5, scale: 2 }),
	
	// Viewer metrics
	uniqueViewers: integer("unique_viewers"),
	newViewers: integer("new_viewers"),
	returningViewers: integer("returning_viewers"),
	
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
		columns: [table.tiktokAccountId],
		foreignColumns: [tiktokAccounts.id],
		name: "tiktok_viewer_demographics_tiktok_account_id_fk"
	}).onDelete("cascade"),
	index("idx_tvd_account_collected").on(table.tiktokAccountId, table.collectedAt),
]);

export const tiktokViewerGeography = pgTable("tiktok_viewer_geography", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	demographicsId: uuid("demographics_id").notNull(),
	
	// Country data
	countryCode: text("country_code").notNull(), // 2-letter ISO code
	countryName: text("country_name").notNull(),
	countryPct: numeric("country_pct", { precision: 5, scale: 2 }).notNull(),
	
	// City data (optional - may be null for country-only entries)
	cityName: text("city_name"),
	cityPct: numeric("city_pct", { precision: 5, scale: 2 }),
	
	// Ranking (1 = top country, 2 = second, etc.)
	rank: integer().notNull(),
	
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
		columns: [table.demographicsId], 
		foreignColumns: [tiktokViewerDemographics.id],
		name: "tiktok_viewer_geography_demographics_id_fk"
	}).onDelete("cascade"),
	index("idx_tvg_demographics").on(table.demographicsId),
	index("idx_tvg_country").on(table.countryCode),
	index("idx_tvg_rank").on(table.demographicsId, table.rank),
]);


export const actionRuns = pgTable("action_runs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	actionId: uuid("action_id").notNull(),
	userId: uuid("user_id").notNull(),
	socialAccountId: uuid("social_account_id").notNull(),
	brandId: uuid("brand_id"),
	rewardAmount: integer("reward_amount"),
	status: actionRunStatus().default('pending_verification').notNull(),
	proof: jsonb().default({}).notNull(),
	verificationData: jsonb("verification_data"),
	paymentData: jsonb("payment_data"),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	paidAt: timestamp("paid_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.actionId],
			foreignColumns: [actions.id],
			name: "action_runs_action_id_actions_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "action_runs_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.socialAccountId],
			foreignColumns: [socialAccounts.id],
			name: "action_runs_social_account_id_social_accounts_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.brandId],
			foreignColumns: [brands.id],
			name: "action_runs_brand_id_brands_id_fk"
		}).onDelete("cascade"),
]);

export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	privyDid: text("privy_did"),
	walletAddress: text("wallet_address"),
	email: text(),
	status: userStatus().default('pending_verification').notNull(),
	totalEarned: integer("total_earned").default(0).notNull(),
	availableBalance: integer("available_balance").default(0).notNull(),
	metadata: jsonb().default({}).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("users_privy_did_unique").on(table.privyDid),
	unique("users_wallet_address_unique").on(table.walletAddress),
	unique("users_email_unique").on(table.email),
]);



export const campaignsRelations = relations(campaigns, ({one, many}) => ({
	brand: one(brands, {
		fields: [campaigns.brandId],
		references: [brands.id]
	}),
	campaignActions: many(campaignActions),
	payments: many(payments),
}));

export const brandsRelations = relations(brands, ({many}) => ({
	campaigns: many(campaigns),
	payments: many(payments),
	actionRuns: many(actionRuns),
}));

export const campaignActionsRelations = relations(campaignActions, ({one}) => ({
	campaign: one(campaigns, {
		fields: [campaignActions.campaignId],
		references: [campaigns.id]
	}),
}));

export const instagramAccountsRelations = relations(instagramAccounts, ({one, many}) => ({
	socialAccount: one(socialAccounts, {
		fields: [instagramAccounts.socialAccountId],
		references: [socialAccounts.id]
	}),
	instagramAudienceDemographics: many(instagramAudienceDemographics),
	instagramContentPerformances: many(instagramContentPerformance),
}));

export const socialAccountsRelations = relations(socialAccounts, ({one, many}) => ({
	instagramAccounts: many(instagramAccounts),
	user: one(users, {
		fields: [socialAccounts.userId],
		references: [users.id]
	}),
	tiktokAccounts: many(tiktokAccounts),
	actionRuns: many(actionRuns),
}));

export const instagramAudienceDemographicsRelations = relations(instagramAudienceDemographics, ({one}) => ({
	instagramAccount: one(instagramAccounts, {
		fields: [instagramAudienceDemographics.instagramAccountId],
		references: [instagramAccounts.id]
	}),
}));

export const instagramContentPerformanceRelations = relations(instagramContentPerformance, ({one}) => ({
	instagramAccount: one(instagramAccounts, {
		fields: [instagramContentPerformance.instagramAccountId],
		references: [instagramAccounts.id]
	}),
}));

export const paymentsRelations = relations(payments, ({one}) => ({
	campaign: one(campaigns, {
		fields: [payments.campaignId],
		references: [campaigns.id]
	}),
	brand: one(brands, {
		fields: [payments.brandId],
		references: [brands.id]
	}),
	user: one(users, {
		fields: [payments.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	payments: many(payments),
	socialAccounts: many(socialAccounts),
	actionRuns: many(actionRuns),
}));

export const tiktokAccountsRelations = relations(tiktokAccounts, ({one, many}) => ({
	socialAccount: one(socialAccounts, {
		fields: [tiktokAccounts.socialAccountId],
		references: [socialAccounts.id]
	}),
	viewerDemographics: many(tiktokViewerDemographics),
}));

export const tiktokViewerDemographicsRelations = relations(tiktokViewerDemographics, ({one, many}) => ({
	tiktokAccount: one(tiktokAccounts, {
		fields: [tiktokViewerDemographics.tiktokAccountId],
		references: [tiktokAccounts.id]
	}),
	geography: many(tiktokViewerGeography),
}));

export const tiktokViewerGeographyRelations = relations(tiktokViewerGeography, ({one}) => ({
	demographics: one(tiktokViewerDemographics, {
		fields: [tiktokViewerGeography.demographicsId],
		references: [tiktokViewerDemographics.id]
	}),
}));

export const actionRunsRelations = relations(actionRuns, ({one}) => ({
	action: one(actions, {
		fields: [actionRuns.actionId],
		references: [actions.id]
	}),
	user: one(users, {
		fields: [actionRuns.userId],
		references: [users.id]
	}),
	socialAccount: one(socialAccounts, {
		fields: [actionRuns.socialAccountId],
		references: [socialAccounts.id]
	}),
	brand: one(brands, {
		fields: [actionRuns.brandId],
		references: [brands.id]
	}),
}));

export const actionsRelations = relations(actions, ({many}) => ({
	actionRuns: many(actionRuns),
}));