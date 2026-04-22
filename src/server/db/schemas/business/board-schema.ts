import { index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { project } from "./project-schema";

export const board = pgTable(
  "board",
  {
    // ID
    id: text("id") //
      .primaryKey(),
    // PROJECT_ID
    projectId: text("project_id") //
      .notNull()
      .references(() => project.id),
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
  (table) => [index("board_project_id_idx").on(table.projectId)],
);
