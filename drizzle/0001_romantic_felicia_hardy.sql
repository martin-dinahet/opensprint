CREATE TYPE "public"."project_member_role" AS ENUM('owner', 'admin', 'member');--> statement-breakpoint
CREATE TYPE "public"."task_priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TABLE "board" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"name" text NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_member" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" "project_member_role" NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task" (
	"id" text PRIMARY KEY NOT NULL,
	"board_id" text NOT NULL,
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
ALTER TABLE "board" ADD CONSTRAINT "board_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_member" ADD CONSTRAINT "project_member_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_member" ADD CONSTRAINT "project_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_board_id_board_id_fk" FOREIGN KEY ("board_id") REFERENCES "public"."board"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_assignee_id_project_member_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."project_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "board_project_id_idx" ON "board" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_member_project_id_idx" ON "project_member" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_member_user_id_idx" ON "project_member" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "project_name_idx" ON "project" USING btree ("name");--> statement-breakpoint
CREATE INDEX "task_board_id_idx" ON "task" USING btree ("board_id");--> statement-breakpoint
CREATE INDEX "task_assignee_id_idx" ON "task" USING btree ("assignee_id");