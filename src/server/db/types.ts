import type { user } from "./schemas/auth/user-schema";
import type { board } from "./schemas/business/board-schema";
import type { projectMember } from "./schemas/business/project-member-schema";
import type { project } from "./schemas/business/project-schema";
import type { task } from "./schemas/business/task-schema";

export type Board = typeof board.$inferSelect;
export type BoardCreate = Omit<Board, "id" | "createdAt" | "updatedAt">;
export type BoardUpdate = Partial<BoardCreate>;

export type Project = typeof project.$inferSelect;
export type ProjectCreate = Omit<Project, "id" | "createdAt" | "updatedAt">;
export type ProjectUpdate = Partial<ProjectCreate>;

export type ProjectMember = typeof projectMember.$inferSelect;
export type ProjectMemberCreate = Omit<ProjectMember, "id" | "joinedAt">;
export type ProjectMemberUpdate = Partial<ProjectMemberCreate>;

export type Task = typeof task.$inferSelect;
export type TaskCreate = Omit<Task, "id" | "createdAt" | "updatedAt">;
export type TaskUpdate = Partial<TaskCreate>;

export type User = typeof user.$inferSelect;
export type UserCreate = Omit<User, "id" | "createdAt" | "updatedAt" | "emailVerified">;
export type UserUpdate = Partial<UserCreate>;
