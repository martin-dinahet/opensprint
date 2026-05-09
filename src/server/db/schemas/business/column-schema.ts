import { index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { board } from "./board-schema";

export const column = pgTable(
  "column",
  {
    // ID
    id: text("id") //
      .primaryKey(),
    // BOARD_ID
    boardId: text("board_id") //
      .notNull()
      .references(() => board.id),
    // NAME
    name: text("name") //
      .notNull(),
    // POSITION
    position:
      integer("position") //
        .notNull(),
    // CREATED_AT
    createdAt: timestamp("created_at") //
      .defaultNow()
      .notNull(),
    // UPDATED_AT
    updatedAt: timestamp("updated_at") //
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("column_board_id_idx").on(table.boardId)],
);
