import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { makeMember, makeTask } from "@/test/factories";
import { TaskDetailDialog } from "./task-detail-dialog";

describe("TaskDetailDialog", () => {
  it("renders a fallback title when no task is selected", () => {
    render(<TaskDetailDialog members={[]} onOpenChange={vi.fn()} open task={null} />);

    expect(screen.getByRole("heading", { name: "Task" })).toBeInTheDocument();
    expect(screen.queryByText("Description")).not.toBeInTheDocument();
  });

  it("renders assigned task details with formatted due date and description", () => {
    render(
      <TaskDetailDialog
        members={[
          makeMember({
            id: "member-1",
            user: { id: "user-1", name: "Ada Lovelace", email: "ada@example.com", image: null },
          }),
        ]}
        onOpenChange={vi.fn()}
        open
        task={makeTask({
          assigneeId: "member-1",
          description: "Ship the polished task view.",
          dueDate: "2026-02-03T00:00:00.000Z",
          priority: "high",
          title: "Polish task details",
        })}
      />,
    );

    expect(screen.getByRole("heading", { name: "Polish task details" })).toBeInTheDocument();
    expect(screen.getByText("high")).toBeInTheDocument();
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("Ship the polished task view.")).toBeInTheDocument();
    expect(screen.getByText(/Feb|3|2026/)).toBeInTheDocument();
  });

  it("renders empty states for unassigned tasks without due dates or descriptions", () => {
    render(
      <TaskDetailDialog
        members={[]}
        onOpenChange={vi.fn()}
        open
        task={makeTask({ assigneeId: null, description: null, dueDate: null })}
      />,
    );

    expect(screen.getByText("Unassigned")).toBeInTheDocument();
    expect(screen.getByText("No due date")).toBeInTheDocument();
    expect(screen.getByText("No description yet.")).toBeInTheDocument();
  });
});
