import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useTasks } from "@/entities/task";
import { makeColumn, makeTask } from "@/test/factories";
import { useProjectKanban } from "../../lib/project-kanban-context";
import { KanbanColumn } from "../kanban-column";

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

describe("KanbanColumn", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("registers server tasks and renders the kanban column", () => {
    const column = makeColumn();
    const tasks = [makeTask()];
    const registerColumnTasks = vi.fn();
    vi.mocked(useTasks).mockReturnValue({ data: tasks } as never);
    vi.mocked(useProjectKanban).mockReturnValue({
      kanbanDrag: {
        dragInFlight: false,
        getColumnTasks: vi.fn(),
        overColumnId: column.id,
        registerColumnTasks,
      },
    } as never);

    render(<KanbanColumn column={column} />);

    expect(registerColumnTasks).toHaveBeenCalledWith(column.id, tasks);
    expect(kanbanColumnMock).toHaveBeenCalledWith(
      expect.objectContaining({ column, isHovered: true, tasks }),
      undefined,
    );
  });

  it("renders optimistic drag tasks while a drag is in flight", () => {
    const column = makeColumn();
    const optimisticTasks = [makeTask({ id: "task-optimistic" })];
    vi.mocked(useTasks).mockReturnValue({ data: [makeTask()] } as never);
    vi.mocked(useProjectKanban).mockReturnValue({
      kanbanDrag: {
        dragInFlight: true,
        getColumnTasks: vi.fn(() => optimisticTasks),
        overColumnId: null,
        registerColumnTasks: vi.fn(),
      },
    } as never);

    render(<KanbanColumn column={column} />);

    expect(kanbanColumnMock).toHaveBeenCalledWith(
      expect.objectContaining({ column, isHovered: false, tasks: optimisticTasks }),
      undefined,
    );
  });
});
