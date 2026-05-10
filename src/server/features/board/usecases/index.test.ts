import { err, ok } from "@punpun-dev/ts-result";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/server/features/shared/errors";

const { boardRepositoryMock, columnRepositoryMock, memberRepositoryMock, nanoidMock, taskRepositoryMock } = vi.hoisted(
  () => ({
    boardRepositoryMock: {
      create: vi.fn(),
      delete: vi.fn(),
      findById: vi.fn(),
      findByProject: vi.fn(),
      update: vi.fn(),
      updatePosition: vi.fn(),
    },
    columnRepositoryMock: {
      delete: vi.fn(),
      findByBoard: vi.fn(),
    },
    memberRepositoryMock: {
      findByUserAndProject: vi.fn(),
    },
    nanoidMock: vi.fn(),
    taskRepositoryMock: {
      deleteByColumn: vi.fn(),
    },
  }),
);

vi.mock("nanoid", () => ({
  nanoid: nanoidMock,
}));

vi.mock("@/server/features/board/repositories", () => ({
  boardRepository: boardRepositoryMock,
}));

vi.mock("@/server/features/member/repositories", () => ({
  memberRepository: memberRepositoryMock,
}));

vi.mock("@/server/features/column/repositories", () => ({
  columnRepository: columnRepositoryMock,
}));

vi.mock("@/server/features/task/repositories", () => ({
  taskRepository: taskRepositoryMock,
}));

const { createBoard, deleteBoard, getBoard, listBoards, reorderBoards, updateBoard } = await import(
  "@/server/features/board/usecases"
);

const now = new Date("2026-01-01T00:00:00.000Z");
const membership = { id: "member-1", projectId: "project-1", userId: "user-1", role: "owner" };
const board = {
  id: "board-1",
  projectId: "project-1",
  name: "Todo",
  position: 0,
  createdAt: now,
  updatedAt: now,
};
const column = { id: "column-1", boardId: "board-1", name: "Todo", position: 0, createdAt: now, updatedAt: now };

describe("board use cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    nanoidMock.mockReturnValue("board-new");
    memberRepositoryMock.findByUserAndProject.mockResolvedValue(ok([membership]));
    columnRepositoryMock.findByBoard.mockResolvedValue(ok([column]));
    columnRepositoryMock.delete.mockResolvedValue(ok(undefined));
    taskRepositoryMock.deleteByColumn.mockResolvedValue(ok(undefined));
  });

  it("lists boards for project members", async () => {
    boardRepositoryMock.findByProject.mockResolvedValue(ok([board]));

    const result = await listBoards("user-1", "project-1");

    expect(result.isOk()).toBe(true);
    expect(result.unwrap()).toEqual([
      {
        id: "board-1",
        projectId: "project-1",
        name: "Todo",
        position: 0,
        createdAt: now,
        updatedAt: now,
      },
    ]);
    expect(boardRepositoryMock.findByProject).toHaveBeenCalledWith("project-1");
  });

  it("rejects board listing for non-members", async () => {
    memberRepositoryMock.findByUserAndProject.mockResolvedValue(ok([]));

    const result = await listBoards("user-2", "project-1");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.statusCode).toBe(403);
    }
    expect(boardRepositoryMock.findByProject).not.toHaveBeenCalled();
  });

  it("creates a board at the next position", async () => {
    boardRepositoryMock.findByProject.mockResolvedValue(ok([board]));
    boardRepositoryMock.create.mockResolvedValue(ok(undefined));
    boardRepositoryMock.findById.mockResolvedValue(ok([{ ...board, id: "board-new", position: 1 }]));

    const result = await createBoard("user-1", "project-1", { name: "Doing" });

    expect(result.isOk()).toBe(true);
    expect(boardRepositoryMock.create).toHaveBeenCalledWith({
      id: "board-new",
      projectId: "project-1",
      name: "Doing",
      position: 1,
    });
    expect(result.unwrap()).toMatchObject({ id: "board-new", name: "Todo", position: 1 });
  });

  it("wraps repository failures while listing boards", async () => {
    boardRepositoryMock.findByProject.mockResolvedValue(err(new Error("read failed")));

    const result = await listBoards("user-1", "project-1");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(AppError);
      expect(result.error.message).toContain("read failed");
    }
  });

  it("rejects board creation for non-members before fetching project boards", async () => {
    memberRepositoryMock.findByUserAndProject.mockResolvedValue(ok([]));

    const result = await createBoard("user-2", "project-1", { name: "Doing" });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.statusCode).toBe(403);
    }
    expect(boardRepositoryMock.findByProject).not.toHaveBeenCalled();
  });

  it("wraps repository failures during create", async () => {
    boardRepositoryMock.findByProject.mockResolvedValue(err(new Error("database unavailable")));

    const result = await createBoard("user-1", "project-1", { name: "Doing" });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(AppError);
      expect(result.error.message).toContain("database unavailable");
    }
  });

  it("wraps board insert failures during create", async () => {
    boardRepositoryMock.findByProject.mockResolvedValue(ok([]));
    boardRepositoryMock.create.mockResolvedValue(err(new Error("insert failed")));

    const result = await createBoard("user-1", "project-1", { name: "Doing" });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.statusCode).toBe(500);
      expect(result.error.message).toContain("insert failed");
    }
  });

  it("returns an error when a newly created board cannot be loaded", async () => {
    boardRepositoryMock.findByProject.mockResolvedValue(ok([]));
    boardRepositoryMock.create.mockResolvedValue(ok(undefined));
    boardRepositoryMock.findById.mockResolvedValue(ok([]));

    const result = await createBoard("user-1", "project-1", { name: "Doing" });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.statusCode).toBe(500);
      expect(result.error.message).toBe("Unable to fetch new board");
    }
  });

  it("gets a board for project members", async () => {
    boardRepositoryMock.findById.mockResolvedValue(ok([board]));

    const result = await getBoard("user-1", "project-1", "board-1");

    expect(result.isOk()).toBe(true);
    expect(result.unwrap()).toEqual(board);
    expect(boardRepositoryMock.findById).toHaveBeenCalledWith("board-1");
  });

  it("returns not found when getting a missing board", async () => {
    boardRepositoryMock.findById.mockResolvedValue(ok([]));

    const result = await getBoard("user-1", "project-1", "missing-board");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.statusCode).toBe(404);
    }
  });

  it("updates a board and returns the refreshed row", async () => {
    boardRepositoryMock.findById
      .mockResolvedValueOnce(ok([board]))
      .mockResolvedValueOnce(ok([{ ...board, name: "Updated" }]));
    boardRepositoryMock.update.mockResolvedValue(ok(undefined));

    const result = await updateBoard("user-1", "project-1", "board-1", { name: "Updated" });

    expect(result.isOk()).toBe(true);
    expect(boardRepositoryMock.update).toHaveBeenCalledWith("board-1", { name: "Updated" });
    expect(result.unwrap()).toMatchObject({ id: "board-1", name: "Updated" });
  });

  it("wraps board update failures", async () => {
    boardRepositoryMock.findById.mockResolvedValue(ok([board]));
    boardRepositoryMock.update.mockResolvedValue(err(new Error("update failed")));

    const result = await updateBoard("user-1", "project-1", "board-1", { name: "Updated" });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.statusCode).toBe(500);
      expect(result.error.message).toContain("update failed");
    }
  });

  it("allows owners and admins to delete boards", async () => {
    boardRepositoryMock.findById.mockResolvedValue(ok([board]));
    boardRepositoryMock.delete.mockResolvedValue(ok(undefined));

    const result = await deleteBoard("user-1", "project-1", "board-1");

    expect(result.isOk()).toBe(true);
    expect(result.unwrap()).toEqual({ success: true });
    expect(taskRepositoryMock.deleteByColumn).toHaveBeenCalledWith("column-1");
    expect(columnRepositoryMock.delete).toHaveBeenCalledWith("column-1");
    expect(boardRepositoryMock.delete).toHaveBeenCalledWith("board-1");
  });

  it("wraps task deletion failures before deleting boards", async () => {
    boardRepositoryMock.findById.mockResolvedValue(ok([board]));
    taskRepositoryMock.deleteByColumn.mockResolvedValue(err(new Error("task delete failed")));

    const result = await deleteBoard("user-1", "project-1", "board-1");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.statusCode).toBe(500);
      expect(result.error.message).toContain("task delete failed");
    }
    expect(boardRepositoryMock.delete).not.toHaveBeenCalled();
  });

  it("returns not found before deleting missing boards", async () => {
    boardRepositoryMock.findById.mockResolvedValue(ok([]));

    const result = await deleteBoard("user-1", "project-1", "missing-board");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.statusCode).toBe(404);
    }
    expect(boardRepositoryMock.delete).not.toHaveBeenCalled();
  });

  it("wraps board delete failures", async () => {
    boardRepositoryMock.findById.mockResolvedValue(ok([board]));
    boardRepositoryMock.delete.mockResolvedValue(err(new Error("delete failed")));

    const result = await deleteBoard("user-1", "project-1", "board-1");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.statusCode).toBe(500);
      expect(result.error.message).toContain("delete failed");
    }
  });

  it("forbids members from deleting boards", async () => {
    memberRepositoryMock.findByUserAndProject.mockResolvedValue(ok([{ ...membership, role: "member" }]));

    const result = await deleteBoard("user-1", "project-1", "board-1");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.statusCode).toBe(403);
    }
    expect(boardRepositoryMock.delete).not.toHaveBeenCalled();
  });

  it("reorders only board ids that belong to the project", async () => {
    boardRepositoryMock.findByProject.mockResolvedValue(ok([board, { ...board, id: "board-2", position: 1 }]));
    boardRepositoryMock.updatePosition.mockResolvedValue(ok(undefined));

    const result = await reorderBoards("user-1", "project-1", ["board-2", "board-1"]);

    expect(result.isOk()).toBe(true);
    expect(boardRepositoryMock.updatePosition).toHaveBeenNthCalledWith(1, "board-2", 0);
    expect(boardRepositoryMock.updatePosition).toHaveBeenNthCalledWith(2, "board-1", 1);
  });

  it("rejects reorder requests with unknown board ids", async () => {
    boardRepositoryMock.findByProject.mockResolvedValue(ok([board]));

    const result = await reorderBoards("user-1", "project-1", ["board-1", "other-board"]);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.statusCode).toBe(404);
    }
    expect(boardRepositoryMock.updatePosition).not.toHaveBeenCalled();
  });

  it("wraps board reorder failures", async () => {
    boardRepositoryMock.findByProject.mockResolvedValue(ok([board]));
    boardRepositoryMock.updatePosition.mockResolvedValue(err(new Error("position failed")));

    const result = await reorderBoards("user-1", "project-1", ["board-1"]);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.statusCode).toBe(500);
      expect(result.error.message).toContain("position failed");
    }
  });
});
