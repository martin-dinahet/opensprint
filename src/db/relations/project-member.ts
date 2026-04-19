import { relations } from "drizzle-orm";
import { project } from "../schemas/project";
import { projectMember } from "../schemas/project-member";
import { task } from "../schemas/task";
import { user } from "../schemas/user";

export const projectMemberRelations = relations(projectMember, ({ one, many }) => ({
  project: one(project, {
    fields: [projectMember.projectId],
    references: [project.id],
  }),
  user: one(user, {
    fields: [projectMember.userId],
    references: [user.id],
  }),
  tasks: many(task),
}));
