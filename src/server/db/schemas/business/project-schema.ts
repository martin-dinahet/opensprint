import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const organization = pgTable(
  "organization",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    logo: text("logo"),
    metadata: text("metadata"),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("organization_name_idx").on(table.name), index("organization_slug_idx").on(table.slug)],
);

export type Project = typeof organization.$inferSelect;
export type NewProject = typeof organization.$inferInsert;
export type ProjectUpdate = Partial<Omit<NewProject, "createdAt" | "id" | "metadata" | "slug" | "updatedAt">>;
