import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CreateTaskDialog } from "@/features/task/components/create-task-dialog";
import { EditTaskDialog } from "@/features/task/components/edit-task-dialog";
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

    renderWithClient(
      <CreateTaskDialog
        assigneeId={null}
        description=""
        isPending={false}
        members={members}
        onAssigneeChange={vi.fn()}
        onCreate={vi.fn()}
        onDescriptionChange={vi.fn()}
        onOpenChange={vi.fn()}
        onPriorityChange={vi.fn()}
        onTitleChange={vi.fn()}
        open
        priority="medium"
        title=""
      />,
    );

    await user.click(screen.getByLabelText("Assignee"));

    expect(screen.getAllByText("Unassigned").length).toBeGreaterThan(0);
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("grace@example.com")).toBeInTheDocument();
  });

  it("shows the selected assignee label instead of the raw value", () => {
    const members = [
      makeProjectMember({
        id: "member-1",
        user: { id: "user-1", name: "Ada Lovelace", email: "ada@example.com", image: null },
      }),
    ];

    renderWithClient(
      <CreateTaskDialog
        assigneeId="member-1"
        description=""
        isPending={false}
        members={members}
        onAssigneeChange={vi.fn()}
        onCreate={vi.fn()}
        onDescriptionChange={vi.fn()}
        onOpenChange={vi.fn()}
        onPriorityChange={vi.fn()}
        onTitleChange={vi.fn()}
        open
        priority="medium"
        title=""
      />,
    );

    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.queryByText("member-1")).not.toBeInTheDocument();
  });

  it("changes the task assignee when editing a task", async () => {
    const user = userEvent.setup();
    const onTaskChange = vi.fn();
    const task = makeTask({ assigneeId: null });
    const members = [
      makeProjectMember({
        id: "member-1",
        user: { id: "user-1", name: "Ada Lovelace", email: "ada@example.com", image: null },
      }),
    ];

    renderWithClient(
      <EditTaskDialog
        members={members}
        onOpenChange={vi.fn()}
        onSave={vi.fn()}
        onTaskChange={onTaskChange}
        open
        task={task}
      />,
    );

    await user.click(screen.getByLabelText("Assignee"));
    await user.keyboard("{ArrowDown}{ArrowDown}{Enter}");

    expect(onTaskChange).toHaveBeenCalledWith({ ...task, assigneeId: "member-1" });
  });
});
