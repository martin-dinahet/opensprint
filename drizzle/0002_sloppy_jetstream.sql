CREATE TABLE "board_column" (
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
ALTER TABLE "task" ADD COLUMN "column_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "board_column" ADD CONSTRAINT "board_column_board_id_board_id_fk" FOREIGN KEY ("board_id") REFERENCES "public"."board"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "board_column_board_id_idx" ON "board_column" USING btree ("board_id");--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_column_id_board_column_id_fk" FOREIGN KEY ("column_id") REFERENCES "public"."board_column"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "task_column_id_idx" ON "task" USING btree ("column_id");--> statement-breakpoint
ALTER TABLE "task" DROP COLUMN "board_id";