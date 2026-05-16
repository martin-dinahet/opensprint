import { index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { project } from "./project-schema";

export const column = pgTable(
  "column",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => project.id),
    name: text("name").notNull(),
    position: integer("position").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("column_project_id_idx").on(table.projectId)],
);
