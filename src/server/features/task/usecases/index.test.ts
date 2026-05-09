import { err, ok } from "@punpun-dev/ts-result";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { boardRepositoryMock, memberRepositoryMock, nanoidMock, taskRepositoryMock } = vi.hoisted(() => ({
  boardRepositoryMock: {
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
    findByBoard: vi.fn(),
    findById: vi.fn(),
    update: vi.fn(),
    updateAssignee: vi.fn(),
    updateBoardAndPosition: vi.fn(),
    updatePosition: vi.fn(),
  },
}));

vi.mock("nanoid", () => ({
  nanoid: nanoidMock,
}));

vi.mock("@/server/features/board/repositories", () => ({
  boardRepository: boardRepositoryMock,
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
const board = { id: "board-1", projectId: "project-1", name: "Todo", position: 0, createdAt: now, updatedAt: now };
const targetBoard = { ...board, id: "board-2", position: 1 };
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
  boardId: "board-1",
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
    boardRepositoryMock.findById.mockResolvedValue(ok([board]));
    memberRepositoryMock.findByUserAndProject.mockResolvedValue(ok([ownerMembership]));
  });

  it("lists tasks for project members", async () => {
    taskRepositoryMock.findByBoard.mockResolvedValue(ok([task]));

    const result = await listTasks("user-1", "board-1");

    expect(result.isOk()).toBe(true);
    expect(result.unwrap()).toEqual([task]);
    expect(taskRepositoryMock.findByBoard).toHaveBeenCalledWith("board-1");
  });

  it("rejects task listing for non-members", async () => {
    memberRepositoryMock.findByUserAndProject.mockResolvedValue(ok([]));

    const result = await listTasks("user-2", "board-1");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.statusCode).toBe(403);
    }
    expect(taskRepositoryMock.findByBoard).not.toHaveBeenCalled();
  });

  it("wraps task listing failures", async () => {
    taskRepositoryMock.findByBoard.mockResolvedValue(err(new Error("read failed")));

    const result = await listTasks("user-1", "board-1");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.statusCode).toBe(500);
      expect(result.error.message).toContain("read failed");
    }
  });

  it("rejects task listing when the board does not exist", async () => {
    boardRepositoryMock.findById.mockResolvedValue(ok([]));

    const result = await listTasks("user-1", "missing-board");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.statusCode).toBe(404);
    }
    expect(taskRepositoryMock.findByBoard).not.toHaveBeenCalled();
  });

  it("creates a task at the next board position", async () => {
    memberRepositoryMock.findById.mockResolvedValue(ok([assigneeMembership]));
    taskRepositoryMock.findByBoard.mockResolvedValue(ok([task]));
    taskRepositoryMock.create.mockResolvedValue(ok(undefined));
    taskRepositoryMock.findById.mockResolvedValue(ok([{ ...task, id: "task-new", position: 1 }]));

    const result = await createTask("user-1", "board-1", {
      title: "Review PR",
      assigneeId: "assignee-member",
      priority: "high",
    });

    expect(result.isOk()).toBe(true);
    expect(taskRepositoryMock.create).toHaveBeenCalledWith({
      id: "task-new",
      boardId: "board-1",
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

    const result = await createTask("user-2", "board-1", { title: "Review PR" });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.statusCode).toBe(403);
    }
    expect(taskRepositoryMock.create).not.toHaveBeenCalled();
  });

  it("rejects task creation when the assignee is outside the project", async () => {
    memberRepositoryMock.findById.mockResolvedValue(ok([{ ...assigneeMembership, projectId: "other-project" }]));

    const result = await createTask("user-1", "board-1", {
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
    taskRepositoryMock.findByBoard.mockResolvedValue(err(new Error("read failed")));

    const result = await createTask("user-1", "board-1", { title: "Review PR" });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.statusCode).toBe(500);
      expect(result.error.message).toContain("read failed");
    }
  });

  it("wraps task insert failures during create", async () => {
    taskRepositoryMock.findByBoard.mockResolvedValue(ok([]));
    taskRepositoryMock.create.mockResolvedValue(err(new Error("insert failed")));

    const result = await createTask("user-1", "board-1", { title: "Review PR" });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.statusCode).toBe(500);
      expect(result.error.message).toContain("insert failed");
    }
  });

  it("returns an error when a newly created task cannot be loaded", async () => {
    taskRepositoryMock.findByBoard.mockResolvedValue(ok([]));
    taskRepositoryMock.create.mockResolvedValue(ok(undefined));
    taskRepositoryMock.findById.mockResolvedValue(ok([]));

    const result = await createTask("user-1", "board-1", { title: "Review PR" });

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

    const result = await updateTask("user-1", "board-1", "task-1", { title: "Updated" });

    expect(result.isOk()).toBe(true);
    expect(taskRepositoryMock.update).toHaveBeenCalledWith("task-1", { title: "Updated" });
    expect(result.unwrap()).toMatchObject({ id: "task-1", title: "Updated" });
  });

  it("returns not found before updating missing tasks", async () => {
    taskRepositoryMock.findById.mockResolvedValue(ok([]));

    const result = await updateTask("user-1", "board-1", "missing-task", { title: "Updated" });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.statusCode).toBe(404);
    }
    expect(taskRepositoryMock.update).not.toHaveBeenCalled();
  });

  it("wraps task update failures", async () => {
    taskRepositoryMock.findById.mockResolvedValue(ok([task]));
    taskRepositoryMock.update.mockResolvedValue(err(new Error("update failed")));

    const result = await updateTask("user-1", "board-1", "task-1", { title: "Updated" });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.statusCode).toBe(500);
      expect(result.error.message).toContain("update failed");
    }
  });

  it("returns an error when an updated task cannot be loaded", async () => {
    taskRepositoryMock.findById.mockResolvedValueOnce(ok([task])).mockResolvedValueOnce(ok([]));
    taskRepositoryMock.update.mockResolvedValue(ok(undefined));

    const result = await updateTask("user-1", "board-1", "task-1", { title: "Updated" });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.statusCode).toBe(500);
      expect(result.error.message).toBe("Unable to fetch updated task");
    }
  });

  it("deletes tasks for owners and admins", async () => {
    taskRepositoryMock.findById.mockResolvedValue(ok([task]));
    taskRepositoryMock.delete.mockResolvedValue(ok(undefined));

    const result = await deleteTask("user-1", "board-1", "task-1");

    expect(result.isOk()).toBe(true);
    expect(result.unwrap()).toEqual({ success: true });
    expect(taskRepositoryMock.delete).toHaveBeenCalledWith("task-1");
  });

  it("forbids regular members from deleting tasks", async () => {
    memberRepositoryMock.findByUserAndProject.mockResolvedValue(ok([{ ...ownerMembership, role: "member" }]));

    const result = await deleteTask("user-1", "board-1", "task-1");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.statusCode).toBe(403);
    }
    expect(taskRepositoryMock.delete).not.toHaveBeenCalled();
  });

  it("returns not found before deleting missing tasks", async () => {
    taskRepositoryMock.findById.mockResolvedValue(ok([]));

    const result = await deleteTask("user-1", "board-1", "missing-task");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.statusCode).toBe(404);
    }
    expect(taskRepositoryMock.delete).not.toHaveBeenCalled();
  });

  it("wraps task delete failures", async () => {
    taskRepositoryMock.findById.mockResolvedValue(ok([task]));
    taskRepositoryMock.delete.mockResolvedValue(err(new Error("delete failed")));

    const result = await deleteTask("user-1", "board-1", "task-1");

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

  it("moves a task to a target board using the next position by default", async () => {
    taskRepositoryMock.findById.mockResolvedValue(ok([task]));
    boardRepositoryMock.findById.mockResolvedValue(ok([targetBoard]));
    taskRepositoryMock.findByBoard.mockResolvedValue(
      ok([
        { ...task, id: "task-2" },
        { ...task, id: "task-3" },
      ]),
    );
    taskRepositoryMock.updateBoardAndPosition.mockResolvedValue(ok(undefined));

    const result = await moveTask("user-1", "task-1", { boardId: "board-2" });

    expect(result.isOk()).toBe(true);
    expect(taskRepositoryMock.updateBoardAndPosition).toHaveBeenCalledWith("task-1", "board-2", 2);
    expect(result.unwrap()).toEqual({ id: "task-1", boardId: "board-2", position: 2 });
  });

  it("moves a task to an explicit position", async () => {
    taskRepositoryMock.findById.mockResolvedValue(ok([task]));
    boardRepositoryMock.findById.mockResolvedValue(ok([targetBoard]));
    taskRepositoryMock.findByBoard.mockResolvedValue(ok([]));
    taskRepositoryMock.updateBoardAndPosition.mockResolvedValue(ok(undefined));

    const result = await moveTask("user-1", "task-1", { boardId: "board-2", position: 0 });

    expect(result.isOk()).toBe(true);
    expect(taskRepositoryMock.updateBoardAndPosition).toHaveBeenCalledWith("task-1", "board-2", 0);
    expect(result.unwrap()).toEqual({ id: "task-1", boardId: "board-2", position: 0 });
  });

  it("returns not found when moving to a missing board", async () => {
    taskRepositoryMock.findById.mockResolvedValue(ok([task]));
    boardRepositoryMock.findById.mockResolvedValue(ok([]));

    const result = await moveTask("user-1", "task-1", { boardId: "missing-board" });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.statusCode).toBe(404);
    }
  });

  it("wraps task movement failures", async () => {
    taskRepositoryMock.findById.mockResolvedValue(ok([task]));
    boardRepositoryMock.findById.mockResolvedValue(ok([targetBoard]));
    taskRepositoryMock.findByBoard.mockResolvedValue(ok([]));
    taskRepositoryMock.updateBoardAndPosition.mockResolvedValue(err(new Error("move failed")));

    const result = await moveTask("user-1", "task-1", { boardId: "board-2" });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.statusCode).toBe(500);
      expect(result.error.message).toContain("move failed");
    }
  });

  it("reorders a task for project members", async () => {
    taskRepositoryMock.findById.mockResolvedValue(ok([task]));
    taskRepositoryMock.updatePosition.mockResolvedValue(ok(undefined));

    const result = await reorderTask("user-1", "task-1", { position: 3 });

    expect(result.isOk()).toBe(true);
    expect(taskRepositoryMock.updatePosition).toHaveBeenCalledWith("task-1", 3);
    expect(result.unwrap()).toEqual({ id: "task-1", position: 3 });
  });

  it("wraps reorder failures", async () => {
    taskRepositoryMock.findById.mockResolvedValue(ok([task]));
    taskRepositoryMock.updatePosition.mockResolvedValue(err(new Error("database unavailable")));

    const result = await reorderTask("user-1", "task-1", { position: 3 });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.statusCode).toBe(500);
      expect(result.error.message).toContain("database unavailable");
    }
  });
});
