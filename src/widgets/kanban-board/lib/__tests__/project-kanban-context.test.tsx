import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeColumn, makeProjectMember, makeTask } from "@/test/factories";
import { ProjectKanbanProvider, useProjectKanban } from "../project-kanban-context";

const {
  deleteColumnMock,
  deleteTaskMock,
  useColumnsMock,
  useKanbanDragMock,
  useMoveTaskMock,
  useProjectMembersMock,
  useReorderTaskMock,
} = vi.hoisted(() => ({
  deleteColumnMock: { mutate: vi.fn(), isPending: false },
  deleteTaskMock: { mutate: vi.fn(), isPending: false },
  useColumnsMock: vi.fn(),
  useKanbanDragMock: vi.fn(),
  useMoveTaskMock: vi.fn(),
  useProjectMembersMock: vi.fn(),
  useReorderTaskMock: vi.fn(),
}));

vi.mock("@/entities/column", () => ({
  useColumns: useColumnsMock,
  useDeleteColumn: () => deleteColumnMock,
}));

vi.mock("@/entities/member", () => ({
  useProjectMembers: useProjectMembersMock,
}));

vi.mock("@/entities/task", () => ({
  useDeleteTask: () => deleteTaskMock,
  useMoveTask: useMoveTaskMock,
  useReorderTask: useReorderTaskMock,
}));

vi.mock("../use-kanban-drag", () => ({
  useKanbanDrag: useKanbanDragMock,
}));

function Consumer() {
  const context = useProjectKanban();

  return (
    <div>
      <span data-testid="active-board">{context.activeColumnId}</span>
      <span data-testid="column-count">{context.columns?.length ?? 0}</span>
      <span data-testid="member-count">{context.members.length}</span>
      <span data-testid="loading">{String(context.isLoading)}</span>
      <span data-testid="create-column">{String(context.createColumnOpen)}</span>
      <span data-testid="create-task">{String(context.createTaskOpen)}</span>
      <span data-testid="edit-task">{context.editTask?.id ?? ""}</span>
      <span data-testid="view-task">{context.viewTask?.id ?? ""}</span>
      <button type="button" onClick={context.openCreateColumn}>
        open column
      </button>
      <button type="button" onClick={() => context.openCreateTask("column-1")}>
        open task
      </button>
      <button type="button" onClick={() => context.setCreateTaskOpen(false)}>
        close task
      </button>
      <button type="button" onClick={() => context.openEditTask(makeTask({ id: "task-1" }))}>
        edit task
      </button>
      <button type="button" onClick={() => context.openViewTask(makeTask({ id: "task-2" }))}>
        view task
      </button>
      <button type="button" onClick={() => context.removeColumn("column-1")}>
        remove column
      </button>
      <button type="button" onClick={() => context.removeTask("column-1", "task-1")}>
        remove task
      </button>
    </div>
  );
}

describe("ProjectKanbanProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useColumnsMock.mockReturnValue({ data: [makeColumn()], isLoading: false });
    useProjectMembersMock.mockReturnValue({ data: [makeProjectMember()] });
    useMoveTaskMock.mockReturnValue({ mutateAsync: vi.fn() });
    useReorderTaskMock.mockReturnValue({ mutateAsync: vi.fn() });
    useKanbanDragMock.mockReturnValue({
      activeTask: null,
      dragInFlight: false,
      getColumnTasks: vi.fn(),
      handleDragCancel: vi.fn(),
      handleDragEnd: vi.fn(),
      handleDragOver: vi.fn(),
      handleDragStart: vi.fn(),
      isCrossBoardDrop: false,
      overColumnId: null,
      registerColumnTasks: vi.fn(),
      sensors: [],
    });
  });

  it("provides project kanban state and actions", () => {
    render(
      <ProjectKanbanProvider boardId="board-1" projectId="project-1">
        <Consumer />
      </ProjectKanbanProvider>,
    );

    expect(screen.getByTestId("column-count")).toHaveTextContent("1");
    expect(screen.getByTestId("member-count")).toHaveTextContent("1");
    expect(screen.getByTestId("loading")).toHaveTextContent("false");

    fireEvent.click(screen.getByRole("button", { name: "open column" }));
    expect(screen.getByTestId("create-column")).toHaveTextContent("true");

    fireEvent.click(screen.getByRole("button", { name: "open task" }));
    expect(screen.getByTestId("active-board")).toHaveTextContent("column-1");
    expect(screen.getByTestId("create-task")).toHaveTextContent("true");

    fireEvent.click(screen.getByRole("button", { name: "close task" }));
    expect(screen.getByTestId("active-board")).toHaveTextContent("");
    expect(screen.getByTestId("create-task")).toHaveTextContent("false");

    fireEvent.click(screen.getByRole("button", { name: "edit task" }));
    expect(screen.getByTestId("edit-task")).toHaveTextContent("task-1");

    fireEvent.click(screen.getByRole("button", { name: "view task" }));
    expect(screen.getByTestId("view-task")).toHaveTextContent("task-2");

    fireEvent.click(screen.getByRole("button", { name: "remove column" }));
    expect(deleteColumnMock.mutate).toHaveBeenCalledWith({ boardId: "board-1", columnId: "column-1" });

    fireEvent.click(screen.getByRole("button", { name: "remove task" }));
    expect(deleteTaskMock.mutate).toHaveBeenCalledWith({ columnId: "column-1", taskId: "task-1" });
  });

  it("requires consumers to be rendered inside the provider", () => {
    function BrokenConsumer() {
      useProjectKanban();
      return null;
    }

    expect(() => render(<BrokenConsumer />)).toThrow("useProjectKanban must be used within ProjectKanbanProvider");
  });
});
