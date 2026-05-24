import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CreateColumnDialog } from "./create-column-dialog";

const { formStateMock } = vi.hoisted(() => ({
  formStateMock: {
    action: vi.fn(),
    fieldErrors: null as Record<string, string[]> | null,
    globalError: null as string | null,
    pending: false,
    reset: vi.fn(),
  },
}));

vi.mock("../model/use-create-column-form", () => ({
  useCreateColumnForm: vi.fn(() => formStateMock),
}));

describe("CreateColumnDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    formStateMock.fieldErrors = null;
    formStateMock.globalError = null;
    formStateMock.pending = false;
  });

  it("renders validation and global errors", () => {
    formStateMock.fieldErrors = { name: ["Column name is required"] };
    formStateMock.globalError = "Unable to create column";

    render(<CreateColumnDialog boardId="board-1" open onOpenChange={vi.fn()} projectId="project-1" />);

    expect(screen.getByText("Unable to create column")).toBeInTheDocument();
    expect(screen.getByText("Column name is required")).toBeInTheDocument();
    expect(screen.getByLabelText("Column name")).toHaveAttribute("aria-invalid", "true");
  });

  it("submits through the form action and disables controls while pending", async () => {
    formStateMock.pending = true;

    render(<CreateColumnDialog boardId="board-1" open onOpenChange={vi.fn()} projectId="project-1" />);

    fireEvent.submit(screen.getByRole("button", { name: "Creating..." }).closest("form") as HTMLFormElement);

    await waitFor(() => expect(formStateMock.action).toHaveBeenCalled());
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Creating..." })).toBeDisabled();
  });

  it("resets local form state when the dialog closes", () => {
    const onOpenChange = vi.fn();

    render(<CreateColumnDialog boardId="board-1" open onOpenChange={onOpenChange} projectId="project-1" />);

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
