"use client";

import { DndContext, MeasuringStrategy } from "@dnd-kit/core";
import { kanbanCollisionDetection, useProjectKanban } from "../lib";
import { KanbanOverlay } from "./kanban-overlay";
import type { ColumnsProps, RootProps } from "./kanban-types";

export const KanbanRoot = ({ children }: RootProps) => {
  const { kanbanDrag } = useProjectKanban();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <DndContext
        collisionDetection={kanbanCollisionDetection}
        measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
        onDragCancel={kanbanDrag.handleDragCancel}
        onDragEnd={kanbanDrag.handleDragEnd}
        onDragOver={kanbanDrag.handleDragOver}
        onDragStart={kanbanDrag.handleDragStart}
        sensors={kanbanDrag.sensors}
      >
        {children}
        <KanbanOverlay />
      </DndContext>
    </div>
  );
};

export const KanbanColumns = ({ children }: ColumnsProps) => {
  return <div className="flex flex-1 gap-3 p-3">{children}</div>;
};
