CREATE TYPE "public"."column_kind" AS ENUM('backlog', 'active', 'review', 'done', 'custom');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('active', 'paused', 'archived');--> statement-breakpoint
CREATE TYPE "public"."task_kind" AS ENUM('task', 'bug', 'feature', 'chore');--> statement-breakpoint
ALTER TABLE "column" ADD COLUMN "kind" "column_kind" DEFAULT 'custom' NOT NULL;--> statement-breakpoint
ALTER TABLE "column" ADD COLUMN "wip_limit" integer;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "status" "project_status" DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "task" ADD COLUMN "kind" "task_kind" DEFAULT 'task' NOT NULL;--> statement-breakpoint
ALTER TABLE "task" ADD COLUMN "estimate" integer;