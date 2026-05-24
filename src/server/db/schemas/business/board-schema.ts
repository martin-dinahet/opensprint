import { index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { organization } from "./project-schema";

export const board = pgTable(
  "board",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    position: integer("position").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("board_project_id_idx").on(table.projectId)],
);

export type Board = typeof board.$inferSelect;
export type NewBoard = typeof board.$inferInsert;
export type BoardUpdate = Partial<Omit<NewBoard, "createdAt" | "id" | "projectId" | "updatedAt">>;
