import { type CollisionDetection, closestCorners, pointerWithin } from "@dnd-kit/core";

export type KanbanDroppableData = {
  type?: "board" | "task";
};

export const kanbanCollisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);

  if (pointerCollisions.length > 0) {
    const taskHits = pointerCollisions.filter(
      (collision) =>
        (collision.data?.droppableContainer?.data?.current as KanbanDroppableData | undefined)?.type === "task",
    );

    return taskHits.length > 0 ? taskHits : pointerCollisions;
  }

  return closestCorners(args);
};
