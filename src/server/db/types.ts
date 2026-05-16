import type { user } from "./schemas/auth/user-schema";
import type { column } from "./schemas/business/column-schema";
import type { member } from "./schemas/business/member-schema";
import type { project } from "./schemas/business/project-schema";
import type { task } from "./schemas/business/task-schema";

export type Column = typeof column.$inferSelect;
export type ColumnCreate = Omit<Column, "id" | "createdAt" | "updatedAt">;
export type ColumnUpdate = Partial<ColumnCreate>;

export type Project = typeof project.$inferSelect;
export type ProjectCreate = Omit<Project, "id" | "createdAt" | "updatedAt">;
export type ProjectUpdate = Partial<ProjectCreate>;

export type Member = typeof member.$inferSelect;
export type MemberCreate = Omit<Member, "id" | "joinedAt">;
export type MemberUpdate = Partial<MemberCreate>;

export type Task = typeof task.$inferSelect;
export type TaskCreate = Omit<Task, "id" | "createdAt" | "updatedAt">;
export type TaskUpdate = Partial<TaskCreate>;

export type User = typeof user.$inferSelect;
export type UserCreate = Omit<User, "id" | "createdAt" | "updatedAt" | "emailVerified">;
export type UserUpdate = Partial<UserCreate>;
