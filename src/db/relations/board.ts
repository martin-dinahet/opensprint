import { relations } from "drizzle-orm";
import { board } from "../schemas/board";
import { project } from "../schemas/project";
import { task } from "../schemas/task";

export const boardRelations = relations(board, ({ one, many }) => ({
  project: one(project, {
    fields: [board.projectId],
    references: [project.id],
  }),
  tasks: many(task),
}));
