import { index, integer, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { board } from "./board-schema";

export const columnKindEnum = pgEnum("column_kind", ["backlog", "active", "review", "done", "custom"]);

export const column = pgTable(
  "column",
  {
    id: text("id").primaryKey(),
    boardId: text("board_id")
      .notNull()
      .references(() => board.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    kind: columnKindEnum("kind").default("custom").notNull(),
    wipLimit: integer("wip_limit"),
    position: integer("position").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("column_board_id_idx").on(table.boardId)],
);

export type Column = typeof column.$inferSelect;
export type NewColumn = typeof column.$inferInsert;
export type ColumnUpdate = Partial<Omit<NewColumn, "createdAt" | "id" | "updatedAt">>;
