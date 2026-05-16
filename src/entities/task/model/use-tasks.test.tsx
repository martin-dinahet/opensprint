import { err, ok } from "@punpun-dev/ts-result";
import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { taskApi, taskKeys } from "@/entities/task/api";
import { ClientApiError } from "@/shared/api/result";
import { makeTask } from "@/test/factories";
import { createTestQueryClient } from "@/test/render";
import { useAssignTask, useCreateTask, useDeleteTask, useMoveTask, useReorderTask, useTasks, useUpdateTask } from ".";

vi.mock("@/entities/task/api", () => ({
  taskKeys: {
    all: ["tasks"],
    lists: () => ["tasks", "list"],
    list: (columnId: string) => ["tasks", "list", columnId],
    details: () => ["tasks", "detail"],
    detail: (id: string) => ["tasks", "detail", id],
  },
  taskApi: {
    assign: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
    list: vi.fn(),
    move: vi.fn(),
    reorder: vi.fn(),
    update: vi.fn(),
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
});
