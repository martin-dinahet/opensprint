import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCreateTask } from "@/entities/task";
import { useCreateTaskForm } from "./use-create-task-form";

const { createTaskMock } = vi.hoisted(() => ({
  createTaskMock: {
    isPending: false,
    mutateAsync: vi.fn(),
  },
}));

vi.mock("@/entities/task", () => ({
  useCreateTask: vi.fn(() => createTaskMock),
}));

function makeFormData(values: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value);
  }
  return formData;
}

describe("useCreateTaskForm", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(useCreateTask).mockReturnValue(createTaskMock as never);
    createTaskMock.isPending = false;
  });

  it("creates a task and resets local form state", async () => {
    createTaskMock.mutateAsync.mockResolvedValue({ id: "task-new" });
    const onOpenChange = vi.fn();
    const { result } = renderHook(() => useCreateTaskForm({ boardId: "board-1", onOpenChange }));

    act(() => {
      result.current.setPriority("urgent");
      result.current.setAssigneeId("member-1");
    });

    act(() => {
      result.current.action(
        makeFormData({
          assigneeId: "member-1",
          description: "Useful task notes",
          priority: "urgent",
          title: "Ship coverage",
        }),
      );
    });

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));

    expect(createTaskMock.mutateAsync).toHaveBeenCalledWith({
      boardId: "board-1",
      data: {
        assigneeId: "member-1",
        description: "Useful task notes",
        priority: "urgent",
        title: "Ship coverage",
      },
    });
    expect(result.current.priority).toBe("medium");
    expect(result.current.assigneeId).toBeNull();
    expect(result.current.globalError).toBeNull();
  });

  it("stores validation errors without submitting", async () => {
    const { result } = renderHook(() => useCreateTaskForm({ boardId: "board-1", onOpenChange: vi.fn() }));

    act(() => {
      result.current.action(makeFormData({ title: "", description: "no", priority: "medium", assigneeId: "" }));
    });

    await waitFor(() => expect(result.current.fieldErrors?.title).toBeDefined());

    expect(result.current.fieldErrors?.description).toBeDefined();
    expect(createTaskMock.mutateAsync).not.toHaveBeenCalled();
  });

  it("shows a global error when no board is selected", async () => {
    const { result } = renderHook(() => useCreateTaskForm({ boardId: "", onOpenChange: vi.fn() }));

    act(() => {
      result.current.action(makeFormData({ title: "Ship coverage", priority: "medium" }));
    });

    await waitFor(() => expect(result.current.globalError).toBe("Choose a board before creating a task."));
    expect(createTaskMock.mutateAsync).not.toHaveBeenCalled();
  });

  it("shows mutation failures and exposes pending state", async () => {
    createTaskMock.isPending = true;
    createTaskMock.mutateAsync.mockRejectedValue(new Error("Create failed"));
    const { result } = renderHook(() => useCreateTaskForm({ boardId: "board-1", onOpenChange: vi.fn() }));

    expect(result.current.pending).toBe(true);

    act(() => {
      result.current.action(makeFormData({ title: "Ship coverage", priority: "medium" }));
    });

    await waitFor(() => expect(result.current.globalError).toBe("Create failed"));
  });
});
