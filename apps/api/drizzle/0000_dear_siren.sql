CREATE TYPE "public"."action_run_status" AS ENUM('pending_verification', 'dom_verified', 'cdp_verified', 'completed', 'failed', 'paid');--> statement-breakpoint
CREATE TYPE "public"."action_type" AS ENUM('like', 'comment', 'share', 'follow', 'retweet', 'upvote', 'award');--> statement-breakpoint
CREATE TYPE "public"."campaign_status" AS ENUM('draft', 'pending_payment', 'active', 'paused', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'processing', 'completed', 'failed', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."platform" AS ENUM('tiktok', 'x', 'instagram', 'reddit', 'facebook', 'farcaster', 'youtube', 'linkedin');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'pending_verification', 'suspended', 'deactivated');--> statement-breakpoint
CREATE TABLE "action_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"action_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"social_account_id" uuid NOT NULL,
	"brand_id" uuid,
	"reward_amount" integer,
	"status" "action_run_status" DEFAULT 'pending_verification' NOT NULL,
	"proof" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"verification_data" jsonb,
	"payment_data" jsonb,
	"completed_at" timestamp,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform" "platform" NOT NULL,
	"action_type" "action_type" NOT NULL,
	"target" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"price" integer NOT NULL,
	"max_volume" integer NOT NULL,
	"current_volume" integer DEFAULT 0 NOT NULL,
	"eligibility_criteria" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brands" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wallet_address" text NOT NULL,
	"contact_email" text,
	"total_spent" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "brands_wallet_address_unique" UNIQUE("wallet_address")
);
--> statement-breakpoint
CREATE TABLE "campaign_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"action_type" "action_type" NOT NULL,
	"target" text NOT NULL,
	"price_per_action" integer NOT NULL,
	"max_volume" integer NOT NULL,
	"current_volume" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"brand_wallet_address" text NOT NULL,
	"platform" "platform" NOT NULL,
	"targeting_rules" jsonb NOT NULL,
	"total_budget" integer NOT NULL,
	"remaining_budget" integer NOT NULL,
	"reward_per_action" integer DEFAULT 100 NOT NULL,
	"status" "campaign_status" DEFAULT 'draft' NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "instagram_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"social_account_id" uuid NOT NULL,
	"instagram_user_id" text,
	"username" text NOT NULL,
	"full_name" text,
	"biography" text,
	"profile_pic_url" text,
	"follower_count" integer DEFAULT 0,
	"following_count" integer DEFAULT 0,
	"post_count" integer DEFAULT 0,
	"is_verified" boolean DEFAULT false,
	"is_private" boolean DEFAULT false,
	"is_business_account" boolean DEFAULT false,
	"is_professional" boolean DEFAULT false,
	"account_type" text,
	"category" text,
	"external_url" text,
	"location_country" text,
	"location_city" text,
	"media_count" integer,
	"profile_visits_7d" integer,
	"accounts_reached_7d" integer,
	"accounts_engaged_7d" integer,
	"follower_growth_7d" numeric(5, 2),
	"profile_visits_30d" integer,
	"accounts_reached_30d" integer,
	"accounts_engaged_30d" integer,
	"follower_growth_30d" numeric(5, 2),
	"profile_visits_90d" integer,
	"follower_growth_90d" numeric(5, 2),
	"engagement_rate" numeric(5, 2),
	"video_content_ratio" numeric(5, 2),
	"last_collected_at" timestamp,
	"raw_data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "instagram_accounts_social_account_id_unique" UNIQUE("social_account_id")
);
--> statement-breakpoint
CREATE TABLE "instagram_audience_demographics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"instagram_account_id" uuid NOT NULL,
	"gender_male_percentage" numeric(5, 2),
	"gender_female_percentage" numeric(5, 2),
	"gender_unknown_percentage" numeric(5, 2),
	"age_13_17_percentage" numeric(5, 2),
	"age_18_24_percentage" numeric(5, 2),
	"age_25_34_percentage" numeric(5, 2),
	"age_35_44_percentage" numeric(5, 2),
	"age_45_54_percentage" numeric(5, 2),
	"age_55_64_percentage" numeric(5, 2),
	"age_65_plus_percentage" numeric(5, 2),
	"top_location_1_name" text,
	"top_location_1_percentage" numeric(5, 2),
	"top_location_2_name" text,
	"top_location_2_percentage" numeric(5, 2),
	"top_location_3_name" text,
	"top_location_3_percentage" numeric(5, 2),
	"top_location_4_name" text,
	"top_location_4_percentage" numeric(5, 2),
	"top_location_5_name" text,
	"top_location_5_percentage" numeric(5, 2),
	"collected_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "instagram_content_performance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"instagram_account_id" uuid NOT NULL,
	"media_type" text,
	"interactions" integer DEFAULT 0,
	"views" integer DEFAULT 0,
	"engagement_value" numeric(10, 2),
	"post_id" text,
	"collected_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"brand_id" uuid,
	"user_id" uuid,
	"from_address" text NOT NULL,
	"to_address" text,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'ETH' NOT NULL,
	"transaction_hash" text,
	"block_number" integer,
	"gas_used" text,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payments_transaction_hash_unique" UNIQUE("transaction_hash")
);
--> statement-breakpoint
CREATE TABLE "social_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"platform" "platform" NOT NULL,
	"handle" text NOT NULL,
	"platform_user_id" text,
	"is_verified" boolean DEFAULT false NOT NULL,
	"last_verified_at" timestamp,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tiktok_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"social_account_id" uuid NOT NULL,
	"unique_id" text NOT NULL,
	"bio" text,
	"is_verified" boolean DEFAULT false,
	"is_private" boolean DEFAULT false,
	"analytics_on" boolean DEFAULT false,
	"region" text,
	"language" text,
	"create_time" text,
	"last_collected_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tiktok_accounts_social_account_id_unique" UNIQUE("social_account_id")
);
--> statement-breakpoint
CREATE TABLE "tiktok_viewer_demographics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tiktok_account_id" uuid NOT NULL,
	"collected_at" timestamp DEFAULT now() NOT NULL,
	"range_days" integer DEFAULT 30 NOT NULL,
	"gender_female" numeric(5, 2),
	"gender_male" numeric(5, 2),
	"gender_other" numeric(5, 2),
	"age_18_24" numeric(5, 2),
	"age_25_34" numeric(5, 2),
	"age_35_44" numeric(5, 2),
	"age_45_54" numeric(5, 2),
	"age_55_plus" numeric(5, 2),
	"unique_viewers" integer,
	"new_viewers" integer,
	"returning_viewers" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tiktok_viewer_geography" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"demographics_id" uuid NOT NULL,
	"country_code" text NOT NULL,
	"country_name" text NOT NULL,
	"country_pct" numeric(5, 2) NOT NULL,
	"city_name" text,
	"city_pct" numeric(5, 2),
	"rank" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"privy_did" text,
	"wallet_address" text,
	"email" text,
	"status" "user_status" DEFAULT 'pending_verification' NOT NULL,
	"total_earned" integer DEFAULT 0 NOT NULL,
	"available_balance" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_privy_did_unique" UNIQUE("privy_did"),
	CONSTRAINT "users_wallet_address_unique" UNIQUE("wallet_address"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "action_runs" ADD CONSTRAINT "action_runs_action_id_actions_id_fk" FOREIGN KEY ("action_id") REFERENCES "public"."actions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "action_runs" ADD CONSTRAINT "action_runs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "action_runs" ADD CONSTRAINT "action_runs_social_account_id_social_accounts_id_fk" FOREIGN KEY ("social_account_id") REFERENCES "public"."social_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "action_runs" ADD CONSTRAINT "action_runs_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_actions" ADD CONSTRAINT "campaign_actions_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instagram_accounts" ADD CONSTRAINT "instagram_accounts_social_account_id_social_accounts_id_fk" FOREIGN KEY ("social_account_id") REFERENCES "public"."social_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instagram_audience_demographics" ADD CONSTRAINT "instagram_audience_demographics_instagram_account_id_instagram_" FOREIGN KEY ("instagram_account_id") REFERENCES "public"."instagram_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instagram_content_performance" ADD CONSTRAINT "instagram_content_performance_instagram_account_id_instagram_ac" FOREIGN KEY ("instagram_account_id") REFERENCES "public"."instagram_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_accounts" ADD CONSTRAINT "social_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tiktok_accounts" ADD CONSTRAINT "tiktok_accounts_social_account_id_social_accounts_id_fk" FOREIGN KEY ("social_account_id") REFERENCES "public"."social_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tiktok_viewer_demographics" ADD CONSTRAINT "tiktok_viewer_demographics_tiktok_account_id_fk" FOREIGN KEY ("tiktok_account_id") REFERENCES "public"."tiktok_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tiktok_viewer_geography" ADD CONSTRAINT "tiktok_viewer_geography_demographics_id_fk" FOREIGN KEY ("demographics_id") REFERENCES "public"."tiktok_viewer_demographics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_tvd_account_collected" ON "tiktok_viewer_demographics" USING btree ("tiktok_account_id","collected_at");--> statement-breakpoint
CREATE INDEX "idx_tvg_demographics" ON "tiktok_viewer_geography" USING btree ("demographics_id");--> statement-breakpoint
CREATE INDEX "idx_tvg_country" ON "tiktok_viewer_geography" USING btree ("country_code");--> statement-breakpoint
CREATE INDEX "idx_tvg_rank" ON "tiktok_viewer_geography" USING btree ("demographics_id","rank");