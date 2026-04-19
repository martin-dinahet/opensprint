import { relations } from "drizzle-orm";
import { board } from "../schemas/board";
import { project } from "../schemas/project";
import { projectMember } from "../schemas/project-member";

export const projectRelations = relations(project, ({ many }) => ({
  members: many(projectMember),
  boards: many(board),
}));
