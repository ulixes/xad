ALTER TABLE "action_runs" DROP CONSTRAINT IF EXISTS "action_runs_action_id_actions_id_fk";
--> statement-breakpoint
DROP TABLE IF EXISTS "actions" CASCADE;
--> statement-breakpoint
ALTER TABLE "action_runs" ADD CONSTRAINT "action_runs_action_id_campaign_actions_id_fk" FOREIGN KEY ("action_id") REFERENCES "public"."campaign_actions"("id") ON DELETE cascade ON UPDATE no action;