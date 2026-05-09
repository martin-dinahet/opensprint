import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCreateBoard } from "@/entities/board";
import { useCreateBoardForm } from "./use-create-board-form";

const { createBoardMock, pushMock } = vi.hoisted(() => ({
  createBoardMock: {
    isPending: false,
    mutateAsync: vi.fn(),
  },
  pushMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/entities/board", () => ({
  useCreateBoard: vi.fn(() => createBoardMock),
}));

function makeFormData(values: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value);
  }
  return formData;
}

describe("useCreateBoardForm", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(useCreateBoard).mockReturnValue(createBoardMock as never);
    createBoardMock.isPending = false;
  });

  it("creates a board and navigates to its kanban route", async () => {
    createBoardMock.mutateAsync.mockResolvedValue({ id: "board-new" });
    const onOpenChange = vi.fn();
    const { result } = renderHook(() => useCreateBoardForm({ onOpenChange, projectId: "project-1" }));

    act(() => {
      result.current.action(makeFormData({ description: "Sprint scope", name: "Sprint" }));
    });

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(createBoardMock.mutateAsync).toHaveBeenCalledWith({
      data: { description: "Sprint scope", name: "Sprint" },
      projectId: "project-1",
    });
    expect(pushMock).toHaveBeenCalledWith("/projects/project-1/boards/board-new");
  });

  it("validates board input before submitting", async () => {
    const { result } = renderHook(() => useCreateBoardForm({ onOpenChange: vi.fn(), projectId: "project-1" }));

    act(() => {
      result.current.action(makeFormData({ description: "", name: "" }));
    });

    await waitFor(() => expect(result.current.fieldErrors?.name?.[0]).toBeTruthy());
    expect(createBoardMock.mutateAsync).not.toHaveBeenCalled();
  });
});
