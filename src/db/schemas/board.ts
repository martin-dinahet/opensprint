import { index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { project } from "./project";

export const board = pgTable(
  "board",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    position: integer("position").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("board_projectId_idx").on(table.projectId)],
);

export type Board = typeof board.$inferSelect;
export type NewBoard = typeof board.$inferInsert;
export type UpdateBoard = Partial<Pick<NewBoard, "name" | "position">>;
