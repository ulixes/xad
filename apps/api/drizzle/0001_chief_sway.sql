CREATE TABLE "tiktok_follower_demographics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tiktok_account_id" uuid NOT NULL,
	"collected_at" timestamp DEFAULT now() NOT NULL,
	"range_days" integer DEFAULT 7 NOT NULL,
	"follower_count" integer DEFAULT 0 NOT NULL,
	"gender_female" numeric(5, 2),
	"gender_male" numeric(5, 2),
	"gender_other" numeric(5, 2),
	"age_18_24" numeric(5, 2),
	"age_25_34" numeric(5, 2),
	"age_35_44" numeric(5, 2),
	"age_45_54" numeric(5, 2),
	"age_55_plus" numeric(5, 2),
	"active_followers" integer,
	"inactive_followers" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tiktok_follower_geography" (
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
ALTER TABLE "tiktok_follower_demographics" ADD CONSTRAINT "tiktok_follower_demographics_tiktok_account_id_fk" FOREIGN KEY ("tiktok_account_id") REFERENCES "public"."tiktok_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tiktok_follower_geography" ADD CONSTRAINT "tiktok_follower_geography_demographics_id_fk" FOREIGN KEY ("demographics_id") REFERENCES "public"."tiktok_follower_demographics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_tfd_account_collected" ON "tiktok_follower_demographics" USING btree ("tiktok_account_id","collected_at");--> statement-breakpoint
CREATE INDEX "idx_tfg_demographics" ON "tiktok_follower_geography" USING btree ("demographics_id");--> statement-breakpoint
CREATE INDEX "idx_tfg_country" ON "tiktok_follower_geography" USING btree ("country_code");--> statement-breakpoint
CREATE INDEX "idx_tfg_rank" ON "tiktok_follower_geography" USING btree ("demographics_id","rank");