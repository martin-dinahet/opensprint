import { err, ok } from "@punpun-dev/ts-result";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { boardRepositoryMock, columnRepositoryMock, memberRepositoryMock, nanoidMock, taskRepositoryMock } = vi.hoisted(() => ({
  boardRepositoryMock: {
    findById: vi.fn(),
  },
  columnRepositoryMock: {
    findById: vi.fn(),
  },
  memberRepositoryMock: {
    findById: vi.fn(),
    findByUserAndProject: vi.fn(),
  },
  nanoidMock: vi.fn(),
  taskRepositoryMock: {
    create: vi.fn(),
    delete: vi.fn(),
    findByColumn: vi.fn(),
    findById: vi.fn(),
    update: vi.fn(),
    updateAssignee: vi.fn(),
    updateColumnAndPosition: vi.fn(),
    updatePosition: vi.fn(),
  },
}));

vi.mock("nanoid", () => ({
  nanoid: nanoidMock,
}));

vi.mock("@/server/features/board/repositories", () => ({
  boardRepository: boardRepositoryMock,
}));

vi.mock("@/server/features/column/repositories", () => ({
  columnRepository: columnRepositoryMock,
}));

vi.mock("@/server/features/member/repositories", () => ({
  memberRepository: memberRepositoryMock,
}));

vi.mock("@/server/features/task/repositories", () => ({
  taskRepository: taskRepositoryMock,
}));

const { assignTask, createTask, deleteTask, listTasks, moveTask, reorderTask, updateTask } = await import(
  "@/server/features/task/usecases"
);

const now = new Date("2026-01-01T00:00:00.000Z");
const board = { id: "board-1", projectId: "project-1", name: "Roadmap", position: 0, createdAt: now, updatedAt: now };
const column = { id: "column-1", boardId: "board-1", name: "Todo", position: 0, createdAt: now, updatedAt: now };
const targetColumn = { ...column, id: "column-2", position: 1 };
const ownerMembership = { id: "member-1", projectId: "project-1", userId: "user-1", role: "owner", joinedAt: now };
const assigneeMembership = {
  id: "assignee-member",
  projectId: "project-1",
  userId: "user-2",
  role: "member",
  joinedAt: now,
};
const task = {
  id: "task-1",
  columnId: "column-1",
  assigneeId: null,
  title: "Write tests",
  description: null,
  priority: "medium" as const,
  position: 0,
  dueDate: null,
  createdAt: now,
  updatedAt: now,
};

describe("task use cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    nanoidMock.mockReturnValue("task-new");
    columnRepositoryMock.findById.mockResolvedValue(ok([column]));
    boardRepositoryMock.findById.mockResolvedValue(ok([board]));
    memberRepositoryMock.findByUserAndProject.mockResolvedValue(ok([ownerMembership]));
    taskRepositoryMock.updatePosition.mockResolvedValue(ok(undefined));
  });

  it("lists tasks for project members", async () => {
    taskRepositoryMock.findByColumn.mockResolvedValue(ok([task]));

    const result = await listTasks("user-1", "column-1");

    expect(result.isOk()).toBe(true);
    expect(result.unwrap()).toEqual([task]);
    expect(taskRepositoryMock.findByColumn).toHaveBeenCalledWith("column-1");
  });

  it("rejects task listing for non-members", async () => {
    memberRepositoryMock.findByUserAndProject.mockResolvedValue(ok([]));

    const result = await listTasks("user-2", "column-1");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.statusCode).toBe(403);
    }
    expect(taskRepositoryMock.findByColumn).not.toHaveBeenCalled();
  });

  it("wraps task listing failures", async () => {
    taskRepositoryMock.findByColumn.mockResolvedValue(err(new Error("read failed")));

    const result = await listTasks("user-1", "column-1");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.statusCode).toBe(500);
      expect(result.error.message).toContain("read failed");
    }
  });

  it("rejects task listing when the column does not exist", async () => {
    columnRepositoryMock.findById.mockResolvedValue(ok([]));

    const result = await listTasks("user-1", "missing-column");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.statusCode).toBe(404);
    }
    expect(taskRepositoryMock.findByColumn).not.toHaveBeenCalled();
  });

  it("creates a task at the next column position", async () => {
    memberRepositoryMock.findById.mockResolvedValue(ok([assigneeMembership]));
    taskRepositoryMock.findByColumn.mockResolvedValue(ok([task]));
    taskRepositoryMock.create.mockResolvedValue(ok(undefined));
    taskRepositoryMock.findById.mockResolvedValue(ok([{ ...task, id: "task-new", position: 1 }]));

    const result = await createTask("user-1", "column-1", {
      title: "Review PR",
      assigneeId: "assignee-member",
      priority: "high",
    });

    expect(result.isOk()).toBe(true);
    expect(taskRepositoryMock.create).toHaveBeenCalledWith({
      id: "task-new",
      columnId: "column-1",
      title: "Review PR",
      description: undefined,
      priority: "high",
      assigneeId: "assignee-member",
      dueDate: undefined,
      position: 1,
    });
    expect(result.unwrap()).toMatchObject({ id: "task-new", position: 1 });
  });

  it("rejects task creation for non-members", async () => {
    memberRepositoryMock.findByUserAndProject.mockResolvedValue(ok([]));

    const result = await createTask("user-2", "column-1", { title: "Review PR" });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.statusCode).toBe(403);
    }
    expect(taskRepositoryMock.create).not.toHaveBeenCalled();
  });

  it("rejects task creation when the assignee is outside the project", async () => {
    memberRepositoryMock.findById.mockResolvedValue(ok([{ ...assigneeMembership, projectId: "other-project" }]));

    const result = await createTask("user-1", "column-1", {
      title: "Review PR",
      assigneeId: "assignee-member",
    });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.statusCode).toBe(404);
    }
    expect(taskRepositoryMock.create).not.toHaveBeenCalled();
  });

  it("wraps task fetch failures during create", async () => {
    taskRepositoryMock.findByColumn.mockResolvedValue(err(new Error("read failed")));

    const result = await createTask("user-1", "column-1", { title: "Review PR" });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.statusCode).toBe(500);
      expect(result.error.message).toContain("read failed");
    }
  });

  it("wraps task insert failures during create", async () => {
    taskRepositoryMock.findByColumn.mockResolvedValue(ok([]));
    taskRepositoryMock.create.mockResolvedValue(err(new Error("insert failed")));

    const result = await createTask("user-1", "column-1", { title: "Review PR" });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.statusCode).toBe(500);
      expect(result.error.message).toContain("insert failed");
    }
  });

  it("returns an error when a newly created task cannot be loaded", async () => {
    taskRepositoryMock.findByColumn.mockResolvedValue(ok([]));
    taskRepositoryMock.create.mockResolvedValue(ok(undefined));
    taskRepositoryMock.findById.mockResolvedValue(ok([]));

    const result = await createTask("user-1", "column-1", { title: "Review PR" });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.statusCode).toBe(500);
      expect(result.error.message).toBe("Unable to fetch new task");
    }
  });

  it("updates a task and returns the refreshed row", async () => {
    taskRepositoryMock.findById
      .mockResolvedValueOnce(ok([task]))
      .mockResolvedValueOnce(ok([{ ...task, title: "Updated", updatedAt: now }]));
    taskRepositoryMock.update.mockResolvedValue(ok(undefined));

    const result = await updateTask("user-1", "column-1", "task-1", { title: "Updated" });

    expect(result.isOk()).toBe(true);
    expect(taskRepositoryMock.update).toHaveBeenCalledWith("task-1", { title: "Updated" });
    expect(result.unwrap()).toMatchObject({ id: "task-1", title: "Updated" });
  });

  it("returns not found before updating missing tasks", async () => {
    taskRepositoryMock.findById.mockResolvedValue(ok([]));

    const result = await updateTask("user-1", "column-1", "missing-task", { title: "Updated" });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.statusCode).toBe(404);
    }
    expect(taskRepositoryMock.update).not.toHaveBeenCalled();
  });

  it("wraps task update failures", async () => {
    taskRepositoryMock.findById.mockResolvedValue(ok([task]));
    taskRepositoryMock.update.mockResolvedValue(err(new Error("update failed")));

    const result = await updateTask("user-1", "column-1", "task-1", { title: "Updated" });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.statusCode).toBe(500);
      expect(result.error.message).toContain("update failed");
    }
  });

  it("returns an error when an updated task cannot be loaded", async () => {
    taskRepositoryMock.findById.mockResolvedValueOnce(ok([task])).mockResolvedValueOnce(ok([]));
    taskRepositoryMock.update.mockResolvedValue(ok(undefined));

    const result = await updateTask("user-1", "column-1", "task-1", { title: "Updated" });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.statusCode).toBe(500);
      expect(result.error.message).toBe("Unable to fetch updated task");
    }
  });

  it("deletes tasks for owners and admins", async () => {
    taskRepositoryMock.findById.mockResolvedValue(ok([task]));
    taskRepositoryMock.delete.mockResolvedValue(ok(undefined));

    const result = await deleteTask("user-1", "column-1", "task-1");

    expect(result.isOk()).toBe(true);
    expect(result.unwrap()).toEqual({ success: true });
    expect(taskRepositoryMock.delete).toHaveBeenCalledWith("task-1");
  });

  it("forbids regular members from deleting tasks", async () => {
    memberRepositoryMock.findByUserAndProject.mockResolvedValue(ok([{ ...ownerMembership, role: "member" }]));

    const result = await deleteTask("user-1", "column-1", "task-1");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.statusCode).toBe(403);
    }
    expect(taskRepositoryMock.delete).not.toHaveBeenCalled();
  });

  it("returns not found before deleting missing tasks", async () => {
    taskRepositoryMock.findById.mockResolvedValue(ok([]));

    const result = await deleteTask("user-1", "column-1", "missing-task");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.statusCode).toBe(404);
    }
    expect(taskRepositoryMock.delete).not.toHaveBeenCalled();
  });

  it("wraps task delete failures", async () => {
    taskRepositoryMock.findById.mockResolvedValue(ok([task]));
    taskRepositoryMock.delete.mockResolvedValue(err(new Error("delete failed")));

    const result = await deleteTask("user-1", "column-1", "task-1");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.statusCode).toBe(500);
      expect(result.error.message).toContain("delete failed");
    }
  });

  it("assigns a task for owners and admins", async () => {
    taskRepositoryMock.findById.mockResolvedValue(ok([task]));
    memberRepositoryMock.findById.mockResolvedValue(ok([assigneeMembership]));
    taskRepositoryMock.updateAssignee.mockResolvedValue(ok(undefined));

    const result = await assignTask("user-1", "task-1", { assigneeId: "assignee-member" });

    expect(result.isOk()).toBe(true);
    expect(taskRepositoryMock.updateAssignee).toHaveBeenCalledWith("task-1", "assignee-member");
    expect(result.unwrap()).toEqual({ id: "task-1", assigneeId: "assignee-member" });
  });

  it("forbids regular members from assigning tasks", async () => {
    taskRepositoryMock.findById.mockResolvedValue(ok([task]));
    memberRepositoryMock.findByUserAndProject.mockResolvedValue(ok([{ ...ownerMembership, role: "member" }]));

    const result = await assignTask("user-1", "task-1", { assigneeId: "assignee-member" });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.statusCode).toBe(403);
    }
    expect(taskRepositoryMock.updateAssignee).not.toHaveBeenCalled();
  });

  it("returns not found when assigning missing tasks", async () => {
    taskRepositoryMock.findById.mockResolvedValue(ok([]));

    const result = await assignTask("user-1", "missing-task", { assigneeId: null });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.statusCode).toBe(404);
    }
  });

  it("wraps task assignment failures", async () => {
    taskRepositoryMock.findById.mockResolvedValue(ok([task]));
    taskRepositoryMock.updateAssignee.mockResolvedValue(err(new Error("assign failed")));

    const result = await assignTask("user-1", "task-1", { assigneeId: null });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.statusCode).toBe(500);
      expect(result.error.message).toContain("assign failed");
    }
  });

  it("moves a task to a target column using the next position by default", async () => {
    taskRepositoryMock.findById.mockResolvedValue(ok([task]));
    columnRepositoryMock.findById.mockResolvedValueOnce(ok([column])).mockResolvedValueOnce(ok([targetColumn]));
    taskRepositoryMock.findByColumn.mockResolvedValue(
      ok([
        { ...task, id: "task-2" },
        { ...task, id: "task-3" },
      ]),
    );
    taskRepositoryMock.updateColumnAndPosition.mockResolvedValue(ok(undefined));

    const result = await moveTask("user-1", "task-1", { columnId: "column-2" });

    expect(result.isOk()).toBe(true);
    expect(taskRepositoryMock.updateColumnAndPosition).toHaveBeenCalledWith("task-1", "column-2", 2);
    expect(result.unwrap()).toEqual({ id: "task-1", columnId: "column-2", position: 2 });
  });

  it("moves a task to an explicit position", async () => {
    taskRepositoryMock.findById.mockResolvedValue(ok([task]));
    columnRepositoryMock.findById.mockResolvedValueOnce(ok([column])).mockResolvedValueOnce(ok([targetColumn]));
    taskRepositoryMock.findByColumn.mockResolvedValue(ok([]));
    taskRepositoryMock.updateColumnAndPosition.mockResolvedValue(ok(undefined));

    const result = await moveTask("user-1", "task-1", { columnId: "column-2", position: 0 });

    expect(result.isOk()).toBe(true);
    expect(taskRepositoryMock.updateColumnAndPosition).toHaveBeenCalledWith("task-1", "column-2", 0);
    expect(result.unwrap()).toEqual({ id: "task-1", columnId: "column-2", position: 0 });
  });

  it("returns not found when moving to a missing column", async () => {
    taskRepositoryMock.findById.mockResolvedValue(ok([task]));
    columnRepositoryMock.findById.mockResolvedValueOnce(ok([column])).mockResolvedValueOnce(ok([]));

    const result = await moveTask("user-1", "task-1", { columnId: "missing-column" });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.statusCode).toBe(404);
    }
  });

  it("wraps task movement failures", async () => {
    taskRepositoryMock.findById.mockResolvedValue(ok([task]));
    columnRepositoryMock.findById.mockResolvedValueOnce(ok([column])).mockResolvedValueOnce(ok([targetColumn]));
    taskRepositoryMock.findByColumn.mockResolvedValue(ok([]));
    taskRepositoryMock.updateColumnAndPosition.mockResolvedValue(err(new Error("move failed")));

    const result = await moveTask("user-1", "task-1", { columnId: "column-2" });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.statusCode).toBe(500);
      expect(result.error.message).toContain("move failed");
    }
  });

  it("reorders a task for project members", async () => {
    taskRepositoryMock.findById.mockResolvedValue(ok([task]));
    taskRepositoryMock.findByColumn.mockResolvedValue(
      ok([task, { ...task, id: "task-2", position: 1 }, { ...task, id: "task-3", position: 2 }]),
    );

    const result = await reorderTask("user-1", "task-1", { position: 2 });

    expect(result.isOk()).toBe(true);
    expect(taskRepositoryMock.updatePosition).toHaveBeenNthCalledWith(1, "task-2", 0);
    expect(taskRepositoryMock.updatePosition).toHaveBeenNthCalledWith(2, "task-3", 1);
    expect(taskRepositoryMock.updatePosition).toHaveBeenNthCalledWith(3, "task-1", 2);
    expect(result.unwrap()).toEqual({ id: "task-1", position: 2 });
  });

  it("wraps reorder failures", async () => {
    taskRepositoryMock.findById.mockResolvedValue(ok([task]));
    taskRepositoryMock.findByColumn.mockResolvedValue(ok([task]));
    taskRepositoryMock.updatePosition.mockResolvedValue(err(new Error("database unavailable")));

    const result = await reorderTask("user-1", "task-1", { position: 3 });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.statusCode).toBe(500);
      expect(result.error.message).toContain("database unavailable");
    }
  });
});
