import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CreateBoardDialog } from "@/features/board/components/create-board-dialog";
import { renderWithClient } from "@/test/render";

describe("CreateBoardDialog", () => {
  it("updates the controlled name and submits when enabled", () => {
    const onNameChange = vi.fn();
    const onCreate = vi.fn();

    renderWithClient(
      <CreateBoardDialog
        open
        onOpenChange={vi.fn()}
        onCreate={onCreate}
        isPending={false}
        name="Doing"
        onNameChange={onNameChange}
      />,
    );

    fireEvent.change(screen.getByLabelText("Column Name"), { target: { value: "Review" } });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    expect(onNameChange).toHaveBeenCalledWith("Review");
    expect(onCreate).toHaveBeenCalledTimes(1);
  });

  it("disables submit while pending or blank", () => {
    const { rerender } = renderWithClient(
      <CreateBoardDialog
        open
        onOpenChange={vi.fn()}
        onCreate={vi.fn()}
        isPending={false}
        name=" "
        onNameChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Create" })).toBeDisabled();

    rerender(
      <CreateBoardDialog
        open
        onOpenChange={vi.fn()}
        onCreate={vi.fn()}
        isPending
        name="Doing"
        onNameChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Creating..." })).toBeDisabled();
  });
});
