import { ok } from "@punpun-dev/ts-result";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiMock, requestApiResultMock } = vi.hoisted(() => ({
  apiMock: {
    projects: {
      ":projectId": {
        columns: {
          $get: vi.fn(),
          $post: vi.fn(),
          reorder: {
            $patch: vi.fn(),
          },
          ":columnId": {
            $delete: vi.fn(),
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
    expect(columnKeys.list("project-1")).toEqual(["columns", "list", "project-1"]);
  });

  it("lists columns and normalizes missing arrays", async () => {
    apiMock.projects[":projectId"].columns.$get.mockResolvedValue({});

    const result = await columnApi.list("project-1");

    expect(result.unwrap()).toEqual({ columns: [] });
    expect(apiMock.projects[":projectId"].columns.$get).toHaveBeenCalledWith({ param: { projectId: "project-1" } });
    expect(requestApiResultMock).toHaveBeenCalledWith(
      expect.any(Function),
      "Failed to fetch columns",
      expect.any(Function),
    );
  });

  it("passes project params and bodies to column mutations", async () => {
    apiMock.projects[":projectId"].columns.$post.mockResolvedValue({ id: "column-new" });
    apiMock.projects[":projectId"].columns[":columnId"].$patch.mockResolvedValue({ id: "column-1" });
    apiMock.projects[":projectId"].columns[":columnId"].$delete.mockResolvedValue({ success: true });
    apiMock.projects[":projectId"].columns.reorder.$patch.mockResolvedValue({ success: true });

    await columnApi.create("project-1", { name: "Doing" });
    await columnApi.update("project-1", "column-1", { name: "Done" });
    await columnApi.delete("project-1", "column-1");
    await columnApi.reorder("project-1", { columnIds: ["column-2", "column-1"] });

    expect(apiMock.projects[":projectId"].columns.$post).toHaveBeenCalledWith({
      param: { projectId: "project-1" },
      json: { name: "Doing" },
    });
    expect(apiMock.projects[":projectId"].columns[":columnId"].$patch).toHaveBeenCalledWith({
      param: { projectId: "project-1", columnId: "column-1" },
      json: { name: "Done" },
    });
    expect(apiMock.projects[":projectId"].columns[":columnId"].$delete).toHaveBeenCalledWith({
      param: { projectId: "project-1", columnId: "column-1" },
    });
    expect(apiMock.projects[":projectId"].columns.reorder.$patch).toHaveBeenCalledWith({
      param: { projectId: "project-1" },
      json: { columnIds: ["column-2", "column-1"] },
    });
  });
});
