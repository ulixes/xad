CREATE TABLE "tiktok_viewer_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tiktok_account_id" uuid NOT NULL,
	"collected_at" timestamp DEFAULT now() NOT NULL,
	"range_days" integer DEFAULT 28 NOT NULL,
	"total_unique_viewers" integer DEFAULT 0,
	"total_new_viewers" integer DEFAULT 0,
	"total_returning_viewers" integer DEFAULT 0,
	"new_viewers_series" jsonb,
	"returning_viewers_series" jsonb,
	"unique_viewers_series" jsonb,
	"viewer_active_hours" jsonb,
	"viewer_active_days" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tiktok_viewer_metrics" ADD CONSTRAINT "tiktok_viewer_metrics_tiktok_account_id_fk" FOREIGN KEY ("tiktok_account_id") REFERENCES "public"."tiktok_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_tvm_account_collected" ON "tiktok_viewer_metrics" USING btree ("tiktok_account_id","collected_at");--> statement-breakpoint
CREATE INDEX "idx_tvm_range" ON "tiktok_viewer_metrics" USING btree ("tiktok_account_id","range_days");