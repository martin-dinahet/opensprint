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
    projects: {
      ":id": {
        "task-tags": {
          $get: vi.fn(),
          $post: vi.fn(),
          ":tagId": {
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
        items: {
          $post: vi.fn(),
          reorder: {
            $patch: vi.fn(),
          },
          ":itemId": {
            $delete: vi.fn(),
            $patch: vi.fn(),
          },
        },
        move: {
          $patch: vi.fn(),
        },
        reorder: {
          $patch: vi.fn(),
        },
        tags: {
          $post: vi.fn(),
          ":tagId": {
            $delete: vi.fn(),
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

vi.mock("@/shared", () => ({
  api: apiMock,
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
    expect(taskKeys.list("column-1")).toEqual(["tasks", "list", "column-1"]);
    expect(taskKeys.details()).toEqual(["tasks", "detail"]);
    expect(taskKeys.detail("task-1")).toEqual(["tasks", "detail", "task-1"]);
    expect(taskKeys.projectTags("project-1")).toEqual(["tasks", "project-tags", "project-1"]);
  });

  it("lists tasks and normalizes missing arrays", async () => {
    apiMock.columns[":columnId"].tasks.$get.mockResolvedValue({});

    const result = await taskApi.list("column-1");

    expect(result.unwrap()).toEqual({ tasks: [] });
    expect(apiMock.columns[":columnId"].tasks.$get).toHaveBeenCalledWith({ param: { columnId: "column-1" } });
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
    apiMock.tasks[":taskId"].move.$patch.mockResolvedValue({ id: "task-1", columnId: "column-2", position: 1 });
    apiMock.tasks[":taskId"].reorder.$patch.mockResolvedValue({ id: "task-1", position: 2 });
    apiMock.tasks[":taskId"].items.$post.mockResolvedValue({ id: "item-1" });
    apiMock.tasks[":taskId"].items[":itemId"].$patch.mockResolvedValue({ id: "item-1" });
    apiMock.tasks[":taskId"].items[":itemId"].$delete.mockResolvedValue({ success: true });
    apiMock.tasks[":taskId"].items.reorder.$patch.mockResolvedValue({ items: [] });
    apiMock.projects[":id"]["task-tags"].$get.mockResolvedValue({});
    apiMock.projects[":id"]["task-tags"].$post.mockResolvedValue({ id: "tag-1" });
    apiMock.projects[":id"]["task-tags"][":tagId"].$patch.mockResolvedValue({ id: "tag-1" });
    apiMock.projects[":id"]["task-tags"][":tagId"].$delete.mockResolvedValue({ success: true });
    apiMock.tasks[":taskId"].tags.$post.mockResolvedValue({ id: "tag-1" });
    apiMock.tasks[":taskId"].tags[":tagId"].$delete.mockResolvedValue({ success: true });

    await taskApi.create("column-1", { title: "Ship it", priority: "high" });
    await taskApi.update("column-1", "task-1", { title: "Shipped" });
    await taskApi.delete("column-1", "task-1");
    await taskApi.assign("task-1", { assigneeId: null });
    await taskApi.move("task-1", { columnId: "column-2", position: 1 });
    await taskApi.reorder("task-1", { position: 2 });
    await taskApi.createItem("task-1", { title: "Check it" });
    await taskApi.updateItem("task-1", "item-1", { done: true });
    await taskApi.deleteItem("task-1", "item-1");
    await taskApi.reorderItems("task-1", { itemIds: ["item-1"] });
    await taskApi.listProjectTags("project-1");
    await taskApi.createProjectTag("project-1", { name: "UI", color: "#2563eb" });
    await taskApi.updateProjectTag("project-1", "tag-1", { name: "Frontend" });
    await taskApi.deleteProjectTag("project-1", "tag-1");
    await taskApi.attachTag("task-1", { tagId: "tag-1" });
    await taskApi.detachTag("task-1", "tag-1");

    expect(apiMock.columns[":columnId"].tasks.$post).toHaveBeenCalledWith({
      param: { columnId: "column-1" },
      json: { title: "Ship it", priority: "high" },
    });
    expect(apiMock.columns[":columnId"].tasks[":taskId"].$patch).toHaveBeenCalledWith({
      param: { columnId: "column-1", taskId: "task-1" },
      json: { title: "Shipped" },
    });
    expect(apiMock.columns[":columnId"].tasks[":taskId"].$delete).toHaveBeenCalledWith({
      param: { columnId: "column-1", taskId: "task-1" },
    });
    expect(apiMock.tasks[":taskId"].assign.$patch).toHaveBeenCalledWith({
      param: { taskId: "task-1" },
      json: { assigneeId: null },
    });
    expect(apiMock.tasks[":taskId"].move.$patch).toHaveBeenCalledWith({
      param: { taskId: "task-1" },
      json: { columnId: "column-2", position: 1 },
    });
    expect(apiMock.tasks[":taskId"].reorder.$patch).toHaveBeenCalledWith({
      param: { taskId: "task-1" },
      json: { position: 2 },
    });
    expect(apiMock.tasks[":taskId"].items.$post).toHaveBeenCalledWith({
      param: { taskId: "task-1" },
      json: { title: "Check it" },
    });
    expect(apiMock.tasks[":taskId"].items[":itemId"].$patch).toHaveBeenCalledWith({
      param: { taskId: "task-1", itemId: "item-1" },
      json: { done: true },
    });
    expect(apiMock.tasks[":taskId"].items[":itemId"].$delete).toHaveBeenCalledWith({
      param: { taskId: "task-1", itemId: "item-1" },
    });
    expect(apiMock.tasks[":taskId"].items.reorder.$patch).toHaveBeenCalledWith({
      param: { taskId: "task-1" },
      json: { itemIds: ["item-1"] },
    });
    expect(apiMock.projects[":id"]["task-tags"].$get).toHaveBeenCalledWith({ param: { id: "project-1" } });
    expect(apiMock.projects[":id"]["task-tags"].$post).toHaveBeenCalledWith({
      param: { id: "project-1" },
      json: { name: "UI", color: "#2563eb" },
    });
    expect(apiMock.projects[":id"]["task-tags"][":tagId"].$patch).toHaveBeenCalledWith({
      param: { id: "project-1", tagId: "tag-1" },
      json: { name: "Frontend" },
    });
    expect(apiMock.projects[":id"]["task-tags"][":tagId"].$delete).toHaveBeenCalledWith({
      param: { id: "project-1", tagId: "tag-1" },
    });
    expect(apiMock.tasks[":taskId"].tags.$post).toHaveBeenCalledWith({
      param: { taskId: "task-1" },
      json: { tagId: "tag-1" },
    });
    expect(apiMock.tasks[":taskId"].tags[":tagId"].$delete).toHaveBeenCalledWith({
      param: { taskId: "task-1", tagId: "tag-1" },
    });
  });
});
