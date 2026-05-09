import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useTasks } from "@/entities/task";
import { makeBoard, makeTask } from "@/test/factories";
import { useProjectKanban } from "../../lib/project-kanban-context";
import { BoardColumn } from "../board-column";

const { kanbanColumnMock, useProjectKanbanMock, useTasksMock } = vi.hoisted(() => ({
  kanbanColumnMock: vi.fn(() => null),
  useProjectKanbanMock: vi.fn(),
  useTasksMock: vi.fn(),
}));

vi.mock("@/entities/task", () => ({
  useTasks: useTasksMock,
}));

vi.mock("../../lib/project-kanban-context", () => ({
  useProjectKanban: useProjectKanbanMock,
}));

vi.mock("../kanban", () => ({
  Kanban: {
    Column: kanbanColumnMock,
  },
}));

describe("BoardColumn", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("registers server tasks and renders the kanban column", () => {
    const board = makeBoard();
    const tasks = [makeTask()];
    const registerBoardTasks = vi.fn();
    vi.mocked(useTasks).mockReturnValue({ data: tasks } as never);
    vi.mocked(useProjectKanban).mockReturnValue({
      kanbanDrag: {
        dragInFlight: false,
        getBoardTasks: vi.fn(),
        overBoardId: board.id,
        registerBoardTasks,
      },
    } as never);

    render(<BoardColumn board={board} />);

    expect(registerBoardTasks).toHaveBeenCalledWith(board.id, tasks);
    expect(kanbanColumnMock).toHaveBeenCalledWith(
      expect.objectContaining({ board, isHovered: true, tasks }),
      undefined,
    );
  });

  it("renders optimistic drag tasks while a drag is in flight", () => {
    const board = makeBoard();
    const optimisticTasks = [makeTask({ id: "task-optimistic" })];
    vi.mocked(useTasks).mockReturnValue({ data: [makeTask()] } as never);
    vi.mocked(useProjectKanban).mockReturnValue({
      kanbanDrag: {
        dragInFlight: true,
        getBoardTasks: vi.fn(() => optimisticTasks),
        overBoardId: null,
        registerBoardTasks: vi.fn(),
      },
    } as never);

    render(<BoardColumn board={board} />);

    expect(kanbanColumnMock).toHaveBeenCalledWith(
      expect.objectContaining({ board, isHovered: false, tasks: optimisticTasks }),
      undefined,
    );
  });
});
