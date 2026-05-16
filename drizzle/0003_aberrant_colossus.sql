CREATE TYPE "public"."member_role" AS ENUM('owner', 'admin', 'member');--> statement-breakpoint
ALTER TABLE "task" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "board_column" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "board" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "project_member" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "task" CASCADE;--> statement-breakpoint
DROP TABLE "board_column" CASCADE;--> statement-breakpoint
DROP TABLE "board" CASCADE;--> statement-breakpoint
DROP TABLE "project_member" CASCADE;--> statement-breakpoint
CREATE TABLE "column" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"name" text NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" "member_role" NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task" (
	"id" text PRIMARY KEY NOT NULL,
	"column_id" text NOT NULL,
	"assignee_id" text,
	"title" text NOT NULL,
	"description" text,
	"priority" "task_priority" NOT NULL,
	"position" integer NOT NULL,
	"due_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "column" ADD CONSTRAINT "column_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_column_id_column_id_fk" FOREIGN KEY ("column_id") REFERENCES "public"."column"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_assignee_id_member_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "column_project_id_idx" ON "column" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "member_project_id_idx" ON "member" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "member_user_id_idx" ON "member" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "task_column_id_idx" ON "task" USING btree ("column_id");--> statement-breakpoint
CREATE INDEX "task_assignee_id_idx" ON "task" USING btree ("assignee_id");--> statement-breakpoint
DROP TYPE "public"."project_member_role";
