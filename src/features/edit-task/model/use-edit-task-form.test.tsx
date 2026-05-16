import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAssignTask, useUpdateTask } from "@/entities/task";
import { makeTask } from "@/test/factories";
import { useEditTaskForm } from "./use-edit-task-form";

const { assignTaskMock, updateTaskMock } = vi.hoisted(() => ({
  assignTaskMock: {
    isPending: false,
    mutateAsync: vi.fn(),
  },
  updateTaskMock: {
    isPending: false,
    mutateAsync: vi.fn(),
  },
}));

vi.mock("@/entities/task", () => ({
  useAssignTask: vi.fn(() => assignTaskMock),
  useUpdateTask: vi.fn(() => updateTaskMock),
}));

function makeFormData(values: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value);
  }
  return formData;
}

describe("useEditTaskForm", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(useAssignTask).mockReturnValue(assignTaskMock as never);
    vi.mocked(useUpdateTask).mockReturnValue(updateTaskMock as never);
    assignTaskMock.isPending = false;
    updateTaskMock.isPending = false;
  });

  it("hydrates state from the current task", () => {
    const task = makeTask({
      assigneeId: "member-1",
      description: "Existing notes",
      priority: "high",
      title: "Edit me",
    });
    const { result } = renderHook(() => useEditTaskForm({ onOpenChange: vi.fn(), task }));

    expect(result.current.title).toBe("Edit me");
    expect(result.current.description).toBe("Existing notes");
    expect(result.current.priority).toBe("high");
    expect(result.current.assigneeId).toBe("member-1");
  });

  it("updates task fields and assignment when the assignee changes", async () => {
    const task = makeTask({ assigneeId: null });
    updateTaskMock.mutateAsync.mockResolvedValue(undefined);
    assignTaskMock.mutateAsync.mockResolvedValue(undefined);
    const onOpenChange = vi.fn();
    const { result } = renderHook(() => useEditTaskForm({ onOpenChange, task }));

    act(() => {
      result.current.action(
        makeFormData({
          assigneeId: "member-1",
          description: "Updated notes",
          priority: "urgent",
          title: "Updated task",
        }),
      );
    });

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));

    expect(updateTaskMock.mutateAsync).toHaveBeenCalledWith({
      columnId: "column-1",
      data: {
        description: "Updated notes",
        priority: "urgent",
        title: "Updated task",
      },
      taskId: "task-1",
    });
    expect(assignTaskMock.mutateAsync).toHaveBeenCalledWith({ assigneeId: "member-1", taskId: "task-1" });
  });

  it("does not assign when the assignee is unchanged", async () => {
    const task = makeTask({ assigneeId: "member-1" });
    updateTaskMock.mutateAsync.mockResolvedValue(undefined);
    const { result } = renderHook(() => useEditTaskForm({ onOpenChange: vi.fn(), task }));

    act(() => {
      result.current.action(
        makeFormData({
          assigneeId: "member-1",
          description: "",
          priority: "medium",
          title: "Same assignee",
        }),
      );
    });

    await waitFor(() => expect(updateTaskMock.mutateAsync).toHaveBeenCalled());

    expect(assignTaskMock.mutateAsync).not.toHaveBeenCalled();
    expect(updateTaskMock.mutateAsync).toHaveBeenCalledWith({
      columnId: "column-1",
      data: {
        description: undefined,
        priority: "medium",
        title: "Same assignee",
      },
      taskId: "task-1",
    });
  });

  it("exposes pending state from task mutations", () => {
    updateTaskMock.isPending = true;
    const { result } = renderHook(() => useEditTaskForm({ onOpenChange: vi.fn(), task: makeTask() }));

    expect(result.current.pending).toBe(true);
  });
});
