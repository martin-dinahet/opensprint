import { index, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "../auth/user-schema";
import { project } from "./project-schema";

export const projectMemberRoleEnum = pgEnum("project_member_role", ["owner", "admin", "member"]);

export const projectMember = pgTable(
  "project_member",
  {
    // ID
    id: text("id") //
      .primaryKey(),
    // PROJECT_ID
    projectId: text("project_id") //
      .notNull()
      .references(() => project.id),
    // USER_ID
    userId: text("user_id") //
      .notNull()
      .references(() => user.id),
    // ROLE
    role: projectMemberRoleEnum("role") //
      .notNull(),
    // JOINED_AT
    joinedAt: timestamp("joined_at") //
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("project_member_project_id_idx").on(table.projectId),
    index("project_member_user_id_idx").on(table.userId),
  ],
);
