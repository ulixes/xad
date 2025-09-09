CREATE TYPE "public"."action_run_status" AS ENUM('pending_verification', 'completed', 'failed', 'paid');--> statement-breakpoint
CREATE TYPE "public"."action_type" AS ENUM('like', 'comment', 'share', 'follow', 'retweet', 'upvote', 'award');--> statement-breakpoint
CREATE TYPE "public"."platform" AS ENUM('tiktok', 'x', 'instagram', 'reddit', 'facebook', 'farcaster', 'youtube', 'linkedin');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'pending_verification', 'suspended', 'deactivated');--> statement-breakpoint
CREATE TABLE "action_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"action_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"social_account_id" uuid NOT NULL,
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
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"privy_id" text,
	"email" text NOT NULL,
	"status" "user_status" DEFAULT 'pending_verification' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_privy_id_unique" UNIQUE("privy_id"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "action_runs" ADD CONSTRAINT "action_runs_action_id_actions_id_fk" FOREIGN KEY ("action_id") REFERENCES "public"."actions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "action_runs" ADD CONSTRAINT "action_runs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "action_runs" ADD CONSTRAINT "action_runs_social_account_id_social_accounts_id_fk" FOREIGN KEY ("social_account_id") REFERENCES "public"."social_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_accounts" ADD CONSTRAINT "social_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;