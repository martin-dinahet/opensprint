import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DeleteBoardDialog } from "@/features/delete-board";
import { makeBoard } from "@/test/factories";
import { renderWithClient } from "@/test/render";

const mocks = vi.hoisted(() => ({
  mutateAsync: vi.fn(),
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock("@/entities/board", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/entities/board")>();

  return {
    ...actual,
    useDeleteBoard: () => ({
      isPending: false,
      mutateAsync: mocks.mutateAsync,
    }),
  };
});

describe("DeleteBoardDialog", () => {
  beforeEach(() => {
    mocks.mutateAsync.mockReset();
    mocks.push.mockReset();
  });

  it("confirms board deletion and redirects when requested", async () => {
    mocks.mutateAsync.mockResolvedValueOnce({ success: true });

    renderWithClient(<DeleteBoardDialog open onOpenChange={vi.fn()} board={makeBoard()} redirectToProject />);

    fireEvent.click(screen.getByRole("button", { name: "Delete board" }));

    await waitFor(() => {
      expect(mocks.mutateAsync).toHaveBeenCalledWith({ boardId: "board-1", projectId: "project-1" });
    });
    expect(mocks.push).toHaveBeenCalledWith("/projects/project-1");
  });
});
