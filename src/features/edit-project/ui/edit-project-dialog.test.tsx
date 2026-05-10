import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EditProjectDialog } from "@/features/edit-project";
import { makeProject } from "@/test/factories";
import { renderWithClient } from "@/test/render";

const mocks = vi.hoisted(() => ({
  mutateAsync: vi.fn(),
}));

vi.mock("@/entities/project", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/entities/project")>();

  return {
    ...actual,
    useUpdateProject: () => ({
      isPending: false,
      mutateAsync: mocks.mutateAsync,
    }),
  };
});

describe("EditProjectDialog", () => {
  beforeEach(() => {
    mocks.mutateAsync.mockReset();
  });

  it("submits project updates", async () => {
    mocks.mutateAsync.mockResolvedValueOnce(makeProject({ name: "Updated project" }));

    renderWithClient(<EditProjectDialog open onOpenChange={vi.fn()} project={makeProject({ id: "project-1" })} />);

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Updated project" } });
    fireEvent.click(screen.getByRole("button", { name: "Save project" }));

    await waitFor(() => {
      expect(mocks.mutateAsync).toHaveBeenCalledWith({
        data: { description: "Launch project", name: "Updated project" },
        id: "project-1",
      });
    });
  });

  it("validates project input before submitting", async () => {
    renderWithClient(<EditProjectDialog open onOpenChange={vi.fn()} project={makeProject()} />);

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "x" } });
    fireEvent.click(screen.getByRole("button", { name: "Save project" }));

    expect(await screen.findByText("Too small: expected string to have >=3 characters")).toBeInTheDocument();
    expect(mocks.mutateAsync).not.toHaveBeenCalled();
  });
});
