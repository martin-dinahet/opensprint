import { index, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "../auth/user-schema";
import { project } from "./project-schema";

export const memberRoleEnum = pgEnum("member_role", ["owner", "admin", "member"]);

export const member = pgTable(
  "member",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => project.id),
    userId: text("user_id")
      .notNull()
      .references(() => user.id),
    role: memberRoleEnum("role").notNull(),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (table) => [index("member_project_id_idx").on(table.projectId), index("member_user_id_idx").on(table.userId)],
);
