import { relations } from "drizzle-orm";
import { account } from "../schemas/auth/account-schema";
import { session } from "../schemas/auth/session-schema";
import { user } from "../schemas/auth/user-schema";
import { column } from "../schemas/business/column-schema";
import { member } from "../schemas/business/member-schema";
import { project } from "../schemas/business/project-schema";
import { projectTaskTag, task, taskItem, taskTag } from "../schemas/business/task-schema";

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  memberships: many(member),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const projectRelations = relations(project, ({ many }) => ({
  members: many(member),
  columns: many(column),
  taskTags: many(projectTaskTag),
}));

export const memberRelations = relations(member, ({ one, many }) => ({
  project: one(project, {
    fields: [member.projectId],
    references: [project.id],
  }),
  user: one(user, {
    fields: [member.userId],
    references: [user.id],
  }),
  tasks: many(task),
}));

export const columnRelations = relations(column, ({ one, many }) => ({
  project: one(project, {
    fields: [column.projectId],
    references: [project.id],
  }),
  tasks: many(task),
}));

export const taskRelations = relations(task, ({ one, many }) => ({
  column: one(column, {
    fields: [task.columnId],
    references: [column.id],
  }),
  assignee: one(member, {
    fields: [task.assigneeId],
    references: [member.id],
  }),
  items: many(taskItem),
  tagLinks: many(taskTag),
}));

export const taskItemRelations = relations(taskItem, ({ one }) => ({
  task: one(task, {
    fields: [taskItem.taskId],
    references: [task.id],
  }),
}));

export const projectTaskTagRelations = relations(projectTaskTag, ({ one, many }) => ({
  project: one(project, {
    fields: [projectTaskTag.projectId],
    references: [project.id],
  }),
  taskLinks: many(taskTag),
}));

export const taskTagRelations = relations(taskTag, ({ one }) => ({
  task: one(task, {
    fields: [taskTag.taskId],
    references: [task.id],
  }),
  tag: one(projectTaskTag, {
    fields: [taskTag.tagId],
    references: [projectTaskTag.id],
  }),
}));
