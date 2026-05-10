"use client";

import { DragOverlay } from "@dnd-kit/core";
import { TaskCardContent } from "@/entities/task";
import { useProjectKanban } from "../lib/project-kanban-context";

export const Overlay = () => {
  const { kanbanDrag, members } = useProjectKanban();

  return (
    <DragOverlay
      dropAnimation={
        kanbanDrag.isCrossBoardDrop
          ? null
          : {
              duration: 180,
              easing: "cubic-bezier(0.2, 0, 0, 1)",
            }
      }
    >
      {kanbanDrag.activeTask ? (
        <TaskCardContent
          isOverlay
          members={members}
          onDelete={() => {}}
          onEdit={() => {}}
          onView={() => {}}
          task={kanbanDrag.activeTask}
        />
      ) : null}
    </DragOverlay>
  );
};
