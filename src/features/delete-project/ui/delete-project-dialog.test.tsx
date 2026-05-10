import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DeleteProjectDialog } from "@/features/delete-project";
import { makeProject } from "@/test/factories";
import { renderWithClient } from "@/test/render";

const mocks = vi.hoisted(() => ({
  mutateAsync: vi.fn(),
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock("@/entities/project", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/entities/project")>();

  return {
    ...actual,
    useDeleteProject: () => ({
      isPending: false,
      mutateAsync: mocks.mutateAsync,
    }),
  };
});

describe("DeleteProjectDialog", () => {
  beforeEach(() => {
    mocks.mutateAsync.mockReset();
    mocks.push.mockReset();
  });

  it("requires the project name before deleting", async () => {
    mocks.mutateAsync.mockResolvedValueOnce({ success: true });
    renderWithClient(
      <DeleteProjectDialog open onOpenChange={vi.fn()} project={makeProject({ id: "project-1", name: "Launch" })} />,
    );

    const deleteButton = screen.getByRole("button", { name: "Delete project" });
    expect(deleteButton).toBeDisabled();
    expect(deleteButton).toHaveClass("min-w-32", "shrink-0", "whitespace-nowrap");

    fireEvent.change(screen.getByLabelText("Project name"), { target: { value: "Launch" } });
    fireEvent.click(screen.getByRole("button", { name: "Delete project" }));

    await waitFor(() => expect(mocks.mutateAsync).toHaveBeenCalledWith("project-1"));
    expect(mocks.push).toHaveBeenCalledWith("/dashboard");
  });
});
