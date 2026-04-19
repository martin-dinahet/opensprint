import { index, pgEnum, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
import { project } from "./project";
import { user } from "./user";

export const memberRoleEnum = pgEnum("member_role", ["owner", "admin", "member"]);

export const projectMember = pgTable(
  "project_member",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: memberRoleEnum("role").default("member").notNull(),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (table) => [
    unique().on(table.projectId, table.userId),
    index("project_member_projectId_idx").on(table.projectId),
    index("project_member_userId_idx").on(table.userId),
  ],
);

export type ProjectMember = typeof projectMember.$inferSelect;
export type NewProjectMember = typeof projectMember.$inferInsert;
export type UpdateProjectMember = Partial<Pick<NewProjectMember, "role">>;
