import { relations } from "drizzle-orm";
import { board } from "../schemas/board";
import { projectMember } from "../schemas/project-member";
import { task } from "../schemas/task";
import { user } from "../schemas/user";

export const taskRelations = relations(task, ({ one }) => ({
  board: one(board, {
    fields: [task.boardId],
    references: [board.id],
  }),
  assignee: one(projectMember, {
    fields: [task.assigneeId],
    references: [projectMember.id],
  }),
  user: one(user, {
    fields: [task.userId],
    references: [user.id],
  }),
}));
