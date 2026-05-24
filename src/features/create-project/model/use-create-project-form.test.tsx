import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCreateProject } from "@/entities/project";
import { useCreateProjectForm } from "./use-create-project-form";

const { createProjectMock, pushMock, toastSuccessMock } = vi.hoisted(() => ({
  createProjectMock: {
    isPending: false,
    mutateAsync: vi.fn(),
  },
  pushMock: vi.fn(),
  toastSuccessMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/entities/project", () => ({
  useCreateProject: vi.fn(() => createProjectMock),
}));

vi.mock("sonner", () => ({
  toast: {
    success: toastSuccessMock,
  },
}));

function makeFormData(values: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value);
  }
  return formData;
}

describe("useCreateProjectForm", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(useCreateProject).mockReturnValue(createProjectMock as never);
    createProjectMock.isPending = false;
  });

  it("creates a project, closes the dialog, and navigates to the project", async () => {
    createProjectMock.mutateAsync.mockResolvedValue({ id: "project-new", defaultBoardId: "board-new" });
    const onOpenChange = vi.fn();
    const { result } = renderHook(() => useCreateProjectForm({ onOpenChange }));

    act(() => {
      result.current.action(makeFormData({ defaultBoardName: "Roadmap", description: "", name: "Mobile app launch" }));
    });

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));

    expect(createProjectMock.mutateAsync).toHaveBeenCalledWith({
      defaultBoardName: "Roadmap",
      description: undefined,
      name: "Mobile app launch",
    });
    expect(pushMock).toHaveBeenCalledWith("/projects/project-new/boards/board-new");
    expect(toastSuccessMock).toHaveBeenCalledWith('Project created with board "Roadmap"');
    expect(result.current.globalError).toBeNull();
  });

  it("stores validation errors without submitting", async () => {
    const { result } = renderHook(() => useCreateProjectForm({ onOpenChange: vi.fn() }));

    act(() => {
      result.current.action(makeFormData({ defaultBoardName: "", description: "no", name: "x" }));
    });

    await waitFor(() => expect(result.current.fieldErrors?.name).toBeDefined());

    expect(result.current.fieldErrors?.defaultBoardName).toBeDefined();
    expect(result.current.fieldErrors?.description).toBeDefined();
    expect(createProjectMock.mutateAsync).not.toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("shows mutation failures and exposes pending state", async () => {
    createProjectMock.isPending = true;
    createProjectMock.mutateAsync.mockRejectedValue(new Error("Create failed"));
    const { result } = renderHook(() => useCreateProjectForm({ onOpenChange: vi.fn() }));

    expect(result.current.pending).toBe(true);

    act(() => {
      result.current.action(
        makeFormData({ defaultBoardName: "Roadmap", description: "Detailed enough", name: "Mobile app launch" }),
      );
    });

    await waitFor(() => expect(result.current.globalError).toBe("Create failed"));
  });

  it("resets local errors", async () => {
    const { result } = renderHook(() => useCreateProjectForm({ onOpenChange: vi.fn() }));

    act(() => {
      result.current.action(makeFormData({ defaultBoardName: "", description: "no", name: "x" }));
    });

    await waitFor(() => expect(result.current.fieldErrors).not.toBeNull());

    act(() => {
      result.current.reset();
    });

    expect(result.current.fieldErrors).toBeNull();
    expect(result.current.globalError).toBeNull();
  });
});
