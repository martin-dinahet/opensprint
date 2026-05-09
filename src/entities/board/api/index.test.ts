import { ok } from "@punpun-dev/ts-result";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiMock, requestApiResultMock } = vi.hoisted(() => ({
  apiMock: {
    projects: {
      ":id": {
        boards: {
          $get: vi.fn(),
          $post: vi.fn(),
          ":boardId": {
            $delete: vi.fn(),
            $get: vi.fn(),
            $patch: vi.fn(),
          },
          reorder: {
            $patch: vi.fn(),
          },
        },
      },
    },
  },
  requestApiResultMock: vi.fn(
    async (request: () => Promise<unknown>, _message: string, readData?: (body: unknown) => unknown) => {
      const body = await request();
      return ok(readData ? readData(body) : body);
    },
  ),
}));

vi.mock("@/shared/api/client", () => ({
  api: apiMock,
}));

vi.mock("@/shared/api/result", () => ({
  requestApiResult: requestApiResultMock,
}));

const { boardApi, boardKeys } = await import(".");

describe("board API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("builds stable query keys", () => {
    expect(boardKeys.all).toEqual(["boards"]);
    expect(boardKeys.lists()).toEqual(["boards", "list"]);
    expect(boardKeys.list("project-1")).toEqual(["boards", "list", "project-1"]);
    expect(boardKeys.details()).toEqual(["boards", "detail"]);
    expect(boardKeys.detail("board-1")).toEqual(["boards", "detail", "board-1"]);
  });

  it("lists boards and normalizes missing arrays", async () => {
    apiMock.projects[":id"].boards.$get.mockResolvedValue({});

    const result = await boardApi.list("project-1");

    expect(result.unwrap()).toEqual({ boards: [] });
    expect(apiMock.projects[":id"].boards.$get).toHaveBeenCalledWith({ param: { id: "project-1" } });
    expect(requestApiResultMock).toHaveBeenCalledWith(
      expect.any(Function),
      "Failed to fetch boards",
      expect.any(Function),
    );
  });

  it("passes params and bodies to board mutations", async () => {
    apiMock.projects[":id"].boards[":boardId"].$get.mockResolvedValue({ id: "board-1" });
    apiMock.projects[":id"].boards.$post.mockResolvedValue({ id: "board-new" });
    apiMock.projects[":id"].boards[":boardId"].$patch.mockResolvedValue({ id: "board-1" });
    apiMock.projects[":id"].boards[":boardId"].$delete.mockResolvedValue({ success: true });
    apiMock.projects[":id"].boards.reorder.$patch.mockResolvedValue({ success: true });

    await boardApi.get("project-1", "board-1");
    await boardApi.create("project-1", { name: "Doing" });
    await boardApi.update("project-1", "board-1", { name: "Done" });
    await boardApi.delete("project-1", "board-1");
    await boardApi.reorder("project-1", { boardIds: ["board-2", "board-1"] });

    expect(apiMock.projects[":id"].boards[":boardId"].$get).toHaveBeenCalledWith({
      param: { id: "project-1", boardId: "board-1" },
    });
    expect(apiMock.projects[":id"].boards.$post).toHaveBeenCalledWith({
      param: { id: "project-1" },
      json: { name: "Doing" },
    });
    expect(apiMock.projects[":id"].boards[":boardId"].$patch).toHaveBeenCalledWith({
      param: { id: "project-1", boardId: "board-1" },
      json: { name: "Done" },
    });
    expect(apiMock.projects[":id"].boards[":boardId"].$delete).toHaveBeenCalledWith({
      param: { id: "project-1", boardId: "board-1" },
    });
    expect(apiMock.projects[":id"].boards.reorder.$patch).toHaveBeenCalledWith({
      param: { id: "project-1" },
      json: { boardIds: ["board-2", "board-1"] },
    });
  });
});
