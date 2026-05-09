import { beforeEach, describe, expect, it, vi } from "vitest";

const { closestCornersMock, pointerWithinMock } = vi.hoisted(() => ({
  closestCornersMock: vi.fn(),
  pointerWithinMock: vi.fn(),
}));

vi.mock("@dnd-kit/core", () => ({
  closestCorners: closestCornersMock,
  pointerWithin: pointerWithinMock,
}));

const { kanbanCollisionDetection } = await import("./kanban-dnd");

describe("kanban collision detection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("prefers task collisions under the pointer", () => {
    const columnCollision = {
      id: "column-1",
      data: { droppableContainer: { data: { current: { type: "column" } } } },
    };
    const taskCollision = {
      id: "task-1",
      data: { droppableContainer: { data: { current: { type: "task" } } } },
    };
    pointerWithinMock.mockReturnValue([columnCollision, taskCollision]);

    const result = kanbanCollisionDetection({} as never);

    expect(result).toEqual([taskCollision]);
    expect(closestCornersMock).not.toHaveBeenCalled();
  });

  it("uses pointer collisions when no task is directly hit", () => {
    const columnCollision = {
      id: "column-1",
      data: { droppableContainer: { data: { current: { type: "column" } } } },
    };
    pointerWithinMock.mockReturnValue([columnCollision]);

    expect(kanbanCollisionDetection({} as never)).toEqual([columnCollision]);
  });

  it("falls back to closest corners when there is no pointer collision", () => {
    const closestCollision = { id: "column-1" };
    pointerWithinMock.mockReturnValue([]);
    closestCornersMock.mockReturnValue([closestCollision]);

    expect(kanbanCollisionDetection({} as never)).toEqual([closestCollision]);
    expect(closestCornersMock).toHaveBeenCalledWith({});
  });
});
