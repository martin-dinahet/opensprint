import { ok } from "@punpun-dev/ts-result";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiMock, requestApiResultMock } = vi.hoisted(() => ({
  apiMock: {
    columns: {
      ":columnId": {
        tasks: {
          $get: vi.fn(),
          $post: vi.fn(),
          ":taskId": {
            $delete: vi.fn(),
            $patch: vi.fn(),
          },
        },
      },
    },
    tasks: {
      ":taskId": {
        assign: {
          $patch: vi.fn(),
        },
        move: {
          $patch: vi.fn(),
        },
        reorder: {
          $patch: vi.fn(),
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

const { taskApi, taskKeys } = await import(".");

describe("task API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("builds stable query keys", () => {
    expect(taskKeys.all).toEqual(["tasks"]);
    expect(taskKeys.lists()).toEqual(["tasks", "list"]);
    expect(taskKeys.list("board-1")).toEqual(["tasks", "list", "board-1"]);
    expect(taskKeys.details()).toEqual(["tasks", "detail"]);
    expect(taskKeys.detail("task-1")).toEqual(["tasks", "detail", "task-1"]);
  });

  it("lists tasks and normalizes missing arrays", async () => {
    apiMock.columns[":columnId"].tasks.$get.mockResolvedValue({});

    const result = await taskApi.list("board-1");

    expect(result.unwrap()).toEqual({ tasks: [] });
    expect(apiMock.columns[":columnId"].tasks.$get).toHaveBeenCalledWith({ param: { columnId: "board-1" } });
    expect(requestApiResultMock).toHaveBeenCalledWith(
      expect.any(Function),
      "Failed to fetch tasks",
      expect.any(Function),
    );
  });

  it("passes params and bodies to task mutations", async () => {
    apiMock.columns[":columnId"].tasks.$post.mockResolvedValue({ id: "task-new" });
    apiMock.columns[":columnId"].tasks[":taskId"].$patch.mockResolvedValue({ id: "task-1" });
    apiMock.columns[":columnId"].tasks[":taskId"].$delete.mockResolvedValue({ success: true });
    apiMock.tasks[":taskId"].assign.$patch.mockResolvedValue({ id: "task-1", assigneeId: null });
    apiMock.tasks[":taskId"].move.$patch.mockResolvedValue({ id: "task-1", columnId: "board-2", position: 1 });
    apiMock.tasks[":taskId"].reorder.$patch.mockResolvedValue({ id: "task-1", position: 2 });

    await taskApi.create("board-1", { title: "Ship it", priority: "high" });
    await taskApi.update("board-1", "task-1", { title: "Shipped" });
    await taskApi.delete("board-1", "task-1");
    await taskApi.assign("task-1", { assigneeId: null });
    await taskApi.move("task-1", { columnId: "board-2", position: 1 });
    await taskApi.reorder("task-1", { position: 2 });

    expect(apiMock.columns[":columnId"].tasks.$post).toHaveBeenCalledWith({
      param: { columnId: "board-1" },
      json: { title: "Ship it", priority: "high" },
    });
    expect(apiMock.columns[":columnId"].tasks[":taskId"].$patch).toHaveBeenCalledWith({
      param: { columnId: "board-1", taskId: "task-1" },
      json: { title: "Shipped" },
    });
    expect(apiMock.columns[":columnId"].tasks[":taskId"].$delete).toHaveBeenCalledWith({
      param: { columnId: "board-1", taskId: "task-1" },
    });
    expect(apiMock.tasks[":taskId"].assign.$patch).toHaveBeenCalledWith({
      param: { taskId: "task-1" },
      json: { assigneeId: null },
    });
    expect(apiMock.tasks[":taskId"].move.$patch).toHaveBeenCalledWith({
      param: { taskId: "task-1" },
      json: { columnId: "board-2", position: 1 },
    });
    expect(apiMock.tasks[":taskId"].reorder.$patch).toHaveBeenCalledWith({
      param: { taskId: "task-1" },
      json: { position: 2 },
    });
  });
});
