import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CreateBoardDialog } from "@/features/create-board";
import { renderWithClient } from "@/test/render";

const mocks = vi.hoisted(() => ({
  mutateAsync: vi.fn(),
}));

vi.mock("@/entities/board", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/entities/board")>();

  return {
    ...actual,
    useCreateBoard: () => ({
      isPending: false,
      mutateAsync: mocks.mutateAsync,
    }),
  };
});

describe("CreateBoardDialog", () => {
  beforeEach(() => {
    mocks.mutateAsync.mockReset();
  });

  it("validates and submits board creation through the form action", async () => {
    mocks.mutateAsync.mockResolvedValueOnce({});

    renderWithClient(<CreateBoardDialog open onOpenChange={vi.fn()} projectId="project-1" />);

    fireEvent.change(screen.getByLabelText("Column name"), { target: { value: "Review" } });
    fireEvent.click(screen.getByRole("button", { name: "Add column" }));

    await waitFor(() => {
      expect(mocks.mutateAsync).toHaveBeenCalledWith({
        data: { name: "Review" },
        projectId: "project-1",
      });
    });
  });

  it("shows client-side validation errors", async () => {
    renderWithClient(<CreateBoardDialog open onOpenChange={vi.fn()} projectId="project-1" />);

    fireEvent.click(screen.getByRole("button", { name: "Add column" }));

    expect(await screen.findByText("Too small: expected string to have >=1 characters")).toBeInTheDocument();
    expect(mocks.mutateAsync).not.toHaveBeenCalled();
  });
});
