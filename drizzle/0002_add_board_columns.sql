CREATE TABLE "board_column" (
	"id" text PRIMARY KEY NOT NULL,
	"board_id" text NOT NULL,
	"name" text NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "board_column" ADD CONSTRAINT "board_column_board_id_board_id_fk" FOREIGN KEY ("board_id") REFERENCES "public"."board"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "board_column_board_id_idx" ON "board_column" USING btree ("board_id");
--> statement-breakpoint
ALTER TABLE "task" ADD COLUMN "column_id" text;
--> statement-breakpoint
INSERT INTO "board" ("id", "project_id", "name", "position", "created_at", "updated_at")
SELECT
	"project"."id" || '_default_board',
	"project"."id",
	'Sprint Board',
	0,
	now(),
	now()
FROM "project"
WHERE NOT EXISTS (
	SELECT 1 FROM "board" WHERE "board"."id" = "project"."id" || '_default_board'
);
--> statement-breakpoint
INSERT INTO "board_column" ("id", "board_id", "name", "position", "created_at", "updated_at")
SELECT
	"board"."id",
	"board"."project_id" || '_default_board',
	"board"."name",
	"board"."position",
	"board"."created_at",
	"board"."updated_at"
FROM "board"
WHERE "board"."id" NOT LIKE '%_default_board'
ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint
UPDATE "task" SET "column_id" = "board_id";
--> statement-breakpoint
ALTER TABLE "task" ALTER COLUMN "column_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_column_id_board_column_id_fk" FOREIGN KEY ("column_id") REFERENCES "public"."board_column"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "task_column_id_idx" ON "task" USING btree ("column_id");
--> statement-breakpoint
ALTER TABLE "task" DROP CONSTRAINT "task_board_id_board_id_fk";
--> statement-breakpoint
DROP INDEX "task_board_id_idx";
--> statement-breakpoint
ALTER TABLE "task" DROP COLUMN "board_id";
--> statement-breakpoint
DELETE FROM "board" WHERE "id" IN (SELECT "id" FROM "board_column");
