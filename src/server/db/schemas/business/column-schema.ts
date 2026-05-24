import { index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { board } from "./board-schema";

export const column = pgTable(
  "column",
  {
    id: text("id").primaryKey(),
    boardId: text("board_id")
      .notNull()
      .references(() => board.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
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
