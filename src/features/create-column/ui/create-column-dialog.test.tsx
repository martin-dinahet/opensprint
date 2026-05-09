import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CreateColumnDialog } from "@/features/create-column";
import { renderWithClient } from "@/test/render";

const mocks = vi.hoisted(() => ({
  mutateAsync: vi.fn(),
}));

vi.mock("@/entities/column", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/entities/column")>();

  return {
    ...actual,
    useCreateColumn: () => ({
      isPending: false,
      mutateAsync: mocks.mutateAsync,
    }),
  };
});

describe("CreateColumnDialog", () => {
  beforeEach(() => {
    mocks.mutateAsync.mockReset();
  });

  it("validates and submits column creation through the form action", async () => {
    mocks.mutateAsync.mockResolvedValueOnce({});

    renderWithClient(<CreateColumnDialog open onOpenChange={vi.fn()} boardId="board-1" />);

    fireEvent.change(screen.getByLabelText("Column name"), { target: { value: "Review" } });
    fireEvent.click(screen.getByRole("button", { name: "Add column" }));

    await waitFor(() => {
      expect(mocks.mutateAsync).toHaveBeenCalledWith({
        boardId: "board-1",
        data: { name: "Review" },
      });
    });
  });

  it("shows client-side validation errors", async () => {
    renderWithClient(<CreateColumnDialog open onOpenChange={vi.fn()} boardId="board-1" />);

    fireEvent.click(screen.getByRole("button", { name: "Add column" }));

    expect(await screen.findByText("Too small: expected string to have >=1 characters")).toBeInTheDocument();
    expect(mocks.mutateAsync).not.toHaveBeenCalled();
  });
});
