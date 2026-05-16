import type { ColumnOutput } from "@/entities/column";
import type { MemberWithUserOutput } from "@/entities/member";
import type { ProjectListOutput } from "@/entities/project";
import type { TaskOutput } from "@/entities/task";

const timestamp = "2026-01-01T00:00:00.000Z";

export function makeUser(overrides: Partial<{ id: string; name: string; email: string; image: string | null }> = {}) {
  return {
    id: "user-1",
    name: "Test User",
    email: "test@example.com",
    image: null,
    ...overrides,
  };
}

export function makeProject(overrides: Partial<ProjectListOutput> = {}): ProjectListOutput {
  return {
    id: "project-1",
    name: "Launch",
    description: "Launch project",
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  };
}

export function makeMembership(
  overrides: Partial<{ id: string; projectId: string; userId: string; role: "owner" | "admin" | "member" }> = {},
) {
  return {
    id: "member-1",
    projectId: "project-1",
    userId: "user-1",
    role: "owner" as const,
    ...overrides,
  };
}

export function makeMember(overrides: Partial<MemberWithUserOutput> = {}): MemberWithUserOutput {
  return {
    id: "member-1",
    projectId: "project-1",
    userId: "user-1",
    role: "owner",
    joinedAt: timestamp,
    user: makeUser(),
    ...overrides,
  };
}

export function makeColumn(overrides: Partial<ColumnOutput> = {}): ColumnOutput {
  return {
    id: "column-1",
    projectId: "project-1",
    name: "Todo",
    position: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  };
}

export function makeTask(overrides: Partial<TaskOutput> = {}): TaskOutput {
  return {
    id: "task-1",
    columnId: "column-1",
    assigneeId: null,
    title: "Write tests",
    description: "Add useful coverage",
    priority: "medium",
    position: 0,
    dueDate: null,
    createdAt: timestamp,
    items: [],
    tags: [],
    updatedAt: timestamp,
    ...overrides,
  };
}
