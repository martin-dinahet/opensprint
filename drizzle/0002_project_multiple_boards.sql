ALTER TABLE "task" DROP CONSTRAINT "task_board_id_board_id_fk";--> statement-breakpoint
ALTER TABLE "board" DROP CONSTRAINT "board_project_id_project_id_fk";--> statement-breakpoint
ALTER TABLE "board" RENAME TO "column";--> statement-breakpoint
ALTER TABLE "column" RENAME CONSTRAINT "board_pkey" TO "column_pkey";--> statement-breakpoint
ALTER TABLE "column" RENAME COLUMN "project_id" TO "board_id";--> statement-breakpoint
ALTER INDEX "board_project_id_idx" RENAME TO "column_board_id_idx";--> statement-breakpoint
ALTER TABLE "task" RENAME COLUMN "board_id" TO "column_id";--> statement-breakpoint
ALTER INDEX "task_board_id_idx" RENAME TO "task_column_id_idx";--> statement-breakpoint
CREATE TABLE "board" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"position" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
INSERT INTO "board" ("id", "project_id", "name", "description", "position", "created_at", "updated_at")
SELECT "id", "id", "name", "description", 0, "created_at", "updated_at"
FROM "project";--> statement-breakpoint
ALTER TABLE "board" ADD CONSTRAINT "board_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "column" ADD CONSTRAINT "column_board_id_board_id_fk" FOREIGN KEY ("board_id") REFERENCES "public"."board"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_column_id_column_id_fk" FOREIGN KEY ("column_id") REFERENCES "public"."column"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "board_project_id_idx" ON "board" USING btree ("project_id");
