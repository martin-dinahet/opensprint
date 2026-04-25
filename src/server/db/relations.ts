import { relations } from "drizzle-orm";
import { account } from "./schemas/auth/account-schema";
import { session } from "./schemas/auth/session-schema";
import { user } from "./schemas/auth/user-schema";
import { board } from "./schemas/business/board-schema";
import { projectMember } from "./schemas/business/project-member-schema";
import { project } from "./schemas/business/project-schema";
import { task } from "./schemas/business/task-schema";

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  projectMembers: many(projectMember),
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
  members: many(projectMember),
  boards: many(board),
}));

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

export const boardRelations = relations(board, ({ one, many }) => ({
  project: one(project, {
    fields: [board.projectId],
    references: [project.id],
  }),
  tasks: many(task),
}));

export const taskRelations = relations(task, ({ one }) => ({
  board: one(board, {
    fields: [task.boardId],
    references: [board.id],
  }),
  assignee: one(projectMember, {
    fields: [task.assigneeId],
    references: [projectMember.id],
  }),
}));
