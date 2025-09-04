CREATE TYPE "public"."payout_status" AS ENUM('pending', 'on_hold', 'released', 'failed');--> statement-breakpoint
CREATE TYPE "public"."platform" AS ENUM('x', 'farcaster', 'reddit');--> statement-breakpoint
CREATE TYPE "public"."reward_mode" AS ENUM('static', 'dynamic');--> statement-breakpoint
CREATE TYPE "public"."task_assignment_status" AS ENUM('assigned', 'submitted', 'approved', 'awaiting', 'paid', 'rejected', 'expired');--> statement-breakpoint
CREATE TYPE "public"."task_type" AS ENUM('comment', 'upvote', 'like', 'love', 'follow');--> statement-breakpoint
CREATE TYPE "public"."verification" AS ENUM('manual', 'auto');--> statement-breakpoint
CREATE TABLE "brands" (
	"brand_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "brands_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "task_assignments" (
	"task_assignment_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"status" "task_assignment_status" DEFAULT 'assigned' NOT NULL,
	"evidence" json,
	"reward_amount" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"submitted_at" timestamp,
	"approved_at" timestamp,
	"paid_at" timestamp,
	"payout_status" "payout_status" DEFAULT 'pending',
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "task_assignments_task_id_user_id_unique" UNIQUE("task_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"task_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"platform" "platform" NOT NULL,
	"type" "task_type" NOT NULL,
	"targets" text[] NOT NULL,
	"volume" integer NOT NULL,
	"budget" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"reward_per_action" numeric(10, 2),
	"expiration_date" timestamp,
	"payout_release_after" text,
	"active" boolean DEFAULT true NOT NULL,
	"instructions" text[] NOT NULL,
	"verification" "verification" DEFAULT 'auto' NOT NULL,
	"max_actions_per_user" integer DEFAULT 1 NOT NULL,
	"reward_distribution" json NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"privy_user_id" text PRIMARY KEY NOT NULL,
	"balance" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"cash_out_limit" numeric(10, 2) DEFAULT '5.00' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"reddit_username" text,
	"reddit_data" text,
	"profile_scraped_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "task_assignments" ADD CONSTRAINT "task_assignments_task_id_tasks_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("task_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_assignments" ADD CONSTRAINT "task_assignments_user_id_users_privy_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("privy_user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_brand_id_brands_brand_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("brand_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_active_assignment_idx" ON "task_assignments" USING btree ("user_id") WHERE "task_assignments"."status" = 'assigned';