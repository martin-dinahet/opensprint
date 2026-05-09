import { fireEvent, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { TaskCard } from "@/entities/task";
import { makeBoard, makeProjectMember, makeTask } from "@/test/factories";
import { renderWithClient } from "@/test/render";
import { KanbanBoard } from "@/widgets/kanban-board";

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

describe("KanbanBoard", () => {
  it("renders board heading, task count, and tasks", () => {
    renderWithClient(
      <KanbanBoard
        board={makeBoard({ name: "Doing" })}
        tasks={[
          makeTask({ title: "First task", priority: "urgent", assigneeId: "member-1" }),
          makeTask({ id: "task-2", title: "Second task" }),
        ]}
        members={[
          makeProjectMember({ user: { id: "user-1", name: "Ada Lovelace", email: "ada@example.com", image: null } }),
        ]}
        onAddTask={vi.fn()}
        onEditTask={vi.fn()}
        onDeleteTask={vi.fn()}
        isHovered={false}
      />,
    );

    expect(screen.getByRole("heading", { name: "Doing" })).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("First task")).toBeInTheDocument();
    expect(screen.getByText("urgent")).toBeInTheDocument();
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("Second task")).toBeInTheDocument();
  });

  it("renders an empty-state drop target for boards without tasks", () => {
    renderWithClient(
      <KanbanBoard
        board={makeBoard()}
        tasks={[]}
        onAddTask={vi.fn()}
        onEditTask={vi.fn()}
        onDeleteTask={vi.fn()}
        isHovered={false}
      />,
    );

    expect(screen.getByText("Drop tasks here")).toBeInTheDocument();
  });

  it("calls the add-task callback", () => {
    const onAddTask = vi.fn();

    renderWithClient(
      <KanbanBoard
        board={makeBoard()}
        tasks={[]}
        onAddTask={onAddTask}
        onEditTask={vi.fn()}
        onDeleteTask={vi.fn()}
        isHovered={false}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Add first task" }));

    expect(onAddTask).toHaveBeenCalledTimes(1);
  });

  it("confirms before deleting a task", () => {
    const onDeleteTask = vi.fn();
    const task = makeTask({ title: "Delete carefully" });

    renderWithClient(
      <KanbanBoard
        board={makeBoard()}
        tasks={[task]}
        onAddTask={vi.fn()}
        onEditTask={vi.fn()}
        onDeleteTask={onDeleteTask}
        isHovered={false}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(onDeleteTask).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "Delete task?" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Delete task" }));

    expect(onDeleteTask).toHaveBeenCalledWith(task.id);
  });
});

describe("TaskCard", () => {
  it("renders task details and fires edit/delete callbacks", () => {
    const task = makeTask({ title: "Design API", priority: "high", assigneeId: "member-1" });
    const members = [
      makeProjectMember({ user: { id: "user-1", name: null, email: "owner@example.com", image: null } }),
    ];
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    renderWithClient(<TaskCard task={task} onEdit={onEdit} onDelete={onDelete} members={members} />);

    expect(screen.getByText("Design API")).toBeInTheDocument();
    expect(screen.getByText("high")).toBeInTheDocument();
    expect(screen.getByText("owner@example.com")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(onEdit).toHaveBeenCalledWith(task);
    expect(onDelete).toHaveBeenCalledWith("task-1");
  });
});
