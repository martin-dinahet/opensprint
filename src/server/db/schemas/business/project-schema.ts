import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const project = pgTable(
  "project",
  {
    // ID
    id: text("id") //
      .primaryKey(),
    // NAME
    name: text("name") //
      .notNull(),
    // DESCRIPTION
    description: text("description"),
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
  (table) => [index("project_name_idx").on(table.name)],
);
