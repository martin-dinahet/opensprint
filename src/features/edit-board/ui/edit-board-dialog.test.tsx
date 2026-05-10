import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EditBoardDialog } from "@/features/edit-board";
import { makeBoard } from "@/test/factories";
import { renderWithClient } from "@/test/render";

const mocks = vi.hoisted(() => ({
  mutateAsync: vi.fn(),
}));

vi.mock("@/entities/board", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/entities/board")>();

  return {
    ...actual,
    useUpdateBoard: () => ({
      isPending: false,
      mutateAsync: mocks.mutateAsync,
    }),
  };
});

describe("EditBoardDialog", () => {
  beforeEach(() => {
    mocks.mutateAsync.mockReset();
  });

  it("submits board updates", async () => {
    mocks.mutateAsync.mockResolvedValueOnce(makeBoard({ name: "Delivery" }));

    renderWithClient(<EditBoardDialog open onOpenChange={vi.fn()} board={makeBoard({ id: "board-1" })} />);

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Delivery" } });
    fireEvent.click(screen.getByRole("button", { name: "Save board" }));

    await waitFor(() => {
      expect(mocks.mutateAsync).toHaveBeenCalledWith({
        boardId: "board-1",
        data: { description: undefined, name: "Delivery" },
        projectId: "project-1",
      });
    });
  });
});
