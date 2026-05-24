import { fireEvent, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { TaskCard } from "@/entities/task";
import { makeColumn, makeMember, makeTask } from "@/test/factories";
import { renderWithClient } from "@/test/render";
import { KanbanColumnView } from "@/widgets/kanban-board";

vi.mock("@dnd-kit/core", () => ({
  useDroppable: () => ({
    setNodeRef: vi.fn(),
    isOver: false,
  }),
}));

vi.mock("@dnd-kit/sortable", () => ({
  SortableContext: ({ children }: { children: ReactNode }) => <>{children}</>,
  verticalListSortingStrategy: vi.fn(),
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: undefined,
    isDragging: false,
  }),
}));

vi.mock("@dnd-kit/utilities", () => ({
  CSS: {
    Transform: {
      toString: () => undefined,
    },
  },
}));

describe("KanbanColumnView", () => {
  it("renders column heading, task count, and tasks", () => {
    renderWithClient(
      <KanbanColumnView
        column={makeColumn({ name: "Doing" })}
        tasks={[
          makeTask({ title: "First task", priority: "urgent", assigneeId: "member-1" }),
          makeTask({ id: "task-2", title: "Second task" }),
        ]}
        members={[makeMember({ user: { id: "user-1", name: "Ada Lovelace", email: "ada@example.com", image: null } })]}
        onAddTask={vi.fn()}
        onDeleteColumn={vi.fn()}
        onDeleteTask={vi.fn()}
        onOpenTask={vi.fn()}
        isHovered={false}
      />,
    );

    expect(screen.getByRole("heading", { name: "Doing" })).toBeInTheDocument();
    expect(screen.getByText("· 2")).toBeInTheDocument();
    expect(screen.getByText("First task")).toBeInTheDocument();
    expect(screen.getByText("urgent")).toBeInTheDocument();
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("Second task")).toBeInTheDocument();
  });

  it("renders one actionable empty state for columns without tasks", () => {
    renderWithClient(
      <KanbanColumnView
        column={makeColumn()}
        tasks={[]}
        onAddTask={vi.fn()}
        onDeleteColumn={vi.fn()}
        onDeleteTask={vi.fn()}
        onOpenTask={vi.fn()}
        isHovered={false}
      />,
    );

    expect(screen.getByRole("button", { name: "Add Task" })).toBeInTheDocument();
    expect(screen.queryByText("Drop tasks here")).not.toBeInTheDocument();
  });

  it("calls the add-task callback", () => {
    const onAddTask = vi.fn();

    renderWithClient(
      <KanbanColumnView
        column={makeColumn()}
        tasks={[]}
        onAddTask={onAddTask}
        onDeleteColumn={vi.fn()}
        onDeleteTask={vi.fn()}
        onOpenTask={vi.fn()}
        isHovered={false}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Add Task" }));

    expect(onAddTask).toHaveBeenCalledTimes(1);
  });

  it("confirms before deleting a task", () => {
    const onDeleteTask = vi.fn();
    const task = makeTask({ title: "Delete carefully" });

    renderWithClient(
      <KanbanColumnView
        column={makeColumn()}
        tasks={[task]}
        onAddTask={vi.fn()}
        onDeleteColumn={vi.fn()}
        onDeleteTask={onDeleteTask}
        onOpenTask={vi.fn()}
        isHovered={false}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete task" }));

    expect(onDeleteTask).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "Delete task?" })).toBeInTheDocument();

    const confirmButtons = screen.getAllByRole("button", { name: "Delete task" });
    fireEvent.click(confirmButtons[confirmButtons.length - 1]);

    expect(onDeleteTask).toHaveBeenCalledWith(task.id);
  });

  it("confirms before deleting a column", () => {
    const onDeleteColumn = vi.fn();
    const column = makeColumn({ id: "column-1", name: "Archive" });

    renderWithClient(
      <KanbanColumnView
        column={column}
        tasks={[makeTask()]}
        onAddTask={vi.fn()}
        onDeleteColumn={onDeleteColumn}
        onDeleteTask={vi.fn()}
        onOpenTask={vi.fn()}
        isHovered={false}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Column actions" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete column" }));

    expect(onDeleteColumn).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "Delete column?" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Delete column" }));

    expect(onDeleteColumn).toHaveBeenCalledWith(column.id);
  });

  it("renames a column from the column actions menu", async () => {
    const onRenameColumn = vi.fn().mockResolvedValue(undefined);
    const column = makeColumn({ id: "column-1", name: "Doing" });

    renderWithClient(
      <KanbanColumnView
        column={column}
        tasks={[]}
        onAddTask={vi.fn()}
        onDeleteColumn={vi.fn()}
        onDeleteTask={vi.fn()}
        onOpenTask={vi.fn()}
        onRenameColumn={onRenameColumn}
        isHovered={false}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Column actions" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Rename column" }));

    expect(screen.getByRole("heading", { name: "Rename column" })).toBeInTheDocument();

    const input = screen.getByLabelText("Name");
    fireEvent.change(input, { target: { value: "  Backlog  " } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(onRenameColumn).toHaveBeenCalledWith("Backlog"));
  });
});

describe("TaskCard", () => {
  it("renders task details and fires open/delete callbacks", () => {
    const task = makeTask({ title: "Design API", priority: "high", assigneeId: "member-1" });
    const members = [makeMember({ user: { id: "user-1", name: null, email: "owner@example.com", image: null } })];
    const onDelete = vi.fn();
    const onOpen = vi.fn();

    renderWithClient(<TaskCard task={task} onOpen={onOpen} onDelete={onDelete} members={members} />);

    expect(screen.getByText("Design API")).toBeInTheDocument();
    expect(screen.getByText("high")).toBeInTheDocument();
    expect(screen.getByText("owner@example.com")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Design API/i }));
    fireEvent.click(screen.getByRole("button", { name: "Delete task" }));

    expect(onOpen).toHaveBeenCalledWith(task);
    expect(onDelete).toHaveBeenCalledWith("task-1");
  });
});
