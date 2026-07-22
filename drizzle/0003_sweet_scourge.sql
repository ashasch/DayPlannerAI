CREATE TABLE "dashboard_summaries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"week_start" date NOT NULL,
	"content" text NOT NULL,
	"model" text NOT NULL,
	"locale" text NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "completed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "dashboard_summaries" ADD CONSTRAINT "dashboard_summaries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "dashboard_summaries_user_week_idx" ON "dashboard_summaries" USING btree ("user_id","week_start");--> statement-breakpoint
CREATE INDEX "tasks_user_id_completed_at_idx" ON "tasks" USING btree ("user_id","completed_at");--> statement-breakpoint
-- Backfill tasks completed before this column existed. `updated_at` is an
-- approximation (any later edit moved it), but it keeps history in the heatmap
-- instead of silently dropping every task ticked off so far.
UPDATE "tasks" SET "completed_at" = "updated_at" WHERE "completed" = true AND "completed_at" IS NULL;