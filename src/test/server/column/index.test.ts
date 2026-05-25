import { err, ok } from "@punpun-dev/ts-result";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/server/lib";

const {
  boardRepositoryMock,
  columnRepositoryMock,
  memberRepositoryMock,
  nanoidMock,
  projectRepositoryMock,
  taskRepositoryMock,
} = vi.hoisted(() => ({
  boardRepositoryMock: {
    findById: vi.fn(),
  },
  columnRepositoryMock: {
    create: vi.fn(),
    delete: vi.fn(),
    findByBoard: vi.fn(),
    findById: vi.fn(),
    update: vi.fn(),
    updatePosition: vi.fn(),
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

const { CreateColumnUseCase, DeleteColumnUseCase, ListColumnsUseCase, ReorderColumnsUseCase, UpdateColumnUseCase } =
  await import("@/server/use-cases/column");

const now = new Date("2026-01-01T00:00:00.000Z");
const project = { id: "project-1", name: "Launch", description: null, createdAt: now, updatedAt: now };
const board = { id: "board-1", projectId: "project-1", name: "Board", position: 0, createdAt: now, updatedAt: now };
const membership = { id: "member-1", organizationId: "project-1", userId: "user-1", role: "owner", createdAt: now };
const column = {
  id: "column-1",
  boardId: "board-1",
  name: "Todo",
  kind: "backlog",
  wipLimit: null,
  position: 0,
  createdAt: now,
  updatedAt: now,
};

describe("column use cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    nanoidMock.mockReturnValue("column-new");
    projectRepositoryMock.findById.mockResolvedValue(ok([project]));
    boardRepositoryMock.findById.mockResolvedValue(ok([board]));
    memberRepositoryMock.findByUserAndProject.mockResolvedValue(ok([membership]));
    taskRepositoryMock.deleteByColumn.mockResolvedValue(ok(undefined));
  });

  it("lists columns for project members", async () => {
    columnRepositoryMock.findByBoard.mockResolvedValue(ok([column]));

    const result = await ListColumnsUseCase.execute("user-1", "project-1", "board-1");

    expect(result.isOk()).toBe(true);
    expect(result.unwrap()).toEqual([{ ...column, projectId: "project-1" }]);
    expect(columnRepositoryMock.findByBoard).toHaveBeenCalledWith("board-1");
  });

  it("rejects column listing for non-members", async () => {
    memberRepositoryMock.findByUserAndProject.mockResolvedValue(ok([]));

    const result = await ListColumnsUseCase.execute("user-2", "project-1", "board-1");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) expect(result.error.statusCode).toBe(403);
    expect(columnRepositoryMock.findByBoard).not.toHaveBeenCalled();
  });

  it("creates a column at the next position", async () => {
    columnRepositoryMock.findByBoard.mockResolvedValue(ok([column]));
    columnRepositoryMock.create.mockResolvedValue(ok(undefined));
    columnRepositoryMock.findById.mockResolvedValue(ok([{ ...column, id: "column-new", name: "Doing", position: 1 }]));

    const result = await CreateColumnUseCase.execute("user-1", "project-1", "board-1", { name: "Doing" });

    expect(result.isOk()).toBe(true);
    expect(columnRepositoryMock.create).toHaveBeenCalledWith({
      id: "column-new",
      boardId: "board-1",
      name: "Doing",
      kind: "custom",
      wipLimit: null,
      position: 1,
    });
    expect(result.unwrap()).toMatchObject({ id: "column-new", name: "Doing", position: 1 });
  });

  it("wraps repository failures during create", async () => {
    columnRepositoryMock.findByBoard.mockResolvedValue(err(new Error("database unavailable")));

    const result = await CreateColumnUseCase.execute("user-1", "project-1", "board-1", { name: "Doing" });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(AppError);
      expect(result.error.message).toContain("database unavailable");
    }
  });

  it("updates a column and returns the refreshed row", async () => {
    columnRepositoryMock.findById
      .mockResolvedValueOnce(ok([column]))
      .mockResolvedValueOnce(ok([{ ...column, name: "Updated" }]));
    columnRepositoryMock.update.mockResolvedValue(ok(undefined));

    const result = await UpdateColumnUseCase.execute("user-1", "project-1", "board-1", "column-1", { name: "Updated" });

    expect(result.isOk()).toBe(true);
    expect(columnRepositoryMock.update).toHaveBeenCalledWith("column-1", { name: "Updated" });
    expect(result.unwrap()).toMatchObject({ id: "column-1", name: "Updated" });
  });

  it("allows owners and admins to delete columns", async () => {
    columnRepositoryMock.findById.mockResolvedValue(ok([column]));
    columnRepositoryMock.delete.mockResolvedValue(ok(undefined));

    const result = await DeleteColumnUseCase.execute("user-1", "project-1", "board-1", "column-1");

    expect(result.isOk()).toBe(true);
    expect(result.unwrap()).toEqual({ success: true });
    expect(taskRepositoryMock.deleteByColumn).toHaveBeenCalledWith("column-1");
    expect(columnRepositoryMock.delete).toHaveBeenCalledWith("column-1");
  });

  it("forbids regular members from deleting columns", async () => {
    memberRepositoryMock.findByUserAndProject.mockResolvedValue(ok([{ ...membership, role: "member" }]));

    const result = await DeleteColumnUseCase.execute("user-1", "project-1", "board-1", "column-1");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) expect(result.error.statusCode).toBe(403);
    expect(columnRepositoryMock.delete).not.toHaveBeenCalled();
  });

  it("reorders only columns that belong to the project", async () => {
    columnRepositoryMock.findByBoard.mockResolvedValue(ok([column, { ...column, id: "column-2", position: 1 }]));
    columnRepositoryMock.updatePosition.mockResolvedValue(ok(undefined));

    const result = await ReorderColumnsUseCase.execute("user-1", "project-1", "board-1", ["column-2", "column-1"]);

    expect(result.isOk()).toBe(true);
    expect(columnRepositoryMock.updatePosition).toHaveBeenNthCalledWith(1, "column-2", 0);
    expect(columnRepositoryMock.updatePosition).toHaveBeenNthCalledWith(2, "column-1", 1);
  });

  it("rejects reorder requests with unknown column ids", async () => {
    columnRepositoryMock.findByBoard.mockResolvedValue(ok([column]));

    const result = await ReorderColumnsUseCase.execute("user-1", "project-1", "board-1", ["column-1", "other-column"]);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) expect(result.error.statusCode).toBe(404);
    expect(columnRepositoryMock.updatePosition).not.toHaveBeenCalled();
  });
});
