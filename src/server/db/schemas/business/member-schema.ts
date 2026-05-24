import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "../auth/user-schema";
import { organization } from "./project-schema";

export type MemberRole = "owner" | "admin" | "member";

export const member = pgTable(
  "member",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role").notNull().$type<MemberRole>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("member_organization_id_idx").on(table.organizationId),
    index("member_user_id_idx").on(table.userId),
  ],
);

export type Member = typeof member.$inferSelect;
export type NewMember = typeof member.$inferInsert;
export type MemberUpdate = Partial<Omit<NewMember, "createdAt" | "id" | "organizationId" | "userId">>;
