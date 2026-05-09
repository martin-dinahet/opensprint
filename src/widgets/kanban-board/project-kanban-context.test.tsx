import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeBoard, makeProjectMember, makeTask } from "@/test/factories";
import { ProjectKanbanProvider, useProjectKanban } from "./project-kanban-context";

const { deleteTaskMock, useBoardsMock, useKanbanDragMock, useMoveTaskMock, useProjectMembersMock } = vi.hoisted(() => ({
  deleteTaskMock: { mutate: vi.fn(), isPending: false },
  useBoardsMock: vi.fn(),
  useKanbanDragMock: vi.fn(),
  useMoveTaskMock: vi.fn(),
  useProjectMembersMock: vi.fn(),
}));

vi.mock("@/entities/board", () => ({
  useBoards: useBoardsMock,
}));

vi.mock("@/entities/member", () => ({
  useProjectMembers: useProjectMembersMock,
}));

vi.mock("@/entities/task", () => ({
  useDeleteTask: () => deleteTaskMock,
  useMoveTask: useMoveTaskMock,
}));

vi.mock("./use-kanban-drag", () => ({
  useKanbanDrag: useKanbanDragMock,
}));

function Consumer() {
  const context = useProjectKanban();

  return (
    <div>
      <span data-testid="active-board">{context.activeBoardId}</span>
      <span data-testid="board-count">{context.boards?.length ?? 0}</span>
      <span data-testid="member-count">{context.members.length}</span>
      <span data-testid="loading">{String(context.isLoading)}</span>
      <span data-testid="create-board">{String(context.createBoardOpen)}</span>
      <span data-testid="create-task">{String(context.createTaskOpen)}</span>
      <span data-testid="edit-task">{context.editTask?.id ?? ""}</span>
      <button type="button" onClick={context.openCreateBoard}>
        open board
      </button>
      <button type="button" onClick={() => context.openCreateTask("board-1")}>
        open task
      </button>
      <button type="button" onClick={() => context.setCreateTaskOpen(false)}>
        close task
      </button>
      <button type="button" onClick={() => context.openEditTask(makeTask({ id: "task-1" }))}>
        edit task
      </button>
      <button type="button" onClick={() => context.removeTask("board-1", "task-1")}>
        remove task
      </button>
    </div>
  );
}

describe("ProjectKanbanProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useBoardsMock.mockReturnValue({ data: [makeBoard()], isLoading: false });
    useProjectMembersMock.mockReturnValue({ data: [makeProjectMember()] });
    useMoveTaskMock.mockReturnValue({ mutateAsync: vi.fn() });
    useKanbanDragMock.mockReturnValue({
      activeTask: null,
      dragInFlight: false,
      getBoardTasks: vi.fn(),
      handleDragCancel: vi.fn(),
      handleDragEnd: vi.fn(),
      handleDragOver: vi.fn(),
      handleDragStart: vi.fn(),
      isCrossBoardDrop: false,
      overBoardId: null,
      registerBoardTasks: vi.fn(),
      sensors: [],
    });
  });

  it("provides project kanban state and actions", () => {
    render(
      <ProjectKanbanProvider projectId="project-1">
        <Consumer />
      </ProjectKanbanProvider>,
    );

    expect(screen.getByTestId("board-count")).toHaveTextContent("1");
    expect(screen.getByTestId("member-count")).toHaveTextContent("1");
    expect(screen.getByTestId("loading")).toHaveTextContent("false");

    fireEvent.click(screen.getByRole("button", { name: "open board" }));
    expect(screen.getByTestId("create-board")).toHaveTextContent("true");

    fireEvent.click(screen.getByRole("button", { name: "open task" }));
    expect(screen.getByTestId("active-board")).toHaveTextContent("board-1");
    expect(screen.getByTestId("create-task")).toHaveTextContent("true");

    fireEvent.click(screen.getByRole("button", { name: "close task" }));
    expect(screen.getByTestId("active-board")).toHaveTextContent("");
    expect(screen.getByTestId("create-task")).toHaveTextContent("false");

    fireEvent.click(screen.getByRole("button", { name: "edit task" }));
    expect(screen.getByTestId("edit-task")).toHaveTextContent("task-1");

    fireEvent.click(screen.getByRole("button", { name: "remove task" }));
    expect(deleteTaskMock.mutate).toHaveBeenCalledWith({ boardId: "board-1", taskId: "task-1" });
  });

  it("requires consumers to be rendered inside the provider", () => {
    function BrokenConsumer() {
      useProjectKanban();
      return null;
    }

    expect(() => render(<BrokenConsumer />)).toThrow("useProjectKanban must be used within ProjectKanbanProvider");
  });
});
