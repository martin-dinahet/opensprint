import { err, ok } from "@punpun-dev/ts-result";
import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { taskApi, taskKeys } from "@/entities/task";
import { ClientApiError } from "@/shared";
import { makeTask } from "@/test/factories";
import { createTestQueryClient } from "@/test/render";
import {
  useAssignTask,
  useAttachTaskTag,
  useCreateProjectTaskTag,
  useCreateTask,
  useCreateTaskItem,
  useDeleteProjectTaskTag,
  useDeleteTask,
  useDeleteTaskItem,
  useDetachTaskTag,
  useMoveTask,
  useProjectTaskTags,
  useReorderTask,
  useReorderTaskItems,
  useTasks,
  useUpdateProjectTaskTag,
  useUpdateTask,
  useUpdateTaskItem,
} from ".";

vi.mock("@/entities/task", () => ({
  taskKeys: {
    all: ["tasks"],
    lists: () => ["tasks", "list"],
    list: (columnId: string) => ["tasks", "list", columnId],
    details: () => ["tasks", "detail"],
    detail: (id: string) => ["tasks", "detail", id],
    projectTags: (projectId: string) => ["tasks", "project-tags", projectId],
  },
  taskApi: {
    assign: vi.fn(),
    attachTag: vi.fn(),
    create: vi.fn(),
    createItem: vi.fn(),
    createProjectTag: vi.fn(),
    delete: vi.fn(),
    deleteItem: vi.fn(),
    deleteProjectTag: vi.fn(),
    detachTag: vi.fn(),
    list: vi.fn(),
    listProjectTags: vi.fn(),
    move: vi.fn(),
    reorder: vi.fn(),
    reorderItems: vi.fn(),
    update: vi.fn(),
    updateItem: vi.fn(),
    updateProjectTag: vi.fn(),
  },
}));

function wrapper(queryClient = createTestQueryClient()) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("task hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads tasks with the column query key", async () => {
    const tasks = [makeTask()];
    vi.mocked(taskApi.list).mockResolvedValue(ok({ tasks }));
    const queryClient = createTestQueryClient();

    const { result } = renderHook(() => useTasks("column-1"), { wrapper: wrapper(queryClient) });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(tasks);
    expect(taskApi.list).toHaveBeenCalledWith("column-1");
    expect(queryClient.getQueryData(taskKeys.list("column-1"))).toEqual(tasks);
  });

  it("does not load tasks without a column id", () => {
    const { result } = renderHook(() => useTasks(""), { wrapper: wrapper() });

    expect(result.current.fetchStatus).toBe("idle");
    expect(taskApi.list).not.toHaveBeenCalled();
  });

  it("invalidates task lists after create, update, and delete", async () => {
    vi.mocked(taskApi.create).mockResolvedValue(ok(makeTask({ id: "task-new" })));
    vi.mocked(taskApi.update).mockResolvedValue(ok(makeTask({ title: "Updated" })));
    vi.mocked(taskApi.delete).mockResolvedValue(ok({ success: true }));
    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const createHook = renderHook(() => useCreateTask(), { wrapper: wrapper(queryClient) });
    createHook.result.current.mutate({ columnId: "column-1", data: { title: "New task" } });
    await waitFor(() => expect(createHook.result.current.isSuccess).toBe(true));

    const updateHook = renderHook(() => useUpdateTask(), { wrapper: wrapper(queryClient) });
    updateHook.result.current.mutate({ columnId: "column-1", taskId: "task-1", data: { title: "Updated" } });
    await waitFor(() => expect(updateHook.result.current.isSuccess).toBe(true));

    const deleteHook = renderHook(() => useDeleteTask(), { wrapper: wrapper(queryClient) });
    deleteHook.result.current.mutate({ columnId: "column-1", taskId: "task-1" });
    await waitFor(() => expect(deleteHook.result.current.isSuccess).toBe(true));

    expect(taskApi.create).toHaveBeenCalledWith("column-1", { title: "New task" });
    expect(taskApi.update).toHaveBeenCalledWith("column-1", "task-1", { title: "Updated" });
    expect(taskApi.delete).toHaveBeenCalledWith("column-1", "task-1");
    expect(invalidateSpy).toHaveBeenCalledTimes(3);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: taskKeys.list("column-1") });
  });

  it("invalidates all task queries after assignment and reorder", async () => {
    vi.mocked(taskApi.assign).mockResolvedValue(ok({ id: "task-1", assigneeId: "member-1" }));
    vi.mocked(taskApi.reorder).mockResolvedValue(ok({ id: "task-1", position: 2 }));
    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const assignHook = renderHook(() => useAssignTask(), { wrapper: wrapper(queryClient) });
    assignHook.result.current.mutate({ taskId: "task-1", assigneeId: "member-1" });
    await waitFor(() => expect(assignHook.result.current.isSuccess).toBe(true));

    const reorderHook = renderHook(() => useReorderTask(), { wrapper: wrapper(queryClient) });
    reorderHook.result.current.mutate({ taskId: "task-1", position: 2 });
    await waitFor(() => expect(reorderHook.result.current.isSuccess).toBe(true));

    expect(taskApi.assign).toHaveBeenCalledWith("task-1", { assigneeId: "member-1" });
    expect(taskApi.reorder).toHaveBeenCalledWith("task-1", { position: 2 });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: taskKeys.all });
  });

  it("optimistically moves a task between cached column lists", async () => {
    const movedTask = makeTask({ id: "task-1", columnId: "column-1", position: 0 });
    const targetTask = makeTask({ id: "task-2", columnId: "column-2", position: 0 });
    vi.mocked(taskApi.move).mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve(ok({ id: "task-1", columnId: "column-2", position: 0 })), 0);
        }),
    );
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(taskKeys.list("column-1"), [movedTask]);
    queryClient.setQueryData(taskKeys.list("column-2"), [targetTask]);

    const { result } = renderHook(() => useMoveTask(), { wrapper: wrapper(queryClient) });

    result.current.mutate({ taskId: "task-1", data: { columnId: "column-2", position: 0 } });

    await waitFor(() => {
      expect(queryClient.getQueryData(taskKeys.list("column-1"))).toEqual([]);
      expect(queryClient.getQueryData(taskKeys.list("column-2"))).toEqual([
        { ...movedTask, columnId: "column-2", position: 0 },
        targetTask,
      ]);
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("restores previous task lists when an optimistic move fails", async () => {
    const movedTask = makeTask({ id: "task-1", columnId: "column-1", position: 0 });
    const targetTask = makeTask({ id: "task-2", columnId: "column-2", position: 0 });
    vi.mocked(taskApi.move).mockResolvedValue(err(new ClientApiError("Move failed", 500)));
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(taskKeys.list("column-1"), [movedTask]);
    queryClient.setQueryData(taskKeys.list("column-2"), [targetTask]);

    const { result } = renderHook(() => useMoveTask(), { wrapper: wrapper(queryClient) });

    result.current.mutate({ taskId: "task-1", data: { columnId: "column-2", position: 0 } });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(queryClient.getQueryData(taskKeys.list("column-1"))).toEqual([movedTask]);
    expect(queryClient.getQueryData(taskKeys.list("column-2"))).toEqual([targetTask]);
  });

  it("skips optimistic cache edits when the moved task is unknown", async () => {
    vi.mocked(taskApi.move).mockResolvedValue(ok({ id: "missing-task", columnId: "column-2", position: 0 }));
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(taskKeys.list("column-1"), [makeTask({ id: "task-1" })]);

    const { result } = renderHook(() => useMoveTask(), { wrapper: wrapper(queryClient) });

    result.current.mutate({ taskId: "missing-task", data: { columnId: "column-2" } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queryClient.getQueryData(taskKeys.list("column-1"))).toEqual([makeTask({ id: "task-1" })]);
    expect(queryClient.getQueryData(taskKeys.list("column-2"))).toBeUndefined();
  });

  it("loads project task tags only when a project id is present", async () => {
    const tags = [
      {
        id: "tag-1",
        projectId: "project-1",
        name: "Frontend",
        color: "#2563eb",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ];
    vi.mocked(taskApi.listProjectTags).mockResolvedValue(ok({ tags }));
    const queryClient = createTestQueryClient();

    const disabledHook = renderHook(() => useProjectTaskTags(""), { wrapper: wrapper(queryClient) });
    expect(disabledHook.result.current.fetchStatus).toBe("idle");

    const enabledHook = renderHook(() => useProjectTaskTags("project-1"), { wrapper: wrapper(queryClient) });
    await waitFor(() => expect(enabledHook.result.current.isSuccess).toBe(true));

    expect(taskApi.listProjectTags).toHaveBeenCalledTimes(1);
    expect(taskApi.listProjectTags).toHaveBeenCalledWith("project-1");
    expect(enabledHook.result.current.data).toEqual(tags);
  });

  it("invalidates task lists after task item mutations", async () => {
    const item = {
      id: "item-1",
      taskId: "task-1",
      title: "Review copy",
      done: false,
      position: 0,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    vi.mocked(taskApi.createItem).mockResolvedValue(ok(item));
    vi.mocked(taskApi.updateItem).mockResolvedValue(ok({ ...item, done: true }));
    vi.mocked(taskApi.deleteItem).mockResolvedValue(ok({ success: true }));
    vi.mocked(taskApi.reorderItems).mockResolvedValue(ok({ items: [item] }));
    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const createHook = renderHook(() => useCreateTaskItem(), { wrapper: wrapper(queryClient) });
    createHook.result.current.mutate({ columnId: "column-1", taskId: "task-1", title: "Review copy" });
    await waitFor(() => expect(createHook.result.current.isSuccess).toBe(true));

    const updateHook = renderHook(() => useUpdateTaskItem(), { wrapper: wrapper(queryClient) });
    updateHook.result.current.mutate({ columnId: "column-1", taskId: "task-1", itemId: "item-1", done: true });
    await waitFor(() => expect(updateHook.result.current.isSuccess).toBe(true));

    const deleteHook = renderHook(() => useDeleteTaskItem(), { wrapper: wrapper(queryClient) });
    deleteHook.result.current.mutate({ columnId: "column-1", taskId: "task-1", itemId: "item-1" });
    await waitFor(() => expect(deleteHook.result.current.isSuccess).toBe(true));

    const reorderHook = renderHook(() => useReorderTaskItems(), { wrapper: wrapper(queryClient) });
    reorderHook.result.current.mutate({ columnId: "column-1", taskId: "task-1", itemIds: ["item-1"] });
    await waitFor(() => expect(reorderHook.result.current.isSuccess).toBe(true));

    expect(taskApi.createItem).toHaveBeenCalledWith("task-1", { title: "Review copy" });
    expect(taskApi.updateItem).toHaveBeenCalledWith("task-1", "item-1", { done: true, title: undefined });
    expect(taskApi.deleteItem).toHaveBeenCalledWith("task-1", "item-1");
    expect(taskApi.reorderItems).toHaveBeenCalledWith("task-1", { itemIds: ["item-1"] });
    expect(invalidateSpy).toHaveBeenCalledTimes(4);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: taskKeys.list("column-1") });
  });

  it("invalidates project tags and task lists after tag mutations", async () => {
    const tag = {
      id: "tag-1",
      projectId: "project-1",
      name: "Frontend",
      color: "#2563eb",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    vi.mocked(taskApi.createProjectTag).mockResolvedValue(ok(tag));
    vi.mocked(taskApi.updateProjectTag).mockResolvedValue(ok({ ...tag, name: "UI" }));
    vi.mocked(taskApi.deleteProjectTag).mockResolvedValue(ok({ success: true }));
    vi.mocked(taskApi.attachTag).mockResolvedValue(ok(tag));
    vi.mocked(taskApi.detachTag).mockResolvedValue(ok({ success: true }));
    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const createTagHook = renderHook(() => useCreateProjectTaskTag(), { wrapper: wrapper(queryClient) });
    createTagHook.result.current.mutate({ projectId: "project-1", data: { name: "Frontend", color: "#2563eb" } });
    await waitFor(() => expect(createTagHook.result.current.isSuccess).toBe(true));

    const updateTagHook = renderHook(() => useUpdateProjectTaskTag(), { wrapper: wrapper(queryClient) });
    updateTagHook.result.current.mutate({
      projectId: "project-1",
      tagId: "tag-1",
      data: { name: "UI" },
    });
    await waitFor(() => expect(updateTagHook.result.current.isSuccess).toBe(true));

    const deleteTagHook = renderHook(() => useDeleteProjectTaskTag(), { wrapper: wrapper(queryClient) });
    deleteTagHook.result.current.mutate({ projectId: "project-1", tagId: "tag-1" });
    await waitFor(() => expect(deleteTagHook.result.current.isSuccess).toBe(true));

    const attachHook = renderHook(() => useAttachTaskTag(), { wrapper: wrapper(queryClient) });
    attachHook.result.current.mutate({ columnId: "column-1", taskId: "task-1", tagId: "tag-1" });
    await waitFor(() => expect(attachHook.result.current.isSuccess).toBe(true));

    const detachHook = renderHook(() => useDetachTaskTag(), { wrapper: wrapper(queryClient) });
    detachHook.result.current.mutate({ columnId: "column-1", taskId: "task-1", tagId: "tag-1" });
    await waitFor(() => expect(detachHook.result.current.isSuccess).toBe(true));

    expect(taskApi.createProjectTag).toHaveBeenCalledWith("project-1", { name: "Frontend", color: "#2563eb" });
    expect(taskApi.updateProjectTag).toHaveBeenCalledWith("project-1", "tag-1", { name: "UI" });
    expect(taskApi.deleteProjectTag).toHaveBeenCalledWith("project-1", "tag-1");
    expect(taskApi.attachTag).toHaveBeenCalledWith("task-1", { tagId: "tag-1" });
    expect(taskApi.detachTag).toHaveBeenCalledWith("task-1", "tag-1");
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: taskKeys.projectTags("project-1") });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: taskKeys.all });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: taskKeys.list("column-1") });
  });
});
