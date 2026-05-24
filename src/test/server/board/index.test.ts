import { err, ok } from "@punpun-dev/ts-result";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { boardRepositoryMock, columnRepositoryMock, memberRepositoryMock, nanoidMock, projectRepositoryMock } =
  vi.hoisted(() => ({
    boardRepositoryMock: {
      create: vi.fn(),
      findById: vi.fn(),
      findByProject: vi.fn(),
    },
    columnRepositoryMock: {
      create: vi.fn(),
    },
    memberRepositoryMock: {
      findByUserAndProject: vi.fn(),
    },
    nanoidMock: vi.fn(),
    projectRepositoryMock: {
      findById: vi.fn(),
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
}));

const { CreateBoardUseCase } = await import("@/server/use-cases/board");

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

describe("board use cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    nanoidMock
      .mockReturnValueOnce("board-new")
      .mockReturnValueOnce("column-todo")
      .mockReturnValueOnce("column-progress")
      .mockReturnValueOnce("column-done");
    projectRepositoryMock.findById.mockResolvedValue(ok([project]));
    memberRepositoryMock.findByUserAndProject.mockResolvedValue(ok([membership]));
    boardRepositoryMock.findByProject.mockResolvedValue(ok([{ ...board, id: "board-existing", position: 0 }]));
    boardRepositoryMock.create.mockResolvedValue(ok(undefined));
    boardRepositoryMock.findById.mockResolvedValue(ok([board]));
    columnRepositoryMock.create.mockResolvedValue(ok(undefined));
  });

  it("creates a board with Todo, In Progress, and Done columns", async () => {
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
      name: "Todo",
      position: 0,
    });
    expect(columnRepositoryMock.create).toHaveBeenNthCalledWith(2, {
      id: "column-progress",
      boardId: "board-new",
      name: "In Progress",
      position: 1,
    });
    expect(columnRepositoryMock.create).toHaveBeenNthCalledWith(3, {
      id: "column-done",
      boardId: "board-new",
      name: "Done",
      position: 2,
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
});
