CREATE TABLE "column" (
	"id" text PRIMARY KEY NOT NULL,
	"board_id" text NOT NULL,
	"name" text NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "task" DROP CONSTRAINT "task_board_id_board_id_fk";
--> statement-breakpoint
DROP INDEX "task_board_id_idx";--> statement-breakpoint
ALTER TABLE "board" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "task" ADD COLUMN "column_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "column" ADD CONSTRAINT "column_board_id_board_id_fk" FOREIGN KEY ("board_id") REFERENCES "public"."board"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "column_board_id_idx" ON "column" USING btree ("board_id");--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_column_id_column_id_fk" FOREIGN KEY ("column_id") REFERENCES "public"."column"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "task_column_id_idx" ON "task" USING btree ("column_id");--> statement-breakpoint
ALTER TABLE "task" DROP COLUMN "board_id";