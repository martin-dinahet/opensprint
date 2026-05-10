import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeColumn, makeTask } from "@/test/factories";
import { useKanbanDrag } from "../use-kanban-drag";

vi.mock("@dnd-kit/core", () => ({
  KeyboardSensor: vi.fn(),
  PointerSensor: vi.fn(),
  useSensor: vi.fn((sensor, options) => ({ sensor, options })),
  useSensors: vi.fn((...sensors) => sensors),
}));

vi.mock("@dnd-kit/sortable", () => ({
  arrayMove: vi.fn((items: unknown[], from: number, to: number) => {
    const next = [...items];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    return next;
  }),
  sortableKeyboardCoordinates: vi.fn(),
}));

const todo = makeColumn({ id: "board-1", name: "Todo" });
const doing = makeColumn({ id: "board-2", name: "Doing" });
const taskOne = makeTask({ id: "task-1", columnId: todo.id, position: 0 });
const taskTwo = makeTask({ id: "task-2", columnId: todo.id, position: 1 });
const taskThree = makeTask({ id: "task-3", columnId: doing.id, position: 0 });

function taskEvent(id: string, task = taskOne) {
  return {
    id,
    data: { current: { type: "task", task } },
  };
}

function columnEvent(column = doing) {
  return {
    id: column.id,
    data: { current: { type: "column", column } },
  };
}

describe("useKanbanDrag", () => {
  const setup = () => ({
    moveTask: { mutateAsync: vi.fn().mockResolvedValue({ id: taskOne.id }) },
    reorderTask: { mutateAsync: vi.fn().mockResolvedValue({ id: taskOne.id }) },
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("registers board tasks and exposes configured sensors", () => {
    const { moveTask, reorderTask } = setup();
    const { result } = renderHook(() => useKanbanDrag(moveTask as never, reorderTask as never));

    act(() => {
      result.current.registerColumnTasks(todo.id, [taskOne]);
    });

    expect(result.current.getColumnTasks(todo.id)).toEqual([taskOne]);
    expect(result.current.getColumnTasks("unknown-board")).toEqual([]);
    expect(result.current.sensors).toHaveLength(2);
  });

  it("starts and cancels task dragging", () => {
    const { moveTask, reorderTask } = setup();
    const { result } = renderHook(() => useKanbanDrag(moveTask as never, reorderTask as never));

    act(() => {
      result.current.registerColumnTasks(todo.id, [taskOne]);
      result.current.handleDragStart({ active: taskEvent(taskOne.id) } as never);
    });

    expect(result.current.activeTask).toEqual(taskOne);
    expect(result.current.dragInFlight).toBe(true);

    act(() => {
      result.current.handleDragCancel();
    });

    expect(result.current.activeTask).toBeNull();
    expect(result.current.dragInFlight).toBe(false);
  });

  it("reorders tasks optimistically within a board while hovering", () => {
    const { moveTask, reorderTask } = setup();
    const { result } = renderHook(() => useKanbanDrag(moveTask as never, reorderTask as never));

    act(() => {
      result.current.registerColumnTasks(todo.id, [taskOne, taskTwo]);
      result.current.handleDragStart({ active: taskEvent(taskOne.id) } as never);
      result.current.handleDragOver({
        active: taskEvent(taskOne.id),
        over: taskEvent(taskTwo.id, taskTwo),
      } as never);
    });

    expect(result.current.overColumnId).toBe(todo.id);
    expect(result.current.isCrossColumnDrop).toBe(false);
    expect(result.current.getColumnTasks(todo.id).map((task) => task.id)).toEqual(["task-2", "task-1"]);
  });

  it("moves tasks optimistically across boards while hovering", () => {
    const { moveTask, reorderTask } = setup();
    const { result } = renderHook(() => useKanbanDrag(moveTask as never, reorderTask as never));

    act(() => {
      result.current.registerColumnTasks(todo.id, [taskOne, taskTwo]);
      result.current.registerColumnTasks(doing.id, [taskThree]);
      result.current.handleDragStart({ active: taskEvent(taskOne.id) } as never);
      result.current.handleDragOver({
        active: taskEvent(taskOne.id),
        over: columnEvent(doing),
      } as never);
    });

    expect(result.current.overColumnId).toBe(doing.id);
    expect(result.current.isCrossColumnDrop).toBe(true);
    expect(result.current.getColumnTasks(todo.id).map((task) => task.id)).toEqual(["task-2"]);
    expect(result.current.getColumnTasks(doing.id).map((task) => task.id)).toEqual(["task-3", "task-1"]);
  });

  it("clears hover state when dragging over no target or an unknown target", () => {
    const { moveTask, reorderTask } = setup();
    const { result } = renderHook(() => useKanbanDrag(moveTask as never, reorderTask as never));

    act(() => {
      result.current.registerColumnTasks(todo.id, [taskOne]);
      result.current.handleDragStart({ active: taskEvent(taskOne.id) } as never);
      result.current.handleDragOver({ active: taskEvent(taskOne.id), over: columnEvent(doing) } as never);
    });
    expect(result.current.overColumnId).toBe(doing.id);

    act(() => {
      result.current.handleDragOver({ active: taskEvent(taskOne.id), over: null } as never);
    });
    expect(result.current.overColumnId).toBeNull();
    expect(result.current.isCrossColumnDrop).toBe(false);

    act(() => {
      result.current.handleDragOver({
        active: taskEvent(taskOne.id),
        over: { id: "nowhere", data: { current: { type: "task" } } },
      } as never);
    });
    expect(result.current.overColumnId).toBeNull();
  });

  it("persists cross-board drops and resets after the mutation resolves", async () => {
    const { moveTask, reorderTask } = setup();
    const { result } = renderHook(() => useKanbanDrag(moveTask as never, reorderTask as never));

    act(() => {
      result.current.registerColumnTasks(todo.id, [taskOne]);
      result.current.registerColumnTasks(doing.id, [taskThree]);
      result.current.handleDragStart({ active: taskEvent(taskOne.id) } as never);
    });

    act(() => {
      result.current.handleDragEnd({
        active: taskEvent(taskOne.id),
        over: columnEvent(doing),
      } as never);
    });

    expect(moveTask.mutateAsync).toHaveBeenCalledWith({
      data: { columnId: doing.id, position: 1 },
      task: { ...taskOne, columnId: doing.id },
      taskId: taskOne.id,
    });

    await waitFor(() => expect(result.current.dragInFlight).toBe(false));
    expect(result.current.activeTask).toBeNull();
    expect(result.current.isCrossColumnDrop).toBe(false);
  });

  it("persists same-board reorder and resets after the mutation resolves", async () => {
    const { moveTask, reorderTask } = setup();
    const { result } = renderHook(() => useKanbanDrag(moveTask as never, reorderTask as never));

    act(() => {
      result.current.registerColumnTasks(todo.id, [taskOne]);
      result.current.handleDragStart({ active: taskEvent(taskOne.id) } as never);
    });

    act(() => {
      result.current.handleDragEnd({ active: taskEvent(taskOne.id), over: null } as never);
    });

    expect(result.current.dragInFlight).toBe(false);

    act(() => {
      result.current.registerColumnTasks(todo.id, [taskOne, taskTwo]);
      result.current.handleDragStart({ active: taskEvent(taskOne.id) } as never);
      result.current.handleDragOver({
        active: taskEvent(taskOne.id),
        over: taskEvent(taskTwo.id, taskTwo),
      } as never);
    });

    act(() => {
      result.current.handleDragEnd({
        active: taskEvent(taskOne.id),
        over: taskEvent(taskTwo.id, taskTwo),
      } as never);
    });

    expect(moveTask.mutateAsync).not.toHaveBeenCalled();
    expect(reorderTask.mutateAsync).toHaveBeenCalledWith({ taskId: taskOne.id, position: 1 });
    await waitFor(() => expect(result.current.dragInFlight).toBe(false));
  });

  it("resets without mutating when a drop is cancelled", () => {
    const { moveTask, reorderTask } = setup();
    const { result } = renderHook(() => useKanbanDrag(moveTask as never, reorderTask as never));

    act(() => {
      result.current.registerColumnTasks(todo.id, [taskOne]);
      result.current.handleDragStart({ active: taskEvent(taskOne.id) } as never);
    });

    act(() => {
      result.current.handleDragEnd({ active: taskEvent(taskOne.id), over: null } as never);
    });

    expect(moveTask.mutateAsync).not.toHaveBeenCalled();
    expect(reorderTask.mutateAsync).not.toHaveBeenCalled();
    expect(result.current.dragInFlight).toBe(false);
  });
});
