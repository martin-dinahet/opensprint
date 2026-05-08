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

  it("rejects task listing when the board does not exist", async () => {
    boardRepositoryMock.findById.mockResolvedValue(ok([]));

    const result = await listTasks("user-1", "missing-board");

    expect(result.isErr()).toBe(true);
    if (result.isOk()) throw new Error("Expected result to be an error");
    expect(result.error.statusCode).toBe(404);
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

  it("rejects task creation when the assignee is outside the project", async () => {
    memberRepositoryMock.findById.mockResolvedValue(ok([{ ...assigneeMembership, projectId: "other-project" }]));

    const result = await createTask("user-1", "board-1", {
      title: "Review PR",
      assigneeId: "assignee-member",
    });

    expect(result.isErr()).toBe(true);
    if (result.isOk()) throw new Error("Expected result to be an error");
    expect(result.error.statusCode).toBe(404);
    expect(taskRepositoryMock.create).not.toHaveBeenCalled();
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

  it("forbids regular members from deleting tasks", async () => {
    memberRepositoryMock.findByUserAndProject.mockResolvedValue(ok([{ ...ownerMembership, role: "member" }]));

    const result = await deleteTask("user-1", "board-1", "task-1");

    expect(result.isErr()).toBe(true);
    if (result.isOk()) throw new Error("Expected result to be an error");
    expect(result.error.statusCode).toBe(403);
    expect(taskRepositoryMock.delete).not.toHaveBeenCalled();
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

  it("wraps reorder failures", async () => {
    taskRepositoryMock.findById.mockResolvedValue(ok([task]));
    taskRepositoryMock.updatePosition.mockResolvedValue(err(new Error("database unavailable")));

    const result = await reorderTask("user-1", "task-1", { position: 3 });

    expect(result.isErr()).toBe(true);
    if (result.isOk()) throw new Error("Expected result to be an error");
    expect(result.error.statusCode).toBe(500);
    expect(result.error.message).toContain("database unavailable");
  });
});
