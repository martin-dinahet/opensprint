import { relations } from "drizzle-orm";
import { account } from "../schemas/account";
import { projectMember } from "../schemas/project-member";
import { session } from "../schemas/session";
import { task } from "../schemas/task";
import { user } from "../schemas/user";

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  projectMembers: many(projectMember),
  assignedTasks: many(task),
}));
