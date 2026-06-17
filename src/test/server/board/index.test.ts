import { err, ok } from "@punpun-dev/ts-result";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  boardRepositoryMock,
  columnRepositoryMock,
  memberRepositoryMock,
  nanoidMock,
  projectRepositoryMock,
  taskRepositoryMock,
} = vi.hoisted(() => ({
  boardRepositoryMock: {
    create: vi.fn(),
    delete: vi.fn(),
    findById: vi.fn(),
    findByProject: vi.fn(),
    update: vi.fn(),
  },
  columnRepositoryMock: {
    create: vi.fn(),
    findByBoard: vi.fn(),
  },
  memberRepositoryMock: {
    findByUserAndProject: vi.fn(),
  },
  nanoidMock: vi.fn(),
  projectRepositoryMock: {
    findById: vi.fn(),
  },
  taskRepositoryMock: {
    deleteByColumn: vi.fn(),
  },
}));

vi.mock("nanoid", () => ({
  nanoid: nanoidMock,
}));

vi.mock("@/server/repositories", () => ({
  boardRepository: boardRepositoryMock,
  columnRepository: columnRepositoryMock,
  memberRepository: memberRepositoryMock,
  projectRepository: projectRepositoryMock,
  taskRepository: taskRepositoryMock,
}));

const { CreateBoardUseCase, DeleteBoardUseCase, GetBoardUseCase, ListBoardsUseCase, UpdateBoardUseCase } = await import(
  "@/server/use-cases/board"
);

const now = new Date("2026-01-01T00:00:00.000Z");
const project = { id: "project-1", name: "Launch", description: null, createdAt: now, updatedAt: now };
const membership = { id: "member-1", organizationId: "project-1", userId: "user-1", role: "owner", createdAt: now };
const board = {
  id: "board-new",
  projectId: "project-1",
  name: "Delivery",
  position: 1,
  createdAt: now,
  updatedAt: now,
};
const secondBoard = { ...board, id: "board-second", name: "Planning", position: 2 };
const column = {
  id: "column-1",
  boardId: "board-new",
  name: "Backlog",
  kind: "backlog",
  wipLimit: null,
  position: 0,
  createdAt: now,
  updatedAt: now,
};

describe("board use cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    nanoidMock
      .mockReturnValueOnce("board-new")
      .mockReturnValueOnce("column-todo")
      .mockReturnValueOnce("column-progress")
      .mockReturnValueOnce("column-review")
      .mockReturnValueOnce("column-done");
    projectRepositoryMock.findById.mockResolvedValue(ok([project]));
    memberRepositoryMock.findByUserAndProject.mockResolvedValue(ok([membership]));
    boardRepositoryMock.findByProject.mockResolvedValue(ok([{ ...board, id: "board-existing", position: 0 }]));
    boardRepositoryMock.create.mockResolvedValue(ok(undefined));
    boardRepositoryMock.findById.mockResolvedValue(ok([board]));
    boardRepositoryMock.update.mockResolvedValue(ok(undefined));
    boardRepositoryMock.delete.mockResolvedValue(ok(undefined));
    columnRepositoryMock.create.mockResolvedValue(ok(undefined));
    columnRepositoryMock.findByBoard.mockResolvedValue(ok([column]));
    taskRepositoryMock.deleteByColumn.mockResolvedValue(ok(undefined));
  });

  it("creates a board with default workflow columns", async () => {
    const result = await CreateBoardUseCase.execute("user-1", "project-1", { name: "Delivery" });

    expect(result.isOk()).toBe(true);
    expect(boardRepositoryMock.create).toHaveBeenCalledWith({
      id: "board-new",
      projectId: "project-1",
      name: "Delivery",
      position: 1,
    });
    expect(columnRepositoryMock.create).toHaveBeenNthCalledWith(1, {
      id: "column-todo",
      boardId: "board-new",
      name: "Backlog",
      kind: "backlog",
      wipLimit: null,
      position: 0,
    });
    expect(columnRepositoryMock.create).toHaveBeenNthCalledWith(2, {
      id: "column-progress",
      boardId: "board-new",
      name: "Active",
      kind: "active",
      wipLimit: 5,
      position: 1,
    });
    expect(columnRepositoryMock.create).toHaveBeenNthCalledWith(3, {
      id: "column-review",
      boardId: "board-new",
      name: "Review",
      kind: "review",
      wipLimit: 3,
      position: 2,
    });
    expect(columnRepositoryMock.create).toHaveBeenNthCalledWith(4, {
      id: "column-done",
      boardId: "board-new",
      name: "Done",
      kind: "done",
      wipLimit: null,
      position: 3,
    });
  });

  it("wraps default column creation failures", async () => {
    columnRepositoryMock.create.mockResolvedValueOnce(ok(undefined)).mockResolvedValueOnce(err(new Error("nope")));

    const result = await CreateBoardUseCase.execute("user-1", "project-1", { name: "Delivery" });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.statusCode).toBe(500);
      expect(result.error.message).toContain("nope");
    }
  });

  it("lists boards for an accessible project", async () => {
    boardRepositoryMock.findByProject.mockResolvedValue(ok([board, secondBoard]));

    const result = await ListBoardsUseCase.execute("user-1", "project-1");

    expect(result.isOk()).toBe(true);
    expect(result.unwrap()).toEqual([board, secondBoard]);
    expect(boardRepositoryMock.findByProject).toHaveBeenCalledWith("project-1");
  });

  it("gets a board when it belongs to the accessible project", async () => {
    const result = await GetBoardUseCase.execute("user-1", "project-1", "board-new");

    expect(result.isOk()).toBe(true);
    expect(result.unwrap()).toEqual(board);
    expect(boardRepositoryMock.findById).toHaveBeenCalledWith("board-new");
  });

  it("returns not found when the board belongs to another project", async () => {
    boardRepositoryMock.findById.mockResolvedValue(ok([{ ...board, projectId: "project-2" }]));

    const result = await GetBoardUseCase.execute("user-1", "project-1", "board-new");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe("board-not-found");
      expect(result.error.statusCode).toBe(404);
    }
  });

  it("updates a board for project owners and admins", async () => {
    boardRepositoryMock.findById.mockResolvedValueOnce(ok([board])).mockResolvedValueOnce(ok([secondBoard]));

    const result = await UpdateBoardUseCase.execute("user-1", "project-1", "board-new", { name: "Planning" });

    expect(result.isOk()).toBe(true);
    expect(result.unwrap()).toEqual(secondBoard);
    expect(boardRepositoryMock.update).toHaveBeenCalledWith("board-new", { name: "Planning" });
  });

  it("forbids project members from updating boards", async () => {
    memberRepositoryMock.findByUserAndProject.mockResolvedValue(ok([{ ...membership, role: "member" }]));

    const result = await UpdateBoardUseCase.execute("user-1", "project-1", "board-new", { name: "Planning" });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe("forbidden");
      expect(result.error.statusCode).toBe(403);
    }
    expect(boardRepositoryMock.update).not.toHaveBeenCalled();
  });

  it("wraps board update failures", async () => {
    boardRepositoryMock.update.mockResolvedValue(err(new Error("write failed")));

    const result = await UpdateBoardUseCase.execute("user-1", "project-1", "board-new", { name: "Planning" });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe("board-update-failed");
      expect(result.error.statusCode).toBe(500);
      expect(result.error.message).toContain("write failed");
    }
  });

  it("deletes board tasks before deleting the board", async () => {
    const result = await DeleteBoardUseCase.execute("user-1", "project-1", "board-new");

    expect(result.isOk()).toBe(true);
    expect(result.unwrap()).toEqual({ success: true });
    expect(columnRepositoryMock.findByBoard).toHaveBeenCalledWith("board-new");
    expect(taskRepositoryMock.deleteByColumn).toHaveBeenCalledWith("column-1");
    expect(boardRepositoryMock.delete).toHaveBeenCalledWith("board-new");
  });

  it("wraps task deletion failures while deleting a board", async () => {
    taskRepositoryMock.deleteByColumn.mockResolvedValue(err(new Error("task cleanup failed")));

    const result = await DeleteBoardUseCase.execute("user-1", "project-1", "board-new");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe("board-tasks-delete-failed");
      expect(result.error.statusCode).toBe(500);
      expect(result.error.message).toContain("task cleanup failed");
    }
    expect(boardRepositoryMock.delete).not.toHaveBeenCalled();
  });

  it("wraps board deletion failures", async () => {
    boardRepositoryMock.delete.mockResolvedValue(err(new Error("delete failed")));

    const result = await DeleteBoardUseCase.execute("user-1", "project-1", "board-new");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe("board-delete-failed");
      expect(result.error.statusCode).toBe(500);
      expect(result.error.message).toContain("delete failed");
    }
  });
});
