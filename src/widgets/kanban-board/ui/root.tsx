"use client";

import { DndContext, MeasuringStrategy } from "@dnd-kit/core";
import { kanbanCollisionDetection } from "@/entities/column/lib/kanban-dnd";
import { useProjectKanban } from "../lib/project-kanban-context";
import { Overlay } from "./overlay";
import type { ColumnsProps, RootProps } from "./types";

export const Root = ({ children }: RootProps) => {
  const { kanbanDrag } = useProjectKanban();

  return (
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
      <Overlay />
    </DndContext>
  );
};

export const Columns = ({ children }: ColumnsProps) => {
  return <div className="flex h-full gap-3 p-4">{children}</div>;
};
