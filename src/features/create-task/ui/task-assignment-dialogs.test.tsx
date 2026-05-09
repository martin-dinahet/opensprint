import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CreateTaskDialog } from "@/features/create-task";
import { EditTaskDialog } from "@/features/edit-task";
import { makeProjectMember, makeTask } from "@/test/factories";
import { renderWithClient } from "@/test/render";

describe("task assignment dialogs", () => {
  it("renders assignee options when creating a task", async () => {
    const user = userEvent.setup();
    const members = [
      makeProjectMember({
        id: "member-1",
        user: { id: "user-1", name: "Ada Lovelace", email: "ada@example.com", image: null },
      }),
      makeProjectMember({
        id: "member-2",
        userId: "user-2",
        user: { id: "user-2", name: null, email: "grace@example.com", image: null },
      }),
    ];

    renderWithClient(<CreateTaskDialog boardId="board-1" members={members} onOpenChange={vi.fn()} open />);

    await user.click(screen.getByLabelText("Assignee"));

    expect(screen.getAllByText("Unassigned").length).toBeGreaterThan(0);
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("grace@example.com")).toBeInTheDocument();
  });

  it("shows the selected assignee label instead of the raw value when editing", () => {
    const members = [
      makeProjectMember({
        id: "member-1",
        user: { id: "user-1", name: "Ada Lovelace", email: "ada@example.com", image: null },
      }),
    ];

    renderWithClient(
      <EditTaskDialog members={members} onOpenChange={vi.fn()} open task={makeTask({ assigneeId: "member-1" })} />,
    );

    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.queryByText("member-1")).not.toBeInTheDocument();
  });

  it("changes the task assignee when editing a task", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const task = makeTask({ assigneeId: null });
    const members = [
      makeProjectMember({
        id: "member-1",
        user: { id: "user-1", name: "Ada Lovelace", email: "ada@example.com", image: null },
      }),
    ];

    renderWithClient(<EditTaskDialog members={members} onOpenChange={vi.fn()} open task={task} />);

    await user.click(screen.getByLabelText("Assignee"));
    await user.click(await screen.findByText("Ada Lovelace"));

    expect(document.querySelector<HTMLInputElement>('input[name="assigneeId"]')?.value).toBe("member-1");
  });
});
