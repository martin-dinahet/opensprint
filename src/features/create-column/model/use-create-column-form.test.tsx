import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCreateColumn } from "@/entities/column";
import { useCreateColumnForm } from "./use-create-column-form";

const { createColumnMock } = vi.hoisted(() => ({
  createColumnMock: {
    isPending: false,
    mutateAsync: vi.fn(),
  },
}));

vi.mock("@/entities/column", () => ({
  useCreateColumn: vi.fn(() => createColumnMock),
}));

function makeFormData(values: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value);
  }
  return formData;
}

describe("useCreateColumnForm", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(useCreateColumn).mockReturnValue(createColumnMock as never);
    createColumnMock.isPending = false;
  });

  it("creates a column and closes the dialog", async () => {
    createColumnMock.mutateAsync.mockResolvedValue({ id: "column-new", name: "Doing" });
    const onOpenChange = vi.fn();
    const { result } = renderHook(() =>
      useCreateColumnForm({ boardId: "board-1", onOpenChange, projectId: "project-1" }),
    );

    act(() => {
      result.current.action(makeFormData({ name: "Doing" }));
    });

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));

    expect(createColumnMock.mutateAsync).toHaveBeenCalledWith({
      projectId: "project-1",
      boardId: "board-1",
      data: { name: "Doing" },
    });
    expect(result.current.globalError).toBeNull();
  });

  it("stores validation errors without submitting", async () => {
    const { result } = renderHook(() =>
      useCreateColumnForm({ boardId: "board-1", onOpenChange: vi.fn(), projectId: "project-1" }),
    );

    act(() => {
      result.current.action(makeFormData({ name: "" }));
    });

    await waitFor(() => expect(result.current.fieldErrors?.name).toBeDefined());

    expect(createColumnMock.mutateAsync).not.toHaveBeenCalled();
  });

  it("requires a selected board before submitting", async () => {
    const { result } = renderHook(() =>
      useCreateColumnForm({ boardId: "", onOpenChange: vi.fn(), projectId: "project-1" }),
    );

    act(() => {
      result.current.action(makeFormData({ name: "Doing" }));
    });

    await waitFor(() => expect(result.current.globalError).toBe("Choose a board before creating a column."));

    expect(createColumnMock.mutateAsync).not.toHaveBeenCalled();
  });

  it("shows mutation failures, exposes pending state, and resets local errors", async () => {
    createColumnMock.isPending = true;
    createColumnMock.mutateAsync.mockRejectedValue(new Error("Create failed"));
    const { result } = renderHook(() =>
      useCreateColumnForm({ boardId: "board-1", onOpenChange: vi.fn(), projectId: "project-1" }),
    );

    expect(result.current.pending).toBe(true);

    act(() => {
      result.current.action(makeFormData({ name: "Doing" }));
    });

    await waitFor(() => expect(result.current.globalError).toBe("Create failed"));

    act(() => {
      result.current.reset();
    });

    expect(result.current.fieldErrors).toBeNull();
    expect(result.current.globalError).toBeNull();
  });
});
