import { ok } from "@punpun-dev/ts-result";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiMock, requestApiResultMock } = vi.hoisted(() => ({
  apiMock: {
    boards: {
      ":boardId": {
        columns: {
          $get: vi.fn(),
          $post: vi.fn(),
          ":columnId": {
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

const { columnApi, columnKeys } = await import(".");

describe("column API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("builds stable query keys", () => {
    expect(columnKeys.all).toEqual(["columns"]);
    expect(columnKeys.lists()).toEqual(["columns", "list"]);
    expect(columnKeys.list("board-1")).toEqual(["columns", "list", "board-1"]);
    expect(columnKeys.details()).toEqual(["columns", "detail"]);
    expect(columnKeys.detail("column-1")).toEqual(["columns", "detail", "column-1"]);
  });

  it("lists columns and normalizes missing arrays", async () => {
    apiMock.boards[":boardId"].columns.$get.mockResolvedValue({});

    const result = await columnApi.list("board-1");

    expect(result.unwrap()).toEqual({ columns: [] });
    expect(apiMock.boards[":boardId"].columns.$get).toHaveBeenCalledWith({ param: { boardId: "board-1" } });
    expect(requestApiResultMock).toHaveBeenCalledWith(
      expect.any(Function),
      "Failed to fetch columns",
      expect.any(Function),
    );
  });

  it("passes params and bodies to column mutations", async () => {
    apiMock.boards[":boardId"].columns[":columnId"].$get.mockResolvedValue({ id: "column-1" });
    apiMock.boards[":boardId"].columns.$post.mockResolvedValue({ id: "column-new" });
    apiMock.boards[":boardId"].columns[":columnId"].$patch.mockResolvedValue({ id: "column-1" });
    apiMock.boards[":boardId"].columns[":columnId"].$delete.mockResolvedValue({ success: true });
    apiMock.boards[":boardId"].columns.reorder.$patch.mockResolvedValue({ success: true });

    await columnApi.get("board-1", "column-1");
    await columnApi.create("board-1", { name: "Doing" });
    await columnApi.update("board-1", "column-1", { name: "Done" });
    await columnApi.delete("board-1", "column-1");
    await columnApi.reorder("board-1", { columnIds: ["column-2", "column-1"] });

    expect(apiMock.boards[":boardId"].columns[":columnId"].$get).toHaveBeenCalledWith({
      param: { boardId: "board-1", columnId: "column-1" },
    });
    expect(apiMock.boards[":boardId"].columns.$post).toHaveBeenCalledWith({
      param: { boardId: "board-1" },
      json: { name: "Doing" },
    });
    expect(apiMock.boards[":boardId"].columns[":columnId"].$patch).toHaveBeenCalledWith({
      param: { boardId: "board-1", columnId: "column-1" },
      json: { name: "Done" },
    });
    expect(apiMock.boards[":boardId"].columns[":columnId"].$delete).toHaveBeenCalledWith({
      param: { boardId: "board-1", columnId: "column-1" },
    });
    expect(apiMock.boards[":boardId"].columns.reorder.$patch).toHaveBeenCalledWith({
      param: { boardId: "board-1" },
      json: { columnIds: ["column-2", "column-1"] },
    });
  });
});
