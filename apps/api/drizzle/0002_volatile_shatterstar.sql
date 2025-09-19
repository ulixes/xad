ALTER TABLE "tiktok_accounts" ADD COLUMN "followers" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "tiktok_accounts" ADD COLUMN "following" integer DEFAULT 0 NOT NULL;