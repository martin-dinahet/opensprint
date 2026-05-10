import { index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { board } from "./board-schema";

export const boardColumn = pgTable(
  "board_column",
  {
    id: text("id").primaryKey(),
    boardId: text("board_id")
      .notNull()
      .references(() => board.id),
    name: text("name").notNull(),
    position: integer("position").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("board_column_board_id_idx").on(table.boardId)],
);
